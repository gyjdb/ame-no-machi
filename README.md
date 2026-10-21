# 雨の街 · Rainy Corner

使用 JavaScript 与 Three.js 制作的雨夜日式便利店微缩场景，可拖拽旋转、滚轮缩放。包含商品陈列、自动门、细雨、积水反射和灯光动画，无人物、无界面控件。

在线体验：https://ame-no-machi.ycai0417.chatgpt.site

## 本地运行

安装 Node.js 后，在项目目录执行：

```sh
npm run dev
```

浏览器打开 http://localhost:4173 。依赖已包含在项目中，无需 npm install。请通过本地服务器运行，不要直接双击 HTML；浏览器需要支持 WebGL。

## 源码结构

- `dist/scene.js`：建筑、街道、灯光、雨水、反射及相机交互。
- `dist/interior.js`：货架、商品、冷柜、收银台及室内分区。
- `dist/index.html`：网页入口与模块配置。
- `dist/vendor/`：Three.js、附加模块、日文字体和第三方许可。
- `scripts/preview.mjs`：本地静态预览服务器。

`dist` 包含可直接阅读和修改的源码，无需构建。部署时将其作为静态网站根目录。

## 第三方许可

Three.js 及其附加模块使用 MIT 许可，见 `dist/vendor/THREE-LICENSE.txt`。日文字体的许可见 `dist/vendor/FONT-LICENSE.txt`。
