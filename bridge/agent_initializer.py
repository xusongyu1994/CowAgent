"""
Agent Initializer - Handles agent initialization logic
"""

import os
import asyncio
import datetime
import threading
import time
from typing import Optional, List

from agent.protocol import Agent
from agent.tools import ToolManager
from common.log import logger
from common.utils import expand_path

# 金蝶数据分析专用智能体的 AGENT.md（人设 + ChartSpec 契约 + 边界约束）。
# 当 kingdee-analysis 专用 agent 的 workspace 中 AGENT.md 缺失或仍为默认模板时自动写入。
KINGDEE_ANALYSIS_AGENT_MD = """# AGENT.md - 我是谁？

## 我的身份

我是**金蝶数据分析智能体**（id: `kingdee-analysis`），一名资深的企业经营/财务数据分析师，专精金蝶云星空（Kingdee K3 Cloud）数据的经营分析。

我的职责：帮助用户分析销售、订单、应收、出库、库存等经营数据，生成可视化看板，并**主动引导用户层层下钻**发现数据背后的洞察。

## 我的工作方式

1. **主动分析**：用户提出需求后，我先查询金蝶数据，生成看板，并主动解读数据、识别异常、给出下一步分析建议。
2. **分层下钻**：按照"趋势 → 占比/排行 → 异常检测 → 归因下钻（客户/产品/业务员）→ 方案建议"的路径，由浅入深引导用户。
3. **看板输出**：需要生成看板时，必须调用 `render_dashboard` 工具，将数据组织为规范的 ChartSpec JSON。

## 金蝶查询规则

- 复用 `kingdee-query` skill 的查询规范：先用 `query_bill_json` 查列表，再按需用 `view_bill` 看详情。
- **必须遵守** `customization-guide.md` 中的企业自定义字段/ID映射规则，禁止用通用字段猜测。
- 日期过滤用半开区间 `FDate >= 'YYYY-MM-DD' AND FDate < 'YYYY-MM-DD+1'`。
- 单据状态码：`Z`=暂存草稿，`A`=创建，`B`=审核中，`C`=已审核，`D`=重新审核。经营统计默认用已审核（状态 `C`）。
- **产品线字段**：本系统的「产品线」对应金蝶物料的**描述**字段（`FDescription`，即 `BD_MATERIAL.FDescription`）。产品线销售分析时按此字段聚合。⚠️ 使用前必须先用 `query_metadata(form_id="BD_MATERIAL")` 验证 `FDescription` 是否存在（`kingdee-query` skill 未默认验证此字段），并确认能否通过销售订单行级关联 `FMaterialId.FDescription` 带出；若 `FDescription` 不可用，则回退用 `FMaterialId.FName`（物料名称）作为产品线维度，并告知用户。
- **应收账款逾期字段**：应收账款分析查询 `AR_receivable`（应收单，立账类型=财务应收）。**逾期判定以到期日字段 `FENDDATE`（到期日期）为准**：逾期天数 = 今天 − `FENDDATE`；逾期金额 = 应收金额（`FALLAMOUNTFOR`）− 已结金额（`FRECTOTALAMOUNTFOR`）＝ 未结余额。分段统计：未逾期 / 1-30天 / 31-60天 / 61-90天 / 90天+。与后端 `KingdeeArOverdueHandler` 口径保持一致。
- **样品单/报价单转化分析**（参考看板"转化统计"逻辑）：分析样品单、报价单转化为正式销售订单的情况。
  - 数据源：销售订单 `SAL_SaleOrder` + 报价单 `SAL_QUOTATION`。
  - 样品单识别：销售订单的**客户订单号字段**（`F_APZV_Text_l4m`，兜底 `F_JR_KHDDH`）含"样品"或"样品单"。
  - 转化匹配：按（客户 `FCustId.FName` + 物料 `FMaterialId.FNumber` + 规格 `FMaterialId.FSpecification` + 含税单价 `FTaxPrice` + 日期先后）判断样品/报价是否转成正式订单。
  - 关键指标：报价转化率（已转化报价单数/报价单总数）、样品转化率（已转化样品单数/样品单总数）、转化金额（由样品/报价转化的销售订单含税金额）、按客户维度的转化统计、正式订单中样品单占比（样品单数/订单总数）。
- **大数据处理（必须遵守，避免上下文溢出）**：查询金蝶数据时，若预计行数超过 20 行或查询结果较大，**必须用 `query_bill_to_file` 把数据落盘到文件，再用 python 脚本聚合计算**（分组求和/排行/占比），**禁止把大量明细直接放入上下文**。只有聚合后的结果（KPI、排行、趋势等）才用于生成看板。这样既能处理海量数据，又避免触发上下文压缩导致数据丢失。

## 看板输出契约（ChartSpec JSON v2）

生成看板时调用 `render_dashboard` 工具，参数必须符合：

```json
{
  "dashboard_title": "看板标题",
  "append_to_board": false,
  "charts": [
    {
      "type": "bar|line|pie|area|kpi|table",
      "title": "图表标题",
      "dimensionLabel": "客户",
      "xKey": "name",
      "yKey": "value",
      "analysis_meta": {
        "metric": "销售额=已审核订单含税合计",
        "dimension": "客户",
        "time_range": "2026-02-01 ~ 2026-02-28",
        "drill_candidates": ["订单构成", "产品分布", "业务员明细"]
      },
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
      ]
    }
  ],
  "suggestions": [
    { "title": "建议标题", "prompt": "点击后发送的指令" }
  ]
}
```

规则（v2）：
- **模板初始看板**：`append_to_board=false`，一次返回多个图表（KPI 指标卡、趋势、排行、占比）。
- **动态下钻/对话新增**：`append_to_board=true`，每次返回 1 张新图表追加。
- **字段名中文化（v3 强约定）**：`data` 数据点与伴随指标的键名**一律用中文**（金额/订单数/数量/占比/环比…），**禁止** `value`/`amount`/`order`/`qty` 等英文键（主数值键可用中文如「金额/数量/订单数」，前端会自动识别数值字段；即便主数值用英文 `value`，其余伴随指标也必须是中文键）。键名越语义化，前端 tooltip/表格/导出的中文展示越准确。
- **数据点多字段**：除主维度/主数值外，每条数据尽量附带 2~4 个最有价值的伴随指标（订单数/数量/占比/环比）。
- **字段类型分治（强约定）**：量化指标（金额/数量/订单数等）必须是**数值**（前端可勾选为多系列对比）；占比/环比/同比等百分比指标返回**带 % 的字符串**（仅展示，不参与多系列）。
- **隐藏字段**：`_` 前缀键（如 `_custId`）为内部标识，**前端不展示**，仅用于定点下钻精确定位。
- **dimensionLabel（每图可选）**：数据点维度的业务名（客户/产品线/物料…），用户点击数据点下钻时前端据此精确表达。
- **analysis_meta（每图可选）**：该图口径自述 `{metric, dimension, time_range, drill_candidates}`，下钻时携带保证口径/时间范围准确。
- **排行条数**：排行类默认返回前 10~20 名（前端提供 前5/前10/前20/全部 切换）。
- 指标口径需在图表标题或 `analysis_meta.metric` 中注明（如"已审核订单含税合计"）。

## 边界约束（重要）

1. **无关问题**：若用户提问与金蝶经营分析无关（如天气、闲聊），**拒绝回答**，引导回数据分析场景；**不生成看板**。
2. **无数据/无权限**：若查询无数据或用户无对应表单权限，返回空 `charts: []` + 明确的 `no_data_message` 文字说明，**不编造数据**。
3. **权限合规**：始终遵守当前用户的 `scope`（all / self / self_and_subordinates），只能查询已授权表单。
4. **建议数量**：每次回复末尾建议卡片限 2~3 条，避免刷屏。
5. **重复分析**：若用户请求的维度已分析过，提示"该维度已分析过，可查看历史卡片或换维度"。

## 我的性格

专业、严谨、有洞察力。用通俗语言解释数据含义，主动给出可执行的经营建议，不一味罗列数据。
"""


