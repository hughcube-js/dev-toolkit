/**
 * UniApp manifest.json h5 publicPath 更新工具
 */

const fs = require('fs')
const path = require('path')

class UniappPublicPathUpdater {
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

        // 解析 publicPath 参数
        const pathIndex = args.findIndex(arg => arg === '--path' || arg === '-p')
        if (pathIndex === -1 || !args[pathIndex + 1]) {
            console.error('❌ 缺少 publicPath 参数')
            console.error('使用方法: hctoolkit-uniapp-publicpath-updater --path /your/path/')
            process.exit(1)
        }

        this.publicPath = args[pathIndex + 1]

        // 验证 publicPath 格式 - 确保以 / 结尾 (支持URL格式)
        if (!this.publicPath.endsWith('/')) {
            this.publicPath = this.publicPath + '/'
        }
    }

    /**
     * 显示帮助信息
     */
    showHelp() {
        console.log(`
UniApp manifest.json h5 publicPath 更新工具

使用方法:
  hctoolkit-uniapp-publicpath-updater --path <路径>

参数:
  --path, -p       publicPath 路径 (必填)
  --help, -h       显示帮助信息

示例:
  # 设置相对路径
  hctoolkit-uniapp-publicpath-updater --path /static/
  hctoolkit-uniapp-publicpath-updater --path /app/dist/
  hctoolkit-uniapp-publicpath-updater -p /cdn/assets/
  
  # 设置 CDN URL
  hctoolkit-uniapp-publicpath-updater --path https://cdn.example.com/app/
  hctoolkit-uniapp-publicpath-updater --path https://pcdn.x4k.net/p/ocula/h5/web/\${BUILD_NUMBER}/
  
  # 设置为根路径
  hctoolkit-uniapp-publicpath-updater --path /

功能:
  1. 更新 src/manifest.json 中的 h5.publicPath
  2. 如果不存在 h5 配置，会自动创建
  3. 支持相对路径和完整 URL (必须以 / 结尾)
  4. 使用 JSON 解析方式，确保格式正确
  5. 支持跨平台运行 (Windows, macOS, Linux)
`)
    }

    /**
     * 更新 manifest.json 文件中的 h5 publicPath
     */
    updateManifest() {
        console.log('📝 更新 manifest.json h5 publicPath...')
        console.log('   文件路径:', this.manifestPath)
        console.log('   目标路径:', this.publicPath)

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

            // 解析 JSON
            const manifest = JSON.parse(cleanContent)

            // 记录旧的 publicPath 信息
            const oldPublicPath = (manifest.h5 && manifest.h5.publicPath) ? manifest.h5.publicPath : '未设置'

            // 确保 h5 配置存在
            if (!manifest.h5) {
                manifest.h5 = {}
            }

            // 更新 publicPath
            manifest.h5.publicPath = this.publicPath

            // 将修改后的对象转换为格式化的 JSON 字符串
            const updatedContent = JSON.stringify(manifest, null, 2)

            // 写回文件
            fs.writeFileSync(this.manifestPath, updatedContent, 'utf8')

            console.log('✅ publicPath 更新成功:')
            console.log('   h5.publicPath:', oldPublicPath, '->', this.publicPath)

        } catch (error) {
            console.error('❌ 更新 manifest.json 失败:', error.message)
            process.exit(1)
        }
    }

    /**
     * 执行更新
     */
    run() {
        console.log('🚀 UniApp manifest.json h5 publicPath 更新工具')
        console.log('============================')
        console.log('🖥️  运行平台:', process.platform)
        console.log('📌 目标路径:', this.publicPath)
        console.log('============================')

        this.updateManifest()

        console.log('============================')
        console.log('✅ publicPath 更新完成！')
    }
}

module.exports = UniappPublicPathUpdater; 