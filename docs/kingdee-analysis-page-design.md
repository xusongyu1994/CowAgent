# 金蝶数据分析页面 · 实施方案

> 版本：v1.4
> 状态：需求已确认，原型已评审（v2）；**已深入研究金蝶权限并修正多用户权限设计**；实现形态为 **Web 独立页面（`channel/web/analysis.html` + `analysis.js`）**（早期 desktop React 描述见历史版本，实现以此修订为准）
> 适用范围：`CowAgent` **Web 控制台**新增的**数据分析页面**（金蝶数据分析专用智能体）
> 关联原型：`prototype/kingdee-analysis-dashboard-prototype.html`（v2，可交互）
>
> **v1.1 变更说明**：根据对 `common/permission_checker.py`、`channel/web/web_channel.py`、`bridge/agent_bridge.py`、`agent/protocol/agent_stream.py` 的代码核查，**发现并修正了一个关键权限隐患**——Web 对话链路存在"`session_id` 冒充 web 管理员全权"的身份泄漏问题。本方案通过**新增专用对话端点 + 修正 `from_user_id`** 保证"企微多用户 + 权限差异化"在动态分析链路真正生效。详见 §6.1。
>
> **v1.2 变更说明**：在已实现版本基础上新增一轮"**图表数据丰富化 + 定点下钻 + 看板布局升级**"改造（多字段数据点、⚙ 视图设置、多系列双 Y 轴、定点下钻 vs 整图下钻、KPI 独立排、1/2 列切换、对话栏收起、图高 260px）。完整记录见 **§12**，契约升级见 §6.4（v2）。
>
> **v1.3 变更说明（会话历史按用户隔离加固）**：权限审计确认"企微用户 vs 管理员身份识别、scope 查询/导出隔离"均正确，但发现**分析页会话历史无用户维度隔离**——`session_id` 为全局 `analysis_时间戳`，`/api/analysis/history` 与 `/api/analysis/chat` 均不校验归属，任意已认证用户构造他人 session_id 即可读取其历史 / 触发 agent 复述其看板数据。v1.3 将 session_id 改为**按用户命名空间**（`analysis_{userid}_{ts}`，localStorage key 同步按 userid 隔离，旧格式会话弃用），后端对 history 与 chat 统一做**会话归属前缀校验**，并把历史读取修正到 **kingdee-analysis workspace 库**（修复读库不一致）。详见 §6.8。
>
> **v1.4 变更说明（分析中"看板可查看 + 可切标签 + 新结果完成后跳转"）**：修复分析过程中的查看体验——原实现以**全屏半透明遮罩 + `dashboardArea` 整体 `pointer-events:none`** 锁定页面，导致分析中旧图表被遮挡、无法滚动查看，也无法切换到历史标签页。v1.4：① `#dashboardLoading` 由全屏遮罩改为**不遮挡图表的顶部状态条**（`sticky top-0`）；② 交互锁定从 `dashboardArea` 收敛到 **KPI/图表内容区**（`.loading` 类 + CSS），外层滚动与标签切换保留；③ **A3 标签呈现**：分析中后续 `render_dashboard` 结果**后台追加不打断**，整轮 `done` 后**一次性自动切到本轮最终新标签**（首图即时展示）；④ 分析中标签页可切换查看、× 关闭禁用（CSS 类状态化 + `closeTab` 双保险）。详见 §6.9。

---

## 0. 前置前提（落地状态记录）

> 早期「前置硬依赖」清单现已全部落地，此处更新为状态记录。

| # | 前置项 | 落地状态 |
|---|--------|---------|
| 1 | **Web 端企微身份获取** | ✅ 已落地：页面走企微 OAuth 免密登录（回调 `target=analysis`）或密码管理员（`web_password`）；`/api/analysis/context` 返回真实企微 userid |
| 2 | **金蝶 MCP 在专用 Agent workspace 的可用性** | ✅ 已落地：金蝶 MCP（`kingdee-k3cloud`）为全局配置，专用 agent 复用；未配置时回退默认 agent |
| 3 | **scope 过滤字段** | ⏳ 沿用 `salesman`（`_saler_condition` / `FSalerId.FName`），实施时与金蝶单据字段核对 |

---

## 1. 背景与目标

CowAgent 已具备完整、成熟的金蝶数据能力（MCP 工具、`kingdee-query` skill、Kingdee 后端 Handler、企微多用户权限），但 **Web 控制台目前没有独立的金蝶数据分析页面**（既有金蝶看板为固定报表，无对话式动态分析）。

目标：在 Web 控制台新增一个**数据分析页面**（`/analysis`），核心定位是**「金蝶数据分析专用智能体」**——用户选择分析模板后，智能体生成看板，并**主动**引导用户层层下钻分析，形成"分析 → 洞察 → 建议 → 再分析"的持续闭环。

### 核心用户价值

1. 用户选模板 → 立即获得一份金蝶数据分析看板
2. 智能体基于展示数据**主动**提出下一步分析方向和方案
3. 用户可通过对话持续追加更多分析看板
4. 每次动态生成分析后，智能体继续主动给出下一层建议

---

## 2. 与现状的差距分析（重要）

> **⚠️ 注意**：金蝶的**数据能力、权限体系、对话引擎全部已存在**，本页面**不是从零搭建数据层**，而是新增一层"看板渲染 + 对话驱动 + 主动建议"的 UI 与结构化输出。

### 已具备的能力（直接复用，无需重写）

| 层 | 能力 | 位置 |
|----|------|------|
| MCP 工具 | `query_bill_json`、`query_bill_all`、`query_bill_range`、`query_bill_to_file`、`count_bill`、`view_bill`、`query_metadata` | `agent/tools/mcp` |
| 金蝶 Skill | `kingdee-query`（销售分析、库存分析、订单跟踪、日报、周报等 workflow reference） | `skills/kingdee-query/` |
| 后端 API | `KingdeeKanbanHandler`、`KingdeeBillDetailHandler`、`KingdeeConversionStatsHandler`、`KingdeeConversionCustomerBillsHandler`、`KingdeeArOverdueHandler` | `channel/web/web_channel.py` |
| 对话引擎 | `ChatService`、`AgentStreamExecutor`（SSE 流式，agent_id 可切换） | `agent/chat/service.py` |
| 多 Agent | `AgentProfile` 注册机制 | `agent/registry.py` |
| 企微权限 | 金蝶表单授权 + 销售数据范围（`all`/`self`/`self_and_subordinates`）+ 会话 HMAC 令牌 | `common/permission_checker.py` |
| Web 静态资源 | `analysis.html` + `analysis.js`（Chart.js 4.4.7 CDN、Tailwind、SheetJS），由 `AnalysisPageHandler` 服务 | `channel/web/` |

### 真正要新增的

| 层 | 位置 | 改动 |
|----|------|------|
| 后端 API | `channel/web/web_channel.py` | 新增 `AnalysisContextHandler` / `AnalysisTemplateApplyHandler` / `AnalysisChatHandler`（身份修正）/ `AnalysisHistoryHandler` / `AnalysisPageHandler` + 路由 |
| Agent 专用智能体 | `bridge/agent_initializer.py` | 专用 profile（config `agents` 注册）+ 首次启动自动写入人设 AGENT.md（常量 `KINGDEE_ANALYSIS_AGENT_MD`，单一来源） |
| Agent 看板工具 | `agent/tools/analysis/render_dashboard.py` | `render_dashboard` 工具，按 ChartSpec v2 JSON 返回结构化看板 |
| 前端页面 | `channel/web/analysis.html` + `static/js/analysis.js` | 对话 + 看板分栏主页面（独立页，不侵入 chat.html） |
| 前端样式 | `channel/web/static/css/analysis.css` | 页面样式 |
| 企微入口 | config `wecom_open_pages` | 加 `"analysis": "数据分析"`，企微用户菜单可见 |

