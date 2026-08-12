# ♟️ 国际跳棋 100格 标准 AI训练

**基于 FMJD 国际标准规则 (100 格) 的单文件 HTML 国际跳棋游戏**, 内置 **Scan 引擎** (~2500 ELO, 深度 22+) 桥接, 支持 10 级 AI 强度、自由摆子、实时评分分析。

- 📦 **单文件游戏**: 双击即玩, 零依赖
- 🤖 **世界级 AI**: Scan 引擎 (已随仓库分发, 无需另行下载引擎)
- 🔄 **自动降级**: 引擎不可用时自动切换内置 JS 引擎 (~1900 ELO), 永不白屏

---

## 📖 目录

1. [系统要求](#-系统要求)
2. [快速开始 (3 步)](#-快速开始-3-步)
3. [详细安装指南](#-详细安装指南)
4. [配置详解 (scan.ini)](#-配置详解-scanini)
5. [启动与运行](#-启动与运行)
6. [游戏界面说明](#-游戏界面说明)
7. [玩法与规则](#-玩法与规则)
8. [等级与棋力](#-等级与棋力)
9. [AI 训练与数据分析](#-ai-训练与数据分析)
10. [常见问题 FAQ](#-常见问题-faq)
11. [项目结构](#-项目结构)
12. [技术架构](#-技术架构)
13. [许可](#-许可)

---

## 💻 系统要求

| 项目 | 最低要求 | 推荐 |
|---|---|---|
| 操作系统 | Linux x86-64 (引擎二进制) | Debian/Ubuntu |
| CPU | 双核 | 4 核+ (引擎单线程, 越快越好) |
| 内存 | 512 MB (无 bitbase) | 4 GB+ (bb-size=6 需 2.4GB) |
| Node.js | ≥ 14 | ≥ 18 |
| 浏览器 | 现代浏览器 | Firefox / Chrome / Edge |
| 显示器 | 1280×720 | 1920×1080 |

> **Windows / macOS 用户**: 游戏 (HTML) 可直接运行; 但仓库内的引擎二进制是 Linux 版。Windows 可用 WSL2, macOS 需从 Scan 官网下载对应版本, 或直接使用内置 JS 引擎。

---

## 🚀 快速开始 (3 步)

```bash
# 1. 克隆仓库
git clone https://github.com/keyao1002/international-draughts-100-ai.git
cd international-draughts-100-ai

# 2. 安装引擎 + 启动 bridge
mkdir -p ~/.scan/data
cp bin/scan ~/.scan/scan
chmod +x ~/.scan/scan
node dxp-bridge.js 28754          # 前台运行, 或:
./scan-bridge-ctl start           # 后台运行 (推荐)

# 3. 打开游戏
# 双击 international-checkers.html, 或:
python3 -m http.server 8000
# 浏览器访问 http://localhost:8000/international-checkers.html
```

等待 3-10 秒, 页面顶部出现 **🟢 ✓ Scan 已连接 (~2500 ELO)** 即成功。

---

## 🔧 详细安装指南

### 第 1 步: 安装 Node.js

```bash
# Debian/Ubuntu
sudo apt update && sudo apt install -y nodejs npm

# 或用官方源装新版
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

验证: `node --version` (应显示 v14+)

### 第 2 步: 安装 Scan 引擎

```bash
mkdir -p ~/.scan/data
cp bin/scan ~/.scan/scan
chmod +x ~/.scan/scan
~/.scan/scan --help   # 验证可执行 (应输出用法)
```

### 第 3 步: 配置 scan.ini

```bash
cp scan.ini.example ~/.scan/scan.ini
```

### 第 4 步: (可选) 安装 Bitbases 残局库

残局库让引擎在**残局阶段** (棋子 < 12 时) 达到深度 22+ 的精确棋力, 约 2.7GB:

```bash
# 从官网下载 bb.zip: http://hjetten.home.xs4all.nl/Scan/
unzip bb.zip -d ~/.scan/data/
# 确保 scan.ini 里 bb-size=6
```

> 不装也能玩, 引擎开局/中局强度不变, 仅残局精度略降。

### 第 5 步: 启动 bridge

**方式 A — 控制脚本 (推荐)**:

```bash
./scan-bridge-ctl start     # 启动 (后台)
./scan-bridge-ctl status    # 查看状态 (进程 + 端口)
./scan-bridge-ctl log       # 查看最近 20 行日志
./scan-bridge-ctl stop      # 停止
```

**方式 B — 手动运行**:

```bash
node dxp-bridge.js 28754    # 前台, 日志直接输出
```

**方式 C — systemd 开机自启** (可选):

```ini
# ~/.config/systemd/user/scan-bridge.service
[Unit]
Description=Scan Draughts Bridge
After=network.target

[Service]
ExecStart=/usr/bin/node /path/to/international-checkers/dxp-bridge.js 28754
WorkingDirectory=/path/to/international-checkers
Restart=always

[Install]
WantedBy=default.target
```

```bash
systemctl --user enable --now scan-bridge
```

### 第 6 步: 打开游戏

- **方式 A**: 文件管理器双击 `international-checkers.html` (file:// 协议)
- **方式 B**: 本地服务器
  ```bash
  python3 -m http.server 8000
  # 浏览器: http://localhost:8000/international-checkers.html
  ```

---

## ⚙️ 配置详解 (scan.ini)

```ini
# main
variant = normal        # 规则变体: normal=国际标准 / killer / bt / frisian / losing
book = true             # 开局库开关
book-ply = 4            # 开局库深度
book-margin = 4         # 开局库选择宽松度
threads = 1             # 引擎线程数 (搜索速度, 建议 1-2)
tt-size = 24            # 换位表大小 (16-30, 越大越快, 占内存)
bb-size = 6             # 残局库大小 (0=关, 6≈2.4GB 内存)

# DXP (与 bridge 无关, 可忽略)
dxp-server = true
dxp-host = 127.0.0.1
dxp-port = 27531
```

**推荐配置**:

| 场景 | threads | tt-size | bb-size |
|---|---|---|---|
| 低配 (2GB 内存) | 1 | 22 | 4 |
| 标准 (4GB) | 1 | 24 | 6 |
| 高配 (8GB+) | 2 | 26 | 6 |

---

## 🎮 游戏界面说明

```
┌──────────────────────────────────────────────────────────┐
│ 左面板                      │ 棋盘 (10×10)    │ 右面板    │
│ ─────────────────           │                 │ ──────── │
│ 对手设置 (1-10 级)           │  █ █ █ █ █      │ 模式切换  │
│ 模式: 对弈/摆子/分析          │  █ █ █ █ █      │ (对弈/    │
│ 走子记录                     │   ...          │  分析/摆子)│
│ 悔棋/新对局/翻转/认输          │                 │ 评分条    │
│ 引擎状态指示器                │                 │ 搜索统计  │
└──────────────────────────────────────────────────────────┘
 图例: ●已选 ●可走 ○可吃 ○推荐手 ●轨迹
```

| 区域 | 功能 |
|---|---|
| **引擎状态** | 🟢=Scan 已连接 / 🟠=连接中 / ⚪=JS 引擎降级 / 🔴=失败 |
| **等级选择** | 1-10 级, 实时显示对应 Scan 配置 |
| **模式切换** | 对弈 / 自由摆子 / 分析 |
| **走子记录** | 棋谱, 含吃子数 (×N) 和升王标记 (↑) |
| **评分条** | 白/黑胜率实时估算 |
| **搜索统计** | Scan 深度、分数、主变 (PV) |

**键盘快捷键**:

| 按键 | 功能 |
|---|---|
| `F` | 翻转棋盘 |
| `U` | 悔棋 |
| `N` | 新对局 |
| `R` | 翻转棋盘 (同 F) |
| `Shift+点击` | 摆子模式: 切换兵/王 |

---

## 📏 玩法与规则 (FMJD 100 格标准)

### 基本规则

1. **棋盘**: 10×10, 只走深色格 (50 格), 白方底部先手
2. **兵 (Man)**: 只能斜向前进一格; 到达对方底线升王
3. **王 (King)**: 斜线任意距离移动 (飞)
4. **吃子**: 跳过相邻敌方棋子到其后方空格; **吃子为强制**, 吃多者为先
5. **升王**: 兵**停在**对方底线 (走子或吃子到达) 即升王
   - ⚠️ 兵在**多段吃子中途**到达底线 → 立即升王并**停止** (FMJD 标准, 不能继续吃)
6. **和棋**: 50 步无吃子 / 三次重复局面
7. **胜负**: 吃光对方 / 对方无子可走

### 与英式跳棋 (Checkers) 的区别

| 规则 | 国际跳棋 100 格 (本游戏) | 英式 8×8 |
|---|---|---|
| 棋盘 | 10×10, 20 子/方 | 8×8, 12 子/方 |
| 兵吃子 | 前后均可吃 | 只能向前吃 |
| 王 | 飞 (任意距离) | 一步一格 |
| 升王后吃子 | 多段吃子中到底线立即停止 | 可继续 |
| 吃子规则 | 强制 + 多吃必选 | 强制 |

---

## 🎚️ 等级与棋力

| 等级 | Scan 配置 | 思考时间 | 棋力参考 |
|---|---|---|---|
| Lv.1 | move-time=0 | 即时 | 入门 (随机偏好吃子) |
| Lv.2 | move-time=1 | ~1s | 新手 |
| Lv.3 | move-time=2 | ~2s | 业余 |
| Lv.4 | move-time=5 | ~5s | 俱乐部 |
| Lv.5 | move-time=10 | ~10s | 强俱乐部 |
| Lv.6 | move-time=20 | ~20s | 大师 |
| Lv.7 | depth=15 | 视局面 | 大师+ |
| Lv.8 | depth=18 | 视局面 | 特级大师 |
| Lv.9 | depth=22 | 视局面 | ~2500 ELO |
| Lv.10 | depth=25 | 视局面 | 顶配 (需 bitbase) |

> 💡 高等级 (depth 22+) 在复杂局面可能思考 1-5 分钟, 属正常现象。

---

## 🧠 AI 训练与数据分析

项目名含 "AI 训练", 本游戏为 AI 对弈/训练提供:

### 分析模式

- 实时胜率评分条 (白/黑)
- 推荐手提示 (虚线边框 + 主变 PV)
- 深度/节点/时间统计

### 自对弈 / 生成训练数据

bridge 提供底层接口, 可用脚本驱动引擎自对弈生成棋谱:

```bash
# 示例: 用 curl 让 Scan 走一步 (可循环生成训练数据)
curl -X POST http://127.0.0.1:28754/go \
  -H 'Content-Type: application/json' \
  -d '{"pos":"Wbbbbbbbbbbbbbbbbbbbbeeeeeeeeeeewwwwwwwwwwwwwwwwwwww","level":"depth=22","timeout":60}'
# → {"ok":true,"move":"20-25","line":"done move=20-25 ...","info":[...]}
```

可用 Python/Node 脚本批量自对弈, 收集 `{局面, 走法, 评分, 深度}` 数据用于强化学习/监督学习训练。

---

## ❓ 常见问题 FAQ

### Q1: 顶部显示 ⚪ 内置 JS 引擎, Scan 没连接?
- 运行 `./scan-bridge-ctl status` 检查 bridge 是否在跑
- `./scan-bridge-ctl start` 启动; 等 3 秒后再刷新页面
- 检查 `~/.scan/scan` 是否存在且可执行

### Q2: 显示 🔴 连接失败?
- bridge 未启动或端口被占用 (`ss -tln | grep 28754`)
- 杀进程重启: `./scan-bridge-ctl stop && ./scan-bridge-ctl start`

### Q3: AI 思考很久没反应?
- 高等级 (Lv.7+) 属正常, 深度搜索耗时
- 若超过 5 分钟, 检查 bridge 日志: `./scan-bridge-ctl log`
- 重启 bridge 后刷新页面

### Q4: 内存不足 (卡顿/被杀)?
- 降低 `bb-size` (6→4 或 0), 重启 bridge

### Q5: Windows 上引擎无法运行?
- 仓库引擎是 Linux 二进制; Windows 用 WSL2 运行 bridge, 或只用内置 JS 引擎

### Q6: 浏览器打不开 file:// ?
- 用本地服务器: `python3 -m http.server 8000` → 访问 `http://localhost:8000`

### Q7: 端口 28754 被占用?
- 换端口: `node dxp-bridge.js 28755`, 并改 HTML 里 `SCAN_HTTP` 常量

---

## 📁 项目结构

```
international-checkers/
├── international-checkers.html   # 主游戏 (单文件, 全部逻辑 60KB+)
├── dxp-bridge.js                 # Scan 桥接服务 (Node.js, HTTP 同步模式)
├── scan-bridge-ctl               # bridge 控制脚本 (start/stop/status/log)
├── scan.ini.example              # Scan 引擎配置示例
├── bin/scan                      # Scan 引擎二进制 (Linux x86-64, 229KB)
└── README.md                     # 本文档
```

---

## 🏗️ 技术架构

```
┌─────────────────┐   HTTP (fetch)   ┌──────────────────┐  stdin/stdout  ┌─────────┐
│  浏览器 (HTML)   │ ───────────────▶ │   dxp-bridge.js  │ ─────────────▶ │  Scan   │
│  国际跳棋游戏     │  POST /connect  │   (Node.js)      │   Hub 协议     │  引擎    │
│                 │  POST /go       │  同步请求-响应     │   (hub mode)   │ ~2500ELO │
└─────────────────┘ ◀─────────────── └──────────────────┘ ◀─────────────  └─────────┘
```

- **Bridge API**: `POST /connect` (握手), `POST /go` (同步搜索, 返回 move+info), `GET /status`
- **Scan move 格式**: 普通步 `32-28`; 吃子 `14x25x20` = 起点×终点×被吃列表
- **棋盘编码**: `side + 50字符` (e/w/b/W/B), 格子 1-50 按行扫描
- **可靠性**: 无浏览器轮询、无共享队列, 每步独立请求; 超时自动降级 JS 引擎

---

## 📄 许可

- 本仓库代码 (HTML/bridge/脚本): 个人学习使用, 欢迎 fork
- **Scan 引擎**: Fabien Letouzey 的免费软件 (freeware), 仅限个人非商业使用, 版权归原作者
- 国际跳棋规则: 遵循 FMJD (World Draughts Federation) 标准

---

*Happy draughts! 🎯 祝对弈愉快*
