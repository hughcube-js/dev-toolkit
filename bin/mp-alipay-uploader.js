#!/usr/bin/env node

const MpAlipayUploader = require('../lib/mp-alipay-uploader')

const uploader = new MpAlipayUploader()
uploader.run().catch(error => {
    console.error('❌ 执行失败:', error)
    process.exit(1)
})