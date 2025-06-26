#!/usr/bin/env node

const MpWeixinUploader = require('../lib/mp-weixin-uploader')

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
    console.error('❌ 未捕获的异常:', error.message)
    process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ 未处理的Promise拒绝:', reason)
    process.exit(1)
})

const uploader = new MpWeixinUploader()
uploader.run().catch(error => {
    console.error('❌ 执行失败:', error)
    process.exit(1)
})