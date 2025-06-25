/**
 * UniApp 小程序启动首页配置工具
 */

const fs = require('fs')
const path = require('path')

class UniappHomepageConfigurator {
    constructor(options = {}) {
        this.pagesPath = options.pagesPath || path.join(process.cwd(), 'src/pages.json')
        this.appId = options.appId
        this.platform = options.platform
        this.pagePath = options.pagePath
    }

    findTargetPagePaths() {
        if (this.pagePath) {
            return [this.pagePath]
        }

        if (this.appId && this.platform) {
            return this.getMatchedPagePaths(this.appId, this.platform)
        }

        throw new Error('未能确定目标页面路径')
    }

    getMatchedPagePaths(appId, platform) {
        const normalizedPlatform = platform.toLowerCase()
        const appIdFieldName = normalizedPlatform === 'mp-weixin' ? 'wxmp_appid' : 'alimp_appid'

        const featuresPath = path.join(process.cwd(), 'src/config/features.js')
        if (!fs.existsSync(featuresPath)) {
            throw new Error(`features.js 不存在: ${featuresPath}`)
        }

        const featuresContent = fs.readFileSync(featuresPath, 'utf8')
        const cleanContent = featuresContent
            .replace(/export\s+default\s+/, '')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\/\/.*$/gm, '')

        const features = eval('(' + cleanContent + ')')
        const matchedPagePaths = []

        for (const [key, feature] of Object.entries(features)) {
            if (feature[appIdFieldName] === appId && feature.order_path) {
                matchedPagePaths.push(feature.order_path)
            }
        }

        return matchedPagePaths
    }

    updatePagesHomepage(candidatePaths) {
        if (!fs.existsSync(this.pagesPath)) {
            throw new Error(`pages.json 不存在: ${this.pagesPath}`)
        }

        const pagesContent = fs.readFileSync(this.pagesPath, 'utf8')
        let cleanContent = pagesContent.replace(/\/\/.*$/gm, '')
        cleanContent = cleanContent.replace(/\/\*[\s\S]*?\*\//g, '')

        const pagesConfig = JSON.parse(cleanContent)
        if (!pagesConfig.pages || !Array.isArray(pagesConfig.pages)) {
            throw new Error('pages.json 格式错误：缺少 pages 数组')
        }

        let targetPageIndex = -1
        let selectedPath = null

        for (const candidatePath of candidatePaths) {
            const normalizedPath = candidatePath.replace(/^\//, '')
            const pageIndex = pagesConfig.pages.findIndex(page => page.path === normalizedPath)

            if (pageIndex !== -1) {
                targetPageIndex = pageIndex
                selectedPath = normalizedPath
                break
            }
        }

        if (targetPageIndex === -1) {
            throw new Error(`未找到任何有效的页面路径`)
        }

        if (targetPageIndex === 0) {
            return { success: true, message: `页面${selectedPath}已经是启动首页` }
        }

        const targetPage = pagesConfig.pages.splice(targetPageIndex, 1)[0]
        pagesConfig.pages.unshift(targetPage)

        const updatedContent = JSON.stringify(pagesConfig, null, 2)
        fs.writeFileSync(this.pagesPath, updatedContent, 'utf8')

        return { success: true, message: `已将页面${selectedPath}设置为启动首页` }
    }

    run() {
        const candidatePagePaths = this.findTargetPagePaths()
        return this.updatePagesHomepage(candidatePagePaths)
    }
}

module.exports = UniappHomepageConfigurator; 