> 说明：页面通过企微 OAuth 回调 `target=analysis` 免密登录；密码管理员用 `web_password` 访问（全权 `session_web_admin`）。

---

## 3. 核心设计决策（多轮确认结论）

| # | 决策 | 结论 |
|---|------|------|
| 1 | 页面位置 | **Web 控制台独立页面**（`/analysis` → `channel/web/analysis.html`，企微用户 + 密码管理员） |
| 2 | 模板形式 | 模板 = 看板指令（6 个内置模板，选模板由 agent 生成初始看板，再对话动态追加；`required_forms` 权限锁定） |
| 3 | 看板形态 | **对话 + 看板左右分栏**（左对话可收起、右看板画布 1/2 列切换） |
| 4 | 数据连接 | **所有看板（模板初始看板 + 动态自由查询）统一由专用 Agent 生成**；后端 API 仅提供模板配置与辅助数据，不直接生成看板 |
| 5 | 图表库 | **Chart.js 4.4.7**（CDN，与既有金蝶看板一致）；数据点多字段 + 多系列双 Y 轴 |
| 6 | Agent 结构化输出 | **JSON Schema**：agent 调用 `render_dashboard` 工具，前端从**工具结果（tool_result）**提取 ChartSpec JSON 渲染（单一输出通道，不另造 SSE 事件） |
| 7 | 主动建议交互 | **建议卡片 + 建议面板**（卡片可一键执行，面板展示全部历史建议） |
| 8 | 智能体形态 | 新增**专用 Agent Profile**（`kingdee-analysis`，`agent_initializer` 自动写入人设 AGENT.md） |
| 9 | 分析深度 | **多层逐步下钻**：模板看板 → 趋势/占比/排行 → 异常检测 → 归因下钻 → 方案建议；支持**图表内定点下钻**（点击数据点） |
| 10 | 多用户权限 | **基于企微 userid 的金蝶数据权限**，每个用户只能看自己有权限的数据 |
| 11 | 图表视图定制 | **⚙ 视图设置**（数量/图类型/数值系列）+ 数据点多字段 tooltip + 全字段表格视图 |
| 12 | 定点下钻 | **点击数据点 = 定点下钻该对象；点击空白 = 整图下钻**；KPI/表格行均可下钻 |
| 13 | 历史恢复 | session_id 存 localStorage，退出重进恢复对话 + 看板标签页（含每图 `_view` 状态） |

---

## 4. 页面布局与交互原型

### 4.1 整体布局

```
┌────────────────────────────────────────────────────────────────┐
│ 顶部: ← 返回 · 数据分析 | 金蝶经营分析 | 👤 张三·本人+下属          │
├────────────────────────────────┬───────────────────────────────┤
│ 左 38% · 分析对话(可收起 ◀)      │ 右 62% · 看板工作区             │
│ ┌────────────────────────────┐ │ 工具栏: ▦模板 ▼时间 ‖ 1/2列 ‖导出│
│ │ 🧠 金蝶分析智能体 | 收起◀    │ │ 标签栏(每次分析独立标签页)         │
│ │ 对话消息流                  │ ├───────────────────────────────┤
│ │ (定点下钻/建议点击留痕)      │ │ KPI 行: 独立 auto-fit 2~4/行    │
│ │  [输入框 + 发送]            │ ├───────────────────────────────┤
│ └────────────────────────────┘ │ 图表网格(默认1列大图·可切2列)     │
│                               │  ┌───────────────────────────┐  │
│                               │  │ 标题 [排行]  ⤓  ⚙          │  │
│                               │  │ ⚙=数量/类型/系列设置        │  │
│                               │  │ [ Chart.js 图 260px ]      │  │
│                               │  │ tooltip 多字段/数据点定点下钻│  │
│                               │  └───────────────────────────┘  │
│                               │ 建议面板(底部横条·采纳/忽略/执行) │
└────────────────────────────────┴───────────────────────────────┘
```
> 建议卡片统一位于**右侧底部建议面板**（历史建议横向滚动，含 👍采纳/忽略 反馈、点击执行下钻）。左侧对话流中 agent 文字回复会提及建议，但不承载建议卡片本身。

### 4.2 核心交互闭环

```
用户选模板 → 后端返回模板看板指令 → 专用 Agent 调用金蝶MCP(按 scope 过滤)
    → 返回 ChartSpec JSON → 渲染初始看板
    → 智能体主动解读数据、识别异常 → 生成洞察 + 建议卡片 → 建议面板累积
    → 用户点击建议卡片/自由对话/点击图表下钻 → agent 再次调用 MCP 查询
    → 返回 ChartSpec JSON → 追加新图表卡片 → 智能体继续给新建议
    → 循环下钻
```

---

## 5. 内置模板清单（v1.0 第一期 · 6 个）

> 每个模板 = 预定义看板布局（图表类型 + 数据源）。选择后生成初始看板，再通过对话持续追加。
> `required_forms`：模板依赖的金蝶表单，用户缺任一表单则模板锁定（与 §6.7#18 联动）。

| # | 模板名称 | 图标 | 初始看板内容 | required_forms |
|---|---------|------|-------------|----------------|
| 1 | **销售经营日报** | 📈 | 销售额 KPI、销售趋势、客户排行、部门占比 | `SAL_SaleOrder` |
| 2 | **产品线销售分析** | 🏭 | 各产品线销售额 KPI、销售趋势、产品线占比、产品排行 | `SAL_SaleOrder`, `BD_MATERIAL` |
| 3 | **客户销售分析** | 🏆 | Top客户、客户分布、转化率、复购率、流失预警 | `SAL_SaleOrder`, `BD_Customer` |
| 4 | **应收账款分析** | 💰 | 逾期金额 KPI、账龄分布、逾期客户排行、到期预警 | `AR_receivable` |
| 5 | **出库数据分析** | 📦 | 出库量 KPI、出库趋势、出库品类分布、出库区域排行 | `SAL_OUTSTOCK` |
| 6 | **样品单/报价单分析** | 🔁 | 样品单/报价单→销售订单转化统计、按客户转化率、转化金额 | `SAL_SaleOrder`, `SAL_QUOTATION` |

> 另有「✨ 跟智能体自由对话」入口：不选模板，直接在左侧对话区描述分析需求。

> **⚠️ 原型演示说明**：原型中「客户销售分析」卡片被置灰 + 🔒 锁定，是**为演示"无表单权限"拦截**而做的模拟（假设当前用户无 `BD_Customer` 权限）。真实系统中，只要用户具备模板的 `required_forms`，该模板即正常可用。所有模板在用户有权限时均可用。

---

## 6. 技术方案

### 6.1 多用户权限（重点 · 已修正）

#### 6.1.0 关键发现：Web 对话链路存在身份泄漏（必须解决）

经代码核查，项目金蝶权限体系（三层模型）本身完善，且已在**两条查询链路**强制生效：

| 链路 | 生效位置 | 身份来源 | 权限是否生效 |
|------|---------|---------|:---:|
| Web 金蝶看板 API (`/api/kingdee/*`) | `web_channel.py:6053` `_apply_kingdee_permission` → `build_kingdee_form_filter` | `_get_current_kingdee_userid()` → 真实企微 userid | ✅ 生效 |
| Agent 对话 + MCP 工具 | `agent_stream.py:1721` 工具执行前拦截 | `agent.current_user_id` | ⚠️ **Web 对话链路失效** |

