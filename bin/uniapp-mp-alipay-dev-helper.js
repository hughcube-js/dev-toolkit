#!/usr/bin/env node

const UniappMpAlipayDevHelper = require('../lib/uniapp-mp-alipay-dev-helper')

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
    console.error('❌ 未捕获的异常:', error.message)
    process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ 未处理的Promise拒绝:', reason)
    process.exit(1)
})

try {
    const helper = new UniappMpAlipayDevHelper()
    helper.run()
} catch (error) {
    console.error('❌ 执行失败:', error.message)
    process.exit(1)
} 