/**
 * UniApp manifest.json 版本号更新工具
 */

const fs = require('fs')
const path = require('path')

class UniappVersionUpdater {
    constructor() {
        this.manifestPath = path.join(process.cwd(), 'src/manifest.json')
        this.parseArgs()
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

        // 解析版本号参数
        const versionIndex = args.findIndex(arg => arg === '--version' || arg === '-v')
        if (versionIndex === -1 || !args[versionIndex + 1]) {
            console.error('❌ 缺少版本号参数')
            console.error('使用方法: hctoolkit-uniapp-version-updater --version v1.2.3')
            console.error('支持任意位数: v1.0, v1.2.3, v1.2.3.4 等')
            process.exit(1)
        }

        this.version = args[versionIndex + 1]

        // 确保版本号有 v 前缀
        if (!this.version.startsWith('v') && !this.version.startsWith('V')) {
            this.version = 'v' + this.version
        }

        // 验证版本号格式 - 支持1到任意位数字
        const versionWithoutV = this.version.replace(/^v/i, '')
        if (!/^(\d+\.)*\d+$/.test(versionWithoutV)) {
            console.error(`❌ 版本号格式错误: ${this.version}，应为 vx.x.x... 格式（支持任意位数）`)
            process.exit(1)
        }
    }

    /**
     * 显示帮助信息
     */
    showHelp() {
        console.log(`
UniApp manifest.json 版本号更新工具

使用方法:
  hctoolkit-uniapp-version-updater --version <版本号>

参数:
  --version, -v    版本号 (必填，格式: vx.x.x...，支持任意位数)
  --help, -h       显示帮助信息

示例:
  # 基本版本号
  hctoolkit-uniapp-version-updater --version v1.0
  hctoolkit-uniapp-version-updater --version v1.2.3
  hctoolkit-uniapp-version-updater -v v2.1.0
  
  # 多位版本号
  hctoolkit-uniapp-version-updater --version v1.2.3.4
  hctoolkit-uniapp-version-updater --version v2.10.15.20.5

功能:
  1. 更新 src/manifest.json 中的 versionName
  2. 自动计算并更新 versionCode (每个版本部分占用3位数字)
     例如: v1.2.3 -> 001002003 -> 1002003
           v1.2.3.4 -> 001002003004 -> 1002003004
           v2.10.15 -> 002010015 -> 2010015
  3. 支持1到任意位数的版本号格式
  4. 每个版本号部分最大值为999
  5. 支持跨平台运行 (Windows, macOS, Linux)
`)
    }

    /**
     * 计算 versionCode
     * 将版本号转换为数字，每个版本部分占用3位数字
     * 例如: v1.2.3 -> 001002003 -> 1002003
     *       v1.2.3.4 -> 001002003004 -> 1002003004
     *       v2.10.15 -> 002010015 -> 2010015
     */
    calculateVersionCode(version) {
        // 去掉 v 前缀
        const versionWithoutV = version.replace(/^v/i, '')
        const parts = versionWithoutV.split('.')
        
        if (parts.length === 0) {
            throw new Error('版本号格式错误，至少需要一个数字')
        }

        // 验证每个部分都是有效数字且不超过999
        for (let i = 0; i < parts.length; i++) {
            const num = parseInt(parts[i])
            if (isNaN(num) || num < 0) {
                throw new Error(`版本号部分 "${parts[i]}" 不是有效的非负整数`)
            }
            if (num > 9999) {
                throw new Error(`版本号部分 ${num} 超过最大值 999（每部分最多3位数字）`)
            }
        }

        // 将每个部分转换为3位数字字符串，然后连接
        const paddedParts = parts.map(part => {
            const num = parseInt(part)
            return num.toString().padStart(3, '0')
        })

        // 连接所有部分并转换为数字
        const versionCodeStr = paddedParts.join('')
        const versionCode = parseInt(versionCodeStr)

        // 确保结果在合理范围内（避免超过JavaScript的安全整数范围）
        if (versionCode > Number.MAX_SAFE_INTEGER) {
            throw new Error('版本号过长，计算出的 versionCode 超过安全范围')
        }

        return versionCode
    }

    /**
     * 更新 manifest.json 文件中的版本信息
     */
    updateManifest() {
        console.log('📝 更新 manifest.json 版本信息...')
        console.log('   文件路径:', this.manifestPath)
        console.log('   目标版本:', this.version)

        try {
            // 检查文件是否存在
            if (!fs.existsSync(this.manifestPath)) {
                throw new Error(`manifest.json 文件不存在: ${this.manifestPath}`)
            }

            // 读取 manifest.json
            const manifestContent = fs.readFileSync(this.manifestPath, 'utf8')

            // 移除 JSON 中的注释
            let cleanContent = manifestContent.replace(/\/\/.*$/gm, '')
            cleanContent = cleanContent.replace(/\/\*[\s\S]*?\*\//g, '')

            // 解析 JSON 验证格式
            const manifest = JSON.parse(cleanContent)

            // 计算 versionCode
            const versionCode = this.calculateVersionCode(this.version)

            // 记录旧版本信息
            const oldVersionName = manifest.versionName || '未设置'
            const oldVersionCode = manifest.versionCode || '未设置'

            // 使用正则表达式直接在原文件中替换版本信息，保留注释和格式
            let updatedContent = manifestContent

            // 替换 versionName
            if (manifestContent.includes('"versionName"')) {
                updatedContent = updatedContent.replace(
                    /"versionName"\s*:\s*"[^"]*"/,
                    `"versionName": "${this.version}"`
                )
            } else {
                // 如果不存在 versionName，在第一个字段后添加
                updatedContent = updatedContent.replace(
                    /(\{[^}]*?"[^"]+"\s*:\s*"[^"]*")(\s*,)/,
                    `$1,\n  "versionName": "${this.version}"$2`
                )
            }

            // 替换 versionCode
            if (manifestContent.includes('"versionCode"')) {
                updatedContent = updatedContent.replace(
                    /"versionCode"\s*:\s*"[^"]*"/,
                    `"versionCode": "${versionCode}"`
                )
            } else {
                // 如果不存在 versionCode，在 versionName 后添加
                updatedContent = updatedContent.replace(
                    /"versionName"\s*:\s*"[^"]*"/,
                    `$&,\n  "versionCode": "${versionCode}"`
                )
            }

            // 写回文件
            fs.writeFileSync(this.manifestPath, updatedContent, 'utf8')

            console.log('✅ 版本信息更新成功:')
            console.log('   versionName:', oldVersionName, '->', this.version)
            console.log('   versionCode:', oldVersionCode, '->', versionCode)

        } catch (error) {
            console.error('❌ 更新 manifest.json 失败:', error.message)
            process.exit(1)
        }
    }

    /**
     * 执行更新
     */
    run() {
        console.log('🚀 UniApp manifest.json 版本号更新工具')
        console.log('============================')
        console.log('🖥️  运行平台:', process.platform)
        console.log('📌 目标版本:', this.version)
        console.log('============================')
        
        this.updateManifest()
        
        console.log('============================')
        console.log('✅ 版本号更新完成！')
    }
}

module.exports = UniappVersionUpdater; 