**⚠️ 隐患根因**：Web 对话链路 `post_message()`（`web_channel.py:1703`）中
`msg.from_user_id = session_id`，而 `bridge/agent_bridge.py` 的 `_extract_user_identity()`
从 `from_user_id` 提取 user_id → `set_current_user()` → 成为 `agent.current_user_id`。
`session_id`（`session_` 前缀）会命中 `_is_admin_user()` → **被当作 web 管理员全权处理，
完全绕过企微 userid 的表单授权 + scope 过滤**。

> 企微**聊天渠道**因有真实的 `from_user_id = 企微userid`，权限生效；但 **Web 对话**这一条链路存在身份泄漏。

**结论**：数据分析页面的"动态自由查询走 Agent + MCP"链路，**不能直接复用现有 `ChatHandler` 的 `post_message`**，必须新增专用对话端点，把企微 userid 正确注入 `from_user_id`。

#### 6.1.1 权限统一方案（三层保障）

| 落点 | 作用 | 实现 |
|------|------|------|
| ① 专用对话端点修正身份 | 让 Agent `current_user_id` = 真实企微 userid | 新增 `/api/analysis/chat`，构造消息时 `msg.from_user_id = userid`（企微 userid），**而非 session_id** |
| ② Agent 工具拦截兜底 | 表单权限 + 业务员过滤强制生效 | 复用 `agent_stream.py:1721`（`build_kingdee_form_filter`），user_id 为空即拒绝 |
| ③ 前端展示过滤 | 无权限模板置灰/隐藏，未认证引导登录 | `GET /api/analysis/context` 返回 `{userid, kingdee_allowed, scope, accessible_templates[]}` |

**会话隔离**：`_session_queue_key(session_id, agent_id)` + 每个会话绑定真实 userid，保证不同企微用户会话与数据完全隔离。

### 6.2 后端新增 API（全部 `_require_auth()` 保护）

```
GET  /api/analysis/context
     └─ 返回 { userid, kingdee_allowed, scope, templates[], locked_templates[] }
        （前端据此决定展示哪些模板、是否引导登录）

POST /api/analysis/template/apply
     └─ 选择模板后调用：返回该模板的预定义「看板指令」（含 required_forms、指标口径、图表建议）
     └─ 前端将该指令作为**系统级引导注入**专用 Agent（非用户消息，对话区不显示指令本身，仅显示"已选择模板"占位）
     └─ 由 Agent 统一生成初始看板（不直接聚合数据）

POST /api/analysis/chat                          ← 新增专用端点（关键权限修正）
     └─ _require_auth() 强制认证
     └─ userid, authed, _ = _check_wecom_auth()  ← 解析真实企微 userid
     └─ 未企微认证（密码管理员）→ userid = "web_admin"（全权）
     └─ 构造 WebMessage 时：msg.from_user_id = userid   ← 关键，不能用 session_id
     └─ msg.from_user_nickname = 企微姓名
     └─ 走专用 kingdee-analysis Agent → MCP 查询按 userid 过滤（agent_stream.py:1721 兜底）

GET  /api/analysis/history                       ← 新增（历史会话恢复）
     └─ 参数: session_id, page, page_size
     └─ 复用 load_history_page()，返回历史消息（含 ChartSpec JSON）
```

### 6.3 专用智能体

新增 **`kingdee-analysis` Agent Profile**（在 `config` 的 `agents` 数组新增一条配置，`id: kingdee-analysis`，`enabled: true`，由 `agent/registry.py` 加载），**复用项目根 `kingdee-query` skill**（金蝶字段/流程规则单一来源），system prompt 塑造"资深财务/经营分析师"人设，规定：

1. 基于看板数据**主动**提出下一步分析方向
2. 分层下钻：趋势 → 占比/排行 → 异常检测 → 归因下钻（客户/产品/业务员）→ 方案建议
3. 输出看板必须符合 ChartSpec JSON Schema
4. 每次回复末尾附带 2~3 条"下一步可分析点"建议卡片
5. **边界约束（重要）**：
   - **无关问题**：若用户提问与金蝶经营分析无关（如天气、闲聊），**拒绝回答**并明确引导回数据分析场景；**不返回 ChartSpec**
   - **无数据/无权限**：若查询无数据或用户无对应表单权限，**返回空 `ChartSpec`（`charts: []`）+ 明确的文字说明**，不编造数据
   - **权限合规**：始终遵守用户 `scope`（all/self/self_and_subordinates），只能查询已授权表单

### 6.4 Agent 结构化输出契约（ChartSpec JSON Schema）

> **输出通道**：agent 调用 `render_dashboard` 工具，前端从**工具结果（tool_result）**提取完整 ChartSpec JSON 渲染。**单一通道**，不另造 SSE 事件（修正 §6.7#15）。

```json
{
  "dashboard_title": "3月销售经营分析",
  "append_to_board": false,
  "charts": [
    {
      "id": "chart-1",
      "type": "bar",
      "title": "客户销售排行",
      "description": "本月客户销售排行（含伴随指标）",
      "dimensionLabel": "客户",
      "xKey": "name",
      "yKey": "value",
      "data": [
        {
          "name": "华东客户A",
          "value": 12860000,
          "订单数": 86,
          "数量": 15200,
          "占比": "22.6%",
          "环比": "+12.4%",
          "_custId": "C001"
        }
      ],
      "analysis_meta": {
        "metric": "销售额 = 已审核订单(SAL_SaleOrder,状态C)含税合计",
        "dimension": "客户",
        "time_range": "2026-02-01 ~ 2026-02-28",
        "drill_candidates": ["订单构成", "产品分布", "业务员明细", "月度趋势"]
      }
    }
  ]
}
```

**`append_to_board` 语义**（关键，决定前端追加/替换）：
- `false`（默认，模板初始看板）：**一次性返回模板的完整多图表**，前端**替换/重建整个看板**
- `true`（动态下钻/对话追加）：返回本次**新增的单图表**，前端**追加到看板末尾**，不覆盖已有卡片

> 模板看板（选 A 生成）：一次返回 KPI+趋势+排行+占比 等 4 卡，`append_to_board=false`。动态下钻/对话：每次返回 1 张新卡，`append_to_board=true`。

支持的 `type`：`line` | `bar` | `pie` | `area` | `kpi`（KPI 卡）| `table`（表格）

**v2 契约补充规则（数据丰富化）**：
- **多字段数据点**：`data[i]` 除 `{xKey 值, yKey 值}` 外，可携带该维度的伴随指标字段（如 `订单数`/`数量`/`占比`/`环比`）。前端会在 tooltip、明细表格中全部展示。
- **字段类型分治（强约定）**：量化指标（金额/数量/订单数等）必须是**数值**（可参与多系列/排序/计算）；`占比`/`环比`/`同比` 等百分比指标返回**带 `%` 的字符串**（仅展示，不参与多系列）。前端据此区分"可勾选为系列"与"只读展示"两类字段。
- **隐藏字段**：`_` 前缀的键（如 `_custId`）为内部标识——**不进入 tooltip/表格/导出**，但可供定点下钻携带精确定位。
- **`dimensionLabel`（每图可选）**：数据点维度的业务名（客户/产品线/物料…），前端定点下钻 prompt 据此精确表达"点击的是哪个对象"。
- **`analysis_meta`（每图可选）**：图表口径自述 `{metric, dimension, time_range, drill_candidates}`。下钻时前端将 `analysis_meta + 点击值` 一并发给 agent，保证口径/时间范围/可下钻方向准确定位（历史恢复场景尤其必要）。
- **排行条数**：排行类默认返回 Top 10~20；前端提供 前5/前10/前20/全部 数量切换（`_view` 前端状态，不新增契约字段）。

#### 6.4.0 图表类型覆盖矩阵（金蝶经营分析）

金蝶工具（`query_bill_json`/`query_bill_all`）返回**行级明细 JSON**，由 agent 聚合加工后按 ChartSpec 输出。下表确认 6 种图表能覆盖主流分析：