def _ensure_kingdee_analysis_agent(workspace_root: str):
    """若 kingdee-analysis 专用 agent 的 AGENT.md 缺失或仍为默认模板，则写入金蝶人设。

    ensure_workspace 只会在 AGENT.md 不存在时生成默认模板；本函数负责把专用
    人设（ChartSpec 契约 + 边界约束）固化到该专用 agent 的 workspace。
    采用"存在且含最新版本标记"则跳过，避免覆盖用户后续自定义。
    """
    agent_path = os.path.join(workspace_root, "AGENT.md")
    try:
        if os.path.exists(agent_path):
            with open(agent_path, "r", encoding="utf-8") as f:
                content = f.read()
            # 默认模板含占位提示 "_你不是一个聊天机器人" → 覆盖为金蝶人设。
            # 版本标记（v3 契约关键词"字段名中文化（v3"）：已写入金蝶人设但缺少 v3 标记
            # （旧版为 analysis_meta/v2，只有产品线字段更早）→ 也更新为最新版，强制推送存量，
            # 保证"字段名一律中文"约束能随重启覆盖升级；同时避免反复覆盖用户后续自定义
            # （新内容含 v3 标记则跳过）。
            if "你不是一个聊天机器人" not in content and "字段名中文化（v3" in content:
                return  # 已是最新 v3 金蝶人设，跳过
        with open(agent_path, "w", encoding="utf-8") as f:
            f.write(KINGDEE_ANALYSIS_AGENT_MD)
        logger.info(f"[AgentInitializer] Wrote kingdee-analysis AGENT.md to {workspace_root}")
    except Exception as e:
        logger.warning(f"[AgentInitializer] Failed to write kingdee-analysis AGENT.md: {e}")


