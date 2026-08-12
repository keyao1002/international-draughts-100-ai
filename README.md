# ♟️ 国际跳棋 100格 标准 AI训练 (International Draughts 100)

一个基于 **FMJD 标准规则的国际跳棋 (10×10, 100 格)** 单文件 HTML 游戏, 内置强劲的 **Scan 引擎** (~2500 ELO, 通过本地 bridge 接入), 支持 10 级 AI 强度、自由摆子、实时评分分析。

---

## ✨ 功能特性

| 特性 | 说明 |
|---|---|
| 🎮 完整规则 | 国际跳棋 100 格标准: 兵升王 (必须停在底线)、强制吃子、多吃必选、50 步无吃子和棋、三次重复和棋 |
| 🤖 双引擎 | **Scan 引擎** (2500 ELO, 深度 22+) 为主; **内置 JS 引擎** (1900 ELO) 自动降级兜底 |
| 🎚️ 10 级难度 | Lv.1 随机 → Lv.3 (2 秒) → Lv.6 (20 秒) → Lv.7-10 (深度 15/18/22/25) |
| 🎯 分析模式 | 实时评分条、推荐手提示、搜索统计 (深度/分数/PV) |
| 🛠️ 自由摆子 | 可自定义局面, 支持 Shift+点击 升王 |
| 🎨 视觉 | 奶油 + 森林绿配色、王冠 SVG、走子轨迹、可走/可吃高亮、翻转棋盘 |
| 🔄 自动重连 | bridge 断开后每 5 秒自动重连, 状态指示器 (🟢/🟠/⚪/🔴) |

---

## 🏗️ 系统架构

```
┌─────────────────┐    HTTP long-poll     ┌──────────────────┐    stdin/stdout    ┌─────────┐
│  浏览器 (HTML)   │  ──────────────────▶  │   dxp-bridge.js  │  ───────────────▶  │  Scan   │
│  国际跳棋游戏     │  POST /connect       │   (Node.js)      │   Hub 协议        │  引擎    │
│                 │  POST /go            │  同步请求/响应     │   (hub mode)      │ ~2500ELO │
└─────────────────┘  ◀──────────────────  └──────────────────┘  ◀───────────────  └─────────┘
```