| 类型 | 适用场景 | 数据形态 | 覆盖度 |
|---|---|---|---|
| `kpi` 指标卡 | 销售额、达成率、订单数、逾期额等单指标 | `{value, delta}` | ✅ 强 |
| `line` 折线 | 销售/出库/回款随时间趋势 | `[{date, value}]` | ✅ 强 |
| `bar` 柱状 | 客户/产品/业务员排行对比 | `[{name, value}]` | ✅ 强 |
| `pie` 饼图 | 部门/产品线/状态占比构成 | `[{name, value}]` | ✅ 强 |
| `area` 面积 | 累计销售、库存水位 | `[{date, value}]` | ✅ 覆盖 |
| `table` 表格 | 逾期明细、订单清单 | 行级数组 | ✅ 强 |

> 可选二期：`scatter`（散点，销量 vs 金额相关性）、`radar`（雷达，多维绩效）。一期 `kpi+line+bar+pie+table` 构成最小完备集。

#### 6.4.1 空数据 / 无权限返回规范

当查询无数据或用户无表单权限时，agent 返回**空 `charts` + 提示文案**：

```json
{
  "dashboard_title": "采购分析",
  "charts": [],                                   // ← 空数组
  "no_data_message": "您没有「采购单」表单(PUR_PurchaseOrder)的访问权限，或该维度暂无数据"
}
```

**前端兜底逻辑**：
- `charts.length > 0` → 正常渲染图表卡片
- `charts.length === 0` → **不新建标签页、看板区不追加任何卡片**；`no_data_message` 由前端在**对话区高亮展示**一次（AI 气泡样式），说明无数据/无权限原因
- 无关问题时 agent **不返回 ChartSpec**，前端只展示对话区文字，看板不追加任何卡片

> （v1.2 统一：原"渲染空状态卡片"方案废弃，看板区保持干净，空数据只以对话说明形式呈现——与 §12.4#6 一致）

#### 6.4.2 图表展示失败的三层降级兜底（防"数据展示不了"）

当 agent 返回的数据与图表类型不匹配或无法绘制时，前端 `ChartRenderer` 必须**降级兜底而非报错崩溃**：

**① 渲染前校验（validateChart）**：

```js
function validateChart(spec) {
  if (!['line','bar','pie','area','kpi','table'].includes(spec.type))
    return { ok:false, fallback:'unknown_type' };
  if (!Array.isArray(spec.data) || spec.data.length === 0)
    return { ok:false, fallback:'empty_data' };
  if (!spec.data.some(d => typeof d[spec.yKey ?? 'value'] === 'number'))
    return { ok:false, fallback:'missing_numeric_field' };
  return { ok:true };
}
```

**② 降级渲染策略**：

| 失败原因 | 兜底行为 |
|---|---|
| `unknown_type`（未知图表类型） | **降级为 table 表格**展示原始数据（数据不丢） |
| `empty_data`（数据为空） | 渲染**"暂无数据"空状态卡片** |
| `missing_numeric_field`（缺数值字段） | 降级为 **table 表格**，提示"该数据无法绘制图表，已用表格展示" |
| `data` 结构异常 / 非数组 | 渲染**错误提示卡片**，不影响页面其它图表 |

**③ agent 侧约束（源头减少坏数据）**：
- ChartSpec 契约明确每种 `type` 的 `data` 结构（如 `pie` 需 `{name, value}`）
- agent 必须对金蝶行级明细**先聚合清洗**（按客户/产品/日期分组求和），禁止直接传原始明细
- 无法满足某图表类型时，agent **主动降级选择**更适合的类型或返回空 `charts`

### 6.5 建议卡片结构

```json
{
  "suggestions": [
    {
      "id": "sug-1",
      "title": "客户A本月下滑20%，建议下钻订单明细",
      "category": "anomaly",
      "prompt": "请分析客户A本月订单下滑的原因，按产品/业务员维度拆分"
    }
  ]
}
```

### 6.6 历史会话恢复机制

用户退出数据分析页面后再次进入，**历史对话 + 看板完整保留**：

| 机制 | 实现 |
|------|------|
| 会话持久化 | 复用 `ConversationStore`（SQLite，`<workspace>/memory/long-term/index.db`），按 `session_id` 存储消息，重启不丢 |
| session_id 记忆 | 前端把「专用智能体 `session_id`」存 `localStorage`，再次进入时携带同一 session_id |
| 历史消息加载 | 新增 `GET /api/analysis/history?session_id=xxx` → 复用 `load_history_page()` 分页返回历史消息 |
| 看板重建 | 历史消息中的 `ChartSpec`（agent 结构化输出）重新解析 → 重新渲染看板网格 |
| 会话隔离 | 不同企微 userid + 不同 agent 的会话完全隔离（`_session_queue_key`） |

> 实现要点：历史消息须同时保存 `ChartSpec JSON`（用于看板重建）与文字内容（用于对话展示），不能只存纯文本。
>
> **⚠️ 初始看板的历史重建**：因选 A（模板看板也由 Agent 生成），**初始看板与动态看板一样**，均以 agent 的 `ChartSpec` 工具结果为准重建。模板指令（系统引导）不参与看板重建，仅保证 agent 生成时使用正确配置。历史恢复时扫描所有 agent 的 ChartSpec 工具结果，按 `append_to_board=false` 的最近一次作为看板基底，再叠加 `append_to_board=true` 的追加卡片。

### 6.7 特殊场景与边界处理（34 项）

