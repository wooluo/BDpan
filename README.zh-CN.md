<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/readme/logo-dark.svg">
    <img src=".github/readme/logo-light.svg" alt="Overdrive" width="440">
  </picture>
</p>

<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.ru.md">Русский</a> ·
  <b>简体中文</b> ·
  <a href="README.zh-TW.md">繁體中文</a>
</p>

<p align="center">
  <b>你的 PS5 游戏商店。</b><br>
  它已起死回生——从自己的二进制中重新还原构建，源代码每一行都完全公开。
</p>

<p align="center">
  <a href="https://github.com/MyLuxy/overdrive/releases/latest"><img src="https://img.shields.io/github/v/release/MyLuxy/overdrive?style=for-the-badge&label=release&labelColor=0b0b0d&color=2a2a2f" alt="最新版本" width="197"></a>
  <a href="https://github.com/MyLuxy/overdrive/releases"><img src="https://img.shields.io/github/downloads/MyLuxy/overdrive/total?style=for-the-badge&label=downloads&labelColor=0b0b0d&color=2a2a2f" alt="下载次数" width="183"></a>
  <a href="https://github.com/sponsors/MyLuxy"><img src="https://img.shields.io/badge/sponsor-%E2%9D%A4-db61a2?style=for-the-badge&logo=githubsponsors&logoColor=white&labelColor=0b0b0d" alt="在 GitHub 上赞助 MyLuxy" width="180"></a>
</p>

<p align="center">
  <a href="#四步安装">安装</a> ·
  <a href="#功能">功能</a> ·
  <a href="#更新">更新</a> ·
  <a href="#故障排除">故障排除</a> ·
  <a href="#自行构建">自行构建</a>
</p>

> [!NOTE]
> 原版 Overdrive 项目已被关停，因此我反编译了最后一个发布版，
> 恢复出完整源代码并重新构建了它。

<p align="center">
  <img src=".github/readme/discover.jpg" alt="Overdrive 的“发现”页：精选游戏与“现正热门”一行" width="100%">
</p>
<p align="center">
  <img src=".github/readme/browse.jpg" alt="浏览游戏库：1845 款游戏，带筛选、排序、评分与体积" width="49.5%">
  <img src=".github/readme/downloads.jpg" alt="下载页：内置存储与 U 盘的活动和空间占用" width="49.5%">
</p>

## 功能

- **1800 多款游戏**任你探索，还有**评分最高**、**新品**和精选推荐
- **浏览整个游戏库**，筛选、排序、评分与下载体积一目了然
- **直接下载到主机**，可存入内置存储或任意 U 盘，实时显示速度与存储占用
- **收藏**、带屏幕键盘的**搜索**，还有可查看和清理存储内容的**文件**页面
- **13 种语言**：English、Deutsch、Español、Français、Português (Brasil)、Русский、Bahasa Indonesia、日本語、简体中文、العربية、اردو、हिन्दी、বাংলা
- **自我更新**：新版本直接在主机上安装，无需电脑
- 为手柄而生：<kbd>L1</kbd> <kbd>R1</kbd> 切换分区，<kbd>✕</kbd> 确认，<kbd>○</kbd> 返回

## 四步安装

<p align="center">
  <img src=".github/readme/install-steps.svg" alt="1 下载 Overdrive.exfat · 2 复制到 U 盘的 homebrew 文件夹 · 3 插上主机：ShadowMount+ 自动安装 · 4 开始游玩" width="100%">
</p>

### 开始之前

