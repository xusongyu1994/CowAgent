# 上游同步报告 · CowAgent v2.1.9

> 同步日期：2026-09-14
> 上游仓库：`https://github.com/zhayujie/CowAgent`（branch `master`）
> 本地仓库：`https://github.com/xusongyu1994/CowAgent`（fork，branch `master`）
> 合并提交：`e88333d5 Merge upstream/master (zhayujie/CowAgent v2.1.9) into master`

---

## 一、同步概况

| 项 | 值 |
|---|---|
| 同步前本地基线 | v2.1.7（merge-base `a8ab40c9`，2026-08-23） |
| 同步目标版本 | **v2.1.9**（最新 tag，release date 2026-09-14） |
| 引入上游提交 | **296 个** |
| 上游 tag 跨度提交数 | v2.1.7→v2.1.8 = 256；v2.1.8→v2.1.9 = 49（合计 305） |
| 提交类型分布 | fix 102 · feat 91 · docs 20 · test 13 · refactor 3 · perf 1 · other 3 |
| 本地自有提交 | 60 个（合并后领先上游 60） |
| 冲突文件 | 8 个 / 20 处（已按预定决策解决） |
| 同步后状态 | 落后上游 0，工作区干净 |

---

## 二、新功能清单

### 2.1 🤝 多智能体团队（v2.1.8 主线 · 架构级变更）

CowAgent 由单智能体升级为**多智能体框架**：

- **团队管理**：创建/维护多个 Agent，可配置名称、职责、默认模型、技能、知识库，支持从既有 Agent 复制配置。
- **资源隔离**：每个 Agent 独立 workspace / memory / session；知识库与技能可共享也可独立。
- **群组协作**：同一会话内加入多个 Agent，用 `@` 指定某成员应答，各成员使用各自模型。
- **任务委派**：群聊设 lead Agent，按成员职责分派任务，支持多级委派、可配置范围/深度/超时。
- **桌面端团队页**：团队花名册镜像、会话归属、群聊入口（v2.1.9 补充）。

**新增代码**：`agent/team.py`、`agent/team_addressing.py`、`agent/admin.py`、`agent/tools/agent_delegate/`；测试 `test_team_file.py`、`test_team_addressing.py`、`test_agent_delegation.py`、`test_multi_agent_state_isolation.py` 等。
**上游文档**：`docs/multi-agent/`。

### 2.2 📡 多渠道多实例绑定（v2.1.8）

- 同类型 IM 渠道可运行**多个实例**，每个实例绑定**单个 Agent 或一个 Agent 团队**。
- 覆盖：微信、企业微信智能机器人、飞书、钉钉、QQ、Telegram、Slack、Discord 等。
- 渠道可配置「负责人 + 成员」，支持 `@` 提及与委派。
- v2.1.9 修复渠道启停链路：桌面端渠道无法启动、停止流程丢失 `app_module` 查找、QQ 静默断线后不重连。

**新增代码**：`agent/tools/scheduler/recipient_store.py`；测试 `test_channel_instances.py`、`test_cloud_channel_dispatch.py`。

### 2.3 ⏰ 定时任务升级（v2.1.8）

- **控制台手工创建/编辑/运行**任务，可选择渠道实例与收件人。
- **受信任收件人**：按渠道实例维护，任务可投递到指定收件人（不再局限于创建时所在渠道）。
- **执行记录页**：查看历史列表与每次运行详情。
- 交付策略改为 **Web session 始终持久化投递**、运行预览/实例、最新优先排序。
- 修复并发更新导致任务丢失。

**新增代码**：`agent/tools/scheduler/recipient_store.py`；测试 `test_scheduler_run_records.py`、`test_scheduler_task_ordering.py`、`test_scheduler_cross_channel_recipients.py`、`test_scheduler_task_ownership.py`、`test_task_store_concurrency.py`。

### 2.4 📊 上下文用量可视化（v2.1.8）