| # | 场景 | 风险 | 处理方案 |
|---|------|------|---------|
| 1 | **会话并发/多轮重叠** | 🔴 图表顺序错乱 | 同一会话**串行处理**（复用 session queue），发送中禁用输入；ChartSpec 加 `append_to_board: true/false` 增量标记，前端决定追加/替换卡片 |
| 2 | **图表卡片无上限** | 🔴 看板爆炸 | **看板容量上限**（如 20 卡），超出折叠/提示；支持**分看板**（一个会话多个命名看板页签） |
| 3 | **超大数据集** | 🔴 渲染卡顿 | ChartSpec 约定**数据点上限**（如图表 ≤50 点），超出 agent 需降采样（按月/季度聚合）；前端大数据量开虚拟化 |
| 4 | **会话过期/登录失效** | 🟡 分析中断 | 前端监听 401 → 引导重新认证；**本地缓存看板**避免数据丢失 |
| 5 | **后端/金蝶服务异常** | 🟡 静默失败 | 明确错误态（"金蝶服务暂不可用"）；agent 在 tool 失败时返回失败原因而非静默 |
| 6 | **敏感数据展示** | 🟡 泄露风险 | 加**敏感数据脱敏开关**（金额打码/客户名脱敏）；看板提示"含经营敏感数据" |
| 7 | **agent 返回非法 JSON** | 🔴 前端崩溃 | agent 侧结构化输出 + JSON 修正（截取首`{`末`}`）；前端解析失败兜底提示"未能生成图表，请重新描述" |
| 8 | **空看板/首次进入** | 🟢 空白困惑 | 显示引导占位（"选择模板或与智能体对话开始分析"） |
| 9 | **图表数据过期** | 🟢 数据滞后 | 提供手动刷新 + 数据更新时间戳；可选自动刷新 |
| 10 | **导出能力未定义** | 🟢 功能缺失 | 明确：**PNG 截图** + **Excel 数据导出** 两种 |
| 11 | **文案统一** | 🟢 文案缺失 | 所有文案（模板名/按钮/错误提示）以中文内置于 `analysis.html`/`analysis.js`；若后续需多语言再抽离 |
| 12 | **响应式/无障碍** | 🟢 窄屏错乱 | 看板网格小屏降级为单列堆叠 |
| 13 | **专用智能体金蝶能力可用性** | 🔴 功能不可用 | 创建专用 Agent 时**校验 workspace 内金蝶 MCP 配置 + `kingdee-query` skill** 已启用；否则 agent 无法调用金蝶工具 |
| 14 | **金蝶自定义字段适配** | 🔴 500 错误 | 专用智能体**复用 `kingdee-query` skill**（字段规则单一来源），其 `customization-guide.md` 提供企业自定义字段/ID映射；禁止用通用字段猜测，避免双套字段规则 |
| 15 | **ChartSpec 输出通道** | 🔴 解析错乱 | **单一通道 = `render_dashboard` 工具结果（tool_result）**，前端从工具结果提取完整 ChartSpec，**不另造 SSE 事件、不跨 delta 拼接** |
| 16 | **独立 session_id 隔离** | 🟡 会话串扰 | 数据分析页使用**独立 session_id**，不与全局对话页共用，避免历史/队列串扰 |
| 17 | **看板视图状态** | 🟡 恢复乱序 | v1.2 采用固定网格（无自由拖拽），布局 = **列数切换(1/2)** + **每图 `_view{type,limit,series}`**；切换标签页保留 `_view`，历史恢复后回默认视图 |
| 18 | **模板↔表单映射权限** | 🟡 模板误用 | 每个模板定义 `required_forms: [form_id...]`，用户缺任一表单则模板锁定（与 §5 模板清单联动） |
| 19 | **金蝶查询超时重试** | 🟢 偶发失败 | agent 工具调用超时自动重试 1 次；仍失败则明确报错 |
| 20 | **多窗口并发操作** | 🟢 状态冲突 | 同一会话多标签操作以最后一次为准；前端做防重复提交 |
| 21 | **建议卡片数量控制** | 🟢 刷屏 | agent 每次建议卡片限 2~3 条，杜绝一次输出过多 |
| 22 | **图表联动下钻** | 🔴 核心交互 | **点击图表 → 自动下发"按该维度继续下钻"对话需求**，agent 返回更深层分析并追加新看板（用户确认必做） |
| 23 | **下钻越权探测** | 🔴 安全 | 下钻需求与正常对话**走同一 `AnalysisChatHandler`**（不新增旁路），确保 `agent_stream.py:1721` 权限拦截统一生效；配合 `identity_prefix` 防身份伪造 |
| 24 | **金蝶敏感字段控制** | 🔴 数据泄露 | 模板 ChartSpec 定义**字段级白名单**（如只展示金额汇总，不含客户联系方式）；结合脱敏开关（§6.7#6） |
| 25 | **指标口径统一** | 🔴 数据误导 | 每个模板定义**指标口径**（如"销售金额=已审核订单含税合计"），图表标题旁标注口径；ChartSpec 加 `metric_definition` 字段 |
| 26 | **看板数据时点一致性** | 🟡 口径混乱 | 每张图表卡片标注**数据时间戳**（查询时点），下钻基于各自时点清晰可辨 |
| 27 | **图表编辑/重跑** | 🟡 无法调整 | 图表卡片提供**编辑/重跑**入口，可改时间范围/维度后重新生成该图（不丢失其它卡片） |
| 28 | **清空会话/重置看板** | 🟡 无重启入口 | 提供"清空看板""新建会话"，需二次确认避免误删 |
| 29 | **建议采纳反馈闭环** | 🟡 建议质量 | 建议卡片加**👍 采纳 / 忽略**轻反馈，用于优化 agent 建议质量 |
| 30 | **加载骨架屏** | 🟢 首屏闪白 | 首次进入/历史恢复时用**骨架屏**占位 |
| 31 | **图表数据缓存** | 🟢 金蝶压力 | 固定模板+固定时间范围结果做**短期缓存**（如 5 分钟），命中复用 |
| 32 | **导出权限校验** | 🟢 数据外泄 | PNG/Excel 导出接口同样 `_require_auth()` + scope 过滤 |
| 33 | **重复分析去重** | 🟢 重复卡片 | agent 检测重复请求时提示"该维度已分析过，可看历史或换维度" |
| 34 | **0值/空值/负值数据** | 🟢 图表异常 | `validateChart` 补充处理 0/负值/NaN；饼图 0 值项归入"其他" |

> 优先级：🔴 硬边界 = #1 并发、#2 看板容量、#7 非法 JSON、#13 金蝶能力、#14 自定义字段、#15 输出通道、#22 图表联动下钻、#23 越权探测、#24 敏感字段、#25 指标口径，必须随 Phase 1-4 一并实现；🟡/🟢 为健壮性与体验项。

### 6.8 会话历史按用户隔离加固（v1.3）

**背景**：权限审计确认企微用户/管理员身份识别、scope 查询与导出隔离均正确生效；但发现 **会话历史缺少用户维度隔离**——分析页 `session_id` 原为全局 `analysis_时间戳`，`/api/analysis/history` 与 `/api/analysis/chat` 均不校验归属，任意已认证企微用户若构造/获知他人 session_id，即可：
- 直接读取他人会话历史（含 ChartSpec 看板数据）；
- 或携带他人 session_id 发起对话，触发 agent `_restore_conversation_history()` 加载该会话历史入上下文，**在回复中复述他人看板结论**（读历史接口之外的第二旁路）。

**方案（v1.3 已落地）**：

| 落点 | 改动 | 文件 |
|------|------|------|
| ① session_id 用户命名空间 | session_id 格式改为 `analysis_{userid}_{时间戳}`；localStorage key 由固定 `cow_analysis_session_id` 改为按 userid 隔离 `cow_analysis_session_id_{userid}`；**旧格式 `analysis_时间戳` 会话一律弃用**（升级后首次打开自动生成新会话，旧库数据不可恢复——最安全，决策：丢弃） | `channel/web/static/js/analysis.js`（`analysisSessionKey` / `analysisNewSessionId` / `init()` 规范化 / `clearSession()`） |
| ② 历史读取归属校验 | `AnalysisHistoryHandler.GET` 解析当前 userid，经 `_analysis_session_owner()` 校验，不匹配返回「无权访问该会话」 | `channel/web/web_channel.py` |
| ③ 对话写入归属校验 | `post_message()` 内、`override_user_id` 非空（即数据分析专用端点）时执行同一前缀校验，阻断「用自己的身份携带他人 session_id」触发 agent 复述他人历史 | `channel/web/web_channel.py`（`post_message`） |
| ④ 公共校验函数 | `_analysis_session_owner(session_id, userid)`：空/无前缀/他人前缀 → False | `channel/web/web_channel.py` |
| ⑤ 读库一致性修复 | 新增 `_analysis_history_store()`：专用 `kingdee-analysis` agent 注册时读取**其 workspace 的 ConversationStore**（与写入一致），否则回退默认 store | `channel/web/web_channel.py` |

**身份一致性保证**：前端 `ctx.userid`（来自 `/api/analysis/context` → `_current_analysis_user()`）与后端 `AnalysisChatHandler` 的 `override_user_id`、`AnalysisHistoryHandler` 校验所用的 userid 完全同源，因此正常用户前缀始终自洽；管理员前缀为 `analysis_session_web_admin_`，企微用户为自身 userid，互不可达。

**范围界定（决策）**：
- 通用接口 `/api/history`、`/api/sessions`、`/api/sessions/<id>`（DELETE/clear_context）的归属越权风险**本轮仅核查、未修改**，另立任务处理。
- 后端校验为**「前缀 + 纯数字尾段」严格匹配**（`_analysis_session_owner`）：会话 id 固定形如 `analysis_{userid}_{Date.now()}`，除前缀匹配外还要求剩余段为纯数字——即使 userid 含下划线（如 `li_na`），也无法借 `analysis_li_` 前缀读他人会话。真正的越权防护来自「命名空间不可伪造 + 已认证身份绑定」，与企微会话 HMAC cookie 一致的安全模型。