你需要一台**已破解的 PS5**，并运行两个 payload：**[ShadowMount+](https://github.com/drakmor/ShadowMountPlus)**
（它会自行安装 `.exfat` 镜像）和 **[kstuff](https://github.com/EchoStretch/kstuff-lite/releases)**。
如果主机启动时 ShadowMount+ 弹出了通知，就说明准备就绪。你还需要一个 **U 盘**和一台
**电脑**。

<p align="center">
  <a href="https://github.com/MyLuxy/overdrive/releases/latest/download/Overdrive.exfat"><img src="https://img.shields.io/badge/Download-Overdrive.exfat-f2f2f3?style=for-the-badge&labelColor=0b0b0d" alt="下载 Overdrive.exfat" width="347"></a>
</p>

<table>
<tr>
<td width="64" align="center" valign="top"><img src=".github/readme/step-1.svg" alt="1" width="40"></td>
<td>

**下载 `Overdrive.exfat`**：点上方按钮，或前往
[最新 release](https://github.com/MyLuxy/overdrive/releases/latest) 页面。这是你唯一需要的
文件。保持原样即可：不要解压，也不要改动文件名末尾的 `.exfat`。

</td>
</tr>
<tr>
<td align="center" valign="top"><img src=".github/readme/step-2.svg" alt="2" width="40"></td>
<td>

**把它复制到 U 盘上一个名为 `homebrew` 的文件夹里。** 把 U 盘插到电脑上，在它的根目录
新建一个名字必须是 `homebrew`（全小写）的文件夹，然后把 `Overdrive.exfat` 复制进去：

```text
USB drive
└── homebrew
    └── Overdrive.exfat
```

U 盘必须是 **exFAT** 格式——大多数 U 盘出厂即是如此，PS5 也只认这种格式。

</td>
</tr>
<tr>
<td align="center" valign="top"><img src=".github/readme/step-3.svg" alt="3" width="40"></td>
<td>

**把 U 盘插到 PS5 上。** ShadowMount+ 每隔几秒检查一次新文件：它会找到 Overdrive，
挂载并安装，完成后弹出通知。全程无需任何操作。

</td>
</tr>
<tr>
<td align="center" valign="top"><img src=".github/readme/step-4.svg" alt="4" width="40"></td>
<td>

<img src="app/sce_sys/icon0.png" alt="Overdrive 的图标" width="64" align="right">

**在主屏幕上打开 Overdrive。** 找到这个图标，尽情游玩吧！

</td>
</tr>
</table>

你也可以用**任意 FTP 客户端**把文件传到主机内置存储，同样放进 `homebrew` 文件夹：
`/data/homebrew/Overdrive.exfat`。

## 更新

Overdrive 只需手动安装一次。新版本发布后，应用会在启动几秒后主动告诉你：

1. 弹窗显示新版本号与更新内容，按**安装**。
2. Overdrive 下载更新、校验并把它放到旧版本的位置上。
3. 完成后应用**自动关闭**。重新打开，就是新版本了。

更新需要在存放 Overdrive 的那个存储上留出约 **600 MB** 空闲空间。每个 release 里的
`update.zip` 就是应用为此下载的升级包，你自己永远用不到它。

## 支持本项目

Overdrive 免费且开源。如果你喜欢它，赞助能帮我持续维护下去。

<p align="center">
  <a href="https://github.com/sponsors/MyLuxy"><img src=".github/readme/sponsor.svg" alt="在 GitHub Sponsors 上赞助 Overdrive" width="358"></a>
</p>

## 故障排除

<details>
<summary><b>主屏幕上没有出现 Overdrive</b></summary>
<br>

- 确认 **ShadowMount+ 正在运行**：它启动时会弹出一个通知。
- 检查文件夹：名字必须完全是 `homebrew`，且位于 U 盘**根目录**，不能嵌在别的文件夹里。
- 检查文件名末尾仍然是 **`.exfat`**。有些电脑会隐藏扩展名：被改名为
  `Overdrive.exfat.zip` 或被解压成文件夹的文件都找不到。
- 稍等一分钟：ShadowMount+ 会等文件完整复制完之后才安装它。

</details>

<details>
<summary><b>更新之后，应用显示的还是旧版本</b></summary>
<br>

新版本其实已经装好，只是主机里还加载着旧的。**重启主机**再打开 Overdrive 即可；如果
这种情况连续发生，应用自己也会提醒你。

</details>

<details>
<summary><b>更新时提示空间不足</b></summary>
<br>

更新包会下载到已安装应用的旁边，所以存放 Overdrive 的那个存储需要约 600 MB 空闲空间。
在该存储上腾出一些空间，然后按**重试**。出错时什么都没有被改动。

</details>

<details>
<summary><b>更新时提示无法替换应用</b></summary>
<br>

手动安装即可：从[最新 release](https://github.com/MyLuxy/overdrive/releases/latest) 下载
`Overdrive.exfat`，关闭 Overdrive，然后把新文件覆盖 `homebrew` 文件夹里的旧文件。

</details>

<details>
<summary><b>如何卸载 Overdrive？</b></summary>
<br>

先删除 `homebrew` 文件夹里的 `Overdrive.exfat`，再从主屏幕删除它的图标。顺序反了的话，
ShadowMount+ 会重新找到文件，把图标装回来。

</details>

## 自行构建

<details>
<summary><b>仓库里有什么</b></summary>
<br>

| 路径 | 是什么 |
| --- | --- |
| `app/` | 应用本体：JSX 源码、状态、资源、目录数据，以及 `app.json`（标题 ID `PPSA99058`、版本、权限） |
| `ps5-react/` | 它所运行的框架，随仓库内置，源自 [half144/ps5-react](https://github.com/half144/ps5-react) |
| `packaging/make-exfat.sh` | 构建 ShadowMount+ 所安装的 exFAT 镜像 |
| `.github/workflows/build.yml` | 构建流程 |

</details>

<details>
<summary><b>源代码是怎么找回来的</b></summary>
<br>

Overdrive 是一个运行在 [ps5-react](https://github.com/half144/ps5-react) 上的 React 应用，
它的整份 JavaScript bundle 以明文形式内嵌在 `eboot.bin` 里。打包器会把所有模块合并进
同一个作用域，模块之间的 import 因此变成了裸名字；好在每个顶层名字都保持唯一，于是
声明这个名字的模块可以重新推算出来。凭借这一点，bundle 被拆回了 137 个原始模块，并
还原出真实的 `import`/`export` 语句，再与原 bundle 逐一比对，直到每一条 import 依赖
都对得上。

打包器丢掉的东西是找不回来的：大部分注释、JSX 语法（读出来是 `jsx(View, {…})` 调用），
以及 `const`/`let`（现在是 `var`）。这些都不影响应用的行为。

</details>

<details>
<summary><b>开发</b></summary>
<br>

一切都从仓库根目录通过 npm 运行。克隆之后执行一次 `npm run setup`
（`packaging/setup.sh`）即可装齐全部依赖：Linux 上是桌面预览、PS5 构建与测试所需的
apt 软件包（会请求一次 `sudo`），macOS 上是 Homebrew 软件包；随后是 Pillow 和框架的
npm 依赖。如果想自己手动安装，请先读一遍这个脚本。

```sh
git clone https://github.com/MyLuxy/overdrive.git
cd overdrive
npm run setup        # 仅需一次；Linux 上会请求 sudo
npm run dev          # 在电脑窗口里运行应用，app/ 下每次保存都会重新构建
```

| 命令 | 作用 |
| --- | --- |
| `npm run setup` | 安装全部依赖，克隆后执行一次 |
| `npm run dev` | 打开桌面预览，随保存自动重建（重启后状态会重置） |
| `npm run preview` | 只打开一次桌面预览，不监听变更 |
| `npm test` | 框架自检；改动 `ps5-react/` 后需要跑，仅改 `app/` 则不必 |
| `npm run build` | 构建 PS5 应用，然后生成 `Overdrive.exfat` 与 `update.zip`（见“构建”） |
| `npm run build:app` | 只构建 PS5 应用，输出在 `ps5-react/dist/PPSA99058` |

预览就是跑在你电脑上的主机 UI，支持手柄或键盘，鼠标则作为开发者的快捷操作。第一次
`npm run dev` 会下载并编译框架锁定的依赖，耗时较久；之后再启动就很快了。

| 操作 | 键盘 | 鼠标 | PS5 |
| --- | --- | --- | --- |
| 移动焦点 | 方向键 | 滚轮（上下） | 十字键 |
| 确认 | Enter 或空格 | 左键点击元素 | ✕ |
| 返回 | Backspace | 右键 | ○ |
| 切换分区 | Q / E | — | L1 / R1 |
| 收藏 | F | — | □ |
| 退出预览 | Escape | — | PS 键 |

应用代码在 `app/` 下（见“仓库里有什么”）；改动那里不需要重新构建框架。新增面向用户
的字符串时，`app/i18n/locales/` 里的每个语言文件都要写上。Linux 上预览用 clang 编译
（`CC=clang CXX=clang++`，由 npm 脚本设置），因为 GCC 会在 `archive_preflight.cpp`
的一个边界警告处中断。预览的 Linux 支持是本 fork 新增的；上游 ps5-react 只支持 macOS。

</details>

<details>
<summary><b>构建</b></summary>
<br>

构建在 `ubuntu-24.04` 上以 clang 18 进行，且只能通过 **Run workflow** 手动触发：直接
push 不会构建任何东西。每次运行会把 `Overdrive.exfat` 和 `update.zip` 放进一个以
`app/version.js` 命名的草稿 release 里，仅维护者可见。

在本地做同样的构建（仓库根目录下、`npm run setup` 之后，见“开发”）：

```sh
npm run build        # 先构建应用，再在此处生成 Overdrive.exfat 与 update.zip
npm run build:app    # 只构建应用，输出在 ps5-react/dist/PPSA99058
```

背后的 `packaging/build.sh` 会在 apt 或 Homebrew 安装 LLVM 18 的位置找到它（否则请
设置 `LLVM=<其 bin 目录>`），通过 `ps5-react/tools/build_ps5.py` 完成构建，然后以
`sudo` 运行 `packaging/make-exfat.sh`，因为镜像要先挂载才能填充。构建会把它锁定的依赖
下载到 `ps5-react/.deps`，并把应用文件夹、一个 `.zip` 和一个 `.receipt.json` 写入
`ps5-react/dist`。构建自带校验（`tools/verify.py`），所以只要构建是绿色的，payload
结构和签名就都通过了。

镜像是一个普通 exFAT 卷，根目录即应用文件夹，簇大小 64 KiB，卷标 `OVERDRIVE`。发布
新版本时：提升 `app/version.js` 与 `app/app.json` 里的版本号，运行 workflow，在主机上
测试草稿里的镜像，然后发布草稿——这会创建对应的 tag，已安装的应用下次启动时提供的
就正是这些测试过的文件。

</details>

<details>
<summary><b>相对上游 ps5-react 的修复</b></summary>
<br>

内置框架里有两处修复，都在构建工具里，也都是 Linux 构建报告出来的：

- `ps5-react/tools/common.py` 按固定的空格数去读 `git apply --summary` 的输出行，导致
  文件模式与路径粘在一起（`100644 <path>`），每次全新检出依赖都会在第一个创建文件的
  补丁上失败。现在改为按空白分割。
- `ps5-react/tools/build_ps5.py` 用 `tarfile` 打开锁定 LLVM 包的 `data.tar.zst`，但
  `tarfile` 要到 Python 3.14 才支持 zstd，而文档标注的最低版本是 3.12。现在会回退到
  `zstd` 命令。

框架的其余部分没有任何改动。

</details>

## 致谢

- **[MyLuxy](https://github.com/MyLuxy)**，反编译了 Overdrive，找回源码并重建了它。
- **[ps5-react](https://github.com/half144/ps5-react)**，它所运行的框架。
- **[ShadowMount+](https://github.com/drakmor/ShadowMountPlus)**，作者 drakmor，负责安装它。

`ps5-react/` 采用 GPL-3.0-or-later 许可，并自带 `LICENSE`、`LICENSE-ATTRIBUTION` 与
`NOTICE`。每份依赖声明都会复制进构建产物的 `notices/` 目录，
`ps5-react/docs/DEPENDENCIES.md` 列出了它们及其来源。

<sub>Overdrive 是一个非官方的自制（homebrew）项目，与 Sony Interactive Entertainment
无从属关系，也未获其认可。PlayStation 和 PS5 是 Sony Interactive Entertainment 的商标。</sub>
