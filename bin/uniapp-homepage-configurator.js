#!/usr/bin/env node

const UniappHomepageConfigurator = require('../lib/uniapp-homepage-configurator')

try {
    const configurator = new UniappHomepageConfigurator()
    configurator.run()
} catch (error) {
    console.error('❌ 执行失败:', error.message)
    process.exit(1)
} 