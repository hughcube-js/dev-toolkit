# @hughcube/dev-toolkit

一套完整的开发工具集，包含小程序版本管理、代码上传、开发配置等功能。

## 🚀 功能特性

- **UniApp版本管理**: 自动更新manifest.json中的版本号和版本代码
- **支付宝小程序上传**: 使用minidev自动上传代码到支付宝开放平台
- **微信小程序上传**: 使用miniprogram-ci自动上传代码到微信公众平台
- **UniApp支付宝开发助手**: 自动生成支付宝小程序开发配置文件，支持导出页面配置
- **UniApp首页配置器**: 根据AppID自动配置小程序启动首页
- **跨平台支持**: 支持Windows、macOS、Linux
- **环境变量支持**: 支持通过环境变量配置参数

## 📦 安装

### 全局安装（推荐）

```bash
npm install -g @hughcube/dev-toolkit
```

### 项目本地安装

```bash
npm install @hughcube/dev-toolkit --save-dev
```

## 🛠 命令行工具

安装后可以使用以下命令行工具：

### 1. UniApp版本更新器 `hctoolkit-uniapp-version-updater`

更新manifest.json中的版本信息：

```bash
# 更新版本号
hctoolkit-uniapp-version-updater --version v1.2.3

# 支持多位版本号
hctoolkit-uniapp-version-updater --version v1.2.3.4
```

### 2. 支付宝小程序上传 `hctoolkit-mp-alipay-uploader`

上传代码到支付宝开放平台：

```bash
hctoolkit-mp-alipay-uploader \
  --app-id 2021005160675311 \
  --dist-dir ./dist/build/mp-alipay \
  --version v1.2.3 \
  --config ./minidev-config.json
```

### 3. 微信小程序上传 `hctoolkit-mp-weixin-uploader`

上传代码到微信公众平台：

```bash
hctoolkit-mp-weixin-uploader \
  --app-id wx650d85ca4330d458 \
  --dist-dir ./dist/build/mp-weixin \
  --version v1.2.3 \
  --private-key ./private.wx.key
```

### 4. UniApp支付宝开发助手 `hctoolkit-uniapp-mp-alipay-dev-helper`

生成支付宝小程序开发配置：

```bash
# 开发模式 + 监听
hctoolkit-uniapp-mp-alipay-dev-helper --mode dev --watch

# 构建模式
hctoolkit-uniapp-mp-alipay-dev-helper --mode build

# 导出页面配置到compileMode.json
hctoolkit-uniapp-mp-alipay-dev-helper --mode dev --dump-pages --watch
```

### 5. UniApp首页配置器 `hctoolkit-uniapp-homepage-configurator`

配置小程序启动首页：

```bash
# 根据AppID自动查找
hctoolkit-uniapp-homepage-configurator --app-id wx650d85ca4330d458 --platform mp-weixin

# 直接指定页面路径
hctoolkit-uniapp-homepage-configurator --page-path pages/home/index  
```

## 📋 环境变量

所有工具都支持通过环境变量配置参数，优先级为：命令行参数 > 环境变量 > 默认值

### 支付宝小程序上传环境变量

```bash
export ALIMP_APP_ID="2021005160675311"
export ALIMP_DIST_DIR="./dist/build/mp-alipay"
export ALIMP_VERSION="v1.2.3"
export ALIMP_MINIDEV_CONFIG_FILE="./minidev-config.json"
export ALIMP_VERSION_DESCRIBE="版本描述"
```

### 微信小程序上传环境变量

```bash
export WXMP_APP_ID="wx650d85ca4330d458"
export WXMP_DIST_DIR="./dist/build/mp-weixin"
export WXMP_VERSION="v1.2.3"
export WXMP_PRIVATE_KEY_PATH="./private.wx.key"
export WXMP_VERSION_DESCRIBE="版本描述"
export WXMP_ROBOT="1"
```

## 🔧 编程接口

也可以在Node.js代码中使用：

```javascript
const { UniappVersionUpdater, MpAlipayUploader, MpWeixinUploader } = require('@hughcube/dev-toolkit');

// UniApp版本更新
const versionUpdater = new UniappVersionUpdater();
const result = versionUpdater.updateManifest('v1.2.3');
console.log(result); // { versionName: 'v1.2.3', versionCode: 1002003 }

// 支付宝上传
const alipayUploader = new MpAlipayUploader({
  appId: '2021005160675311',
  distDir: './dist/build/mp-alipay',
  version: 'v1.2.3',
  minidevConfig: './minidev-config.json'
});
await alipayUploader.run();

// 向后兼容的方式（建议使用新的类名）
const { VersionUpdater } = require('@hughcube/dev-toolkit');
```

## 📄 前置条件

### 支付宝小程序

1. 安装minidev依赖：`npm install minidev`
2. 准备minidev配置文件，包含私钥和工具ID
3. 确保构建产物目录存在

配置文件格式 (minidev-config.json):
```json
{
  "alipay": {
    "authentication": {
      "privateKey": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----",
      "toolId": "your-tool-id"
    }
  }
}
```

### 微信小程序

1. 安装miniprogram-ci依赖：`npm install miniprogram-ci`
2. 从微信公众平台下载代码上传密钥
3. 确保构建产物目录存在

获取私钥文件：
1. 登录微信公众平台 https://mp.weixin.qq.com
2. 进入开发 → 开发管理 → 开发设置 → 小程序代码上传
3. 生成并下载代码上传密钥

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

## 🔗 相关链接

- [支付宝开放平台](https://open.alipay.com/)
- [微信公众平台](https://mp.weixin.qq.com/)
- [uni-app官网](https://uniapp.dcloud.net.cn/)
- [GitHub仓库](https://github.com/hughcube-js/dev-toolkit) 