- **HTML 游戏**: 单文件, 双击即开 (file:// 或任意静态服务器), 无任何依赖
- **Bridge** (`dxp-bridge.js`): Node.js 中间层, 把浏览器的 HTTP 请求翻译成 Scan 的 Hub 协议
  - `POST /connect` — 握手 (hub → wait → init → ready)
  - `POST /go` — 同步搜索 `{pos, level, timeout}` → 返回 `{move, info}`
  - `GET /status` — 连接状态
- **Scan 引擎**: 世界级国际跳棋引擎 (Fabien Letouzey), 通过 `hub` 模式驱动

---

## 📦 依赖

| 依赖 | 用途 | 获取方式 |
|---|---|---|
| **Node.js** (≥ 14) | 运行 bridge | `apt install nodejs` 或官网 |
| **Scan 引擎** | 2500 ELO 棋力 | ✅ **已包含在仓库 `bin/scan`** (Linux x86-64, 229KB), 复制到 `~/.scan/` 即可 |
| **Bitbases** (可选) | 终局残局库, 深度 22+ | ⚠️ **太大无法放 GitHub** (2.7GB), 官网下载解压到 `~/.scan/data/`, 配置 `bb-size=6` |
| **Hub GUI** (可选) | Scan 图形界面 | 官网 hub.jar, 需 Java 17 |

> 引擎二进制 (Scan 3.1, Fabien Letouzey 免费软件) 已随仓库分发; bitbase 因体积 (2.7GB) 需单独下载。没有引擎时游戏自动降级为内置 JS 引擎 (~1900 ELO)。

---

## 🚀 快速开始

### 1. 安装 Scan 引擎 (已包含在仓库)

```bash
# 创建目录
mkdir -p ~/.scan/data

# 引擎二进制已在仓库 bin/scan (Linux x86-64, 229KB)
cp bin/scan ~/.scan/scan
chmod +x ~/.scan/scan

# (可选) 下载 bitbases (2.7GB, 残局库) 到 ~/.scan/data/
# 从 Scan 官网: http://hjetten.home.xs4all.nl/Scan/ 下载后解压
```

### 2. 配置 scan.ini

```bash
# 参考仓库里的 scan.ini.example
cp scan.ini.example ~/.scan/scan.ini
```

关键配置:
```ini
book = true          # 开局库
threads = 1          # 线程数 (N95 等低端 CPU 建议 1)
tt-size = 24         # 换位表大小 (MB 级)
bb-size = 6          # bitbase 大小 (0=关闭, 6≈2.4GB 内存)
```

### 3. 启动 bridge

```bash
# 方式 A: 直接运行
node dxp-bridge.js 28754

# 方式 B: 控制脚本 (推荐)
./scan-bridge-ctl start      # 启动
./scan-bridge-ctl status     # 查看状态
./scan-bridge-ctl log        # 查看日志
./scan-bridge-ctl stop       # 停止
```

### 4. 打开游戏

用浏览器打开 `international-checkers.html`:

- **双击文件** (file://) 或
- 任意静态服务器: `python3 -m http.server 8000` 然后访问 `http://localhost:8000/international-checkers.html`

等待 3-10 秒, 顶部应显示 🟢 **✓ Scan 已连接 (~2500 ELO)**。

---

## 🎮 玩法说明

### 对弈模式
- 白方先手, 点击棋子 → 点击目标格走子
- **强制吃子**: 有吃必吃, 多吃必选 (国际跳棋核心规则)
- 兵到达对方底线 → 自动升王 (显示金色王冠), 王可斜线任意距离移动/吃子
- **升王规则**: 兵必须在**捕获链终点**停在底线才升王; 捕获中经过底线必须立即停止 (FMJD 标准)

### 等级说明

| 等级 | 引擎配置 | 大约棋力 |
|---|---|---|
| Lv.1 | 随机 (偏好吃子) | 入门 |
| Lv.2-3 | move-time 1-2s | 业余 |
| Lv.4-6 | move-time 5-20s | 俱乐部 |
| Lv.7-8 | depth 15-18 | 大师 |
| Lv.9-10 | depth 22-25 | 特级大师 (~2500 ELO) |

### 分析模式
- 实时评分条 (白/黑胜率)
- 推荐手提示 (虚线边框)
- 搜索统计: 深度、分数、主变 (PV)

### 键盘快捷键
| 按键 | 功能 |
|---|---|
| `F` | 翻转棋盘 |
| `U` | 悔棋 |
| `N` | 新对局 |
| `R` | 翻转棋盘 |

---

## 📁 文件说明

```
international-checkers/
├── international-checkers.html   # 主游戏 (单文件, 全部逻辑)
├── dxp-bridge.js                 # Scan 桥接服务 (Node.js)
├── scan-bridge-ctl               # bridge 控制脚本 (start/stop/status/log)
├── scan.ini.example              # Scan 引擎配置示例
├── bin/scan                      # Scan 引擎二进制 (Linux x86-64, 229KB)
└── README.md                     # 本文档
```

### 引擎协议细节 (供二次开发)

**Scan move 格式**:
- 普通步: `32-28` (起点-终点)
- 捕获: `14x25x20` — **起点 x 终点 x 被吃1 x 被吃2...**

**棋盘编码** (50 字符): `side + 50 chars` (e=空, w=白兵, b=黑兵, W=白王, B=黑王), 格子 1-50 按行扫描。

---

## 🐛 故障排查

| 症状 | 处理 |
|---|---|
| 顶部显示 ⚪/🔴 无法连接 | `./scan-bridge-ctl status` 检查 bridge; `./scan-bridge-ctl start` 重启 |
| 显示 ⚪ 内置 JS 引擎 | Scan 未启动或 bridge 未连, 游戏自动降级 (仍可玩, 棋力 1900) |
| 长时间卡在"思考中" | 检查 `./scan-bridge-ctl log`; 重启 bridge |
| 内存不足 | 降低 `bb-size` (6→4) 或关掉 bitbase |
| 浏览器无法访问 | 用 file:// 打开; 或起本地服务器 |

---

## 🛡️ 许可

本项目为个人学习项目。Scan 引擎版权归其作者所有, 请遵守其许可协议 (仅限个人非商业使用)。
国际跳棋规则遵循 FMJD (World Draughts Federation) 标准。

---

*Happy draughts! 🎯*
