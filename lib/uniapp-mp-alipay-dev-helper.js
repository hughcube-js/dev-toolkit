/**
 * UniApp 支付宝小程序开发助手
 */

const fs = require('fs')
const path = require('path')
const JSON5 = require('json5')

class UniappMpAlipayDevHelper {
    constructor() {
        this.parseArgs()
        this.initPaths()
        this.initConfig()
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

        const getBooleanArg = (flags, defaultValue = null) => {
            for (const flag of flags) {
                const index = args.findIndex(arg => arg === flag)
                if (index !== -1) {
                    const nextArg = args[index + 1]
                    if (nextArg && ['true', 'false'].includes(nextArg.toLowerCase())) {
                        return nextArg.toLowerCase() === 'true'
                    }
                    return defaultValue !== null ? defaultValue : true
                }
            }
            return defaultValue
        }

        // 解析基本参数
        this.mode = getArgValue(['--mode', '-m']) || 'dev'
        this.customDistDir = getArgValue(['--dist-dir', '-d']) || null
        this.watchMode = args.includes('--watch') || args.includes('-w')
        this.dumpPages = args.includes('--dump-pages')

        // 解析配置参数 - 核心配置默认为true，其他配置只有明确指定时才设置
        this.ignoreHttpDomainCheck = getBooleanArg(['--ignore-http'], true)
        this.ignoreWebViewDomainCheck = getBooleanArg(['--ignore-webview'], true)
        this.ignoreCertificateDomainCheck = getBooleanArg(['--ignore-certificate'], true)
        this.ignoreHttpsProtocol = getBooleanArg(['--ignore-https-protocol'], true)
        
        // 其他配置项只有明确指定时才设置
        this.minifyJS = getBooleanArg(['--minify-js'])
        this.minifyCSS = getBooleanArg(['--minify-css'])
        this.minifyWXML = getBooleanArg(['--minify-wxml'])
        this.es6 = getBooleanArg(['--es6'])
        this.postcss = getBooleanArg(['--postcss'])
        this.minified = getBooleanArg(['--minified'])

        // 解析自定义配置属性
        this.customConfig = {}
        args.forEach((arg, index) => {
            if (arg.startsWith('--custom-')) {
                const propertyName = arg.replace('--custom-', '')
                const nextArg = args[index + 1]
                if (nextArg) {
                    // 尝试解析为布尔值
                    if (['true', 'false'].includes(nextArg.toLowerCase())) {
                        this.customConfig[propertyName] = nextArg.toLowerCase() === 'true'
                    } 
                    // 尝试解析为数字
                    else if (!isNaN(nextArg)) {
                        this.customConfig[propertyName] = Number(nextArg)
                    } 
                    // 作为字符串处理
                    else {
                        this.customConfig[propertyName] = nextArg
                    }
                }
            }
        })

        // 验证必填参数
        if (!this.mode) {
            console.error('❌ 缺少构建模式参数')
            console.error('使用方法: hctoolkit-uniapp-mp-alipay-dev-helper --mode dev --watch')
            process.exit(1)
        }

        // 验证mode参数
        if (!['dev', 'build'].includes(this.mode)) {
            console.error('❌ 构建模式参数错误，只支持: dev, build')
            process.exit(1)
        }
    }