### 6.9 分析中「看板可查看 + 可切标签 + 新结果完成后跳转」（v1.4）

**背景**：原实现对"分析中"用**全屏半透明遮罩**（`#dashboardLoading` `absolute inset-0` + `bg-white/60` + `backdrop-blur`）加 `#dashboardArea` 整体 `pointer-events:none` 锁定页面。导致：
1. 分析中旧图表被遮罩盖住 + 模糊，无法滚动/读取数值；
2. `#dashboardTabs` 位于 dashboardArea 内 → 标签切换也被锁定，无法切到历史标签查看旧分析。

**方案（v1.4）**：

| 落点 | 改动 | 文件 |
|------|------|------|
| ① 状态条置顶 | `#dashboardLoading` 由全屏遮罩改为 `sticky top-0` 的**不遮挡窄条**（琥珀色 + spinner + "分析中… 可查看/切换已有图表"），置于看板顶部 | `analysis.html` |
| ② 锁定收敛 | 交互锁定从 `dashboardArea` 整体改为 **`#kpiGrid` + `#chartGrid` 内容区**（`pointer-events:none`），由 `#dashboardArea.loading` 类驱动；外层 `#mainArea` 滚动不受影响 | `analysis.css` |
| ③ A3 标签呈现 | 实时 SSE 分析中：**首图**（无任何标签时）立即展示；**后续** `render_dashboard` 仅后台 `createTab` 入队（`state.pendingTabs`），不切走当前标签；整轮 `done` 后 `setLoading(false)` 再**一次性 `switchTab` 到本轮最终新标签**；`onerror`/清空看板时清空队列不跳转 | `analysis.js` |
| ④ 历史恢复保持现状 | `renderChartSpec(spec, restore=true)` 走原逻辑（逐条重建并停在最后标签），不参与 A3 排队 | `analysis.js` |
| ⑤ × 关闭禁用 | 分析中标签页**可切换查看**，但 × 关闭禁用（CSS `#dashboardArea.loading .tab-close` + `closeTab` 内 `state.loading` 双保险） | `analysis.css` / `analysis.js` |

**行为矩阵**：

| 状态 | 输入/发送/工具栏 | KPI/图表 hover·点击·下钻·导出·⚙ | 外层滚动 | 标签切换 | 标签 × 关闭 | 旧图查看 |
|---|---|---|---|---|---|---|
| 分析中 | 禁用 | 锁定 | 可用 | **可用** | 禁用 | **清晰可见、可滚动** |
| 分析完成 | 启用 | 解锁 | 可用 | 可用 | 可用 | 正常 |

**边界**：
- 一次分析多张图（多次 `render_dashboard`）：中途停留当前标签不被反复打断；`done` 只切 1 次到最终新标签
- 纯文字/无数据回复：`pendingTabs` 为空 → `done` 不切换
- 首图即时展示（避免首次分析空看板），其后图后台排队
- `renderTabs()` DOM 重建后 CSS 类状态化规则依旧生效（× 禁用不失效）

## 7. 实施清单（v1.1 早期规划 · 实际已在 v1.x 实现）

> **⚠️ 历史注记**：本节为早期 CRAFT 规划清单（含已废弃的 desktop React / recharts / grid-stack 表述）。实际页面已以 **Web 独立页面形态**实现于 `channel/web/analysis.html` + `analysis.js`（Chart.js CDN），契约升级见 §6.4（v2），v1.2 改动清单见 **§12.6**。下表仅作决策史参考。

### Phase 1 — 后端 + 权限接入
- [ ] 新增 `AnalysisContextHandler` / `AnalysisTemplateApplyHandler`（`POST /api/analysis/template/apply` 返回模板看板指令，不直接聚合数据；全部 `_require_auth()` + 按 `scope` 过滤）
- [ ] **新增 `AnalysisChatHandler` 专用对话端点**：`_check_wecom_auth()` 解析企微 userid，构造 `WebMessage` 时 `msg.from_user_id = userid`（**关键：不能用 session_id**），防止身份泄漏
- [ ] **新增 `AnalysisHistoryHandler`**（`GET /api/analysis/history`）：复用 `load_history_page()` 返回历史消息（含 ChartSpec JSON）
- [ ] 注册 URL 路由；`api/client.ts` 新增对应方法

### Phase 2 — 前端框架
- [ ] 安装 `recharts`、`react-grid-layout`
- [ ] 定义 `types/analysis.ts`（ChartSpec + SuggestionSpec，含 `no_data_message` 字段）
- [ ] 新增 `DataAnalysisPage.tsx` 及子组件（DashboardGrid / ChartRenderer / AnalysisChat / TemplatePicker / SuggestionPanel / KpiCard）
- [ ] `App.tsx` 加路由、`NavRail.tsx` 加导航、`i18n.ts` 加文案
- [ ] **ChartRenderer 三层降级兜底**：`validateChart` 渲染前校验；`unknown_type`/`missing_numeric_field` 降级为表格、`empty_data` 渲染空状态卡片、异常结构渲染错误提示卡（见 §6.4.2）
- [ ] **ChartRenderer 非法 JSON 兜底**：agent 返回解析失败时提示"未能生成图表，请重新描述"，不崩溃（§6.7#7）
- [ ] **看板容量上限 + 分看板**：上限 20 卡、支持多命名看板页签（§6.7#2）
- [ ] **独立 session_id**：数据分析页使用独立 session_id，不与全局对话页共用（§6.7#16）
- [ ] **session_id 持久化**：专用智能体的 `session_id` 存 `localStorage`，再次进入自动恢复会话
- [ ] **模板↔表单映射**：模板定义 `required_forms`，前端按用户表单权限动态锁定模板（§6.7#18）
- [ ] **看板布局持久化**：保存 grid-stack 的 x/y/w/h，恢复时按布局还原（§6.7#17）
- [ ] **图表联动下钻交互**：图表卡片可点击，点击下发"按该维度下钻"需求（§6.7#22）
- [ ] **图表编辑/重跑**：卡片提供编辑入口，可改时间/维度后重新生成该图（§6.7#27）
- [ ] **建议反馈闭环**：建议卡片 👍 采纳/忽略（§6.7#29）；**重复分析去重**提示（§6.7#33）
- [ ] **0/负值/NaN 处理**：validateChart 补充，饼图 0 值归入"其他"（§6.7#34）；**骨架屏**占位（§6.7#30）
- [ ] **图表数据缓存**：固定模板+时间结果短期缓存 5 分钟（§6.7#31）

### Phase 3 — 专用智能体 + 主动分析
- [ ] 新增 `kingdee-analysis` Agent Profile（system prompt 注入 `userid` + `scope`，塑造分析师人设；含"无关问题拒绝 + 无数据返回空 ChartSpec"边界约束）
- [ ] **校验专用 Agent 金蝶能力**：workspace 内金蝶 MCP 配置 + `kingdee-query` skill 启用（§6.7#13）；始终加载 `customization-guide.md` 适配自定义字段（§6.7#14）
- [ ] 新增 `render_dashboard` 工具（按 `scope` 过滤）：**前端从工具结果提取 ChartSpec**，单一输出通道（§6.7#15）
- [ ] **`append_to_board` 语义实现**：模板看板返回多图表 `append=false` 替换/重建看板；动态下钻返回单图表 `append=true` 追加（§6.4）
- [ ] 对话接入 `AnalysisChatHandler`：选模板自动触发智能体分析、建议卡片一键执行、建议面板累积
- [ ] **会话串行处理**：同一会话排队执行，发送中禁用输入，避免图表顺序错乱（§6.7#1）
- [ ] **图表联动下钻**：点击图表卡片 → 自动下发"按该维度继续下钻"对话需求 → agent 返回更深分析并追加看板（§6.7#22）
- [ ] **下钻走统一端点**：下钻需求与正常对话同一 `AnalysisChatHandler`，权限拦截统一，防越权探测（§6.7#23）
- [ ] **敏感字段白名单 + 指标口径**：ChartSpec 支持字段级白名单与 `metric_definition`，图表标题标注口径（§6.7#24/#25）
- [ ] **多用户会话验证**：不同企微 userid 打开同一页面，数据按各自 `scope` 隔离；无表单权限的用户无法动态查询对应表单
- [ ] **历史会话验证**：退出再进入恢复历史对话 + 看板（含布局，§6.7#17）；无关问题只回复文字不追加图表；无数据时显示空状态卡片

