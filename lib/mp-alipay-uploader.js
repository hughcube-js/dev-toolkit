/**
 * 支付宝小程序上传工具
 */

const fs = require('fs')
const path = require('path')
const os = require('os')
const { execSync } = require('child_process')

class MpAlipayUploader {
    constructor() {
        this.parseArgs()
        this.validateConfig()

        // 构建 minidev 命令路径，使用当前 Node.js 可执行文件路径
        this.minidevPath = `"${process.execPath}" "${path.join(process.cwd(), 'node_modules/minidev/bin/minidev.js')}"`
    }

    /**
     * 解析命令行参数
     */
    parseArgs() {
        const args = process.argv.slice(2)

        if (args.includes('--help') || args.includes('-h')) {
            this.showHelp()
            process.exit(0)
        }

        // CLI 参数解析
        const getArgValue = (flags) => {
            for (const flag of flags) {
                const index = args.findIndex(arg => arg === flag)
                if (index !== -1 && args[index + 1]) {
                    return args[index + 1]
                }
            }
            return null
        }

        // 获取命令行参数
        this.appId = getArgValue(['--app-id', '-a']) || null
        this.distDir = getArgValue(['--dist-dir', '-d']) || null
        this.version = getArgValue(['--version', '-v']) || null
        this.minidevConfig = getArgValue(['--config', '-c']) || null
        this.versionDescribe = getArgValue(['--version-describe']) || null

        // 确保版本号有 v 前缀
        if (this.version && !this.version.startsWith('v') && !this.version.startsWith('V')) {
            this.version = 'v' + this.version
        }

        // 设置默认版本描述
        if (!this.versionDescribe && this.version) {
            this.versionDescribe = `版本 ${this.version} 自动上传`
        }

        // minidevConfig默认路径（仅在未设置时）
        if (!this.minidevConfig) {
            this.minidevConfig = path.join(os.homedir(), '.minidev', 'config.json')
        }
    }

    /**
     * 显示帮助信息
     */
    showHelp() {
        console.log(`
支付宝小程序上传工具

使用方法:
  hctoolkit-mp-alipay-uploader --app-id <AppID> --dist-dir <目录> --version <版本> --config <配置文件>

参数:
  --app-id, -a         小程序 APPID (必填)
  --dist-dir, -d       构建产物目录 (必填)
  --version, -v        版本号 (必填，格式: vx.x.x)
  --config, -c         minidev 配置文件路径 (必填)
  --version-describe   版本描述 (可选)
  --help, -h           显示帮助信息

示例:
  hctoolkit-mp-alipay-uploader \\
    --app-id 2021005160675311 \\
    --dist-dir ./dist/build/mp-alipay \\
    --version v1.2.3 \\
    --config ./minidev-config.json \\
    --version-describe "新版本发布"

前置条件:
  1. 安装依赖: npm install minidev
  2. 准备 minidev 配置文件，包含私钥和工具ID
  3. 确保构建产物目录存在
  4. 支持跨平台运行 (Windows, macOS, Linux)

配置文件格式 (minidev-config.json):
  {
    "alipay": {
      "authentication": {
        "privateKey": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----",
        "toolId": "your-tool-id"
      }
    }
  }
`)
    }

    /**
     * 验证配置
     */
    validateConfig() {
        const errors = []

        if (!this.appId) {
            errors.push('❌ 缺少小程序 APPID')
            errors.push('   请使用 --app-id 参数')
        }

        if (!this.distDir) {
            errors.push('❌ 缺少构建产物目录')
            errors.push('   请使用 --dist-dir 参数')
        } else if (!fs.existsSync(this.distDir)) {
            errors.push(`❌ 构建产物目录不存在: ${this.distDir}`)
        }

        if (!this.version) {
            errors.push('❌ 缺少版本号')
            errors.push('   请使用 --version 参数')
        } else {
            // 验证版本号格式（去掉v前缀后验证）
            const versionWithoutV = this.version.replace(/^v/i, '')
            if (!/^\d+\.\d+\.\d+$/.test(versionWithoutV)) {
                errors.push(`❌ 版本号格式错误: ${this.version}，应为 vx.x.x 格式`)
            }
        }

        if (!this.minidevConfig) {
            errors.push('❌ 缺少 minidev 配置文件路径')
            errors.push('   请使用 --config 参数')
        } else if (!fs.existsSync(this.minidevConfig)) {
            errors.push(`❌ minidev 配置文件不存在: ${this.minidevConfig}`)
        }

        if (errors.length > 0) {
            console.error('\n配置验证失败:')
            errors.forEach(err => console.error(err))
            console.error('\n请确保提供了所有必需参数。使用 --help 查看详细说明。\n')
            process.exit(1)
        }
    }

    /**
     * 上传小程序代码
     * @returns {Promise<boolean>}
     */
    async upload() {
        console.log('\n📤 开始上传小程序代码...')
        console.log(`   版本号: ${this.version}`)
        console.log(`   版本描述: ${this.versionDescribe}`)
        console.log(`   项目路径: ${this.distDir}`)

        try {
            // 注意：minidev 需要不带 v 的版本号
            const versionWithoutV = this.version.replace(/^v/i, '')
            const uploadCmd = `${this.minidevPath} upload --identity-key-path "${this.minidevConfig}" --app-id "${this.appId}" --project "${this.distDir}" --version "${versionWithoutV}" --version-description "${this.versionDescribe}"`
            console.log('执行命令:', uploadCmd)
            execSync(uploadCmd, { stdio: 'inherit' })
            console.log('✅ 代码上传成功')
            return true
        } catch (error) {
            console.error('❌ 代码上传失败:', error.message)
            return false
        }
    }