    /**
     * 显示帮助信息
     */
    showHelp() {
        console.log(`
UniApp 支付宝小程序开发助手

使用方法:
  hctoolkit-uniapp-mp-alipay-dev-helper --mode <模式> [选项]

参数:
  --mode, -m                    构建模式 (必填: dev 或 build)
  --dist-dir, -d                构建产物目录 (可选，默认根据mode自动配置)
  --ignore-http                 忽略HTTP域名检查 (可选，默认true)
  --ignore-webview              忽略WebView域名检查 (可选，默认true)
  --ignore-certificate          忽略证书域名检查 (可选，默认true)
  --ignore-https-protocol       忽略HTTPS协议检查 (可选，默认true)
  --minify-js                   压缩JS代码 (可选，仅明确指定时设置)
  --minify-css                  压缩CSS代码 (可选，仅明确指定时设置)
  --minify-wxml                 压缩WXML代码 (可选，仅明确指定时设置)
  --es6                         启用ES6转换 (可选，仅明确指定时设置)
  --postcss                     启用PostCSS处理 (可选，仅明确指定时设置)
  --minified                    启用代码压缩 (可选，仅明确指定时设置)
  --custom-<property>           自定义配置属性 (如: --custom-myProperty true)
  --dump-pages                  导出页面配置到compileMode.json
  --watch, -w                   监听模式，启动构建并监听配置文件变化
  --help, -h                    显示帮助信息

示例:
  # 开发模式 + 监听
  hctoolkit-uniapp-mp-alipay-dev-helper --mode dev --watch
  hctoolkit-uniapp-mp-alipay-dev-helper -m dev -w
  
  # 构建模式，只生成配置文件
  hctoolkit-uniapp-mp-alipay-dev-helper --mode build
  hctoolkit-uniapp-mp-alipay-dev-helper -m build -d ./custom/dist
  
  # 导出页面配置
  hctoolkit-uniapp-mp-alipay-dev-helper --mode dev --dump-pages
  
  # 自定义配置选项
  hctoolkit-uniapp-mp-alipay-dev-helper \\
    --mode dev \\
    --dist-dir ./custom/path \\
    --ignore-http false \\
    --ignore-webview true \\
    --custom-bundleAnalyzer true \\
    --custom-pluginResolution local \\
    --watch

功能:
  1. 根据模式自动配置构建产物目录
  2. 生成支付宝小程序开发所需的配置文件
  3. 支持监听模式，自动重新生成被删除的配置文件
  4. 支持所有标准配置属性和自定义配置属性
  5. 根据模式执行对应的uni构建命令 (npx uni -p mp-alipay 或 npx uni build -p mp-alipay)
  6. 支持导出页面配置到compileMode.json文件

配置文件:
  project-ide.json 生成位置: <dist-dir>/.mini-ide/project-ide.json
  compileMode.json 生成位置: <dist-dir>/.mini-ide/compileMode.json (使用 --dump-pages 时)
  核心配置 (默认启用):
    - ignoreHttpDomainCheck: 忽略HTTP域名检查
    - ignoreWebViewDomainCheck: 忽略WebView域名检查  
    - ignoreCertificateDomainCheck: 忽略证书域名检查
    - ignoreHttpsProtocol: 忽略HTTPS协议检查
  可选配置 (仅明确指定时添加):
    - minifyJS: 压缩JS代码
    - minifyCSS: 压缩CSS代码
    - minifyWXML: 压缩WXML代码
    - es6: 启用ES6转换
    - postcss: 启用PostCSS处理
    - minified: 启用代码压缩
  自定义配置:
    使用 --custom-<property> <value> 格式添加任意配置属性
`)
    }

    /**
     * 初始化路径配置
     */
    initPaths() {
        // 如果指定了自定义目录，使用自定义目录；否则根据模式自动配置
        if (this.customDistDir) {
            this.distDir = path.resolve(this.customDistDir)
        } else {
            this.distDir = path.join(process.cwd(), `dist/${this.mode}/mp-alipay`)
        }

        this.configDir = path.join(this.distDir, '/.mini-ide')
        this.configFile = path.join(this.configDir, '/project-ide.json')
        this.compileModeFile = path.join(this.configDir, '/compileMode.json')
        this.pagesConfigFile = path.join(process.cwd(), 'src/pages.json')
    }

