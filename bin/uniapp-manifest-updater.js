#!/usr/bin/env node

const UniappManifestUpdater = require('../lib/uniapp-manifest-updater')

try {
    const updater = new UniappManifestUpdater()
    updater.run()
} catch (error) {
    console.error('❌ 执行失败:', error.message)
    process.exit(1)
} 