    /**
     * 查询版本状态
     * @returns {Promise<{found: boolean, version: string, status: string}>}
     */
    async queryVersionStatus() {
        console.log('\n🔍 查询版本状态...')

        try {
            // 注意：minidev 需要不带 v 的版本号
            const versionWithoutV = this.version.replace(/^v/i, '')
            let pageNum = 1
            let found = false
            let versionInfo = null

            console.log(`   正在查找版本 ${versionWithoutV}...`)

            // 分页查询，直到找到版本或没有更多数据
            while (!found) {
                const queryCmd = `${this.minidevPath} app get-uploaded-version-list --app-id "${this.appId}" --identity-key-path "${this.minidevConfig}" --page-num ${pageNum} --machine-output`
                console.log(`   查询第 ${pageNum} 页...`)

                let output
                try {
                    output = execSync(queryCmd, { encoding: 'utf8' })
                } catch (cmdError) {
                    console.error(`   查询第 ${pageNum} 页失败:`, cmdError.message)
                    break
                }

                // 解析JSON输出
                let versionList = []
                try {
                    const parsed = JSON.parse(output.trim())
                    versionList = Array.isArray(parsed) ? parsed : []
                } catch (parseError) {
                    console.error(`   第 ${pageNum} 页数据解析失败:`, parseError.message)
                    console.error('   原始输出:', output)
                    break
                }

                console.log(`   第 ${pageNum} 页找到 ${versionList.length} 个版本`)

                // 如果没有数据，说明已经查完了
                if (versionList.length === 0) {
                    console.log('   已查询完所有页面')
                    break
                }

                // 查找目标版本
                for (const version of versionList) {
                    if (version.appVersion === versionWithoutV) {
                        found = true
                        versionInfo = version
                        console.log(`   ✅ 在第 ${pageNum} 页找到版本 ${versionWithoutV}`)
                        break
                    }
                }

                if (pageNum > 20) {
                    console.log('   已查询20页，停止查询')
                    break
                }

                pageNum++;
            }

            if (found && versionInfo) {
                return {
                    found: true,
                    version: versionWithoutV,
                    status: versionInfo.versionStatus,
                    createTime: versionInfo.createTime,
                    description: versionInfo.versionDescription,
                    canRelease: versionInfo.canRelease
                }
            } else {
                console.error(`\n❌ 未找到版本 ${versionWithoutV}`)
                return { found: false, version: versionWithoutV, status: null }
            }
        } catch (error) {
            console.error('❌ 版本查询失败:', error.message)
            return { found: false, version: this.version.replace(/^v/i, ''), status: null, error: error.message }
        }
    }

    /**
     * 执行上传流程
     */
    async run() {
        console.log('🚀 支付宝小程序上传工具')
        console.log('============================')
        console.log('🖥️  运行平台:', process.platform)
        console.log('📱 小程序 APPID:', this.appId)
        console.log('📌 版本号:', this.version)
        console.log('📝 版本描述:', this.versionDescribe)
        console.log('🔧 配置文件:', this.minidevConfig)
        console.log('🛠 Minidev路径:', this.minidevPath)
        console.log('📂 输出目录:', this.distDir)
        console.log('============================\n')

        try {
            // 上传代码
            const uploadSuccess = await this.upload()
            if (!uploadSuccess) {
                console.log('\n🔗 请手动登录支付宝开放平台：')
                console.log('   https://open.alipay.com/dev/mini-games')
                console.error('\n❌ 上传失败，流程中止')
                process.exit(1)
            }

            // 查询验证上传结果
            console.log('\n🔍 正在验证上传结果...')
            console.log('   等待系统处理（3秒）...')
            await new Promise(resolve => setTimeout(resolve, 3000))

            const queryResult = await this.queryVersionStatus()
            if (!queryResult.found) {
                console.warn(`\n⚠️  版本验证异常：未能在平台上找到版本 ${this.version.replace(/^v/i, '')}`)
                if (queryResult.error) {
                    console.warn(`   错误信息: ${queryResult.error}`)
                }
                console.warn('   建议手动登录平台确认上传状态')
                console.log(`🔗 https://open.alipay.com/develop/mini/sub/dev-manage?appId=${this.appId}&bundleId=com.alipay.alipaywallet`)

                console.error('\n❌ 上传验证失败，流程中止')
                process.exit(1)
            }

            console.log(`\n✅ 版本验证成功！版本 ${queryResult.version} 已成功上传`)
            console.log(`📋 当前状态: ${queryResult.status}`)
            if (queryResult.createTime) console.log(`📅 创建时间: ${queryResult.createTime}`)
            if (queryResult.description) console.log(`📝 版本描述: ${queryResult.description}`)

            console.log('\n✅ 代码上传流程完成！')
            console.log('============================')
            console.log('📱 请登录支付宝小程序管理后台完成审核提交')
            console.log('🔗 https://open.alipay.com/mini/dev/list')
            console.log(`🔗 https://open.alipay.com/develop/mini/sub/dev-manage?appId=${this.appId}&bundleId=com.alipay.alipaywallet`)
            console.log('💡 由于审核需要上传版本截图，请在平台上手动完成最后的审核提交步骤')

        } catch (error) {
            console.error('❌ 执行失败:', error)
            process.exit(1)
        }
    }
}

module.exports = MpAlipayUploader; 