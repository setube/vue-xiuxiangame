<p align="center">
    <img src="https://i0.hdslb.com/bfs/article/2954c995c96dd4ece5922282f54ec58b8941412.png" width="400">
</p>
<p align="center">
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-blue" alt="license MIT"></a>
    <a href="https://qm.qq.com/q/iifNs5qukg"><img src="https://img.shields.io/badge/QQ%E7%BE%A4-920930589-green" alt="QQ群：920930589"></a>
    <a href="https://www.taptap.cn/app/719622"><img src="https://img.shields.io/badge/TapTap-%E6%88%91%E7%9A%84%E6%96%87%E5%AD%97%E4%BF%AE%E4%BB%99%E5%85%A8%E9%9D%A0%E5%88%B7-18d6e0" alt="TapTap"></a>
    <a href="https://hellogithub.com/repository/e73a691ffcfa4d0e92a05912fe8c0b46"><img src="https://abroad.hellogithub.com/v1/widgets/recommend.svg?rid=e73a691ffcfa4d0e92a05912fe8c0b46&claim_uid=OCYdts5lPczHag4&theme=small" alt="Featured｜HelloGitHub" /></a>
</p>

## 我的文字修仙全靠刷

- 项目框架 [Vue.js](https://cn.vuejs.org)
- 项目 UI [Element Plus](https://element-plus.org/zh-CN)
- 状态管理库 [Pinia](https://pinia.vuejs.org/zh)

Docker 贡献者：

- wuchenchina [无尘](https://github.com/wuchenchina)
- CoolXiTech [酷曦科技](https://github.com/CoolXiTech)
- Firfr [Firfe](https://github.com/Firfr)

鸣谢以上开源项目及贡献者，排名不分先后.

## 快速开始

本项目使用 Bun 1.4.5 和 TypeScript。安装 Bun 后执行：

```sh
bun install --frozen-lockfile
bun run dev
```

常用命令：

```sh
bun run check       # 项目文件断言、严格类型检查及全部测试
bun run build       # 生产构建，输出到 dist/
bun run preview     # 本地预览，端口 8080
```

所有业务脚本、Vue 组件脚本、构建配置和测试均使用 TypeScript，类型定义见 `src/types/game.ts`。`src/utils/assert.ts` 提供存档、装备、战斗及数字等运行时断言；无效导入会在写入本地存储前被拒绝。旧版 AES 存档仍受支持，应用版本与存档格式版本独立。

如果启动时提示“本地存档校验失败”，原始存档会原位保留在浏览器的 `localStorage.vuex`，自动保存已暂停，页面内的新进度不会保存。请先用“导出存档”保留原始文件，再通过“导入存档”选择有效备份；导入成功会刷新页面，校验通过后自动保存恢复。无效备份会被拒绝，并保留现有存档。

TypeScript 暂用最新兼容的 6.0.3：当前 `vue-tsc` 3.3.14 依赖其 JavaScript 编译器 API，与 TypeScript 7 的原生编译器接口不兼容。请使用已提交的 `bun.lock` 安装依赖。

Docker 使用 Bun 构建并执行检查，Nginx 提供静态页面：

```sh
docker build -t vue-xiuxiangame .
docker run --rm -p 8080:8080 vue-xiuxiangame
```

推送到 `main` 后，GitHub Actions 会自动执行检查、构建并将 `dist/` 部署到 GitHub Pages；拉取请求仅运行检查与构建。也可在 Actions 中手动运行部署工作流。仓库不再提交 `docs/` 构建产物。

GitHub Pages 的发布来源应设为 **GitHub Actions**。自定义域名在仓库 **Settings → Pages → Custom domain** 中管理，无需在 `public/` 或构建产物中生成 `CNAME` 文件。

- [本地安装指南](https://github.com/setube/vue-xiuxiangame/wiki/%E6%9C%AC%E5%9C%B0%E5%AE%89%E8%A3%85%E6%8C%87%E5%8D%97)
- [Docker 部署指南](https://github.com/setube/vue-xiuxiangame/wiki/Docker%E9%83%A8%E7%BD%B2%E6%8C%87%E5%8D%97)

## 版权声明

知识共享署名-非商业性使用 4.0 国际许可协议

本作品采用知识共享署名-非商业性使用 4.0 国际许可协议进行许可。
要查看此许可协议的副本，请访问 http://creativecommons.org/licenses/by-nc/4.0/。

您自由地：
共享 — 在任何媒介以任何形式复制、发行本作品
改编 — 修改、转换或以本作品为基础进行创作

惟须遵守以下条件：
署名 — 您必须给出适当的署名，提供指向本许可协议的链接，同时标明是否（对原始作品）作了修改。您可以用任何合理的方式来署名，但不得以任何方式暗示许可人为您或您的使用背书。

非商业性使用 — 您不得将本作品用于商业目的。

没有附加限制 — 您不得适用法律术语或者技术措施从而限制其他人做许可协议允许的事情。

声明：
本作品是作者（谦君）的原创作品，项目源码地址：https://github.com/setube/vue-xiuxiangame
本授权条款不得被视为或解释为对任何版权的放弃或其他限制。

当您分享本作品的改编版本时，您必须：

- 在显著位置标注原作者的署名
- 保留本许可协议文档
- 明确说明修改内容及修改日期
- 使用相同的 CC BY-NC 4.0 协议进行分发

© 2025 谦君 - 保留所有权利（根据本许可协议授予的权限除外）
