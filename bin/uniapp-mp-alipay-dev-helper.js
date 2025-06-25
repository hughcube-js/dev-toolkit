#!/usr/bin/env node

const UniappMpAlipayDevHelper = require('../lib/uniapp-mp-alipay-dev-helper')

try {
    const helper = new UniappMpAlipayDevHelper()
    helper.run()
} catch (error) {
    console.error('❌ 执行失败:', error.message)
    process.exit(1)
} 