### Phase 4 — 联调打磨
- [ ] 看板网格拖动/缩放/导出
- [ ] 空/加载/错误态、权限不足引导、多用户会话隔离验证
- [ ] **会话过期引导**：401 → 重新认证且保留本地看板（§6.7#4）
- [ ] **金蝶服务异常错误态**：503/超时明确提示（§6.7#5）
- [ ] **敏感数据脱敏开关**（§6.7#6）；**数据刷新 + 时间戳**（§6.7#9/#26）；**PNG/Excel 导出 + 导出权限校验**（§6.7#10/#32）
- [ ] **i18n 全量文案**（§6.7#11）；**窄屏单列堆叠**（§6.7#12）
- [ ] **清空会话/重置看板**：二次确认后重置，避免误删历史（§6.7#28）

---

## 8. 关键依赖与风险

| 风险 | 应对 |
|------|------|
| **Web 对话链路身份泄漏**（`session_id` 冒充 web 管理员全权） | ✅ 已解决：`AnalysisChatHandler` 构造消息时 `msg.from_user_id = 企微 userid`（`override_user_id`），依赖 `agent_stream.py:1721` 工具拦截兜底 |
| **企微身份获取** | ✅ 已解决：企微 OAuth 免密登录（`target=analysis`）+ 密码管理员 `web_password`（全权），复用 `_check_wecom_auth()` / `_require_auth()` |
| `scope` 过滤字段（salesman/owner） | 实施时与金蝶单据字段核对（沿用 `_saler_condition` / `FSalerId.FName`） |
| 图表库 CDN 可用性 | Chart.js 4.4.7 CDN（与既有金蝶看板一致）；离线/内网环境需将 CDN 资源本地化 |
| 多用户并发会话隔离 | 用 agent_id + session_id 复合 key + 每会话绑定真实 userid，回归测试 |

---

## 9. 开放问题

1. ~~desktop 端企微会话获取~~ → ✅ 已解决（企微 OAuth + `web_password`，见 §0）
2. 金蝶 `scope='self'` 时按 `salesman`（业务员）还是 `owner`（单据归属人）字段过滤？—— 建议 `salesman`（已有 `_saler_condition` 用 `FSalerId.FName`）
3. 建议面板进入页面时默认展开还是收起？—— 已按默认展开实现
4. 第二期是否新增「生产成本分析」「采购分析」「费用分析」模板？
5. v1.2：多系列字段较多时（>3 个）图例/卡片空间是否足够？—— 预留 max 数（暂不限制，agent 按业务建议合理数量）

---

## 10. 测试与验收

| 层级 | 覆盖范围 |
|------|---------|
| **单元测试** | `permission_checker` 各 scope 过滤正确；`validateChart` 各兜底分支；ChartSpec JSON Schema 校验 |
| **后端集成测试** | `AnalysisChatHandler` 身份注入（企微 userid vs session_id）；`AnalysisHistoryHandler` 历史分页返回；模板`required_forms` 权限锁定 |
| **多用户隔离测试** | 不同企微 userid 同一页面数据隔离；无表单权限用户动态查询被拦截（`agent_stream.py:1721`） |
| **历史恢复测试** | 退出再进入恢复对话 + 看板布局；无关问题只文字不追加图；无数据显示空状态卡 |
| **图表健壮性测试** | 非法 JSON、未知类型降级表格、0/负值处理、看板容量上限、下钻/重跑/反馈交互 |
| **E2E 验收** | 完整用户旅程：选模板→看板→建议下钻→重跑→清空会话，权限不足引导 |

---

## 11. 性能与规模预估

| 维度 | 预估 | 说明 |
|------|------|------|
| 单看板卡片数 | ≤ 20 卡 | 容量上限（§6.7#2） |
| 单图表数据点 | ≤ 50 点 | agent 降采样（§6.7#3） |
| 模板结果缓存 | 5 分钟 TTL | 固定模板+时间范围命中复用（§6.7#31） |
| 并发会话 | 依赖企微并发 | 每会话独立 queue + agent_id/session_id 隔离 |
| 金蝶 MCP 压力 | 靠缓存 + 降采样控制 | 避免高频重复查询压垮金蝶 API |
| ChartSpec 传输 | 从 `render_dashboard` 工具结果提取 | 单一通道，一次返回完整 JSON（§6.7#15） |

---

## 12. 图表数据丰富化 + 看板布局改造（v1.2）

> 本次在已实现版本上做新一轮增强，依据多轮需求确认（三项原始诉求 + 两轮遗漏决策）。

### 12.1 需求来源

1. **图表数据不详细**：图表展示更多数据（数据点多字段 + 完整明细可查看）；每图支持用户选择"数量 + 种类"
2. **定点下钻**：点击图表内某个数据点时，应区分点击位置（该数据点）决定下钻内容，而非整个图表
3. **布局升级**：数据变多后图太小 → 改布局

### 12.2 前端交互决策（多轮确认结论）

| # | 决策点 | 结论 |
|---|--------|------|
| 1 | 数据详细度 | **两者都要**：数据点带伴随指标字段（订单数/数量/占比/环比）+ 全字段明细表可查看 |
| 2 | 数量/种类切换 | **纯前端即时切换**（同一份数据，不重新查金蝶）：显示数量(前5/前10/前20/全部) + 图类型(柱/折线/饼/面积/表格) |
| 3 | 点击数据点交互 | **点击直接下钻该点**（柱/扇/折线点），不弹窗；点击图表空白仍走整图下钻 |
| 4 | 下钻结果落点 | **新标签页**（维持现状，历史图保留） |
| 5 | 多系列对比 | **需要**：数值字段可勾选 2+ 同图对比（分组柱/多线/多面积 + 图例） |
| 6 | 控件布局 | **⚙ 视图设置菜单收纳**（header 只留标题+导出，数量/类型/系列收进 ⚙ 弹出小菜单） |
| 7 | KPI 卡下钻 | **参与下钻**（点击 KPI 卡 = 围绕该指标整图式下钻） |
| 8 | 视图状态 | **每图记忆** `_view{type,limit,series}`，切换标签页回来不丢 |

### 12.3 布局改造决策（多轮确认结论）

| # | 决策点 | 结论 |
|---|--------|------|
| 1 | 看板排布 | **列数可切 1/2**（默认 1 列大图；概览可切 2 列），看板网格动态切换 |
| 2 | 对话区/看板比例 | **对话栏可收起/展开**（收起后看板几乎全屏，右下浮钮恢复） |
| 3 | 单图放大弹窗 | **不需要**（通过切 1 列即放大整图，不加 modal） |
| 4 | 图高策略 | **固定高度(260px) + 图自适应**（数据点悬浮/点击交互保留；表格视图卡内滚动） |
| 5 | KPI 排布 | **KPI 独立 auto-fit 排布**（2~4 个/行紧凑小卡，不受列数切换影响），列数切换只作用于图表网格 |

