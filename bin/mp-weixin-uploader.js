#!/usr/bin/env node

const MpWeixinUploader = require('../lib/mp-weixin-uploader')

const uploader = new MpWeixinUploader()
uploader.run().catch(error => {
    console.error('❌ 执行失败:', error)
    process.exit(1)
})