    /**
     * 初始化配置对象
     */
    initConfig() {
        this.config = {}

        // 添加标准配置（仅当不为null时）
        if (this.ignoreHttpDomainCheck !== null) {
            this.config.ignoreHttpDomainCheck = this.ignoreHttpDomainCheck
        }
        if (this.ignoreWebViewDomainCheck !== null) {
            this.config.ignoreWebViewDomainCheck = this.ignoreWebViewDomainCheck
        }
        if (this.ignoreCertificateDomainCheck !== null) {
            this.config.ignoreCertificateDomainCheck = this.ignoreCertificateDomainCheck
        }
        if (this.ignoreHttpsProtocol !== null) {
            this.config.ignoreHttpsProtocol = this.ignoreHttpsProtocol
        }
        if (this.minifyJS !== null) {
            this.config.minifyJS = this.minifyJS
        }
        if (this.minifyCSS !== null) {
            this.config.minifyCSS = this.minifyCSS
        }
        if (this.minifyWXML !== null) {
            this.config.minifyWXML = this.minifyWXML
        }
        if (this.es6 !== null) {
            this.config.es6 = this.es6
        }
        if (this.postcss !== null) {
            this.config.postcss = this.postcss
        }
        if (this.minified !== null) {
            this.config.minified = this.minified
        }

        // 添加自定义配置
        Object.assign(this.config, this.customConfig)
    }

    /**
     * 跨平台安全启动进程
     */
    safeSpawn(command, args, options) {
        const spawn = require('child_process').spawn
        
        if (process.platform === 'win32') {
            return spawn('cmd', ['/c', command, ...args], options)
        } else {
            return spawn(command, args, options)
        }
    }

    /**
     * 读取 pages.json 文件
     */
    readPagesConfig() {
        try {
            if (!fs.existsSync(this.pagesConfigFile)) {
                console.log('⚠️  pages.json 文件不存在:', this.pagesConfigFile)
                return null
            }

            const content = fs.readFileSync(this.pagesConfigFile, 'utf8')
            
            // 使用 JSON5 解析，支持注释和尾随逗号
            const pagesConfig = JSON5.parse(content)
            
            if (!pagesConfig.pages || !Array.isArray(pagesConfig.pages)) {
                console.log('⚠️  pages.json 格式错误：缺少 pages 数组')
                return null
            }
            
            return pagesConfig
        } catch (error) {
            console.error('❌ 读取 pages.json 失败:', error.message)
            return null
        }
    }

    /**
     * 生成 compileMode.json 文件
     */
    generateCompileModeConfig() {
        try {
            const pagesConfig = this.readPagesConfig()
            if (!pagesConfig) {
                return
            }

            // 读取现有的 compileMode.json
            let existingModes = []
            if (fs.existsSync(this.compileModeFile)) {
                try {
                    const existingContent = fs.readFileSync(this.compileModeFile, 'utf8')
                    const existingConfig = JSON.parse(existingContent)
                    if (existingConfig.condition && existingConfig.condition.miniprogram && existingConfig.condition.miniprogram.list) {
                        existingModes = existingConfig.condition.miniprogram.list
                    }
                } catch (error) {
                    console.log('⚠️  读取现有 compileMode.json 失败，将创建新文件')
                }
            }

            // 生成新的模式列表
            const newModes = pagesConfig.pages.map(page => {
                const title = page.style && page.style.navigationBarTitleText 
                    ? `${page.style.navigationBarTitleText}(helper)`
                    : `${page.path}(helper)`
                
                return {
                    name: title,
                    path: page.path,
                    query: ""
                }
            })

            // 合并并去重
            const allModes = [...existingModes]
            
            newModes.forEach(newMode => {
                const exists = allModes.some(existingMode => existingMode.path === newMode.path && existingMode.name === newMode.name)
                if (!exists) {
                    allModes.push(newMode)
                }
            })

            // 生成最终配置
            const compileModeConfig = {
                condition: {
                    miniprogram: {
                        list: allModes
                    }
                }
            }

            // 写入文件
            fs.writeFileSync(this.compileModeFile, JSON.stringify(compileModeConfig, null, 2), 'utf8')
            console.log('✅ 生成 compileMode.json 文件:', this.compileModeFile)
            console.log(`   添加了 ${newModes.length} 个页面配置`)

        } catch (error) {
            console.error('❌ 生成 compileMode.json 失败:', error.message)
        }
    }