### 12.4 遗漏项决策（最终检查补充）

| # | 遗漏点 | 结论 |
|---|--------|------|
| 1 | 多系列量纲差异 | **双 Y 轴 · 自动聚类分轴**：以主系列（第 1 个）值域为基准，其余系列与主系列**值域跨度比 ≥20 倍 → 挂右轴**（`yAxisID: y1`），<20 倍 → 共用左轴；仅 bar/line/area 生效。同量纲对比（本月 vs 上月）不拆轴 |
| 2 | KPI 与图表布局冲突 | KPI 独立容器排布（见 §12.3#5） |
| 3 | 定点下钻 agent 上下文 | **`analysis_meta`**（§6.4 v2）：下钻时把 `meta + 点击值` 发给 agent；旧数据无 meta 则回退前端拼接（title+值+当前时间范围） |
| 4 | 字段类型规范 | **数值/百分数分治**（§6.4 v2）：量化=数值(可多系列)；占比/环比=带%字符串(仅展示) |
| 5 | 事件误触 | ⚙/导出/行/数据点点击均 `stopPropagation`，与"卡片下钻"语义严格隔离 |
| 6 | 空数据标签页 | `charts:[] + no_data_message` → **不创建空白标签页、看板区不追加卡片**；`no_data_message` 在**对话区高亮展示一次**（§6.4.1 同步修正） |
| 7 | 导出范围 | **看板导出 = 仅激活标签页**（当前激活标签页全部图表，各 sheet 一张图，维持现状）；单图导出 = 该图全量原始数据（不受"前N"限制）；均过滤 `_` 前缀字段 |
| 8 | 饼图多系列 | 饼图仅单系列；勾选 >1 自动收敛主指标并提示 |
| 9 | 列数切换图表适配 | 切换后调 `chart.resize()` 适配，不整卡销毁重建 |
| 10 | 图例防误触 | 多系列图例禁用"点击隐藏系列"（与下钻语义冲突） |
| 11 | 下钻防重复 | 沿用 `setLoading`：分析中禁用图表/KPI/行点击 |
| 12 | 空字段健壮性 | 数据点缺 `name/value`、值为 null 时跳过/占位 |
| 13 | 含负值系列 | **检测到任一数值系列含负值 → `beginAtZero:false`**（Y 轴按 min~max 自适应，负值完整可读）；全正数据才用 0 基线（bar/line/area 的 y/y1 轴一致处理） |
| 14 | 下钻时间口径 | **以图表原口径为准**：下钻 prompt 明确沿用该图 `analysis_meta.time_range`（历史恢复/时间不一致场景保证与图上数据可比一致）；当前所选时间仅在新对话图无 meta 时作为回退 |

### 12.5 定点下钻交互（核心新能力）

```
用户点击图表内某根柱子「华东客户A」
  → Chart.js onClick 命中 elements[0] → 取该行 xKey 值 + dimensionLabel
  → 前端构造 prompt：图表「客户销售排行」中点击「客户:华东客户A」
     + analysis_meta（口径/时间范围/可下钻方向）
  → 发往 AnalysisChatHandler（身份修正链路）→ agent 定点查询该对象明细
  → 返回 ChartSpec → 新建标签页「华东客户A · 下钻」→ 追加图表
```

- 点击**数据点**（柱/扇区/折线点）→ 定点下钻该对象
- 点击**图表空白**（无 element）→ 整图下钻（原行为保留）
- **表格视图**行点击 → 定点下钻该行
- **KPI 卡**点击 → 围绕该指标整图下钻
- **下钻上下文统一**：定点下钻与整图下钻均附带 `analysis_meta`（口径/维度/时间范围/可下钻方向）；**时间口径以该图 `analysis_meta.time_range` 为准**（保证与图上数据可比一致，见 §12.4#14）；当前所选时间仅在无 meta 的历史/旧数据上回退使用

### 12.6 实施范围（文件级）

| 文件 | 改动 |
|------|------|
| `bridge/agent_initializer.py` 的 `KINGDEE_ANALYSIS_AGENT_MD` | **单一来源** v2/v3 契约（多字段/`dimensionLabel`/`analysis_meta`/字段分治/排行 Top10-20/字段名中文化）；升级判定逻辑按版本标记识别（避免旧标志导致已部署 agent 收不到新契约） |
| `agent/tools/analysis/render_dashboard.py` | description 说明多字段/`dimensionLabel`/隐藏字段语义（透传不改校验） |
| `channel/web/web_channel.py` | 模板 apply instruction 增加"每条数据带伴随指标字段 + 排行返回前20" |
| `channel/web/static/js/analysis.js` | 渲染重构：卡结构(header+⚙+260px)、tooltip 多字段、数量/类型/系列切换、表格视图行下钻、Chart onClick 定点/空白下钻、`_view` 记忆、KPI 独立行、列数切换、对话栏收起、**负值系列自动取消0基线、空 `charts` 不建标签页且 `no_data_message` 对话区高亮** |
| `channel/web/analysis.html` | 对话栏收起按钮、列数切换、展开浮钮 |
| `channel/web/static/css/analysis.css` | ⚙菜单/展开浮钮/表格行 hover/列数切换 active/滚动条 |
| `tests/test_render_dashboard.py` | 多字段透传、`dimensionLabel`/`analysis_meta`/`_`字段保留用例 |

> **部署注意**：专用 agent 的 AGENT.md 运行时来自 `bridge/agent_initializer.py` 的常量 `KINGDEE_ANALYSIS_AGENT_MD`（**单一来源**）；改契约后重启服务即可自动同步，且判定逻辑需按版本标记决定是否覆盖旧 AGENT.md。

### 12.7 最终检查补录决策（v1.2 终审确认）

> 对方案/原型做最终交叉检查后确认的 7 项补充决策，已并入上文各节。

| # | 决策点 | 结论 | 落点 |
|---|--------|------|------|
| 1 | 文档历史残留（desktop/React/recharts/grid-stack） | **全面清理**：§0/§1/§2/§6.7#11#17/§8/§9 已改写为 Web 独立页/Chart.js/列数切换实际实现；§7 保留为"决策史参考"并加醒目历史注记 | §0~§2、§6.7、§7、§8、§9 |
| 2 | 双 Y 轴分轴算法 | **自动聚类分轴**：非主系列值域与主系列比值 ≥20 倍挂右轴，否则共用左轴（同量纲对比不拆轴） | §12.4#1 |
| 3 | 看板导出 Excel 范围 | **仅激活标签页**（维持现状）；单图导出 = 全量原始数据；均过滤 `_` 字段 | §12.4#7 |
| 4 | 下钻附带上下文 | 定点下钻 + 整图下钻均附带 `analysis_meta`；**时间以该图 `analysis_meta.time_range` 为准**（无 meta 才回退当前时间） | §12.4#14、§12.5 |
| 5 | 空数据展示 | `charts:[] + no_data_message` → **不建标签页/看板不追加**，`no_data_message` 对话区高亮展示一次（§6.4.1 同步修正，废弃原"空状态卡片"表述） | §6.4.1、§12.4#6 |
| 6 | 含负值系列 | 任一数值系列含负值 → **取消 0 基线**（`beginAtZero:false`，Y 轴 min~max 自适应）；全正才用 0 基线 | §12.4#13 |
| 7 | 看板列数范围 | **仅 1 列 / 2 列**（移除 3 列；默认 1 列大图），原型与方案同步 | §3#3、§4.1、§12.3#1 |

> **遗留提示（不做为阻塞项）**：历史标签页恢复后每图 `_view` 回默认视图（不持久化到历史记录，接受）；旧数据（无 `analysis_meta`/`dimensionLabel`）定点下钻回退"前端拼接 title+值+当前时间范围"。
