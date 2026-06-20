# 订单管理后台

基于 Vue 3 + Node.js + Express + Element Plus 构建的全平台订单管理系统，支持多维度筛选、订单指派、批量导出等功能。

## 功能特性

### 全平台订单全量列表
- 支持租赁单与销售单两种订单类型的统一管理
- 内置 200 条模拟数据，覆盖多平台、多状态、多品类
- 实时统计卡片：订单总数、销售单、租赁单、交易总额、待指派、当前筛选结果

### 多维度筛选
| 筛选维度 | 说明 |
|---------|------|
| 关键词 | 订单号/客户姓名/电话/商品名称/SKU |
| 订单类型 | 全部/租赁单/销售单 |
| 订单状态 | 待付款/已付款/处理中/已发货/已送达/已完成/已取消/已退款 |
| 租赁状态 | 待发货/已发货/使用中/归还中/已归还/已完成/已逾期（仅租赁单） |
| 来源平台 | 官网/微信小程序/淘宝/京东/拼多多/抖音/线下门店 |
| 支付方式 | 支付宝/微信支付/银行转账/信用卡/现金 |
| 指派人员 | 按指派人员筛选（含未指派） |
| 来源渠道 | 搜索引擎/社交媒体/朋友推荐/线下展会/广告投放/老客户/自然流量/合作伙伴 |
| 下单时间 | 日期区间选择 |
| 金额区间 | 最低/最高实付金额筛选 |

### 列表展示与排序
- 多列表格：订单信息、客户信息、商品信息、金额、租赁详情、下单时间、指派人员、操作
- 支持金额、下单时间列的升降序排序
- 租赁详情列智能显示（筛选为销售单时隐藏）
- 响应式分页，支持 10/20/50/100 条每页切换

### 订单指派
- 单条订单指派/改派
- 批量选择后批量指派
- 指派状态实时更新统计数据

### 数据导出
- 导出当前筛选结果（全部符合条件的订单）
- 导出所选订单
- Excel 格式（.xlsx），字段完整
- 租赁单专属字段自动扩展（租赁状态、租期、起止日期、月租金、押金、物损押金）

### 订单详情
- 弹窗式详情页，分类展示基础信息、商品明细、租赁信息
- ElDescriptions 分组 + ElTable 商品列表

## 技术栈

### 后端
- Node.js
- Express 4.x
- TypeScript
- SheetJS (xlsx) - Excel 导出
- ts-node-dev - 开发热重载

### 前端
- Vue 3 (Composition API + `<script setup>`)
- Vue Router 4
- Element Plus 2.x
- Axios
- Vite 5
- TypeScript

## 目录结构

```
.
├── api/                          # 后端源码
│   ├── types/
│   │   └── order.ts              # 订单类型定义、常量
│   ├── data/
│   │   └── orderGenerator.ts     # Mock 数据生成器
│   ├── services/
│   │   └── OrderService.ts       # 订单业务逻辑（筛选/排序/指派/导出/统计）
│   └── server.ts                 # Express 服务入口、路由注册
├── client/                       # Vue 前端源码
│   ├── src/
│   │   ├── api/
│   │   │   └── order.ts          # Axios 请求封装
│   │   ├── router/
│   │   │   └── index.ts          # 路由配置
│   │   ├── styles/
│   │   │   └── global.css        # 全局样式
│   │   ├── types/
│   │   │   └── order.ts          # 前端订单类型定义
│   │   ├── views/
│   │   │   └── OrderList.vue     # 订单列表核心页面
│   │   ├── App.vue
│   │   └── main.ts
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── package.json
├── package.json                  # 根 package（后端依赖 + 脚本）
├── tsconfig.json                 # 后端 TypeScript 配置
├── .env.example                  # 环境变量示例
└── README.md
```

## 快速开始

### 环境要求
- Node.js >= 16
- npm >= 8 或 pnpm / yarn

### 1. 安装依赖

```bash
# 一键安装前后端所有依赖
npm run install:all
```

或分别安装：

```bash
# 后端依赖
npm install

# 前端依赖
cd client
npm install
cd ..
```

### 2. 启动开发服务

**方式一：分别启动（推荐开发调试）**

```bash
# 终端 1：启动后端（端口 3001）
npm run dev:server

# 终端 2：启动前端（端口 5173，已配置 API 代理）
npm run dev:client
```

启动后访问：`http://localhost:5173`

**方式二：构建后通过 Node 服务访问前端**

```bash
# 构建前端
npm run build:client

# 启动后端（自动托管 client/dist 静态资源）
npm run dev:server
```

访问：`http://localhost:3001`

### 3. 环境变量（可选）

复制 `.env.example` 为 `.env` 并根据需要修改：

```bash
cp .env.example .env
```

| 变量名 | 默认值 | 说明 |
|-------|-------|------|
| PORT | 3001 | 后端服务监听端口 |

## API 接口

| 方法 | 路径 | 说明 |
|-----|------|------|
| GET | `/api/orders` | 订单列表（分页+筛选+排序） |
| GET | `/api/orders/:id` | 订单详情 |
| POST | `/api/orders/assign` | 单条订单指派 |
| POST | `/api/orders/batch-assign` | 批量订单指派 |
| GET | `/api/orders/export/excel` | 导出筛选结果为 Excel |
| GET | `/api/orders/statistics` | 统计概览数据 |
| GET | `/api/constants` | 常量枚举（类型/状态/平台/人员等） |

### 订单列表查询参数示例

```
GET /api/orders?keyword=iPhone&type=lease&status=paid&platform=taobao&startDate=2025-01-01&endDate=2025-12-31&minAmount=1000&page=1&pageSize=20&sortField=createTime&sortOrder=desc
```

## 常用命令

| 命令 | 说明 |
|-----|------|
| `npm run dev:server` | 启动后端开发服务（热重载） |
| `npm run dev:client` | 启动前端 Vite 开发服务 |
| `npm run build:server` | 编译后端 TypeScript 到 `dist/` |
| `npm run build:client` | 构建前端产物到 `client/dist/` |
| `npm run start` | 使用 Node 运行编译后的后端（需先 build） |
| `npm run install:all` | 一键安装前后端依赖 |

## 数据说明

项目启动时自动生成 200 条 mock 订单数据，包含：
- 约 50% 租赁单，50% 销售单
- 7 个来源平台随机分布
- 8 种订单状态、7 种租赁状态
- 5 大类商品（电子设备/摄影器材/办公设备/工程机械/家居家电），共 50 种具体商品
- 10 名可指派人员，8 种来源渠道
- 时间范围：最近 365 天内随机

> 注意：数据存储在内存中，服务重启后重置。如需持久化可对接数据库（MySQL/MongoDB/PostgreSQL 等）。

## 后续可扩展方向

- 用户登录/权限管理
- 对接真实数据库（已分离 Service 层，替换数据源即可）
- 订单状态流转操作（发货/完成/取消/退款等）
- 可视化图表（ECharts/Chart.js 展示订单趋势、平台占比等）
- 多租户/店铺维度隔离
- 消息通知（指派变更、逾期提醒等）
- CI/CD 自动化部署工作流