- **环形用量视图**取代原「清空上下文」按钮，展示上下文构成明细。
- 环形下方可直接触发**智能压缩 / 清空上下文 / 设置最大上下文**。
- 用量基于 **provider 返回的真实 token usage** 计算；`agent_max_context_tokens` 保留为可选成本上限。
- 新增 **`POST /compact_context`** 同步压缩端点；默认上下文预算 64000，预算修改实时生效（80% 触发压缩）。

### 2.5 🤖 模型能力（v2.1.8 + v2.1.9）

- **新模型**：`deepseek-flash`（DeepSeek V4.1 Flash）、`gpt-6-astra`（Responses API 工具调用）、`claude-fable-5-1`、`qwen3.8-flash`、`glm-5.3-flash`、`gemini-3.8-flash`，视觉模型 `deepseek-v4-flash-vision-exp`。
- **模型回退链**：v2.1.8 引入单一 fallback 模型；**v2.1.9 升级为有序 fallback 链**（主模型失败时依次尝试），并修复凭证按「实际路由到的 provider」解析。
- **模型目录（Model Catalog）**：provider 可配置模型清单（名称/类型/上下文窗口/最大输出）；v2.1.9 改为**预设之上的 overlay**，并可在控制台与桌面端编辑。
- **图像模型**：新增 `gpt-image-2.5-flare`、`gpt-image-2.5-sunburst`。

### 2.6 🔍 搜索供应商（v2.1.8）

新增 6 个 web_search 供应商：

| 供应商 | 说明 |
|---|---|
| AnySearch | 支持匿名模式 |
| Serply | Google/Bing SERP API |
| Parallel Search | — |
| Tavily | 面向 LLM 优化的搜索 API |
| SearXNG | 自托管，仅需实例 URL |
| Keenable | 支持匿名、无需 API Key（v2.1.9 改为显式 opt-in） |

同时支持 **MCP 工具名前缀**、过期 Streamable HTTP 会话恢复。

### 2.7 📝 工作区文件在线编辑（v2.1.8）

- 工作区 / 长期记忆 / 技能定义中的文本文件（Markdown、代码、CSV、HTML、纯文本）可直接编辑保存。
- 快捷键 `Ctrl+S` 保存、`Esc` 退出、`Tab` 缩进。
- **安全保存**：按打开时的文件修改时间做冲突检测，Agent 已改动则先确认；关闭面板/切换文件/切换会话/切换工作区时对未保存内容弹确认。

### 2.8 🧾 运行记录 Runs 体系（v2.1.8 底层能力）

- 持久化 **runs** 表；消息归属到 run；子 Agent 运行记录挂在父 run 下；调用方可命名 run 与 parent。
- 调度任务执行写入全局 runs 表；控制台支持 run 历史分页、删除、详情 Markdown 切换。
- **全局会话索引合并**：所有 Agent 会话合并到单一 `index.db`，按 `agent_id` 键控（含一次性迁移，见 §四）。

### 2.9 🔌 其他新增

- **OpenAI 兼容 API**：`POST /v1/chat/completions`（`test_openai_chat_api.py`）。
- **结构化分块**：记忆/知识 Markdown 按标题结构分块，并记录 chunker 版本、过期时提示重建。
- **Agent 工作区管理**：Web 端管理与核心文件编辑（`feat(web): manage agent workspaces and core files`）。
- **备份增强**：备份包含所有 Agent workspace，修复嵌套归档/恢复布局/多 Agent 版本兼容。
- **评估工具**：最小化 Agent 轨迹评估流程（`tests/trajectory_eval.py`）。
- **网关归属**：OrcaRouter 网关请求来源标记。

### 2.10 🛠 v2.1.9 精炼与修复要点

- 会话内多智能体选择器增加 **lead Agent 标记**，单 Agent 场景视图精简。
- 修复非 lead Agent 委派失败、成员 Agent 生成图片无法渲染。
- 配置容错：容忍 `config.json` 的 UTF-8 BOM；停止登录前 401 轮询。
- 媒体 URL 类型按解析后路径判定；语音 silk 先解码为 wav 再转 mp3（不再覆盖源文件）。
- 百度翻译在全部重试失败后正确上报 API 错误；百度文心 `IMAGE_CREATE` 不支持时返回错误信息而非崩溃。
- `run_in_background` 限定长时进程，避免任务过早标记完成；工具输出截断按字节正确上报原因。
- 控制台移动端布局改进；桌面端多智能体团队菜单显示修复。