# Module-level lock to serialize scheduler init across concurrent sessions
_scheduler_init_lock = threading.Lock()

# Guards the in-flight memory-sync set below so concurrent session inits for
# the same workspace don't each dispatch a redundant background sync thread.
_memory_sync_lock = threading.Lock()
# Workspaces with a memory sync currently running in the background. A new
# request for the same workspace is dropped instead of forking another thread,
# so a burst of messages can't stack up dozens of embedding HTTP calls.
_memory_sync_inflight: set = set()


class AgentInitializer:
    """
    Handles agent initialization including:
    - Workspace setup
    - Memory system initialization  
    - Tool loading
    - System prompt building
    """
    
    def __init__(self, bridge, agent_bridge):
        """
        Initialize agent initializer
        
        Args:
            bridge: COW bridge instance
            agent_bridge: AgentBridge instance (for create_agent method)
        """
        self.bridge = bridge
        self.agent_bridge = agent_bridge
    
    def initialize_agent(
        self,
        session_id: Optional[str] = None,
        agent_id: Optional[str] = None,
    ) -> Agent:
        """
        Initialize agent for a session
        
        Args:
            session_id: Session ID (None for default agent)
            agent_id: Agent profile identifier. Omit for the configured default.
        
        Returns:
            Initialized agent instance
        """
        from agent.registry import get_agent_registry
        from common.runtime_identity import current_identity

        # An explicit agent_id wins (admin, warmup, tests); otherwise follow
        # the identity routing established for this message.
        identity = current_identity()
        profile = get_agent_registry().get(agent_id or identity.agent_id)
        workspace_root = profile.workspace
        
        # Migrate API keys
        self._migrate_config_to_env(workspace_root)
        
        # Load environment variables
        self._load_env_file()
        
        # Initialize workspace
        from agent.prompt import ensure_workspace, load_context_files, PromptBuilder
        workspace_files = ensure_workspace(workspace_root, create_templates=True)

        # 金蝶数据分析专用智能体：自动写入人设 + ChartSpec 契约 AGENT.md
        if profile.id == "kingdee-analysis":
            _ensure_kingdee_analysis_agent(workspace_root)
        
        if session_id is None:
            logger.info(f"[AgentInitializer] Workspace initialized at: {workspace_root}")
        
        # Setup memory system
        memory_manager, memory_tools = self._setup_memory_system(workspace_root, session_id)
        
        # Load tools
        tools = self._load_tools(workspace_root, memory_manager, memory_tools, session_id)
        
        # Initialize scheduler if needed
        self._initialize_scheduler(
            tools, session_id, workspace_root=workspace_root, agent_id=profile.id
        )
        
        # Load context files
        context_files = load_context_files(workspace_root)
        
        # Initialize skill manager
        skill_manager = self._initialize_skill_manager(workspace_root, session_id)
        
        # Build system prompt
        prompt_builder = PromptBuilder(workspace_dir=workspace_root, language="zh")
        runtime_info = self._get_runtime_info(workspace_root)
        runtime_info["agent_id"] = profile.id
        runtime_info["agent_name"] = profile.name
        
        system_prompt = prompt_builder.build(
            tools=tools,
            context_files=context_files,
            skill_manager=skill_manager,
            memory_manager=memory_manager,
            runtime_info=runtime_info,
        )
        
        # Get cost control parameters
        from config import conf
        max_steps = conf().get("agent_max_steps", 20)
        max_context_tokens = conf().get("agent_max_context_tokens", 50000)
        
        # Create agent
        agent = self.agent_bridge.create_agent(
            system_prompt=system_prompt,
            tools=tools,
            max_steps=max_steps,
            output_mode="logger",
            workspace_dir=workspace_root,
            skill_manager=skill_manager,
            enable_skills=True,
            max_context_tokens=max_context_tokens,
            runtime_info=runtime_info  # Pass runtime_info for dynamic time updates
        )
        
        # Attach memory manager and share LLM model for summarization
        if memory_manager:
            agent.memory_manager = memory_manager
            if hasattr(agent, 'model') and agent.model:
                memory_manager.flush_manager.llm_model = agent.model

        agent.agent_id = profile.id
        agent.agent_profile = profile
        agent.workspace_dir = workspace_root

        # Bind the system-prompt model line to the agent's *effective* model so a
        # per-session override (see AgentLLMModel.set_session_override) shows up
        # there too. Without this the prompt keeps reporting the global config
        # model, and the LLM — which reads that line — answers with the wrong
        # model name even though the actual API call used the session's model.
        llm = getattr(agent, "model", None)
        if llm is not None and hasattr(llm, "model"):
            runtime_info["_get_model"] = lambda: getattr(llm, "model", None) or conf().get("model", "unknown")

        # Restore persisted conversation history for this session
        if session_id:
            self._restore_conversation_history(agent, session_id)

        # Start daily memory flush timer (once, on first agent init regardless of session)
        self._start_daily_flush_timer()

        return agent

    def _restore_conversation_history(self, agent, session_id: str) -> None:
        """
        Load persisted conversation messages from SQLite and inject them
        into the agent's in-memory message list.

        Only user text and assistant text are restored. Tool call chains
        (tool_use / tool_result) are stripped out because:
        1. They are intermediate process, the value is already in the final
           assistant text reply.
        2. They consume massive context tokens (often 80%+ of history).
        3. Different models have incompatible tool message formats, so
           restoring tool chains across model switches causes 400 errors.
        4. Eliminates the entire class of tool_use/tool_result pairing bugs.
        """
        from config import conf
        if not conf().get("conversation_persistence", True):
            return

        try:
            from agent.memory import get_conversation_store
            store = get_conversation_store(agent.workspace_dir)
            max_turns = conf().get("agent_max_context_turns", 20)
            # Scheduler tasks run on a stable isolated session per task and
            # can fire many times a day; a smaller restore window keeps prompt
            # cost bounded while still letting the agent see "last few" runs
            # for trend / dedup style logic. Regular chat sessions keep the
            # original heuristic so user dialogues feel continuous.
            if session_id.startswith("scheduler_"):
                restore_turns = max(1, max_turns // 5)
            else:
                restore_turns = max(3, max_turns // 6)
            saved = store.load_messages(session_id, max_turns=restore_turns)
            if saved:
                filtered = self._filter_text_only_messages(saved)
                if filtered:
                    with agent.messages_lock:
                        agent.messages = filtered
                    logger.debug(
                        f"[AgentInitializer] Restored {len(filtered)} text messages "
                        f"(from {len(saved)} total, {restore_turns} turns cap) "
                        f"for session={session_id}"
                    )
        except Exception as e:
            logger.warning(
                f"[AgentInitializer] Failed to restore conversation history for "
                f"session={session_id}: {e}"
            )

    @staticmethod
    def _filter_text_only_messages(messages: list) -> list:
        """
        Extract clean user/assistant turn pairs from raw message history.

        Groups messages into turns (each starting with a real user query),
        then keeps only:
        - The first user text in each turn (the actual user input)
        - The last assistant text in each turn (the final answer)

        All tool_use, tool_result, intermediate assistant thoughts, and
        internal hint messages injected by the agent loop are discarded.
        """

        def _extract_text(content) -> str:
            if isinstance(content, str):
                return content.strip()
            if isinstance(content, list):
                parts = [
                    b.get("text", "")
                    for b in content
                    if isinstance(b, dict) and b.get("type") == "text"
                ]
                return "\n".join(p for p in parts if p).strip()
            return ""

        def _is_real_user_msg(msg: dict) -> bool:
            """True for actual user input, False for tool_result or internal hints."""
            if msg.get("role") != "user":
                return False
            content = msg.get("content")
            if isinstance(content, list):
                has_tool_result = any(
                    isinstance(b, dict) and b.get("type") == "tool_result"
                    for b in content
                )
                if has_tool_result:
                    return False
            text = _extract_text(content)
            return bool(text)

        # Group into turns: each turn starts with a real user message
        turns = []
        current_turn = None
        for msg in messages:
            if _is_real_user_msg(msg):
                if current_turn is not None:
                    turns.append(current_turn)
                current_turn = {"user": msg, "assistants": []}
            elif current_turn is not None and msg.get("role") == "assistant":
                text = _extract_text(msg.get("content"))
                if text:
                    current_turn["assistants"].append(text)
        if current_turn is not None:
            turns.append(current_turn)

        # Build result: one user msg + one assistant msg per turn
        filtered = []
        for turn in turns:
            user_text = _extract_text(turn["user"].get("content"))
            if not user_text:
                continue
            filtered.append({
                "role": "user",
                "content": [{"type": "text", "text": user_text}]
            })
            if turn["assistants"]:
                final_reply = turn["assistants"][-1]
                filtered.append({
                    "role": "assistant",
                    "content": [{"type": "text", "text": final_reply}]
                })

        return filtered
    
    def _load_env_file(self):
        """Load environment variables from .env file"""
        env_file = expand_path("~/.cow/.env")
        if os.path.exists(env_file):
            try:
                from dotenv import load_dotenv
                load_dotenv(env_file, override=True)
            except ImportError:
                logger.warning("[AgentInitializer] python-dotenv not installed")
            except Exception as e:
                logger.warning(f"[AgentInitializer] Failed to load .env file: {e}")
    
    def _setup_memory_system(self, workspace_root: str, session_id: Optional[str] = None):
        """
        Setup memory system
        
        Returns:
            (memory_manager, memory_tools) tuple
        """
        memory_manager = None
        memory_tools = []
        
        try:
            from agent.memory import MemoryManager, MemoryConfig, register_memory_config
            from agent.tools import MemorySearchTool, MemoryGetTool
            from config import conf

            memory_config = MemoryConfig(workspace_root=workspace_root)
            # Publish per workspace, not process-wide: this runs once per Agent,
            # and a single global slot would leave the last one to initialize
            # owning where every Agent's memory is written.
            register_memory_config(memory_config)

            embedding_provider = self._init_embedding_provider(
                memory_config, session_id=session_id
            )

            memory_manager = MemoryManager(memory_config, embedding_provider=embedding_provider)
            self._sync_memory(memory_manager, session_id)

            memory_tools = [
                MemorySearchTool(memory_manager),
                MemoryGetTool(memory_manager)
            ]
            
            if session_id is None:
                logger.info("[AgentInitializer] Memory system initialized")
        
        except Exception as e:
            logger.warning(f"[AgentInitializer] Memory system not available: {e}")
        
        return memory_manager, memory_tools

    def _init_embedding_provider(self, memory_config, session_id: Optional[str] = None):
        """
        Initialize the embedding provider for memory.

        Delegates to the shared factory so agent init, knowledge sync and
        index rebuild all select the same provider:
          A. Default (no `embedding_provider` in config.json):
             Auto-init OpenAI -> LinkAI fallback.
          B. Explicit (`embedding_provider` is set):
             Initialize the requested vendor.
        """
        from agent.memory import create_default_embedding_provider
        return create_default_embedding_provider()

    def _sync_memory(self, memory_manager, session_id: Optional[str] = None):
        """Bring the memory index up to date with the workspace files.

        Runs entirely on a background daemon thread. sync() re-embeds any file
        whose hash changed (MEMORY.md / memory/*.md / knowledge/*.md), and each
        embed_batch is a blocking HTTP call that can take 20-50s from China-side
        networks. Daily memory files change on nearly every session, so keeping
        this on the init path made every user's first message wait for that
        round-trip. The index is only read on the *next* memory search, so a
        slightly stale index for the current turn is an acceptable trade-off —
        the same design MCP tool loading already uses.

        Idempotent per workspace: a burst of concurrent session inits dispatches
        at most one sync thread, so messages can't stack up embedding calls.
        """
        workspace_key = None
        try:
            workspace_key = str(memory_manager.config.get_workspace())
        except Exception:
            workspace_key = None

        with _memory_sync_lock:
            if workspace_key is not None and workspace_key in _memory_sync_inflight:
                return
            if workspace_key is not None:
                _memory_sync_inflight.add(workspace_key)

        def _run():
            try:
                loop = asyncio.new_event_loop()
                try:
                    asyncio.set_event_loop(loop)
                    loop.run_until_complete(memory_manager.sync())
                finally:
                    loop.close()
            except Exception as e:
                logger.warning(f"[AgentInitializer] Memory sync failed: {e}")
            finally:
                if workspace_key is not None:
                    with _memory_sync_lock:
                        _memory_sync_inflight.discard(workspace_key)

        threading.Thread(
            target=_run, daemon=True, name="memory-sync"
        ).start()
    
    def _load_tools(self, workspace_root: str, memory_manager, memory_tools: List, session_id: Optional[str] = None):
        """Load all tools"""
        tool_manager = ToolManager()
        tool_manager.load_tools()
        
        tools = []
        file_config = {
            "cwd": workspace_root,
            "memory_manager": memory_manager
        } if memory_manager else {"cwd": workspace_root}
        
        for tool_name in tool_manager.tool_classes.keys():
            try:
                # Skip web_search if no API key is available
                if tool_name == "web_search":
                    from agent.tools.web_search.web_search import WebSearch
                    if not WebSearch.is_available():
                        logger.debug("[AgentInitializer] WebSearch skipped - no search provider configured")
                        continue

                # Skip evolution_undo when self-evolution is disabled: with no
                # evolution there is nothing to roll back, so the tool is dead weight.
                if tool_name == "evolution_undo":
                    from agent.evolution.config import get_evolution_config
                    if not get_evolution_config().enabled:
                        logger.debug("[AgentInitializer] evolution_undo skipped - self-evolution disabled")
                        continue

                # Special handling for EnvConfig tool
                if tool_name == "env_config":
                    from agent.tools import EnvConfig
                    tool = EnvConfig({"agent_bridge": self.agent_bridge})
                else:
                    tool = tool_manager.create_tool(tool_name)

                if tool:
                    # Apply workspace config to file operation tools.
                    # Merge into the existing tool.config (set by ToolManager from
                    # config.json's `tools.<name>` section) instead of replacing
                    # it, otherwise per-tool user configs (e.g. browser.cdp_endpoint)
                    # would be silently dropped.
                    if tool_name in ['read', 'write', 'edit', 'bash', 'search_files', 'ls', 'web_fetch', 'send', 'browser']:
                        merged_config = dict(getattr(tool, 'config', None) or {})
                        merged_config.update(file_config)
                        tool.config = merged_config
                        tool.cwd = merged_config.get("cwd", getattr(tool, 'cwd', None))
                        if hasattr(tool, 'timeout'):
                            # create_tool() builds the instance before tool_configs is
                            # merged in, so a config-derived .timeout is frozen at its
                            # __init__-time default; re-derive it here like cwd above,
                            # for any tool that has one (not name-gated to grep,
                            # so a future tool with a .timeout attribute isn't missed).
                            tool.timeout = merged_config.get("timeout", getattr(tool, 'timeout', None))
                        if 'memory_manager' in merged_config:
                            tool.memory_manager = merged_config['memory_manager']
                        # Re-derive config-derived attributes that were set during
                        # __init__ (before tool.config was populated from user config).
                        # bash is the only tool with such attributes (default_timeout,
                        # safety_mode); the general pattern works for any tool.
                        if hasattr(tool, 'default_timeout'):
                            tool.default_timeout = merged_config.get(
                                "timeout", tool.default_timeout
                            )
                        if hasattr(tool, 'safety_mode'):
                            tool.safety_mode = merged_config.get(
                                "safety_mode", tool.safety_mode
                            )
                    tools.append(tool)
            except Exception as e:
                logger.warning(f"[AgentInitializer] Failed to load tool {tool_name}: {e}")

        # Add MCP tools (snapshot to avoid races with the background loader)
        mcp_tools_snapshot = list(tool_manager._mcp_tool_instances.items())
        if mcp_tools_snapshot:
            for _, mcp_tool in mcp_tools_snapshot:
                tools.append(mcp_tool)
            if session_id is None:
                names = [name for name, _ in mcp_tools_snapshot]
                logger.info(
                    f"[AgentInitializer] Added {len(names)} MCP tool(s): {names}"
                )

        # Add memory tools
        if memory_tools:
            tools.extend(memory_tools)
            if session_id is None:
                logger.info(f"[AgentInitializer] Added {len(memory_tools)} memory tools")
        
        if session_id is None:
            logger.info(f"[AgentInitializer] Loaded {len(tools)} tools: {[t.name for t in tools]}")
        
        return tools
    
    def _initialize_scheduler(
        self,
        tools: List,
        session_id: Optional[str] = None,
        workspace_root: str = None,
        agent_id: str = None,
    ):
        """Initialize scheduler service if needed.

        Serialize the check-and-set under a module-level lock so concurrent
        first-time session inits cannot each create a new SchedulerService
        (which would leak background scanning threads).
        """
        if agent_id not in self.agent_bridge.scheduler_agent_ids:
            with _scheduler_init_lock:
                if agent_id not in self.agent_bridge.scheduler_agent_ids:
                    try:
                        from agent.tools.scheduler.integration import init_scheduler
                        if init_scheduler(
                            self.agent_bridge,
                            workspace_root=workspace_root,
                            agent_id=agent_id,
                        ):
                            self.agent_bridge.scheduler_agent_ids.add(agent_id)
                            self.agent_bridge.scheduler_initialized = True
                            if session_id is None:
                                logger.info(
                                    f"[AgentInitializer] Scheduler initialized "
                                    f"for agent={agent_id}"
                                )
                    except Exception as e:
                        logger.warning(f"[AgentInitializer] Failed to initialize scheduler: {e}")
        
        # Inject scheduler dependencies
        if agent_id in self.agent_bridge.scheduler_agent_ids:
            try:
                from agent.tools.scheduler.integration import get_task_store, get_scheduler_service
                from agent.tools import SchedulerTool
                from config import conf
                
                task_store = get_task_store(
                    workspace_root=workspace_root, agent_id=agent_id
                )
                scheduler_service = get_scheduler_service(
                    workspace_root=workspace_root, agent_id=agent_id
                )
                
                for tool in tools:
                    if isinstance(tool, SchedulerTool):
                        tool.task_store = task_store
                        tool.scheduler_service = scheduler_service
                        if not tool.config:
                            tool.config = {}
                        raw_ct = conf().get("channel_type", "unknown")
                        if isinstance(raw_ct, list):
                            ct = raw_ct[0] if raw_ct else "unknown"
                        elif isinstance(raw_ct, str) and "," in raw_ct:
                            ct = raw_ct.split(",")[0].strip()
                        else:
                            ct = raw_ct
                        tool.config["channel_type"] = ct
                        tool.config["agent_id"] = agent_id
            except Exception as e:
                logger.warning(f"[AgentInitializer] Failed to inject scheduler dependencies: {e}")
    
    def _initialize_skill_manager(self, workspace_root: str, session_id: Optional[str] = None):
        """Initialize skill manager"""
        try:
            from agent.skills import SkillManager
            skill_manager = SkillManager(custom_dir=os.path.join(workspace_root, "skills"))
            return skill_manager
        except Exception as e:
            logger.warning(f"[AgentInitializer] Failed to initialize SkillManager: {e}")
            return None
    
    def _get_runtime_info(self, workspace_root: str):
        """Get runtime information with dynamic time support"""
        from config import conf
        
        def get_current_time():
            """Get current time dynamically - called each time system prompt is accessed"""
            now = datetime.datetime.now()
            
            # Get timezone info
            try:
                offset = -time.timezone if not time.daylight else -time.altzone
                hours = offset // 3600
                minutes = (offset % 3600) // 60
                timezone_name = f"UTC{hours:+03d}:{minutes:02d}" if minutes else f"UTC{hours:+03d}"
            except Exception:
                timezone_name = "UTC"
            
            # Weekday: English name in en, Chinese mapping otherwise
            weekday_en = now.strftime("%A")
            try:
                from common import i18n
                is_en = i18n.get_language() == "en"
            except Exception:
                is_en = False
            if is_en:
                weekday = weekday_en
            else:
                weekday_map = {
                    'Monday': '星期一', 'Tuesday': '星期二', 'Wednesday': '星期三',
                    'Thursday': '星期四', 'Friday': '星期五', 'Saturday': '星期六', 'Sunday': '星期日'
                }
                weekday = weekday_map.get(weekday_en, weekday_en)

            return {
                'time': now.strftime("%Y-%m-%d %H:%M:%S"),
                'weekday': weekday,
                'timezone': timezone_name
            }
        
        def get_model():
            """Get current model name dynamically from config"""
            return conf().get("model", "unknown")

        return {
            "_get_model": get_model,
            "workspace": workspace_root,
            "channel": ", ".join(conf().get("channel_type")) if isinstance(conf().get("channel_type"), list) else conf().get("channel_type", "unknown"),
            "_get_current_time": get_current_time  # Dynamic time function
        }
    
    def _migrate_config_to_env(self, workspace_root: str):
        """Migrate API keys from config.json to .env file"""
        from config import conf
        
        key_mapping = {
            "open_ai_api_key": "OPENAI_API_KEY",
            "open_ai_api_base": "OPENAI_API_BASE",
            "gemini_api_key": "GEMINI_API_KEY",
            "claude_api_key": "CLAUDE_API_KEY",
            "linkai_api_key": "LINKAI_API_KEY",
        }
        
        env_file = expand_path("~/.cow/.env")
        
        # Read existing env vars (key -> value)
        existing_env_vars = {}
        if os.path.exists(env_file):
            try:
                with open(env_file, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#') and '=' in line:
                            key, val = line.split('=', 1)
                            existing_env_vars[key.strip()] = val.strip()
            except Exception as e:
                logger.warning(f"[AgentInitializer] Failed to read .env file: {e}")
        
        # Sync config.json values into .env (add/update/remove)
        updated = False
        for config_key, env_key in key_mapping.items():
            raw = conf().get(config_key, "")
            value = raw.strip() if raw else ""
            old_value = existing_env_vars.get(env_key)

            if value:
                if old_value == value:
                    continue
                existing_env_vars[env_key] = value
                os.environ[env_key] = value
                updated = True
            else:
                if old_value is None:
                    continue
                existing_env_vars.pop(env_key, None)
                os.environ.pop(env_key, None)
                updated = True

        if updated:
            try:
                env_dir = os.path.dirname(env_file)
                os.makedirs(env_dir, exist_ok=True)

                # Rewrite the entire .env file to ensure consistency
                with open(env_file, 'w', encoding='utf-8') as f:
                    f.write('# Environment variables for agent\n')
                    f.write('# Auto-managed - synced from config.json on startup\n\n')
                    for key, value in sorted(existing_env_vars.items()):
                        f.write(f'{key}={value}\n')

                logger.info(f"[AgentInitializer] Synced API keys from config.json to .env")
            except Exception as e:
                logger.warning(f"[AgentInitializer] Failed to sync API keys: {e}")

    def _start_daily_flush_timer(self):
        """Start a background thread that flushes all agents' memory daily at 23:55."""
        if getattr(self.agent_bridge, '_daily_flush_started', False):
            return
        self.agent_bridge._daily_flush_started = True

        import threading

        def _daily_flush_loop():
            import random
            last_run_date = None  # Track last successful run date to prevent same-day re-trigger
            while True:
                try:
                    now = datetime.datetime.now()
                    jitter_min = random.randint(50, 55)
                    jitter_sec = random.randint(0, 59)
                    target = now.replace(hour=23, minute=jitter_min, second=jitter_sec, microsecond=0)
                    # Always schedule for tomorrow if we already ran today, or if target time has passed
                    if target <= now or (last_run_date == now.date()):
                        target += datetime.timedelta(days=1)
                    wait_seconds = (target - now).total_seconds()
                    logger.info(f"[DailyFlush] Next flush at {target.strftime('%Y-%m-%d %H:%M:%S')} (in {wait_seconds/3600:.1f}h)")
                    time.sleep(wait_seconds)

                    self._flush_all_agents()
                    # Record the scheduled date: a run that crosses midnight must
                    # not mark the new day as already done.
                    last_run_date = target.date()
                except Exception as e:
                    logger.warning(f"[DailyFlush] Error in daily flush loop: {e}")
                    time.sleep(3600)

        t = threading.Thread(target=_daily_flush_loop, daemon=True)
        t.start()

    def _flush_all_agents(self):
        """Flush memory for all active agent sessions, then run Deep Dream."""
        agents = [
            (f"{agent_id}:{session_id or 'default'}", agent)
            for agent_id, session_id, agent in self.agent_bridge.iter_agent_instances()
        ]

        if not agents:
            return

        # Phase 1: flush daily summaries
        flushed = 0
        flush_threads = []
        dream_candidates = {}
        for label, agent in agents:
            try:
                if not agent.memory_manager:
                    continue
                dream_candidates.setdefault(
                    agent.agent_id, agent.memory_manager.flush_manager
                )
                with agent.messages_lock:
                    messages = list(agent.messages)
                if not messages:
                    continue
                result = agent.memory_manager.flush_manager.create_daily_summary(messages)
                if result:
                    flushed += 1
                    t = agent.memory_manager.flush_manager._last_flush_thread
                    if t:
                        flush_threads.append(t)
            except Exception as e:
                logger.warning(f"[DailyFlush] Failed for session {label}: {e}")

        if flushed:
            logger.info(f"[DailyFlush] Flushed {flushed}/{len(agents)} agent session(s)")

        # Wait for all flush threads to finish before dreaming
        for t in flush_threads:
            t.join(timeout=60)

        # Phase 2: Deep Dream — distill daily memories → MEMORY.md + dream diary
        for agent_id, dream_candidate in dream_candidates.items():
            try:
                result = dream_candidate.deep_dream()
                if result:
                    logger.info(
                        f"[DeepDream] Memory distillation completed for "
                        f"agent={agent_id}"
                    )
            except Exception as e:
                logger.warning(f"[DeepDream] Failed for agent={agent_id}: {e}")
