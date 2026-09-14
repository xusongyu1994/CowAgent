# 金蝶数据分析页面 · 部署说明

> 版本：v1.0
> 前置：方案文档 `docs/kingdee-analysis-page-design.md`；原型 `prototype/kingdee-analysis-dashboard-prototype.html`

本文说明如何把**金蝶数据分析页面**部署到真实运行环境（Web 控制台），供企微用户 + 密码管理员使用。

---

## 1. 新增/修改的文件

### 后端（`channel/web/`）
| 文件 | 改动 |
|------|------|
| `web_channel.py` | ① `post_message` 新增 `override_user_id` 参数（身份修正，防止 session_id 冒充管理员全权）；② 新增 5 个数据分析 Handler（Context/Templates/Apply/Chat/History）+ 路由；③ 新增 `AnalysisPageHandler`（服务 `/analysis` 页面）+ 路由；④ OAuth 回调支持 `target=analysis` 跳转 |

### 前端（`channel/web/`）
| 文件 | 说明 |
|------|------|
| `analysis.html` | 数据分析独立页面（对话 + 看板 + 建议面板） |
| `static/js/analysis.js` | 页面逻辑（模板选择/SSE对话/看板渲染/建议/历史恢复/下钻） |
| `static/css/analysis.css` | 页面样式 |

### 智能体
| 文件 | 说明 |
|------|------|
| `agent/tools/analysis/render_dashboard.py` | `render_dashboard` 工具（输出 ChartSpec JSON，前端据此渲染看板） |
| `agent/tools/analysis/__init__.py` | 工具包入口 |
| `agent/tools/__init__.py` | 注册 `RenderDashboard` 工具 |
| `bridge/agent_initializer.py` | `kingdee-analysis` 专用 agent 首次启动时**自动写入人设 AGENT.md**（常量 `KINGDEE_ANALYSIS_AGENT_MD`，单一来源） |

### 配置
| 文件 | 改动 |
|------|------|
| `config-template.json` | 新增 `agents` 数组（注册 `kingdee-analysis`）+ `agent_workspace` + `default_agent_id`；`wecom_open_pages` 加 `"analysis": "数据分析"` |

---

## 2. 部署步骤（真实环境 config.json）

> 真实运行配置在 `config.json`（不在 repo，需手动同步 config-template.json 的改动）。

### 2.1 同步 config 配置
在 `config.json` 中添加：
```json
{
  "agent_workspace": "~/cow",
  "default_agent_id": "default",
  "agents": [
    { "id": "default", "name": "Default" },
    {
      "id": "kingdee-analysis",
      "name": "金蝶数据分析智能体",
      "enabled": true,
      "model": ""   // 可留空继承默认模型，或填专用模型名
    }
  ],
  "wecom_open_pages": {
    "kanban": "金蝶看板",
    "analysis": "数据分析"
  }
}
```

### 2.2 金蝶 MCP（全局，已配置则无需操作）
- `render_dashboard` 工具**不做金蝶查询**，只负责规范化 ChartSpec。
- 真正的金蝶数据查询由 agent 调用 `query_bill_json` 等工具完成。
- 金蝶 MCP Server（`kingdee-k3cloud`）为**全局配置**，专用 agent 复用即可，无需单独配置。
- 若金蝶 MCP 未配置，请先在 config 的 `mcp_servers` 添加金蝶 server。

### 2.3 专用 agent 的 AGENT.md（自动写入）
`bridge/agent_initializer.py` 已实现：当 `kingdee-analysis` 专用 agent 首次初始化时，若其 workspace 的 `AGENT.md` 缺失或仍是默认模板，则**自动写入**金蝶人设 + ChartSpec 契约。**零手动操作。**

> **⚠️ v1.2 注意（契约升级）**：专用 agent 的 AGENT.md 运行时来源是 `bridge/agent_initializer.py` 的 `KINGDEE_ANALYSIS_AGENT_MD` **常量（单一来源）**。改契约后重启服务即可；该函数的跳过判定按版本标记识别，旧部署过的 workspace 缺少最新标记时会自动覆盖重写。

> **⚠️ 未配置专用 agent 时的回退机制**：若 config.json **未**配置 `agents` 数组（`kingdee-analysis` 未注册），数据分析页**仍可使用**——前端与后端会自动回退到**默认 agent**。此时功能可用，只是没有金蝶专用人设（主动下钻/ChartSpec 契约效果略弱）。配置专用 agent 后自动升级为专用人设。无需因未配置而报错。

### 2.4 权限管理（若启用）
数据分析页面按企微用户权限过滤：
- 模板可访问性 = 用户是否拥有模板的 `required_forms` 表单权限（`get_kingdee_form_access`）
- 数据范围 = 用户 `scope`（all / self / self_and_subordinates）
- 需在「权限管理 → 金蝶权限」为用户分配对应表单权限，否则模板锁定、无数据。

---

## 3. 使用方式

### 企微用户
- 企微菜单或直链访问 `/analysis`
- 未认证 → 自动跳转企业微信 OAuth 免密登录 → 返回 `/analysis`
- 权限按企微 userid 生效

### 密码管理员（桌面/浏览器）
- 用 `web_password` 登录后访问 `/analysis`
- 视为全权（`session_web_admin`）

---

## 4. 页面功能

| 功能 | 说明 |
|------|------|
| **模板选择** | 6 个内置模板，按表单权限显示已授权/锁定 |
| **生成看板** | 选模板 → agent 调金蝶查数据 → 输出 ChartSpec → 渲染 KPI/趋势/排行/占比 |
| **对话下钻** | 左侧对话区发指令 → agent 追加图表卡片（`append_to_board=true`） |
| **主动建议** | agent 每次生成后给 2~3 条建议，建议面板 👍采纳/忽略/点击执行 |
| **图表联动下钻** | 点击图表卡片 → 自动下发该维度下钻需求 |
| **图表重跑** | 卡片 ↻ 按钮重新生成（可调整参数） |
| **历史恢复** | session_id 存 localStorage，再次进入恢复对话 + 看板 |
| **清空会话** | 二次确认后重置 |
| **空状态/降级** | 无数据 → 空状态卡；无法绘图 → 降级为表格 |

---

## 5. 验证清单

1. [ ] 重启服务后访问 `/analysis`，页面正常加载
2. [ ] 企微用户访问，显示当前用户 + 权限范围；无权限模板锁定
3. [ ] 选模板 → 生成看板（KPI/趋势/排行/占比）
4. [ ] 对话追加图表、点击图表下钻、建议卡片执行
5. [ ] 无关问题（如"今天天气"）→ agent 拒绝且不生成图表
6. [ ] 无数据/无权限 → 空状态卡；无法绘图 → 降级表格
7. [ ] 退出再进入 → 恢复历史对话 + 看板
8. [ ] 密码管理员全权访问正常；多企微用户数据按 scope 隔离

---

## 6. 已知注意点

- 专用 agent 首次对话会触发 workspace 初始化（含 AGENT.md 自动写入），耗时略长属正常。
- 若企微用户看不到 `/analysis` 入口，检查企微后台菜单配置（`wecom_open_pages` 已含 analysis）。
- OAuth 跳转依赖 `wecom_public_base` 配置；未配置则企微用户无法免密登录，需用密码管理员。
