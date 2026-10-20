# BaiduPan — PS5 上的百度网盘

一个运行在破解（jailbroken）PS5 上的百度网盘客户端：扫码登录、浏览网盘目录、
下载文件到主机；游戏镜像（`.exfat` / `.ffpfs` 等）下载完成后由 ShadowMount+
自动安装到主屏幕。

基于 [ps5-react](https://github.com/half144/ps5-react) 框架构建，应用骨架源自
[Overdrive](https://github.com/MyLuxy/overdrive)（GPL-3.0-or-later，本仓库同样
以 GPL-3.0-or-later 发布）。

## 功能

- **扫码登录**：与官方 App 相同的 passport 二维码协议，BDUSS 约十年有效
- **目录浏览**：面包屑导航、名称/时间/大小排序、自动分页
- **下载**：并行分片 + 断点续传 + 暂停/恢复，多 CDN 节点自动选路与镜像分摊
- **游戏镜像自动安装**：镜像文件落到 `/data/homebrew/`，ShadowMount+ 接管安装
- **受限网络自适应**：对网盘域名的 SNI 级封锁自动启用证书校验完整的域名前置
  （pan/pcs → www.baidu.com，baidupcs → pcsdata.baidu.com），干净网络零影响

## 构建

```sh
git clone <this-repo> && cd baidupan-ps5
npm run setup     # 依赖：macOS 为 Homebrew + Pillow + npm 包
npm run build     # 产出 BaiduPan.exfat（macOS 用 hdiutil 打包，无需 sudo）
```

桌面预览开发：`npm run dev`。

## 安装（PS5）

需要已破解的主机运行 [ShadowMount+](https://github.com/drakmor/ShadowMountPlus)
与 kstuff。把 `BaiduPan.exfat` 通过 FTP 传到 `/data/homebrew/`（或放进 U 盘的
`homebrew/` 文件夹插入主机），ShadowMount+ 自动安装，主屏幕出现图标。

## 已知边界

- 下载速度遵循账号等级：SVIP 满速，普通账号受官方限速
- 网络若同时封锁明文 CDN 节点（`http://IP:19000`）与 baidupcs 节点，下载无法
  完成——应用会自动尝试所有可用节点组合
- 未做网盘写入类操作（转存/删除/重命名），只读浏览 + 下载

## 致谢

- [half144/ps5-react](https://github.com/half144/ps5-react) — 运行框架
- [MyLuxy/overdrive](https://github.com/MyLuxy/overdrive) — 应用骨架与下载引擎
- [qjfoidnh/BaiduPCS-Go](https://github.com/qjfoidnh/BaiduPCS-Go) — locatedownload
  签名算法参考（含官方测试向量）

<sub>本项目为个人自用性质的非官方工具，与百度公司无关。使用私有接口存在理论
风控风险，请自行评估。</sub>