---

## 三、本地定制兼容性

本次同步保留了 fork 的全部本地开发（金蝶数据分析页、表单级权限体系、企微定制、kingdee-query skill）。冲突解决记录：

| 文件 | 处理方式 |
|---|---|
| `agent/protocol/agent.py` | 保留本地 `set_current_user`（身份绑定）+ 引入上游 `_resolve_model_spec`（模型规格解析） |
| `agent/tools/__init__.py` | 同时注册本地 `RenderDashboard` 与上游 `AgentDelegateTool` |
| `agent/tools/scheduler/integration.py` | **采用上游**「Web session 始终可投递」重构（修复重启后定时推送永久延迟） |
| `bridge/agent_bridge.py` | 保留本地身份注入 + 引入上游 `_begin_run` 运行追踪 |
| `channel/web/chat.html` | 保留本地权限管理模态框 + 引入上游 run-detail 执行详情与 doc-editor |
| `channel/web/static/css/console.css` | 保留 fork 自定义样式 + 引入上游 agents 页面样式 |
| `channel/web/static/js/console.js` | **保留揽盛电气品牌 logo**；合并上游 agents 抽屉 / 文档未保存守卫 / 权限门逻辑 |
| `channel/web/web_channel.py` | 分析 handlers（本地）与 `SkillContentHandler`（上游）并存；`post_message` 融合 `override_user_id` / `override_agent_id` 参数；`KingdeeKanbanHandler` / `SkillContentHandler` 结构重建 |

**本地配置现状（`config.json`）**：

- `agents` 已为多 Agent 结构：`default` + `kingdee-analysis`（与上游多智能体框架一致，无需改结构）。
- `agent_max_context_tokens: 180000` —— 上游默认 64000 且改为「模型推导 + 可覆盖」，本地该值仍作为**显式上限覆盖**生效，无需改动；如需与上游默认对齐可自行调整。
- `wecom_open_pages`（`kanban` / `analysis`）为 fork 专有配置，不受上游影响。

---

## 四、升级注意（首次启动自动迁移）

上游在 `app.py` 启动流程中内置一次性迁移，**上线时首次启动会自动执行**：

| 迁移 | 入口 | 说明 |
|---|---|---|
| 团队花名册迁移 | `app.py:_migrate_team_roster()` | 从 `config.json` 迁移到独立 `team.json` |
| 会话全局合并 | `app.py:_migrate_conversations()` | 各 Agent 会话合并进全局 `index.db`（按 `agent_id`），源表归档并写 `_migration_meta` 标记 |
| 模型 fallback 迁移 | `config._migrate_chat_fallback` | 单一 fallback → 有序 fallback 链 |
| 调度任务存储迁移 | `agent/tools/scheduler/integration.py:_migrate_legacy_task_stores` | 旧任务存储迁移到按 Agent 归属 |

建议：**升级前备份 `~/.cow`（或对应 state 目录）**，并首次启动后检查上述迁移日志。

---

## 五、验证结果

| 项 | 结果 |
|---|---|
| Python 编译（8 个冲突文件） | 通过 |
| `node --check channel/web/static/js/console.js` | 通过 |
| 冲突标记残留 | 0 |
| 相关测试（分析 handler / agent steering 等） | 88 passed |
| 已知无关失败 | 2 项 Windows 路径断言（合并前既有问题） |

---

## 六、参考

- 上游发布说明（已随本次合并入库）：`docs/releases/v2.1.8.mdx`、`docs/releases/v2.1.9.mdx`
- 上游官方变更日志：`https://github.com/zhayujie/CowAgent/compare/2.1.7...2.1.9`
- 上游多智能体文档：`docs/multi-agent/`
