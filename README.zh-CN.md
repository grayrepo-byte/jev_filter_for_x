# JevFilterForX

JevFilterForX 是一个用于 X 的浏览器扩展。它会为信息流中的帖子评分，用轻量标签解释评分，并根据你的过滤设置折叠内容。

[![构建扩展](https://github.com/grayrepo-byte/jev_filter_for_x/actions/workflows/ci.yml/badge.svg)](https://github.com/grayrepo-byte/jev_filter_for_x/actions/workflows/ci.yml)

[English README](README.md) · [作者的 X](https://x.com/Grayrepo)

## 演示视频

<video controls poster="assets/promo/jevfilterforx-promo-poster.png" src="assets/promo/jevfilterforx-promo.mp4" width="960">
  当前浏览器不支持内嵌视频。[下载演示视频](assets/promo/jevfilterforx-promo.mp4)。
</video>

[打开或下载演示视频](assets/promo/jevfilterforx-promo.mp4)

![JevFilterForX 演示](assets/promo/jevfilterforx-promo-poster.png)

## 功能

- 为帖子计算 0–100 分。
- 主要从信息量、可行动性和原创性三个维度评分。
- 直接在 X 信息流中显示分数以及主题、价值标签。
- 折叠低价值帖子，同时保留展开查看的入口。
- 展开后可以再次隐藏同一条帖子。
- 折叠帖子时会连同图片和视频一起隐藏。
- 设置页在独立标签页中打开，可配置 API Key、语言、兴趣主题、价值偏好、类别过滤和分数阈值。
- 支持英文、简体中文、日文、西班牙文和德文界面。

## 为什么使用 Jev 做实时过滤？

信息流过滤属于高频分类任务。Jev 面向快速、低成本的请求设计，因此更适合持续处理不断刷新的帖子。相比每条帖子都调用通用 LLM，轻量的 Jev 分类请求更适合低延迟和可控的单条成本。

## 分数计算

Jev 会先从 0–4 分评价三个维度，再按权重换算成 0–100 分：

```text
（信息量 × 40% + 可行动性 × 35% + 原创性 × 25%）÷ 4 × 100
```

- **0–29**：低分
- **30–69**：中等
- **70–100**：高分

主题、价值和噪声类别会单独判断，因此即使分数较高，帖子仍可能因类别过滤或专注模式而被折叠。

## 安装

### 直接下载构建产物

GitHub Actions 会在每次推送到 `main` 以及每个 Pull Request 时自动生成 Chrome 扩展 ZIP。下载最新构建产物：

1. 打开[最新一次成功的 CI 运行记录](https://github.com/grayrepo-byte/jev_filter_for_x/actions/workflows/ci.yml)。
2. 进入对应的运行记录，下载 `jevfilterforx-chrome-<commit>` 产物。
3. 解压产物，然后打开 `chrome://extensions`，启用“开发者模式”，点击“加载已解压的扩展程序”。
4. 选择包含 `manifest.json` 的解压目录。

### 本地构建

1. 安装依赖：

   ```bash
   npm install
   ```

2. 构建扩展：

   ```bash
   npm run build
   ```

3. 在基于 Chromium 的浏览器中，将 `dist/chrome-mv3` 作为“已解压的扩展程序”加载。
4. 打开 JevFilterForX 设置，添加 TypeSafe API Key 并选择过滤规则。

没有 API Key 时，扩展会进入本地模拟模式，仍然可以体验界面和过滤流程。

## 开发

```bash
npm run dev
npm test
npm run typecheck
npm run build
```

## 隐私与权限

API Key 只保存在当前设备，不会同步到 Google 账户。分类请求会发送到配置好的 TypeSafe 服务。扩展只申请过滤所需的 X/Twitter 页面和 TypeSafe API 访问权限。

## 项目状态

JevFilterForX 仍处于早期阶段。随着 X 页面结构变化，分类准确率、重试行为和信息流 DOM 集成还会继续调整。

## 作者

[Grayrepo on X](https://x.com/Grayrepo)