    /**
     * 生成配置文件
     */
    generateConfig() {
        try {
            // 确保目录存在
            if (!fs.existsSync(this.configDir)) {
                fs.mkdirSync(this.configDir, {recursive: true})
            }

            // 写入配置文件
            fs.writeFileSync(this.configFile, JSON.stringify(this.config, null, 2), 'utf8')
            console.log('✅ 生成支付宝小程序配置文件:', this.configFile)
            console.log('   配置内容:', this.config)

            // 如果开启了 dump-pages 选项，生成 compileMode.json
            if (this.dumpPages) {
                this.generateCompileModeConfig()
            }

        } catch (error) {
            console.error('❌ 生成配置文件失败:', error.message)
        }
    }

    /**
     * 监听dist目录变化
     */
    watchDistDir() {
        if (!fs.existsSync(this.distDir)) {
            console.log('⏳ 等待构建目录创建:', this.distDir)
            setTimeout(() => this.watchDistDir(), 1000)
            return
        }

        if (!fs.existsSync(this.configFile)) {
            this.generateConfig()
        }

        try {
            console.log('👀 开始监听配置文件变化:', this.configDir)
            
            let watcher = fs.watch(this.configDir, {recursive: true}, (eventType, filename) => {
                if (eventType === 'rename' && filename) {
                    setTimeout(() => {
                        if (fs.existsSync(this.distDir)) {
                            if (filename.includes('project-ide.json') && !fs.existsSync(this.configFile)) {
                                console.log('🔍 检测到 project-ide.json 被删除:', filename)
                                this.generateConfig()
                            }
                            if (this.dumpPages && filename.includes('compileMode.json') && !fs.existsSync(this.compileModeFile)) {
                                console.log('🔍 检测到 compileMode.json 被删除:', filename)
                                this.generateCompileModeConfig()
                            }
                        }
                    }, 500)
                }
            })

            // 进程退出时清理监听器
            const cleanup = () => {
                console.log('\n🛑 停止监听...')
                watcher?.close()
                process.exit(0)
            }

            process.on('SIGINT', cleanup)
            process.on('SIGTERM', cleanup)

        } catch (error) {
            console.error('❌ 监听目录失败:', error.message)
        }
    }

    /**
     * 启动开发模式
     */
    startDev() {
        console.log('🚀 启动 UniApp 支付宝小程序开发模式')
        console.log('============================')
        console.log('🖥️  运行平台:', process.platform)
        console.log('📱 构建模式:', this.mode)
        console.log('📂 构建目录:', this.distDir)
        console.log('⚙️  配置选项:', this.config)
        console.log('============================\n')

        // 先监听目录
        this.watchDistDir()

        // 启动uni构建 - 使用安全的跨平台方式
        const uniArgs = this.mode === 'dev' ? ['uni', '-p', 'mp-alipay'] : ['uni', 'build', '-p', 'mp-alipay']
        console.log('🔨 启动uni构建进程...')
        console.log(`   执行命令: npx ${uniArgs.join(' ')}`)
        const uniProcess = this.safeSpawn('npx', uniArgs, {
            stdio: 'inherit'
        })

        uniProcess.on('error', (error) => {
            console.error('❌ 启动uni构建失败:', error.message)
            console.error('   请确保已安装项目依赖: yarn install 或 npm install')
            console.error('   检查是否有 @dcloudio/vite-plugin-uni 依赖')
            process.exit(1)
        })

        uniProcess.on('close', (code) => {
            console.log(`\n🏁 uni构建进程退出，代码: ${code}`)
            process.exit(code)
        })
    }

    /**
     * 执行主逻辑
     */
    run() {
        try {
            if (this.watchMode) {
                this.startDev()
            } else {
                console.log('🚀 UniApp 支付宝小程序开发助手')
                console.log('============================')
                console.log('🖥️  运行平台:', process.platform)
                console.log('📱 构建模式:', this.mode)
                console.log('📂 构建目录:', this.distDir)
                console.log('⚙️  配置选项:', this.config)
                console.log('============================\n')
                
                this.generateConfig()
                
                console.log('\n✅ 配置文件生成完成！')
                if (this.mode === 'dev') {
                    console.log('💡 提示：使用 --watch 参数可以启动监听模式')
                }
            }
        } catch (error) {
            console.error('❌ 执行失败:', error.message)
            process.exit(1)
        }
    }
}

module.exports = UniappMpAlipayDevHelper; 