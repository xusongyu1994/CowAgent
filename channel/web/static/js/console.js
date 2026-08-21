/* =====================================================================
   揽盛电气智能体 Console - Main Application Script
   ===================================================================== */

// =====================================================================
// Version — fetched from backend (single source: /VERSION file)
// =====================================================================
let APP_VERSION = '';

// =====================================================================
// i18n
// =====================================================================
const I18N = {
    zh: {
        console: '控制台',
        nav_chat: '对话', nav_manage: '管理', nav_monitor: '监控',
        menu_chat: '对话', menu_config: '配置', menu_models: '模型', menu_skills: '技能',
        menu_memory: '记忆', menu_knowledge: '知识', menu_channels: '通道', menu_tasks: '定时',
        menu_logs: '日志', menu_permissions: '权限', menu_kanban: '看板', menu_projects: '项目', menu_overdue: '逾期统计',
        permissions_title: '权限管理', permissions_desc: '管理用户访问知识库和使用金蝶的权限',
        permissions_sync_users: '同步用户', permissions_knowledge: '知识库权限', permissions_kingdee: '金蝶权限',
        permissions_enabled_label: '启用权限管理',
        permissions_audit: '审计日志',
        models_title: '模型管理',
        models_desc: '统一管理对话、图像、语音、向量、搜索能力',
        models_section_vendors: '厂商凭据',
        models_section_vendors_desc: '一处配置，多个模型能力共享',
        models_section_capabilities: '模型能力',
        models_add_vendor: '添加厂商',
        models_provider: '厂商',
        models_model: '模型',
        models_voice: '音色',
        models_configured: '已配置',
        models_not_configured: '未配置',
        models_pick_to_configure: '选择以配置',
        models_clear_credential: '清除凭据',
        models_base_default_hint: '留空将使用官方默认地址',
        models_base_default: '默认',
        models_custom_vendor_label: '自定义',
        models_custom_name: '名称',
        models_custom_delete: '删除',
        models_custom_delete_confirm_title: '删除自定义厂商',
        models_custom_delete_confirm_msg: '确定删除该自定义厂商吗？此操作无法撤销。',
        models_custom_name_required: '请填写名称',
        models_custom_base_required: '请填写 API Base',
        models_custom_edit_title: '编辑自定义厂商',
        models_custom_add_title: '添加自定义厂商',
        models_capability_chat: '主模型',
        models_capability_chat_desc: '用于基础对话和 Agent 推理',
        models_capability_vision: '图像理解',
        models_capability_vision_desc: '识别图片内容，用于图像识别工具',
        models_capability_image: '图像生成',
        models_capability_image_desc: '生成图片，用于图像生成技能',
        models_auto_using: '当前优先使用',
        models_capability_asr: '语音识别',
        models_capability_asr_desc: '语音转文字',
        models_capability_tts: '语音合成',
        models_capability_tts_desc: '文字转语音',
        models_capability_embedding: '向量',
        models_capability_embedding_desc: '用于记忆与知识的向量化检索',
        models_capability_search: '联网搜索',
        models_capability_search_desc: '实时网页检索能力，用于搜索工具',
        models_strategy_auto: '自动',
        models_search_strategy_label: '策略',
        models_search_strategy_fixed: '指定',
        models_search_strategy_auto_hint: '从已配置厂商中自动选择',
        models_search_strategy_fixed_hint: '指定使用搜索厂商',
        models_pending_config: '待配置',
        models_search_available_label: '可用搜索厂商：',
        models_search_none_configured: '暂未启用任何搜索厂商，点击添加',
        models_search_add_provider: '添加厂商',
        models_search_add_desc: '选择一个搜索厂商进行配置',
        models_search_bocha_title: '配置博查 API Key',
        models_search_bocha_desc: '前往博查开放平台创建 API Key',
        models_search_edit_hint: '点击修改配置',
        models_unavailable: '不可用',
        models_set_via_env: '通过环境变量启用',
        models_dim_label: '维度',
        models_save_success: '已保存',
        models_save_failed: '保存失败',
        models_cleared: '已清除',
        models_clear_failed: '清除失败',
        models_embedding_change_title: '更改向量模型',
        models_embedding_change_msg: '切换向量模型后，已有索引将失效，需要重建。是否继续？',
        models_embedding_saved_title: '向量模型已更新',
        models_embedding_saved_msg: '请在聊天框输入 /memory rebuild-index 重建索引。',
        models_embedding_saved_ok: '去执行',
        models_pick_provider: '待选择',
        models_clear_confirm_title: '清除厂商凭据',
        models_clear_confirm_msg: '确认清除该厂商的 API Key 与 Base URL 吗？相关能力将不再可用。',
        cancel: '取消',
        save: '保存',
        ok: '确定',
        knowledge_title: '知识库', knowledge_desc: '浏览和探索你的知识库',
        knowledge_tab_docs: '文档', knowledge_tab_graph: '图谱',
        knowledge_loading: '加载知识库中...', knowledge_loading_desc: '知识页面将显示在这里',
        knowledge_select_hint: '选择一个文档查看', knowledge_empty_hint: '暂无知识页面',
        knowledge_empty_guide: '在对话中发送文档、链接或主题给 Agent，它会自动整理到你的知识库中。',
        knowledge_go_chat: '开始对话',
        knowledge_new: '新建',
        knowledge_new_category: '新建分类',
        knowledge_new_document: '新建文档',
        knowledge_import_documents: '导入文档',
        welcome_subtitle: '我可以帮你解答问题、管理计算机、创造和执行技能，并通过<br>长期记忆和知识库不断成长',
        example_sys_title: '系统管理', example_sys_text: '查看工作空间里有哪些文件',
        example_task_title: '定时任务', example_task_text: '1分钟后提醒我检查服务器',
        example_code_title: '工作助手', example_code_text: '搜索产品信息并生成可视化网页报告',
        example_knowledge_title: '知识库', example_knowledge_text: '查看知识库当前文档情况',
        example_skill_title: '技能系统', example_skill_text: '查看所有支持的工具和技能',
        example_web_title: '指令中心', example_web_text: '查看全部命令',
        slash_help: '显示命令帮助',
        slash_status: '查看运行状态',
        slash_context: '查看对话上下文',
        slash_context_clear: '清除对话上下文',
        slash_skill_list: '查看已安装技能',
        slash_skill_list_remote: '浏览技能广场',
        slash_skill_search: '搜索技能',
        slash_skill_install: '安装技能 (名称或 GitHub URL)',
        slash_skill_uninstall: '卸载技能',
        slash_skill_info: '查看技能详情',
        slash_skill_enable: '启用技能',
        slash_skill_disable: '禁用技能',
        slash_memory_dream: '手动触发记忆蒸馏 (可指定天数, 默认3)',
        slash_knowledge: '查看知识库统计',
        slash_knowledge_list: '查看知识库文件树',
        slash_knowledge_on: '开启知识库',
        slash_knowledge_off: '关闭知识库',
        slash_config: '查看当前配置',
        slash_cancel: '中止当前正在运行的 Agent 任务',
        slash_logs: '查看最近日志',
        slash_version: '查看版本',
        input_placeholder: '输入消息，或输入 / 使用指令',
        config_title: '配置管理', config_desc: '管理模型和 Agent 配置',
        config_model: '模型配置', config_agent: 'Agent 配置',
        config_language: '语言', config_language_hint: '界面展示、命令文案、系统提示词等使用的语言（与右上角切换同步）',
        config_model_advanced: '高级配置',
        config_channel: '通道配置',
        config_agent_enabled: 'Agent 模式',
        config_max_tokens: '最大上下文 Token', config_max_tokens_hint: '对话中 Agent 能输入的最大 Token 长度，超过后会智能压缩处理',
        config_max_turns: '最大记忆轮次', config_max_turns_hint: '一问一答为一轮，超过后会智能压缩处理',
        config_max_steps: '最大执行步数', config_max_steps_hint: '单次对话中 Agent 最多调用工具的次数',
        config_enable_thinking: '深度思考', config_enable_thinking_hint: '是否启用深度思考模式',
        config_self_evolution: '自主进化', config_self_evolution_hint: '会话空闲后自动复盘，沉淀记忆、优化技能、处理未完成事项',
        evolution_badge: '自主学习',
        config_channel_type: '通道类型',
        config_provider: '模型厂商', config_model_name: '模型',
        config_custom_model_hint: '输入自定义模型名称',
        config_save: '保存', config_saved: '已保存',
        config_save_error: '保存失败',
        config_custom_option: '自定义',
        config_custom_tip: '接口需遵循 OpenAI API 协议',
        config_security: '安全设置', config_password: '访问密码',
        config_password_hint: '留空则不启用密码保护',
        config_password_changed: '密码已更新',
        config_password_cleared: '密码已清除',
        config_password_security_warning: '⚠️ 警告：目前密码为空且对外连接埠开放，建议重启服务，或检查是否调整监听位址绑定。',
        skills_title: '技能管理', skills_desc: '查看、启用或禁用 Agent 工具和技能', skills_hub_btn: '探索技能广场',
        skills_loading: '加载技能中...', skills_loading_desc: '技能加载后将显示在此处',
        tools_section_title: '内置工具', tools_loading: '加载工具中...',
        skills_section_title: '技能', skill_enable: '启用', skill_disable: '禁用',
        skill_toggle_error: '操作失败，请稍后再试',
        memory_title: '记忆管理', memory_desc: '查看 Agent 记忆文件和内容',
        memory_tab_files: '记忆文件', memory_tab_dreams: '自主进化',
        memory_loading: '加载记忆文件中...', memory_loading_desc: '记忆文件将显示在此处',
        memory_back: '返回列表',
        memory_col_name: '文件名', memory_col_type: '类型', memory_col_size: '大小', memory_col_updated: '更新时间',
        channels_title: '通道管理', channels_desc: '管理已接入的消息通道',
        channels_add: '接入通道', channels_disconnect: '断开',
        channels_save: '保存配置', channels_saved: '已保存', channels_save_error: '保存失败',
        channels_restarted: '已保存并重启',
        channels_connect_btn: '接入', channels_cancel: '取消',
        channels_select_placeholder: '选择要接入的通道...',
        channels_empty: '暂未接入任何通道', channels_empty_desc: '点击右上角「接入通道」按钮开始配置',
        channels_disconnect_confirm: '确认断开该通道？配置将保留但通道会停止运行。',
        channels_connected: '已接入', channels_connecting: '接入中...',
        weixin_scan_title: '微信扫码登录', weixin_scan_desc: '请使用微信扫描下方二维码',
        weixin_scan_loading: '正在获取二维码...', weixin_scan_waiting: '等待扫码...',
        weixin_scan_scanned: '已扫码，请在手机上确认', weixin_scan_expired: '二维码已过期，正在刷新...',
        weixin_scan_success: '登录成功，正在启动通道...', weixin_scan_fail: '获取二维码失败',
        weixin_qr_tip: '二维码约2分钟后过期',
        wecom_scan_btn: '扫码创建企微机器人', wecom_scan_desc: '使用企业微信扫码，一键创建智能机器人',
        wecom_scan_success: '创建成功，正在启动通道...',
        wecom_scan_fail: '创建失败',
        wecom_mode_scan: '扫码接入', wecom_mode_manual: '手动填写',
        feishu_scan_btn: '一键创建飞书应用',
        feishu_scan_desc: '使用飞书 App 扫码，自动创建应用并预置全部权限与事件订阅',
        feishu_scan_replace_desc: '使用飞书 App 扫码创建新机器人，将覆盖当前的 App ID / Secret',
        feishu_scan_loading: '正在向飞书申请二维码...',
        feishu_scan_waiting: '等待扫码...',
        feishu_scan_tip: '二维码 10 分钟内有效，仅供一次扫描',
        feishu_scan_open_link: '或点击此处在浏览器中打开',
        feishu_scan_success: '应用创建成功，正在启动通道...',
        feishu_scan_expired: '二维码已过期，请重试',
        feishu_scan_denied: '已取消授权',
        feishu_scan_fail: '创建失败',
        feishu_scan_retry: '重试',
        feishu_mode_scan: '扫码创建', feishu_mode_manual: '手动填写',
        tasks_title: '定时任务', tasks_desc: '查看和管理定时任务',
        tasks_coming: '即将推出', tasks_coming_desc: '定时任务管理功能即将在此提供',
        task_add_btn: '新增任务',
        task_edit_title: '编辑定时任务',
        task_add_title: '新增定时任务',
        task_name: '任务名称',
        task_enabled: '启用任务',
        task_schedule_type: '调度类型',
        task_schedule_cron: 'Cron 表达式',
        task_schedule_interval: '固定间隔',
        task_schedule_once: '一次性任务',
        task_cron_expression: 'Cron 表达式',
        task_cron_hint: '格式: 分 时 日 月 周，例如 "0 9 * * *" 表示每天 9:00',
        task_interval_seconds: '间隔秒数',
        task_interval_hint: '最小 60 秒，例如 3600 表示每小时执行一次',
        task_once_time: '执行时间',
        task_action_type: '动作类型',
        task_action_send_message: '发送消息',
        task_action_agent_task: 'AI 任务',
        task_channel_type: '通道类型',
        task_channel_hint: '选择定时消息发送的通道',
        task_message_content: '消息内容',
        task_task_description: '任务描述',
        task_delete_btn: '删除任务',
        task_delete_confirm_title: '删除定时任务',
        task_delete_confirm_msg: '确定删除该定时任务吗？此操作无法撤销。',
        logs_title: '日志', logs_desc: '实时日志输出 (run.log)',
        logs_live: '实时', logs_coming_msg: '日志流即将在此提供。将连接 run.log 实现类似 tail -f 的实时输出。',
        kanban_title: '金蝶看板', kanban_desc: '金蝶云星空订单审批状态一览',
        kanban_sale: '销售订单', kanban_purchase: '采购订单',
        kanban_loading: '加载看板数据...', kanban_error: '加载失败',
        kanban_col_draft: '草稿', kanban_col_pending: '待提交', kanban_col_review: '待审核',
        kanban_col_approved: '已审核', kanban_col_rejected: '重新审核',
        kanban_total: '合计', kanban_detail_title: '单据详情',
        kanban_detail_loading: '加载详情中...',
        kanban_no_data: '暂无数据',
        kanban_close: '关闭',
        kanban_view_board: '看板', kanban_view_table: '表格',
        kanban_view_pie: '饼图', kanban_view_bar: '柱状图', kanban_view_line: '折线图',
        kanban_filter_placeholder: '搜索企业名称或单据编号...',
        kanban_table_summary: '共 {count} 条记录，合计(含税): ¥{amount}',
        kanban_conversion: '转换统计',
        kanban_overdue: '逾期统计',
        kanban_overdue_loading: '加载逾期统计数据...',
        kanban_overdue_error: '加载逾期统计失败',
        kanban_overdue_kpi_total: '总应收金额',
        kanban_overdue_kpi_overdue_amt: '逾期金额',
        kanban_overdue_kpi_overdue_rate: '逾期率',
        kanban_overdue_kpi_overdue_count: '逾期笔数',
        kanban_overdue_kpi_avg_days: '平均逾期天数',
        kanban_overdue_kpi_due_soon: '7天内到期',
        kanban_overdue_aging_title: '逾期账龄分布',
        kanban_overdue_customer_rank: '客户逾期排行',
        kanban_overdue_detail_title: '逾期明细',
        kanban_overdue_top_hint: '仅展示前2000条',
        kanban_overdue_col_billno: '单据编号',
        kanban_overdue_col_date: '单据日期',
        kanban_overdue_col_due_date: '到期日',
        kanban_overdue_col_customer: '客户',
        kanban_overdue_col_material: '物料名称',
        kanban_overdue_col_spec: '规格型号',
        kanban_overdue_col_amount: '价税合计(¥)',
        kanban_overdue_col_settle: '已结算金额(¥)',
        kanban_overdue_col_unsettle: '未结算金额(¥)',
        kanban_overdue_col_open_amount: '已开票核销金额(¥)',
        kanban_overdue_col_days: '逾期天数',
        kanban_overdue_col_status: '状态',
        kanban_overdue_status_overdue: '逾期',
        kanban_overdue_status_normal: '未逾期',
        overdue_title: '逾期应收款管理看板',
        overdue_desc: '按业务员维度展示应收逾期数据，支持多维筛选与下钻分析',
        overdue_date_range: '日期筛选（可选）：',
        overdue_query_btn: '查询',
        overdue_clear_date: '清除筛选',
        overdue_default_hint: '默认展示全部应收数据',
        overdue_aging_title: '逾期天数分布',
        overdue_workflow_title: '跟进阶段概览',
        overdue_saler_title: '业务员回款汇总',
        overdue_sop_title: '逾期跟进流程SOP参考',
        overdue_tab_detail: '应回款',
        overdue_tab_saler: '业务员汇总',
        overdue_tab_workflow: '跟进流程',
        overdue_saler_col_saler: '业务员',
        overdue_saler_col_count: '笔数',
        overdue_saler_col_amount: '应回款金额(¥)',
        overdue_saler_col_settle: '已结算金额(¥)',
        overdue_saler_col_open_amount: '已开票核销金额(¥)',
        overdue_saler_col_rate: '回款达成率',
        overdue_saler_col_avg_days: '平均逾期天数',
        overdue_saler_col_max_days: '最大逾期天数',
        overdue_saler_col_gap: '资金缺口(¥)',
        overdue_saler_total_row: '合计',
        overdue_only_overdue: '仅显示逾期',
        overdue_detail_summary: '共 {count} 笔 | 应回款 ¥{amount} | 已开票核销 ¥{open}',
        overdue_col_saler: '业务员',
        overdue_col_risk: '风险阶段',
        overdue_risk_warning: '预警',
        overdue_risk_early: '早期',
        overdue_risk_mid: '中期',
        overdue_risk_severe: '重度',
        overdue_risk_danger: '危险',
        overdue_risk_baddebt: '坏账',
        overdue_workflow_warning: '⚪ 预警(≤0天)',
        overdue_workflow_early: '🟢 早期(1-30天)',
        overdue_workflow_mid: '🟡 中期(31-60天)',
        overdue_workflow_severe: '🟠 重度(61-90天)',
        overdue_workflow_danger: '🔴 危险(91-180天)',
        overdue_workflow_baddebt: '⚫ 坏账(>180天)',
        overdue_kpi_open_amount: '已开票核销金额',
        overdue_kpi_rate: '回款达成率',
        overdue_kpi_overdue_cnt: '逾期笔数',
        overdue_kpi_saler_cnt: '涉及业务员',
        kanban_conversion_loading: '加载转换统计数据...',
        kanban_conversion_error: '加载转换统计失败',
        kanban_conversion_quotation_title: '报价单 → 销售订单',
        kanban_conversion_sample_title: '样品单 → 销售订单',
        kanban_conversion_detail_title: '转换明细',
        kanban_conversion_so_perspective: '销售订单视角',
        kanban_conversion_qt_perspective: '报价单视角',
        kanban_conversion_sp_perspective: '样品单视角',
        kanban_conversion_total_so: '销售订单总数',
        kanban_conversion_from_qt: '来源报价单',
        kanban_conversion_from_qt_rate: '报价单来源率',
        kanban_conversion_total_qt: '报价单总数',
        kanban_conversion_total_sp: '样品单总数',
        kanban_conversion_converted: '已转化',
        kanban_conversion_qt_rate: '报价单转化率',
        kanban_conversion_qt_converted_amount: '报价单转化总额(含税)',
        kanban_conversion_sample_so: '样品单数',
        kanban_conversion_sample_rate: '样品单占比',
        kanban_conversion_sample_converted: '已转化的样品单',
        kanban_conversion_sample_conv_rate: '样品单转化率',
        kanban_conversion_sp_converted_amount: '样品单转化总额(含税)',
        kanban_conversion_detail_pairs: '已转化单据对照',
        kanban_conversion_detail_customer: '按客户转化汇总',
        kanban_conversion_column_qt_bill: '报价单号',
        kanban_conversion_column_qt_date: '报价日期',
        kanban_conversion_column_so_bill: '销售订单号',
        kanban_conversion_column_so_date: '销售日期',
        kanban_conversion_column_sample_bill: '样品单号',
        kanban_conversion_column_sample_date: '样品日期',
        kanban_conversion_column_normal_bill: '正式订单号',
        kanban_conversion_column_normal_date: '正式日期',
        kanban_conversion_column_amount: '价税合计(¥)',
        kanban_conversion_column_customer: '客户',
        kanban_conversion_column_material: '物料编码',
        kanban_conversion_column_spec: '规格型号',
        kanban_conversion_column_type: '类型',
        kanban_conversion_column_total: '总数',
        kanban_conversion_column_converted: '已转化',
        kanban_conversion_column_rate: '转化率',
        kanban_conversion_column_mat_name: '物料名称',
        kanban_conversion_column_qty: '数量',
        kanban_conversion_column_unit: '单位',
        kanban_conversion_column_price: '含税单价',
        kanban_conversion_column_status: '单据状态',
        kanban_conversion_column_saler: '业务员',
        kanban_conversion_column_converted_flag: '是否已转化',
        kanban_conversion_type_quotation: '报价单',
        kanban_conversion_type_sample: '样品单',
        kanban_conversion_no_data: '暂无已转化的单据',
        kanban_conversion_export_btn: '导出 Excel',
        kanban_conversion_export_pairs: '导出单据对照',
        kanban_conversion_export_summary: '导出客户汇总',
        kanban_conversion_export_success: 'Excel 文件已生成',
        kanban_conversion_loading_export: '正在导出 Excel...',
        kanban_conversion_customer_analysis: '客户转化深度分析',
        kanban_conversion_high_converters: '高转化客户',
        kanban_conversion_low_converters: '待跟进客户',
        kanban_conversion_high_qt: '报价单高转化客户',
        kanban_conversion_low_qt: '报价单待跟进客户',
        kanban_conversion_high_sp: '样品单高转化客户',
        kanban_conversion_low_sp: '样品单待跟进客户',
        kanban_conversion_view_all: '查看全部{n}个客户',
        kanban_conversion_view_less: '收起',
        kanban_conversion_search_customer: '搜索客户名...',
        kanban_conversion_sort_by_rate: '按转化率',
        kanban_conversion_sort_by_total: '按报价次数',
        kanban_conversion_sort_by_date: '按最近日期',
        kanban_conversion_no_high: '暂无高转化客户',
        kanban_conversion_no_low: '所有客户均已转化 ✅',
        kanban_conversion_last_date: '最近报价',
        kanban_conversion_sample_note: '样品单转化指：客户拿样品后有同物料正式订单',
        kanban_conversion_qt_count: '{n}报{m}中',
        kanban_conversion_analysis_export: '导出客户分析',
        projects_title: '项目管理', projects_desc: '上传项目 Excel 文件，自动分析进度并检测停滞项目',
        projects_upload_title: '上传项目文件', projects_upload_hint: '拖拽 Excel 文件到此处，或点击上传',
        projects_upload_supported: '支持 .xlsx 格式', projects_upload_btn: '选择文件',
        projects_upload_loading: '正在解析和分析数据...',
        projects_stats_total: '项目总数', projects_stats_stalled: '停滞项目', projects_stats_healthy: '项目健康率',
        projects_stalled_title: '停滞项目预警', projects_stalled_desc: '以下项目已超过 30 天未更新进度',
        projects_stalled_days: '天未更新',
        projects_table_title: '全部项目数据',
        projects_error_upload: '上传失败',
        projects_error_no_date: '未检测到日期列，无法分析停滞项目',
        projects_error_no_progress: '未检测到进度列，无法计算健康率',
        projects_error_no_name: '未检测到项目名列',
        projects_halfyear_goal: '半年度目标',
        projects_monthly_goal: '本月目标',
        projects_action_plan: '行动计划',
        new_chat: '新对话',
        session_history: '历史会话',
        today: '今天', yesterday: '昨天', earlier: '更早',
        delete_session_confirm: '确认删除该会话？所有消息将被清除。',
        delete_session_title: '删除会话',
        rename_session: '重命名',
        delete_message_confirm: '确认删除这条消息？',
        delete_message_title: '删除消息',
        edit_disabled_reply_active: '正在生成回复，暂时无法编辑。',
        delete_disabled_reply_active: '正在生成回复，暂时无法删除。',
        untitled_session: '新对话',
        context_cleared: '— 以上内容已从上下文中移除 —',
        tip_new_chat: '新建对话',
        tip_clear_context: '清除上下文',
        tip_attach: '添加附件',
        attach_menu_file: '上传文件',
        mic_idle_title: '点击录音 / 再按一次结束',
        mic_recording_title: '录音中，再次点击结束',
        mic_busy_title: '识别中…',
        mic_permission_denied: '无法访问麦克风，请检查浏览器权限',
        mic_too_short: '录音太短，请重试',
        mic_error: '语音识别失败',
        speak_msg: '朗读这段回复',
        voice_reply_mode_label: '语音回复策略',
        voice_reply_off: '关闭',
        voice_reply_if_voice: '仅语音问/语音答',
        voice_reply_always: '总是语音回复',
        attach_menu_folder: '上传文件夹',
        confirm_yes: '确认',
        confirm_cancel: '取消',
        error_send: '发送失败，请稍后再试。', error_timeout: '请求超时，请再试一次。',
        thinking_in_progress: '思考中...', thinking_done: '已深度思考', thinking_duration: '耗时',
        edit_message: '编辑消息',
        regenerate_response: '重新生成',
        edit_save: '保存并发送',
        edit_cancel: '取消',
        logout: '退出',
    },
    'zh-Hant': {

        console: '控制台',
        nav_chat: '對話', nav_manage: '管理', nav_monitor: '監控',
        menu_chat: '對話', menu_config: '設定', menu_models: '模型', menu_skills: '技能',
        menu_memory: '記憶', menu_knowledge: '知識', menu_channels: '管道', menu_tasks: '定時',
        menu_logs: '日誌',
        models_title: '模型管理',
        models_desc: '統一管理對話、影像、語音、向量、搜尋能力',
        models_section_vendors: '廠商憑據',
        models_section_vendors_desc: '一處設定，多個模型能力共享',
        models_section_capabilities: '模型能力',
        models_add_vendor: '新增廠商',
        models_provider: '廠商',
        models_model: '模型',
        models_voice: '音色',
        models_configured: '已設定',
        models_not_configured: '未設定',
        models_pick_to_configure: '選擇以設定',
        models_clear_credential: '清除憑據',
        models_base_default_hint: '留空將使用官方預設地址',
        models_base_default: '預設',
        models_custom_vendor_label: '自定義',
        models_custom_name: '名稱',
        models_custom_delete: '刪除',
        models_custom_delete_confirm_title: '刪除自定義廠商',
        models_custom_delete_confirm_msg: '確定刪除該自定義廠商嗎？此操作無法撤銷。',
        models_custom_name_required: '請填寫名稱',
        models_custom_base_required: '請填寫 API Base',
        models_custom_edit_title: '編輯自定義廠商',
        models_custom_add_title: '新增自定義廠商',
        models_capability_chat: '主模型',
        models_capability_chat_desc: '用於基礎對話和 Agent 推理',
        models_capability_vision: '影像理解',
        models_capability_vision_desc: '識別圖片內容，用於影像識別工具',
        models_capability_image: '影像生成',
        models_capability_image_desc: '生成圖片，用於影像生成技能',
        models_auto_using: '當前優先使用',
        models_capability_asr: '語音識別',
        models_capability_asr_desc: '語音轉文字',
        models_capability_tts: '語音合成',
        models_capability_tts_desc: '文字轉語音',
        models_capability_embedding: '向量',
        models_capability_embedding_desc: '用於記憶與知識的向量化檢索',
        models_capability_search: '聯網搜尋',
        models_capability_search_desc: '實時網頁檢索能力，用於搜尋工具',
        models_strategy_auto: '自動',
        models_search_strategy_label: '策略',
        models_search_strategy_fixed: '指定',
        models_search_strategy_auto_hint: '從已設定廠商中自動選擇',
        models_search_strategy_fixed_hint: '指定使用搜尋廠商',
        models_pending_config: '待設定',
        models_search_available_label: '可用搜尋廠商：',
        models_search_none_configured: '暫未啟用任何搜尋廠商，點選新增',
        models_search_add_provider: '新增廠商',
        models_search_add_desc: '選擇一個搜尋廠商進行設定',
        models_search_bocha_title: '設定博查 API Key',
        models_search_bocha_desc: '前往博查開放平臺建立 API Key',
        models_search_edit_hint: '點選修改設定',
        models_unavailable: '不可用',
        models_set_via_env: '透過環境變數啟用',
        models_dim_label: '維度',
        models_save_success: '已儲存',
        models_save_failed: '儲存失敗',
        models_cleared: '已清除',
        models_clear_failed: '清除失敗',
        models_embedding_change_title: '更改向量模型',
        models_embedding_change_msg: '切換向量模型後，已有索引將失效，需要重建。是否繼續？',
        models_embedding_saved_title: '向量模型已更新',
        models_embedding_saved_msg: '請在聊天框輸入 /memory rebuild-index 重建索引。',
        models_embedding_saved_ok: '去執行',
        models_pick_provider: '待選擇',
        models_clear_confirm_title: '清除廠商憑據',
        models_clear_confirm_msg: '確認清除該廠商的 API Key 與 Base URL 嗎？相關能力將不再可用。',
        cancel: '取消',
        save: '儲存',
        ok: '確定',
        knowledge_title: '知識庫', knowledge_desc: '瀏覽和探索你的知識庫',
        knowledge_tab_docs: '檔案', knowledge_tab_graph: '圖譜',
        knowledge_loading: '載入知識庫中...', knowledge_loading_desc: '知識頁面將顯示在這裡',
        knowledge_select_hint: '選擇一個檔案檢視', knowledge_empty_hint: '暫無知識頁面',
        knowledge_empty_guide: '在對話中傳送檔案、連結或主題給 Agent，它會自動整理到你的知識庫中。',
        knowledge_go_chat: '開始對話',
        knowledge_new: '新建',
        knowledge_new_category: '新建分類',
        knowledge_new_document: '新建檔案',
        knowledge_import_documents: '匯入檔案',
        welcome_subtitle: '我可以幫你解答問題、管理電腦、創造和執行技能，並透過<br>長期記憶和知識庫不斷成長',
        example_sys_title: '系統管理', example_sys_text: '檢視工作空間裡有哪些檔案',
        example_task_title: '定時任務', example_task_text: '1分鐘後提醒我檢查伺服器',
        example_code_title: '程式設計助手', example_code_text: '搜尋AI資訊並生成視覺化網頁報告',
        example_knowledge_title: '知識庫', example_knowledge_text: '檢視知識庫當前檔案情況',
        example_skill_title: '技能系統', example_skill_text: '檢視所有支援的工具和技能',
        example_web_title: '指令中心', example_web_text: '檢視全部命令',
        slash_help: '顯示命令幫助',
        slash_status: '檢視執行狀態',
        slash_context: '檢視對話上下文',
        slash_context_clear: '清除對話上下文',
        slash_skill_list: '檢視已安裝技能',
        slash_skill_list_remote: '瀏覽技能廣場',
        slash_skill_search: '搜尋技能',
        slash_skill_install: '安裝技能 (名稱或 GitHub URL)',
        slash_skill_uninstall: '解除安裝技能',
        slash_skill_info: '檢視技能詳情',
        slash_skill_enable: '啟用技能',
        slash_skill_disable: '禁用技能',
        slash_memory_dream: '手動觸發記憶蒸餾 (可指定天數, 預設3)',
        slash_knowledge: '檢視知識庫統計',
        slash_knowledge_list: '檢視知識庫檔案樹',
        slash_knowledge_on: '開啟知識庫',
        slash_knowledge_off: '關閉知識庫',
        slash_config: '檢視當前設定',
        slash_cancel: '中止當前正在執行的 Agent 任務',
        slash_logs: '檢視最近日誌',
        slash_version: '檢視版本',
        input_placeholder: '輸入訊息，或輸入 / 使用指令',
        config_title: '設定管理', config_desc: '管理模型和 Agent 設定',
        config_model: '模型設定', config_agent: 'Agent 設定',
        config_language: '語言', config_language_hint: '介面展示、命令文案、系統提示詞等使用的語言（與右上角切換同步）',
        config_model_advanced: '高階設定',
        config_channel: '管道設定',
        config_agent_enabled: 'Agent 模式',
        config_max_tokens: '最大上下文 Token', config_max_tokens_hint: '對話中 Agent 能輸入的最大 Token 長度，超過後會智慧壓縮處理',
        config_max_turns: '最大記憶輪次', config_max_turns_hint: '一問一答為一輪，超過後會智慧壓縮處理',
        config_max_steps: '最大執行步數', config_max_steps_hint: '單次對話中 Agent 最多呼叫工具的次數',
        config_enable_thinking: '深度思考', config_enable_thinking_hint: '是否啟用深度思考模式',
        config_self_evolution: '自主進化', config_self_evolution_hint: '會話空閒後自動覆盤，沉澱記憶、最佳化技能、處理未完成事項',
        evolution_badge: '自主學習',
        config_channel_type: '管道型別',
        config_provider: '模型廠商', config_model_name: '模型',
        config_custom_model_hint: '輸入自定義模型名稱',
        config_save: '儲存', config_saved: '已儲存',
        config_save_error: '儲存失敗',
        config_custom_option: '自定義',
        config_custom_tip: '介面需遵循 OpenAI API 協議',
        config_security: '安全設定', config_password: '訪問密碼',
        config_password_hint: '留空則不啟用密碼保護',
        config_password_changed: '密碼已更新',
        config_password_cleared: '密碼已清除',
        config_password_security_warning: '⚠️ 警告：目前密碼為空且對外連接埠開放，建議重啟服務，或檢查是否調整監聽位址綁定。',
        skills_title: '技能管理', skills_desc: '檢視、啟用或禁用 Agent 工具和技能', skills_hub_btn: '探索技能廣場',
        skills_loading: '載入技能中...', skills_loading_desc: '技能載入後將顯示在此處',
        tools_section_title: '內建工具', tools_loading: '載入工具中...',
        skills_section_title: '技能', skill_enable: '啟用', skill_disable: '禁用',
        skill_toggle_error: '操作失敗，請稍後再試',
        memory_title: '記憶管理', memory_desc: '檢視 Agent 記憶檔案和內容',
        memory_tab_files: '記憶檔案', memory_tab_dreams: '自主進化',
        memory_loading: '載入記憶檔案中...', memory_loading_desc: '記憶檔案將顯示在此處',
        memory_back: '返回列表',
        memory_col_name: '檔名', memory_col_type: '型別', memory_col_size: '大小', memory_col_updated: '更新時間',
        channels_title: '管道管理', channels_desc: '管理已接入的訊息管道',
        channels_add: '接入管道', channels_disconnect: '斷開',
        channels_save: '儲存設定', channels_saved: '已儲存', channels_save_error: '儲存失敗',
        channels_restarted: '已儲存並重啟',
        channels_connect_btn: '接入', channels_cancel: '取消',
        channels_select_placeholder: '選擇要接入的管道...',
        channels_empty: '暫未接入任何管道', channels_empty_desc: '點選右上角「接入管道」按鈕開始設定',
        channels_disconnect_confirm: '確認斷開該管道？設定將保留但管道會停止執行。',
        channels_connected: '已接入', channels_connecting: '接入中...',
        weixin_scan_title: '微信掃碼登入', weixin_scan_desc: '請使用微信掃描下方二維碼',
        weixin_scan_loading: '正在獲取二維碼...', weixin_scan_waiting: '等待掃碼...',
        weixin_scan_scanned: '已掃碼，請在手機上確認', weixin_scan_expired: '二維碼已過期，正在重新整理...',
        weixin_scan_success: '登入成功，正在啟動管道...', weixin_scan_fail: '獲取二維碼失敗',
        weixin_qr_tip: '二維碼約2分鐘後過期',
        wecom_scan_btn: '掃碼建立企微機器人', wecom_scan_desc: '使用企業微信掃碼，一鍵建立智慧機器人',
        wecom_scan_success: '建立成功，正在啟動管道...',
        wecom_scan_fail: '建立失敗',
        wecom_mode_scan: '掃碼接入', wecom_mode_manual: '手動填寫',
        feishu_scan_btn: '一鍵建立飛書應用',
        feishu_scan_desc: '使用飛書 App 掃碼，自動建立應用並預置全部許可權與事件訂閱',
        feishu_scan_replace_desc: '使用飛書 App 掃碼建立新機器人，將覆蓋當前的 App ID / Secret',
        feishu_scan_loading: '正在向飛書申請二維碼...',
        feishu_scan_waiting: '等待掃碼...',
        feishu_scan_tip: '二維碼 10 分鐘內有效，僅供一次掃描',
        feishu_scan_open_link: '或點選此處在瀏覽器中開啟',
        feishu_scan_success: '應用建立成功，正在啟動管道...',
        feishu_scan_expired: '二維碼已過期，請重試',
        feishu_scan_denied: '已取消授權',
        feishu_scan_fail: '建立失敗',
        feishu_scan_retry: '重試',
        feishu_mode_scan: '掃碼建立', feishu_mode_manual: '手動填寫',
        tasks_title: '定時任務', tasks_desc: '檢視和管理定時任務',
        tasks_coming: '即將推出', tasks_coming_desc: '定時任務管理功能即將在此提供',
        task_add_btn: '新增任務',
        task_edit_title: '編輯定時任務',
        task_add_title: '新增定時任務',
        task_name: '任務名稱',
        task_enabled: '啟用任務',
        task_schedule_type: '排程型別',
        task_schedule_cron: 'Cron 表示式',
        task_schedule_interval: '固定間隔',
        task_schedule_once: '一次性任務',
        task_cron_expression: 'Cron 表示式',
        task_cron_hint: '格式: 分 時 日 月 周，例如 "0 9 * * *" 表示每天 9:00',
        task_interval_seconds: '間隔秒數',
        task_interval_hint: '最小 60 秒，例如 3600 表示每小時執行一次',
        task_once_time: '執行時間',
        task_action_type: '動作型別',
        task_action_send_message: '傳送訊息',
        task_action_agent_task: 'AI 任務',
        task_channel_type: '管道型別',
        task_channel_hint: '選擇定時訊息傳送的管道',
        task_message_content: '訊息內容',
        task_task_description: '任務描述',
        task_delete_btn: '刪除任務',
        task_delete_confirm_title: '刪除定時任務',
        task_delete_confirm_msg: '確定刪除該定時任務嗎？此操作無法撤銷。',
        logs_title: '日誌', logs_desc: '實時日誌輸出 (run.log)',
        logs_live: '實時', logs_coming_msg: '日誌流即將在此提供。將連線 run.log 實現類似 tail -f 的實時輸出。',
        new_chat: '新對話',
        session_history: '歷史會話',
        today: '今天', yesterday: '昨天', earlier: '更早',
        delete_session_confirm: '確認刪除該會話？所有訊息將被清除。',
        delete_session_title: '刪除會話',
        rename_session: '重新命名',
        delete_message_confirm: '確認刪除這條訊息？',
        delete_message_title: '刪除訊息',
        edit_disabled_reply_active: '正在生成回覆，暫時無法編輯。',
        delete_disabled_reply_active: '正在生成回覆，暫時無法刪除。',
        untitled_session: '新對話',
        context_cleared: '— 以上內容已從上下文中移除 —',
        tip_new_chat: '新建對話',
        tip_clear_context: '清除上下文',
        tip_attach: '新增附件',
        attach_menu_file: '上傳檔案',
        mic_idle_title: '點選錄音 / 再按一次結束',
        mic_recording_title: '錄音中，再次點選結束',
        mic_busy_title: '識別中…',
        mic_permission_denied: '無法訪問麥克風，請檢查瀏覽器許可權',
        mic_too_short: '錄音太短，請重試',
        mic_error: '語音識別失敗',
        speak_msg: '朗讀這段回覆',
        voice_reply_mode_label: '語音回覆策略',
        voice_reply_off: '關閉',
        voice_reply_if_voice: '僅語音問/語音答',
        voice_reply_always: '總是語音回覆',
        attach_menu_folder: '上傳資料夾',
        confirm_yes: '確認',
        confirm_cancel: '取消',
        error_send: '傳送失敗，請稍後再試。', error_timeout: '請求超時，請再試一次。',
        thinking_in_progress: '思考中...', thinking_done: '已深度思考', thinking_duration: '耗時',
        edit_message: '編輯訊息',
        regenerate_response: '重新生成',
        edit_save: '儲存併傳送',
        edit_cancel: '取消',
        logout: '登出',
        },
    en: {
        console: 'Console',
        nav_chat: 'Chat', nav_manage: 'Management', nav_monitor: 'Monitor',
        menu_chat: 'Chat', menu_config: 'Config', menu_models: 'Models', menu_skills: 'Skills',
        menu_memory: 'Memory', menu_knowledge: 'Knowledge', menu_channels: 'Channels', menu_tasks: 'Tasks',
        menu_logs: 'Logs', menu_permissions: 'Permissions', menu_kanban: 'Kanban', menu_projects: 'Projects',
        permissions_title: 'Permissions Management', permissions_desc: 'Manage user access to knowledge base and Kingdee',
        permissions_sync_users: 'Sync Users', permissions_knowledge: 'Knowledge Permissions', permissions_kingdee: 'Kingdee Permissions',
        permissions_enabled_label: 'Enable Permissions',
        permissions_audit: 'Audit Log',
        models_title: 'Models',
        models_desc: 'Manage chat, image, voice, embedding and search capabilities in one place',
        models_section_vendors: 'Provider Credentials',
        models_section_vendors_desc: 'Configured once, shared by multiple model capabilities',
        models_section_capabilities: 'Capabilities',
        models_add_vendor: 'Add Provider',
        models_provider: 'Provider',
        models_model: 'Model',
        models_voice: 'Voice',
        models_configured: 'configured',
        models_not_configured: 'not configured',
        models_pick_to_configure: 'pick to configure',
        models_clear_credential: 'Clear credentials',
        models_base_default_hint: 'Leave blank to use the official default base URL',
        models_base_default: 'Default',
        models_custom_vendor_label: 'Custom',
        models_custom_name: 'Name',
        models_custom_delete: 'Delete',
        models_custom_delete_confirm_title: 'Delete custom provider',
        models_custom_delete_confirm_msg: 'Delete this custom provider? This cannot be undone.',
        models_custom_name_required: 'Name is required',
        models_custom_base_required: 'API Base is required',
        models_custom_edit_title: 'Edit custom provider',
        models_custom_add_title: 'Add custom provider',
        models_capability_chat: 'Main Model',
        models_capability_chat_desc: 'Used for basic chat and agent reasoning',
        models_capability_vision: 'Image Understanding',
        models_capability_vision_desc: 'Recognizes image content, used by image recognition tools',
        models_capability_image: 'Image Generation',
        models_capability_image_desc: 'Generates images, used by image generation skills',
        models_auto_using: 'Preferred',
        models_capability_asr: 'Speech Recognition',
        models_capability_asr_desc: 'Voice to text',
        models_capability_tts: 'Speech Synthesis',
        models_capability_tts_desc: 'Text to voice',
        models_capability_embedding: 'Embedding',
        models_capability_embedding_desc: 'Used for vectorized retrieval of memory and knowledge',
        models_capability_search: 'Web Search',
        models_capability_search_desc: 'Real-time web retrieval, used by search tools',
        models_strategy_auto: 'auto',
        models_search_strategy_label: 'Strategy',
        models_search_strategy_fixed: 'Pinned',
        models_search_strategy_auto_hint: 'Auto-pick from configured providers',
        models_search_strategy_fixed_hint: 'Always use a specific provider',
        models_pending_config: 'Pending setup',
        models_search_available_label: 'Available:',
        models_search_none_configured: 'No search provider enabled yet — click add.',
        models_search_add_provider: 'Add provider',
        models_search_add_desc: 'Pick a search provider to configure',
        models_search_bocha_title: 'Configure Bocha API Key',
        models_search_bocha_desc: 'Create a key at the Bocha open platform.',
        models_search_edit_hint: 'Click to edit',
        models_unavailable: 'unavailable',
        models_set_via_env: 'enable via environment variable',
        models_dim_label: 'dim',
        models_save_success: 'Saved',
        models_save_failed: 'Save failed',
        models_cleared: 'Cleared',
        models_clear_failed: 'Clear failed',
        models_embedding_change_title: 'Change embedding model',
        models_embedding_change_msg: 'Switching the embedding model invalidates the existing index — a rebuild will be needed. Continue?',
        models_embedding_saved_title: 'Embedding model updated',
        models_embedding_saved_msg: 'Send /memory rebuild-index in the chat to rebuild the index.',
        models_embedding_saved_ok: 'Go',
        models_pick_provider: 'Pick a provider',
        models_clear_confirm_title: 'Clear provider credentials',
        models_clear_confirm_msg: 'Remove this provider\'s API Key and Base URL? Capabilities relying on it will stop working.',
        cancel: 'Cancel',
        save: 'Save',
        ok: 'OK',
        knowledge_title: 'Knowledge', knowledge_desc: 'Browse and explore your knowledge base',
        knowledge_tab_docs: 'Documents', knowledge_tab_graph: 'Graph',
        knowledge_loading: 'Loading knowledge base...', knowledge_loading_desc: 'Knowledge pages will be displayed here',
        knowledge_select_hint: 'Select a document to view', knowledge_empty_hint: 'No knowledge pages yet',
        knowledge_empty_guide: 'Send documents, links or topics to the agent in chat, and it will automatically organize them into your knowledge base.',
        knowledge_go_chat: 'Start a conversation',
        knowledge_new: 'New',
        knowledge_new_category: 'New category',
        knowledge_new_document: 'New document',
        knowledge_import_documents: 'Import documents',
        welcome_subtitle: 'I can help you answer questions, manage your computer, create and execute skills, and keep growing through <br> long-term memory and a personal knowledge base.',
        example_sys_title: 'System', example_sys_text: 'Show me the files in the workspace',
        example_task_title: 'Scheduler', example_task_text: 'Remind me to check the server in 5 minutes',
        example_code_title: 'Coding', example_code_text: 'Search today\'s AI news and generate a visual report webpage',
        example_knowledge_title: 'Knowledge', example_knowledge_text: 'Show me the current knowledge base',
        example_skill_title: 'Skills', example_skill_text: 'Show current tools and skills',
        example_web_title: 'Commands', example_web_text: 'Show all commands',
        slash_help: 'Show this help',
        slash_status: 'Show running status',
        slash_context: 'Show conversation context',
        slash_context_clear: 'Clear conversation context',
        slash_skill_list: 'List installed skills',
        slash_skill_list_remote: 'Browse Skill Hub',
        slash_skill_search: 'Search skills',
        slash_skill_install: 'Install a skill (name or GitHub URL)',
        slash_skill_uninstall: 'Uninstall a skill',
        slash_skill_info: 'Show skill details',
        slash_skill_enable: 'Enable a skill',
        slash_skill_disable: 'Disable a skill',
        slash_memory_dream: 'Trigger memory distillation (optional days, default 3)',
        slash_knowledge: 'Show knowledge base stats',
        slash_knowledge_list: 'Show knowledge base file tree',
        slash_knowledge_on: 'Enable knowledge base',
        slash_knowledge_off: 'Disable knowledge base',
        slash_config: 'Show current config',
        slash_cancel: 'Abort the running Agent task',
        slash_logs: 'Show recent logs',
        slash_version: 'Show version',
        input_placeholder: 'Type a message, or press / for commands',
        config_title: 'Configuration', config_desc: 'Manage model and agent settings',
        config_model: 'Model Configuration', config_agent: 'Agent Configuration',
        config_language: 'Language', config_language_hint: 'Language for the UI, command text, system prompts and more (synced with the top-right switch)',
        config_model_advanced: 'Advanced',
        config_channel: 'Channel Configuration',
        config_agent_enabled: 'Agent Mode',
        config_max_tokens: 'Max Context Tokens', config_max_tokens_hint: 'Max tokens the Agent can input per conversation, auto-compressed when exceeded',
        config_max_turns: 'Max Memory Turns', config_max_turns_hint: 'One Q&A pair = one turn, auto-compressed when exceeded',
        config_max_steps: 'Max Steps', config_max_steps_hint: 'Max tool calls the Agent can make in a single conversation',
        config_enable_thinking: 'Deep Thinking', config_enable_thinking_hint: 'Enable deep thinking mode',
        config_self_evolution: 'Self-Evolution', config_self_evolution_hint: 'Auto-review idle conversations to consolidate memory, improve skills, and follow up on unfinished tasks',
        evolution_badge: 'Self-learned',
        config_channel_type: 'Channel Type',
        config_provider: 'Provider', config_model_name: 'Model',
        config_custom_model_hint: 'Enter custom model name',
        config_save: 'Save', config_saved: 'Saved',
        config_save_error: 'Save failed',
        config_custom_option: 'Custom',
        config_custom_tip: 'API must follow OpenAI protocol.',
        config_security: 'Security', config_password: 'Password',
        config_password_hint: 'Leave empty to disable password protection',
        config_password_changed: 'Password updated',
        config_password_cleared: 'Password cleared',
        config_password_security_warning: '⚠️ Warning: Password is now empty and the port is exposed. Consider restarting the service or adjusting the listening address binding.',
        skills_title: 'Skills', skills_desc: 'View, enable, or disable agent tools and skills', skills_hub_btn: 'Skill Hub',
        skills_loading: 'Loading skills...', skills_loading_desc: 'Skills will be displayed here after loading',
        tools_section_title: 'Built-in Tools', tools_loading: 'Loading tools...',
        skills_section_title: 'Skills', skill_enable: 'Enable', skill_disable: 'Disable',
        skill_toggle_error: 'Operation failed, please try again',
        memory_title: 'Memory', memory_desc: 'View agent memory files and contents',
        memory_tab_files: 'Memory Files', memory_tab_dreams: 'Self-Evolution',
        memory_loading: 'Loading memory files...', memory_loading_desc: 'Memory files will be displayed here',
        memory_back: 'Back to list',
        memory_col_name: 'Filename', memory_col_type: 'Type', memory_col_size: 'Size', memory_col_updated: 'Updated',
        channels_title: 'Channels', channels_desc: 'Manage connected messaging channels',
        channels_add: 'Connect', channels_disconnect: 'Disconnect',
        channels_save: 'Save', channels_saved: 'Saved', channels_save_error: 'Save failed',
        channels_restarted: 'Saved & Restarted',
        channels_connect_btn: 'Connect', channels_cancel: 'Cancel',
        channels_select_placeholder: 'Select a channel to connect...',
        channels_empty: 'No channels connected', channels_empty_desc: 'Click the "Connect" button above to get started',
        channels_disconnect_confirm: 'Disconnect this channel? Config will be preserved but the channel will stop.',
        channels_connected: 'Connected', channels_connecting: 'Connecting...',
        weixin_scan_title: 'WeChat QR Login', weixin_scan_desc: 'Scan the QR code below with WeChat',
        weixin_scan_loading: 'Loading QR code...', weixin_scan_waiting: 'Waiting for scan...',
        weixin_scan_scanned: 'Scanned, please confirm on your phone', weixin_scan_expired: 'QR code expired, refreshing...',
        weixin_scan_success: 'Login successful, starting channel...', weixin_scan_fail: 'Failed to load QR code',
        weixin_qr_tip: 'QR code expires in ~2 minutes',
        wecom_scan_btn: 'Scan to Create WeCom Bot', wecom_scan_desc: 'Scan with WeCom to create a bot instantly',
        wecom_scan_success: 'Bot created, starting channel...',
        wecom_scan_fail: 'Bot creation failed',
        wecom_mode_scan: 'Scan QR', wecom_mode_manual: 'Manual',
        feishu_scan_btn: 'One-click Create Feishu App',
        feishu_scan_desc: 'Scan with Feishu App to create an app with all required permissions pre-configured',
        feishu_scan_replace_desc: 'Scan with Feishu App to create a new bot — will overwrite the current App ID / Secret',
        feishu_scan_loading: 'Requesting QR code from Feishu...',
        feishu_scan_waiting: 'Waiting for scan...',
        feishu_scan_tip: 'QR code expires in 10 minutes, single use only',
        feishu_scan_open_link: 'Or click here to open in browser',
        feishu_scan_success: 'App created, starting channel...',
        feishu_scan_expired: 'QR code expired, please retry',
        feishu_scan_denied: 'Authorization cancelled',
        feishu_scan_fail: 'App creation failed',
        feishu_scan_retry: 'Retry',
        feishu_mode_scan: 'Scan QR', feishu_mode_manual: 'Manual',
        tasks_title: 'Scheduled Tasks', tasks_desc: 'View and manage scheduled tasks',
        tasks_coming: 'Coming Soon', tasks_coming_desc: 'Scheduled task management will be available here',
        task_add_btn: 'Add Task',
        task_edit_title: 'Edit Task',
        task_add_title: 'Add Task',
        task_name: 'Task Name',
        task_enabled: 'Enable Task',
        task_schedule_type: 'Schedule Type',
        task_schedule_cron: 'Cron Expression',
        task_schedule_interval: 'Fixed Interval',
        task_schedule_once: 'One-time Task',
        task_cron_expression: 'Cron Expression',
        task_cron_hint: 'Format: minute hour day month weekday, e.g. "0 9 * * *" means daily at 9:00',
        task_interval_seconds: 'Interval (seconds)',
        task_interval_hint: 'Minimum 60 seconds, e.g. 3600 means once per hour',
        task_once_time: 'Execution Time',
        task_action_type: 'Action Type',
        task_action_send_message: 'Send Message',
        task_action_agent_task: 'AI Task',
        task_channel_type: 'Channel Type',
        task_channel_hint: 'Select the channel to send scheduled messages',
        task_message_content: 'Message Content',
        task_task_description: 'Task Description',
        task_delete_btn: 'Delete Task',
        task_delete_confirm_title: 'Delete Task',
        task_delete_confirm_msg: 'Delete this scheduled task? This action cannot be undone.',
        logs_title: 'Logs', logs_desc: 'Real-time log output (run.log)',
        logs_live: 'Live', logs_coming_msg: 'Log streaming will be available here. Connects to run.log for real-time output similar to tail -f.',
        kanban_title: 'Kingdee Kanban', kanban_desc: 'Kingdee Cloud order approval status at a glance',
        kanban_sale: 'Sales Order', kanban_purchase: 'Purchase Order',
        kanban_loading: 'Loading kanban data...', kanban_error: 'Failed to load',
        kanban_col_draft: 'Draft', kanban_col_pending: 'Pending Submit', kanban_col_review: 'Pending Review',
        kanban_col_approved: 'Approved', kanban_col_rejected: 'Re-review',
        kanban_total: 'Total', kanban_detail_title: 'Bill Detail',
        kanban_detail_loading: 'Loading details...',
        kanban_no_data: 'No Data',
        kanban_close: 'Close',
        kanban_view_board: 'Board', kanban_view_table: 'Table',
        kanban_view_pie: 'Pie', kanban_view_bar: 'Bar', kanban_view_line: 'Line',
        kanban_filter_placeholder: 'Search enterprise name or bill no...',
        kanban_table_summary: '{count} records, total (tax incl.): ¥{amount}',
        kanban_conversion: 'Conversion Stats',
        kanban_overdue: 'Overdue Stats',
        kanban_overdue_loading: 'Loading overdue stats...',
        kanban_overdue_error: 'Failed to load overdue stats',
        kanban_overdue_kpi_total: 'Total AR',
        kanban_overdue_kpi_overdue_amt: 'Overdue Amt',
        kanban_overdue_kpi_overdue_rate: 'Overdue Rate',
        kanban_overdue_kpi_overdue_count: 'Overdue Count',
        kanban_overdue_kpi_avg_days: 'Avg Overdue Days',
        kanban_overdue_kpi_due_soon: 'Due in 7 Days',
        kanban_overdue_aging_title: 'Aging Distribution',
        kanban_overdue_customer_rank: 'Customer Ranking',
        kanban_overdue_detail_title: 'Overdue Details',
        kanban_overdue_top_hint: 'Showing top 2000 records',
        kanban_overdue_col_billno: 'Bill No.',
        kanban_overdue_col_date: 'Bill Date',
        kanban_overdue_col_due_date: 'Due Date',
        kanban_overdue_col_customer: 'Customer',
        kanban_overdue_col_material: 'Material',
        kanban_overdue_col_spec: 'Spec',
        kanban_overdue_col_amount: 'Total(¥)',
        kanban_overdue_col_settle: 'Settled(¥)',
        kanban_overdue_col_unsettle: 'Unsettled(¥)',
        kanban_overdue_col_open_amount: 'Invoice Write-off(¥)',
        kanban_overdue_col_days: 'Overdue Days',
        kanban_overdue_col_status: 'Status',
        kanban_overdue_status_overdue: 'Overdue',
        kanban_overdue_status_normal: 'Normal',
        kanban_conversion_loading: 'Loading conversion stats...',
        kanban_conversion_error: 'Failed to load conversion stats',
        kanban_conversion_quotation_title: 'Quotation → Sales Order',
        kanban_conversion_sample_title: 'Sample → Sales Order',
        kanban_conversion_detail_title: 'Conversion Details',
        kanban_conversion_so_perspective: 'Sales Order View',
        kanban_conversion_qt_perspective: 'Quotation View',
        kanban_conversion_sp_perspective: 'Sample Order View',
        kanban_conversion_total_so: 'Total Sales Orders',
        kanban_conversion_from_qt: 'From Quotation',
        kanban_conversion_from_qt_rate: 'Quotation Source Rate',
        kanban_conversion_total_qt: 'Total Quotations',
        kanban_conversion_total_sp: 'Total Sample Orders',
        kanban_conversion_converted: 'Converted',
        kanban_conversion_qt_rate: 'Quotation Conv. Rate',
        kanban_conversion_qt_converted_amount: 'Quotation Conv. Amount',
        kanban_conversion_sample_so: 'Sample Orders',
        kanban_conversion_sample_rate: 'Sample Order Ratio',
        kanban_conversion_sample_converted: 'Converted Samples',
        kanban_conversion_sample_conv_rate: 'Sample Conv. Rate',
        kanban_conversion_sp_converted_amount: 'Sample Conv. Amount',
        kanban_conversion_detail_pairs: 'Converted Bill Pairs',
        kanban_conversion_detail_customer: 'Conversion by Customer',
        kanban_conversion_column_qt_bill: 'Quotation No.',
        kanban_conversion_column_qt_date: 'Qut. Date',
        kanban_conversion_column_so_bill: 'Sales Order No.',
        kanban_conversion_column_so_date: 'SO Date',
        kanban_conversion_column_sample_bill: 'Sample Order No.',
        kanban_conversion_column_sample_date: 'Sample Date',
        kanban_conversion_column_normal_bill: 'Normal Order No.',
        kanban_conversion_column_normal_date: 'Normal Date',
        kanban_conversion_column_amount: 'Total with Tax(¥)',
        kanban_conversion_column_customer: 'Customer',
        kanban_conversion_column_material: 'Material',
        kanban_conversion_column_spec: 'Spec',
        kanban_conversion_column_type: 'Type',
        kanban_conversion_column_total: 'Total',
        kanban_conversion_column_converted: 'Converted',
        kanban_conversion_column_rate: 'Conv. Rate',
        kanban_conversion_column_mat_name: 'Material Name',
        kanban_conversion_column_qty: 'Qty',
        kanban_conversion_column_unit: 'Unit',
        kanban_conversion_column_price: 'Unit Price (Tax incl.)',
        kanban_conversion_column_status: 'Status',
        kanban_conversion_column_saler: 'Salesman',
        kanban_conversion_column_converted_flag: 'Converted',
        kanban_conversion_type_quotation: 'Quotation',
        kanban_conversion_type_sample: 'Sample',
        kanban_conversion_no_data: 'No converted bills yet',
        kanban_conversion_export_btn: 'Export Excel',
        kanban_conversion_export_pairs: 'Export Bill Pairs',
        kanban_conversion_export_summary: 'Export Customer Summary',
        kanban_conversion_export_success: 'Excel file generated',
        kanban_conversion_loading_export: 'Exporting Excel...',
        kanban_conversion_customer_analysis: 'Customer Conversion Deep Analysis',
        kanban_conversion_high_converters: 'High Converters',
        kanban_conversion_low_converters: 'Needs Follow-up',
        kanban_conversion_high_qt: 'High Conv. (Quotation)',
        kanban_conversion_low_qt: 'Needs Follow-up (Quotation)',
        kanban_conversion_high_sp: 'High Conv. (Sample)',
        kanban_conversion_low_sp: 'Needs Follow-up (Sample)',
        kanban_conversion_view_all: 'View All {n} Customers',
        kanban_conversion_view_less: 'Collapse',
        kanban_conversion_search_customer: 'Search customer name...',
        kanban_conversion_sort_by_rate: 'By Rate',
        kanban_conversion_sort_by_total: 'By Total',
        kanban_conversion_sort_by_date: 'By Last Date',
        kanban_conversion_no_high: 'No high-conversion customers yet',
        kanban_conversion_no_low: 'All customers converted ✅',
        kanban_conversion_last_date: 'Last Date',
        kanban_conversion_sample_note: 'Sample conv.: customer placed formal order with same material after sample',
        kanban_conversion_qt_count: '{n} quoted {m} converted',
        kanban_conversion_analysis_export: 'Export Customer Analysis',
        projects_title: 'Project Management', projects_desc: 'Upload project Excel files to analyze progress and detect stalled items',
        projects_upload_title: 'Upload Project File', projects_upload_hint: 'Drag & drop Excel file here, or click to upload',
        projects_upload_supported: 'Supports .xlsx format', projects_upload_btn: 'Select File',
        projects_upload_loading: 'Parsing and analyzing data...',
        projects_stats_total: 'Total Projects', projects_stats_stalled: 'Stalled Projects', projects_stats_healthy: 'Health Rate',
        projects_stalled_title: 'Stalled Projects Alert', projects_stalled_desc: 'The following projects haven\'t been updated for over 30 days',
        projects_stalled_days: ' days without update',
        projects_table_title: 'All Project Data',
        projects_error_upload: 'Upload failed',
        projects_error_no_date: 'No date column detected, unable to analyze stalled projects',
        projects_error_no_progress: 'No progress column detected, unable to calculate health rate',
        projects_error_no_name: 'No project name column detected',
        projects_halfyear_goal: 'Half-Year Goal',
        projects_monthly_goal: 'Monthly Goal',
        projects_action_plan: 'Action Plan',
        new_chat: 'New Chat',
        session_history: 'History',
        today: 'Today', yesterday: 'Yesterday', earlier: 'Earlier',
        delete_session_confirm: 'Delete this session? All messages will be removed.',
        delete_session_title: 'Delete Session',
        rename_session: 'Rename',
        delete_message_confirm: 'Delete this message?',
        delete_message_title: 'Delete Message',
        edit_disabled_reply_active: 'Reply is being generated; editing is temporarily unavailable.',
        delete_disabled_reply_active: 'Reply is being generated; deletion is temporarily unavailable.',
        untitled_session: 'New Chat',
        context_cleared: '— Context above has been cleared —',
        tip_new_chat: 'New Chat',
        tip_clear_context: 'Clear Context',
        tip_attach: 'Add Attachment',
        attach_menu_file: 'Upload File',
        mic_idle_title: 'Click to record, click again to stop',
        mic_recording_title: 'Recording, click to stop',
        mic_busy_title: 'Transcribing…',
        mic_permission_denied: 'Cannot access microphone — check browser permissions',
        mic_too_short: 'Recording too short, please retry',
        mic_error: 'Speech recognition failed',
        speak_msg: 'Read this reply aloud',
        voice_reply_mode_label: 'Voice reply policy',
        voice_reply_off: 'Off',
        voice_reply_if_voice: 'Voice only if voice input',
        voice_reply_always: 'Always reply with voice',
        attach_menu_folder: 'Upload Folder',
        confirm_yes: 'Confirm',
        confirm_cancel: 'Cancel',
        error_send: 'Failed to send. Please try again.', error_timeout: 'Request timeout. Please try again.',
        thinking_in_progress: 'Thinking...', thinking_done: 'Thought', thinking_duration: 'Duration',
        edit_message: 'Edit message',
        regenerate_response: 'Regenerate',
        edit_save: 'Save and send',
        edit_cancel: 'Cancel',
        logout: 'Logout',
    }
};

// Resolve language by priority: user choice (localStorage) -> backend-detected
// (cow_lang) -> browser language -> 'zh'. Shares __cowResolveLang__ defined in
// chat.html; falls back to a local resolver if loaded standalone.
let currentLang = (typeof window.__cowResolveLang__ === 'function')
    ? window.__cowResolveLang__()
    : (function () {
        const norm = (raw) => {
            if (!raw) return '';
            const v = String(raw).trim().toLowerCase();
            if (v === 'auto') return '';
            // Handle Traditional Chinese variants first (more specific)
            if (v === 'zh-hant' || v.startsWith('zh-hant-') || v === 'zh-tw' || v === 'zh-hk') return 'zh-Hant';
            // Then Simplified Chinese
            if (v.indexOf('zh') === 0) return 'zh';
            if (v.indexOf('en') === 0) return 'en';
            return '';
        };
        return norm(localStorage.getItem('cow_lang'))
            || norm(window.__COW_DEFAULT_LANG__)
            || norm(navigator.language)
            || 'zh';
    })();

function t(key) {
    return (I18N[currentLang] && I18N[currentLang][key]) || (I18N.en[key]) || key;
}

// Resolve a localized label that may be either a plain string or
// a {zh, en} object returned by the backend.
function localizedLabel(label) {
    if (label && typeof label === 'object') {
        return label[currentLang] || label.en || label.zh || '';
    }
    return label || '';
}

function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        el.innerHTML = t(el.dataset.i18nHtml);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.dataset['i18nPlaceholder']);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.title = t(el.dataset['i18nTitle']);
    });
    document.querySelectorAll('[data-tip-key]').forEach(el => {
        el.setAttribute('data-tooltip', t(el.dataset.tipKey));
    });
    installCfgTipPortal();
    
    // Clear any status messages when language changes
    document.querySelectorAll('[id$="-status"]').forEach(el => {
        el.classList.add('opacity-0');
    });
    
    const langLabel = document.getElementById('lang-label');
    if (langLabel) {
        if (currentLang === 'zh-Hant') langLabel.textContent = '繁体';
        else if (currentLang === 'zh') langLabel.textContent = '简体';
        else langLabel.textContent = 'EN';
    }
    // Highlight the active option in the header language dropdown menu.
    document.querySelectorAll('#lang-menu .lang-menu-item').forEach(item => {
        const active = item.dataset.lang === currentLang;
        item.classList.toggle('text-blue-600', active);
        item.classList.toggle('dark:text-blue-400', active);
        item.classList.toggle('font-medium', active);
    });
    // Point the docs link to the locale-specific documentation site.
    const docsLink = document.getElementById('docs-link');
    if (docsLink) docsLink.href = currentLang === 'zh' ? 'https://docs.cowagent.ai/zh' : 'https://docs.cowagent.ai';
}

// Single entry point for switching language. Updates the in-memory language,
// persists the user choice locally, re-renders the UI, and binds the choice to
// the backend `cow_lang` config so logs / agent replies / CLI follow suit.
function setLanguage(lang) {
    const next = (lang === 'en' || lang === 'zh' || lang === 'zh-Hant') ? lang : 'zh';
    if (next === currentLang) {
        // Still persist + sync in case storage/backend drifted from the UI.
        syncLanguageToBackend(next);
        return;
    }
    currentLang = next;
    localStorage.setItem('cow_lang', currentLang);
    applyI18n();
    _applyInputTooltips();
    // Keep the language switch button and config selector visually in sync.
    try { updateLangControls(); } catch (e) {}
    
    // Sync language choice to backend first, then trigger dynamic views reload
    // to avoid race conditions on API endpoints.
    syncLanguageToBackend(currentLang, () => {
        try { rerenderDynamicViews(); } catch (e) {}
    });
}

// Persist the language to the backend `cow_lang` config (best-effort; the UI
// has already switched locally, so a network failure is non-blocking).
function syncLanguageToBackend(lang, callback) {
    try {
        fetch('/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates: { cow_lang: lang } })
        })
        .then(() => { if (callback) callback(); })
        .catch(() => { if (callback) callback(); });
    } catch (e) {
        if (callback) callback();
    }
}

// Reflect the current language on both the top-right toggle and the config
// selector (if present), so the two entry points stay synchronized.
function updateLangControls() {
    const langLabel = document.getElementById('lang-label');
    if (langLabel) {
        if (currentLang === 'zh-Hant') langLabel.textContent = '繁体';
        else if (currentLang === 'zh') langLabel.textContent = '简体';
        else langLabel.textContent = 'EN';
    }
    // Highlight the active option in the header language dropdown menu.
    document.querySelectorAll('#lang-menu .lang-menu-item').forEach(item => {
        const active = item.dataset.lang === currentLang;
        item.classList.toggle('text-blue-600', active);
        item.classList.toggle('dark:text-blue-400', active);
        item.classList.toggle('font-medium', active);
    });
    // The config language picker is the custom .cfg-dropdown component. Only
    // sync it once it has been initialized (i.e. the config panel was opened).
    const sel = document.getElementById('cfg-lang-select');
    if (sel && sel._ddValue !== undefined && sel._ddValue !== currentLang) {
        sel._ddValue = currentLang;
        const textEl = sel.querySelector('.cfg-dropdown-text');
        if (textEl) {
            if (currentLang === 'zh-Hant') textEl.textContent = '繁體中文';
            else if (currentLang === 'zh') textEl.textContent = '简体中文';
            else textEl.textContent = 'English';
        }
        sel.querySelectorAll('.cfg-dropdown-item').forEach(i => {
            i.classList.toggle('active', i.dataset.value === currentLang);
        });
    }
}

// Toggle the header language dropdown menu open/closed.
function toggleLangMenu(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('lang-menu');
    if (menu) menu.classList.toggle('hidden');
}

// Pick a language from the dropdown, then close the menu.
function selectLanguage(lang) {
    const menu = document.getElementById('lang-menu');
    if (menu) menu.classList.add('hidden');
    setLanguage(lang);
}
window.toggleLangMenu = toggleLangMenu;
window.selectLanguage = selectLanguage;

// Close the language menu when clicking outside of it.
document.addEventListener('click', (e) => {
    const selector = document.getElementById('lang-selector');
    const menu = document.getElementById('lang-menu');
    if (menu && !menu.classList.contains('hidden') && selector && !selector.contains(e.target)) {
        menu.classList.add('hidden');
    }
});

// Refresh JS-rendered views after a language switch. Each branch uses the
// lightweight in-memory re-render path (no extra network round-trips).
function rerenderDynamicViews() {
    if (currentView === 'models' && typeof renderModelsView === 'function'
            && modelsState && (modelsState.providers || modelsState.capabilities)) {
        renderModelsView();
    }
    // Reload task list after language switch
    if (currentView === 'tasks') {
        tasksLoaded = false;
        loadTasksView();
    }
    // Reload skills and tools after language switch
    if (currentView === 'skills') {
        toolsLoaded = false;
        loadSkillsView();
    }
    // Reload channels after language switch
    if (currentView === 'channels') {
        loadChannelsView();
    }
    // Reload config after language switch
    if (currentView === 'config') {
        loadConfigView();
    }
}

// Floating tooltip portal for [data-tip-key] elements. Tooltip nodes are
// appended to <body> so they aren't clipped by overflow:hidden ancestors
// (e.g. the config panel's scroll container).
let _cfgTipPortalEl = null;
let _cfgTipPortalInstalled = false;
function installCfgTipPortal() {
    if (_cfgTipPortalInstalled) return;
    _cfgTipPortalInstalled = true;

    const showTip = (target) => {
        const text = target.getAttribute('data-tooltip');
        if (!text) return;
        if (!_cfgTipPortalEl) {
            _cfgTipPortalEl = document.createElement('div');
            _cfgTipPortalEl.className = 'cfg-tip-floating';
            document.body.appendChild(_cfgTipPortalEl);
        }
        _cfgTipPortalEl.textContent = text;
        const rect = target.getBoundingClientRect();
        // Render once to measure, then position above the target, centered.
        _cfgTipPortalEl.style.left = '0px';
        _cfgTipPortalEl.style.top = '0px';
        _cfgTipPortalEl.classList.add('show');
        const tipRect = _cfgTipPortalEl.getBoundingClientRect();
        let left = rect.left + rect.width / 2 - tipRect.width / 2;
        // Clamp horizontally to the viewport with an 8px gutter.
        left = Math.max(8, Math.min(left, window.innerWidth - tipRect.width - 8));
        const top = rect.top - tipRect.height - 6;
        _cfgTipPortalEl.style.left = left + 'px';
        _cfgTipPortalEl.style.top = top + 'px';
    };
    const hideTip = () => {
        if (_cfgTipPortalEl) _cfgTipPortalEl.classList.remove('show');
    };

    document.addEventListener('mouseover', (e) => {
        const target = e.target.closest('[data-tip-key]');
        if (target) showTip(target);
    });
    document.addEventListener('mouseout', (e) => {
        const target = e.target.closest('[data-tip-key]');
        if (target) hideTip();
    });
    // Hide on scroll/resize so the tooltip doesn't drift away from its anchor.
    window.addEventListener('scroll', hideTip, true);
    window.addEventListener('resize', hideTip);
}

// =====================================================================
// Theme
// =====================================================================
let currentTheme = localStorage.getItem('cow_theme') || 'light';

function applyTheme() {
    const root = document.documentElement;
    if (currentTheme === 'dark') {
        root.classList.add('dark');
        document.getElementById('theme-icon').className = 'fas fa-sun';
        document.getElementById('hljs-light').disabled = true;
        document.getElementById('hljs-dark').disabled = false;
    } else {
        root.classList.remove('dark');
        document.getElementById('theme-icon').className = 'fas fa-moon';
        document.getElementById('hljs-light').disabled = false;
        document.getElementById('hljs-dark').disabled = true;
    }
}

function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('cow_theme', currentTheme);
    applyTheme();
}

// =====================================================================
// Sidebar & Navigation
// =====================================================================
const VIEW_META = {
    chat:     { group: 'nav_chat',    page: 'menu_chat' },
    config:   { group: 'nav_manage',  page: 'menu_config' },
    models:   { group: 'nav_manage',  page: 'menu_models' },
    skills:   { group: 'nav_manage',  page: 'menu_skills' },
    memory:   { group: 'nav_manage',  page: 'menu_memory' },
    knowledge:{ group: 'nav_manage',  page: 'menu_knowledge' },
    channels: { group: 'nav_manage',  page: 'menu_channels' },
    tasks:    { group: 'nav_manage',  page: 'menu_tasks' },
    logs:     { group: 'nav_monitor', page: 'menu_logs' },
    permissions: { group: 'nav_manage', page: 'menu_permissions' },
    kanban:    { group: 'nav_manage', page: 'menu_kanban' },
    overdue:   { group: 'nav_manage', page: 'menu_overdue' },
    projects:  { group: 'nav_manage', page: 'menu_projects' },
};

let currentView = 'chat';

function navigateTo(viewId) {
    if (!VIEW_META[viewId]) return;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById('view-' + viewId);
    if (target) target.classList.add('active');
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.toggle('active', item.dataset.view === viewId);
    });
    const meta = VIEW_META[viewId];
    document.getElementById('breadcrumb-group').textContent = t(meta.group);
    document.getElementById('breadcrumb-group').dataset.i18n = meta.group;
    document.getElementById('breadcrumb-page').textContent = t(meta.page);
    document.getElementById('breadcrumb-page').dataset.i18n = meta.page;
    currentView = viewId;
    if (viewId === 'kanban') loadKanbanView();
    if (viewId === 'projects') loadProjectsView();
    
    // Clear status messages when navigating away
    document.querySelectorAll('[id$="-status"]').forEach(el => {
        el.classList.add('opacity-0');
    });
    
    if (window.innerWidth < 1024) closeSidebar();
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const isOpen = !sidebar.classList.contains('-translate-x-full');
    if (isOpen) {
        closeSidebar();
    } else {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
    }
}

function closeSidebar() {
    document.getElementById('sidebar').classList.add('-translate-x-full');
    document.getElementById('sidebar-overlay').classList.add('hidden');
}

document.querySelectorAll('.menu-group > button').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.parentElement.classList.toggle('open');
    });
});

document.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', () => navigateTo(item.dataset.view));
});

window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) {
        document.getElementById('sidebar').classList.remove('-translate-x-full');
        document.getElementById('sidebar-overlay').classList.add('hidden');
    } else {
        if (!document.getElementById('sidebar').classList.contains('-translate-x-full')) {
            closeSidebar();
        }
    }
});

// =====================================================================
// Markdown Renderer
// =====================================================================
const FALLBACK_HLJS = {
    getLanguage() { return false; },
    highlight(str) { return { value: escapeHtml(str) }; },
    highlightAuto(str) { return { value: escapeHtml(str) }; },
    highlightElement() {},
};

function getHljs() {
    return window.hljs || FALLBACK_HLJS;
}

function createMd() {
    const hljsLib = getHljs();
    const mdFactory = window.markdownit;
    if (typeof mdFactory !== 'function') {
        return {
            render(text) {
                return `<p>${escapeHtml(text || '')}</p>`;
            }
        };
    }
    const md = mdFactory({
        html: false, breaks: true, linkify: true, typographer: true,
        highlight: function(str, lang) {
            if (lang && hljsLib.getLanguage(lang)) {
                try { return hljsLib.highlight(str, { language: lang }).value; } catch (_) {}
            }
            return hljsLib.highlightAuto(str).value;
        }
    });
    // Fix greedy linkify: markdown-it's linkify swallows markdown emphasis (*)
    // and CJK full-width punctuation glued to a URL (common in LLM output like
    // "**https://x**，中文"), turning the whole tail into one broken link. Cut
    // the URL at the first such char and spill the remainder back as text.
    var GREEDY_LINK_CUT = /[*\u3000-\u303F\uFF00-\uFFEF]/;
    md.core.ruler.after('linkify', 'fix_greedy_linkify', function(state) {
        for (var b = 0; b < state.tokens.length; b++) {
            var blk = state.tokens[b];
            if (blk.type !== 'inline' || !blk.children) continue;
            var ch = blk.children;
            for (var i = 0; i < ch.length; i++) {
                var open = ch[i];
                if (open.type !== 'link_open' || open.markup !== 'linkify') continue;
                var textTok = ch[i + 1], close = ch[i + 2];
                if (!textTok || textTok.type !== 'text' || !close || close.type !== 'link_close') continue;
                var idx = textTok.content.search(GREEDY_LINK_CUT);
                if (idx < 0) continue;
                var keep = textTok.content.slice(0, idx);
                var spill = textTok.content.slice(idx);
                textTok.content = keep;
                open.attrSet('href', keep);
                var spillTok = new state.Token('text', '', 0);
                spillTok.content = spill;
                ch.splice(i + 3, 0, spillTok);
            }
        }
    });
    const defaultLinkOpen = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
    };
    md.renderer.rules.link_open = function(tokens, idx, options, env, self) {
        tokens[idx].attrPush(['target', '_blank']);
        tokens[idx].attrPush(['rel', 'noopener noreferrer']);
        return defaultLinkOpen(tokens, idx, options, env, self);
    };
    return md;
}

const md = createMd();

const VIDEO_EXT_RE = /\.(?:mp4|webm|mov|avi|mkv)$/i;  // tested against URL without query string
const IMAGE_EXT_RE = /\.(?:jpg|jpeg|png|gif|webp|bmp|svg)$/i;  // tested against URL without query string

function _toWebUrl(url) {
    if (/^\/[A-Za-z]/.test(url) && !url.startsWith('/api/')) {
        return '/api/file?path=' + encodeURIComponent(url);
    }
    if (/^file:\/\/\//i.test(url)) {
        return '/api/file?path=' + encodeURIComponent(url.replace(/^file:\/\/\//i, '/'));
    }
    return url;
}

function _buildVideoHtml(url) {
    const webUrl = _toWebUrl(url);
    const fileName = url.split('/').pop().split('?')[0];
    return `<div style="margin:10px 0;">` +
        `<video controls preload="metadata" ` +
        `style="max-width:100%;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.15);display:block;">` +
        `<source src="${webUrl}"></video>` +
        `<a href="${webUrl}" target="_blank" ` +
        `style="display:inline-flex;align-items:center;gap:4px;margin-top:4px;font-size:12px;color:#8b8fa8;text-decoration:none;">` +
        `<i class="fas fa-download"></i> ${escapeHtml(fileName)}</a></div>`;
}

function _openImageLightbox(src) {
    let overlay = document.getElementById('cow-lightbox');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'cow-lightbox';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;cursor:zoom-out;opacity:0;transition:opacity .2s';
        overlay.onclick = () => { overlay.style.opacity = '0'; setTimeout(() => overlay.style.display = 'none', 200); };
        const img = document.createElement('img');
        img.id = 'cow-lightbox-img';
        img.style.cssText = 'max-width:92vw;max-height:92vh;border-radius:8px;box-shadow:0 4px 24px rgba(0,0,0,0.5);object-fit:contain;';
        img.onclick = (e) => e.stopPropagation();
        overlay.appendChild(img);
        document.body.appendChild(overlay);
    }
    overlay.querySelector('#cow-lightbox-img').src = src;
    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.style.opacity = '1');
}

function _buildImageHtml(url) {
    const webUrl = _toWebUrl(url);
    const safeUrl = webUrl.replace(/"/g, '&quot;');
    return `<div style="margin:10px 0;">` +
        `<img src="${safeUrl}" alt="image" loading="lazy" ` +
        `onclick="_openImageLightbox(this.src)" ` +
        `style="max-width:520px;width:100%;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.15);display:block;cursor:zoom-in;">` +
        `</div>`;
}

function injectVideoPlayers(html) {
    // Step 1: replace markdown-it anchor tags whose href points to a video file.
    const step1 = html.replace(
        /<a\s+href="(https?:\/\/[^"]+)"[^>]*>[^<]*<\/a>/gi,
        (match, url) => VIDEO_EXT_RE.test(url.split('?')[0]) ? _buildVideoHtml(url) : match
    );
    // Step 2: replace any remaining bare video URLs in text nodes (not inside HTML tags).
    // Split on HTML tags to avoid touching src/href attributes already in markup.
    return step1.split(/(<[^>]+>)/).map((chunk, idx) => {
        // Even indices are text nodes; odd indices are HTML tags — leave them untouched.
        if (idx % 2 !== 0) return chunk;
        return chunk.replace(/https?:\/\/\S+/gi, (url) => {
            const bare = url.replace(/[),.\s]+$/, '');  // strip trailing punctuation
            return VIDEO_EXT_RE.test(bare.split('?')[0]) ? _buildVideoHtml(bare) : url;
        });
    }).join('');
}

// Convert image URLs into inline <img> previews. Mirrors injectVideoPlayers but for images.
// Handles three cases produced by markdown-it:
//   1. <a href="...image.jpg">...</a>  (bare URL or autolink that linkify turned into an anchor)
//   2. <img src="...">                  (markdown image syntax) — leave as-is, but normalize style
//   3. raw URL still present in a text node                    — only as a safety net
function injectImagePreviews(html) {
    // Step 1: anchor whose href points to an image file -> replace with <img> preview.
    const step1 = html.replace(
        /<a\s+href="(https?:\/\/[^"]+)"[^>]*>[^<]*<\/a>/gi,
        (match, url) => IMAGE_EXT_RE.test(url.split('?')[0]) ? _buildImageHtml(url) : match
    );
    // Step 2: bare image URLs left in text nodes (rare — markdown-it's linkify usually catches them).
    return step1.split(/(<[^>]+>)/).map((chunk, idx) => {
        if (idx % 2 !== 0) return chunk;
        return chunk.replace(/https?:\/\/\S+/gi, (url) => {
            const bare = url.replace(/[),.\s]+$/, '');
            return IMAGE_EXT_RE.test(bare.split('?')[0]) ? _buildImageHtml(bare) : url;
        });
    }).join('');
}

function _rewriteLocalImgSrc(html) {
    return html.replace(/<img\s([^>]*?)src="([^"]+)"([^>]*?)>/gi, (match, pre, src, post) => {
        const webSrc = _toWebUrl(src);
        const safeSrc = webSrc.replace(/"/g, '&quot;');
        const hasClick = /onclick/i.test(pre + post);
        const clickAttr = hasClick ? '' : ` onclick="_openImageLightbox(this.src)" style="cursor:zoom-in;"`;
        return `<img ${pre}src="${safeSrc}"${post}${clickAttr}>`;
    });
}

function renderMarkdown(text) {
    try {
        let html = md.render(text);
        html = _rewriteLocalImgSrc(html);
        // Order matters: video first (more specific), then image.
        html = injectImagePreviews(injectVideoPlayers(html));
        // Note: Code block headers are added via DOM manipulation after insertion
        // See addCodeBlockHeadersToElement()
        return html;
    }
    catch (e) { return text.replace(/\n/g, '<br>'); }
}

function _addCodeBlockHeaders(container) {
    // Add header with language label and copy button to each <pre> block using DOM manipulation
    const preBlocks = container.querySelectorAll('pre');
    preBlocks.forEach(pre => {
        if (pre.parentElement && pre.parentElement.classList.contains('code-block-wrapper')) return;
        
        const codeEl = pre.querySelector('code');
        if (!codeEl) return;
        
        const langClass = Array.from(codeEl.classList).find(c => c.startsWith('language-'));
        const language = langClass ? langClass.replace('language-', '') : '';
        // Hide label for unknown/empty languages (e.g. language-undefined)
        const showLang = language && language !== 'undefined' && language !== 'code';
        const langLabel = showLang ? language.charAt(0).toUpperCase() + language.slice(1) : '';
        
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        
        const header = document.createElement('div');
        header.className = 'code-block-header';
        header.innerHTML = `
            <span class="code-block-lang">${langLabel}</span>
            <button class="code-copy-btn" title="Copy code">
                <i class="fas fa-copy"></i>
            </button>
        `;
        
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(header);
        wrapper.appendChild(pre);
    });
}

// =====================================================================
// Chat Module
// =====================================================================
let isPolling = false;
let pollGeneration = 0;   // incremented on each restart to cancel stale poll loops
let loadingContainers = {};
let activeStreams = {};   // request_id -> EventSource
let sessionActiveRequest = {};   // session_id -> request_id (in-flight stream per session)

function isCurrentSessionConversationActive() {
    return !!sessionActiveRequest[sessionId];
}

function updateEditButtonsState() {
    const active = isCurrentSessionConversationActive();
    document.querySelectorAll('.edit-msg-btn, .delete-msg-btn').forEach(btn => {
        btn.disabled = active;
        if (btn.classList.contains('edit-msg-btn')) {
            btn.title = active
                ? t('edit_disabled_reply_active')
                : t('edit_message');
        } else {
            btn.title = active
                ? t('delete_disabled_reply_active')
                : t('delete_message_title');
        }
    });
}
let streamBuffers = {};   // request_id -> { items: [event...], timestamp } for re-attach replay
let isComposing = false;
let appConfig = { use_agent: false, title: '揽盛电气智能体', subtitle: '', providers: {}, api_bases: {} };

const SESSION_ID_KEY = 'cow_session_id';

function generateSessionId() {
    return 'session_' + ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

// Restore session_id from localStorage so conversation history survives page refresh.
// A new id is only generated when the user explicitly starts a new chat.
function loadOrCreateSessionId() {
    const stored = localStorage.getItem(SESSION_ID_KEY);
    if (stored) return stored;
    const fresh = generateSessionId();
    localStorage.setItem(SESSION_ID_KEY, fresh);
    return fresh;
}

let sessionId = loadOrCreateSessionId();

// ---- Conversation history state ----
let historyPage = 0;       // last page fetched (0 = nothing fetched yet)
let historyHasMore = false;
let historyLoading = false;

fetch('/config').then(r => r.json()).then(data => {
    if (data.status === 'success') {
        appConfig = data;
        const title = data.title || '揽盛电气智能体';
        document.getElementById('welcome-title').textContent = title;
        initConfigView(data);
    }
    loadHistory(1);
}).catch(() => { loadHistory(1); });

// Start polling immediately so scheduler/push messages are received at any time
startPolling();

const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const messagesDiv = document.getElementById('chat-messages');
const fileInput = document.getElementById('file-input');
const folderInput = document.getElementById('folder-input');
const attachBtn = document.getElementById('attach-btn');
const attachMenu = document.getElementById('attach-menu');
const attachFolderOption = document.getElementById('attach-folder-option');
const supportsDirectoryUpload = !!folderInput && 'webkitdirectory' in folderInput;

if (!supportsDirectoryUpload && attachFolderOption) {
    attachFolderOption.classList.add('hidden');
}

// ---------------- Mic button: in-page voice input via the configured ASR provider ----------------
(function setupMicButton() {
    const micBtn = document.getElementById('mic-btn');
    if (!micBtn) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia ||
        typeof window.MediaRecorder === 'undefined') {
        micBtn.style.display = 'none';
        return;
    }

    let mediaRecorder = null;
    let stream = null;
    let chunks = [];
    let recording = false;

    const setIdle = () => {
        recording = false;
        micBtn.classList.remove('text-red-500', 'animate-pulse');
        micBtn.classList.add('text-slate-400');
        micBtn.querySelector('i').className = 'fas fa-microphone text-sm';
        micBtn.title = t('mic_idle_title');
    };
    const setRecording = () => {
        recording = true;
        micBtn.classList.remove('text-slate-400');
        micBtn.classList.add('text-red-500', 'animate-pulse');
        micBtn.querySelector('i').className = 'fas fa-stop text-sm';
        micBtn.title = t('mic_recording_title');
    };
    const setBusy = () => {
        micBtn.classList.remove('text-red-500', 'animate-pulse', 'text-slate-400');
        micBtn.classList.add('text-primary-500');
        micBtn.querySelector('i').className = 'fas fa-spinner fa-spin text-sm';
        micBtn.title = t('mic_busy_title');
    };

    const pickMimeType = () => {
        const candidates = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/mp4',
        ];
        for (const m of candidates) {
            if (window.MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) {
                return m;
            }
        }
        return '';
    };

    const stopStream = () => {
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
            stream = null;
        }
    };

    let _micTipTimer = null;
    const flashError = (msg) => {
        console.warn('[mic]', msg);
        // Pop a small bubble above the mic so the user actually notices it.
        // The mic lives inside a relatively-positioned wrapper around the
        // textarea (see chat.html), so we hang the tip off that wrapper.
        const wrapper = micBtn.parentElement;
        if (!wrapper) return;
        let tip = wrapper.querySelector('.mic-tip');
        if (!tip) {
            tip = document.createElement('div');
            tip.className = 'mic-tip absolute right-1 bottom-full mb-2 px-2 py-1 rounded-md '
                + 'text-xs text-white bg-slate-800/90 dark:bg-slate-700/90 shadow-md '
                + 'pointer-events-none whitespace-nowrap z-10';
            wrapper.appendChild(tip);
        }
        tip.textContent = msg;
        tip.style.opacity = '1';
        if (_micTipTimer) clearTimeout(_micTipTimer);
        _micTipTimer = setTimeout(() => {
            tip.style.opacity = '0';
            tip.style.transition = 'opacity 200ms';
            setTimeout(() => tip.remove(), 250);
        }, 2000);
    };

    const upload = async (blob, ext) => {
        setBusy();
        const fd = new FormData();
        fd.append('file', blob, `recording.${ext}`);
        try {
            const resp = await fetch('/api/voice/asr', { method: 'POST', body: fd });
            const data = await resp.json();
            if (data.status === 'success' && data.text) {
                // Voice-message UX: drop the recording into the conversation
                // as a playable bubble with the caption underneath, then
                // dispatch the recognised text through the regular send path.
                sendVoiceMessage(data.text, data.audio_url);
            } else {
                flashError(data.message || t('mic_error'));
            }
        } catch (e) {
            flashError(t('mic_error') + ': ' + e.message);
        } finally {
            setIdle();
        }
    };

    const start = async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (e) {
            flashError(t('mic_permission_denied'));
            return;
        }
        chunks = [];
        const mimeType = pickMimeType();
        try {
            mediaRecorder = mimeType
                ? new MediaRecorder(stream, { mimeType })
                : new MediaRecorder(stream);
        } catch (e) {
            stopStream();
            flashError(t('mic_error') + ': ' + e.message);
            return;
        }
        mediaRecorder.ondataavailable = (ev) => {
            if (ev.data && ev.data.size > 0) chunks.push(ev.data);
        };
        mediaRecorder.onstop = () => {
            stopStream();
            const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' });
            // Map mime -> extension so the server picks the right file suffix.
            const mt = (mediaRecorder.mimeType || 'audio/webm').split(';')[0];
            const extMap = {
                'audio/webm': 'webm', 'audio/ogg': 'ogg',
                'audio/mp4': 'm4a',   'audio/mpeg': 'mp3',
            };
            const ext = extMap[mt] || 'webm';
            // 256 bytes ~ container header only, no actual audio. Anything
            // below that we treat as "tapped by mistake".
            if (blob.size < 256) {
                setIdle();
                flashError(t('mic_too_short'));
                return;
            }
            upload(blob, ext);
        };
        // timeslice=250ms: force the recorder to flush a chunk every 250ms.
        // Without it some browsers wait for stop() before producing any data,
        // which loses the audio on very short taps.
        mediaRecorder.start(250);
        recordStartedAt = Date.now();
        setRecording();
    };

    let recordStartedAt = 0;

    const stopWithMinDuration = () => {
        const elapsed = Date.now() - recordStartedAt;
        const minMs = 350;
        if (elapsed < minMs) {
            // Give the recorder a moment to capture at least one chunk
            // before we tell it to stop.
            setTimeout(() => stop(), minMs - elapsed);
        } else {
            stop();
        }
    };

    const stop = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
    };

    micBtn.addEventListener('click', () => {
        if (recording) {
            stopWithMinDuration();
        } else {
            start();
        }
    });

    setIdle();
})();

// Smart auto-scroll: pause when user scrolls up, resume when near bottom
let _autoScrollEnabled = true;
const _SCROLL_THRESHOLD = 80; // px from bottom to re-enable auto-scroll

messagesDiv.addEventListener('scroll', () => {
    const distFromBottom = messagesDiv.scrollHeight - messagesDiv.scrollTop - messagesDiv.clientHeight;
    _autoScrollEnabled = distFromBottom <= _SCROLL_THRESHOLD;
    _updateScrollToBottomBtn();
});

// Intercept internal navigation links in chat messages
messagesDiv.addEventListener('click', (e) => {
    // Code block copy button
    const codeCopyBtn = e.target.closest('.code-copy-btn');
    if (codeCopyBtn) {
        e.preventDefault();
        const wrapper = codeCopyBtn.closest('.code-block-wrapper');
        const codeEl = wrapper && wrapper.querySelector('pre code');
        if (codeEl) {
            const codeText = codeEl.textContent;
            copyToClipboard(codeText).then(() => {
                const icon = codeCopyBtn.querySelector('i');
                if (icon) { icon.className = 'fas fa-check'; setTimeout(() => { icon.className = 'fas fa-copy'; }, 1500); }
            });
        }
        return;
    }

    const copyBtn = e.target.closest('.copy-msg-btn');
    if (copyBtn) {
        e.preventDefault();
        const msgRoot = copyBtn.closest('.flex.gap-3');
        const answerEl = msgRoot && msgRoot.querySelector('.answer-content');
        const rawMd = answerEl && answerEl.dataset.rawMd;
        if (rawMd) {
            copyToClipboard(rawMd).then(() => {
                const icon = copyBtn.querySelector('i');
                if (icon) { icon.className = 'fas fa-check'; setTimeout(() => { icon.className = 'fas fa-copy'; }, 1500); }
            });
        }
        return;
    }

    // Edit user message
    const editBtn = e.target.closest('.edit-msg-btn');
    if (editBtn) {
        e.preventDefault();
        if (isCurrentSessionConversationActive()) return;
        const msgRoot = editBtn.closest('.user-message-group');
        if (msgRoot) editUserMessage(msgRoot);
        return;
    }

    // Regenerate bot response
    const regenerateBtn = e.target.closest('.regenerate-msg-btn');
    if (regenerateBtn) {
        e.preventDefault();
        const botMsgRoot = regenerateBtn.closest('.flex.gap-3');
        if (botMsgRoot) regenerateResponse(botMsgRoot);
        return;
    }

    // Delete message (user bubble only; bot bubbles intentionally lack a
    // delete button — removing only the bot reply would leave an orphan
    // user message that breaks LLM context alternation).
    const deleteBtn = e.target.closest('.delete-msg-btn');
    if (deleteBtn) {
        e.preventDefault();
        if (isCurrentSessionConversationActive()) return;
        const userMsgEl = deleteBtn.closest('.user-message-group');
        if (!userMsgEl) return;

        showConfirmModal(t('delete_message_title'), t('delete_message_confirm'), () => {
            // Find the next bot reply for this turn (skip non-message nodes).
            let botReplyEl = null;
            let sibling = userMsgEl.nextElementSibling;
            while (sibling) {
                if (sibling.classList && sibling.classList.contains('bot-message-group')) {
                    botReplyEl = sibling;
                    break;
                }
                sibling = sibling.nextElementSibling;
            }
            userMsgEl.remove();
            if (botReplyEl) botReplyEl.remove();

            const userSeq = userMsgEl.dataset.seq;
            if (userSeq) {
                fetch('/api/messages/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ session_id: sessionId, user_seq: parseInt(userSeq) })
                }).then(r => r.json()).then(data => {
                    if (data.status === 'success') console.log(`Deleted ${data.deleted} messages`);
                }).catch(err => console.error('Failed to delete:', err));
            }
        });
        return;
    }

    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (href === '/memory/dreams') {
        e.preventDefault();
        navigateTo('memory');
        setTimeout(() => switchMemoryTab('dreams'), 50);
    } else if (href === '/memory/MEMORY.md') {
        e.preventDefault();
        navigateTo('memory');
        setTimeout(() => { switchMemoryTab('files'); openMemoryFile('MEMORY.md', 'memory'); }, 50);
    }
});
const attachmentPreview = document.getElementById('attachment-preview');

// Pending attachments: [{file_path, file_name, file_type, preview_url}]
// Items with _uploading=true are still in flight.
let pendingAttachments = [];
let uploadingCount = 0;

// Input history (like terminal arrow-key recall)
const inputHistory = [];
let historyIdx = -1;
let historySavedDraft = '';

// While an SSE stream is in flight, the send button morphs into a cancel
// button. Only one in-flight request is supported at a time.
let activeRequestId = null;
let sendBtnMode = 'send'; // 'send' | 'cancel'

function setSendBtnCancelMode(requestId) {
    activeRequestId = requestId;
    sendBtnMode = 'cancel';
    sendBtn.disabled = false;
    sendBtn.classList.add('send-btn-cancel');
    sendBtn.title = (currentLang === 'zh' ? '中止' : 'Cancel');
    sendBtn.innerHTML = '<i class="fas fa-stop text-sm"></i>';
}

function resetSendBtnSendMode() {
    activeRequestId = null;
    sendBtnMode = 'send';
    sendBtn.classList.remove('send-btn-cancel');
    sendBtn.title = '';
    sendBtn.innerHTML = '<i class="fas fa-paper-plane text-sm"></i>';
    updateSendBtnState();
}

function requestCancel() {
    const reqId = activeRequestId;
    if (!reqId) return;
    fetch('/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: reqId, session_id: sessionId, lang: currentLang }),
    }).catch(err => {
        console.warn('[cancel] request failed', err);
    });
    // Optimistic UI lock so the click visibly registers before the SSE
    // "cancelled" event arrives.
    sendBtn.disabled = true;
    sendBtn.title = (currentLang === 'zh' ? '已中止' : 'Cancelled');
}

// Button click is the only path to Cancel. Pressing Enter still calls
// sendMessage() so users can submit "/cancel" as a regular slash command.
sendBtn.addEventListener('click', () => {
    if (sendBtnMode === 'cancel') {
        requestCancel();
    } else {
        sendMessage();
    }
});

function updateSendBtnState() {
    if (sendBtnMode === 'cancel') {
        // Self-heal a stuck Cancel button: if there's no live stream backing
        // the current request, the cancel state leaked (e.g. a stream ended
        // without resetting). Recover to Send so the input isn't blocked.
        if (!activeRequestId || !activeStreams[activeRequestId]) {
            resetSendBtnSendMode();
        } else {
            // Don't downgrade a genuinely active Cancel button on input edits.
            return;
        }
    }
    sendBtn.disabled = uploadingCount > 0 || (!chatInput.value.trim() && pendingAttachments.length === 0);
}

function renderAttachmentPreview() {
    if (pendingAttachments.length === 0) {
        attachmentPreview.classList.add('hidden');
        attachmentPreview.innerHTML = '';
        updateSendBtnState();
        return;
    }
    attachmentPreview.classList.remove('hidden');
    attachmentPreview.innerHTML = pendingAttachments.map((att, idx) => {
        if (att._uploading) {
            const suffix = att.file_type === 'directory' && att.file_count
                ? ` (${att.file_count})`
                : '';
            return `<div class="att-chip att-uploading" data-idx="${idx}">
                <i class="fas fa-spinner fa-spin"></i>
                <span class="att-name">${escapeHtml(att.file_name)}${suffix}</span>
            </div>`;
        }
        if (att.file_type === 'image') {
            return `<div class="att-thumb" data-idx="${idx}">
                <img src="${att.preview_url}" alt="${escapeHtml(att.file_name)}">
                <button class="att-remove" onclick="removeAttachment(${idx})">&times;</button>
            </div>`;
        }
        const icon = att.file_type === 'video'
            ? 'fa-film'
            : (att.file_type === 'directory' ? 'fa-folder-tree' : 'fa-file-alt');
        const suffix = att.file_type === 'directory' && att.file_count
            ? ` (${att.file_count})`
            : '';
        return `<div class="att-chip" data-idx="${idx}">
            <i class="fas ${icon}"></i>
            <span class="att-name">${escapeHtml(att.file_name)}${suffix}</span>
            <button class="att-remove" onclick="removeAttachment(${idx})">&times;</button>
        </div>`;
    }).join('');
    updateSendBtnState();
}

function removeAttachment(idx) {
    if (pendingAttachments[idx]?._uploading) return;
    pendingAttachments.splice(idx, 1);
    renderAttachmentPreview();
}

function isAttachMenuVisible() {
    return attachMenu && !attachMenu.classList.contains('hidden');
}

function hideAttachMenu() {
    if (attachMenu) attachMenu.classList.add('hidden');
}

function toggleAttachMenu(event) {
    if (!attachMenu) return;
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    attachMenu.classList.toggle('hidden');
}

function triggerFileUpload() {
    hideAttachMenu();
    fileInput?.click();
}

function triggerFolderUpload() {
    if (!supportsDirectoryUpload) return;
    hideAttachMenu();
    folderInput?.click();
}

async function handleFileSelect(files) {
    if (!files || files.length === 0) return;
    const tasks = [];
    for (const file of files) {
        const placeholder = { file_name: file.name, file_type: 'file', _uploading: true };
        pendingAttachments.push(placeholder);
        uploadingCount++;
        renderAttachmentPreview();

        tasks.push((async () => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('session_id', sessionId);
            try {
                const resp = await fetch('/upload', { method: 'POST', body: formData });
                const data = await resp.json();
                if (data.status === 'success') {
                    placeholder.file_path = data.file_path;
                    placeholder.file_name = data.file_name;
                    placeholder.file_type = data.file_type;
                    placeholder.preview_url = data.preview_url;
                    delete placeholder._uploading;
                } else {
                    const i = pendingAttachments.indexOf(placeholder);
                    if (i !== -1) pendingAttachments.splice(i, 1);
                }
            } catch (e) {
                console.error('Upload failed:', e);
                const i = pendingAttachments.indexOf(placeholder);
                if (i !== -1) pendingAttachments.splice(i, 1);
            }
            uploadingCount--;
            renderAttachmentPreview();
        })());
    }
    await Promise.all(tasks);
}

function _makeUploadId() {
    return `dir_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function _groupDirectoryFiles(files) {
    const groups = new Map();
    for (const file of Array.from(files || [])) {
        const relPath = file.webkitRelativePath || file.name;
        const parts = relPath.split('/').filter(Boolean);
        const rootName = parts[0] || file.name;
        if (!groups.has(rootName)) groups.set(rootName, []);
        groups.get(rootName).push({ file, relPath });
    }
    return groups;
}

async function handleFolderSelect(files) {
    if (!files || files.length === 0) return;
    const groups = _groupDirectoryFiles(files);
    const groupTasks = [];

    for (const [rootName, entries] of groups.entries()) {
        const placeholder = {
            file_name: rootName,
            file_type: 'directory',
            file_count: entries.length,
            _uploading: true,
        };
        pendingAttachments.push(placeholder);
        uploadingCount++;
        renderAttachmentPreview();

        const uploadId = _makeUploadId();
        groupTasks.push((async () => {
            try {
                const formData = new FormData();
                formData.append('session_id', sessionId);
                formData.append('upload_id', uploadId);
                for (const { file, relPath } of entries) {
                    formData.append('files', file);
                    formData.append('relative_paths', relPath);
                }

                const resp = await fetch('/upload', { method: 'POST', body: formData });
                const data = await resp.json();
                if (data.status !== 'success') {
                    throw new Error(data.message || 'Upload failed');
                }
                if (!data.root_path) {
                    throw new Error('Directory root path missing');
                }
                placeholder.file_path = data.root_path;
                placeholder.file_name = data.root_name || rootName;
                delete placeholder._uploading;
            } catch (e) {
                console.error('Directory upload failed:', e);
                const i = pendingAttachments.indexOf(placeholder);
                if (i !== -1) pendingAttachments.splice(i, 1);
            } finally {
                uploadingCount--;
            }
            renderAttachmentPreview();
        })());
    }

    await Promise.all(groupTasks);
}

fileInput.addEventListener('change', function() {
    handleFileSelect(this.files);
    this.value = '';
});

folderInput.addEventListener('change', function() {
    handleFolderSelect(this.files);
    this.value = '';
});

document.addEventListener('click', (e) => {
    if (!isAttachMenuVisible()) return;
    if (attachMenu.contains(e.target) || attachBtn.contains(e.target)) return;
    hideAttachMenu();
});

// Drag-and-drop support on entire chat view
const chatView = document.getElementById('view-chat');
const chatInputArea = chatInput.closest('.flex-shrink-0');

// Create drag overlay for visual feedback
let dragOverlay = document.getElementById('drag-overlay');
if (!dragOverlay) {
    dragOverlay = document.createElement('div');
    dragOverlay.id = 'drag-overlay';
    dragOverlay.className = 'drag-overlay hidden';
    dragOverlay.innerHTML = `
        <div class="drag-overlay-content">
            <i class="fas fa-cloud-arrow-up"></i>
            <p>Drop files here to upload</p>
        </div>
    `;
    chatView.appendChild(dragOverlay);
}

let dragCounter = 0;

function showDragOverlay() {
    dragOverlay.classList.remove('hidden');
    dragOverlay.classList.add('active');
}

function hideDragOverlay() {
    dragOverlay.classList.remove('active');
    dragOverlay.classList.add('hidden');
}

chatView.addEventListener('dragenter', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter++;
    if (e.dataTransfer.types.includes('Files')) {
        showDragOverlay();
    }
});

chatView.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    chatInputArea.classList.add('drag-over');
});

chatView.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter--;
    if (dragCounter === 0) {
        hideDragOverlay();
        chatInputArea.classList.remove('drag-over');
    }
});

chatView.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter = 0;
    hideDragOverlay();
    chatInputArea.classList.remove('drag-over');
    if (e.dataTransfer.files.length) {
        handleFileSelect(e.dataTransfer.files);
    }
});

document.body.addEventListener('dragover', (e) => {
    if (e.dataTransfer.types.includes('Files')) {
        e.preventDefault();
    }
});

document.body.addEventListener('drop', (e) => {
    if (e.dataTransfer.types.includes('Files')) {
        e.preventDefault();
    }
});

// Paste image support
chatInput.addEventListener('paste', (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files = [];
    for (const item of items) {
        if (item.kind === 'file') {
            files.push(item.getAsFile());
        }
    }
    if (files.length) {
        e.preventDefault();
        handleFileSelect(files);
    }
});

chatInput.addEventListener('compositionstart', () => { isComposing = true; });
chatInput.addEventListener('compositionend', () => { setTimeout(() => { isComposing = false; }, 100); });

// ── Slash Command Menu ───────────────────────────────────────
// desc holds an i18n key, resolved via t() at render time so the menu follows
// the current UI language.
const SLASH_COMMANDS = [
    { cmd: '/help',                desc: 'slash_help' },
    { cmd: '/status',              desc: 'slash_status' },
    { cmd: '/context',             desc: 'slash_context' },
    { cmd: '/context clear',       desc: 'slash_context_clear' },
    { cmd: '/skill list',          desc: 'slash_skill_list' },
    { cmd: '/skill list --remote', desc: 'slash_skill_list_remote' },
    { cmd: '/skill search ',       desc: 'slash_skill_search' },
    { cmd: '/skill install ',      desc: 'slash_skill_install' },
    { cmd: '/skill uninstall ',    desc: 'slash_skill_uninstall' },
    { cmd: '/skill info ',         desc: 'slash_skill_info' },
    { cmd: '/skill enable ',       desc: 'slash_skill_enable' },
    { cmd: '/skill disable ',      desc: 'slash_skill_disable' },
    { cmd: '/memory dream ',       desc: 'slash_memory_dream' },
    { cmd: '/knowledge',           desc: 'slash_knowledge' },
    { cmd: '/knowledge list',      desc: 'slash_knowledge_list' },
    { cmd: '/knowledge on',        desc: 'slash_knowledge_on' },
    { cmd: '/knowledge off',       desc: 'slash_knowledge_off' },
    { cmd: '/config',              desc: 'slash_config' },
    { cmd: '/cancel',              desc: 'slash_cancel' },
    { cmd: '/logs',                desc: 'slash_logs' },
    { cmd: '/version',             desc: 'slash_version' },
];

const slashMenu = document.getElementById('slash-menu');
let slashActiveIdx = 0;
let slashFiltered = [];
let slashJustSelected = false;
let slashLastFilter = '';
let slashLastMouseX = -1;
let slashLastMouseY = -1;

function showSlashMenu(filter) {
    const q = filter.toLowerCase();
    if (q === slashLastFilter && !slashMenu.classList.contains('hidden')) return;
    slashLastFilter = q;

    const newFiltered = SLASH_COMMANDS.filter(c => c.cmd.toLowerCase().startsWith(q));
    if (newFiltered.length === 0) {
        hideSlashMenu();
        return;
    }

    const changed = newFiltered.length !== slashFiltered.length ||
        newFiltered.some((c, i) => c.cmd !== slashFiltered[i]?.cmd);
    slashFiltered = newFiltered;
    if (changed) slashActiveIdx = 0;
    slashActiveIdx = Math.min(slashActiveIdx, slashFiltered.length - 1);

    slashNavByKeyboard = true;
    renderSlashItems();
    slashMenu.classList.remove('hidden');
}

function hideSlashMenu() {
    slashMenu.classList.add('hidden');
    slashMenu.innerHTML = '';
    slashFiltered = [];
    slashActiveIdx = -1;
    slashLastFilter = '';
    slashNavByKeyboard = false;
    slashLastMouseX = -1;
    slashLastMouseY = -1;
}

function isSlashMenuVisible() {
    return !slashMenu.classList.contains('hidden') && slashFiltered.length > 0;
}

function renderSlashItems() {
    slashMenu.innerHTML =
        '<div class="slash-menu-header">Commands</div>' +
        slashFiltered.map((c, i) =>
            `<div class="slash-menu-item${i === slashActiveIdx ? ' active' : ''}" data-idx="${i}">` +
            `<span class="cmd">${escapeHtml(c.cmd)}</span>` +
            `<span class="desc">${escapeHtml(t(c.desc))}</span></div>`
        ).join('');

    const activeEl = slashMenu.querySelector('.slash-menu-item.active');
    if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
}

// Delegated events on the persistent slashMenu container (not destroyed by innerHTML)
// Use coordinate comparison to distinguish real mouse movement from DOM-rebuild phantom events.
slashMenu.addEventListener('mousemove', (e) => {
    if (e.clientX === slashLastMouseX && e.clientY === slashLastMouseY) return;
    slashLastMouseX = e.clientX;
    slashLastMouseY = e.clientY;
    if (!slashNavByKeyboard) return;
    slashNavByKeyboard = false;
    const item = e.target.closest('.slash-menu-item');
    if (!item) return;
    const idx = parseInt(item.dataset.idx);
    if (idx === slashActiveIdx) return;
    slashActiveIdx = idx;
    slashMenu.querySelectorAll('.slash-menu-item').forEach(el => {
        el.classList.toggle('active', parseInt(el.dataset.idx) === idx);
    });
});

slashMenu.addEventListener('mouseover', (e) => {
    if (slashNavByKeyboard) return;
    const item = e.target.closest('.slash-menu-item');
    if (!item) return;
    const idx = parseInt(item.dataset.idx);
    if (idx === slashActiveIdx) return;
    slashActiveIdx = idx;
    slashMenu.querySelectorAll('.slash-menu-item').forEach(el => {
        el.classList.toggle('active', parseInt(el.dataset.idx) === idx);
    });
});

slashMenu.addEventListener('mousedown', (e) => {
    const item = e.target.closest('.slash-menu-item');
    if (!item) return;
    e.preventDefault();
    selectSlashCommand(parseInt(item.dataset.idx));
});

function selectSlashCommand(idx) {
    if (idx < 0 || idx >= slashFiltered.length) return;
    const chosen = slashFiltered[idx].cmd;
    slashJustSelected = true;
    chatInput.value = chosen;
    chatInput.dispatchEvent(new Event('input'));
    hideSlashMenu();
    chatInput.focus();
    chatInput.selectionStart = chatInput.selectionEnd = chosen.length;
}

chatInput.addEventListener('input', function() {
    this.style.height = '42px';
    const scrollH = this.scrollHeight;
    const newH = Math.min(scrollH, 180);
    this.style.height = newH + 'px';
    this.style.overflowY = scrollH > 180 ? 'auto' : 'hidden';
    updateSendBtnState();

    const val = this.value;
    if (slashJustSelected) {
        slashJustSelected = false;
    } else if (val.startsWith('/')) {
        showSlashMenu(val);
    } else {
        hideSlashMenu();
    }
});

chatInput.addEventListener('keydown', function(e) {
    if (e.keyCode === 229 || e.isComposing || isComposing) return;

    if (e.key === 'Escape' && isAttachMenuVisible()) {
        hideAttachMenu();
        return;
    }

    if (isSlashMenuVisible()) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            slashNavByKeyboard = true;
            slashActiveIdx = Math.min(slashActiveIdx + 1, slashFiltered.length - 1);
            renderSlashItems();
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            slashNavByKeyboard = true;
            slashActiveIdx = Math.max(slashActiveIdx - 1, 0);
            renderSlashItems();
            return;
        }
        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
            e.preventDefault();
            selectSlashCommand(slashActiveIdx);
            return;
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            hideSlashMenu();
            return;
        }
        if (e.key === 'Tab') {
            e.preventDefault();
            selectSlashCommand(slashActiveIdx);
            return;
        }
    }

    // Arrow-key history recall (only when input is empty or already browsing history)
    if (e.key === 'ArrowUp' && inputHistory.length > 0 && !isSlashMenuVisible()) {
        const curVal = this.value.trim();
        const isSingleLine = !this.value.includes('\n');
        if (isSingleLine && (curVal === '' || historyIdx >= 0)) {
            e.preventDefault();
            if (historyIdx < 0) {
                historySavedDraft = this.value;
                historyIdx = inputHistory.length - 1;
            } else if (historyIdx > 0) {
                historyIdx--;
            }
            this.value = inputHistory[historyIdx];
            slashJustSelected = true;
            this.dispatchEvent(new Event('input'));
            hideSlashMenu();
            this.selectionStart = this.selectionEnd = this.value.length;
            return;
        }
    }
    if (e.key === 'ArrowDown' && historyIdx >= 0 && !isSlashMenuVisible()) {
        const isSingleLine = !this.value.includes('\n');
        if (isSingleLine) {
            e.preventDefault();
            if (historyIdx < inputHistory.length - 1) {
                historyIdx++;
                this.value = inputHistory[historyIdx];
            } else {
                historyIdx = -1;
                this.value = historySavedDraft;
                historySavedDraft = '';
            }
            slashJustSelected = true;
            this.dispatchEvent(new Event('input'));
            hideSlashMenu();
            this.selectionStart = this.selectionEnd = this.value.length;
            return;
        }
    }

    if ((e.ctrlKey || e.shiftKey) && e.key === 'Enter') {
        const start = this.selectionStart;
        const end = this.selectionEnd;
        this.value = this.value.substring(0, start) + '\n' + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + 1;
        this.dispatchEvent(new Event('input'));
        e.preventDefault();
    } else if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
        sendMessage();
        e.preventDefault();
    }
});

chatInput.addEventListener('blur', () => {
    setTimeout(hideSlashMenu, 150);
});

document.querySelectorAll('.example-card').forEach(card => {
    card.addEventListener('click', () => {
        // data-send overrides the visible text (e.g. show "查看全部命令" but send "/help")
        const sendText = card.dataset.send;
        if (sendText) {
            chatInput.value = sendText;
            chatInput.dispatchEvent(new Event('input'));
            chatInput.focus();
            return;
        }
        const textEl = card.querySelector('[data-i18n*="text"]');
        if (textEl) {
            chatInput.value = textEl.textContent;
            chatInput.dispatchEvent(new Event('input'));
            chatInput.focus();
        }
    });
});

// Voice-message variant of sendMessage(): renders a playable audio bubble
// with the ASR caption, then dispatches the recognised text to /message
// through the same SSE/loading flow as a typed message.
function sendVoiceMessage(text, audioUrl) {
    text = (text || '').trim();
    if (!text) return;

    inputHistory.push(text);
    historyIdx = -1;
    historySavedDraft = '';

    const ws = document.getElementById('welcome-screen');
    const isFirstMessage = !!ws;
    if (ws) ws.remove();

    const titleInfo = isFirstMessage ? { sid: sessionId, userMsg: text } : null;
    const timestamp = new Date();
    addUserVoiceMessage(audioUrl, text, timestamp);
    const loadingEl = addLoadingIndicator();

    const body = {
        session_id: sessionId,
        message: text,
        stream: true,
        timestamp: timestamp.toISOString(),
        is_voice: true,
        lang: currentLang,
    };

    const MAX_RETRIES = 2;
    const RETRY_DELAY_MS = 1000;
    function postWithRetry(attempt) {
        fetch('/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
        .then(r => r.json())
        .then(data => {
            if (data.status === 'success') {
                if (data.inline_reply) {
                    // Synchronous fast-path reply (e.g. /cancel); skip SSE.
                    loadingEl.remove();
                    addBotMessage(data.inline_reply, new Date());
                } else if (data.stream) {
                    setSendBtnCancelMode(data.request_id);
                    startSSE(data.request_id, loadingEl, timestamp, titleInfo);
                } else {
                    loadingContainers[data.request_id] = loadingEl;
                }
            } else {
                loadingEl.remove();
                addBotMessage(t('error_send'), new Date());
                resetSendBtnSendMode();
            }
        })
        .catch(err => {
            if (attempt < MAX_RETRIES) {
                setTimeout(() => postWithRetry(attempt + 1), RETRY_DELAY_MS * (attempt + 1));
                return;
            }
            loadingEl.remove();
            addBotMessage(t('error_send'), new Date());
        });
    }
    postWithRetry(0);
}

function addUserVoiceMessage(audioUrl, caption, timestamp) {
    const el = document.createElement('div');
    el.className = 'flex justify-end px-4 sm:px-6 py-3';
    // Voice-message bubble: compact voice pill on top, ASR caption beneath.
    // The bubble keeps the same primary tint as a normal user message so
    // it visually slots into the conversation flow.
    el.innerHTML = `
        <div class="max-w-[75%] sm:max-w-[60%]">
            <div class="bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 rounded-2xl px-3 py-2 msg-content user-bubble">
                <div class="user-voice-slot"></div>
                ${caption ? `<div class="text-xs mt-1.5 leading-snug text-slate-500 dark:text-slate-400 whitespace-pre-wrap break-words">${escapeHtml(caption)}</div>` : ''}
            </div>
            <div class="text-xs text-slate-400 dark:text-slate-500 mt-1.5 text-right">${formatTime(timestamp)}</div>
        </div>
    `;
    el.querySelector('.user-voice-slot').appendChild(renderVoicePill(audioUrl));
    messagesDiv.appendChild(el);
    _autoScrollEnabled = true;
    scrollChatToBottom(true);
}

// Clipboard helper with fallback for non-HTTPS environments
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    }
    // Fallback for HTTP environments
    return new Promise((resolve, reject) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy') ? resolve() : reject(new Error('Copy failed'));
        } catch (err) {
            reject(err);
        } finally {
            textArea.remove();
        }
    });
}

// Edit user message: extract content, remove this and subsequent messages, fill input
async function editUserMessage(msgEl) {
    if (isCurrentSessionConversationActive()) return;
    const rawContent = msgEl.dataset.rawContent;
    if (!rawContent) return;

    // Delete this message and ALL subsequent messages from database (cascade)
    // Must await to ensure delete completes before user sends a new message
    const userSeq = msgEl.dataset.seq;
    if (userSeq) {
        try {
            const resp = await fetch('/api/messages/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    session_id: sessionId, 
                    user_seq: parseInt(userSeq),
                    delete_user: true,
                    cascade: true
                })
            });
            const data = await resp.json();
            if (data.status === 'success') console.log(`Deleted ${data.deleted} old messages`);
        } catch (err) {
            console.error('Failed to delete old messages:', err);
        }
    }

    // Remove this message bubble and every later bubble that belongs to
    // this or a subsequent turn. We mirror the backend cascade contract:
    // anything with a data-seq >= current seq, plus any live SSE bubble
    // that is still being streamed (no seq yet) after this point.
    const currentSeqNum = userSeq ? parseInt(userSeq) : null;
    const messagesToRemove = [];
    let current = msgEl;
    while (current) {
        if (current.classList && (current.classList.contains('user-message-group') || current.classList.contains('bot-message-group'))) {
            const seqAttr = current.dataset.seq;
            if (seqAttr === undefined || seqAttr === '') {
                // Live message without a persisted seq yet — treat as later.
                messagesToRemove.push(current);
            } else if (currentSeqNum === null || parseInt(seqAttr) >= currentSeqNum) {
                messagesToRemove.push(current);
            }
        }
        current = current.nextElementSibling;
    }
    messagesToRemove.forEach(el => {
        if (el && el.parentNode) el.parentNode.removeChild(el);
    });

    // Fill input with the original content
    chatInput.value = rawContent;
    chatInput.dispatchEvent(new Event("input", { bubbles: true }));
    chatInput.focus();
    chatInput.selectionStart = chatInput.selectionEnd = chatInput.value.length;
    scrollChatToBottom();
}

// Regenerate bot response: find the preceding user message and resend it
async function regenerateResponse(botMsgEl) {
    let prevEl = botMsgEl.previousElementSibling;
    while (prevEl && !prevEl.classList.contains('user-message-group')) {
        prevEl = prevEl.previousElementSibling;
    }

    if (!prevEl) {
        console.warn('No preceding user message found');
        return;
    }

    const userContent = prevEl.dataset.rawContent;
    if (!userContent) {
        console.warn('No content in preceding user message');
        return;
    }

    // Delete both the old user message AND bot reply from database
    // (because /message will create a fresh user message + new bot reply)
    // Must await to ensure delete completes before /message is sent
    const userSeq = prevEl.dataset.seq;
    if (userSeq) {
        try {
            const resp = await fetch('/api/messages/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    session_id: sessionId, 
                    user_seq: parseInt(userSeq),
                    delete_user: true
                })
            });
            const data = await resp.json();
            if (data.status === 'success') console.log(`Deleted ${data.deleted} old messages`);
        } catch (err) {
            console.error('Failed to delete old messages:', err);
        }
    }

    // Remove both the old user message and bot message from DOM
    if (prevEl.parentNode) prevEl.parentNode.removeChild(prevEl);
    if (botMsgEl.parentNode) botMsgEl.parentNode.removeChild(botMsgEl);

    // Re-add the user message to DOM (so it appears before the loading indicator)
    addUserMessage(userContent, new Date());

    // Show loading indicator
    const loadingEl = addLoadingIndicator();

    // Resend the message
    const timestamp = new Date();
    const body = { session_id: sessionId, message: userContent, stream: true, timestamp: timestamp.toISOString(), lang: currentLang };

    const MAX_RETRIES = 2;
    const RETRY_DELAY_MS = 1000;

    function postWithRetry(attempt) {
        fetch('/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
        .then(r => r.json())
        .then(data => {
            if (data.status === 'success') {
                if (data.inline_reply) {
                    loadingEl.remove();
                    addBotMessage(data.inline_reply, new Date());
                } else if (data.stream) {
                    setSendBtnCancelMode(data.request_id);
                    startSSE(data.request_id, loadingEl, timestamp, null);
                } else {
                    loadingContainers[data.request_id] = loadingEl;
                }
            } else {
                loadingEl.remove();
                addBotMessage(t('error_send'), new Date());
                resetSendBtnSendMode();
            }
        })
        .catch(err => {
            if (err.name === 'AbortError') {
                loadingEl.remove();
                addBotMessage(t('error_timeout'), new Date());
                resetSendBtnSendMode();
                return;
            }
            if (attempt < MAX_RETRIES) {
                console.warn(`[regenerateResponse] attempt ${attempt + 1} failed, retrying...`, err);
                setTimeout(() => postWithRetry(attempt + 1), RETRY_DELAY_MS * (attempt + 1));
                return;
            }
            loadingEl.remove();
            addBotMessage(t('error_send'), new Date());
            resetSendBtnSendMode();
        });
    }

    postWithRetry(0);
}

function sendMessage() {
    // Do NOT branch on sendBtnMode here: Enter should always send (so
    // typing "/cancel" submits normally). Cancel is wired only to the
    // send button's pointer click — see send-btn listener above.

    const text = chatInput.value.trim();
    if (!text && pendingAttachments.length === 0) return;

    if (text) {
        inputHistory.push(text);
        historyIdx = -1;
        historySavedDraft = '';
    }

    const ws = document.getElementById('welcome-screen');
    const isFirstMessage = !!ws;
    if (ws) ws.remove();

    const titleInfo = (isFirstMessage && text) ? { sid: sessionId, userMsg: text } : null;

    const timestamp = new Date();
    const attachments = [...pendingAttachments];
    addUserMessage(text, timestamp, attachments);

    const loadingEl = addLoadingIndicator();

    chatInput.value = '';
    chatInput.style.height = '42px';
    chatInput.style.overflowY = 'hidden';
    pendingAttachments = [];
    renderAttachmentPreview();
    sendBtn.disabled = true;

    const body = { session_id: sessionId, message: text, stream: true, timestamp: timestamp.toISOString(), lang: currentLang };
    if (attachments.length > 0) {
        body.attachments = attachments.map(a => ({
            file_path: a.file_path,
            file_name: a.file_name,
            file_type: a.file_type,
            file_count: a.file_count,
        }));
    }

    const MAX_RETRIES = 2;
    const RETRY_DELAY_MS = 1000;

    function postWithRetry(attempt) {
        fetch('/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
        .then(r => r.json())
        .then(data => {
            if (data.status === 'success') {
                if (data.inline_reply) {
                    // Channel handled synchronously (e.g. /cancel fast-path);
                    // render as a bot bubble and skip SSE entirely.
                    loadingEl.remove();
                    addBotMessage(data.inline_reply, new Date());
                } else if (data.stream) {
                    setSendBtnCancelMode(data.request_id);
                    startSSE(data.request_id, loadingEl, timestamp, titleInfo);
                } else {
                    loadingContainers[data.request_id] = loadingEl;
                }
            } else {
                loadingEl.remove();
                addBotMessage(t('error_send'), new Date());
                resetSendBtnSendMode();
            }
        })
        .catch(err => {
            if (err.name === 'AbortError') {
                loadingEl.remove();
                addBotMessage(t('error_timeout'), new Date());
                resetSendBtnSendMode();
                return;
            }
            if (attempt < MAX_RETRIES) {
                console.warn(`[sendMessage] attempt ${attempt + 1} failed, retrying...`, err);
                setTimeout(() => postWithRetry(attempt + 1), RETRY_DELAY_MS * (attempt + 1));
                return;
            }
            loadingEl.remove();
            addBotMessage(t('error_send'), new Date());
            resetSendBtnSendMode();
        });
    }

    postWithRetry(0);
}

function startSSE(requestId, loadingEl, timestamp, titleInfo, replayItems) {
    let botEl = null;
    let stepsEl = null;    // .agent-steps  (thinking summaries + tool indicators)
    let contentEl = null;  // .answer-content (final streaming answer)
    let mediaEl = null;    // .media-content (images & file attachments)
    let accumulatedText = '';
    const toolElements = new Map();
    let currentReasoningEl = null;  // live reasoning bubble
    let reasoningText = '';
    let reasoningStartTime = 0;
    let done = false;

    // The session this stream belongs to. Sessions run in parallel: the user
    // may switch to another session while this one is still streaming. The
    // stream keeps running in the background (so the reply still completes and
    // persists); when foreign it does not touch the view but still records
    // every event into a buffer, so returning to the session can rebuild the
    // bubble by replaying the buffer and then resume live rendering.
    const ownerSession = sessionId;
    const isActive = () => ownerSession === sessionId;
    sessionActiveRequest[ownerSession] = requestId;
    updateEditButtonsState();
    // Per-request event buffer used to rebuild the bubble on re-attach.
    const buffer = streamBuffers[requestId] || { items: [], timestamp };
    streamBuffers[requestId] = buffer;
    const clearOwnerRequest = () => {
        if (sessionActiveRequest[ownerSession] === requestId) {
            delete sessionActiveRequest[ownerSession];
            updateEditButtonsState();
        }
        delete streamBuffers[requestId];
    };

    const MAX_RECONNECTS = 10;
    const RECONNECT_BASE_MS = 1000;
    let reconnectCount = 0;

    function ensureBotEl() {
        if (botEl) return;
        if (loadingEl) { loadingEl.remove(); loadingEl = null; }
        botEl = document.createElement('div');
        botEl.className = 'flex gap-3 px-4 sm:px-6 py-3 bot-message-group';
        botEl.dataset.requestId = requestId;
        // Regenerate button starts hidden; it's revealed in the "done"
        // event handler once seq metadata arrives from the backend.
        botEl.innerHTML = `
            <img src="assets/logo.jpg" alt="揽盛电气智能体" class="w-8 h-8 rounded-lg flex-shrink-0">
            <div class="min-w-0 flex-1 max-w-[85%]">
                <div class="bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm leading-relaxed msg-content text-slate-700 dark:text-slate-200">
                    <div class="agent-steps"></div>
                    <div class="answer-content sse-streaming"></div>
                    <div class="media-content"></div>
                    <div class="bot-audio-slot"></div>
                </div>
                <div class="flex items-center gap-2 mt-1.5">
                    <span class="text-xs text-slate-400 dark:text-slate-500">${formatTime(timestamp)}</span>
                    <button class="copy-msg-btn text-xs text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors cursor-pointer" title="${currentLang === 'zh' ? '复制' : 'Copy'}" style="display:none">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="speak-msg-btn text-xs text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors cursor-pointer" title="${t('speak_msg')}" style="display:none;">
                        <i class="fas fa-volume-up"></i>
                    </button>
                    <button class="regenerate-msg-btn text-xs text-slate-300 dark:text-slate-600 hover:text-primary-400 dark:hover:text-primary-400 transition-colors cursor-pointer" title="${t('regenerate_response')}" style="display:none;">
                        <i class="fas fa-rotate-right"></i>
                    </button>
                </div>
            </div>
        `;
        messagesDiv.appendChild(botEl);
        stepsEl = botEl.querySelector('.agent-steps');
        contentEl = botEl.querySelector('.answer-content');
        mediaEl = botEl.querySelector('.media-content');
    }

    // Holds the live EventSource so terminal events (done/voice_attach/error)
    // can close it. During replay there is no live connection (null).
    let currentEs = null;

    // Render one SSE event into the bubble. Used by the live handler and by
    // re-attach replay alike, so both paths produce identical UI.
    function processSSEItem(item) {
            if (item.type === 'reasoning') {
                ensureBotEl();
                reasoningText += item.content;
                if (!currentReasoningEl) {
                    reasoningStartTime = Date.now();
                    currentReasoningEl = document.createElement('div');
                    currentReasoningEl.className = 'agent-step agent-thinking-step';
                    // During streaming, use a <pre> with a single text node and
                    // append-only updates. This avoids re-parsing markdown and
                    // re-setting innerHTML on every chunk, which is what causes
                    // the page to crash on long chains-of-thought.
                    currentReasoningEl.innerHTML = `
                        <div class="thinking-header" onclick="this.parentElement.classList.toggle('expanded')">
                            <i class="fas fa-lightbulb text-amber-400 flex-shrink-0"></i>
                            <span class="thinking-summary">${t('thinking_in_progress')}</span>
                            <i class="fas fa-chevron-right thinking-chevron"></i>
                        </div>
                        <div class="thinking-full"><pre class="thinking-stream-pre"></pre></div>`;
                    stepsEl.appendChild(currentReasoningEl);
                    const preEl = currentReasoningEl.querySelector('.thinking-stream-pre');
                    preEl.appendChild(document.createTextNode(''));
                    currentReasoningEl._streamTextNode = preEl.firstChild;
                    currentReasoningEl._streamPendingText = '';
                    currentReasoningEl._streamRafScheduled = false;
                    currentReasoningEl._streamCharsRendered = 0;
                    currentReasoningEl._streamCapped = false;
                }
                // Hard cap: once REASONING_RENDER_CAP chars are in the DOM, stop
                // appending further deltas. The full text is still kept in
                // `reasoningText` for finalize-time head+tail rendering.
                if (!currentReasoningEl._streamCapped) {
                    currentReasoningEl._streamPendingText += item.content;
                    if (!currentReasoningEl._streamRafScheduled) {
                        currentReasoningEl._streamRafScheduled = true;
                        const elRef = currentReasoningEl;
                        requestAnimationFrame(() => {
                            elRef._streamRafScheduled = false;
                            if (!elRef.isConnected || !elRef._streamTextNode) return;
                            let pending = elRef._streamPendingText;
                            elRef._streamPendingText = '';
                            if (!pending) return;
                            const remaining = REASONING_RENDER_CAP - elRef._streamCharsRendered;
                            if (remaining <= 0) {
                                elRef._streamCapped = true;
                            } else {
                                if (pending.length > remaining) {
                                    pending = pending.slice(0, remaining);
                                    elRef._streamCapped = true;
                                }
                                elRef._streamTextNode.appendData(pending);
                                elRef._streamCharsRendered += pending.length;
                                if (elRef._streamCapped) {
                                    elRef._streamTextNode.appendData(
                                        '\n\n... [reasoning truncated for display] ...'
                                    );
                                }
                            }
                            scrollChatToBottom();
                        });
                    }
                }

            } else if (item.type === 'delta') {
                ensureBotEl();
                if (currentReasoningEl) {
                    finalizeThinking(currentReasoningEl, reasoningStartTime, reasoningText);
                    currentReasoningEl = null;
                    reasoningText = '';
                }
                accumulatedText += item.content;
                contentEl.innerHTML = renderMarkdown(accumulatedText);
                scrollChatToBottom();

            } else if (item.type === 'message_end') {
                if (item.has_tool_calls && accumulatedText.trim()) {
                    ensureBotEl();
                    const frozenEl = document.createElement('div');
                    frozenEl.className = 'agent-step agent-content-step';
                    frozenEl.innerHTML = `<div class="agent-content-body">${renderMarkdown(accumulatedText.trim())}</div>`;
                    stepsEl.appendChild(frozenEl);
                    accumulatedText = '';
                    contentEl.innerHTML = '';
                    scrollChatToBottom();
                }

            } else if (item.type === 'tool_start') {
                ensureBotEl();
                if (currentReasoningEl) {
                    finalizeThinking(currentReasoningEl, reasoningStartTime, reasoningText);
                    currentReasoningEl = null;
                    reasoningText = '';
                }
                accumulatedText = '';
                contentEl.innerHTML = '';

                // Add tool execution indicator (collapsible)
                const toolEl = document.createElement('div');
                toolEl.className = 'agent-step agent-tool-step tool-streaming';
                toolEl.dataset.progressReceived = 'false';
                const argsStr = formatToolArgs(item.arguments || {});
                toolEl.innerHTML = `
                    <div class="tool-header" onclick="this.parentElement.classList.toggle('expanded')">
                        <i class="fas fa-cog fa-spin text-primary-400 flex-shrink-0 tool-icon"></i>
                        <span class="tool-name">${item.tool}</span>
                        <i class="fas fa-chevron-right tool-chevron"></i>
                    </div>
                    <div class="tool-detail">
                        <div class="tool-detail-section">
                            <div class="tool-detail-label">Input</div>
                            <pre class="tool-detail-content">${argsStr}</pre>
                        </div>
                        <div class="tool-detail-section tool-output-section">
                            <div class="tool-detail-label tool-output-label">Output</div>
                            <pre class="tool-detail-content tool-live-output"></pre>
                        </div>
                    </div>`;
                stepsEl.appendChild(toolEl);
                toolElements.set(item.tool_call_id, toolEl);

                scrollChatToBottom();

            } else if (item.type === 'tool_progress') {
                const toolEl = toolElements.get(item.tool_call_id);
                if (toolEl) {
                    if (toolEl.dataset.progressReceived !== 'true') {
                        toolEl.classList.add('expanded');
                        toolEl.dataset.progressReceived = 'true';
                    }
                    toolEl.querySelector('.tool-live-output').textContent = String(item.content || '');
                    scrollChatToBottom();
                }

            } else if (item.type === 'tool_end') {
                const toolEl = toolElements.get(item.tool_call_id);
                if (toolEl) {
                    const isError = item.status !== 'success';
                    const icon = toolEl.querySelector('.tool-icon');
                    icon.className = isError
                        ? 'fas fa-times text-red-400 flex-shrink-0 tool-icon'
                        : 'fas fa-check text-primary-400 flex-shrink-0 tool-icon';

                    // Show execution time
                    const nameEl = toolEl.querySelector('.tool-name');
                    if (item.execution_time !== undefined) {
                        nameEl.innerHTML += ` <span class="tool-time">${item.execution_time}s</span>`;
                    }

                    // Fill output section
                    const outputLabel = toolEl.querySelector('.tool-output-label');
                    const outputEl = toolEl.querySelector('.tool-live-output');
                    if (outputLabel) outputLabel.textContent = isError ? 'Error' : 'Output';
                    if (outputEl) {
                        outputEl.textContent = item.result ? String(item.result) : '';
                        outputEl.classList.toggle('tool-error-text', isError);
                    }

                    toolEl.classList.remove('tool-streaming');
                    toolEl.classList.remove('expanded');
                    if (!item.result) {
                        const outputSection = toolEl.querySelector('.tool-output-section');
                        if (outputSection) outputSection.remove();
                    }
                    if (isError) toolEl.classList.add('tool-failed');
                    toolElements.delete(item.tool_call_id);
                }

            } else if (item.type === 'image') {
                ensureBotEl();
                const imgEl = document.createElement('img');
                imgEl.src = item.content;
                imgEl.alt = 'screenshot';
                imgEl.style.cssText = 'max-width:600px;border-radius:8px;margin:8px 0;cursor:zoom-in;box-shadow:0 1px 4px rgba(0,0,0,0.1);';
                imgEl.onclick = () => _openImageLightbox(imgEl.src);
                mediaEl.appendChild(imgEl);
                scrollChatToBottom();

            } else if (item.type === 'text') {
                // Intermediate text sent before media items; display it but keep SSE open.
                ensureBotEl();
                contentEl.classList.remove('sse-streaming');
                const textContent = item.content || accumulatedText;
                if (textContent) contentEl.innerHTML = renderMarkdown(textContent);
                applyHighlighting(botEl);
                scrollChatToBottom();

            } else if (item.type === 'video') {
                ensureBotEl();
                const wrapper = document.createElement('div');
                wrapper.innerHTML = _buildVideoHtml(item.content);
                mediaEl.appendChild(wrapper.firstElementChild || wrapper);
                scrollChatToBottom();

            } else if (item.type === 'file') {
                ensureBotEl();
                const fileName = item.file_name || item.content.split('/').pop();
                const fileEl = document.createElement('a');
                fileEl.href = item.content;
                fileEl.download = fileName;
                fileEl.target = '_blank';
                fileEl.className = 'file-attachment';
                fileEl.style.cssText = 'display:inline-flex;align-items:center;gap:6px;padding:8px 14px;margin:8px 0;border-radius:8px;background:var(--bg-secondary,#f3f4f6);color:var(--text-primary,#374151);text-decoration:none;font-size:14px;border:1px solid var(--border-color,#e5e7eb);';
                fileEl.innerHTML = `<i class="fas fa-file-download" style="color:#6b7280;"></i> ${fileName}`;
                mediaEl.appendChild(fileEl);
                scrollChatToBottom();

            } else if (item.type === 'phase') {
                // Coarse progress (e.g. cow install-browser); must not close SSE (unlike "done")
                ensureBotEl();
                const wrap = document.createElement('div');
                wrap.className = 'text-xs sm:text-sm text-slate-600 dark:text-slate-400 border-l-2 border-primary-400 pl-2 py-1 my-0.5';
                wrap.textContent = String(item.content || '');
                stepsEl.appendChild(wrap);
                scrollChatToBottom();

            } else if (item.type === 'cancelled') {
                // Agent acknowledged the stop; mark the bubble. A trailing
                // "done" still arrives with the partial answer.
                ensureBotEl();
                if (currentReasoningEl) {
                    finalizeThinking(currentReasoningEl, reasoningStartTime, reasoningText);
                    currentReasoningEl = null;
                    reasoningText = '';
                }
                if (!botEl.querySelector('.agent-cancelled-tag')) {
                    const tag = document.createElement('div');
                    tag.className = 'agent-cancelled-tag text-xs text-amber-600 dark:text-amber-400 mt-1';
                    tag.textContent = (currentLang === 'zh') ? '已中止' : 'Cancelled';
                    stepsEl.appendChild(tag);
                }
                resetSendBtnSendMode();

            } else if (item.type === 'done') {
                // Don't close the stream yet: the backend keeps it open
                // for a short tail to deliver async attachments such as
                // TTS audio (`voice_attach`). It will close the stream on
                // its own via onerror once the tail expires.
                done = true;
                clearOwnerRequest();
                resetSendBtnSendMode();

                const finalTextRaw = item.content || accumulatedText;
                const finalText = localizeCancelMarker(finalTextRaw);

                if (!botEl && finalText) {
                    if (loadingEl) { loadingEl.remove(); loadingEl = null; }
                    addBotMessage(finalText, new Date((item.timestamp || Date.now() / 1000) * 1000), requestId);
                } else if (botEl) {
                    contentEl.classList.remove('sse-streaming');
                    if (finalText) contentEl.innerHTML = renderMarkdown(finalText);
                    contentEl.dataset.rawMd = finalTextRaw || '';
                    const copyBtn = botEl.querySelector('.copy-msg-btn');
                    if (copyBtn && finalText) copyBtn.style.display = '';
                    applyHighlighting(botEl);
                }

                // Backfill seq metadata so edit/regenerate buttons can call
                // the delete API without a page refresh. Backend includes
                // user_seq / bot_seq on the done event after persistence.
                const targetBotEl = botEl || (requestId ? messagesDiv.querySelector(`[data-request-id="${requestId}"]`) : null);
                if (targetBotEl) {
                    if (item.bot_seq !== undefined && item.bot_seq !== null) {
                        targetBotEl.dataset.seq = item.bot_seq;
                    }
                    // Reveal regenerate button now that the seq is wired up.
                    const regenBtn = targetBotEl.querySelector('.regenerate-msg-btn');
                    if (regenBtn) regenBtn.style.display = '';
                    if (item.user_seq !== undefined && item.user_seq !== null) {
                        // Locate the preceding user bubble for this turn.
                        let prev = targetBotEl.previousElementSibling;
                        while (prev && !prev.classList.contains('user-message-group')) {
                            prev = prev.previousElementSibling;
                        }
                        if (prev && !prev.dataset.seq) {
                            prev.dataset.seq = item.user_seq;
                        }
                    }
                }
                renderBotSpeakerButton(botEl, finalText);
                scrollChatToBottom();

                if (titleInfo) {
                    generateSessionTitle(titleInfo.sid, titleInfo.userMsg, '');
                    titleInfo = null;
                } else if (sessionPanelOpen) {
                    loadSessionList();
                }

            } else if (item.type === 'voice_attach') {
                // TTS finished — attach a playable audio element to the
                // current bot bubble. The stream closes right after.
                if (botEl && item.url) {
                    attachAudioToBotBubble(botEl, item.url, { autoplay: true });
                }
                if (currentEs) { currentEs.close(); }
                delete activeStreams[requestId];
                clearOwnerRequest();

            } else if (item.type === 'error') {
                done = true;
                if (currentEs) { currentEs.close(); }
                delete activeStreams[requestId];
                clearOwnerRequest();
                if (loadingEl) { loadingEl.remove(); loadingEl = null; }
                addBotMessage(t('error_send'), new Date());
                resetSendBtnSendMode();
            }
    }

    function connect() {
        const es = new EventSource(`/stream?request_id=${encodeURIComponent(requestId)}`);
        currentEs = es;
        activeStreams[requestId] = es;

        es.onmessage = function(e) {
            let item;
            try { item = JSON.parse(e.data); } catch (_) { return; }

            // Successful data received, reset reconnect counter
            reconnectCount = 0;

            // Record every event for re-attach replay (capped to avoid
            // unbounded growth on very long streams).
            if (item.type === 'tool_progress' && item.tool_call_id) {
                const previousIndex = buffer.items.findIndex(
                    buffered => buffered.type === 'tool_progress'
                        && buffered.tool_call_id === item.tool_call_id
                );
                if (previousIndex >= 0) buffer.items.splice(previousIndex, 1);
            }
            if (buffer.items.length < 5000) buffer.items.push(item);

            // Background session: keep the stream alive so the reply finishes
            // and persists, but skip rendering into the now-foreign view. The
            // buffer above still grows so returning to the session can rebuild
            // the bubble and resume live rendering.
            if (ownerSession !== sessionId) {
                if (item.type === 'done' || item.type === 'error' || item.type === 'voice_attach') {
                    done = true;
                    es.close();
                    delete activeStreams[requestId];
                    clearOwnerRequest();
                }
                return;
            }

            processSSEItem(item);
        };

        es.onerror = function() {
            es.close();
            delete activeStreams[requestId];

            if (done) {
                // Normal close after the post-done tail expired; nothing to do.
                return;
            }

            if (currentReasoningEl) {
                finalizeThinking(currentReasoningEl, reasoningStartTime, reasoningText);
                currentReasoningEl = null;
                reasoningText = '';
            }

            if (reconnectCount < MAX_RECONNECTS) {
                reconnectCount++;
                const delay = Math.min(RECONNECT_BASE_MS * reconnectCount, 5000);
                console.warn(`[SSE] connection lost for ${requestId}, reconnecting in ${delay}ms (attempt ${reconnectCount}/${MAX_RECONNECTS})`);
                setTimeout(connect, delay);
                return;
            }

            // Exhausted retries. Only surface the failure in the owning view —
            // a background session must not mutate the currently shown chat.
            clearOwnerRequest();
            if (!isActive()) return;
            if (loadingEl) { loadingEl.remove(); loadingEl = null; }
            if (!botEl) {
                addBotMessage(t('error_send'), new Date());
            } else if (accumulatedText) {
                contentEl.classList.remove('sse-streaming');
                contentEl.innerHTML = renderMarkdown(accumulatedText);
                applyHighlighting(botEl);
                bindChatKnowledgeLinks(botEl);
            }
            resetSendBtnSendMode();
        };
    }

    // Re-attach replay: rebuild the bubble from buffered events (snapshot,
    // not animated) before connecting for the live tail. `processSSEItem`
    // is the same renderer used by the live onmessage handler, so the
    // snapshot matches exactly what live rendering would have produced.
    if (replayItems && replayItems.length) {
        for (const item of replayItems) {
            try { processSSEItem(item); } catch (_) {}
            if (item.type === 'done' || item.type === 'error' || item.type === 'voice_attach') {
                done = true;
            }
        }
        // If the buffered stream already finished, don't reconnect — the
        // reply is complete and persisted; show its final state and stop.
        if (done) {
            clearOwnerRequest();
            resetSendBtnSendMode();
            scrollChatToBottom(true);
            return;
        }
    }

    connect();
}

function startPolling() {
    const gen = ++pollGeneration;
    isPolling = true;
    let pollInFlight = false;

    function poll() {
        if (gen !== pollGeneration) return;
        if (pollInFlight) return;
        if (document.hidden) { setTimeout(poll, 10000); return; }

        pollInFlight = true;
        fetch('/poll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId })
        })
        .then(r => r.json())
        .then(data => {
            pollInFlight = false;
            if (gen !== pollGeneration) return;
            if (data.status === 'success' && data.has_content) {
                const rid = data.request_id;
                if (loadingContainers[rid]) {
                    loadingContainers[rid].remove();
                    delete loadingContainers[rid];
                }
                // Skip if this reply is already on screen. Happens when a reply
                // arrives via both the SSE stream and the poll queue (e.g. the
                // user switched away mid-run, leaving the queued reply to be
                // re-fetched on return) — render it only once.
                const already = rid && messagesDiv.querySelector(
                    `[data-request-id="${rid}"]`
                );
                if (!already) {
                    const welcomeScreen = document.getElementById('welcome-screen');
                    if (welcomeScreen) welcomeScreen.remove();
                    addBotMessage(data.content, new Date(data.timestamp * 1000), rid);
                    scrollChatToBottom();
                }
            }
            const delay = (data.status === 'success' && data.has_content) ? 5000 : 10000;
            setTimeout(poll, delay);
        })
        .catch(() => { pollInFlight = false; setTimeout(poll, 10000); });
    }
    poll();
}

function createUserMessageEl(content, timestamp, attachments) {
    const el = document.createElement('div');
    el.className = 'flex justify-end px-4 sm:px-6 py-3 user-message-group';

    let attachHtml = '';
    if (attachments && attachments.length > 0) {
        const items = attachments.map(a => {
            if (a.file_type === 'image') {
                return `<img src="${a.preview_url}" alt="${escapeHtml(a.file_name)}" class="user-msg-image">`;
            }
            const icon = a.file_type === 'video'
                ? 'fa-film'
                : (a.file_type === 'directory' ? 'fa-folder-tree' : 'fa-file-alt');
            const suffix = a.file_type === 'directory' && a.file_count
                ? ` (${a.file_count})`
                : '';
            return `<div class="user-msg-file"><i class="fas ${icon}"></i> ${escapeHtml(a.file_name)}${suffix}</div>`;
        }).join('');
        attachHtml = `<div class="user-msg-attachments">${items}</div>`;
    }

    const textHtml = content ? renderMarkdown(content) : '';
    el.innerHTML = `
        <div class="max-w-[75%] sm:max-w-[60%]">
            <div class="bg-primary-400 text-white rounded-2xl px-4 py-2.5 text-sm leading-relaxed msg-content user-bubble">
                ${attachHtml}${textHtml}
            </div>
            <div class="flex items-center justify-end gap-2 mt-1.5">
                <button class="edit-msg-btn text-xs text-slate-300 dark:text-slate-600 hover:text-primary-400 dark:hover:text-primary-400 transition-colors cursor-pointer" title="${t('edit_message')}">
                    <i class="fas fa-pen-to-square"></i>
                </button>
                <button class="delete-msg-btn text-xs text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer" title="${t('delete_message_title')}">
                    <i class="fas fa-trash"></i>
                </button>
                <span class="text-xs text-slate-400 dark:text-slate-500">${formatTime(timestamp)}</span>
            </div>
        </div>
    `;
    // Store raw content for editing
    el.dataset.rawContent = content || '';
    return el;
}

function renderToolCallsHtml(toolCalls) {
    if (!toolCalls || toolCalls.length === 0) return '';
    return toolCalls.map(tc => {
        const argsStr = formatToolArgs(tc.arguments || {});
        const resultStr = tc.result ? escapeHtml(String(tc.result)) : '';
        const hasResult = !!resultStr;
        return `
<div class="agent-step agent-tool-step">
    <div class="tool-header" onclick="this.parentElement.classList.toggle('expanded')">
        <i class="fas fa-check text-primary-400 flex-shrink-0 tool-icon"></i>
        <span class="tool-name">${escapeHtml(tc.name || '')}</span>
        <i class="fas fa-chevron-right tool-chevron"></i>
    </div>
    <div class="tool-detail">
        <div class="tool-detail-section">
            <div class="tool-detail-label">Input</div>
            <pre class="tool-detail-content">${argsStr}</pre>
        </div>
        ${hasResult ? `
        <div class="tool-detail-section tool-output-section">
            <div class="tool-detail-label">Output</div>
            <pre class="tool-detail-content">${resultStr}</pre>
        </div>` : ''}
    </div>
</div>`;
    }).join('');
}

// Cap for rendering reasoning content in the bubble. Beyond this size,
// we skip markdown rendering entirely and show plain text head + tail to
// keep the page responsive (very long chains-of-thought can otherwise
// stall or crash the browser when re-parsed by marked.js).
// Keep this in sync with backend MAX_STORED_REASONING_CHARS and
// MAX_REASONING_STREAM_CHARS so storage / SSE / display stay aligned.
const REASONING_RENDER_CAP = 4 * 1024; // 4 KB

function _truncateReasoningForDisplay(text) {
    if (!text || text.length <= REASONING_RENDER_CAP) return { text, truncated: false, omitted: 0 };
    const half = Math.floor(REASONING_RENDER_CAP / 2);
    const head = text.slice(0, half);
    const tail = text.slice(-half);
    return {
        text: head + '\n\n... [' + (text.length - head.length - tail.length) + ' chars omitted] ...\n\n' + tail,
        truncated: true,
        omitted: text.length - head.length - tail.length,
    };
}

function _renderReasoningBody(text) {
    // For short reasoning, render as markdown. For long ones, fall back to
    // an escaped <pre> block to avoid expensive markdown parsing.
    const { text: shown, truncated } = _truncateReasoningForDisplay(text);
    if (truncated || shown.length > REASONING_RENDER_CAP) {
        return '<pre class="thinking-stream-pre">' + escapeHtml(shown) + '</pre>';
    }
    return renderMarkdown(shown);
}

function finalizeThinking(el, startTime, text) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    el.querySelector('.thinking-summary').textContent = t('thinking_done');
    const fullDiv = el.querySelector('.thinking-full');
    fullDiv.innerHTML = `<div class="thinking-duration">${t('thinking_duration')} ${elapsed}s</div>` + _renderReasoningBody(text);
}

function renderThinkingHtml(text) {
    if (!text || !text.trim()) return '';
    const full = text.trim();
    return `
<div class="agent-step agent-thinking-step">
    <div class="thinking-header" onclick="this.parentElement.classList.toggle('expanded')">
        <i class="fas fa-lightbulb text-amber-400 flex-shrink-0"></i>
        <span class="thinking-summary">${t('thinking_done')}</span>
        <i class="fas fa-chevron-right thinking-chevron"></i>
    </div>
    <div class="thinking-full">${_renderReasoningBody(full)}</div>
</div>`;
}

function renderStepsHtml(steps) {
    if (!steps || steps.length === 0) return { stepsHtml: '', finalContent: '' };

    // Find the index of the last content step — it becomes the main answer, not a step
    let lastContentIdx = -1;
    for (let i = steps.length - 1; i >= 0; i--) {
        if (steps[i].type === 'content') { lastContentIdx = i; break; }
    }

    let html = '';
    let lastContentText = '';
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        if (step.type === 'thinking') {
            html += renderThinkingHtml(step.content);
        } else if (step.type === 'content') {
            if (i === lastContentIdx) {
                lastContentText = step.content;
            } else {
                html += `<div class="agent-step agent-content-step"><div class="agent-content-body">${renderMarkdown(step.content)}</div></div>`;
            }
        } else if (step.type === 'tool') {
            const argsStr = formatToolArgs(step.arguments || {});
            const resultStr = step.result ? escapeHtml(String(step.result)) : '';
            const isErr = step.is_error === true;
            const iconClass = isErr
                ? 'fas fa-times text-red-400 flex-shrink-0 tool-icon'
                : 'fas fa-check text-primary-400 flex-shrink-0 tool-icon';
            html += `
<div class="agent-step agent-tool-step${isErr ? ' tool-failed' : ''}">
    <div class="tool-header" onclick="this.parentElement.classList.toggle('expanded')">
        <i class="${iconClass}"></i>
        <span class="tool-name">${escapeHtml(step.name || '')}</span>
        <i class="fas fa-chevron-right tool-chevron"></i>
    </div>
    <div class="tool-detail">
        <div class="tool-detail-section">
            <div class="tool-detail-label">Input</div>
            <pre class="tool-detail-content">${argsStr}</pre>
        </div>
        ${resultStr ? `
        <div class="tool-detail-section tool-output-section">
            <div class="tool-detail-label">${isErr ? 'Error' : 'Output'}</div>
            <pre class="tool-detail-content${isErr ? ' tool-error-text' : ''}">${resultStr}</pre>
        </div>` : ''}
    </div>
</div>`;
            // If this tool sent a file (send/read tool), render the media inline
            // so it persists across page refreshes (SSE-only file events are not stored).
            const mediaHtml = _renderSentFileFromToolResult(step);
            if (mediaHtml) html += mediaHtml;
        }
    }
    return { stepsHtml: html, lastContentText };
}

// Extract file-to-send metadata from a tool's result and render an inline preview.
// Returns '' if the result isn't a file_to_send payload.
function _renderSentFileFromToolResult(step) {
    if (!step || !step.result) return '';
    let payload;
    try {
        payload = typeof step.result === 'string' ? JSON.parse(step.result) : step.result;
    } catch (_) { return ''; }
    if (!payload || payload.type !== 'file_to_send' || !payload.path) return '';
    const webUrl = _toWebUrl(payload.path);
    const fileType = payload.file_type || 'file';
    const fileName = payload.file_name || payload.path.split('/').pop();
    if (fileType === 'image') {
        return `<div class="agent-step">${_buildImageHtml(webUrl)}</div>`;
    }
    if (fileType === 'video') {
        return `<div class="agent-step">${_buildVideoHtml(webUrl)}</div>`;
    }
    return `<div class="agent-step"><a href="${webUrl}" download="${escapeHtml(fileName)}" target="_blank" ` +
        `style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;margin:8px 0;border-radius:8px;` +
        `background:var(--bg-secondary,#f3f4f6);color:var(--text-primary,#374151);text-decoration:none;font-size:14px;` +
        `border:1px solid var(--border-color,#e5e7eb);">` +
        `<i class="fas fa-file-download" style="color:#6b7280;"></i> ${escapeHtml(fileName)}</a></div>`;
}

// Cosmetic translator for cancel markers persisted in history.
// History keeps the English canonical form for the LLM; only display is localized.
function localizeCancelMarker(text) {
    if (!text) return text;
    if (currentLang !== 'zh') return text;
    return text
        .replace(/_\(Cancelled by user\)_/g, '_(用户已中止)_')
        .replace(/_\(Cancelled\)_/g, '_(已中止)_');
}

function createBotMessageEl(content, timestamp, requestId, msg) {
    const el = document.createElement('div');
    el.className = 'flex gap-3 px-4 sm:px-6 py-3 bot-message-group';
    if (requestId) el.dataset.requestId = requestId;

    let stepsHtml = '';
    let displayContent = localizeCancelMarker(content);

    if (msg && msg.steps && msg.steps.length > 0) {
        // New format: ordered steps with interleaved content
        const result = renderStepsHtml(msg.steps);
        stepsHtml = result.stepsHtml;
        // The final content (last text after all steps) is the main answer
        displayContent = content || result.lastContentText;
    } else {
        // Legacy format: separate tool_calls + optional reasoning
        const toolCalls = msg && msg.tool_calls;
        const reasoning = msg && msg.reasoning;
        stepsHtml = renderThinkingHtml(reasoning) + renderToolCallsHtml(toolCalls);
    }

    // Self-evolution bubbles get a small badge so the user can feel the agent
    // learned something on its own (text itself stays clean). History replay
    // carries msg.kind; live pushes are identified by the evolution_ request id.
    const isEvolution = (msg && msg.kind === 'evolution')
        || (typeof requestId === 'string' && requestId.startsWith('evolution_'));
    const evolutionBadge = isEvolution
        ? `<div class="flex items-center gap-1 mb-1.5 text-xs text-slate-400 dark:text-slate-500">
                <i class="fas fa-seedling text-[11px]"></i>
                <span>${t('evolution_badge')}</span>
           </div>`
        : '';

    el.innerHTML = `
        <img src="assets/logo.jpg" alt="揽盛电气智能体" class="w-8 h-8 rounded-lg flex-shrink-0">
        <div class="min-w-0 flex-1 max-w-[85%]">
            <div class="bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm leading-relaxed msg-content text-slate-700 dark:text-slate-200">
                ${evolutionBadge}
                ${stepsHtml ? `<div class="agent-steps">${stepsHtml}</div>` : ''}
                <div class="answer-content">${renderMarkdown(displayContent)}</div>
                <div class="bot-audio-slot"></div>
            </div>
            <div class="flex items-center gap-2 mt-1.5">
                <span class="text-xs text-slate-400 dark:text-slate-500">${formatTime(timestamp)}</span>
                <button class="copy-msg-btn text-xs text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors cursor-pointer" title="${currentLang === 'zh' ? '复制' : 'Copy'}">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="speak-msg-btn text-xs text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors cursor-pointer" title="${t('speak_msg')}" style="display:none;">
                    <i class="fas fa-volume-up"></i>
                </button>
                <button class="regenerate-msg-btn text-xs text-slate-300 dark:text-slate-600 hover:text-primary-400 dark:hover:text-primary-400 transition-colors cursor-pointer" title="${t('regenerate_response')}">
                    <i class="fas fa-rotate-right"></i>
                </button>
            </div>
        </div>
    `;
    el.querySelector('.answer-content').dataset.rawMd = displayContent;
    // Existing TTS attachment (history replay): mount the player up-front.
    const existingAudio = msg && msg.extras && msg.extras.audio && msg.extras.audio.url;
    if (existingAudio) {
        attachAudioToBotBubble(el, existingAudio, { autoplay: false });
    }
    renderBotSpeakerButton(el, displayContent);
    applyHighlighting(el);
    bindChatKnowledgeLinks(el);
    return el;
}

// Append (or replace) a small audio player inside a bot bubble's
// dedicated `.bot-audio-slot`. Used by both live TTS pushes and history
// replay. Silent failures: never throws.
function attachAudioToBotBubble(botEl, audioUrl, opts) {
    try {
        if (!botEl || !audioUrl) return;
        const slot = botEl.querySelector('.bot-audio-slot');
        if (!slot) return;
        slot.innerHTML = '';
        slot.style.marginTop = '6px';
        const pill = renderVoicePill(audioUrl, { autoplay: !!(opts && opts.autoplay) });
        slot.appendChild(pill);
        const speakBtn = botEl.querySelector('.speak-msg-btn');
        if (speakBtn) speakBtn.style.display = 'none';
    } catch (_) { /* silent */ }
}

// Build a compact play/pause + progress + duration pill that wraps a
// hidden <audio>. Returns the root element; safe to embed anywhere.
function renderVoicePill(audioUrl, opts) {
    opts = opts || {};
    const wrap = document.createElement('div');
    wrap.className = 'voice-pill';
    wrap.innerHTML = `
        <button type="button" class="voice-pill-btn" data-state="play" aria-label="play">
            <i class="fas fa-play"></i>
        </button>
        <div class="voice-pill-track"><div class="voice-pill-fill"></div></div>
        <span class="voice-pill-time">0:00</span>
        <audio preload="metadata" src="${audioUrl}"></audio>
    `;
    const btn = wrap.querySelector('.voice-pill-btn');
    const fill = wrap.querySelector('.voice-pill-fill');
    const timeEl = wrap.querySelector('.voice-pill-time');
    const audio = wrap.querySelector('audio');

    const fmt = (s) => {
        if (!isFinite(s) || s < 0) s = 0;
        const m = Math.floor(s / 60);
        const r = Math.floor(s % 60);
        return `${m}:${r < 10 ? '0' : ''}${r}`;
    };
    const setIcon = (state) => {
        btn.dataset.state = state;
        btn.querySelector('i').className = state === 'pause' ? 'fas fa-pause' : 'fas fa-play';
        btn.setAttribute('aria-label', state === 'pause' ? 'pause' : 'play');
    };

    audio.addEventListener('loadedmetadata', () => {
        if (audio.duration && isFinite(audio.duration)) timeEl.textContent = fmt(audio.duration);
    });
    audio.addEventListener('timeupdate', () => {
        const dur = audio.duration || 0;
        if (dur > 0) {
            fill.style.width = `${Math.min(100, (audio.currentTime / dur) * 100)}%`;
            timeEl.textContent = fmt(dur - audio.currentTime);
        }
    });
    audio.addEventListener('ended', () => {
        setIcon('play');
        fill.style.width = '0%';
        timeEl.textContent = fmt(audio.duration || 0);
    });
    audio.addEventListener('play',  () => setIcon('pause'));
    audio.addEventListener('pause', () => setIcon('play'));

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (audio.paused) {
            audio.play().catch(() => {});
        } else {
            audio.pause();
        }
    });

    if (opts.autoplay) {
        // Autoplay may be blocked by the browser; fall back silently and
        // let the user tap the play button.
        const tryPlay = () => audio.play().catch(() => {});
        if (audio.readyState >= 2) tryPlay();
        else audio.addEventListener('canplay', tryPlay, { once: true });
    }
    return wrap;
}

// Show the manual "read aloud" button when TTS is configured but the
// bubble has no audio yet. Lazily probes capability via /api/models so
// we don't expose the button when nothing can synthesize speech.
function renderBotSpeakerButton(botEl, text) {
    if (!botEl || !text || !text.trim()) return;
    const btn = botEl.querySelector('.speak-msg-btn');
    if (!btn) return;
    if (botEl.querySelector('.bot-audio-slot audio')) return;
    _isTtsReady().then(ready => {
        if (!ready) return;
        btn.style.display = '';
        btn.onclick = () => _triggerManualTts(btn, botEl, text);
    });
}

let _ttsReadyPromise = null;
let _ttsReadyTs = 0;
function _isTtsReady() {
    // Cache for 30s to avoid hammering /api/models on every bubble.
    if (_ttsReadyPromise && Date.now() - _ttsReadyTs < 30000) {
        return _ttsReadyPromise;
    }
    _ttsReadyTs = Date.now();
    _ttsReadyPromise = fetch('/api/models')
        .then(r => r.json())
        .then(data => {
            const tts = data && data.capabilities && data.capabilities.tts;
            if (!tts) return false;
            return Boolean(tts.current_provider || tts.suggested_provider);
        })
        .catch(() => false);
    return _ttsReadyPromise;
}

function _triggerManualTts(btn, botEl, text) {
    if (btn.dataset.busy === '1') return;
    btn.dataset.busy = '1';
    const icon = btn.querySelector('i');
    const prev = icon ? icon.className : '';
    if (icon) icon.className = 'fas fa-spinner fa-spin';
    fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, session_id: sessionId }),
    })
        .then(r => r.json())
        .then(data => {
            if (data && data.status === 'success' && data.audio_url) {
                attachAudioToBotBubble(botEl, data.audio_url, { autoplay: true });
            }
        })
        .catch(() => {})
        .finally(() => {
            btn.dataset.busy = '0';
            if (icon) icon.className = prev || 'fas fa-volume-up';
        });
}

function addUserMessage(content, timestamp, attachments) {
    const el = createUserMessageEl(content, timestamp, attachments);
    messagesDiv.appendChild(el);
    _autoScrollEnabled = true;
    scrollChatToBottom(true);
}

function addBotMessage(content, timestamp, requestId) {
    const el = createBotMessageEl(content, timestamp, requestId);
    messagesDiv.appendChild(el);
    scrollChatToBottom();
}

// Load conversation history from the server (page 1 = most recent messages).
// Subsequent pages prepend older messages when the user scrolls to the top.
function loadHistory(page) {
    if (historyLoading) return;
    historyLoading = true;

    fetch(`/api/history?session_id=${encodeURIComponent(sessionId)}&page=${page}&page_size=20`)
        .then(r => r.json())
        .then(data => {
            if (data.status !== 'success' || data.messages.length === 0) return;

            const prevScrollHeight = messagesDiv.scrollHeight;
            const isFirstLoad = page === 1;

            // On first load, remove the welcome screen if history exists
            if (isFirstLoad) {
                const ws = document.getElementById('welcome-screen');
                if (ws) ws.remove();
            }

            // Build a fragment of history message elements in chronological order
            const fragment = document.createDocumentFragment();

            if (data.has_more && page > 1) {
                // Keep the "load more" sentinel in place (inserted below)
            }

            const ctxStartSeq = data.context_start_seq || 0;
            let dividerInserted = false;

            data.messages.forEach(msg => {
                const hasContent = msg.content && msg.content.trim();
                const hasToolCalls = msg.role === 'assistant' && msg.tool_calls && msg.tool_calls.length > 0;
                if (!hasContent && !hasToolCalls) return;

                // Insert context divider when transitioning from above to below boundary
                if (ctxStartSeq > 0 && !dividerInserted && msg._seq !== undefined && msg._seq >= ctxStartSeq) {
                    dividerInserted = true;
                    const divider = document.createElement('div');
                    divider.className = 'context-divider';
                    divider.innerHTML = `<span>${t('context_cleared')}</span>`;
                    fragment.appendChild(divider);
                }

                const ts = new Date(msg.created_at * 1000);
                const el = msg.role === 'user'
                    ? createUserMessageEl(msg.content, ts)
                    : createBotMessageEl(msg.content || '', ts, null, msg);
                // Store seq for delete functionality
                if (msg._seq !== undefined) {
                    el.dataset.seq = msg._seq;
                }
                fragment.appendChild(el);
            });

            // If context was cleared but no new messages exist yet, append divider at the end
            if (ctxStartSeq > 0 && !dividerInserted) {
                const divider = document.createElement('div');
                divider.className = 'context-divider';
                divider.innerHTML = `<span>${t('context_cleared')}</span>`;
                fragment.appendChild(divider);
            }

            // Prepend history above any existing messages
            const sentinel = document.getElementById('history-load-more');
            const insertBefore = sentinel ? sentinel.nextSibling : messagesDiv.firstChild;
            messagesDiv.insertBefore(fragment, insertBefore);
            updateEditButtonsState();

            // Manage the "load more" sentinel at the very top
            if (data.has_more) {
                if (!document.getElementById('history-load-more')) {
                    const btn = document.createElement('div');
                    btn.id = 'history-load-more';
                    btn.className = 'flex justify-center py-3';
                    btn.innerHTML = `<button class="text-xs text-slate-400 dark:text-slate-500 hover:text-primary-400 transition-colors" onclick="loadHistory(historyPage + 1)">Load earlier messages</button>`;
                    messagesDiv.insertBefore(btn, messagesDiv.firstChild);
                }
            } else {
                const sentinel = document.getElementById('history-load-more');
                if (sentinel) sentinel.remove();
            }

            historyHasMore = data.has_more;
            historyPage = page;

            if (isFirstLoad) {
                // Scroll to the very bottom after the DOM settles. A single
                // rAF isn't enough: markdown/code-highlight/images keep growing
                // scrollHeight after the first paint, leaving the last bubble's
                // timestamp clipped. Re-pin a few times to catch late layout.
                requestAnimationFrame(() => scrollChatToBottom(true));
                [120, 350, 700].forEach(d => setTimeout(() => scrollChatToBottom(true), d));
            } else {
                // Restore scroll position so loading older messages doesn't jump the view
                messagesDiv.scrollTop = messagesDiv.scrollHeight - prevScrollHeight;
            }
        })
        .catch(() => {})
        .finally(() => { historyLoading = false; });
}

function addLoadingIndicator() {
    const el = document.createElement('div');
    el.className = 'flex gap-3 px-4 sm:px-6 py-3';
    el.innerHTML = `
        <img src="assets/logo.jpg" alt="揽盛电气智能体" class="w-8 h-8 rounded-lg flex-shrink-0">
        <div class="bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3">
            <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-primary-400 animate-pulse-dot" style="animation-delay: 0s"></span>
                <span class="w-2 h-2 rounded-full bg-primary-400 animate-pulse-dot" style="animation-delay: 0.2s"></span>
                <span class="w-2 h-2 rounded-full bg-primary-400 animate-pulse-dot" style="animation-delay: 0.4s"></span>
            </div>
        </div>
    `;
    messagesDiv.appendChild(el);
    scrollChatToBottom();
    return el;
}

function newChat(optimistic = true) {
    // Do NOT close active streams: other sessions keep streaming in the
    // background (each stream self-guards against the foreign view) and their
    // replies still complete and persist.

    // Generate a fresh session and persist it so the next page load also starts clean
    sessionId = generateSessionId();
    localStorage.setItem(SESSION_ID_KEY, sessionId);
    resetSendBtnSendMode();  // fresh session has no in-flight reply
    startPolling();  // bump generation so old loop self-cancels, new loop uses fresh sessionId
    messagesDiv.innerHTML = '';
    const ws = document.createElement('div');
    ws.id = 'welcome-screen';
    ws.className = 'flex flex-col items-center justify-center h-full px-6 pb-16';
    ws.style.paddingTop = '6vh';
    ws.innerHTML = `
        <img src="assets/logo.jpg" alt="揽盛电气智能体" class="w-16 h-16 rounded-2xl mb-6 shadow-lg shadow-primary-500/20">
        <h1 class="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">${appConfig.title || '揽盛电气智能体'}</h1>
        <p class="text-slate-500 dark:text-slate-400 text-center max-w-lg mb-10 leading-relaxed" data-i18n="welcome_subtitle">${t('welcome_subtitle')}</p>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-2xl">
            <div class="example-card group bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-xl p-4 cursor-pointer hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all duration-200">
                <div class="flex items-center gap-2 mb-2">
                    <div class="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                        <i class="fas fa-folder-open text-blue-500 text-xs"></i>
                    </div>
                    <span class="font-medium text-sm text-slate-700 dark:text-slate-200" data-i18n="example_sys_title">${t('example_sys_title')}</span>
                </div>
                <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed" data-i18n="example_sys_text">${t('example_sys_text')}</p>
            </div>
            <div class="example-card group bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-xl p-4 cursor-pointer hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all duration-200">
                <div class="flex items-center gap-2 mb-2">
                    <div class="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                        <i class="fas fa-clock text-amber-500 text-xs"></i>
                    </div>
                    <span class="font-medium text-sm text-slate-700 dark:text-slate-200" data-i18n="example_task_title">${t('example_task_title')}</span>
                </div>
                <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed" data-i18n="example_task_text">${t('example_task_text')}</p>
            </div>
            <div class="example-card group bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-xl p-4 cursor-pointer hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all duration-200">
                <div class="flex items-center gap-2 mb-2">
                    <div class="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                        <i class="fas fa-code text-emerald-500 text-xs"></i>
                    </div>
                    <span class="font-medium text-sm text-slate-700 dark:text-slate-200" data-i18n="example_code_title">${t('example_code_title')}</span>
                </div>
                <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed" data-i18n="example_code_text">${t('example_code_text')}</p>
            </div>
            <div class="example-card group bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-xl p-4 cursor-pointer hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all duration-200">
                <div class="flex items-center gap-2 mb-2">
                    <div class="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
                        <i class="fas fa-book text-violet-500 text-xs"></i>
                    </div>
                    <span class="font-medium text-sm text-slate-700 dark:text-slate-200" data-i18n="example_knowledge_title">${t('example_knowledge_title')}</span>
                </div>
                <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed" data-i18n="example_knowledge_text">${t('example_knowledge_text')}</p>
            </div>
            <div class="example-card group bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-xl p-4 cursor-pointer hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all duration-200">
                <div class="flex items-center gap-2 mb-2">
                    <div class="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center">
                        <i class="fas fa-puzzle-piece text-rose-500 text-xs"></i>
                    </div>
                    <span class="font-medium text-sm text-slate-700 dark:text-slate-200" data-i18n="example_skill_title">${t('example_skill_title')}</span>
                </div>
                <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed" data-i18n="example_skill_text">${t('example_skill_text')}</p>
            </div>
            <div class="example-card group bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-xl p-4 cursor-pointer hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all duration-200" data-send="/help">
                <div class="flex items-center gap-2 mb-2">
                    <div class="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <i class="fas fa-terminal text-slate-500 text-xs"></i>
                    </div>
                    <span class="font-medium text-sm text-slate-700 dark:text-slate-200" data-i18n="example_web_title">${t('example_web_title')}</span>
                </div>
                <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed" data-i18n="example_web_text">${t('example_web_text')}</p>
            </div>
        </div>
    `;
    messagesDiv.appendChild(ws);
    ws.querySelectorAll('.example-card').forEach(card => {
        card.addEventListener('click', () => {
            const sendText = card.dataset.send;
            if (sendText) {
                chatInput.value = sendText;
                chatInput.dispatchEvent(new Event('input'));
                chatInput.focus();
                return;
            }
            const textEl = card.querySelector('[data-i18n*="text"]');
            if (textEl) {
                chatInput.value = textEl.textContent;
                chatInput.dispatchEvent(new Event('input'));
                chatInput.focus();
            }
        });
    });
    if (currentView !== 'chat') navigateTo('chat');

    // Show panel and load full session list, then prepend the new session on top
    const panel = document.getElementById('session-panel');
    if (panel && !sessionPanelOpen) {
        sessionPanelOpen = true;
        panel.classList.remove('hidden');
        _showSessionOverlay();
        _persistPanelState();
    }
    // Only prepend an optimistic "new chat" item when this is a real new-chat
    // action. When called after deleting the current session, skip it: the
    // fresh session has no backend record yet, so inserting it would leave an
    // empty, undeletable item in the list (deleting it just spawns another).
    const newSid = sessionId;
    if (optimistic) {
        loadSessionList(() => _addOptimisticSessionItem(newSid));
    } else {
        loadSessionList();
    }
}

// =====================================================================
// Session Panel
// =====================================================================

const SESSION_PANEL_KEY = 'cow_session_panel_open';
let sessionPanelOpen = localStorage.getItem(SESSION_PANEL_KEY) === '1';

function _persistPanelState() {
    localStorage.setItem(SESSION_PANEL_KEY, sessionPanelOpen ? '1' : '0');
}

function _isMobileView() {
    return window.innerWidth <= 768;
}

function _showSessionOverlay() {
    if (!_isMobileView()) return;
    const overlay = document.getElementById('session-panel-overlay');
    if (overlay) overlay.classList.remove('hidden');
}

function _hideSessionOverlay() {
    const overlay = document.getElementById('session-panel-overlay');
    if (overlay) overlay.classList.add('hidden');
}

function closeSessionPanel() {
    const panel = document.getElementById('session-panel');
    if (!panel || !sessionPanelOpen) return;
    sessionPanelOpen = false;
    panel.classList.add('hidden');
    _hideSessionOverlay();
    _persistPanelState();
}

function toggleSessionPanel() {
    const panel = document.getElementById('session-panel');
    if (!panel) return;
    sessionPanelOpen = !sessionPanelOpen;
    panel.classList.toggle('hidden', !sessionPanelOpen);
    if (sessionPanelOpen) {
        _showSessionOverlay();
    } else {
        _hideSessionOverlay();
    }
    _persistPanelState();
    if (sessionPanelOpen) loadSessionList();
}

function openSessionPanel() {
    const panel = document.getElementById('session-panel');
    if (!panel || sessionPanelOpen) return;
    sessionPanelOpen = true;
    panel.classList.remove('hidden');
    _showSessionOverlay();
    _persistPanelState();
    loadSessionList();
}

function _restoreSessionPanel() {
    const panel = document.getElementById('session-panel');
    if (!panel) return;
    if (sessionPanelOpen && !_isMobileView()) {
        panel.classList.remove('hidden');
        _showSessionOverlay();
        loadSessionList();
    } else {
        panel.classList.add('hidden');
        _hideSessionOverlay();
    }
}

function _applyInputTooltips() {
    const set = (id, key, pos) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.setAttribute('data-tooltip', t(key));
        el.removeAttribute('title');
        if (pos) el.setAttribute('data-tooltip-pos', pos);
    };
    set('new-chat-btn', 'tip_new_chat');
    set('clear-context-btn', 'tip_clear_context');
    set('attach-btn', 'tip_attach');
    set('session-toggle-btn', 'session_history', 'bottom');
}

function _addOptimisticSessionItem(sid) {
    const container = document.getElementById('session-list');
    if (!container) return;

    const emptyEl = container.querySelector('.session-empty');
    if (emptyEl) emptyEl.remove();

    document.querySelectorAll('.session-item.active').forEach(el => el.classList.remove('active'));

    const todayLabel = t('today');
    let firstGroup = container.querySelector('.session-group-label');
    if (!firstGroup || firstGroup.textContent !== todayLabel) {
        const header = document.createElement('div');
        header.className = 'session-group-label';
        header.textContent = todayLabel;
        container.prepend(header);
        firstGroup = header;
    }

    const title = t('new_chat');
    const item = document.createElement('div');
    item.className = 'session-item active';
    item.dataset.sessionId = sid;
    item.innerHTML = `
        <i class="fas fa-message session-icon"></i>
        <span class="session-title" title="${escapeHtml(title)}">${escapeHtml(title)}</span>
        <button class="session-rename" onclick="event.stopPropagation(); renameSession('${sid}')" title="${escapeHtml(t('rename_session'))}">
            <i class="fas fa-pen"></i>
        </button>
        <button class="session-delete" onclick="event.stopPropagation(); deleteSession('${sid}')" title="Delete">
            <i class="fas fa-trash-can"></i>
        </button>
    `;
    item.addEventListener('click', () => switchSession(sid));
    firstGroup.insertAdjacentElement('afterend', item);
}

function _sessionTimeGroup(ts) {
    const now = new Date();
    const d = new Date(ts * 1000);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (d >= today) return t('today');
    if (d >= yesterday) return t('yesterday');
    return t('earlier');
}

let _sessionPage = 1;
let _sessionHasMore = false;
let _sessionLoading = false;
const _SESSION_PAGE_SIZE = 50;

function loadSessionList(onDone) {
    const container = document.getElementById('session-list');
    if (!container) return;

    _sessionPage = 1;
    _sessionHasMore = false;

    _fetchSessionPage(1, true, onDone);
}

function _fetchSessionPage(page, clear, onDone) {
    if (_sessionLoading) return;
    _sessionLoading = true;

    const container = document.getElementById('session-list');
    if (!container) { _sessionLoading = false; return; }

    // Remove existing "load more" sentinel before fetching
    const oldSentinel = container.querySelector('.session-load-more');
    if (oldSentinel) oldSentinel.remove();

    fetch(`/api/sessions?page=${page}&page_size=${_SESSION_PAGE_SIZE}`)
        .then(r => r.json())
        .then(data => {
            _sessionLoading = false;
            if (data.status !== 'success') return;

            if (clear) container.innerHTML = '';

            const sessions = data.sessions || [];
            _sessionPage = page;
            _sessionHasMore = !!data.has_more;

            if (sessions.length === 0 && page === 1) {
                container.innerHTML = '<div class="session-empty">' + t('untitled_session') + '</div>';
                if (typeof onDone === 'function') onDone();
                return;
            }

            // Track last group label already in the container
            const existingLabels = container.querySelectorAll('.session-group-label');
            let lastGroup = existingLabels.length > 0
                ? existingLabels[existingLabels.length - 1].textContent
                : '';

            sessions.forEach(s => {
                const group = _sessionTimeGroup(s.last_active);
                if (group !== lastGroup) {
                    lastGroup = group;
                    const header = document.createElement('div');
                    header.className = 'session-group-label';
                    header.textContent = group;
                    container.appendChild(header);
                }

                const item = document.createElement('div');
                const isActive = s.session_id === sessionId;
                item.className = 'session-item' + (isActive ? ' active' : '');
                item.dataset.sessionId = s.session_id;

                const title = s.title || t('untitled_session');
                item.innerHTML = `
                    <i class="fas fa-message session-icon"></i>
                    <span class="session-title" title="${escapeHtml(title)}">${escapeHtml(title)}</span>
                    <button class="session-rename" onclick="event.stopPropagation(); renameSession('${s.session_id}')" title="${escapeHtml(t('rename_session'))}">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="session-delete" onclick="event.stopPropagation(); deleteSession('${s.session_id}')" title="Delete">
                        <i class="fas fa-trash-can"></i>
                    </button>
                `;
                item.addEventListener('click', () => switchSession(s.session_id));
                container.appendChild(item);
            });

            if (typeof onDone === 'function') onDone();
        })
        .catch(() => { _sessionLoading = false; });
}

function _onSessionListScroll() {
    if (!_sessionHasMore || _sessionLoading) return;
    const container = document.getElementById('session-list');
    if (!container) return;
    // Trigger when scrolled near the bottom (within 60px)
    if (container.scrollHeight - container.scrollTop - container.clientHeight < 60) {
        _fetchSessionPage(_sessionPage + 1, false);
    }
}

// Attach scroll listener once DOM is ready
(function _initSessionScroll() {
    const el = document.getElementById('session-list');
    if (el) {
        el.addEventListener('scroll', _onSessionListScroll);
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            const el2 = document.getElementById('session-list');
            if (el2) el2.addEventListener('scroll', _onSessionListScroll);
        });
    }
})();

// Returning to a session whose reply is still streaming in the background.
// Close the background EventSource, rebuild the bubble from the buffered
// events (snapshot), then resume live streaming via a fresh connection that
// reads the remaining tail from the backend queue. Returns true if a stream
// was re-attached. The user's own bubble is already in history (persisted
// eagerly), so it was rendered by loadHistory before this runs.
function _reattachStream(sid) {
    const requestId = sessionActiveRequest[sid];
    if (!requestId) return false;
    const buffer = streamBuffers[requestId];
    if (!buffer) return false;

    // If the buffered stream already finished, the assistant reply is already
    // persisted and rendered by loadHistory — re-attaching would duplicate it.
    // Just clean up the buffer/cursor and rely on history.
    const finished = buffer.items.some(
        it => it.type === 'done' || it.type === 'error'
    );
    if (finished) {
        const oldEs = activeStreams[requestId];
        if (oldEs) { try { oldEs.close(); } catch (_) {} delete activeStreams[requestId]; }
        delete streamBuffers[requestId];
        delete sessionActiveRequest[sid];
        resetSendBtnSendMode();
        return false;
    }

    // Stop the background stream so the rebuilt one is the sole consumer of
    // the backend queue (the queue survives until "done", so the new
    // connection picks up any remaining events).
    const oldEs = activeStreams[requestId];
    if (oldEs) { try { oldEs.close(); } catch (_) {} delete activeStreams[requestId]; }

    // Snapshot the buffered events into the replay, then start a fresh stream
    // that replays them and reconnects for the live tail.
    const replay = buffer.items.slice();
    startSSE(requestId, null, buffer.timestamp || new Date(), null, replay);
    return true;
}

function switchSession(newSessionId) {
    if (newSessionId === sessionId) {
        if (currentView !== 'chat') navigateTo('chat');
        return;
    }

    // Do NOT close active streams here: sessions run in parallel, so any
    // in-flight reply for another session must keep streaming in the
    // background (it self-guards against rendering into the foreign view).
    // Switching back re-attaches and resumes live streaming.

    sessionId = newSessionId;
    updateEditButtonsState();
    localStorage.setItem(SESSION_ID_KEY, sessionId);

    historyPage = 0;
    historyHasMore = false;
    historyLoading = false;

    messagesDiv.innerHTML = '';
    loadHistory(1);
    startPolling();

    // Restore the send button to match this session's stream state, and if a
    // reply is still streaming in the background, re-attach to resume showing
    // it live (the user turn itself comes from history above).
    const pendingReq = sessionActiveRequest[sessionId];
    if (pendingReq) {
        setSendBtnCancelMode(pendingReq);
        _reattachStream(sessionId);
    } else {
        resetSendBtnSendMode();
    }

    document.querySelectorAll('.session-item').forEach(el => {
        el.classList.toggle('active', el.dataset.sessionId === sessionId);
    });

    if (_isMobileView()) closeSessionPanel();
    if (currentView !== 'chat') navigateTo('chat');
}

// In-place rename a session title: replace the title <span> with an <input>,
// commit on Enter/blur, cancel on Escape. Persists via PUT /api/sessions/<id>.
function renameSession(sid) {
    const item = document.querySelector(`.session-item[data-session-id="${sid}"]`);
    if (!item) return;
    const titleEl = item.querySelector('.session-title');
    if (!titleEl || item.querySelector('.session-title-input')) return;

    const oldTitle = titleEl.textContent;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'session-title-input';
    input.value = oldTitle;
    input.maxLength = 100;

    // Avoid switching session while interacting with the input
    const stop = e => e.stopPropagation();
    input.addEventListener('click', stop);
    input.addEventListener('mousedown', stop);

    titleEl.replaceWith(input);
    input.focus();
    input.select();

    let done = false;

    const restore = (title) => {
        if (done) return;
        done = true;
        const span = document.createElement('span');
        span.className = 'session-title';
        span.title = title;
        span.textContent = title;
        input.replaceWith(span);
    };

    const commit = () => {
        if (done) return;
        const newTitle = input.value.trim();
        if (!newTitle || newTitle === oldTitle) {
            restore(oldTitle);
            return;
        }
        // Optimistically show the new title, then persist.
        restore(newTitle);
        fetch(`/api/sessions/${encodeURIComponent(sid)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newTitle })
        })
            .then(r => r.json())
            .then(data => {
                if (data.status !== 'success') {
                    // Revert UI on failure
                    const span = item.querySelector('.session-title');
                    if (span) {
                        span.title = oldTitle;
                        span.textContent = oldTitle;
                    }
                }
            })
            .catch(() => {
                const span = item.querySelector('.session-title');
                if (span) {
                    span.title = oldTitle;
                    span.textContent = oldTitle;
                }
            });
    };

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); commit(); }
        else if (e.key === 'Escape') { e.preventDefault(); restore(oldTitle); }
    });
    input.addEventListener('blur', commit);
}

function deleteSession(sid) {
    showConfirmModal(t('delete_session_title'), t('delete_session_confirm'), () => {
        // Before deleting, find the next real session to fall back to when the
        // current one is removed (the sibling item in the list, which is sorted
        // newest-first). Falls back to the welcome screen if none remain.
        const nextSid = sid === sessionId ? _findNextSessionId(sid) : null;

        fetch(`/api/sessions/${encodeURIComponent(sid)}`, { method: 'DELETE' })
            .then(r => r.json())
            .then(data => {
                if (data.status !== 'success') return;
                if (sid !== sessionId) {
                    loadSessionList();
                    return;
                }
                if (nextSid) {
                    // Switch to an existing session; refresh the list afterwards
                    // so the deleted item disappears.
                    switchSession(nextSid);
                    loadSessionList();
                } else {
                    // No other sessions: reset to a fresh empty session without
                    // inserting an optimistic placeholder (it has no backend
                    // record and would be an empty, undeletable item).
                    newChat(false);
                }
            })
            .catch(() => {});
    });
}

// Pick the session to show after deleting `sid` (the current session): prefer
// the next item below it in the list, otherwise the previous one. Returns null
// if no other session exists.
function _findNextSessionId(sid) {
    const items = Array.from(document.querySelectorAll('.session-item[data-session-id]'));
    const idx = items.findIndex(el => el.dataset.sessionId === sid);
    if (idx === -1) {
        const other = items.find(el => el.dataset.sessionId !== sid);
        return other ? other.dataset.sessionId : null;
    }
    const next = items[idx + 1] || items[idx - 1];
    return next ? next.dataset.sessionId : null;
}

function showConfirmModal(title, message, onConfirm) {
    let overlay = document.getElementById('confirm-modal-overlay');
    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.id = 'confirm-modal-overlay';
    overlay.className = 'confirm-overlay';

    const modal = document.createElement('div');
    modal.className = 'confirm-modal';
    modal.innerHTML = `
        <div class="confirm-title">${escapeHtml(title)}</div>
        <div class="confirm-message">${escapeHtml(message)}</div>
        <div class="confirm-actions">
            <button class="confirm-btn confirm-btn-cancel">${t('confirm_cancel')}</button>
            <button class="confirm-btn confirm-btn-ok">${t('confirm_yes')}</button>
        </div>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => overlay.classList.add('visible'));

    const close = () => {
        overlay.classList.remove('visible');
        setTimeout(() => overlay.remove(), 200);
    };

    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    modal.querySelector('.confirm-btn-cancel').addEventListener('click', close);
    modal.querySelector('.confirm-btn-ok').addEventListener('click', () => {
        close();
        onConfirm();
    });
}

function clearContext() {
    fetch(`/api/sessions/${encodeURIComponent(sessionId)}/clear_context`, { method: 'POST' })
        .then(r => r.json())
        .then(data => {
            if (data.status !== 'success') return;
            // Insert a visual divider in the chat
            const divider = document.createElement('div');
            divider.className = 'context-divider';
            divider.innerHTML = `<span>${t('context_cleared')}</span>`;
            messagesDiv.appendChild(divider);
            scrollChatToBottom();
        })
        .catch(() => {});
}

function generateSessionTitle(sid, userMsg, assistantReply) {
    fetch(`/api/sessions/${encodeURIComponent(sid)}/generate_title`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_message: userMsg, assistant_reply: assistantReply }),
    })
        .then(r => r.json())
        .then(data => {
            if (data.status === 'success' && sessionPanelOpen) {
                loadSessionList();
            }
        })
        .catch(() => {});
}

// =====================================================================
// Utilities
// =====================================================================
function formatTime(date) {
    const now = new Date();
    const sameDay = date.getFullYear() === now.getFullYear()
        && date.getMonth() === now.getMonth()
        && date.getDate() === now.getDate();
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (sameDay) return time;
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    if (date.getFullYear() === now.getFullYear()) return `${m}-${d} ${time}`;
    return `${date.getFullYear()}-${m}-${d} ${time}`;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function ChannelsHandler_maskSecret(val) {
    if (!val || val.length <= 8) return val;
    return val.slice(0, 4) + '*'.repeat(val.length - 8) + val.slice(-4);
}

function formatToolArgs(args) {
    if (!args || Object.keys(args).length === 0) return '(none)';
    try {
        return escapeHtml(JSON.stringify(args, null, 2));
    } catch (_) {
        return escapeHtml(String(args));
    }
}

function scrollChatToBottom(force) {
    if (force || _autoScrollEnabled) {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
}

function _updateScrollToBottomBtn() {
    const btn = document.getElementById('scroll-to-bottom-btn');
    if (!btn) return;
    const distFromBottom = messagesDiv.scrollHeight - messagesDiv.scrollTop - messagesDiv.clientHeight;
    btn.classList.toggle('hidden', distFromBottom <= _SCROLL_THRESHOLD);
}

function applyHighlighting(container) {
    const root = container || document;
    setTimeout(() => {
        const hljsLib = getHljs();
        root.querySelectorAll('pre code').forEach(block => {
            if (!block.classList.contains('hljs')) {
                hljsLib.highlightElement(block);
            }
        });
        // Add language labels and copy buttons to code blocks
        _addCodeBlockHeaders(root);
    }, 0);
}

// =====================================================================
// Config View
// =====================================================================
let configProviders = {};
let configApiBases = {};
let configApiKeys = {};
let configCurrentModel = '';
let cfgProviderValue = '';
let cfgModelValue = '';

// --- Custom dropdown helper ---
function initDropdown(el, options, selectedValue, onChange, opts) {
    // opts.placeholder: when set AND selectedValue is empty, render that text
    // in a dim style instead of auto-selecting options[0]. Useful for
    // "pick or empty" capabilities (asr / embedding) where we want the
    // user to make an explicit choice.
    opts = opts || {};
    const textEl = el.querySelector('.cfg-dropdown-text');
    const menuEl = el.querySelector('.cfg-dropdown-menu');
    const selEl = el.querySelector('.cfg-dropdown-selected');

    el._ddValue = selectedValue || '';
    el._ddOnChange = onChange;

    function render() {
        menuEl.innerHTML = '';
        options.forEach(opt => {
            const item = document.createElement('div');
            item.className = 'cfg-dropdown-item' + (opt.value === el._ddValue ? ' active' : '');
            item.dataset.value = opt.value;
            // Hint is an optional dim secondary label rendered on the right
            // side of the row (e.g. friendly brand name next to a technical
            // model id). When absent the row degrades to the original
            // single-string layout.
            if (opt.hint) {
                const labelEl = document.createElement('span');
                labelEl.className = 'cfg-dropdown-label';
                labelEl.textContent = opt.label;
                const hintEl = document.createElement('span');
                hintEl.className = 'cfg-dropdown-hint';
                hintEl.textContent = opt.hint;
                item.appendChild(labelEl);
                item.appendChild(hintEl);
            } else {
                item.textContent = opt.label;
            }
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                el._ddValue = opt.value;
                textEl.textContent = opt.label;
                menuEl.querySelectorAll('.cfg-dropdown-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                el.classList.remove('open');
                if (el._ddOnChange) el._ddOnChange(opt.value);
            });
            menuEl.appendChild(item);
        });
        const sel = options.find(o => o.value === el._ddValue);
        if (sel) {
            textEl.textContent = sel.label;
            textEl.classList.remove('text-slate-400', 'dark:text-slate-500');
        } else if (opts.placeholder && !el._ddValue) {
            // No selection yet — show the placeholder in muted style.
            // Do NOT write a fallback value, so the dropdown stays
            // "unsaved" until the user explicitly picks.
            textEl.textContent = opts.placeholder;
            textEl.classList.add('text-slate-400', 'dark:text-slate-500');
        } else {
            textEl.textContent = options[0] ? options[0].label : '--';
            textEl.classList.remove('text-slate-400', 'dark:text-slate-500');
            if (options[0]) el._ddValue = options[0].value;
        }
    }

    render();

    if (!el._ddBound) {
        selEl.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.cfg-dropdown.open').forEach(d => { if (d !== el) d.classList.remove('open'); });
            el.classList.toggle('open');
        });
        el._ddBound = true;
    }
}

document.addEventListener('click', () => {
    document.querySelectorAll('.cfg-dropdown.open').forEach(d => d.classList.remove('open'));
});

function getDropdownValue(el) { return el._ddValue || ''; }

// --- Config init ---
function initConfigView(data) {
    configProviders = data.providers || {};
    configApiBases = data.api_bases || {};
    configApiKeys = data.api_keys || {};
    configCurrentModel = data.model || '';

    const providerEl = document.getElementById('cfg-provider');
    const providerOpts = Object.entries(configProviders).map(([pid, p]) => ({ value: pid, label: localizedLabel(p.label) }));

    // if use_linkai is enabled, always select linkai as the provider
    // Otherwise prefer bot_type from config, fall back to model-based detection
    const detected = data.use_linkai ? 'linkai'
        : (data.bot_type && configProviders[data.bot_type] ? data.bot_type : detectProvider(configCurrentModel));
    cfgProviderValue = detected || (providerOpts[0] ? providerOpts[0].value : '');

    initDropdown(providerEl, providerOpts, cfgProviderValue, onProviderChange);

    onProviderChange(cfgProviderValue);
    syncModelSelection(configCurrentModel);

    document.getElementById('cfg-max-tokens').value = data.agent_max_context_tokens || 50000;
    document.getElementById('cfg-max-turns').value = data.agent_max_context_turns || 20;
    document.getElementById('cfg-max-steps').value = data.agent_max_steps || 20;
    document.getElementById('cfg-enable-thinking').checked = data.enable_thinking === true;
    document.getElementById('cfg-self-evolution').checked = data.self_evolution_enabled === true;

    // Reflect the current UI language (already resolved, may include the user's
    // local choice) on the selector so it stays in sync with the top-right toggle.
    const langSel = document.getElementById('cfg-lang-select');
    if (langSel) {
        initDropdown(
            langSel,
            [{ value: 'zh', label: '简体中文' }, { value: 'zh-Hant', label: '繁體中文' }, { value: 'en', label: 'English' }],
            currentLang,
            (val) => setLanguage(val)
        );
    }

    const pwdInput = document.getElementById('cfg-password');
    const maskedPwd = data.web_password_masked || '';
    pwdInput.value = maskedPwd;
    pwdInput.dataset.masked = maskedPwd ? '1' : '';
    pwdInput.dataset.maskedVal = maskedPwd;
    pwdInput.classList.toggle('cfg-key-masked', !!maskedPwd);

    if (maskedPwd) {
        pwdInput.placeholder = '••••••••';
    } else {
        pwdInput.placeholder = '';
    }

    if (!pwdInput._cfgBound) {
        pwdInput.addEventListener('focus', function() {
            if (this.dataset.masked === '1') {
                this.value = '';
                this.dataset.masked = '';
                this.classList.remove('cfg-key-masked');
            }
        });
        pwdInput.addEventListener('input', function() {
            this.dataset.masked = '';
        });
        pwdInput._cfgBound = true;
    }
}

function detectProvider(model) {
    if (!model) return Object.keys(configProviders)[0] || '';
    for (const [pid, p] of Object.entries(configProviders)) {
        if (pid === 'linkai') continue;
        if (p.models && p.models.includes(model)) return pid;
    }
    return Object.keys(configProviders)[0] || '';
}

function onProviderChange(pid) {
    cfgProviderValue = pid || getDropdownValue(document.getElementById('cfg-provider'));
    const p = configProviders[cfgProviderValue];
    if (!p) return;

    const customTip = document.getElementById('cfg-custom-tip');
    if (customTip) customTip.classList.toggle('hidden', cfgProviderValue !== 'custom');

    const modelEl = document.getElementById('cfg-model-select');
    const modelOpts = (p.models || []).map(m => ({ value: m, label: m }));
    modelOpts.push({ value: '__custom__', label: t('config_custom_option') });

    initDropdown(modelEl, modelOpts, modelOpts[0] ? modelOpts[0].value : '', onModelSelectChange);

    // API Key
    const keyField = p.api_key_field;
    const keyWrap = document.getElementById('cfg-api-key-wrap');
    const keyInput = document.getElementById('cfg-api-key');
    if (keyField) {
        keyWrap.classList.remove('hidden');
        keyInput.classList.add('cfg-key-masked');
        const maskedVal = configApiKeys[keyField] || '';
        keyInput.value = maskedVal;
        keyInput.dataset.field = keyField;
        keyInput.dataset.masked = maskedVal ? '1' : '';
        keyInput.dataset.maskedVal = maskedVal;
        const toggleIcon = document.querySelector('#cfg-api-key-toggle i');
        if (toggleIcon) toggleIcon.className = 'fas fa-eye text-xs';

        if (!keyInput._cfgBound) {
            keyInput.addEventListener('focus', function() {
                if (this.dataset.masked === '1') {
                    this.value = '';
                    this.dataset.masked = '';
                    this.classList.remove('cfg-key-masked');
                }
            });
            keyInput.addEventListener('blur', function() {
                if (!this.value.trim() && this.dataset.maskedVal) {
                    this.value = this.dataset.maskedVal;
                    this.dataset.masked = '1';
                    this.classList.add('cfg-key-masked');
                }
            });
            keyInput.addEventListener('input', function() {
                this.dataset.masked = '';
            });
            keyInput._cfgBound = true;
        }
    } else {
        keyWrap.classList.add('hidden');
        keyInput.value = '';
        keyInput.dataset.field = '';
    }

    // API Base
    const apiBaseInput = document.getElementById('cfg-api-base');
    if (p.api_base_key) {
        document.getElementById('cfg-api-base-wrap').classList.remove('hidden');
        apiBaseInput.value = configApiBases[p.api_base_key] || p.api_base_default || '';
        // Hint the version-path tail (e.g. /v1) so users are reminded to
        // include it themselves. We don't auto-rewrite anything server-side.
        apiBaseInput.placeholder = p.api_base_placeholder || 'https://...';
    } else {
        document.getElementById('cfg-api-base-wrap').classList.add('hidden');
        apiBaseInput.value = '';
        apiBaseInput.placeholder = 'https://...';
    }

    onModelSelectChange(modelOpts[0] ? modelOpts[0].value : '');
}

function onModelSelectChange(val) {
    cfgModelValue = val || getDropdownValue(document.getElementById('cfg-model-select'));
    const customWrap = document.getElementById('cfg-model-custom-wrap');
    if (cfgModelValue === '__custom__') {
        customWrap.classList.remove('hidden');
        document.getElementById('cfg-model-custom').focus();
    } else {
        customWrap.classList.add('hidden');
        document.getElementById('cfg-model-custom').value = '';
    }
}

function syncModelSelection(model) {
    const p = configProviders[cfgProviderValue];
    if (!p) return;

    const modelEl = document.getElementById('cfg-model-select');
    if (p.models && p.models.includes(model)) {
        const modelOpts = (p.models || []).map(m => ({ value: m, label: m }));
        modelOpts.push({ value: '__custom__', label: t('config_custom_option') });
        initDropdown(modelEl, modelOpts, model, onModelSelectChange);
        cfgModelValue = model;
        document.getElementById('cfg-model-custom-wrap').classList.add('hidden');
    } else {
        cfgModelValue = '__custom__';
        const modelOpts = (p.models || []).map(m => ({ value: m, label: m }));
        modelOpts.push({ value: '__custom__', label: t('config_custom_option') });
        initDropdown(modelEl, modelOpts, '__custom__', onModelSelectChange);
        document.getElementById('cfg-model-custom-wrap').classList.remove('hidden');
        document.getElementById('cfg-model-custom').value = model;
    }
}

function getSelectedModel() {
    if (cfgModelValue === '__custom__') {
        return document.getElementById('cfg-model-custom').value.trim();
    }
    return cfgModelValue;
}

function toggleApiKeyVisibility() {
    const input = document.getElementById('cfg-api-key');
    const icon = document.querySelector('#cfg-api-key-toggle i');
    if (input.classList.contains('cfg-key-masked')) {
        input.classList.remove('cfg-key-masked');
        icon.className = 'fas fa-eye-slash text-xs';
    } else {
        input.classList.add('cfg-key-masked');
        icon.className = 'fas fa-eye text-xs';
    }
}

function showStatus(elId, msgKey, isError) {
    const el = document.getElementById(elId);
    el.textContent = t(msgKey);
    el.classList.toggle('text-red-500', !!isError);
    el.classList.toggle('text-primary-500', !isError);
    el.classList.remove('opacity-0');
    // Warning messages (errors) should stay visible, success messages auto-hide
    if (!isError) {
        setTimeout(() => el.classList.add('opacity-0'), 2500);
    }
}

function saveModelConfig() {
    const model = getSelectedModel();
    if (!model) return;

    const updates = { model: model };
    const p = configProviders[cfgProviderValue];
    updates.use_linkai = (cfgProviderValue === 'linkai');
    if (cfgProviderValue === 'linkai') {
        updates.bot_type = '';
    } else {
        updates.bot_type = cfgProviderValue;
    }
    if (p && p.api_base_key) {
        const base = document.getElementById('cfg-api-base').value.trim();
        if (base) updates[p.api_base_key] = base;
    }
    if (p && p.api_key_field) {
        const keyInput = document.getElementById('cfg-api-key');
        const rawVal = keyInput.value.trim();
        if (rawVal && keyInput.dataset.masked !== '1') {
            updates[p.api_key_field] = rawVal;
        }
    }

    const btn = document.getElementById('cfg-model-save');
    btn.disabled = true;
    fetch('/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === 'success') {
            configCurrentModel = model;
            if (data.applied) {
                const keyInput = document.getElementById('cfg-api-key');
                Object.entries(data.applied).forEach(([k, v]) => {
                    if (k === 'model') return;
                    if (k.includes('api_key')) {
                        const masked = v.length > 8
                            ? v.substring(0, 4) + '*'.repeat(v.length - 8) + v.substring(v.length - 4)
                            : v;
                        configApiKeys[k] = masked;
                        if (keyInput.dataset.field === k) {
                            keyInput.value = masked;
                            keyInput.dataset.masked = '1';
                            keyInput.dataset.maskedVal = masked;
                            keyInput.classList.add('cfg-key-masked');
                            const toggleIcon = document.querySelector('#cfg-api-key-toggle i');
                            if (toggleIcon) toggleIcon.className = 'fas fa-eye text-xs';
                        }
                    } else {
                        configApiBases[k] = v;
                    }
                });
            }
            showStatus('cfg-model-status', 'config_saved', false);
        } else {
            showStatus('cfg-model-status', 'config_save_error', true);
        }
    })
    .catch(() => showStatus('cfg-model-status', 'config_save_error', true))
    .finally(() => { btn.disabled = false; });
}

function saveAgentConfig() {
    const updates = {
        agent_max_context_tokens: parseInt(document.getElementById('cfg-max-tokens').value) || 50000,
        agent_max_context_turns: parseInt(document.getElementById('cfg-max-turns').value) || 20,
        agent_max_steps: parseInt(document.getElementById('cfg-max-steps').value) || 20,
        enable_thinking: document.getElementById('cfg-enable-thinking').checked,
        self_evolution_enabled: document.getElementById('cfg-self-evolution').checked,
    };

    const btn = document.getElementById('cfg-agent-save');
    btn.disabled = true;
    fetch('/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === 'success') {
            showStatus('cfg-agent-status', 'config_saved', false);
        } else {
            showStatus('cfg-agent-status', 'config_save_error', true);
        }
    })
    .catch(() => showStatus('cfg-agent-status', 'config_save_error', true))
    .finally(() => { btn.disabled = false; });
}

function savePasswordConfig() {
    const input = document.getElementById('cfg-password');
    if (input.dataset.masked === '1') {
        showStatus('cfg-password-status', 'config_saved', false);
        return;
    }
    const newPwd = input.value.trim();
    const btn = document.getElementById('cfg-password-save');
    btn.disabled = true;
    fetch('/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: { web_password: newPwd } })
    })
    .then(r => r.json())
    .then(data => {
        console.log('[Password Config] Response:', data); // Debug
        if (data.status === 'success') {
            if (newPwd) {
                showStatus('cfg-password-status', 'config_password_changed', false);
                // Mark as masked so user needs to re-enter to change again
                input.dataset.masked = '1';
                input.dataset.maskedVal = newPwd;
                input.value = '••••••••';
                input.classList.add('cfg-key-masked');
                
                // Show logout button since password is now enabled
                const logoutBtn = document.getElementById('logout-btn-header');
                if (logoutBtn) logoutBtn.classList.remove('hidden');
            } else {
                input.dataset.masked = '';
                input.dataset.maskedVal = '';
                input.classList.remove('cfg-key-masked');
                
                // Show security warning if password was cleared with public host
                if (data.warning === 'password_cleared_with_public_host') {
                    showStatus('cfg-password-status', 'config_password_security_warning', true);
                } else {
                    showStatus('cfg-password-status', 'config_password_cleared', false);
                }
                
                const logoutBtn = document.getElementById('logout-btn-header');
                if (logoutBtn) logoutBtn.classList.add('hidden');
            }
        } else {
            showStatus('cfg-password-status', 'config_save_error', true);
        }
    })
    .catch(() => showStatus('cfg-password-status', 'config_save_error', true))
    .finally(() => { btn.disabled = false; });
}

function loadConfigView() {
    fetch('/config').then(r => r.json()).then(data => {
        if (data.status !== 'success') return;
        appConfig = data;
        initConfigView(data);
    }).catch(() => {});
}

// =====================================================================
// Skills View
// =====================================================================
let toolsLoaded = false;

const TOOL_ICONS = {
    bash: 'fa-terminal',
    edit: 'fa-pen-to-square',
    read: 'fa-file-lines',
    write: 'fa-file-pen',
    ls: 'fa-folder-open',
    send: 'fa-paper-plane',
    web_search: 'fa-magnifying-glass',
    browser: 'fa-globe',
    env_config: 'fa-key',
    scheduler: 'fa-clock',
    memory_get: 'fa-brain',
    memory_search: 'fa-brain',
};

function getToolIcon(name) {
    return TOOL_ICONS[name] || 'fa-wrench';
}

function loadSkillsView() {
    loadToolsSection();
    loadSkillsSection();
}

function loadToolsSection() {
    if (toolsLoaded) return;
    const emptyEl = document.getElementById('tools-empty');
    const listEl = document.getElementById('tools-list');
    const badge = document.getElementById('tools-count-badge');

    fetch('/api/tools').then(r => r.json()).then(data => {
        if (data.status !== 'success') return;
        const tools = data.tools || [];
        emptyEl.classList.add('hidden');
        if (tools.length === 0) {
            emptyEl.classList.remove('hidden');
            emptyEl.innerHTML = `<span class="text-sm text-slate-400 dark:text-slate-500">${currentLang === 'zh' ? '暂无内置工具' : 'No built-in tools'}</span>`;
            return;
        }
        badge.textContent = tools.length;
        badge.classList.remove('hidden');
        listEl.innerHTML = '';
        tools.forEach(tool => {
            const card = document.createElement('div');
            card.className = 'bg-white dark:bg-[#1A1A1A] rounded-xl border border-slate-200 dark:border-white/10 p-4 flex items-start gap-3';
            card.innerHTML = `
                <div class="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                    <i class="fas ${getToolIcon(tool.name)} text-blue-500 dark:text-blue-400 text-sm"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                        <span class="font-medium text-sm text-slate-700 dark:text-slate-200 font-mono">${escapeHtml(tool.name)}</span>
                    </div>
                    <p class="text-xs text-slate-400 dark:text-slate-500 mt-1 line-clamp-2">${escapeHtml(tool.description || '--')}</p>
                </div>`;
            listEl.appendChild(card);
        });
        listEl.classList.remove('hidden');
        toolsLoaded = true;
    }).catch(() => {
        emptyEl.classList.remove('hidden');
        emptyEl.innerHTML = `<span class="text-sm text-slate-400 dark:text-slate-500">${currentLang === 'zh' ? '加载失败' : 'Failed to load'}</span>`;
    });
}

function loadSkillsSection() {
    const emptyEl = document.getElementById('skills-empty');
    const listEl = document.getElementById('skills-list');
    const badge = document.getElementById('skills-count-badge');

    fetch('/api/skills').then(r => r.json()).then(data => {
        if (data.status !== 'success') return;
        const skills = data.skills || [];
        if (skills.length === 0) {
            const p = emptyEl.querySelector('p');
            if (p) p.textContent = currentLang === 'zh' ? '暂无技能' : 'No skills found';
            return;
        }
        badge.textContent = skills.length;
        badge.classList.remove('hidden');
        emptyEl.classList.add('hidden');
        listEl.innerHTML = '';

        skills.forEach(sk => {
            const card = document.createElement('div');
            card.className = 'bg-white dark:bg-[#1A1A1A] rounded-xl border border-slate-200 dark:border-white/10 p-4 flex items-start gap-3 transition-opacity';
            card.dataset.skillName = sk.name;
            card.dataset.skillDesc = sk.description || '';
            card.dataset.enabled = sk.enabled ? '1' : '0';
            renderSkillCard(card, sk);
            listEl.appendChild(card);
        });
    }).catch(() => {});
}

function renderSkillCard(card, sk) {
    const enabled = sk.enabled;
    const iconColor = enabled ? 'text-primary-400' : 'text-slate-300 dark:text-slate-600';
    const trackClass = enabled
        ? 'bg-primary-400'
        : 'bg-slate-200 dark:bg-slate-700';
    const thumbTranslate = enabled ? 'translate-x-3' : 'translate-x-0.5';
    card.innerHTML = `
        <div class="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
            <i class="fas fa-bolt ${iconColor} text-sm"></i>
        </div>
        <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
                <span class="font-medium text-sm text-slate-700 dark:text-slate-200 truncate flex-1">${escapeHtml(sk.display_name || sk.name)}</span>
                <button
                    role="switch"
                    aria-checked="${enabled}"
                    onclick="toggleSkill('${escapeHtml(sk.name)}', ${enabled})"
                    class="relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${trackClass}"
                    title="${enabled ? (currentLang === 'zh' ? '点击禁用' : 'Click to disable') : (currentLang === 'zh' ? '点击启用' : 'Click to enable')}"
                >
                    <span class="inline-block h-3 w-3 mt-0.5 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out ${thumbTranslate}"></span>
                </button>
            </div>
            <p class="text-xs text-slate-400 dark:text-slate-500 line-clamp-2">${escapeHtml(sk.description || '--')}</p>
        </div>`;
}

function toggleSkill(name, currentlyEnabled) {
    const action = currentlyEnabled ? 'close' : 'open';
    const card = document.querySelector(`[data-skill-name="${CSS.escape(name)}"]`);
    if (card) card.style.opacity = '0.5';

    fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, name })
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === 'success') {
            if (card) {
                const desc = card.dataset.skillDesc || '';
                card.dataset.enabled = currentlyEnabled ? '0' : '1';
                card.style.opacity = '1';
                renderSkillCard(card, { name, description: desc, enabled: !currentlyEnabled });
            }
        } else {
            if (card) card.style.opacity = '1';
            alert(currentLang === 'zh' ? '操作失败，请稍后再试' : 'Operation failed, please try again');
        }
    })
    .catch(() => {
        if (card) card.style.opacity = '1';
        alert(currentLang === 'zh' ? '操作失败，请稍后再试' : 'Operation failed, please try again');
    });
}

// =====================================================================
// Memory View
// =====================================================================
let memoryPage = 1;
let memoryCategory = 'memory';   // 'memory' | 'evolution'
const memoryPageSize = 10;

function switchMemoryTab(tab) {
    document.querySelectorAll('.memory-tab').forEach(el => el.classList.remove('active'));
    document.getElementById('memory-tab-' + tab).classList.add('active');
    // The "dreams" tab now surfaces self-evolution logs (merged with dream diaries).
    memoryCategory = tab === 'dreams' ? 'evolution' : 'memory';
    loadMemoryView(1);
}

function loadMemoryView(page) {
    page = page || 1;
    memoryPage = page;
    fetch(`/api/memory?page=${page}&page_size=${memoryPageSize}&category=${memoryCategory}`).then(r => r.json()).then(data => {
        if (data.status !== 'success') return;
        const emptyEl = document.getElementById('memory-empty');
        const listEl = document.getElementById('memory-list');
        const files = data.list || [];
        const total = data.total || 0;

        if (total === 0) {
            const emptyIcon = emptyEl.querySelector('i');
            const emptyTitle = emptyEl.querySelector('p');
            if (memoryCategory === 'evolution') {
                emptyIcon.className = 'fas fa-seedling text-emerald-400 text-xl';
                emptyTitle.textContent = currentLang === 'zh' ? '暂无进化记录' : 'No evolution records yet';
            } else {
                emptyIcon.className = 'fas fa-brain text-purple-400 text-xl';
                emptyTitle.textContent = currentLang === 'zh' ? '暂无记忆文件' : 'No memory files';
            }
            emptyEl.classList.remove('hidden');
            listEl.classList.add('hidden');
            return;
        }
        emptyEl.classList.add('hidden');
        listEl.classList.remove('hidden');

        const tbody = document.getElementById('memory-table-body');
        tbody.innerHTML = '';
        files.forEach(f => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors';
            // In the merged evolution tab, resolve each file by its own origin
            // (evolution logs vs dream diaries live in different dirs).
            const fileCategory = (f.type === 'dream' || f.type === 'evolution') ? f.type : memoryCategory;
            tr.onclick = () => openMemoryFile(f.filename, fileCategory);
            let typeLabel;
            if (f.type === 'global') {
                typeLabel = '<span class="px-2 py-0.5 rounded-full text-xs bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">Global</span>';
            } else if (f.type === 'evolution') {
                typeLabel = '<span class="px-2 py-0.5 rounded-full text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">Evolution</span>';
            } else if (f.type === 'dream') {
                typeLabel = '<span class="px-2 py-0.5 rounded-full text-xs bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">Dream</span>';
            } else {
                typeLabel = '<span class="px-2 py-0.5 rounded-full text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">Daily</span>';
            }
            const sizeStr = f.size < 1024 ? f.size + ' B' : (f.size / 1024).toFixed(1) + ' KB';
            tr.innerHTML = `
                <td class="px-4 py-3 text-sm font-mono text-slate-700 dark:text-slate-200">${escapeHtml(f.filename)}</td>
                <td class="px-4 py-3 text-sm">${typeLabel}</td>
                <td class="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">${sizeStr}</td>
                <td class="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">${escapeHtml(f.updated_at)}</td>`;
            tbody.appendChild(tr);
        });

        // Pagination
        const totalPages = Math.ceil(total / memoryPageSize);
        const pagEl = document.getElementById('memory-pagination');
        if (totalPages <= 1) { pagEl.innerHTML = ''; return; }
        let pagHtml = `<span>${page} / ${totalPages}</span><div class="flex gap-2">`;
        if (page > 1) pagHtml += `<button onclick="loadMemoryView(${page - 1})" class="px-3 py-1 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-xs">Prev</button>`;
        if (page < totalPages) pagHtml += `<button onclick="loadMemoryView(${page + 1})" class="px-3 py-1 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-xs">Next</button>`;
        pagHtml += '</div>';
        pagEl.innerHTML = pagHtml;
    }).catch(() => {});
}

function openMemoryFile(filename, category) {
    category = category || 'memory';
    fetch(`/api/memory/content?filename=${encodeURIComponent(filename)}&category=${category}`).then(r => r.json()).then(data => {
        if (data.status !== 'success') return;
        document.getElementById('memory-panel-list').classList.add('hidden');
        const panel = document.getElementById('memory-panel-viewer');
        document.getElementById('memory-viewer-title').textContent = filename;
        document.getElementById('memory-viewer-content').innerHTML = renderMarkdown(data.content || '');
        panel.classList.remove('hidden');
        applyHighlighting(panel);
    }).catch(() => {});
}

function closeMemoryViewer() {
    document.getElementById('memory-panel-viewer').classList.add('hidden');
    document.getElementById('memory-panel-list').classList.remove('hidden');
}

// =====================================================================
// Custom Confirm Dialog
// =====================================================================
function showConfirmDialog({ title, message, okText, cancelText, onConfirm, hideCancel }) {
    const overlay = document.getElementById('confirm-dialog-overlay');
    document.getElementById('confirm-dialog-title').textContent = title || '';
    document.getElementById('confirm-dialog-message').textContent = message || '';
    document.getElementById('confirm-dialog-ok').textContent = okText || 'OK';
    const cancelBtn = document.getElementById('confirm-dialog-cancel');
    cancelBtn.textContent = cancelText || t('channels_cancel');
    cancelBtn.classList.toggle('hidden', !!hideCancel);

    function cleanup() {
        overlay.classList.add('hidden');
        okBtn.removeEventListener('click', onOk);
        cancelBtn.removeEventListener('click', onCancel);
        overlay.removeEventListener('click', onOverlayClick);
    }
    function onOk() { cleanup(); if (onConfirm) onConfirm(); }
    function onCancel() { cleanup(); }
    function onOverlayClick(e) { if (e.target === overlay) cleanup(); }

    const okBtn = document.getElementById('confirm-dialog-ok');
    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    overlay.addEventListener('click', onOverlayClick);
    overlay.classList.remove('hidden');
}

// =====================================================================
// Models View
// =====================================================================
// Capability cards rendered on the Models page. Order matters — main model
// comes first because it transitively decides defaults for vision and image.
// Icon palette is grouped by capability family:
//   - chat                       → primary (brand green; the "main" capability)
//   - vision + image             → blue    (everything visual)
//   - asr + tts                  → amber   (everything audio)
//   - embedding                  → purple  (vectors)
//   - search                     → orange  (retrieval)
// Each card uses an explicit `iconClass` string so Tailwind's CDN JIT can
// see the literal class names — dynamic `bg-${color}-50` strings would not
// be picked up reliably.
const MODELS_CAPABILITY_DEFS = [
    { id: 'chat',      icon: 'fa-microchip',        editable: true,  needsModel: true,  titleKey: 'models_capability_chat',      descKey: 'models_capability_chat_desc',
      iconChip: 'bg-primary-50 dark:bg-primary-900/30',  iconGlyph: 'text-primary-500' },
    { id: 'vision',    icon: 'fa-eye',              editable: true,  needsModel: true,  titleKey: 'models_capability_vision',    descKey: 'models_capability_vision_desc',
      iconChip: 'bg-blue-50 dark:bg-blue-900/30',        iconGlyph: 'text-blue-500' },
    { id: 'image',     icon: 'fa-image',            editable: true,  needsModel: true,  titleKey: 'models_capability_image',     descKey: 'models_capability_image_desc',
      iconChip: 'bg-blue-50 dark:bg-blue-900/30',        iconGlyph: 'text-blue-500' },
    { id: 'asr',       icon: 'fa-microphone',       editable: true,  needsModel: true,  titleKey: 'models_capability_asr',       descKey: 'models_capability_asr_desc',
      iconChip: 'bg-amber-50 dark:bg-amber-900/30',      iconGlyph: 'text-amber-500' },
    { id: 'tts',       icon: 'fa-volume-high',      editable: true,  needsModel: true,  titleKey: 'models_capability_tts',       descKey: 'models_capability_tts_desc',
      iconChip: 'bg-amber-50 dark:bg-amber-900/30',      iconGlyph: 'text-amber-500' },
    { id: 'embedding', icon: 'fa-vector-square',    editable: true,  needsModel: true,  titleKey: 'models_capability_embedding', descKey: 'models_capability_embedding_desc',
      iconChip: 'bg-purple-50 dark:bg-purple-900/30',    iconGlyph: 'text-purple-500' },
    { id: 'search',    icon: 'fa-magnifying-glass', editable: true,  needsModel: false, titleKey: 'models_capability_search',    descKey: 'models_capability_search_desc',
      iconChip: 'bg-orange-50 dark:bg-orange-900/30',    iconGlyph: 'text-orange-500' },
];

// Provider logos: when a real SVG exists under static/logos/<id>.svg we use
// it; otherwise we fall back to a neutral monogram chip. SVGs are fetched
// via <img> with a hidden onerror so layout stays stable when files are
// absent. Vendors whose mark is rendered in pure (or near-pure) black are
// listed in MODELS_PROVIDER_LOGO_DARK_INVERT — for those, we apply a CSS
// invert filter in dark mode so the glyph stays visible against #1A1A1A.
const MODELS_PROVIDER_LOGO_PATH = 'assets/logos';
const MODELS_PROVIDER_LOGO_DARK_INVERT = new Set([
    'openai',     // black wordmark
    'moonshot',   // dark monogram
    'zhipu',      // dark monogram
    'custom',     // single-color slider glyph
]);

let modelsState = { providers: [], capabilities: {} };

// One-shot: { capabilityId, providerId } stashed before a Models reload,
// consumed by renderCapabilityBody to preselect a just-configured vendor.
let pendingCapabilitySelection = null;

// `opts.preserveScroll` keeps the page's vertical scroll position across the
// refresh. We capture it before unhiding the loading skeleton (which collapses
// content height to zero) and restore it after the new content is mounted.
// This matters when the user configures a vendor from inside a capability
// card's dropdown — without preservation, the post-save reload bounces them
// back to the top of the page, away from the card they were configuring.
function loadModelsView(opts) {
    const loading = document.getElementById('models-loading');
    const content = document.getElementById('models-content');
    if (!loading || !content) return;
    const preserveScroll = !!(opts && opts.preserveScroll);
    // The Models pane has its own scrollable container; capture its position
    // (not window.scrollY) so we can put the user back exactly where they were.
    const scroller = document.querySelector('#view-models .overflow-y-auto');
    const savedTop = preserveScroll && scroller ? scroller.scrollTop : null;

    loading.classList.remove('hidden');
    content.classList.add('hidden');

    fetch('/api/models').then(r => r.json()).then(data => {
        if (data.status !== 'success') {
            loading.innerHTML = `<span class="text-sm text-red-400">${escapeHtml(data.message || 'Failed to load')}</span>`;
            return;
        }
        modelsState.providers = data.providers || [];
        modelsState.capabilities = data.capabilities || {};
        renderModelsView();
        loading.classList.add('hidden');
        content.classList.remove('hidden');
        if (savedTop !== null && scroller) {
            // Wait one frame for the new layout to settle, otherwise the
            // restored scrollTop snaps to the previous (smaller) max.
            requestAnimationFrame(() => { scroller.scrollTop = savedTop; });
        }
    }).catch(err => {
        loading.innerHTML = `<span class="text-sm text-red-400">${escapeHtml(String(err))}</span>`;
    });
}

function renderModelsView() {
    const container = document.getElementById('models-content');
    container.innerHTML = '';
    container.appendChild(renderVendorsSection());
    MODELS_CAPABILITY_DEFS.forEach(def => container.appendChild(renderCapabilityCard(def)));
}

// True when a provider card is one of the expanded custom (OpenAI-compatible)
// providers (id "custom:<id>") — shown in the vendor grid alongside built-in
// vendors, but edited via the dedicated custom-provider modal.
function isCustomProviderCard(p) {
    return !!(p && p.is_custom && p.custom_name);
}

// ---------- Vendor section (Layer 1) -----------------------------------

function renderVendorsSection() {
    const wrap = document.createElement('div');
    wrap.className = 'bg-white dark:bg-[#1A1A1A] rounded-xl border border-slate-200 dark:border-white/10 p-6';

    // Custom providers always show once created (even without an api key,
    // e.g. a local vLLM/Ollama endpoint); built-in vendors show when configured.
    const configured = modelsState.providers.filter(p => p.configured || isCustomProviderCard(p));

    const header = `
        <div class="flex items-start gap-3 mb-5">
            <div class="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <i class="fas fa-key text-primary-500 text-sm"></i>
            </div>
            <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-slate-800 dark:text-slate-100">${t('models_section_vendors')}</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${t('models_section_vendors_desc')}</p>
            </div>
        </div>`;

    let body;
    if (configured.length === 0) {
        body = `
            <div class="flex flex-col items-center justify-center py-8 px-4 rounded-lg border border-dashed border-slate-200 dark:border-white/10">
                <p class="text-sm text-slate-500 dark:text-slate-400 text-center">${t('models_not_configured')}</p>
                <button onclick="openVendorModal('')"
                        class="mt-3 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/50 cursor-pointer transition-colors">
                    <i class="fas fa-plus text-[10px] mr-1"></i>${t('models_add_vendor')}
                </button>
            </div>`;
    } else {
        body = `<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            ${configured.map(renderVendorChip).join('')}
        </div>`;
    }

    wrap.innerHTML = header + body;
    return wrap;
}

function renderVendorChip(p) {
    // The masked API key is intentionally not surfaced here; it is shown
    // inside the edit modal so the chip stays uncluttered and scannable.
    // Custom providers open their dedicated modal (name + base + key);
    // their ids are server-generated hex, safe to inline.
    const onclick = isCustomProviderCard(p)
        ? `openCustomProviderModal('${escapeHtml(p.custom_id)}')`
        : `openVendorModal('${escapeHtml(p.id)}')`;
    return `
        <button onclick="${onclick}"
                class="group flex items-center gap-3 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-white/10
                       bg-slate-50 dark:bg-white/5 hover:border-primary-300 dark:hover:border-primary-500/50
                       cursor-pointer transition-colors duration-150 text-left">
            ${renderProviderLogo(p, 28)}
            <span class="flex-1 min-w-0 text-sm font-medium text-slate-800 dark:text-slate-100 truncate">${escapeHtml(localizedLabel(p.label))}</span>
            <i class="fas fa-pen-to-square text-[11px] text-slate-400 dark:text-slate-500 group-hover:text-primary-500 transition-colors"></i>
        </button>`;
}

// Render a uniformly-styled logo for a provider. Tries an SVG asset first; if
// it 404s the <img> swaps itself for a monogram fallback via onerror.
function renderProviderLogo(p, sizePx) {
    const initial = (localizedLabel(p.label) || p.id || '?').slice(0, 1).toUpperCase();
    const sz = sizePx || 32;
    const url = `${MODELS_PROVIDER_LOGO_PATH}/${encodeURIComponent(p.id)}.svg`;
    const fallbackId = `pl-${p.id}-${Math.random().toString(36).slice(2, 8)}`;
    const imgClass = MODELS_PROVIDER_LOGO_DARK_INVERT.has(p.id)
        ? 'absolute inset-0 m-auto provider-logo-img provider-logo-invert-dark'
        : 'absolute inset-0 m-auto provider-logo-img';
    return `
        <span class="relative flex items-center justify-center rounded-lg bg-slate-100 dark:bg-white/10
                     text-slate-600 dark:text-slate-300 flex-shrink-0 overflow-hidden"
              style="width:${sz}px;height:${sz}px;">
            <span id="${fallbackId}" class="text-xs font-bold">${escapeHtml(initial)}</span>
            <img src="${url}" alt="" aria-hidden="true"
                 class="${imgClass}"
                 style="width:${Math.round(sz * 0.65)}px;height:${Math.round(sz * 0.65)}px;"
                 onload="(function(el){var f=document.getElementById('${fallbackId}');if(f)f.style.display='none';})(this)"
                 onerror="this.remove();">
        </span>`;
}

function getCustomProviderCards() {
    return modelsState.providers.filter(isCustomProviderCard);
}

// ---------- Capability cards (Layer 2) ---------------------------------

function renderCapabilityCard(def) {
    const cap = modelsState.capabilities[def.id] || {};
    const wrap = document.createElement('div');
    wrap.className = 'bg-white dark:bg-[#1A1A1A] rounded-xl border border-slate-200 dark:border-white/10 p-6';
    wrap.id = `models-card-${def.id}`;

    const headerRight = renderCapabilityHeaderTag(def, cap);

    wrap.innerHTML = `
        <div class="flex items-start gap-3 mb-5">
            <div class="w-9 h-9 rounded-lg ${def.iconChip} flex items-center justify-center flex-shrink-0">
                <i class="fas ${def.icon} ${def.iconGlyph} text-sm"></i>
            </div>
            <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-slate-800 dark:text-slate-100">${t(def.titleKey)}</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${t(def.descKey)}</p>
            </div>
            ${headerRight}
        </div>
        <div class="space-y-4" data-cap-body="${def.id}"></div>`;

    const body = wrap.querySelector(`[data-cap-body="${def.id}"]`);
    renderCapabilityBody(def, cap, body);
    return wrap;
}

function renderCapabilityHeaderTag(def, cap) {
    return '';
}

function _searchProviderLabel(cap, providerId) {
    const list = (cap && cap.providers) || [];
    const hit = list.find(p => p.id === providerId);
    return hit ? localizedLabel(hit.label) : providerId;
}

// Search card body: strategy picker + (when fixed) provider picker + a
// status row that surfaces which providers are ready and how to add the
// missing ones. Three of the four backends piggy-back on model-vendor
// credentials (zhipu / qianfan / linkai); bocha owns its own key under
// tools.web_search and gets its own minimal credential modal.
function renderSearchCapability(def, cap, body) {
    const providers = cap.providers || [];
    const configuredIds = cap.configured_providers || [];
    const hasAny = configuredIds.length > 0;
    const strategy = cap.strategy || 'auto';

    body.innerHTML = `
        <div>
            <label class="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">${t('models_search_strategy_label')}</label>
            <div id="cap-search-strategy" class="cfg-dropdown" tabindex="0">
                <div class="cfg-dropdown-selected">
                    <span class="cfg-dropdown-text">--</span>
                    <i class="fas fa-chevron-down cfg-dropdown-arrow"></i>
                </div>
                <div class="cfg-dropdown-menu"></div>
            </div>
        </div>
        <div id="cap-search-provider-wrap" class="hidden">
            <label class="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">${t('models_provider')}</label>
            <div id="cap-search-provider" class="cfg-dropdown" tabindex="0">
                <div class="cfg-dropdown-selected">
                    <span class="cfg-dropdown-text">--</span>
                    <i class="fas fa-chevron-down cfg-dropdown-arrow"></i>
                </div>
                <div class="cfg-dropdown-menu"></div>
            </div>
        </div>
        <div id="cap-search-summary"></div>
        <div class="flex items-center justify-end gap-3 pt-1">
            <span id="cap-search-status" class="text-xs text-primary-500 opacity-0 transition-opacity duration-300"></span>
            <button onclick="saveSearchCapability()"
                    class="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium
                           cursor-pointer transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed">
                ${t('save')}
            </button>
        </div>
    `;

    // Strategy dropdown — when no provider is configured the strategy
    // value is meaningless, so we show a "待配置" placeholder instead of
    // a default selection. Once any provider gets configured the saved
    // strategy (or "auto") becomes the active value.
    initDropdown(
        body.querySelector('#cap-search-strategy'),
        [
            { value: 'auto',  label: t('models_strategy_auto'),         hint: t('models_search_strategy_auto_hint') },
            { value: 'fixed', label: t('models_search_strategy_fixed'), hint: t('models_search_strategy_fixed_hint') },
        ],
        hasAny ? strategy : '',
        (value) => _onSearchStrategyChange(cap, value, body),
        hasAny ? null : { placeholder: t('models_pending_config') },
    );

    // Provider dropdown — populated with configured providers only;
    // unconfigured ones cannot be pinned (they'd silently fall back).
    const provOpts = configuredIds.map(id => ({
        value: id,
        label: _searchProviderLabel(cap, id),
    }));
    if (provOpts.length === 0) provOpts.push({ value: '', label: '--' });
    initDropdown(
        body.querySelector('#cap-search-provider'),
        provOpts,
        cap.fixed_provider || configuredIds[0] || '',
        () => {},
    );

    _renderSearchSummary(body, cap);
    _setSearchProviderPickerVisible(body, strategy === 'fixed' && hasAny);
}

function _onSearchStrategyChange(cap, value, body) {
    const configuredIds = cap.configured_providers || [];
    _setSearchProviderPickerVisible(body, value === 'fixed' && configuredIds.length > 0);
}

function _setSearchProviderPickerVisible(body, visible) {
    const wrap = body.querySelector('#cap-search-provider-wrap');
    if (!wrap) return;
    if (visible) wrap.classList.remove('hidden');
    else wrap.classList.add('hidden');
}

// Search summary line: just lists configured providers + a trailing "+
// add" button. Unconfigured backends are hidden — the user picks one from
// a small chooser when they click add. Empty state surfaces the same add
// button as a primary CTA.
function _renderSearchSummary(body, cap) {
    const host = body.querySelector('#cap-search-summary');
    if (!host) return;
    const providers = cap.providers || [];
    const configured = providers.filter(p => p.configured);
    const missing = providers.filter(p => !p.configured);

    const addBtn = missing.length
        ? `<button type="button" id="cap-search-add-btn"
                  class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-md cursor-pointer
                         bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400
                         hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
              <i class="fas fa-plus text-[10px]"></i>${t('models_search_add_provider')}
           </button>`
        : '';

    if (configured.length === 0) {
        host.innerHTML = `
            <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <i class="fas fa-circle-info text-[10px] text-amber-500"></i>
                <span>${t('models_search_none_configured')}</span>
                ${addBtn}
            </div>
        `;
    } else {
        const chips = configured.map(p => `
            <button type="button" data-search-edit-provider="${p.id}"
                    title="${t('models_search_edit_hint')}"
                    class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-md cursor-pointer
                           bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400
                           hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors">
                <i class="fas fa-check text-[10px]"></i>${escapeHtml(localizedLabel(p.label))}
            </button>
        `).join('');
        host.innerHTML = `
            <div class="flex items-center flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>${t('models_search_available_label')}</span>
                ${chips}
                ${addBtn}
            </div>
        `;
    }

    const addBtnEl = host.querySelector('#cap-search-add-btn');
    if (addBtnEl) {
        addBtnEl.addEventListener('click', (ev) => {
            ev.preventDefault();
            openSearchAddProviderPicker(missing);
        });
    }
    host.querySelectorAll('[data-search-edit-provider]').forEach(el => {
        el.addEventListener('click', (ev) => {
            ev.preventDefault();
            const pid = el.getAttribute('data-search-edit-provider');
            const meta = (cap.providers || []).find(p => p.id === pid);
            _launchSearchProviderConfig(pid, meta);
        });
    });
}

// Two-step add flow: click "+ 添加厂商" -> chooser dialog -> per-provider
// credential editor. Bocha lands on the dedicated key modal; the others
// piggy-back on the existing vendor credential modal.
function openSearchAddProviderPicker(missingProviders) {
    if (!missingProviders || missingProviders.length === 0) return;
    if (missingProviders.length === 1) {
        _launchSearchProviderConfig(missingProviders[0].id);
        return;
    }

    const existing = document.getElementById('search-add-modal');
    if (existing) existing.remove();

    const rows = missingProviders.map(p => `
        <button type="button" data-pid="${p.id}"
                class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer
                       bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10
                       text-sm text-slate-700 dark:text-slate-200 transition-colors">
            <span>${escapeHtml(localizedLabel(p.label))}</span>
            <i class="fas fa-chevron-right text-[10px] text-slate-400"></i>
        </button>
    `).join('');

    const modal = document.createElement('div');
    modal.id = 'search-add-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm';
    modal.innerHTML = `
        <div class="bg-white dark:bg-[#1A1A1A] rounded-xl border border-slate-200 dark:border-white/10
                    w-full max-w-md mx-4 p-6 shadow-xl">
            <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">${t('models_search_add_provider')}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">${t('models_search_add_desc')}</p>
            <div class="space-y-2">${rows}</div>
            <div class="flex items-center justify-end mt-5">
                <button type="button" onclick="document.getElementById('search-add-modal').remove()"
                        class="px-3 py-1.5 rounded-md text-sm text-slate-600 dark:text-slate-300
                               hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                    ${t('cancel')}
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-pid]').forEach(el => {
        el.addEventListener('click', () => {
            const pid = el.getAttribute('data-pid');
            modal.remove();
            _launchSearchProviderConfig(pid);
        });
    });
}

function _launchSearchProviderConfig(providerId, providerMeta) {
    if (providerId === 'bocha') {
        openSearchBochaModal(providerMeta);
    } else {
        openVendorModal(providerId, () => loadModelsView({ preserveScroll: true }));
    }
}

function saveSearchCapability() {
    const strategyDd = document.getElementById('cap-search-strategy');
    const providerDd = document.getElementById('cap-search-provider');
    const strategy = strategyDd ? getDropdownValue(strategyDd) : 'auto';
    const provider = (strategy === 'fixed' && providerDd) ? getDropdownValue(providerDd) : '';

    fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'set_capability',
            capability: 'search',
            strategy,
            provider,
        }),
    }).then(r => r.json()).then(data => {
        if (data.status === 'success') {
            showStatus('cap-search-status', 'models_save_success', false);
            setTimeout(() => loadModelsView({ preserveScroll: true }), 400);
        } else {
            showStatus('cap-search-status', 'models_save_failed', true);
        }
    }).catch(() => showStatus('cap-search-status', 'models_save_failed', true));
}

// Minimal bocha API-key modal. Reuses the existing vendor-modal markup
// helpers would be nice, but bocha isn't in PROVIDER_MODELS (it's not a
// model vendor), so we render a tiny dedicated dialog.
function openSearchBochaModal(providerMeta) {
    const existing = document.getElementById('search-bocha-modal');
    if (existing) existing.remove();

    let masked = (providerMeta && providerMeta.api_key_masked) || '';
    if (!masked) {
        const searchCap = (modelsState && modelsState.capabilities && modelsState.capabilities.search) || {};
        const bocha = (searchCap.providers || []).find(p => p.id === 'bocha');
        if (bocha && bocha.api_key_masked) masked = bocha.api_key_masked;
    }
    const hasKey = !!masked;
    const clearBtnHtml = hasKey
        ? `<button type="button" id="search-bocha-clear"
                  class="px-3 py-1.5 rounded-md text-xs text-red-500 dark:text-red-400
                         hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors">
              ${t('models_clear_credential')}
           </button>`
        : '';

    const modal = document.createElement('div');
    modal.id = 'search-bocha-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm';
    modal.innerHTML = `
        <div id="search-bocha-modal-card"
             class="bg-white dark:bg-[#1A1A1A] rounded-xl border border-slate-200 dark:border-white/10
                    w-full max-w-md mx-4 p-6 shadow-xl">
            <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">${t('models_search_bocha_title')}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">${t('models_search_bocha_desc')}</p>
            <label class="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">API Key</label>
            <input id="search-bocha-key" type="text" autocomplete="off" data-1p-ignore data-lpignore="true"
                   class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600
                          bg-slate-50 dark:bg-white/5 text-sm text-slate-800 dark:text-slate-100
                          focus:outline-none focus:border-primary-500 font-mono ${hasKey ? 'cfg-key-masked' : ''}"
                   value="${escapeHtml(masked)}"
                   data-masked="${hasKey ? '1' : ''}"
                   placeholder="sk-..." />
            <div class="flex items-center justify-between gap-3 mt-5">
                <div>${clearBtnHtml}</div>
                <div class="flex items-center gap-3">
                    <button type="button" onclick="document.getElementById('search-bocha-modal').remove()"
                            class="px-3 py-1.5 rounded-md text-sm text-slate-600 dark:text-slate-300
                                   hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                        ${t('cancel')}
                    </button>
                    <button type="button" onclick="_saveBochaKey()"
                            class="px-4 py-1.5 rounded-md bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium
                                   cursor-pointer transition-colors">
                        ${t('save')}
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Reset masked sentinel as soon as the user starts editing so the save
    // handler can tell apart "kept the existing key" vs "typed a new one".
    const input = document.getElementById('search-bocha-key');
    if (input) {
        const unmask = () => {
            if (input.dataset.masked === '1') {
                input.value = '';
                input.dataset.masked = '';
                input.classList.remove('cfg-key-masked');
            }
        };
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' || e.key === 'Escape') return;
            unmask();
        });
        input.addEventListener('paste', unmask);
        if (!hasKey) setTimeout(() => input.focus(), 50);
    }
    const clearBtn = document.getElementById('search-bocha-clear');
    if (clearBtn) clearBtn.addEventListener('click', _clearBochaKey);

    modal.addEventListener('mousedown', (e) => {
        if (e.target === modal) modal.remove();
    });
    const onKey = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', onKey);
        }
    };
    document.addEventListener('keydown', onKey);
}

function _saveBochaKey() {
    const input = document.getElementById('search-bocha-key');
    if (!input) return;
    // Untouched masked value => no change requested; close silently.
    if (input.dataset.masked === '1') {
        const modal = document.getElementById('search-bocha-modal');
        if (modal) modal.remove();
        return;
    }
    const apiKey = input.value.trim();
    if (!apiKey) {
        input.focus();
        return;
    }
    fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_search_credential', api_key: apiKey }),
    }).then(r => r.json()).then(data => {
        if (data.status === 'success') {
            const modal = document.getElementById('search-bocha-modal');
            if (modal) modal.remove();
            loadModelsView({ preserveScroll: true });
        }
    });
}

function _clearBochaKey() {
    fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_search_credential', api_key: '' }),
    }).then(r => r.json()).then(data => {
        if (data.status === 'success') {
            const modal = document.getElementById('search-bocha-modal');
            if (modal) modal.remove();
            loadModelsView({ preserveScroll: true });
        }
    });
}

function renderCapabilityBody(def, cap, body) {
    if (def.id === 'search') {
        renderSearchCapability(def, cap, body);
        return;
    }

    // Editable cards: provider dropdown + (optional) model dropdown + save row
    const providerOpts = buildCapabilityProviderOptions(def, cap);
    const providerHtml = `
        <div>
            <label class="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">${t('models_provider')}</label>
            <div id="cap-${def.id}-provider" class="cfg-dropdown" tabindex="0">
                <div class="cfg-dropdown-selected">
                    <span class="cfg-dropdown-text">--</span>
                    <i class="fas fa-chevron-down cfg-dropdown-arrow"></i>
                </div>
                <div class="cfg-dropdown-menu"></div>
            </div>
        </div>`;

    // The model-picker container is always emitted so the provider-change
    // handler can show/hide it; for `auto` capabilities it starts hidden and
    // gets toggled by setCapabilityModelPickerVisible.
    const modelHtml = def.needsModel ? `
        <div id="cap-${def.id}-model-wrap">
            <label class="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">${t('models_model')}</label>
            <div id="cap-${def.id}-model" class="cfg-dropdown" tabindex="0">
                <div class="cfg-dropdown-selected">
                    <span class="cfg-dropdown-text">--</span>
                    <i class="fas fa-chevron-down cfg-dropdown-arrow"></i>
                </div>
                <div class="cfg-dropdown-menu"></div>
            </div>
            <div id="cap-${def.id}-model-custom-wrap" class="mt-2 hidden">
                <input id="cap-${def.id}-model-custom" type="text"
                       class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600
                              bg-slate-50 dark:bg-white/5 text-sm text-slate-800 dark:text-slate-100
                              focus:outline-none focus:border-primary-500 font-mono transition-colors"
                       placeholder="custom model name">
            </div>
        </div>` : '';

    const dimHtml = (def.id === 'embedding' && cap.current_dim) ? `
        <p class="text-xs text-slate-400 dark:text-slate-500">
            <i class="fas fa-cube text-[10px] mr-1"></i>${t('models_dim_label')}: <span class="font-mono">${cap.current_dim}</span>
        </p>` : '';

    // Footer layout: a "hint slot" (filled later by renderCapabilityHints for
    // auto-mode cards) sits on the left while status + save stay anchored on
    // the right. Keeping them on the same row means the save button hugs the
    // inputs above instead of being pushed down by a separate hint line.
    const footer = `
        <div class="flex items-center justify-between gap-3 pt-1">
            <div data-cap-hint="${def.id}" class="flex-1 min-w-0"></div>
            <div class="flex items-center gap-3 flex-shrink-0">
                <span id="cap-${def.id}-status" class="text-xs text-primary-500 opacity-0 transition-opacity duration-300"></span>
                <button onclick="saveCapability('${def.id}')"
                        class="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium
                               cursor-pointer transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed">
                    ${t('save')}
                </button>
            </div>
        </div>`;

    body.innerHTML = providerHtml + modelHtml + dimHtml + footer;

    // TTS: mount reply-mode above provider; defer off-mode toggle to the end.
    if (def.id === 'tts') {
        renderVoiceReplyMode(body, cap.reply_mode || 'off', { skipVisibilityToggle: true });
        // Voice-timbre picker depends on provider+model; rebuilt by callbacks.
        const modelWrap = body.querySelector(`#cap-${def.id}-model-wrap`);
        if (modelWrap) {
            const voiceWrap = document.createElement('div');
            voiceWrap.id = `cap-${def.id}-voice-wrap`;
            voiceWrap.innerHTML = `
                <label class="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">${t('models_voice')}</label>
                <div id="cap-${def.id}-voice" class="cfg-dropdown" tabindex="0">
                    <div class="cfg-dropdown-selected">
                        <span class="cfg-dropdown-text">--</span>
                        <i class="fas fa-chevron-down cfg-dropdown-arrow"></i>
                    </div>
                    <div class="cfg-dropdown-menu"></div>
                </div>
                <div id="cap-${def.id}-voice-custom-wrap" class="hidden mt-2">
                    <input id="cap-${def.id}-voice-custom" type="text"
                           class="w-full px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-slate-700
                                  bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200
                                  placeholder:text-slate-400 dark:placeholder:text-slate-500
                                  focus:outline-none focus:ring-2 focus:ring-primary-500"
                           placeholder="voice id" />
                </div>
            `;
            modelWrap.parentNode.insertBefore(voiceWrap, modelWrap.nextSibling);
        }
    }

    // `body` is still detached from `document`; scope lookups locally.
    const provDd = body.querySelector(`#cap-${def.id}-provider`);
    // Strip private fields before handing to the generic initDropdown helper.
    const ddOpts = providerOpts.map(o => ({ value: o.value, label: o.label }));

    let pendingProvider = null;
    if (pendingCapabilitySelection
            && pendingCapabilitySelection.capabilityId === def.id
            && providerOpts.some(o => o.value === pendingCapabilitySelection.providerId)) {
        pendingProvider = pendingCapabilitySelection.providerId;
        pendingCapabilitySelection = null;
    }

    // Auto strategy => leave empty sentinel selected. `suggested_provider`
    // is a UI-only preselect (not persisted until the user clicks Save).
    // No current + no suggestion => leave unselected with a placeholder.
    //
    // Pending-config takes priority over both "auto" and "pick provider":
    // when no real (non-sentinel) configured option exists, surfacing
    // "auto" or "pick" misleads the user — there's nothing to auto-route
    // to or pick from. Force a "待配置" placeholder instead so all
    // capabilities behave consistently on a fresh environment.
    const hasConfiguredOpt = providerOpts.some(o => !o._isAuto && o._configured);
    const noSelectionAndNoHint = !cap.current_provider && !cap.suggested_provider;
    let initialProviderValue;
    let dropdownPlaceholder = null;
    if (!hasConfiguredOpt) {
        initialProviderValue = '';
        dropdownPlaceholder = { placeholder: t('models_pending_config') };
    } else {
        initialProviderValue = pendingProvider
            ? pendingProvider
            : ((cap.strategy === 'auto' && capabilitySupportsAuto(def.id))
                ? ''
                : (cap.current_provider
                    || cap.suggested_provider
                    || (noSelectionAndNoHint ? '' : (ddOpts[0] && ddOpts[0].value))
                    || ''));
        if (noSelectionAndNoHint) {
            dropdownPlaceholder = { placeholder: t('models_pick_provider') };
        }
    }
    initDropdown(
        provDd,
        ddOpts,
        initialProviderValue,
        (value) => onCapabilityProviderChange(def, value, body),
        dropdownPlaceholder,
    );
    decorateCapabilityProviderDropdown(def, provDd, providerOpts);

    if (def.needsModel) {
        rebuildCapabilityModelDropdown(def, initialProviderValue, cap.current_model || '', body);
        // Embedding: hide model picker when no provider is selected.
        const showModel = def.id === 'embedding' ? initialProviderValue !== '' :
            (initialProviderValue !== '' || !capabilitySupportsAuto(def.id));
        setCapabilityModelPickerVisible(def, showModel, body);
    }

    if (def.id === 'tts') {
        rebuildCapabilityVoiceDropdown(
            initialProviderValue,
            cap.current_voice || '',
            body,
            cap.current_model || ''
        );
    }

    // Inject auto/router-pending hint banners before the action footer.
    renderCapabilityHints(def, cap, body, initialProviderValue);

    if (def.id === 'tts') {
        _setTtsConfigVisible(body, (cap.reply_mode || 'off') !== 'off');
    }
}

// TTS reply-policy dropdown (off / voice_if_voice / always). Persists on
// change. When off, hides the rest of the TTS card.
function renderVoiceReplyMode(host, currentMode, options) {
    options = options || {};
    const opts = [
        { value: 'off',            label: t('voice_reply_off') },
        { value: 'voice_if_voice', label: t('voice_reply_if_voice') },
        { value: 'always',         label: t('voice_reply_always') },
    ];
    const wrap = document.createElement('div');
    wrap.id = 'voice-reply-mode-wrap';
    wrap.innerHTML = `
        <label class="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">${t('voice_reply_mode_label')}</label>
        <div id="voice-reply-mode-dd" class="cfg-dropdown" tabindex="0">
            <div class="cfg-dropdown-selected">
                <span class="cfg-dropdown-text">--</span>
                <i class="fas fa-chevron-down cfg-dropdown-arrow"></i>
            </div>
            <div class="cfg-dropdown-menu"></div>
        </div>
    `;
    host.prepend(wrap);

    const dd = wrap.querySelector('#voice-reply-mode-dd');
    const valid = ['off', 'voice_if_voice', 'always'];
    const initial = valid.includes(currentMode) ? currentMode : 'off';
    if (!options.skipVisibilityToggle) _setTtsConfigVisible(host, initial !== 'off');
    initDropdown(dd, opts, initial, (mode) => {
        if (!valid.includes(mode)) return;
        _setTtsConfigVisible(host, mode !== 'off');
        fetch('/api/models', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'set_voice_reply_mode', mode }),
        })
            .then(r => r.json())
            .then(data => {
                if (data && data.status === 'success') {
                    _ttsReadyPromise = null;  // force re-probe on next bubble
                }
            })
            .catch(() => {});
    });
}

// Show/hide everything in the TTS card below the reply-mode dropdown.
function _setTtsConfigVisible(host, visible) {
    if (!host) return;
    Array.from(host.children).forEach((child) => {
        if (child.id === 'voice-reply-mode-wrap') return;
        child.classList.toggle('hidden', !visible);
    });
}

// Toggle wrapper visibility instead of re-rendering so dropdown state survives.
function setCapabilityModelPickerVisible(def, visible, scope) {
    const root = scope || document;
    const wrap = root.querySelector(`#cap-${def.id}-model-wrap`);
    if (!wrap) return;
    wrap.classList.toggle('hidden', !visible);
}

function renderCapabilityHints(def, cap, body, currentProvider) {
    // Capabilities that can be in "auto" mode show a fallback hint right
    // under the inputs so users always know what'd actually be hit. The
    // image card additionally surfaces a "router pending" warning until the
    // standalone dispatcher lands.
    // The hint slot is co-located with the save button in the footer row
    // (see renderCapabilityBody) so the save button stays close to the
    // inputs above. We just rewrite the slot's innerHTML — emptying it
    // when the card leaves auto mode, or rendering a one-line hint when
    // it's in auto mode.
    const slot = body.querySelector(`[data-cap-hint="${def.id}"]`);
    if (!slot) return;
    slot.innerHTML = '';

    if (currentProvider !== '' || !capabilitySupportsAuto(def.id)) return;

    // The hint mirrors what the runtime would actually pick when in auto
    // mode. fallback_provider/model are pre-computed on the backend (see
    // _predict_vision_auto, _predict_image_auto) so we can trust them
    // here without re-implementing the provider chain.
    const fbProv = cap.fallback_provider || '';
    const fbModel = cap.fallback_model || '';
    if (!fbProv && !fbModel) return;
    // Show the vendor's display label (e.g. "LinkAI") instead of the raw
    // id ("linkai") when we know it. Falls back to the id when the
    // provider isn't in our vendor table (rare).
    const provMeta = modelsState.providers.find(p => p.id === fbProv);
    const fbProvLabel = (provMeta && localizedLabel(provMeta.label)) || fbProv;
    const fbText = fbModel ? `${fbProvLabel} / ${fbModel}` : fbProvLabel;
    slot.innerHTML = `
        <p class="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 min-w-0">
            <i class="fas fa-circle-info text-[10px] flex-shrink-0"></i>
            <span class="flex-shrink-0">${t('models_auto_using')}</span>
            <span class="font-mono text-slate-500 dark:text-slate-400 truncate">${escapeHtml(fbText)}</span>
        </p>`;
}

function buildCapabilityProviderOptions(def, cap) {
    // Show ALL vendors in capability dropdowns so users can see at a glance
    // who's configured (green check) and who isn't (gray dot, click to set
    // up). The list order puts configured vendors first; clicking an
    // unconfigured row opens the vendor modal in-place. ASR/TTS engines that
    // aren't tracked by PROVIDER_MODELS (azure/baidu/google etc.) are treated
    // as "always available" — no credential gate.
    const knownProviderMap = {};
    modelsState.providers.forEach(p => { knownProviderMap[p.id] = p; });

    const explicitList = cap.providers && cap.providers.length ? cap.providers : null;
    let providerIds = explicitList ? explicitList.slice() : modelsState.providers.map(p => p.id);
    if (cap.current_provider && !providerIds.includes(cap.current_provider)) {
        providerIds = [cap.current_provider, ...providerIds];
    }

    const opts = providerIds.map(pid => {
        const meta = knownProviderMap[pid];
        const tracked = !!meta;
        const configured = !tracked || !!meta.configured;
        return {
            value: pid,
            label: (meta && localizedLabel(meta.label)) || pid,
            _tracked: tracked,
            _configured: configured,
        };
    });

    opts.sort((a, b) => {
        if (a._configured === b._configured) return 0;
        return a._configured ? -1 : 1;
    });

    // Capabilities with a fallback ("auto") strategy expose it as a sentinel
    // option pinned to the top of the list. We use empty-string as the auto
    // value so the existing save handler propagates it untouched to the
    // backend, which interprets "" as "fall back to the main model".
    // Skip the sentinel when no real vendor is configured — "auto" would
    // route to nothing useful and the renderer will show "待配置" instead.
    const hasAnyConfigured = opts.some(o => o._configured);
    if ((cap.strategy === 'auto' || cap.strategy === 'specified') && hasAnyConfigured) {
        if (capabilitySupportsAuto(def.id)) {
            opts.unshift({
                value: '',
                label: t('models_strategy_auto'),
                _tracked: false,
                _configured: true,
                _isAuto: true,
            });
        }
    }
    return opts;
}

function capabilitySupportsAuto(capId) {
    // Embedding is intentionally NOT here: runtime only auto-falls back to
    // OpenAI/LinkAI, so dressing it up as "auto" hides reality from users.
    return capId === 'image' || capId === 'vision';
}

// After initDropdown renders the capability provider menu, decorate each
// row with the right-aligned configuration cue:
//   - configured rows: nothing extra — the .active marker (a brand-green ✓)
//     already comes from initDropdown's selected-state CSS for the row the
//     user currently picked. Other configured rows show no chrome, mirroring
//     a plain "switch to this" selector.
//   - unconfigured rows: a subdued gear icon hints at "click to configure".
//     The row's whole click handler is swapped to launch the vendor modal
//     in place rather than selecting an unusable value.
function decorateCapabilityProviderDropdown(def, ddEl, opts) {
    if (!ddEl) return;
    const menu = ddEl.querySelector('.cfg-dropdown-menu');
    if (!menu) return;

    const optByValue = {};
    opts.forEach(o => { optByValue[o.value] = o; });

    menu.querySelectorAll('.cfg-dropdown-item').forEach(item => {
        const value = item.dataset.value;
        const opt = optByValue[value];
        if (!opt) return;
        item.classList.add('cap-provider-item');
        if (!opt._configured) item.classList.add('cap-provider-unconfigured');

        // Wrap the label so the trailing affordance lines up via flex:auto.
        const labelText = item.textContent;
        item.textContent = '';
        const labelEl = document.createElement('span');
        labelEl.className = 'cap-provider-label';
        labelEl.textContent = labelText;
        item.appendChild(labelEl);

        if (!opt._configured) {
            // Trailing gear icon as the "configure this vendor" affordance.
            const gear = document.createElement('i');
            gear.className = 'fas fa-gear cap-provider-gear';
            item.appendChild(gear);
        }

        if (!opt._configured && opt._tracked) {
            // Hijack the click: open the vendor modal instead of selecting
            // an unusable value, and remember which capability the user was
            // configuring so the post-save reload can preselect the vendor.
            const newItem = item.cloneNode(true);
            item.replaceWith(newItem);
            newItem.addEventListener('click', (e) => {
                e.stopPropagation();
                ddEl.classList.remove('open');
                openVendorModal(value, (savedProviderId) => {
                    pendingCapabilitySelection = {
                        capabilityId: def.id,
                        providerId: savedProviderId || value,
                    };
                    loadModelsView({ preserveScroll: true });
                });
            });
        }
    });
}

// Lightweight decorator for the "add vendor" modal's provider picker:
// every configured vendor row gets a trailing brand-green ✓ so the user can
// see at a glance who's already set up, without having to read each row.
// Unlike decorateCapabilityProviderDropdown we don't hijack clicks here —
// picking an unconfigured vendor in this modal *is* the intended action.
function decorateVendorModalPicker(ddEl, opts) {
    if (!ddEl) return;
    const menu = ddEl.querySelector('.cfg-dropdown-menu');
    if (!menu) return;

    const optByValue = {};
    opts.forEach(o => { optByValue[o.value] = o; });

    menu.querySelectorAll('.cfg-dropdown-item').forEach(item => {
        const opt = optByValue[item.dataset.value];
        if (!opt) return;
        // Tag the row so the global active-row ✓ rule is suppressed in CSS
        // (otherwise configured AND selected rows would render two checks).
        item.classList.add('vendor-picker-item');
        if (opt._isAddNew) {
            // "Custom" is an add-new action (multiple entries allowed),
            // so show a trailing + instead of the configured ✓.
            const plus = document.createElement('i');
            plus.className = 'fas fa-plus vendor-picker-add-mark';
            item.appendChild(plus);
            return;
        }
        if (!opt._configured) return;
        const check = document.createElement('i');
        check.className = 'fas fa-check vendor-picker-configured-mark';
        item.appendChild(check);
    });
}

function rebuildCapabilityModelDropdown(def, providerId, selectedModel, scope) {
    // `scope` lets the caller (renderCapabilityBody) target a still-detached
    // subtree. After the card is mounted, callers may pass `document` instead.
    const root = scope || document;
    const el = root.querySelector(`#cap-${def.id}-model`);
    if (!el) return;

    // Prefer the capability-scoped model list when the backend provides one
    // (vision / image). It reflects the models the runtime can actually
    // dispatch to for this capability, instead of the vendor's full chat-
    // model catalog. Fall back to the generic provider.models for chat /
    // embedding / tts where any vendor model is fair game.
    //
    // Entries may be plain strings or {value, hint} objects (image catalog
    // uses the latter to surface brand aliases like "Nano Banana 2" next to
    // the technical Gemini model id). We normalize to {value, label, hint}
    // before handing off to initDropdown.
    const cap = modelsState.capabilities[def.id] || {};
    const capModelMap = cap.provider_models || {};
    let rawList;
    if (capModelMap[providerId]) {
        rawList = capModelMap[providerId].slice();
    } else if (providerId.startsWith('custom:') && capModelMap['custom']) {
        // Expanded custom:<id> entries share the same preset model list
        rawList = capModelMap['custom'].slice();
    } else {
        const provider = modelsState.providers.find(p => p.id === providerId);
        rawList = (provider && provider.models) ? provider.models.slice() : [];
    }
    const modelValues = [];
    const opts = rawList.map(entry => {
        if (typeof entry === 'string') {
            modelValues.push(entry);
            return { value: entry, label: entry };
        }
        modelValues.push(entry.value);
        return { value: entry.value, label: entry.label || entry.value, hint: entry.hint || '' };
    });
    opts.push({ value: '__custom__', label: currentLang === 'zh' ? '自定义' : 'Custom' });

    let initialValue = selectedModel || '';
    if (initialValue && !modelValues.includes(initialValue)) {
        initialValue = '__custom__';
    }
    if (!initialValue && opts.length) initialValue = opts[0].value;

    initDropdown(el, opts, initialValue, (value) => {
        const customWrap = document.getElementById(`cap-${def.id}-model-custom-wrap`);
        if (customWrap) {
            if (value === '__custom__') {
                customWrap.classList.remove('hidden');
                const input = document.getElementById(`cap-${def.id}-model-custom`);
                if (input && !input.value) input.value = selectedModel || '';
            } else {
                customWrap.classList.add('hidden');
            }
        }
        // TTS voice catalog may be scoped per engine model (aggregating
        // gateways). Rebuild the voice picker whenever the model changes.
        if (def.id === 'tts') {
            const provDd = document.getElementById('cap-tts-provider');
            const provId = provDd ? getDropdownValue(provDd) : '';
            rebuildCapabilityVoiceDropdown(provId, '', null, value);
        }
    });

    const customWrap = root.querySelector(`#cap-${def.id}-model-custom-wrap`);
    if (customWrap) {
        if (initialValue === '__custom__') {
            customWrap.classList.remove('hidden');
            const input = root.querySelector(`#cap-${def.id}-model-custom`);
            if (input) input.value = selectedModel || '';
        } else {
            customWrap.classList.add('hidden');
        }
    }
}

// TTS-only: rebuild the voice timbre picker against the provider's
// curated voice list. Hidden when no provider is picked.
//
// Each voice entry may be:
//   - a bare string  (code = label)
//   - {value, label, hint?}   so we can show a friendly Chinese name
//     while persisting the raw API code that the runtime sends.
function rebuildCapabilityVoiceDropdown(providerId, selectedVoice, scope, modelId) {
    const root = scope || document;
    const wrap = root.querySelector(`#cap-tts-voice-wrap`);
    const el = root.querySelector(`#cap-tts-voice`);
    if (!wrap || !el) return;
    const cap = modelsState.capabilities.tts || {};
    const voicesByProvider = cap.provider_voices || {};
    let raw = (providerId && voicesByProvider[providerId]) || [];
    // Some providers (gateways) scope voices by engine model id.
    if (raw && !Array.isArray(raw) && typeof raw === 'object') {
        const activeModel = modelId
            || (root.querySelector(`#cap-tts-model`) ? getDropdownValue(root.querySelector(`#cap-tts-model`)) : '');
        raw = (activeModel && raw[activeModel]) || [];
    }
    if (!raw || raw.length === 0) {
        wrap.classList.add('hidden');
        return;
    }
    wrap.classList.remove('hidden');
    // Voice picker: friendly name on the left, raw API code as right-hand
    // hint. Persisted/sent value is always the raw code.
    const codes = [];
    const opts = raw.map(entry => {
        if (typeof entry === 'string') {
            codes.push(entry);
            return { value: entry, label: entry };
        }
        codes.push(entry.value);
        const code = entry.value;
        const desc = entry.hint || entry.label || code;
        return {
            value: code,
            label: desc,
            hint: desc === code ? '' : code,
        };
    });
    opts.push({ value: '__custom__', label: currentLang === 'zh' ? '自定义' : 'Custom' });

    // Off-catalog values route through the custom branch.
    let initial = selectedVoice || '';
    const isCustom = initial && !codes.includes(initial);
    if (isCustom) initial = '__custom__';
    if (!initial) initial = codes[0];

    initDropdown(el, opts, initial, (value) => {
        const customWrap = root.querySelector(`#cap-tts-voice-custom-wrap`);
        if (!customWrap) return;
        if (value === '__custom__') {
            customWrap.classList.remove('hidden');
            const input = root.querySelector(`#cap-tts-voice-custom`);
            if (input && !input.value) input.value = isCustom ? selectedVoice : '';
        } else {
            customWrap.classList.add('hidden');
        }
    });

    const customWrap = root.querySelector(`#cap-tts-voice-custom-wrap`);
    if (customWrap) {
        if (initial === '__custom__') {
            customWrap.classList.remove('hidden');
            const input = root.querySelector(`#cap-tts-voice-custom`);
            if (input) input.value = isCustom ? selectedVoice : '';
        } else {
            customWrap.classList.add('hidden');
        }
    }
}

function onCapabilityProviderChange(def, providerId, scope) {
    if (def.needsModel) {
        // Embedding: hide model picker when no provider is selected.
        const showModel = def.id === 'embedding' ? providerId !== '' :
            !(providerId === '' && capabilitySupportsAuto(def.id));
        if (showModel) {
            rebuildCapabilityModelDropdown(def, providerId, '', scope);
        }
        setCapabilityModelPickerVisible(def, showModel, scope);
    }
    if (def.id === 'tts') {
        rebuildCapabilityVoiceDropdown(providerId, '', scope);
    }
    const body = scope || document.querySelector(`[data-cap-body="${def.id}"]`);
    if (body) {
        const cap = modelsState.capabilities[def.id] || {};
        renderCapabilityHints(def, cap, body, providerId);
    }
}

function getCapabilityModelValue(def) {
    if (!def.needsModel) return '';
    const dd = document.getElementById(`cap-${def.id}-model`);
    if (!dd) return '';
    const v = getDropdownValue(dd);
    if (v === '__custom__') {
        const input = document.getElementById(`cap-${def.id}-model-custom`);
        return input ? input.value.trim() : '';
    }
    return v || '';
}

function saveCapability(capId) {
    const def = MODELS_CAPABILITY_DEFS.find(d => d.id === capId);
    if (!def || !def.editable) return;
    // Search has its own form (strategy + provider, no model picker).
    if (capId === 'search') { saveSearchCapability(); return; }
    const provDd = document.getElementById(`cap-${capId}-provider`);
    const provider = provDd ? getDropdownValue(provDd) : '';
    // When the user is in auto mode (provider == ""), the model picker is
    // hidden and any value left in it is stale; persist an empty model so
    // the backend treats this as "fall back to the runtime chain".
    const isAuto = provider === '' && capabilitySupportsAuto(capId);
    // Embedding without a provider similarly means "cleared" — don't leak
    // a stale model value into config.
    const model = (isAuto || (capId === 'embedding' && !provider)) ? '' : getCapabilityModelValue(def);
    // TTS carries an extra voice timbre (supports free-text custom ids).
    let voice = '';
    if (capId === 'tts' && !isAuto) {
        const voiceDd = document.getElementById(`cap-${capId}-voice`);
        voice = voiceDd ? getDropdownValue(voiceDd) : '';
        if (voice === '__custom__') {
            const input = document.getElementById(`cap-${capId}-voice-custom`);
            voice = input ? input.value.trim() : '';
        }
    }

    // Embedding changes invalidate any pre-existing vector index because
    // dimensions / vendor differ. Gate the save behind a confirm, and on
    // success surface a dedicated info dialog telling the user how to
    // rebuild — both via the in-app custom dialog, not the native alert.
    if (capId === 'embedding') {
        const cap = modelsState.capabilities[capId] || {};
        const before = (cap.current_provider || '').trim();
        const after = (provider || '').trim();
        if (before !== after) {
            showConfirmDialog({
                title: t('models_embedding_change_title'),
                message: t('models_embedding_change_msg'),
                okText: t('save'),
                cancelText: t('cancel'),
                onConfirm: () => _persistCapability(capId, provider, model, () => {
                    showConfirmDialog({
                        title: t('models_embedding_saved_title'),
                        message: t('models_embedding_saved_msg'),
                        okText: t('models_embedding_saved_ok'),
                        hideCancel: true,
                        onConfirm: () => {
                            navigateTo('chat');
                            // Defer focus + value set: navigateTo may
                            // re-render the chat panel; setting value before
                            // the input is mounted would be lost.
                            setTimeout(() => {
                                const input = document.getElementById('chat-input');
                                if (!input) return;
                                input.value = '/memory rebuild-index';
                                input.focus();
                                // Trigger any input listeners (autosize, send-button enable, etc.)
                                input.dispatchEvent(new Event('input', { bubbles: true }));
                            }, 60);
                        },
                    });
                }),
            });
            return;
        }
    }
    _persistCapability(capId, provider, model, undefined, { voice });
}

function _persistCapability(capId, provider, model, onAfterSuccess, extras) {
    const payload = { action: 'set_capability', capability: capId, provider_id: provider, model: model };
    if (extras && extras.voice !== undefined) payload.voice = extras.voice;
    fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    }).then(r => r.json()).then(data => {
        if (data.status === 'success') {
            // Flash "Saved" before reload so the status survives the rebuild.
            showStatus(`cap-${capId}-status`, 'models_save_success', false);
            setTimeout(() => {
                loadModelsView({ preserveScroll: true });
                if (onAfterSuccess) onAfterSuccess();
            }, 400);
        } else {
            showStatus(`cap-${capId}-status`, 'models_save_failed', true);
        }
    }).catch(() => showStatus(`cap-${capId}-status`, 'models_save_failed', true));
}

// ---------- Vendor credential modal ------------------------------------

let vendorModalState = { providerId: '', onSaved: null };

function openVendorModal(providerId, onSaved) {
    vendorModalState = { providerId: providerId || '', onSaved: onSaved || null };

    const overlay = document.getElementById('vendor-modal-overlay');
    const titleEl = document.getElementById('vendor-modal-title');
    const subEl = document.getElementById('vendor-modal-subtitle');
    const pickerWrap = document.getElementById('vendor-modal-picker-wrap');
    const baseWrap = document.getElementById('vendor-modal-base-wrap');
    const baseInput = document.getElementById('vendor-modal-base');
    const baseHint = document.getElementById('vendor-modal-base-hint');
    const keyInput = document.getElementById('vendor-modal-key');
    const clearBtn = document.getElementById('vendor-modal-clear');

    // Reset any leftover status (e.g. previous "Saved" message)
    const statusEl = document.getElementById('vendor-modal-status');
    if (statusEl) {
        statusEl.textContent = '';
        statusEl.classList.add('opacity-0');
    }

    if (!providerId) {
        // Add flow — show provider picker, default to the first unconfigured one.
        // We render every configured vendor with a trailing green ✓ via the
        // dropdown decorator, mirroring the visual language used by the
        // capability provider dropdowns. The .active row already shows the
        // currently selected vendor via its own background highlight, so we
        // intentionally suppress the global active-row ✓ for this picker
        // (see CSS) — otherwise configured + selected rows would show two.
        // Expanded custom provider cards ("custom:<id>") are edited via their
        // dedicated modal, so they are excluded from this picker. Picking the
        // "custom" entry creates a *new* custom provider via that modal —
        // this is how multiple OpenAI-compatible endpoints are added.
        const builtinProviders = modelsState.providers.filter(p => !isCustomProviderCard(p));
        const pickerOpts = builtinProviders.map(p => ({
            value: p.id,
            label: localizedLabel(p.label),
            _configured: !!p.configured,
        }));
        // In multi-provider mode the backend replaces the bare "custom" card
        // with the expanded ones; re-add it here so the entry stays available.
        if (!pickerOpts.some(o => o.value === 'custom')) {
            pickerOpts.push({ value: 'custom', label: t('models_custom_vendor_label'), _configured: false });
        }
        // "Custom" always behaves as an add-new action (multiple entries
        // allowed), so it shows a + mark instead of the configured ✓.
        pickerOpts.forEach(o => { if (o.value === 'custom') { o._isAddNew = true; o._configured = false; } });
        const unconfigured = builtinProviders.filter(p => !p.configured);
        const defaultId = (unconfigured[0] && unconfigured[0].id) || (builtinProviders[0] && builtinProviders[0].id) || 'custom';
        pickerWrap.classList.remove('hidden');
        const pickerEl = document.getElementById('vendor-modal-picker');
        const onPick = (val) => {
            if (val === 'custom') {
                // "Custom" in the add flow always creates a new
                // OpenAI-compatible provider entry via the dedicated modal
                // (name + base + key), supporting multiple custom endpoints.
                closeVendorModal();
                openCustomProviderModal('');
                return;
            }
            fillVendorModalForProvider(val);
        };
        initDropdown(pickerEl, pickerOpts, defaultId, onPick);
        decorateVendorModalPicker(pickerEl, pickerOpts);
        onPick(defaultId);
    } else {
        pickerWrap.classList.add('hidden');
        fillVendorModalForProvider(providerId);
    }

    overlay.classList.remove('hidden');

    document.getElementById('vendor-modal-cancel').onclick = closeVendorModal;
    document.getElementById('vendor-modal-save').onclick = saveVendorModal;
    clearBtn.onclick = clearVendorModal;

    // Once the user edits the masked value, drop the "masked sentinel" dataset
    // so the save handler treats their input as a real new key. We compare on
    // the next tick because keydown fires before the new char lands in .value.
    keyInput.oninput = function () {
        if (keyInput.dataset.masked === '1' && keyInput.value !== keyInput.dataset.maskedVal) {
            keyInput.dataset.masked = '';
        }
    };

    function onOverlayClick(e) {
        if (e.target === overlay) {
            closeVendorModal();
            overlay.removeEventListener('click', onOverlayClick);
        }
    }
    overlay.addEventListener('click', onOverlayClick);
    keyInput.focus();
}

function fillVendorModalForProvider(providerId) {
    const meta = modelsState.providers.find(p => p.id === providerId);
    if (!meta) return;
    document.getElementById('vendor-modal-title').textContent = localizedLabel(meta.label);
    document.getElementById('vendor-modal-subtitle').textContent = meta.id;

    // ----- API Base -----
    // Always reflect the *current effective* base as the input value so the
    // user can see (and edit) what's in use today. Placeholder is reserved
    // strictly for the "not yet typed anything" state and shows the official
    // default — never mixed with the actual value.
    const baseWrap = document.getElementById('vendor-modal-base-wrap');
    const baseInput = document.getElementById('vendor-modal-base');
    const baseHint = document.getElementById('vendor-modal-base-hint');
    if (meta.api_base_field) {
        baseWrap.classList.remove('hidden');
        baseInput.placeholder = meta.api_base_default || meta.api_base_placeholder || '';
        baseInput.value = meta.api_base || '';
        baseHint.classList.add('hidden');
    } else {
        baseWrap.classList.add('hidden');
        baseInput.value = '';
    }

    // ----- API Key -----
    // For configured vendors, surface the masked key as the input *value* so
    // it shows up in the same dark text as a real entry — making "configured"
    // visually unambiguous. The masked form (e.g. "sk-r***zRU") is also a
    // sentinel: the save handler treats untouched masked input as "no change".
    const keyInput = document.getElementById('vendor-modal-key');
    if (meta.configured && meta.api_key_masked) {
        keyInput.value = meta.api_key_masked;
        keyInput.dataset.masked = '1';
        keyInput.dataset.maskedVal = meta.api_key_masked;
        keyInput.placeholder = '';
    } else {
        keyInput.value = '';
        keyInput.dataset.masked = '';
        keyInput.dataset.maskedVal = '';
        keyInput.placeholder = 'sk-...';
    }

    const clearBtn = document.getElementById('vendor-modal-clear');
    clearBtn.classList.toggle('hidden', !meta.configured);

    vendorModalState.providerId = providerId;
}

function closeVendorModal() {
    document.getElementById('vendor-modal-overlay').classList.add('hidden');
}

function saveVendorModal() {
    const providerId = vendorModalState.providerId;
    if (!providerId) return;
    const keyInput = document.getElementById('vendor-modal-key');
    const apiBase = document.getElementById('vendor-modal-base').value.trim();

    // Treat "input still equals the masked value we surfaced on open" as "no
    // change" — the backend uses missing/empty api_key to skip the field.
    let apiKey = keyInput.value.trim();
    const masked = keyInput.dataset.masked === '1';
    const maskedVal = keyInput.dataset.maskedVal || '';
    if (masked && apiKey === maskedVal) {
        apiKey = '';
    }

    if (!apiKey && !masked) {
        // First-time setup with no key entered → nudge the user.
        keyInput.focus();
        return;
    }

    const btn = document.getElementById('vendor-modal-save');
    btn.disabled = true;
    const payload = { action: 'set_provider', provider_id: providerId, api_base: apiBase };
    if (apiKey) payload.api_key = apiKey;
    fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    }).then(r => r.json()).then(data => {
        btn.disabled = false;
        if (data.status === 'success') {
            closeVendorModal();
            const onSaved = vendorModalState.onSaved;
            if (onSaved) {
                try { onSaved(providerId); } catch (e) { /* noop */ }
            } else {
                loadModelsView();
            }
        } else {
            showStatus('vendor-modal-status', 'models_save_failed', true);
        }
    }).catch(() => {
        btn.disabled = false;
        showStatus('vendor-modal-status', 'models_save_failed', true);
    });
}

function clearVendorModal() {
    const providerId = vendorModalState.providerId;
    if (!providerId) return;
    showConfirmDialog({
        title: t('models_clear_confirm_title'),
        message: t('models_clear_confirm_msg'),
        okText: t('models_clear_credential'),
        cancelText: t('cancel'),
        onConfirm: () => {
            fetch('/api/models', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_provider', provider_id: providerId }),
            }).then(r => r.json()).then(data => {
                if (data.status === 'success') {
                    closeVendorModal();
                    loadModelsView();
                } else {
                    showStatus('vendor-modal-status', 'models_clear_failed', true);
                }
            }).catch(() => showStatus('vendor-modal-status', 'models_clear_failed', true));
        }
    });
}

// =====================================================================
// Custom (OpenAI-compatible) provider modal — add / edit
// =====================================================================
// State for the dedicated custom-provider modal. `editId` is empty when
// adding and set to the provider id when editing.
let customProviderModalState = { editId: '' };

function openCustomProviderModal(providerId) {
    const editing = !!providerId;
    customProviderModalState = { editId: editing ? providerId : '' };

    const card = editing ? getCustomProviderCards().find(p => p.custom_id === providerId) : null;

    const overlay = document.getElementById('custom-provider-modal-overlay');
    if (!overlay) return;

    document.getElementById('custom-provider-modal-title').textContent =
        editing ? t('models_custom_edit_title') : t('models_custom_add_title');

    const nameInput = document.getElementById('custom-provider-name');
    const baseInput = document.getElementById('custom-provider-base');
    const keyInput = document.getElementById('custom-provider-key');

    nameInput.value = card ? (card.custom_name || '') : '';
    baseInput.value = card ? (card.api_base || '') : '';

    // Surface the masked key as the value for configured providers so the
    // "already set" state is unambiguous; an untouched masked value means
    // "keep the existing key" on save (mirrors the vendor modal contract).
    if (card && card.configured && card.api_key_masked) {
        keyInput.value = card.api_key_masked;
        keyInput.dataset.masked = '1';
        keyInput.dataset.maskedVal = card.api_key_masked;
    } else {
        keyInput.value = '';
        keyInput.dataset.masked = '';
        keyInput.dataset.maskedVal = '';
    }
    keyInput.oninput = function () {
        if (keyInput.dataset.masked === '1' && keyInput.value !== keyInput.dataset.maskedVal) {
            keyInput.dataset.masked = '';
        }
    };

    const statusEl = document.getElementById('custom-provider-modal-status');
    if (statusEl) { statusEl.textContent = ''; statusEl.classList.add('opacity-0'); }

    overlay.classList.remove('hidden');
    document.getElementById('custom-provider-modal-cancel').onclick = closeCustomProviderModal;
    document.getElementById('custom-provider-modal-save').onclick = saveCustomProviderModal;

    // Delete is only available when editing an existing provider.
    const deleteBtn = document.getElementById('custom-provider-modal-delete');
    if (deleteBtn) {
        deleteBtn.classList.toggle('hidden', !editing);
        deleteBtn.onclick = editing ? () => deleteCustomProvider(providerId) : null;
    }

    function onOverlayClick(e) {
        if (e.target === overlay) {
            closeCustomProviderModal();
            overlay.removeEventListener('click', onOverlayClick);
        }
    }
    overlay.addEventListener('click', onOverlayClick);
    nameInput.focus();
}

function closeCustomProviderModal() {
    const overlay = document.getElementById('custom-provider-modal-overlay');
    if (overlay) overlay.classList.add('hidden');
}

function saveCustomProviderModal() {
    const name = document.getElementById('custom-provider-name').value.trim();
    const apiBase = document.getElementById('custom-provider-base').value.trim();
    const keyInput = document.getElementById('custom-provider-key');

    if (!name) {
        showStatus('custom-provider-modal-status', 'models_custom_name_required', true);
        document.getElementById('custom-provider-name').focus();
        return;
    }
    const editing = !!customProviderModalState.editId;
    if (!editing && !apiBase) {
        showStatus('custom-provider-modal-status', 'models_custom_base_required', true);
        document.getElementById('custom-provider-base').focus();
        return;
    }

    // Untouched masked key => no change (omit from payload).
    let apiKey = keyInput.value.trim();
    if (keyInput.dataset.masked === '1' && apiKey === (keyInput.dataset.maskedVal || '')) {
        apiKey = '';
    }

    const payload = {
        action: 'set_custom_provider',
        name: name,
        api_base: apiBase,
    };
    if (apiKey) payload.api_key = apiKey;
    if (editing) payload.id = customProviderModalState.editId;

    const btn = document.getElementById('custom-provider-modal-save');
    btn.disabled = true;
    fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    }).then(r => r.json()).then(data => {
        btn.disabled = false;
        if (data.status === 'success') {
            closeCustomProviderModal();
            loadModelsView();
        } else {
            showStatus('custom-provider-modal-status', 'models_save_failed', true);
        }
    }).catch(() => {
        btn.disabled = false;
        showStatus('custom-provider-modal-status', 'models_save_failed', true);
    });
}

function deleteCustomProvider(providerId) {
    showConfirmDialog({
        title: t('models_custom_delete_confirm_title'),
        message: t('models_custom_delete_confirm_msg'),
        okText: t('models_custom_delete'),
        cancelText: t('cancel'),
        onConfirm: () => {
            fetch('/api/models', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_custom_provider', id: providerId }),
            }).then(r => r.json()).then(data => {
                if (data.status === 'success') {
                    closeCustomProviderModal();
                    loadModelsView();
                }
            }).catch(() => { /* noop */ });
        }
    });
}

// =====================================================================
// Channels View
// =====================================================================
let channelsData = [];

function loadChannelsView() {
    const container = document.getElementById('channels-content');
    container.innerHTML = `<div class="flex items-center gap-2 py-8 justify-center text-slate-400 dark:text-slate-500 text-sm">
        <i class="fas fa-spinner fa-spin text-xs"></i><span>Loading...</span></div>`;

    fetch('/api/channels').then(r => r.json()).then(data => {
        if (data.status !== 'success') return;
        channelsData = data.channels || [];
        renderActiveChannels();
    }).catch(() => {
        container.innerHTML = '<p class="text-sm text-red-400 py-8 text-center">Failed to load channels</p>';
    });
}

function renderActiveChannels() {
    stopWeixinQrPoll();
    stopWeixinStatusPoll();
    const container = document.getElementById('channels-content');
    container.innerHTML = '';
    closeAddChannelPanel();

    const activeChannels = channelsData.filter(ch => ch.active);

    if (activeChannels.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-20">
                <div class="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                    <i class="fas fa-tower-broadcast text-blue-400 text-xl"></i>
                </div>
                <p class="text-slate-500 dark:text-slate-400 font-medium">${t('channels_empty')}</p>
                <p class="text-sm text-slate-400 dark:text-slate-500 mt-1">${t('channels_empty_desc')}</p>
            </div>`;
        return;
    }

    activeChannels.forEach(ch => {
        const label = (typeof ch.label === 'object') ? (ch.label[currentLang] || ch.label.en) : ch.label;
        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-[#1A1A1A] rounded-xl border border-slate-200 dark:border-white/10 p-6';
        card.id = `channel-card-${ch.name}`;

        const fieldsHtml = buildChannelFieldsHtml(ch.name, ch.fields || []);
        const hasFields = (ch.fields || []).length > 0;

        const weixinWaiting = ch.name === 'weixin' && ch.login_status && ch.login_status !== 'logged_in';
        const wecomNeedsCreds = ch.name === 'wecom_bot' && !_wecomBotHasCreds(ch);
        // 飞书 active 卡片渲染带 Tab 的 panel：手动填写 + 扫码重建（覆盖现有配置）
        const isFeishu = ch.name === 'feishu';
        let statusDot, statusText;
        if (weixinWaiting) {
            statusDot = 'bg-amber-400 animate-pulse';
            statusText = ch.login_status === 'scanned'
                ? `<span class="text-xs text-primary-500">${t('weixin_scan_scanned')}</span>`
                : `<span class="text-xs text-amber-500">${t('weixin_scan_waiting')}</span>`;
        } else if (wecomNeedsCreds) {
            statusDot = 'bg-amber-400 animate-pulse';
            statusText = `<span class="text-xs text-amber-500">${t('channels_connecting')}</span>`;
        } else {
            statusDot = 'bg-primary-400';
            statusText = `<span class="text-xs text-primary-500">${t('channels_connected')}</span>`;
        }

        card.innerHTML = `
            <div class="flex items-center gap-4${hasFields || weixinWaiting || wecomNeedsCreds || isFeishu ? ' mb-5' : ''}">
                <div class="w-10 h-10 rounded-xl bg-${ch.color}-50 dark:bg-${ch.color}-900/20 flex items-center justify-center flex-shrink-0">
                    <i class="fas ${ch.icon} text-${ch.color}-500 text-base"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                        <span class="font-semibold text-slate-800 dark:text-slate-100">${escapeHtml(label)}</span>
                        <span class="w-2 h-2 rounded-full ${statusDot}"></span>
                        ${statusText}
                    </div>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">${escapeHtml(ch.name)}</p>
                </div>
                <button onclick="disconnectChannel('${ch.name}')"
                    class="px-3 py-1.5 rounded-lg text-xs font-medium
                           bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400
                           hover:bg-red-100 dark:hover:bg-red-900/40
                           cursor-pointer transition-colors flex-shrink-0">
                    ${t('channels_disconnect')}
                </button>
            </div>
            ${weixinWaiting ? `<div id="weixin-active-qr" class="flex flex-col items-center py-2">
                <button onclick="showWeixinActiveQr()"
                    class="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium
                           cursor-pointer transition-colors duration-150">
                    ${t('weixin_scan_title')}
                </button>
            </div>` : ''}
            ${wecomNeedsCreds ? `<div id="wecom-active-auth" class="flex flex-col items-center py-2">
                <p class="text-sm text-slate-500 dark:text-slate-400 mb-3">${t('wecom_scan_desc')}</p>
                <button onclick="startWecomBotAuthInCard()"
                    class="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium
                           cursor-pointer transition-colors duration-150">
                    <i class="fas fa-qrcode mr-2"></i>${t('wecom_scan_btn')}
                </button>
                <div id="wecom-card-scan-status" class="mt-3"></div>
            </div>` : ''}
            ${isFeishu ? buildFeishuPanel(ch, true) : (hasFields ? `<div class="space-y-4">
                ${fieldsHtml}
                <div class="flex items-center justify-end gap-3 pt-1">
                    <span id="ch-status-${ch.name}" class="text-xs text-primary-500 opacity-0 transition-opacity duration-300"></span>
                    <button onclick="saveChannelConfig('${ch.name}')"
                        class="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium
                               cursor-pointer transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                        id="ch-save-${ch.name}">${t('channels_save')}</button>
                </div>
            </div>` : '')}`;

        container.appendChild(card);
        bindSecretFieldEvents(card);

        if (weixinWaiting) {
            startWeixinActiveStatusPoll();
        }
    });
}

function buildChannelFieldsHtml(chName, fields) {
    let html = '';
    fields.forEach(f => {
        const inputId = `ch-${chName}-${f.key}`;
        let inputHtml = '';
        if (f.type === 'bool') {
            const checked = f.value ? 'checked' : '';
            inputHtml = `<label class="relative inline-flex items-center cursor-pointer">
                <input id="${inputId}" type="checkbox" ${checked} class="sr-only peer" data-field="${f.key}" data-ch="${chName}">
                <div class="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-checked:bg-primary-400 rounded-full
                            after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white
                            after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
            </label>`;
        } else if (f.type === 'secret') {
            inputHtml = `<input id="${inputId}" type="text" value="${escapeHtml(String(f.value || ''))}"
                data-field="${f.key}" data-ch="${chName}" data-masked="${f.value ? '1' : ''}"
                class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600
                       bg-slate-50 dark:bg-white/5 text-sm text-slate-800 dark:text-slate-100
                       focus:outline-none focus:border-primary-500 font-mono transition-colors
                       ${f.value ? 'cfg-key-masked' : ''}"
                placeholder="${escapeHtml(f.label)}">`;
        } else {
            const inputType = f.type === 'number' ? 'number' : 'text';
            inputHtml = `<input id="${inputId}" type="${inputType}" value="${escapeHtml(String(f.value ?? f.default ?? ''))}"
                data-field="${f.key}" data-ch="${chName}"
                class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600
                       bg-slate-50 dark:bg-white/5 text-sm text-slate-800 dark:text-slate-100
                       focus:outline-none focus:border-primary-500 font-mono transition-colors"
                placeholder="${escapeHtml(f.label)}">`;
        }
        html += `<div>
            <label class="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">${escapeHtml(f.label)}</label>
            ${inputHtml}
        </div>`;
    });
    return html;
}

function bindSecretFieldEvents(container) {
    container.querySelectorAll('input[data-masked="1"]').forEach(inp => {
        inp.addEventListener('focus', function() {
            if (this.dataset.masked === '1') {
                this.value = '';
                this.dataset.masked = '';
                this.classList.remove('cfg-key-masked');
            }
        });
    });
}

function showChannelStatus(chName, msgKey, isError) {
    const el = document.getElementById(`ch-status-${chName}`);
    if (!el) return;
    el.textContent = t(msgKey);
    el.classList.toggle('text-red-500', !!isError);
    el.classList.toggle('text-primary-500', !isError);
    el.classList.remove('opacity-0');
    setTimeout(() => el.classList.add('opacity-0'), 2500);
}

function saveChannelConfig(chName) {
    const card = document.getElementById(`channel-card-${chName}`);
    if (!card) return;

    const updates = {};
    card.querySelectorAll('input[data-ch="' + chName + '"]').forEach(inp => {
        const key = inp.dataset.field;
        if (inp.type === 'checkbox') {
            updates[key] = inp.checked;
        } else {
            if (inp.dataset.masked === '1') return;
            updates[key] = inp.value;
        }
    });

    const btn = document.getElementById(`ch-save-${chName}`);
    if (btn) btn.disabled = true;

    fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', channel: chName, config: updates })
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === 'success') {
            showChannelStatus(chName, data.restarted ? 'channels_restarted' : 'channels_saved', false);
        } else {
            showChannelStatus(chName, 'channels_save_error', true);
        }
    })
    .catch(() => showChannelStatus(chName, 'channels_save_error', true))
    .finally(() => { if (btn) btn.disabled = false; });
}

function disconnectChannel(chName) {
    const ch = channelsData.find(c => c.name === chName);
    const label = ch ? ((typeof ch.label === 'object') ? (ch.label[currentLang] || ch.label.en) : ch.label) : chName;

    showConfirmDialog({
        title: t('channels_disconnect'),
        message: t('channels_disconnect_confirm'),
        okText: t('channels_disconnect'),
        cancelText: t('channels_cancel'),
        onConfirm: () => {
            fetch('/api/channels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'disconnect', channel: chName })
            })
            .then(r => r.json())
            .then(data => {
                if (data.status === 'success') {
                    if (ch) ch.active = false;
                    renderActiveChannels();
                }
            })
            .catch(() => {});
        }
    });
}

// --- Add channel panel ---
function openAddChannelPanel() {
    const panel = document.getElementById('channels-add-panel');
    const activeNames = new Set(channelsData.filter(c => c.active).map(c => c.name));
    const available = channelsData.filter(c => !activeNames.has(c.name));

    const content = document.getElementById('channels-content');
    if (activeNames.size === 0 && content) content.classList.add('hidden');

    if (available.length === 0) {
        panel.innerHTML = `<div class="bg-white dark:bg-[#1A1A1A] rounded-xl border border-slate-200 dark:border-white/10 p-6 text-center">
            <p class="text-sm text-slate-500 dark:text-slate-400">${currentLang === 'zh' ? '所有通道均已接入' : 'All channels are already connected'}</p>
            <button onclick="closeAddChannelPanel()" class="mt-3 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">${t('channels_cancel')}</button>
        </div>`;
        panel.classList.remove('hidden');
        return;
    }

    const ddOptions = [
        { value: '', label: t('channels_select_placeholder') },
        ...available.map(ch => {
            const label = (typeof ch.label === 'object') ? (ch.label[currentLang] || ch.label.en) : ch.label;
            return { value: ch.name, label: `${label} (${ch.name})` };
        })
    ];

    panel.innerHTML = `
        <div class="bg-white dark:bg-[#1A1A1A] rounded-xl border border-primary-200 dark:border-primary-800 p-6">
            <div class="flex items-center gap-3 mb-5">
                <div class="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                    <i class="fas fa-plus text-primary-500 text-sm"></i>
                </div>
                <h3 class="font-semibold text-slate-800 dark:text-slate-100">${t('channels_add')}</h3>
            </div>
            <div class="mb-4">
                <div id="add-channel-select" class="cfg-dropdown" tabindex="0">
                    <div class="cfg-dropdown-selected">
                        <span class="cfg-dropdown-text">--</span>
                        <i class="fas fa-chevron-down cfg-dropdown-arrow"></i>
                    </div>
                    <div class="cfg-dropdown-menu"></div>
                </div>
            </div>
            <div id="add-channel-fields" class="space-y-4"></div>
            <div id="add-channel-actions" class="hidden flex items-center justify-end gap-3 pt-4">
                <button onclick="closeAddChannelPanel()"
                    class="px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10
                           text-slate-600 dark:text-slate-300 text-sm font-medium
                           hover:bg-slate-50 dark:hover:bg-white/5
                           cursor-pointer transition-colors duration-150">${t('channels_cancel')}</button>
                <button id="add-channel-submit" onclick="submitAddChannel()"
                    class="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium
                           cursor-pointer transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed">${t('channels_connect_btn')}</button>
            </div>
        </div>`;
    panel.classList.remove('hidden');
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    const ddEl = document.getElementById('add-channel-select');
    initDropdown(ddEl, ddOptions, '', onAddChannelSelect);
}

function closeAddChannelPanel() {
    stopWeixinQrPoll();
    stopFeishuRegisterPoll();
    const panel = document.getElementById('channels-add-panel');
    if (panel) {
        panel.classList.add('hidden');
        panel.innerHTML = '';
    }
    const content = document.getElementById('channels-content');
    if (content) content.classList.remove('hidden');
}

function onAddChannelSelect(chName) {
    stopWeixinQrPoll();
    stopFeishuRegisterPoll();
    const fieldsContainer = document.getElementById('add-channel-fields');
    const actions = document.getElementById('add-channel-actions');

    if (!chName) {
        fieldsContainer.innerHTML = '';
        actions.classList.add('hidden');
        return;
    }

    if (chName === 'weixin') {
        actions.classList.add('hidden');
        fieldsContainer.innerHTML = `
            <div id="weixin-qr-panel" class="flex flex-col items-center py-4">
                <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">${t('weixin_scan_loading')}</p>
            </div>`;
        startWeixinQrLogin();
        return;
    }

    if (chName === 'wecom_bot') {
        actions.classList.add('hidden');
        const ch = channelsData.find(c => c.name === chName);
        fieldsContainer.innerHTML = buildWecomBotPanel(ch);
        return;
    }

    if (chName === 'feishu') {
        actions.classList.add('hidden');
        const ch = channelsData.find(c => c.name === chName);
        fieldsContainer.innerHTML = buildFeishuPanel(ch);
        return;
    }

    const ch = channelsData.find(c => c.name === chName);
    if (!ch) return;

    fieldsContainer.innerHTML = buildChannelFieldsHtml(chName, ch.fields || []);
    bindSecretFieldEvents(fieldsContainer);
    actions.classList.remove('hidden');
}

function submitAddChannel() {
    const ddEl = document.getElementById('add-channel-select');
    const chName = getDropdownValue(ddEl);
    if (!chName) return;

    const fieldsContainer = document.getElementById('add-channel-fields');
    const updates = {};
    fieldsContainer.querySelectorAll('input[data-ch="' + chName + '"]').forEach(inp => {
        const key = inp.dataset.field;
        if (inp.type === 'checkbox') {
            updates[key] = inp.checked;
        } else {
            if (inp.dataset.masked === '1') return;
            updates[key] = inp.value;
        }
    });

    const btn = document.getElementById('add-channel-submit');
    if (btn) { btn.disabled = true; btn.textContent = t('channels_connecting'); }

    fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect', channel: chName, config: updates })
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === 'success') {
            const ch = channelsData.find(c => c.name === chName);
            if (ch) {
                ch.active = true;
                (ch.fields || []).forEach(f => {
                    if (updates[f.key] !== undefined) {
                        f.value = f.type === 'secret' ? ChannelsHandler_maskSecret(updates[f.key]) : updates[f.key];
                    }
                });
            }
            renderActiveChannels();
        } else {
            if (btn) { btn.disabled = false; btn.textContent = t('channels_connect_btn'); }
        }
    })
    .catch(() => {
        if (btn) { btn.disabled = false; btn.textContent = t('channels_connect_btn'); }
    });
}

// =====================================================================
// WeChat QR Login
// =====================================================================
let _weixinQrPollTimer = null;
let _weixinStatusPollTimer = null;

function stopWeixinStatusPoll() {
    if (_weixinStatusPollTimer) {
        clearTimeout(_weixinStatusPollTimer);
        _weixinStatusPollTimer = null;
    }
}

function startWeixinActiveStatusPoll() {
    stopWeixinStatusPoll();
    _weixinStatusPollTimer = setTimeout(() => {
        fetch('/api/channels').then(r => r.json()).then(data => {
            if (data.status !== 'success') return;
            const wx = (data.channels || []).find(c => c.name === 'weixin');
            if (!wx || !wx.active) return;
            if (wx.login_status === 'logged_in') {
                channelsData = data.channels;
                renderActiveChannels();
            } else {
                const ch = channelsData.find(c => c.name === 'weixin');
                if (ch) ch.login_status = wx.login_status;
                startWeixinActiveStatusPoll();
            }
        }).catch(() => { startWeixinActiveStatusPoll(); });
    }, 3000);
}

function showWeixinActiveQr() {
    const container = document.getElementById('weixin-active-qr');
    if (!container) return;
    container.innerHTML = `
        <div id="weixin-qr-panel" class="flex flex-col items-center py-2">
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">${t('weixin_scan_loading')}</p>
        </div>`;
    stopWeixinStatusPoll();
    startWeixinQrLogin();
}

function stopWeixinQrPoll() {
    if (_weixinQrPollTimer) {
        clearTimeout(_weixinQrPollTimer);
        _weixinQrPollTimer = null;
    }
}

function startWeixinQrLogin() {
    stopWeixinQrPoll();
    fetch('/api/weixin/qrlogin')
        .then(r => r.json())
        .then(data => {
            const panel = document.getElementById('weixin-qr-panel');
            if (!panel) return;
            if (data.status !== 'success') {
                panel.innerHTML = `<p class="text-sm text-red-500">${t('weixin_scan_fail')}: ${data.message || ''}</p>`;
                return;
            }
            renderWeixinQr(data.qr_image || data.qrcode_url, 'waiting');
            if (data.source === 'channel') {
                startWeixinActiveStatusPoll();
            } else {
                pollWeixinQrStatus();
            }
        })
        .catch(() => {
            const panel = document.getElementById('weixin-qr-panel');
            if (panel) panel.innerHTML = `<p class="text-sm text-red-500">${t('weixin_scan_fail')}</p>`;
        });
}

function renderWeixinQr(qrcodeUrl, status) {
    const panel = document.getElementById('weixin-qr-panel');
    if (!panel) return;

    let statusText = t('weixin_scan_waiting');
    let statusColor = 'text-slate-500 dark:text-slate-400';
    if (status === 'scanned') {
        statusText = t('weixin_scan_scanned');
        statusColor = 'text-primary-500';
    } else if (status === 'expired') {
        statusText = t('weixin_scan_expired');
        statusColor = 'text-amber-500';
    } else if (status === 'confirmed') {
        statusText = t('weixin_scan_success');
        statusColor = 'text-primary-500';
    }

    panel.innerHTML = `
        <div class="flex flex-col items-center">
            <p class="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">${t('weixin_scan_title')}</p>
            <p class="text-xs text-slate-400 dark:text-slate-500 mb-4">${t('weixin_scan_desc')}</p>
            <div class="bg-white p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 mb-3">
                <img src="${escapeHtml(qrcodeUrl)}" alt="QR Code" class="w-52 h-52" style="image-rendering: pixelated;"/>
            </div>
            <p class="text-xs ${statusColor} mb-1">${statusText}</p>
            <p class="text-xs text-slate-400 dark:text-slate-500">${t('weixin_qr_tip')}</p>
        </div>`;
}

function pollWeixinQrStatus() {
    _weixinQrPollTimer = setTimeout(() => {
        fetch('/api/weixin/qrlogin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'poll' })
        })
        .then(r => r.json())
        .then(data => {
            const panel = document.getElementById('weixin-qr-panel');
            if (!panel) { stopWeixinQrPoll(); return; }

            if (data.status !== 'success') {
                pollWeixinQrStatus();
                return;
            }

            const qrStatus = data.qr_status;
            if (qrStatus === 'confirmed') {
                renderWeixinQr('', 'confirmed');
                panel.innerHTML = `
                    <div class="flex flex-col items-center py-4">
                        <div class="w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-3">
                            <i class="fas fa-check text-primary-500 text-lg"></i>
                        </div>
                        <p class="text-sm font-medium text-primary-600 dark:text-primary-400">${t('weixin_scan_success')}</p>
                    </div>`;
                connectWeixinAfterQr();
            } else if (qrStatus === 'expired' && (data.qr_image || data.qrcode_url)) {
                renderWeixinQr(data.qr_image || data.qrcode_url, 'waiting');
                pollWeixinQrStatus();
            } else if (qrStatus === 'scaned') {
                const img = panel.querySelector('img');
                const currentSrc = img ? img.src : '';
                renderWeixinQr(currentSrc, 'scanned');
                pollWeixinQrStatus();
            } else {
                pollWeixinQrStatus();
            }
        })
        .catch(() => {
            pollWeixinQrStatus();
        });
    }, 2000);
}

function connectWeixinAfterQr() {
    fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect', channel: 'weixin', config: {} })
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === 'success') {
            const ch = channelsData.find(c => c.name === 'weixin');
            if (ch) ch.active = true;
            setTimeout(() => renderActiveChannels(), 1500);
        }
    })
    .catch(() => {});
}

// =====================================================================
// WeCom Bot QR Auth
// =====================================================================
// NOTE: This is the only remaining external script in the Web Console.
// Tencent's WeCom Bot SDK must be loaded from their official CDN — it
// performs runtime origin/signature checks and will not work if
// self-hosted. The SDK is fetched lazily, only when the user opens the
// "WeCom Bot" channel QR-login flow, so the rest of the console works
// fully offline.
const WECOM_BOT_SDK_URL = 'https://wwcdn.weixin.qq.com/node/wework/js/wecom-aibot-sdk@0.1.0.min.js';
const WECOM_BOT_SOURCE = 'cowagent';
let _wecomSdkLoaded = false;

function ensureWecomSdkLoaded() {
    return new Promise((resolve, reject) => {
        if (_wecomSdkLoaded && window.WecomAIBotSDK) { resolve(); return; }
        if (document.querySelector(`script[src="${WECOM_BOT_SDK_URL}"]`)) {
            _wecomSdkLoaded = true; resolve(); return;
        }
        const s = document.createElement('script');
        s.src = WECOM_BOT_SDK_URL;
        s.onload = () => { _wecomSdkLoaded = true; resolve(); };
        s.onerror = () => reject(new Error('Failed to load WecomAIBotSDK'));
        document.head.appendChild(s);
    });
}

function _wecomBotHasCreds(ch) {
    if (!ch || !ch.fields) return false;
    const idField = ch.fields.find(f => f.key === 'wecom_bot_id');
    const secretField = ch.fields.find(f => f.key === 'wecom_bot_secret');
    return !!(idField && idField.value && secretField && secretField.value);
}

function buildWecomBotPanel(ch) {
    const scanLabel = t('wecom_mode_scan');
    const manualLabel = t('wecom_mode_manual');
    const hasCreds = _wecomBotHasCreds(ch);
    const defaultMode = hasCreds ? 'manual' : 'scan';
    return `
        <div id="wecom-bot-panel" data-default-mode="${defaultMode}">
            <div class="flex items-center justify-center gap-1 mb-5 bg-slate-100 dark:bg-white/5 rounded-lg p-1">
                <button id="wecom-tab-scan" onclick="switchWecomBotMode('scan')"
                    class="flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                           bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm">
                    ${scanLabel}
                </button>
                <button id="wecom-tab-manual" onclick="switchWecomBotMode('manual')"
                    class="flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                           text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                    ${manualLabel}
                </button>
            </div>
            <div id="wecom-mode-content"></div>
        </div>`;
}

function switchWecomBotMode(mode) {
    const scanTab = document.getElementById('wecom-tab-scan');
    const manualTab = document.getElementById('wecom-tab-manual');
    const content = document.getElementById('wecom-mode-content');
    const actions = document.getElementById('add-channel-actions');
    if (!scanTab || !manualTab || !content) return;

    const activeClasses = 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm';
    const inactiveClasses = 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200';

    if (mode === 'scan') {
        scanTab.className = scanTab.className.replace(/text-slate-500[^\s]*/g, '').replace(/hover:\S+/g, '');
        scanTab.className = `flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeClasses}`;
        manualTab.className = `flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${inactiveClasses}`;
        actions.classList.add('hidden');
        content.innerHTML = `
            <div class="flex flex-col items-center py-4">
                <p class="text-sm text-slate-600 dark:text-slate-300 mb-2">${t('wecom_scan_desc')}</p>
                <button onclick="startWecomBotAuth()"
                    class="mt-3 px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium
                           cursor-pointer transition-colors duration-150">
                    <i class="fas fa-qrcode mr-2"></i>${t('wecom_scan_btn')}
                </button>
                <div id="wecom-scan-status" class="mt-3"></div>
            </div>`;
    } else {
        manualTab.className = `flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeClasses}`;
        scanTab.className = `flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${inactiveClasses}`;
        const ch = channelsData.find(c => c.name === 'wecom_bot');
        content.innerHTML = `<div class="space-y-4">${buildChannelFieldsHtml('wecom_bot', ch ? ch.fields || [] : [])}</div>`;
        bindSecretFieldEvents(content);
        actions.classList.remove('hidden');
    }
}

function startWecomBotAuth() {
    const statusEl = document.getElementById('wecom-scan-status');
    ensureWecomSdkLoaded().then(() => {
        WecomAIBotSDK.openBotInfoAuthWindow({
            source: WECOM_BOT_SOURCE,
            onCreated: function(bot) {
                if (statusEl) {
                    statusEl.innerHTML = `
                        <div class="flex flex-col items-center py-2">
                            <div class="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-2">
                                <i class="fas fa-check text-emerald-500 text-lg"></i>
                            </div>
                            <p class="text-sm font-medium text-emerald-600 dark:text-emerald-400">${t('wecom_scan_success')}</p>
                        </div>`;
                }
                connectWecomBotAfterAuth(bot.botid, bot.secret);
            },
            onError: function(err) {
                if (statusEl) {
                    statusEl.innerHTML = `<p class="text-sm text-red-500">${t('wecom_scan_fail')}: ${err.message || err.code || ''}</p>`;
                }
            }
        });
    }).catch(err => {
        if (statusEl) {
            statusEl.innerHTML = `<p class="text-sm text-red-500">SDK load failed: ${err.message}</p>`;
        }
    });
}

function connectWecomBotAfterAuth(botId, secret) {
    fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'connect',
            channel: 'wecom_bot',
            config: { wecom_bot_id: botId, wecom_bot_secret: secret }
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === 'success') {
            const ch = channelsData.find(c => c.name === 'wecom_bot');
            if (ch) {
                ch.active = true;
                (ch.fields || []).forEach(f => {
                    if (f.key === 'wecom_bot_id') f.value = botId;
                    if (f.key === 'wecom_bot_secret') f.value = ChannelsHandler_maskSecret(secret);
                });
            }
            setTimeout(() => renderActiveChannels(), 1500);
        }
    })
    .catch(() => {});
}

function startWecomBotAuthInCard() {
    const statusEl = document.getElementById('wecom-card-scan-status');
    ensureWecomSdkLoaded().then(() => {
        WecomAIBotSDK.openBotInfoAuthWindow({
            source: WECOM_BOT_SOURCE,
            onCreated: function(bot) {
                if (statusEl) {
                    statusEl.innerHTML = `
                        <div class="flex flex-col items-center py-2">
                            <div class="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-2">
                                <i class="fas fa-check text-emerald-500 text-lg"></i>
                            </div>
                            <p class="text-sm font-medium text-emerald-600 dark:text-emerald-400">${t('wecom_scan_success')}</p>
                        </div>`;
                }
                connectWecomBotAfterAuth(bot.botid, bot.secret);
            },
            onError: function(err) {
                if (statusEl) {
                    statusEl.innerHTML = `<p class="text-sm text-red-500">${t('wecom_scan_fail')}: ${err.message || err.code || ''}</p>`;
                }
            }
        });
    }).catch(err => {
        if (statusEl) {
            statusEl.innerHTML = `<p class="text-sm text-red-500">SDK load failed: ${err.message}</p>`;
        }
    });
}

// Initialize wecom bot panel with correct default mode when inserted into DOM
document.addEventListener('DOMContentLoaded', function() {
    const observer = new MutationObserver(function() {
        const wecomPanel = document.getElementById('wecom-bot-panel');
        if (wecomPanel && !wecomPanel.dataset.initialized) {
            wecomPanel.dataset.initialized = '1';
            switchWecomBotMode(wecomPanel.dataset.defaultMode || 'scan');
        }
        const feishuPanel = document.getElementById('feishu-panel');
        if (feishuPanel && !feishuPanel.dataset.initialized) {
            feishuPanel.dataset.initialized = '1';
            switchFeishuMode(feishuPanel.dataset.defaultMode || 'scan');
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
});

// =====================================================================
// Feishu One-click App Registration (lark-oapi register_app)
// =====================================================================
let _feishuRegisterPollTimer = null;

function _feishuHasCreds(ch) {
    if (!ch || !ch.fields) return false;
    const idField = ch.fields.find(f => f.key === 'feishu_app_id');
    const secretField = ch.fields.find(f => f.key === 'feishu_app_secret');
    return !!(idField && idField.value && secretField && secretField.value);
}

function buildFeishuPanel(ch, isActive) {
    const scanLabel = t('feishu_mode_scan');
    const manualLabel = t('feishu_mode_manual');
    // 已有凭据时默认进入手动 Tab，方便修改；否则推荐扫码
    const defaultMode = _feishuHasCreds(ch) ? 'manual' : 'scan';
    const activeAttr = isActive ? 'data-active="1"' : '';
    return `
        <div id="feishu-panel" data-default-mode="${defaultMode}" ${activeAttr}>
            <div class="flex items-center justify-center gap-1 mb-5 bg-slate-100 dark:bg-white/5 rounded-lg p-1">
                <button id="feishu-tab-scan" onclick="switchFeishuMode('scan')"
                    class="flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                           bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm">
                    ${scanLabel}
                </button>
                <button id="feishu-tab-manual" onclick="switchFeishuMode('manual')"
                    class="flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                           text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                    ${manualLabel}
                </button>
            </div>
            <div id="feishu-mode-content"></div>
        </div>`;
}

function switchFeishuMode(mode) {
    const panel = document.getElementById('feishu-panel');
    const scanTab = document.getElementById('feishu-tab-scan');
    const manualTab = document.getElementById('feishu-tab-manual');
    const content = document.getElementById('feishu-mode-content');
    if (!scanTab || !manualTab || !content) return;

    // 已激活通道卡片中嵌入此 panel 时，没有 add-channel-actions（保存按钮就近渲染）
    const isActive = panel && panel.dataset.active === '1';
    const actions = isActive ? null : document.getElementById('add-channel-actions');

    const activeClasses = 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm';
    const inactiveClasses = 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200';

    stopFeishuRegisterPoll();

    if (mode === 'scan') {
        scanTab.className = `flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeClasses}`;
        manualTab.className = `flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${inactiveClasses}`;
        if (actions) actions.classList.add('hidden');
        // active 卡片下扫码替换的提示文案，强调"创建新机器人会覆盖现有配置"
        const desc = isActive
            ? t('feishu_scan_replace_desc')
            : t('feishu_scan_desc');
        content.innerHTML = `
            <div id="feishu-scan-panel" class="flex flex-col items-center py-4">
                <p class="text-sm text-slate-600 dark:text-slate-300 mb-3 text-center">${desc}</p>
                <button onclick="startFeishuRegister()"
                    class="mt-2 px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium
                           cursor-pointer transition-colors duration-150">
                    <i class="fas fa-qrcode mr-2"></i>${t('feishu_scan_btn')}
                </button>
                <div id="feishu-scan-status" class="mt-4 w-full"></div>
            </div>`;
    } else {
        manualTab.className = `flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeClasses}`;
        scanTab.className = `flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${inactiveClasses}`;
        const ch = channelsData.find(c => c.name === 'feishu');
        const fieldsHtml = buildChannelFieldsHtml('feishu', ch ? ch.fields || [] : []);
        if (isActive) {
            // 已接入卡片：内置保存按钮，复用 saveChannelConfig 走 update 流程
            content.innerHTML = `
                <div class="space-y-4">
                    ${fieldsHtml}
                    <div class="flex items-center justify-end gap-3 pt-1">
                        <span id="ch-status-feishu" class="text-xs text-primary-500 opacity-0 transition-opacity duration-300"></span>
                        <button onclick="saveChannelConfig('feishu')"
                            class="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium
                                   cursor-pointer transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            id="ch-save-feishu">${t('channels_save')}</button>
                    </div>
                </div>`;
        } else {
            content.innerHTML = `<div class="space-y-4">${fieldsHtml}</div>`;
            if (actions) actions.classList.remove('hidden');
        }
        bindSecretFieldEvents(content);
    }
}

function stopFeishuRegisterPoll() {
    if (_feishuRegisterPollTimer) {
        clearTimeout(_feishuRegisterPollTimer);
        _feishuRegisterPollTimer = null;
    }
}

function startFeishuRegister(targetStatusId) {
    const statusId = targetStatusId || 'feishu-scan-status';
    const statusEl = document.getElementById(statusId);
    if (statusEl) {
        statusEl.innerHTML = `<p class="text-sm text-slate-500 dark:text-slate-400 text-center">${t('feishu_scan_loading')}</p>`;
    }
    stopFeishuRegisterPoll();
    fetch('/api/feishu/register')
        .then(r => r.json())
        .then(data => {
            if (data.status !== 'success') {
                renderFeishuRegisterError(statusId, data.message || t('feishu_scan_fail'));
                return;
            }
            renderFeishuQr(statusId, data.qr_image, data.qrcode_url);
            pollFeishuRegisterStatus(statusId);
        })
        .catch(err => {
            renderFeishuRegisterError(statusId, err.message || t('feishu_scan_fail'));
        });
}

function renderFeishuQr(statusId, qrImage, qrUrl) {
    const statusEl = document.getElementById(statusId);
    if (!statusEl) return;
    const imgHtml = qrImage
        ? `<img src="${qrImage}" alt="QR" class="w-44 h-44 rounded-lg border border-slate-200 dark:border-white/10 bg-white p-2"/>`
        : `<div class="w-44 h-44 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400">QR</div>`;
    statusEl.innerHTML = `
        <div class="flex flex-col items-center gap-3">
            ${imgHtml}
            <p class="text-xs text-amber-500">${t('feishu_scan_waiting')}</p>
            <p class="text-xs text-slate-400 dark:text-slate-500">${t('feishu_scan_tip')}</p>
            ${qrUrl ? `<a href="${qrUrl}" target="_blank" rel="noopener"
                class="text-xs text-blue-500 hover:text-blue-600 underline">${t('feishu_scan_open_link')}</a>` : ''}
        </div>`;
}

function renderFeishuRegisterError(statusId, message) {
    const statusEl = document.getElementById(statusId);
    if (!statusEl) return;
    statusEl.innerHTML = `
        <div class="flex flex-col items-center gap-2 py-2">
            <p class="text-sm text-red-500 text-center">${message}</p>
            <button onclick="startFeishuRegister('${statusId}')"
                class="mt-1 px-4 py-1.5 rounded-md text-xs font-medium
                       bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200
                       hover:bg-slate-200 dark:hover:bg-white/20 cursor-pointer">
                <i class="fas fa-rotate-right mr-1"></i>${t('feishu_scan_retry')}
            </button>
        </div>`;
}

function pollFeishuRegisterStatus(statusId) {
    stopFeishuRegisterPoll();
    _feishuRegisterPollTimer = setTimeout(() => {
        fetch('/api/feishu/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'poll' })
        })
        .then(r => r.json())
        .then(data => {
            if (data.status !== 'success') {
                renderFeishuRegisterError(statusId, data.message || t('feishu_scan_fail'));
                return;
            }
            const rs = data.register_status;
            if (rs === 'done') {
                const statusEl = document.getElementById(statusId);
                if (statusEl) {
                    statusEl.innerHTML = `
                        <div class="flex flex-col items-center py-2">
                            <div class="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-2">
                                <i class="fas fa-check text-emerald-500 text-lg"></i>
                            </div>
                            <p class="text-sm font-medium text-emerald-600 dark:text-emerald-400">${t('feishu_scan_success')}</p>
                        </div>`;
                }
                connectFeishuAfterRegister(data.app_id, data.app_secret);
            } else if (rs === 'expired') {
                renderFeishuRegisterError(statusId, t('feishu_scan_expired'));
            } else if (rs === 'denied') {
                renderFeishuRegisterError(statusId, t('feishu_scan_denied'));
            } else if (rs === 'error') {
                renderFeishuRegisterError(statusId, data.message || t('feishu_scan_fail'));
            } else {
                pollFeishuRegisterStatus(statusId);
            }
        })
        .catch(() => {
            pollFeishuRegisterStatus(statusId);
        });
    }, 2000);
}

function connectFeishuAfterRegister(appId, appSecret) {
    fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'connect',
            channel: 'feishu',
            config: { feishu_app_id: appId, feishu_app_secret: appSecret }
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === 'success') {
            const ch = channelsData.find(c => c.name === 'feishu');
            if (ch) {
                ch.active = true;
                (ch.fields || []).forEach(f => {
                    if (f.key === 'feishu_app_id') f.value = appId;
                    if (f.key === 'feishu_app_secret') f.value = ChannelsHandler_maskSecret(appSecret);
                });
            }
            setTimeout(() => renderActiveChannels(), 1500);
        }
    })
    .catch(() => {});
}

// =====================================================================
// Scheduler View
// =====================================================================
let tasksLoaded = false;
function refreshTasksView() {
    const btn = document.getElementById('task-refresh-btn');
    const icon = btn.querySelector('i');
    
    // Add spin animation
    icon.classList.add('fa-spin');
    btn.disabled = true;
    
    tasksLoaded = false;
    const listEl = document.getElementById('tasks-list');
    listEl.innerHTML = '';
    
    loadTasksView();
    
    // Restore button after animation ends
    setTimeout(() => {
        icon.classList.remove('fa-spin');
        btn.disabled = false;
    }, 500);
}
function loadTasksView() {
    if (tasksLoaded) return;
    fetch('/api/scheduler').then(r => r.json()).then(data => {
        if (data.status !== 'success') return;
        const emptyEl = document.getElementById('tasks-empty');
        const listEl = document.getElementById('tasks-list');
        const allTasks = data.tasks || [];
        // Backend already sorted by enabled and next_run_at, no need to re-sort on frontend
        if (allTasks.length === 0) {
            emptyEl.querySelector('p').textContent = currentLang === 'zh' ? '暂无定时任务' : 'No scheduled tasks';
            emptyEl.classList.remove('hidden');
            listEl.classList.add('hidden');
            tasksLoaded = true;
            return;
        }
        emptyEl.classList.add('hidden');
        listEl.classList.remove('hidden');
        listEl.innerHTML = '';

        allTasks.forEach(task => {
            const isEnabled = task.enabled !== false;
            const card = document.createElement('div');
            card.className = 'bg-white dark:bg-[#1A1A1A] rounded-xl border border-slate-200 dark:border-white/10 p-4';
            card.dataset.taskId = task.id;
            if (!isEnabled) card.classList.add('opacity-50');
            const schedule = task.schedule || {};
            let typeLabel = '';
            if (schedule.type === 'cron') {
                typeLabel = `<span class="text-xs font-mono text-slate-400">${escapeHtml(schedule.expression || '')}</span>`;
            } else if (schedule.type === 'interval') {
                const seconds = schedule.seconds || 0;
                const hours = Math.floor(seconds / 3600);
                const mins = Math.floor((seconds % 3600) / 60);
                const secs = seconds % 60;
                let intervalText = [];
                if (hours > 0) intervalText.push(`${hours}h`);
                if (mins > 0) intervalText.push(`${mins}m`);
                if (secs > 0 || intervalText.length === 0) intervalText.push(`${secs}s`);
                typeLabel = `<span class="text-xs text-slate-400">${intervalText.join(' ')}</span>`;
            } else {
                typeLabel = `<span class="text-xs text-slate-400">${escapeHtml(schedule.type || 'once')}</span>`;
            }
            let nextRun = '--';
            if (task.next_run_at) {
                const d = new Date(task.next_run_at);
                if (!isNaN(d.getTime())) nextRun = d.toLocaleString();
            }
            const action = task.action || {};
            const taskContent = action.content || action.task_description || '';
            const toggleId = 'toggle-' + task.id;
            card.innerHTML = `
                <div class="flex items-center gap-2 mb-2">
                    <span class="w-2 h-2 rounded-full ${isEnabled ? 'bg-primary-400' : 'bg-slate-300 dark:bg-slate-600'}"></span>
                    <span class="font-medium text-sm text-slate-700 dark:text-slate-200">${escapeHtml(task.name || task.id || '--')}</span>
                    <div class="flex-1"></div>
                    ${typeLabel}
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">${escapeHtml(taskContent)}</p>
                <div class="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                    <span><i class="fas fa-clock mr-1"></i>${currentLang === 'zh' ? '下次执行' : 'Next run'}: ${nextRun}</span>
                    <div class="flex-1"></div>
                    <label class="relative inline-flex items-center cursor-pointer" for="${toggleId}">
                        <input type="checkbox" id="${toggleId}" class="sr-only peer" ${isEnabled ? 'checked' : ''}>
                        <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500 dark:bg-slate-600 dark:peer-checked:bg-primary-500"></div>
                    </label>
                </div>`;
            const checkbox = card.querySelector('#' + toggleId);
            checkbox.addEventListener('change', function() {
                const newEnabled = this.checked;
                fetch('/api/scheduler/toggle', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({task_id: task.id, enabled: newEnabled})
                }).then(r => r.json()).then(res => {
                    if (res.status === 'success') {
                        const dot = card.querySelector('.rounded-full.w-2');
                        if (newEnabled) {
                            card.classList.remove('opacity-50');
                            if (dot) { dot.classList.remove('bg-slate-300','dark:bg-slate-600'); dot.classList.add('bg-primary-400'); }
                        } else {
                            card.classList.add('opacity-50');
                            if (dot) { dot.classList.remove('bg-primary-400'); dot.classList.add('bg-slate-300','dark:bg-slate-600'); }
                        }
                    } else {
                        this.checked = !newEnabled;
                    }
                }).catch(() => { this.checked = !newEnabled; });
            });
            // Card click event (excluding toggle switch clicks)
            card.addEventListener('click', function(e) {
                if (!e.target.closest('label') && !e.target.closest('input[type="checkbox"]')) {
                    openTaskEditModal(task);
                }
            });
            card.style.cursor = 'pointer';
            listEl.appendChild(card);
        });
        tasksLoaded = true;
    }).catch(() => {});
}

// =====================================================================
// Logs View
// =====================================================================
let logEventSource = null;

function logLevelClass(line) {
    if (/\[CRITICAL\]/.test(line)) return 'log-line-critical';
    if (/\[ERROR\]/.test(line))    return 'log-line-error';
    if (/\[WARNING\]/.test(line))  return 'log-line-warning';
    if (/\[INFO\]/.test(line))     return 'log-line-info';
    if (/\[DEBUG\]/.test(line))    return 'log-line-debug';
    return '';
}

function getHiddenLevels() {
    const hidden = new Set();
    document.querySelectorAll('.log-filter-cb').forEach(function(cb) {
        if (!cb.checked) hidden.add('log-line-' + cb.dataset.level);
    });
    return hidden;
}

function applyLogFilter() {
    const hidden = getHiddenLevels();
    document.querySelectorAll('#log-output .log-line').forEach(function(span) {
        const level = span.classList[1] || '';
        span.style.display = hidden.has(level) ? 'none' : '';
    });
}

function appendLogLines(output, text) {
    const hidden = getHiddenLevels();
    let lastLevelClass = '';
    const lines = text.split('\n');
    lines.forEach(function(line, i) {
        if (i === lines.length - 1 && line === '') return;
        const span = document.createElement('span');
        const levelClass = logLevelClass(line) || lastLevelClass;
        if (logLevelClass(line)) lastLevelClass = levelClass;
        span.className = 'log-line ' + levelClass;
        span.textContent = line + '\n';
        if (hidden.has(levelClass)) span.style.display = 'none';
        output.appendChild(span);
    });
}

document.addEventListener('change', function(e) {
    if (e.target.classList.contains('log-filter-cb')) applyLogFilter();
});

function startLogStream() {
    if (logEventSource) return;
    const output = document.getElementById('log-output');
    output.innerHTML = '';

    logEventSource = new EventSource('/api/logs');
    logEventSource.onmessage = function(e) {
        let item;
        try { item = JSON.parse(e.data); } catch (_) { return; }

        if (item.type === 'init') {
            output.innerHTML = '';
            appendLogLines(output, item.content || '');
            output.scrollTop = output.scrollHeight;
        } else if (item.type === 'line') {
            appendLogLines(output, item.content);
            output.scrollTop = output.scrollHeight;
        } else if (item.type === 'error') {
            output.textContent = item.message || 'Error loading logs';
        }
    };
    logEventSource.onerror = function() {
        logEventSource.close();
        logEventSource = null;
    };
}

function stopLogStream() {
    if (logEventSource) {
        logEventSource.close();
        logEventSource = null;
    }
}

// =====================================================================
// View Navigation Hook
// =====================================================================
const _origNavigateTo = navigateTo;
navigateTo = function(viewId) {
    // 企微用户视图访问控制
    if (!_wecomCanAccess(viewId)) {
        // 不允许访问，跳转到可访问的第一个页面
        var allowedView = 'chat';
        if (_wecomOpenPages.length > 0) {
            allowedView = _wecomOpenPages[0];
        }
        if (viewId !== allowedView) {
            _origNavigateTo(allowedView);
            // 更新侧边栏高亮
            document.querySelectorAll('.sidebar-item').forEach(function(item) {
                item.classList.toggle('active', item.dataset.view === allowedView);
            });
            currentView = allowedView;
            return;
        }
        return; // 防御：如果 allowedView 也被拒绝则静默失败
    }

    // Stop log stream when leaving logs view
    if (currentView === 'logs' && viewId !== 'logs') stopLogStream();

    _origNavigateTo(viewId);

    // Lazy-load view data
    if (viewId === 'config') loadConfigView();
    else if (viewId === 'models') loadModelsView();
    else if (viewId === 'skills') loadSkillsView();
    else if (viewId === 'memory') {
        document.getElementById('memory-panel-viewer').classList.add('hidden');
        document.getElementById('memory-panel-list').classList.remove('hidden');
        switchMemoryTab('files');
    }
    else if (viewId === 'knowledge') loadKnowledgeView();
    else if (viewId === 'channels') loadChannelsView();
    else if (viewId === 'tasks') loadTasksView();
    else if (viewId === 'logs') startLogStream();
    else if (viewId === 'permissions') {
        // Initialize permissions view - load default tab data
        if (typeof switchPermissionsTab === 'function') {
            switchPermissionsTab('knowledge');
        }
    }
    else if (viewId === 'overdue') loadOverduePage();
};


// =====================================================================
// Kingdee Kanban View
// =====================================================================
let _kanbanCurrentForm = 'SAL_SaleOrder';
let _kanbanColumns = [];
let _kanbanViewMode = 'kanban';  // kanban | table | pie | bar | line
let _kanbanChartInstance = null;
let _kanbanChartAmountInstance = null;
let _kanbanAllData = null;  // cached raw data for re-render
let _kanbanIsConversionMode = false;  // true when "转换统计" tab is active
let _kanbanIsOverdueMode = false;     // true when "逾期统计" tab is active
let _kanbanOverdueData = null;        // cached overdue data
let _kanbanOverdueCustomerFilter = ''; // customer drill-down filter
let _kanbanHashNavigation = false;    // true during hash-initiated navigation (skip loadKanbanView)

function _kanbanBuildUrl() {
    var params = 'form_id=' + encodeURIComponent(_kanbanCurrentForm) + '&days=30';
    var dateFrom = document.getElementById('kanban-date-from');
    var dateTo = document.getElementById('kanban-date-to');
    var searchInput = document.getElementById('kanban-search');
    if (dateFrom && dateFrom.value) params += '&start_date=' + encodeURIComponent(dateFrom.value);
    if (dateTo && dateTo.value) params += '&end_date=' + encodeURIComponent(dateTo.value);
    if (searchInput && searchInput.value.trim()) params += '&search=' + encodeURIComponent(searchInput.value.trim());
    return '/api/kingdee/kanban?' + params;
}

// ── 修复：默认日期选择框同步显示 ──
function _kanbanSetDefaultDates() {
    var dateFrom = document.getElementById('kanban-date-from');
    var dateTo = document.getElementById('kanban-date-to');
    var now = new Date();
    var today = now.toISOString().slice(0, 10);

    if (dateFrom && !dateFrom.value) {
        var past = new Date(now);
        past.setDate(past.getDate() - 30);
        dateFrom.value = past.toISOString().slice(0, 10);
    }
    if (dateTo && !dateTo.value) {
        dateTo.value = today;
    }
}

function loadKanbanView() {
    // 当 hash 导航正在进行时跳过（由 #kanban-conversion 入口触发）
    if (_kanbanHashNavigation) return;

    _kanbanSetDefaultDates();

    var board = document.getElementById('kanban-board');
    var tableContainer = document.getElementById('kanban-table-container');
    var chartContainer = document.getElementById('kanban-chart-container');
    var loading = document.getElementById('kanban-loading');
    var errorEl = document.getElementById('kanban-error');
    var errorMsg = document.getElementById('kanban-error-msg');
    var columnsEl = document.getElementById('kanban-columns');
    var conversionContainer = document.getElementById('kanban-conversion-container');
    var overdueContainer = document.getElementById('kanban-ar-overdue-container');

    // Reset all mode flags when entering normal kanban
    _kanbanIsConversionMode = false;
    _kanbanIsOverdueMode = false;
    // Reset form to default when it's an internal mode
    if (_kanbanCurrentForm === 'conversion-stats' || _kanbanCurrentForm === 'ar-overdue') {
        _kanbanCurrentForm = 'SAL_SaleOrder';
    }

    // Hide conversion & overdue containers, show view mode tabs
    if (conversionContainer) conversionContainer.classList.add('hidden');
    if (overdueContainer) overdueContainer.classList.add('hidden');
    var viewModeParent = document.querySelector('.kanban-view-tab');
    if (viewModeParent) {
        var parent = viewModeParent.closest('.flex.items-center');
        if (parent) parent.classList.remove('hidden');
    }

    loading.classList.remove('hidden');
    if (board) board.classList.add('hidden');
    if (tableContainer) tableContainer.classList.add('hidden');
    if (chartContainer) chartContainer.classList.add('hidden');
    errorEl.classList.add('hidden');

    // Update form tab active state
    document.querySelectorAll('.kanban-tab').forEach(function(btn) {
        btn.classList.toggle('kanban-tab-active', btn.dataset.form === _kanbanCurrentForm);
    });

    // Update view mode tab active state
    document.querySelectorAll('.kanban-view-tab').forEach(function(btn) {
        btn.classList.toggle('kanban-view-active', btn.dataset.view === _kanbanViewMode);
    });

    fetch(_kanbanBuildUrl())
        .then(function(r) { return r.json(); })
        .then(function(data) {
            loading.classList.add('hidden');
            if (data.status !== 'success') {
                errorMsg.textContent = data.message || t('kanban_error');
                errorEl.classList.remove('hidden');
                return;
            }

            _kanbanAllData = data;
            _kanbanColumns = data.columns || [];
            var totalCount = data.total_count || 0;

            if (totalCount === 0) {
                if (_kanbanViewMode === 'kanban') {
                    columnsEl.innerHTML = '<div class="flex items-center justify-center w-full py-20 text-slate-400 dark:text-slate-500 text-sm">暂无数据</div>';
                    board.classList.remove('hidden');
                } else if (_kanbanViewMode === 'table') {
                    document.getElementById('kanban-table-body').innerHTML =
                        '<tr><td colspan="6" class="text-center py-12 text-slate-400 text-sm">暂无数据</td></tr>';
                    tableContainer.classList.remove('hidden');
                } else {
                    if (chartContainer) {
                        chartContainer.innerHTML = '<div class="flex items-center justify-center py-20 text-slate-400 text-sm">暂无数据</div>';
                        chartContainer.classList.remove('hidden');
                    }
                }
                return;
            }

            // Render based on current view mode
            if (_kanbanViewMode === 'kanban') {
                _renderKanbanBoard(columnsEl, board);
            } else if (_kanbanViewMode === 'table') {
                _renderKanbanTable(tableContainer);
            } else {
                _renderKanbanChart(chartContainer);
            }
        })
        .catch(function(err) {
            loading.classList.add('hidden');
            errorMsg.textContent = '网络错误: ' + (err.message || '未知错误');
            errorEl.classList.remove('hidden');
        });
}

function _renderKanbanBoard(columnsEl, board) {
    columnsEl.innerHTML = '';
    _kanbanColumns.forEach(function(col, _colIdx) {
        var colDiv = document.createElement('div');
        colDiv.className = 'flex-shrink-0 w-72';
        var accentColor = '';
        switch (col.cls) {
            case 'draft':    accentColor = '#94a3b8'; break;
            case 'pending':  accentColor = '#f59e0b'; break;
            case 'review':   accentColor = '#3b82f6'; break;
            case 'approved': accentColor = '#35A85B'; break;
            case 'rejected': accentColor = '#ef4444'; break;
        }
        var html = '<div class="bg-white dark:bg-[#1A1A1A] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">';
        html += '<div class="px-4 pt-3 pb-2" style="border-top: 3px solid ' + accentColor + '">';
        html += '  <div class="flex items-center justify-between">';
        html += '    <div class="flex items-center gap-2">';
        html += '      <span class="w-2.5 h-2.5 rounded-full" style="background:' + accentColor + '"></span>';
        html += '      <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">' + t(col.title) + '</span>';
        html += '    </div>';
        html += '    <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400">' + col.count + '</span>';
        html += '  </div>';
        if (col.total_amount > 0) {
            html += '  <div class="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">' +
                t('kanban_total') + ': <span class="font-semibold text-emerald-600 dark:text-emerald-400">¥' +
                Number(col.total_amount).toLocaleString('zh-CN', {minimumFractionDigits:2, maximumFractionDigits:2}) + '</span></div>';
        }
        html += '</div>';
        html += '<div class="border-t border-slate-100 dark:border-white/5"></div>';
        html += '<div class="kanban-column-body p-3 space-y-2">';
        col.cards.forEach(function(card) {
            var amountStr = card.amount
                ? '¥' + Number(card.amount).toLocaleString('zh-CN', {minimumFractionDigits:2, maximumFractionDigits:2})
                : '';
            var label = t(col.title);
            var name = escapeHtml(card.customer || '');
            var date = escapeHtml(card.date || card.create_date || '');
            var billNo = escapeHtml(card.bill_no);
            html += '<div class="kanban-card bg-slate-50 dark:bg-white/5 rounded-lg p-3 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-150"' +
                ' onclick="openKanbanDetail(\'' + billNo.replace(/'/g, "\\'") + '\')">' +
                '  <div class="flex items-start justify-between gap-2 mb-1">' +
                '    <span class="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">' + billNo + '</span>';
            if (amountStr) {
                html += '    <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">' + amountStr + '</span>';
            }
            html += '  </div>';
            if (name) {
                html += '  <p class="text-xs text-slate-500 dark:text-slate-400 truncate mb-1">' + name + '</p>';
            }
            html += '  <div class="flex items-center justify-between">' +
                '    <span class="text-[11px] text-slate-400 dark:text-slate-500">' + date + '</span>' +
                '    <div class="flex items-center gap-1">' +
                '      <span class="w-1.5 h-1.5 rounded-full" style="background:' + accentColor + '"></span>' +
                '      <span class="text-[10px] text-slate-400 dark:text-slate-500">' + label + '</span>' +
                '    </div>' +
                '  </div>' +
                '</div>';
        });
        html += '</div></div>';
        colDiv.innerHTML = html;
        columnsEl.appendChild(colDiv);
    });
    board.classList.remove('hidden');
}

function _renderKanbanTable(container) {
    container.classList.remove('hidden');
    var tbody = document.getElementById('kanban-table-body');
    var summary = document.getElementById('kanban-table-summary');
    var rows = [];
    var totalAmount = 0;
    _kanbanColumns.forEach(function(col) {
        col.cards.forEach(function(card) {
            rows.push(card);
            totalAmount += card.amount || 0;
        });
    });
    var STATUS_LABELS = {
        'Z': t('kanban_col_draft'),
        'A': t('kanban_col_pending'),
        'B': t('kanban_col_review'),
        'C': t('kanban_col_approved'),
        'D': t('kanban_col_rejected'),
    };
    var statusColors = {'Z':'#94a3b8','A':'#f59e0b','B':'#3b82f6','C':'#35A85B','D':'#ef4444'};
    tbody.innerHTML = rows.map(function(card) {
        var s = card.status || 'Z';
        var amt = card.amount ? '¥' + Number(card.amount).toLocaleString('zh-CN', {minimumFractionDigits:2, maximumFractionDigits:2}) : '';
        return '<tr class="cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" ' +
            'onclick="openKanbanDetail(\'' + escapeHtml(card.bill_no).replace(/'/g, "\\'") + '\')">' +
            '<td class="font-medium text-slate-700 dark:text-slate-200">' + escapeHtml(card.bill_no) + '</td>' +
            '<td class="text-slate-500">' + escapeHtml(card.customer) + '</td>' +
            '<td><span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full" style="background:' + (statusColors[s] || '#94a3b8') + '"></span><span class="text-slate-600 dark:text-slate-300">' + (STATUS_LABELS[s] || s) + '</span></span></td>' +
            '<td class="font-medium text-emerald-600 dark:text-emerald-400">' + amt + '</td>' +
            '<td class="text-slate-500">' + escapeHtml(card.creator) + '</td>' +
            '<td class="text-slate-400 text-[11px]">' + escapeHtml(card.date || card.create_date || '') + '</td>' +
            '</tr>';
    }).join('');
    summary.textContent = t('kanban_table_summary').replace('{count}', rows.length).replace('{amount}',
        totalAmount.toLocaleString('zh-CN', {minimumFractionDigits:2, maximumFractionDigits:2}));
}

// Chart.js data label plugin — draws values and percentages on charts
var _dataLabelPlugin = {
    id: 'customDataLabels',
    afterDraw: function(chart) {
        var ctx = chart.ctx;
        chart.data.datasets.forEach(function(dataset, i) {
            var meta = chart.getDatasetMeta(i);
            if (!meta || !meta.data) return;
            var isPie = chart.config.type === 'pie';
            var total = dataset.data.reduce(function(a, b) { return a + b; }, 0);
            meta.data.forEach(function(element, index) {
                var value = dataset.data[index];
                if (value === 0) return;
                var position = element.tooltipPosition();
                var label;
                if (isPie) {
                    var pct = total > 0 ? (value / total * 100) : 0;
                    label = pct >= 5 ? Math.round(pct) + '%' : '';
                } else {
                    label = value.toLocaleString('zh-CN');
                }
                if (!label) return;
                ctx.fillStyle = isPie ? '#ffffff' : '#475569';
                ctx.font = isPie ? 'bold 13px sans-serif' : '11px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                if (isPie) {
                    // Draw background pill for readability
                    var tw = ctx.measureText(label).width;
                    ctx.fillStyle = 'rgba(0,0,0,0.55)';
                    var rx = position.x, ry = position.y;
                    var r = 12;
                    // Rounded rect background
                    ctx.beginPath();
                    ctx.roundRect(rx - tw/2 - 6, ry - r, tw + 12, r * 2, 6);
                    ctx.fill();
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(label, rx, ry);
                } else {
                    ctx.fillText(label, position.x, position.y - 8);
                }
            });
        });
    }
};

function _renderKanbanChart(container) {
    container.classList.remove('hidden');
    // Destroy previous charts
    if (_kanbanChartInstance) { _kanbanChartInstance.destroy(); _kanbanChartInstance = null; }
    if (_kanbanChartAmountInstance) { _kanbanChartAmountInstance.destroy(); _kanbanChartAmountInstance = null; }

    // Format amount helper
    function fmtAmt(v) {
        return '¥' + Number(v || 0).toLocaleString('zh-CN', {minimumFractionDigits:2, maximumFractionDigits:2});
    }

    var labels = [];
    var counts = [];
    var amounts = [];
    var colors = [];
    var colRefs = [];
    _kanbanColumns.forEach(function(col) {
        if (col.count === 0) return;
        var c;
        switch (col.cls) {
            case 'draft':    c = '#94a3b8'; break;
            case 'pending':  c = '#f59e0b'; break;
            case 'review':   c = '#3b82f6'; break;
            case 'approved': c = '#35A85B'; break;
            case 'rejected': c = '#ef4444'; break;
            default: c = '#94a3b8';
        }
        labels.push(t(col.title));
        counts.push(col.count);
        amounts.push(col.total_amount);
        colors.push(c);
        colRefs.push(col);
    });

    if (labels.length === 0) {
        container.innerHTML = '<div class="flex items-center justify-center py-20 text-slate-400 text-sm">' + t('kanban_no_data') + '</div>';
        return;
    }

    var mainCanvas = document.getElementById('kanban-chart-main');
    var amountCanvas = document.getElementById('kanban-chart-amount');
    var ctx1 = mainCanvas ? mainCanvas.getContext('2d') : null;
    var ctx2 = amountCanvas ? amountCanvas.getContext('2d') : null;

    if (!ctx1 || !ctx2 || typeof Chart === 'undefined') {
        container.innerHTML = '<div class="flex items-center justify-center py-20 text-slate-400 text-sm">图表库未加载</div>';
        return;
    }

    var chartType = _kanbanViewMode;
    if (chartType === 'kanban' || chartType === 'table') chartType = 'bar';

    // Build common options
    var totalCount = counts.reduce(function(a, b) { return a + b; }, 0);
    var totalAmount = amounts.reduce(function(a, b) { return a + b; }, 0);

    function makeOpts(titleText, dataArr, isAmount) {
        var opts = {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: chartType === 'pie' ? 'right' : 'top',
                    labels: { color: '#64748b', font: { size: 11 }, padding: 12 }
                },
                title: {
                    display: true,
                    text: titleText,
                    color: '#64748b',
                    font: { size: 13, weight: '600' }
                },
                tooltip: {
                    backgroundColor: 'rgba(30,41,59,0.9)',
                    titleFont: { size: 12 },
                    bodyFont: { size: 11 },
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            var idx = context.dataIndex;
                            var col = colRefs[idx];
                            var val = context.raw;
                            var pct = totalCount > 0 ? (counts[idx] / totalCount * 100) : 0;
                            var lines = [];
                            lines.push('  ' + t(col.title) + ': ' + val.toLocaleString('zh-CN'));
                            if (!isAmount && totalCount > 0) {
                                lines.push('  占比: ' + pct.toFixed(1) + '%');
                            }
                            if (isAmount && totalAmount > 0) {
                                lines.push('  价税合计占比: ' + (val / totalAmount * 100).toFixed(1) + '%');
                            }
                            return lines;
                        },
                        afterBody: function(context) {
                            var idx = context[0].dataIndex;
                            var col = colRefs[idx];
                            var cards = col.cards || [];
                            var topCustomers = [];
                            var seen = {};
                            cards.forEach(function(c) {
                                var n = c.customer || '';
                                if (n && !seen[n] && topCustomers.length < 3) {
                                    seen[n] = true;
                                    topCustomers.push(n);
                                }
                            });
                            if (topCustomers.length > 0) {
                                return ['  主要客户: ' + topCustomers.join(', ')];
                            }
                            return [];
                        }
                    }
                }
            }
        };
        if (chartType !== 'pie') {
            opts.scales = {
                y: { beginAtZero: true, ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(148,163,184,0.12)' } },
                x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { display: false } }
            };
        }
        if (chartType === 'bar') {
            opts.plugins.datalabels = undefined;
        }
        return opts;
    }

    // Register custom data label plugin if not already
    if (!Chart.registry.plugins.get('customDataLabels')) {
        Chart.register(_dataLabelPlugin);
    }

    _kanbanChartInstance = new Chart(ctx1, {
        type: chartType,
        data: {
            labels: labels,
            datasets: [{
                label: '数量',
                data: counts,
                backgroundColor: chartType === 'pie' ? colors : colors.map(function(c) { return c + '80'; }),
                borderColor: colors,
                borderWidth: chartType === 'pie' ? 1 : 2,
                borderRadius: chartType !== 'pie' ? 4 : 0,
            }]
        },
        options: makeOpts('各状态订单数分布', counts, false),
        plugins: [_dataLabelPlugin]
    });

    _kanbanChartAmountInstance = new Chart(ctx2, {
        type: chartType,
        data: {
            labels: labels,
            datasets: [{
                label: '价税合计 (¥)',
                data: amounts,
                backgroundColor: chartType === 'pie' ? colors : colors.map(function(c) { return c + '80'; }),
                borderColor: colors,
                borderWidth: chartType === 'pie' ? 1 : 2,
                borderRadius: chartType !== 'pie' ? 4 : 0,
            }]
        },
        options: makeOpts('各状态含税汇总', amounts, true),
        plugins: [_dataLabelPlugin]
    });

    // ========== Render Data Analysis Panel ==========
    var analysisEl = document.getElementById('kanban-analysis');
    if (!analysisEl) return;
    analysisEl.classList.remove('hidden');

    // KPI Cards
    var kpiEl = document.getElementById('kanban-analysis-kpi');
    kpiEl.innerHTML = '';
    var kpis = [
        { label: t('kanban_total'), value: totalCount.toLocaleString('zh-CN') + ' 笔', icon: 'fa-file-invoice', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        { label: '总额(含税)', value: fmtAmt(totalAmount), icon: 'fa-money-bill-wave', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        { label: '平均(含税)', value: fmtAmt(totalCount > 0 ? totalAmount / totalCount : 0), icon: 'fa-chart-line', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        { label: '最大(含税)', value: fmtAmt(Math.max.apply(null, amounts)), icon: 'fa-arrow-up', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    ];
    kpis.forEach(function(k) {
        var card = document.createElement('div');
        card.className = 'bg-white dark:bg-[#1A1A1A] rounded-xl border border-slate-200 dark:border-white/10 p-3 flex items-center gap-3';
        card.innerHTML =
            '<div class="' + k.bg + ' w-9 h-9 rounded-lg flex items-center justify-center ' + k.color + '"><i class="fas ' + k.icon + ' text-sm"></i></div>' +
            '<div><div class="text-xs text-slate-400 dark:text-slate-500">' + k.label + '</div><div class="text-sm font-bold text-slate-700 dark:text-slate-200">' + k.value + '</div></div>';
        kpiEl.appendChild(card);
    });

    // Status Detail Breakdown
    var detailEl = document.getElementById('kanban-analysis-detail');
    detailEl.innerHTML = '';
    colRefs.forEach(function(col, idx) {
        var pct = totalCount > 0 ? (col.count / totalCount * 100) : 0;
        var amtPct = totalAmount > 0 ? (col.total_amount / totalAmount * 100) : 0;
        var barColor;
        switch (col.cls) {
            case 'draft':    barColor = '#94a3b8'; break;
            case 'pending':  barColor = '#f59e0b'; break;
            case 'review':   barColor = '#3b82f6'; break;
            case 'approved': barColor = '#35A85B'; break;
            case 'rejected': barColor = '#ef4444'; break;
            default: barColor = '#94a3b8';
        }
        var row = document.createElement('div');
        row.className = 'flex items-center gap-3 py-1.5';
        row.innerHTML =
            '<span class="w-2 h-2 rounded-full flex-shrink-0" style="background:' + barColor + '"></span>' +
            '<span class="text-xs text-slate-600 dark:text-slate-300 w-20 flex-shrink-0">' + t(col.title) + '</span>' +
            '<div class="flex-1">' +
                '<div class="h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">' +
                    '<div class="h-full rounded-full transition-all" style="width:' + pct + '%;background:' + barColor + '"></div>' +
                '</div>' +
            '</div>' +
            '<span class="text-xs text-slate-500 dark:text-slate-400 w-16 text-right flex-shrink-0">' + col.count + ' 笔</span>' +
            '<span class="text-xs text-slate-500 dark:text-slate-400 w-10 text-right flex-shrink-0">' + pct.toFixed(1) + '%</span>' +
            '<span class="text-xs font-medium text-emerald-600 dark:text-emerald-400 w-28 text-right flex-shrink-0">' + fmtAmt(col.total_amount) + '</span>' +
            '<span class="text-xs text-slate-400 dark:text-slate-500 w-12 text-right flex-shrink-0">' + amtPct.toFixed(1) + '%</span>';
        detailEl.appendChild(row);
    });

    // Summary total row
    var totalRow = document.createElement('div');
    totalRow.className = 'flex items-center gap-3 pt-2 mt-1 border-t border-slate-100 dark:border-white/5';
    totalRow.innerHTML =
        '<span class="w-2 h-2 rounded-full flex-shrink-0" style="background:#64748b"></span>' +
        '<span class="text-xs font-semibold text-slate-700 dark:text-slate-200 w-20 flex-shrink-0">合计</span>' +
        '<div class="flex-1"></div>' +
        '<span class="text-xs font-semibold text-slate-700 dark:text-slate-200 w-16 text-right flex-shrink-0">' + totalCount + ' 笔</span>' +
        '<span class="text-xs text-slate-400 w-10 text-right flex-shrink-0">100%</span>' +
        '<span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 w-28 text-right flex-shrink-0">' + fmtAmt(totalAmount) + '</span>' +
        '<span class="text-xs text-slate-400 w-12 text-right flex-shrink-0">100%</span>';
    detailEl.appendChild(totalRow);
}

// Tab switching via event delegation
document.addEventListener('click', function(e) {
    var tab = e.target.closest('.kanban-tab');
    if (tab && !tab.classList.contains('kanban-tab-active')) {
        _kanbanCurrentForm = tab.dataset.form;
        _kanbanIsConversionMode = (_kanbanCurrentForm === 'conversion-stats');
        _kanbanIsOverdueMode = (_kanbanCurrentForm === 'ar-overdue');
        if (document.getElementById('view-kanban').classList.contains('active')) {
            if (_kanbanIsConversionMode) {
                loadKanbanConversionStats();
            } else if (_kanbanIsOverdueMode) {
                loadKanbanArOverdue();
            } else {
                loadKanbanView();
            }
        }
        return;
    }
    // View mode tab switching
    var viewTab = e.target.closest('.kanban-view-tab');
    if (viewTab && !viewTab.classList.contains('kanban-view-active') && !_kanbanIsConversionMode && !_kanbanIsOverdueMode) {
        _kanbanViewMode = viewTab.dataset.view;
        if (document.getElementById('view-kanban').classList.contains('active')) {
            loadKanbanView();
        }
        return;
    }
});

// Filter button handler
document.addEventListener('click', function(e) {
    var filterBtn = e.target.closest('#kanban-filter-btn');
    if (filterBtn && document.getElementById('view-kanban').classList.contains('active')) {
        if (_kanbanIsConversionMode) {
            loadKanbanConversionStats();
        } else if (_kanbanIsOverdueMode) {
            loadKanbanArOverdue();
        } else {
            loadKanbanView();
        }
    }
});

// Enter key on search field
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        var searchInput = document.getElementById('kanban-search');
        if (searchInput && document.contains(e.target) && (e.target === searchInput || searchInput.contains(e.target))) {
            if (document.getElementById('view-kanban').classList.contains('active')) {
                if (_kanbanIsConversionMode) {
                    loadKanbanConversionStats();
                } else if (_kanbanIsOverdueMode) {
                    loadKanbanArOverdue();
                } else {
                    loadKanbanView();
                }
            }
        }
    }
});

// =====================================================================
// Kingdee Conversion Stats
// =====================================================================

function _kanbanConversionBuildUrl() {
    var params = 'days=30';
    var dateFrom = document.getElementById('kanban-date-from');
    var dateTo = document.getElementById('kanban-date-to');
    var searchInput = document.getElementById('kanban-search');
    if (dateFrom && dateFrom.value) params += '&start_date=' + encodeURIComponent(dateFrom.value);
    if (dateTo && dateTo.value) params += '&end_date=' + encodeURIComponent(dateTo.value);
    if (searchInput && searchInput.value.trim()) params += '&search=' + encodeURIComponent(searchInput.value.trim());
    return '/api/kingdee/conversion-stats?' + params;
}

function loadKanbanConversionStats() {
    window.__kanbanCurrentCustomerIdx = undefined;
    var loadingEl = document.getElementById('kanban-conversion-loading');
    var errorEl = document.getElementById('kanban-conversion-error');
    var errorMsg = document.getElementById('kanban-conversion-error-msg');
    var contentEl = document.getElementById('kanban-conversion-content');
    var board = document.getElementById('kanban-board');
    var tableContainer = document.getElementById('kanban-table-container');
    var chartContainer = document.getElementById('kanban-chart-container');
    var conversionContainer = document.getElementById('kanban-conversion-container');
    var overdueContainer = document.getElementById('kanban-ar-overdue-container');
    var viewModeTabs = document.querySelector('.kanban-view-tab') ? document.querySelector('.kanban-view-tab').closest('.flex.items-center.gap-1\\.5') : null;

    // Ensure mode flags are consistent
    _kanbanIsConversionMode = true;
    _kanbanIsOverdueMode = false;

    // Hide standard kanban views & overdue container, show conversion container
    if (board) board.classList.add('hidden');
    if (tableContainer) tableContainer.classList.add('hidden');
    if (chartContainer) chartContainer.classList.add('hidden');
    if (overdueContainer) overdueContainer.classList.add('hidden');
    if (conversionContainer) conversionContainer.classList.remove('hidden');

    // Hide view mode tabs in conversion mode
    if (viewModeTabs) viewModeTabs.classList.add('hidden');

    // Hide main kanban loading indicator (navigateTo renders it visible)
    var mainLoading = document.getElementById('kanban-loading');
    if (mainLoading) mainLoading.classList.add('hidden');

    // Update form tab active state
    document.querySelectorAll('.kanban-tab').forEach(function(btn) {
        btn.classList.toggle('kanban-tab-active', btn.dataset.form === 'conversion-stats');
    });

    // Show loading
    loadingEl.classList.remove('hidden');
    errorEl.classList.add('hidden');
    contentEl.classList.add('hidden');

    fetch(_kanbanConversionBuildUrl())
        .then(function(r) { return r.json(); })
        .then(function(data) {
            loadingEl.classList.add('hidden');
            if (data.status !== 'success') {
                errorMsg.textContent = data.message || t('kanban_conversion_error');
                errorEl.classList.remove('hidden');
                return;
            }
            _renderConversionStats(data);
        })
        .catch(function(err) {
            loadingEl.classList.add('hidden');
            errorMsg.textContent = '网络错误: ' + (err.message || '未知错误');
            errorEl.classList.remove('hidden');
        });
}

// ========== URL Hash 路由支持（企微自定义菜单跳转） ==========
function handleHashRoute() {
    var hash = window.location.hash.slice(1);
    if (!hash) return;

    if (hash === 'kanban') {
        // 进入常规看板，重置为默认表单
        _kanbanCurrentForm = 'SAL_SaleOrder';
        _kanbanIsConversionMode = false;
        _kanbanIsOverdueMode = false;
        navigateTo('kanban');
    } else if (hash === 'kanban-conversion') {
        // 进入转换统计
        _kanbanCurrentForm = 'conversion-stats';
        _kanbanIsConversionMode = true;
        _kanbanIsOverdueMode = false;
        _kanbanHashNavigation = true;
        _kanbanSetDefaultDates();       // 初始化日期输入框
        navigateTo('kanban');           // loadKanbanView() 被守卫跳过
        _kanbanHashNavigation = false;
        loadKanbanConversionStats();    // 直接加载转换统计
    } else if (hash === 'overdue' || hash === 'kanban-overdue') {
        // 进入逾期统计（独立页面）
        navigateTo('overdue');
        loadOverduePage();
    }
}

// 监听 URL hash 变化（用户手动修改地址栏也能响应）
window.addEventListener('hashchange', handleHashRoute);

function _renderConversionExportToolbar(detail) {
    var contentEl = document.getElementById('kanban-conversion-content');
    if (!contentEl) return;

    // 移除已存在的导出工具栏，防止重复导航时重复添加
    var existing = document.getElementById('kanban-conversion-export-toolbar');
    if (existing) existing.remove();

    var qPairs = detail.quotation_pairs || [];
    var sPairs = detail.sample_pairs || [];
    var custSummary = detail.customer_summary || [];

    if (qPairs.length === 0 && sPairs.length === 0 && custSummary.length === 0) return;

    var html = '<div id="kanban-conversion-export-toolbar" class="flex items-center gap-2 p-3 mb-4 bg-white dark:bg-[#1A1A1A] rounded-xl border border-slate-200 dark:border-white/10">';
    html += '<span class="text-xs text-slate-400 mr-2">' + t('kanban_conversion_export_btn') + ':</span>';
    if (qPairs.length > 0 || sPairs.length > 0) {
        html += '<button onclick="_exportConversionToExcel(\'pairs\')" class="px-3 py-1.5 text-xs rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30 transition-colors">'
            + '<i class="fas fa-file-excel mr-1"></i>' + t('kanban_conversion_export_pairs') + '</button>';
    }
    if (custSummary.length > 0) {
        html += '<button onclick="_exportConversionToExcel(\'summary\')" class="px-3 py-1.5 text-xs rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30 transition-colors">'
            + '<i class="fas fa-file-excel mr-1"></i>' + t('kanban_conversion_export_summary') + '</button>';
    }
    var custAnalysis = detail.customer_analysis || {};
    var hasAnalysis = (custAnalysis.quotation && (custAnalysis.quotation.high || []).length > 0)
        || (custAnalysis.quotation && (custAnalysis.quotation.low || []).length > 0)
        || (custAnalysis.sample && (custAnalysis.sample.high || []).length > 0)
        || (custAnalysis.sample && (custAnalysis.sample.low || []).length > 0);
    if (hasAnalysis) {
        html += '<button onclick="_exportConversionToExcel(\'analysis\')" class="px-3 py-1.5 text-xs rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30 transition-colors">'
            + '<i class="fas fa-chart-bar mr-1"></i>' + t('kanban_conversion_analysis_export') + '</button>';
    }
    html += '</div>';

    // 插入到 content 顶部，位于所有卡片之前
    contentEl.insertAdjacentHTML('afterbegin', html);
}

function _renderConversionStats(data) {
    var contentEl = document.getElementById('kanban-conversion-content');
    contentEl.classList.remove('hidden');

    var detail = data.detail || {};
    window.__kanbanConversionDetail = detail;

    // 在内容顶部插入导出工具栏（位于卡片之前、日期选择框下方）
    _renderConversionExportToolbar(detail);

    // Quotation section
    var qt = data.quotation || {};
    _renderConversionCardSet('conversion-quotation-cards', 'conversion-quotation-bar', qt, 'quotation');

    // Sample section
    var sp = data.sample || {};
    _renderConversionCardSet('conversion-sample-cards', 'conversion-sample-bar', sp, 'sample');

    // Deep analysis section - show high converters and needs follow-up
    _renderConversionCustomerAnalysis(detail);

    // Detail section - show conversion details (below analysis)
    _renderConversionDetail(detail);
}

function _renderConversionDetail(detail) {
    var detailEl = document.getElementById('kanban-conversion-detail');
    if (!detailEl) return;

    var qPairs = detail.quotation_pairs || [];
    var sPairs = detail.sample_pairs || [];
    var custSummary = detail.customer_summary || [];

    var html = '<div class="space-y-6">';

    // ─── 已转化单据对照 ───
    html += '<div>';
    html += '<h4 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">' + t('kanban_conversion_detail_pairs') + '</h4>';

    // 报价单 → 销售订单
    html += '<div class="mb-5">';
    html += '<h5 class="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">&#x1F4C4; ' + t('kanban_conversion_quotation_title') + '</h5>';
    if (qPairs.length === 0) {
        html += '<p class="text-xs text-slate-400 italic py-2">' + t('kanban_conversion_no_data') + '</p>';
    } else {
        html += '<div class="overflow-x-auto rounded-lg border border-slate-200 dark:border-white/10">';
        html += '<table class="w-full text-xs border-collapse">';
        html += '<thead><tr class="bg-slate-100 dark:bg-white/5">';
        html += '<th class="px-2.5 py-2 text-left font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">' + t('kanban_conversion_column_customer') + '</th>';
        html += '<th class="px-2.5 py-2 text-left font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">' + t('kanban_conversion_column_qt_bill') + '</th>';
        html += '<th class="px-2.5 py-2 text-left font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">' + t('kanban_conversion_column_qt_date') + '</th>';
        html += '<th class="px-2.5 py-2 text-left font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">' + t('kanban_conversion_column_so_bill') + '</th>';
        html += '<th class="px-2.5 py-2 text-left font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">' + t('kanban_conversion_column_so_date') + '</th>';
        html += '<th class="px-2.5 py-2 text-right font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">' + t('kanban_conversion_column_amount') + '</th>';
        html += '<th class="px-2.5 py-2 text-left font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">' + t('kanban_conversion_column_material') + '</th>';
        html += '<th class="px-2.5 py-2 text-left font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">' + t('kanban_conversion_column_spec') + '</th>';
        html += '</tr></thead><tbody>';
        qPairs.forEach(function(p, idx) {
            html += '<tr class="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer" onclick="_kanbanOpenConversionPairDetail(\'quotation\',' + idx + ')">';
            html += '<td class="px-2.5 py-1.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">' + escapeHtml(p.customer) + '</td>';
            html += '<td class="px-2.5 py-1.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">' + escapeHtml(p.qt_bill) + '</td>';
            html += '<td class="px-2.5 py-1.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">' + escapeHtml(p.qt_date) + '</td>';
            html += '<td class="px-2.5 py-1.5 text-slate-700 dark:text-slate-300 whitespace-nowrap font-medium">' + escapeHtml(p.so_bill) + '</td>';
            html += '<td class="px-2.5 py-1.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">' + escapeHtml(p.so_date) + '</td>';
            html += '<td class="px-2.5 py-1.5 text-right text-emerald-600 dark:text-emerald-400 whitespace-nowrap font-medium">¥' + Number(p.amount).toLocaleString('zh-CN', {minimumFractionDigits:2, maximumFractionDigits:2}) + '</td>';
            html += '<td class="px-2.5 py-1.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">' + escapeHtml(p.material) + '</td>';
            html += '<td class="px-2.5 py-1.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">' + escapeHtml(p.spec) + '</td>';
            html += '</tr>';
        });
        html += '</tbody></table></div>';
    }
    html += '</div>';

    // 样品单 → 正式订单
    html += '<div class="mb-3">';
    html += '<h5 class="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">&#x1F4E6; ' + t('kanban_conversion_sample_title') + '</h5>';
    if (sPairs.length === 0) {
        html += '<p class="text-xs text-slate-400 italic py-2">' + t('kanban_conversion_no_data') + '</p>';
    } else {
        html += '<div class="overflow-x-auto rounded-lg border border-slate-200 dark:border-white/10">';
        html += '<table class="w-full text-xs border-collapse">';
        html += '<thead><tr class="bg-slate-100 dark:bg-white/5">';
        html += '<th class="px-2.5 py-2 text-left font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">' + t('kanban_conversion_column_customer') + '</th>';
        html += '<th class="px-2.5 py-2 text-left font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">' + t('kanban_conversion_column_sample_bill') + '</th>';
        html += '<th class="px-2.5 py-2 text-left font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">' + t('kanban_conversion_column_sample_date') + '</th>';
        html += '<th class="px-2.5 py-2 text-left font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">' + t('kanban_conversion_column_normal_bill') + '</th>';
        html += '<th class="px-2.5 py-2 text-left font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">' + t('kanban_conversion_column_normal_date') + '</th>';
        html += '<th class="px-2.5 py-2 text-right font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">' + t('kanban_conversion_column_amount') + '</th>';
        html += '<th class="px-2.5 py-2 text-left font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">' + t('kanban_conversion_column_material') + '</th>';
        html += '<th class="px-2.5 py-2 text-left font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">' + t('kanban_conversion_column_spec') + '</th>';
        html += '</tr></thead><tbody>';
        sPairs.forEach(function(p, idx) {
            html += '<tr class="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer" onclick="_kanbanOpenConversionPairDetail(\'sample\',' + idx + ')">';
            html += '<td class="px-2.5 py-1.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">' + escapeHtml(p.customer) + '</td>';
            html += '<td class="px-2.5 py-1.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">' + escapeHtml(p.sample_bill) + '</td>';
            html += '<td class="px-2.5 py-1.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">' + escapeHtml(p.sample_date) + '</td>';
            html += '<td class="px-2.5 py-1.5 text-slate-700 dark:text-slate-300 whitespace-nowrap font-medium">' + escapeHtml(p.normal_bill) + '</td>';
            html += '<td class="px-2.5 py-1.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">' + escapeHtml(p.normal_date) + '</td>';
            html += '<td class="px-2.5 py-1.5 text-right text-emerald-600 dark:text-emerald-400 whitespace-nowrap font-medium">¥' + Number(p.amount).toLocaleString('zh-CN', {minimumFractionDigits:2, maximumFractionDigits:2}) + '</td>';
            html += '<td class="px-2.5 py-1.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">' + escapeHtml(p.material) + '</td>';
            html += '<td class="px-2.5 py-1.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">' + escapeHtml(p.spec) + '</td>';
            html += '</tr>';
        });
        html += '</tbody></table></div>';
    }
    html += '</div>';
    html += '</div>';  // end detail_pairs section

    // ─── 按客户转化汇总 ───
    html += '<div>';
    html += '<h4 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">' + t('kanban_conversion_detail_customer') + '</h4>';
    if (custSummary.length === 0) {
        html += '<p class="text-xs text-slate-400 italic py-2">' + t('kanban_conversion_no_data') + '</p>';
    } else {
        html += '<div class="overflow-x-auto rounded-lg border border-slate-200 dark:border-white/10">';
        html += '<table class="w-full text-xs border-collapse">';
        html += '<thead><tr class="bg-slate-100 dark:bg-white/5">';
        html += '<th class="px-2.5 py-2 text-left font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">' + t('kanban_conversion_column_customer') + '</th>';
        html += '<th class="px-2.5 py-2 text-left font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">' + t('kanban_conversion_column_type') + '</th>';
        html += '<th class="px-2.5 py-2 text-right font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">' + t('kanban_conversion_column_total') + '</th>';
        html += '<th class="px-2.5 py-2 text-right font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">' + t('kanban_conversion_column_converted') + '</th>';
        html += '<th class="px-2.5 py-2 text-right font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">' + t('kanban_conversion_column_rate') + '</th>';
        html += '</tr></thead><tbody>';
        custSummary.forEach(function(c, idx) {
            var isQuotation = c.type === 'quotation';
            var typeLabel = t(isQuotation ? 'kanban_conversion_type_quotation' : 'kanban_conversion_type_sample');
            html += '<tr class="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer" onclick="_kanbanOpenCustomerBills(' + idx + ')">';
            html += '<td class="px-2.5 py-1.5 text-slate-700 dark:text-slate-300 whitespace-nowrap font-medium">' + escapeHtml(c.customer) + '</td>';
            html += '<td class="px-2.5 py-1.5 whitespace-nowrap"><span class="inline-block px-1.5 py-0.5 text-xs rounded ' + (isQuotation ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400') + '">' + escapeHtml(typeLabel) + '</span></td>';
            html += '<td class="px-2.5 py-1.5 text-right text-slate-600 dark:text-slate-300 whitespace-nowrap">' + c.total + '</td>';
            html += '<td class="px-2.5 py-1.5 text-right text-slate-600 dark:text-slate-300 whitespace-nowrap">' + c.converted + '</td>';
            html += '<td class="px-2.5 py-1.5 text-right whitespace-nowrap font-medium ' + (isQuotation ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400') + '">' + (c.rate || '0%') + '</td>';
            html += '</tr>';
        });
        html += '</tbody></table></div>';
    }
    html += '</div>';  // end customer_summary section

    html += '</div>';  // end space-y-6

    detailEl.innerHTML = html;
}

// ─── Conversion: customer deep analysis (high converters + needs follow-up) ───
function _renderConversionCustomerAnalysis(detail) {
    var analysisEl = document.getElementById('kanban-conversion-customer-analysis');
    if (!analysisEl) return;

    var analysis = detail.customer_analysis || {};

    // 计算总数用作展示 "查看全部 N 个客户"
    var qtHighCount = (analysis.quotation && analysis.quotation.high ? analysis.quotation.high.length : 0);
    var qtLowCount = (analysis.quotation && analysis.quotation.low ? analysis.quotation.low.length : 0);
    var spHighCount = (analysis.sample && analysis.sample.high ? analysis.sample.high.length : 0);
    var spLowCount = (analysis.sample && analysis.sample.low ? analysis.sample.low.length : 0);

    var html = '<div class="space-y-5">';

    // ═══════ 报价单客户分析 ═══════
    html += '<div>';
    html += '<h4 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">' + t('kanban_conversion_customer_analysis') + ' - ' + t('kanban_conversion_type_quotation') + '</h4>';
    // 说明文字
    html += '<p class="text-xs text-slate-400 mb-2">按有/无转化分类展示所有客户，有转化归入左栏「高转化」，无转化归入右栏「待跟进」</p>';

    // 双栏容器（响应式：手机竖排，电脑横排）
    html += '<div class="flex flex-col lg:flex-row gap-4">';

    // ── 左栏：高转化客户 ──
    html += '<div class="flex-1 min-w-0">';
    html += '<div class="flex items-center justify-between mb-2">';
    html += '<h5 class="text-xs font-semibold"><span class="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1"></span>' + t('kanban_conversion_high_qt') + '</h5>';
    html += '<span class="text-xs text-slate-400">' + t('kanban_conversion_column_rate') + '</span>';
    html += '</div>';

    if (qtHighCount === 0) {
        html += '<p class="text-xs text-slate-400 italic">' + t('kanban_conversion_no_high') + '</p>';
    } else {
        html += _renderCustomerBarList(analysis.quotation.high, 'quotation', 'high', 5, '#kanban-conversion-quotation-high-expand');
    }
    // 展开/收起
    if (qtHighCount > 5) {
        html += '<div class="mt-2">';
        html += '<span id="kanban-conversion-quotation-high-btn" class="text-xs text-blue-500 cursor-pointer hover:text-blue-600" onclick="toggleCustomerList(\'quotation\', \'high\')">'
            + t('kanban_conversion_view_all').replace('{n}', qtHighCount) + '</span>';
        html += '<div id="kanban-conversion-quotation-high-expand" class="hidden mt-2"></div>';
        html += '</div>';
    }
    html += '</div>'; // end left col

    // ── 右栏：待跟进客户 ──
    html += '<div class="flex-1 min-w-0">';
    html += '<div class="flex items-center justify-between mb-2">';
    html += '<h5 class="text-xs font-semibold"><span class="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span>' + t('kanban_conversion_low_qt') + '</h5>';
    html += '<span class="text-xs text-slate-400">' + t('kanban_conversion_column_total') + '</span>';
    html += '</div>';

    if (qtLowCount === 0) {
        html += '<p class="text-xs text-slate-400 italic">' + t('kanban_conversion_no_low') + '</p>';
    } else {
        html += _renderCustomerBarList(analysis.quotation.low, 'quotation', 'low', 5, '#kanban-conversion-quotation-low-expand');
    }
    if (qtLowCount > 5) {
        html += '<div class="mt-2">';
        html += '<span id="kanban-conversion-quotation-low-btn" class="text-xs text-blue-500 cursor-pointer hover:text-blue-600" onclick="toggleCustomerList(\'quotation\', \'low\')">'
            + t('kanban_conversion_view_all').replace('{n}', qtLowCount) + '</span>';
        html += '<div id="kanban-conversion-quotation-low-expand" class="hidden mt-2"></div>';
        html += '</div>';
    }
    html += '</div>'; // end right col
    html += '</div>'; // end flex container

    // ═══════ 样品单客户分析 ═══════
    html += '<div>';
    html += '<h4 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">' + t('kanban_conversion_customer_analysis') + ' - ' + t('kanban_conversion_type_sample') + '</h4>';
    // 样品单说明
    html += '<p class="text-xs text-slate-400 mb-2">' + t('kanban_conversion_sample_note') + '</p>';

    html += '<div class="flex flex-col lg:flex-row gap-4">';

    // ── 左栏：样品单高转化 ──
    html += '<div class="flex-1 min-w-0">';
    html += '<div class="flex items-center justify-between mb-2">';
    html += '<h5 class="text-xs font-semibold"><span class="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1"></span>' + t('kanban_conversion_high_sp') + '</h5>';
    html += '<span class="text-xs text-slate-400">' + t('kanban_conversion_column_rate') + '</span>';
    html += '</div>';

    if (spHighCount === 0) {
        html += '<p class="text-xs text-slate-400 italic">' + t('kanban_conversion_no_high') + '</p>';
    } else {
        html += _renderCustomerBarList(analysis.sample.high, 'sample', 'high', 5, '#kanban-conversion-sample-high-expand');
    }
    if (spHighCount > 5) {
        html += '<div class="mt-2">';
        html += '<span class="text-xs text-blue-500 cursor-pointer hover:text-blue-600" onclick="toggleCustomerList(\'sample\', \'high\')">'
            + t('kanban_conversion_view_all').replace('{n}', spHighCount) + '</span>';
        html += '<div id="kanban-conversion-sample-high-expand" class="hidden mt-2"></div>';
        html += '</div>';
    }
    html += '</div>';

    // ── 右栏：样品单待跟进 ──
    html += '<div class="flex-1 min-w-0">';
    html += '<div class="flex items-center justify-between mb-2">';
    html += '<h5 class="text-xs font-semibold"><span class="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span>' + t('kanban_conversion_low_sp') + '</h5>';
    html += '<span class="text-xs text-slate-400">' + t('kanban_conversion_column_total') + '</span>';
    html += '</div>';

    if (spLowCount === 0) {
        html += '<p class="text-xs text-slate-400 italic">' + t('kanban_conversion_no_low') + '</p>';
    } else {
        html += _renderCustomerBarList(analysis.sample.low, 'sample', 'low', 5, '#kanban-conversion-sample-low-expand');
    }
    if (spLowCount > 5) {
        html += '<div class="mt-2">';
        html += '<span class="text-xs text-blue-500 cursor-pointer hover:text-blue-600" onclick="toggleCustomerList(\'sample\', \'low\')">'
            + t('kanban_conversion_view_all').replace('{n}', spLowCount) + '</span>';
        html += '<div id="kanban-conversion-sample-low-expand" class="hidden mt-2"></div>';
        html += '</div>';
    }
    html += '</div>';
    html += '</div>'; // end flex
    html += '</div>'; // end sample section

    html += '</div>'; // end space-y-5

    analysisEl.innerHTML = html;
}

// ── 渲染水平条形图列表 ──
function _renderCustomerBarList(customers, _type, section, maxCount, _expandId) {
    var show = customers.slice(0, maxCount);
    var html = '<div class="space-y-1.5">';
    for (var i = 0; i < show.length; i++) {
        var c = show[i];
        var isLow = (section === 'low');
        var barColor = isLow ? 'bg-red-400 dark:bg-red-500' : 'bg-emerald-400 dark:bg-emerald-500';
        var textColor = isLow ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400';
        var pct = parseFloat(c.rate) || 0;
        var barWidth = pct;
        var countLabel = t('kanban_conversion_qt_count').replace('{n}', c.total).replace('{m}', c.converted);

        html += '<div class="flex items-center gap-2 group cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 rounded px-1 py-0.5"';
        html += ' onclick="_kanbanOpenCustomerBillsByName(\'' + escapeHtml(c.customer) + '\',\'' + c.type + '\')"';
        html += ' title="' + escapeHtml(c.customer) + ' - ' + c.rate + ' - ' + countLabel + '">';
        html += '<span class="flex-1 min-w-0 text-xs text-slate-700 dark:text-slate-300 truncate">' + escapeHtml(c.customer) + '</span>';
        html += '<div class="w-24 flex-shrink-0 h-2.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">';
        html += '<div class="h-full ' + barColor + ' rounded-full transition-all" style="width: ' + Math.min(barWidth, 100) + '%"></div>';
        html += '</div>';
        html += '<span class="w-12 text-right text-xs font-medium ' + textColor + ' flex-shrink-0">' + c.rate + '</span>';
        if (isLow) {
            html += '<span class="w-16 text-right text-xs text-slate-400 flex-shrink-0">' + c.total + '次</span>';
        } else {
            html += '<span class="w-16 text-right text-xs text-slate-400 flex-shrink-0">' + countLabel + '</span>';
        }
        html += '</div>';
    }
    html += '</div>';
    return html;
}

// ── 展开完整客户列表（带搜索/排序/分页）──
function toggleCustomerList(type, section) {
    var expandId = 'kanban-conversion-' + type + '-' + section + '-expand';
    var btnId = 'kanban-conversion-' + type + '-' + section + '-btn';
    var expandEl = document.getElementById(expandId);
    var btnEl = document.getElementById(btnId);
    if (!expandEl) return;

    if (!expandEl.classList.contains('hidden')) {
        expandEl.classList.add('hidden');
        if (btnEl) btnEl.textContent = t('kanban_conversion_view_all').replace('{n}', _getCustomerListCount(type, section));
        return;
    }

    // 缓存数据到 DOM data 属性，避免重复渲染
    if (!expandEl._data) {
        var detail = window.__kanbanConversionDetail;
        if (!detail) return;
        var analysis = detail.customer_analysis || {};
        var list = [];
        if (analysis[type] && analysis[type][section]) {
            list = analysis[type][section];
        }
        expandEl._data = list;
        expandEl._type = type;
        expandEl._section = section;
    }

    expandEl.classList.remove('hidden');
    if (btnEl) btnEl.textContent = t('kanban_conversion_view_less');
    _renderCustomerFullList(expandEl);
}

function _getCustomerListCount(type, section) {
    var detail = window.__kanbanConversionDetail;
    if (!detail) return 0;
    var analysis = detail.customer_analysis || {};
    if (analysis[type] && analysis[type][section]) return analysis[type][section].length;
    return 0;
}

function _renderCustomerFullList(container) {
    var data = container._data || [];
    var section = container._section || 'high';
    var isLow = (section === 'low');

    // 默认排序规则
    var defaultSort = isLow ? 'total' : 'rate';

    var sortKey = container._sortKey || defaultSort;
    var searchText = (container._searchText || '').toLowerCase();
    var page = container._page || 1;
    var pageSize = 20;

    // 筛选
    var filtered = data;
    if (searchText) {
        filtered = data.filter(function(c) {
            return (c.customer || '').toLowerCase().indexOf(searchText) !== -1;
        });
    }

    // 排序
    filtered = filtered.slice(); // copy
    if (sortKey === 'rate') {
        filtered.sort(function(a, b) { return parseFloat(b.rate) - parseFloat(a.rate); });
    } else if (sortKey === 'total') {
        filtered.sort(function(a, b) { return b.total - a.total; });
    } else if (sortKey === 'date') {
        filtered.sort(function(a, b) { return (b.last_date || '').localeCompare(a.last_date || ''); });
    }

    // 分页
    var totalPages = Math.ceil(filtered.length / pageSize) || 1;
    if (page > totalPages) page = totalPages;
    if (page < 1) page = 1;
    container._page = page;

    var start = (page - 1) * pageSize;
    var pageData = filtered.slice(start, start + pageSize);

    // 构建 HTML
    var html = '<div class="border border-slate-200 dark:border-white/10 rounded-lg p-3 bg-white dark:bg-white/5">';

    // 工具栏：搜索 + 排序
    html += '<div class="flex flex-wrap gap-2 mb-2">';
    html += '<input id="' + container.id + '-search" type="text" placeholder="' + t('kanban_conversion_search_customer') + '"';
    html += ' value="' + escapeHtml(searchText) + '"';
    html += ' class="flex-1 min-w-[120px] px-2 py-1 text-xs border border-slate-300 dark:border-white/20 rounded bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-400"';
    html += ' oninput="onCustomerSearchInput(this, \'' + container.id + '\')" />';
    html += '<select class="px-2 py-1 text-xs border border-slate-300 dark:border-white/20 rounded bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none"';
    html += ' onchange="_changeCustomerSort(this, \'' + container.id + '\')">';
    html += '<option value="rate" ' + (sortKey === 'rate' ? 'selected' : '') + '>' + t('kanban_conversion_sort_by_rate') + '</option>';
    html += '<option value="total" ' + (sortKey === 'total' ? 'selected' : '') + '>' + t('kanban_conversion_sort_by_total') + '</option>';
    html += '<option value="date" ' + (sortKey === 'date' ? 'selected' : '') + '>' + t('kanban_conversion_sort_by_date') + '</option>';
    html += '</select>';
    html += '</div>';

    // 表格
    if (pageData.length === 0) {
        html += '<p class="text-xs text-slate-400 italic text-center py-4">' + (searchText ? '未找到匹配的客户' : '暂无数据') + '</p>';
    } else {
        html += '<table class="w-full text-xs"><thead><tr class="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10">';
        html += '<th class="text-left py-1 pr-2 font-medium">' + t('kanban_conversion_column_customer') + '</th>';
        html += '<th class="text-right px-2 font-medium">' + t('kanban_conversion_column_total') + '</th>';
        html += '<th class="text-right px-2 font-medium">' + t('kanban_conversion_column_converted') + '</th>';
        html += '<th class="text-right px-2 font-medium">' + t('kanban_conversion_column_rate') + '</th>';
        html += '<th class="text-right pl-2 font-medium">' + t('kanban_conversion_last_date') + '</th>';
        html += '</tr></thead><tbody>';
        for (var i = 0; i < pageData.length; i++) {
            var c = pageData[i];
            var barColor = isLow ? 'bg-red-300 dark:bg-red-500/50' : 'bg-emerald-300 dark:bg-emerald-500/50';
            var pct = parseFloat(c.rate) || 0;
            html += '<tr class="cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 border-b border-slate-100 dark:border-white/5"';
            html += ' onclick="_kanbanOpenCustomerBillsByName(\'' + escapeHtml(c.customer) + '\',\'' + c.type + '\')"';
            html += ' title="' + escapeHtml(c.customer) + '">';
            html += '<td class="py-1.5 pr-2 text-slate-700 dark:text-slate-300">' + escapeHtml(c.customer) + '</td>';
            html += '<td class="text-right px-2 text-slate-600 dark:text-slate-400">' + c.total + '</td>';
            html += '<td class="text-right px-2 text-slate-600 dark:text-slate-400">' + c.converted + '</td>';
            html += '<td class="text-right px-2"><span class="inline-block w-12 h-2 bg-slate-100 dark:bg-white/10 rounded-full align-middle mr-1"><span class="block h-full ' + barColor + ' rounded-full" style="width: ' + Math.min(pct, 100) + '%"></span></span><span class="text-slate-600 dark:text-slate-400">' + c.rate + '</span></td>';
            html += '<td class="text-right pl-2 text-slate-600 dark:text-slate-400">' + (c.last_date ? c.last_date.slice(0, 10) : '-') + '</td>';
            html += '</tr>';
        }
        html += '</tbody></table>';

        // 分页
        if (totalPages > 1) {
            html += '<div class="flex items-center justify-center gap-2 mt-3 text-xs text-slate-500">';
            html += '<span class="cursor-pointer hover:text-blue-500 ' + (page <= 1 ? 'opacity-30 pointer-events-none' : '') + '" onclick="_goCustomerPage(\'' + container.id + '\', ' + (page - 1) + ')">‹ 上一页</span>';
            html += '<span class="px-2">第 ' + page + '/' + totalPages + ' 页</span>';
            html += '<span class="cursor-pointer hover:text-blue-500 ' + (page >= totalPages ? 'opacity-30 pointer-events-none' : '') + '" onclick="_goCustomerPage(\'' + container.id + '\', ' + (page + 1) + ')">下一页 ›</span>';
            html += '<span class="text-slate-400">共 ' + filtered.length + ' 条</span>';
            html += '</div>';
        }
    }

    html += '</div>';
    container.innerHTML = html;
}

// 分页/搜索/排序的辅助函数
function _goCustomerPage(containerId, page) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el._page = page;
    _renderCustomerFullList(el);
}

function onCustomerSearchInput(inputEl, containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el._searchText = inputEl.value;
    el._page = 1;
    _renderCustomerFullList(el);
}

function _changeCustomerSort(selectEl, containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el._sortKey = selectEl.value;
    el._page = 1;
    _renderCustomerFullList(el);
}

// ── 按客户名查找弹窗（解决分析区索引错位问题）──
function _kanbanOpenCustomerBillsByName(customerName, type) {
    var detail = window.__kanbanConversionDetail;
    if (!detail) return;
    var custSummary = detail.customer_summary || [];
    for (var i = 0; i < custSummary.length; i++) {
        if (custSummary[i].customer === customerName && custSummary[i].type === type) {
            _kanbanOpenCustomerBills(i);
            return;
        }
    }
    // 未找到时尝试仅按名称匹配
    for (var j = 0; j < custSummary.length; j++) {
        if (custSummary[j].customer === customerName) {
            _kanbanOpenCustomerBills(j);
            return;
        }
    }
}

function _exportConversionToExcel(mode) {
    var ua = (navigator.userAgent || '').toLowerCase();
    var isWecom = ua.indexOf('wxwork') !== -1;
    var isWecomMobile = isWecom && /android|iphone|ipad|mobile|phone/i.test(ua);

    // ── 企微移动端 → 服务端导出（绕过移动 WebView 下载限制）──
    if (isWecomMobile) {
        _wecomExportExcel(mode);
        return;
    }

    // ── 企微电脑端（Chromium 内核）和其他普通浏览器 → 前端 XLSX 导出 ──
    // XLSX 库未加载时，从本地 vendor 动态加载兜底（CDN 被屏蔽场景）
    if (typeof XLSX === 'undefined') {
        console.warn('XLSX not loaded, trying vendor fallback...');
        var script = document.createElement('script');
        script.src = 'assets/vendor/xlsx/xlsx.full.min.js';
        script.onload = function() { _exportConversionToExcel(mode); };
        script.onerror = function() {
            console.error('Fallback XLSX load failed');
            _showToast('Excel 导出库未加载，请刷新页面后重试。');
        };
        document.head.appendChild(script);
        return;
    }

    var detail = window.__kanbanConversionDetail;
    if (!detail) {
        _showToast('暂无数据可导出');
        return;
    }

    var qPairs = detail.quotation_pairs || [];
    var sPairs = detail.sample_pairs || [];
    var custSummary = detail.customer_summary || [];

    var wb = XLSX.utils.book_new();

    // 导出单据对照
    if (mode === 'pairs') {
        if (qPairs.length > 0) {
            var qHeader = [t('kanban_conversion_column_qt_bill'), t('kanban_conversion_column_qt_date'), t('kanban_conversion_column_status'),
                t('kanban_conversion_column_so_bill'), t('kanban_conversion_column_so_date'), t('kanban_conversion_column_status'),
                t('kanban_conversion_column_saler'),
                t('kanban_conversion_column_amount'), t('kanban_conversion_column_customer'),
                t('kanban_conversion_column_material'), t('kanban_conversion_column_mat_name'), t('kanban_conversion_column_spec'),
                t('kanban_conversion_column_qty'), t('kanban_conversion_column_unit'), t('kanban_conversion_column_price')];
            var qData = qPairs.map(function(p) {
                return [p.qt_bill || '', p.qt_date || '', p.qt_status || '',
                    p.so_bill || '', p.so_date || '', p.so_status || '',
                    p.so_saler || '',
                    Number(p.amount) || 0, p.customer || '',
                    p.material || '', p.mat_name || '', p.spec || '',
                    Number(p.qty) || 0, p.unit || '', Number(p.price) || 0];
            });
            var ws1 = XLSX.utils.aoa_to_sheet([qHeader].concat(qData));
            ws1['!cols'] = [{wch:22},{wch:14},{wch:12},{wch:22},{wch:14},{wch:12},{wch:14},{wch:14},{wch:24},{wch:20},{wch:20},{wch:25},{wch:10},{wch:8},{wch:14}];
            XLSX.utils.book_append_sheet(wb, ws1, t('kanban_conversion_quotation_title'));
        }

        if (sPairs.length > 0) {
            var sHeader = [t('kanban_conversion_column_sample_bill'), t('kanban_conversion_column_sample_date'), t('kanban_conversion_column_status'),
                t('kanban_conversion_column_normal_bill'), t('kanban_conversion_column_normal_date'), t('kanban_conversion_column_status'),
                t('kanban_conversion_column_saler'),
                t('kanban_conversion_column_amount'), t('kanban_conversion_column_customer'),
                t('kanban_conversion_column_material'), t('kanban_conversion_column_mat_name'), t('kanban_conversion_column_spec'),
                t('kanban_conversion_column_qty'), t('kanban_conversion_column_unit'), t('kanban_conversion_column_price')];
            var sData = sPairs.map(function(p) {
                return [p.sample_bill || '', p.sample_date || '', p.sample_status || '',
                    p.normal_bill || '', p.normal_date || '', p.normal_status || '',
                    p.normal_saler || '',
                    Number(p.amount) || 0, p.customer || '',
                    p.material || '', p.mat_name || '', p.spec || '',
                    Number(p.qty) || 0, p.unit || '', Number(p.price) || 0];
            });
            var ws2 = XLSX.utils.aoa_to_sheet([sHeader].concat(sData));
            ws2['!cols'] = [{wch:22},{wch:14},{wch:12},{wch:22},{wch:14},{wch:12},{wch:14},{wch:14},{wch:24},{wch:20},{wch:20},{wch:25},{wch:10},{wch:8},{wch:14}];
            XLSX.utils.book_append_sheet(wb, ws2, t('kanban_conversion_sample_title'));
        }
    }

    // 导出客户汇总
    if (mode === 'summary') {
        if (custSummary.length > 0) {
            var cHeader = [t('kanban_conversion_column_customer'), t('kanban_conversion_column_type'),
                t('kanban_conversion_column_total'), t('kanban_conversion_column_converted'),
                t('kanban_conversion_column_rate')];
            var cData = custSummary.map(function(c) {
                var typeLabel = t(c.type === 'quotation' ? 'kanban_conversion_type_quotation' : 'kanban_conversion_type_sample');
                return [c.customer || '', typeLabel, c.total || 0, c.converted || 0, c.rate || '0%'];
            });
            var ws3 = XLSX.utils.aoa_to_sheet([cHeader].concat(cData));
            ws3['!cols'] = [{wch:24},{wch:12},{wch:10},{wch:10},{wch:10}];
            XLSX.utils.book_append_sheet(wb, ws3, t('kanban_conversion_detail_customer'));
        }

        // 客户单据明细 sheet
        var custBillsDetail = detail.customer_bills_detail || [];
        if (custBillsDetail.length > 0) {
            var dHeader = [t('kanban_conversion_column_customer'), t('kanban_conversion_column_type'),
                t('kanban_conversion_column_so_bill'), t('kanban_conversion_column_so_date'),
                t('kanban_conversion_column_amount'), t('kanban_conversion_column_converted_flag')];
            var dData = custBillsDetail.map(function(b) {
                var typeLabel = t(b.type === 'quotation' ? 'kanban_conversion_type_quotation' : 'kanban_conversion_type_sample');
                var convertedLabel = b.converted ? '已转化' : '未转化';
                return [b.customer || '', typeLabel, b.bill_no || '', b.date || '',
                    Number(b.amount) || 0, convertedLabel];
            });
            var ws4 = XLSX.utils.aoa_to_sheet([dHeader].concat(dData));
            ws4['!cols'] = [{wch:24},{wch:12},{wch:22},{wch:14},{wch:14},{wch:12}];
            XLSX.utils.book_append_sheet(wb, ws4, '客户单据明细');
        }
    }

    // 导出客户转化深度分析
    if (mode === 'analysis') {
        var custAnalysis = detail.customer_analysis || {};
        var qtHigh = (custAnalysis.quotation && custAnalysis.quotation.high) || [];
        var qtLow = (custAnalysis.quotation && custAnalysis.quotation.low) || [];
        var spHigh = (custAnalysis.sample && custAnalysis.sample.high) || [];
        var spLow = (custAnalysis.sample && custAnalysis.sample.low) || [];

        // Sheet 1: 报价单客户分析
        if (qtHigh.length > 0 || qtLow.length > 0) {
            var aHeader = ['客户', '类型', '报价次数', '已转化', '转化率', '最近报价', '分析标签'];
            var aData = [];
            qtHigh.forEach(function(c) {
                aData.push([c.customer || '', '报价单', c.total || 0, c.converted || 0, c.rate || '0%', c.last_date ? c.last_date.slice(0, 10) : '', '高转化']);
            });
            qtLow.forEach(function(c) {
                aData.push([c.customer || '', '报价单', c.total || 0, c.converted || 0, c.rate || '0%', c.last_date ? c.last_date.slice(0, 10) : '', '待跟进']);
            });
            var ws_a1 = XLSX.utils.aoa_to_sheet([aHeader].concat(aData));
            ws_a1['!cols'] = [{wch:24},{wch:10},{wch:10},{wch:10},{wch:10},{wch:14},{wch:10}];
            XLSX.utils.book_append_sheet(wb, ws_a1, '报价单客户分析');
        }

        // Sheet 2: 样品单客户分析
        if (spHigh.length > 0 || spLow.length > 0) {
            var bHeader = ['客户', '类型', '样品次数', '已转化', '转化率', '最近样品日期', '分析标签'];
            var bData = [];
            spHigh.forEach(function(c) {
                bData.push([c.customer || '', '样品单', c.total || 0, c.converted || 0, c.rate || '0%', c.last_date ? c.last_date.slice(0, 10) : '', '高转化']);
            });
            spLow.forEach(function(c) {
                bData.push([c.customer || '', '样品单', c.total || 0, c.converted || 0, c.rate || '0%', c.last_date ? c.last_date.slice(0, 10) : '', '待跟进']);
            });
            var ws_a2 = XLSX.utils.aoa_to_sheet([bHeader].concat(bData));
            ws_a2['!cols'] = [{wch:24},{wch:10},{wch:10},{wch:10},{wch:10},{wch:14},{wch:10}];
            XLSX.utils.book_append_sheet(wb, ws_a2, '样品单客户分析');
        }
    }

    // 空 workbook 保护
    if (wb.SheetNames.length === 0) {
        console.warn('No data to export');
        return;
    }

    var labelMap = {'pairs': '单据对照', 'summary': '客户汇总', 'analysis': '客户分析'};
    var fileName = '转化分析_' + (labelMap[mode] || '导出') + '_' + new Date().toISOString().slice(0, 10) + '.xlsx';
    _browserDownloadExcel(wb, fileName);
}

// ─── 企微浏览器：服务端生成 Excel 后触发下载 ───
function _wecomExportExcel(mode) {
    var url = _kanbanConversionBuildUrl() + '&export=excel&export_mode=' + mode;
    // 优先使用 window.open（用户手势触发，大多 WebView 放行）
    var win = window.open(url, '_blank');
    if (!win || win.closed || typeof win.closed === 'undefined') {
        // 弹出窗被拦截 → 降级为隐藏 iframe 静默请求
        var iframe = document.getElementById('wecom-export-iframe');
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.id = 'wecom-export-iframe';
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
        }
        iframe.src = url;
    }
    _showToast(t('kanban_conversion_loading_export'));
}

// ─── 普通浏览器：Blob 方式下载 Excel（移动端友好） ───
function _browserDownloadExcel(wb, fileName) {
    try {
        var wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        var blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function() { URL.revokeObjectURL(url); }, 10000);
        _showToast(t('kanban_conversion_export_success'));
    } catch (e) {
        console.error('Excel export failed:', e);
        // 最后兜底：使用 XLSX.writeFile 原生方式
        try {
            XLSX.writeFile(wb, fileName);
        } catch (e2) {
            console.error('SheetJS writeFile also failed:', e2);
            _showToast('导出失败，请重试。');
        }
    }
}

// ─── Toast 提示 ───
function _showToast(msg) {
    var existing = document.querySelector('.kanban-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'kanban-toast fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-slate-800 text-white text-xs rounded-lg shadow-lg z-50';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(function() { toast.remove(); }, 300);
    }, 2500);
}

function _renderConversionCardSet(cardsId, barId, data, type) {
    var cardsEl = document.getElementById(cardsId);
    var barEl = document.getElementById(barId);
    if (!cardsEl) return;

    var so_persp = data.so_perspective || {};
    var qt_persp = data[type === 'quotation' ? 'quotation_perspective' : 'sample_perspective'] || {};

    var isQuotation = type === 'quotation';
    var primaryColor = isQuotation ? '#35A85B' : '#f59e0b';

    // Build KPI cards
    var html = '';

    if (isQuotation) {
        // 报价单视角 - 只显示报价单视角卡片，不显示销售订单视角
        html += '<div class="rounded-xl border border-slate-200 dark:border-white/10 p-4 bg-slate-50 dark:bg-white/5 cursor-pointer" onclick="_kanbanOpenPerspectiveModal(\'quotation\')">';
        html += '<p class="text-xs font-medium text-slate-400 dark:text-slate-500 mb-3">' + t('kanban_conversion_qt_perspective') + '</p>';
        html += '<div class="space-y-2">';
        html += _conversionKpiRow(t('kanban_conversion_total_qt'), qt_persp.total_quotations || 0, '#64748b');
        html += _conversionKpiRow(t('kanban_conversion_converted'), qt_persp.converted_quotations || 0, primaryColor);
        html += _conversionKpiRow(t('kanban_conversion_qt_rate'), qt_persp.conversion_rate || '0%', primaryColor);
        html += '<div class="pt-1 border-t border-slate-200 dark:border-white/10 mt-2">';
        html += '<span class="text-xs text-slate-400">' + t('kanban_conversion_qt_converted_amount') + ': </span>';
        html += '<span class="text-sm font-semibold text-emerald-600 dark:text-emerald-400">¥' + Number(qt_persp.converted_amount || 0).toLocaleString('zh-CN', {minimumFractionDigits:2, maximumFractionDigits:2}) + '</span>';
        html += '</div></div></div>';
    } else {
        // 样品单视角 - 只显示样品单视角卡片，不显示销售订单视角
        html += '<div class="rounded-xl border border-slate-200 dark:border-white/10 p-4 bg-slate-50 dark:bg-white/5 cursor-pointer" onclick="_kanbanOpenPerspectiveModal(\'sample\')">';
        html += '<p class="text-xs font-medium text-slate-400 dark:text-slate-500 mb-3">' + t('kanban_conversion_sp_perspective') + '</p>';
        html += '<div class="space-y-2">';
        html += _conversionKpiRow(t('kanban_conversion_total_sp'), qt_persp.total_samples || 0, '#64748b');
        html += _conversionKpiRow(t('kanban_conversion_converted'), qt_persp.converted_samples || 0, primaryColor);
        html += _conversionKpiRow(t('kanban_conversion_sample_conv_rate'), qt_persp.conversion_rate || '0%', primaryColor);
        var convAmt = qt_persp.converted_amount || 0;
        if (convAmt > 0) {
            html += '<div class="pt-1 border-t border-slate-200 dark:border-white/10 mt-2">';
            html += '<span class="text-xs text-slate-400">' + t('kanban_conversion_sp_converted_amount') + ': </span>';
            html += '<span class="text-sm font-semibold text-emerald-600 dark:text-emerald-400">¥' + Number(convAmt).toLocaleString('zh-CN', {minimumFractionDigits:2, maximumFractionDigits:2}) + '</span>';
            html += '</div>';
        }
        html += '</div></div>';
    }

    cardsEl.innerHTML = html;

    // Progress bar - 统一使用视角中的转化率
    if (barEl) {
        var rate = parseFloat(qt_persp.conversion_rate) || 0;
        var barHtml = '<div class="flex items-center gap-3">';
        barHtml += '<span class="text-xs text-slate-500 dark:text-slate-400 w-20 flex-shrink-0">' + t(isQuotation ? 'kanban_conversion_qt_rate' : 'kanban_conversion_sample_conv_rate') + '</span>';
        barHtml += '<div class="flex-1 h-3 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">';
        barHtml += '<div class="h-full rounded-full transition-all" style="width:' + Math.min(rate, 100) + '%;background:' + primaryColor + '"></div>';
        barHtml += '</div>';
        barHtml += '<span class="text-xs font-semibold ' + (isQuotation ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400') + ' w-12 text-right flex-shrink-0">' + rate + '%</span>';
        barHtml += '</div>';
        barEl.innerHTML = barHtml;
    }
}

function _conversionKpiRow(label, value, color) {
    var valStr = typeof value === 'number' ? String(value) : (value || '0');
    return '<div class="flex items-center justify-between">' +
        '<span class="text-xs text-slate-500 dark:text-slate-400">' + label + '</span>' +
        '<span class="text-sm font-semibold" style="color:' + color + '">' + escapeHtml(valStr) + '</span>' +
        '</div>';
}

// =====================================================================
// Projects View
// =====================================================================

var _projectsData = null;

function loadProjectsView() {
    var uploadArea = document.getElementById('projects-upload-area');
    var fileInput = document.getElementById('projects-file-input');
    if (!uploadArea) return;

    var newUploadArea = uploadArea.cloneNode(true);
    uploadArea.parentNode.replaceChild(newUploadArea, uploadArea);
    uploadArea = newUploadArea;
    fileInput = document.getElementById('projects-file-input');

    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('drag-over');
    });
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('drag-over');
    });
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('drag-over');
        var files = e.dataTransfer.files;
        if (files.length > 0) handleProjectFile(files[0]);
    });
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) handleProjectFile(e.target.files[0]);
        fileInput.value = '';
    });
}

function handleProjectFile(file) {
    var ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls') {
        showProjectError(t('projects_error_upload') + ': ' + t('projects_upload_supported'));
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        showProjectError(t('projects_error_upload') + ': 文件大小不能超过 10MB');
        return;
    }

    document.getElementById('projects-upload-idle').classList.add('hidden');
    document.getElementById('projects-upload-loading').classList.remove('hidden');
    document.getElementById('projects-error').classList.add('hidden');
    document.getElementById('projects-stats').classList.add('hidden');
    document.getElementById('projects-stalled-section').classList.add('hidden');
    document.getElementById('projects-no-date-hint').classList.add('hidden');
    document.getElementById('projects-table-section').classList.add('hidden');
    document.getElementById('projects-empty-tip').classList.add('hidden');

    var formData = new FormData();
    formData.append('file', file);

    fetch('/api/projects/analyze', { method: 'POST', body: formData })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            document.getElementById('projects-upload-idle').classList.remove('hidden');
            document.getElementById('projects-upload-loading').classList.add('hidden');
            if (data.status !== 'success') {
                showProjectError(data.message || t('projects_error_upload'));
                return;
            }
            _projectsData = data;
            renderProjectResults(data);
        })
        .catch(function(err) {
            document.getElementById('projects-upload-idle').classList.remove('hidden');
            document.getElementById('projects-upload-loading').classList.add('hidden');
            showProjectError(t('projects_error_upload') + ': ' + (err.message || ''));
        });
}

function showProjectError(msg) {
    var errorEl = document.getElementById('projects-error');
    var errorMsg = document.getElementById('projects-error-msg');
    errorMsg.textContent = msg;
    errorEl.classList.remove('hidden');
}

function renderProjectResults(data) {
    var stats = data.stats || {};
    var colMap = data.column_mapping || {};

    renderProjectStats(stats, colMap);

    if (data.stalled && data.stalled.length > 0) {
        renderProjectStalled(data.stalled, colMap);
    }

    if (stats.no_date_column) {
        document.getElementById('projects-no-date-hint').classList.remove('hidden');
    }

    if (data.rows && data.rows.length > 0) {
        renderProjectTable(data.columns || [], data.rows, colMap);
    } else {
        document.getElementById('projects-empty-tip').classList.remove('hidden');
    }

    applyI18n();
}

function renderProjectStats(stats, colMap) {
    var container = document.getElementById('projects-stats');
    container.innerHTML = '';
    container.classList.remove('hidden');

    var totalCard = document.createElement('div');
    totalCard.className = 'projects-stat-card';
    totalCard.innerHTML =
        '<div class="flex items-center gap-3">' +
            '<div class="projects-stat-icon bg-blue-50 dark:bg-blue-900/20 text-blue-500"><i class="fas fa-tasks"></i></div>' +
            '<div>' +
                '<div class="projects-stat-value">' + (stats.total || 0) + '</div>' +
                '<div class="projects-stat-label">' + t('projects_stats_total') + '</div>' +
            '</div>' +
        '</div>';
    container.appendChild(totalCard);

    var stalledCard = document.createElement('div');
    stalledCard.className = 'projects-stat-card';
    stalledCard.innerHTML =
        '<div class="flex items-center gap-3">' +
            '<div class="projects-stat-icon bg-red-50 dark:bg-red-900/20 text-red-500"><i class="fas fa-exclamation-circle"></i></div>' +
            '<div>' +
                '<div class="projects-stat-value text-red-500">' + (stats.stalled || 0) + '</div>' +
                '<div class="projects-stat-label">' + t('projects_stats_stalled') + '</div>' +
            '</div>' +
        '</div>';
    container.appendChild(stalledCard);

    if (!stats.no_progress_column) {
        var rate = stats.healthy_rate !== undefined ? stats.healthy_rate : 100;
        var color = rate >= 80 ? 'text-emerald-500' : (rate >= 50 ? 'text-amber-500' : 'text-red-500');
        var healthCard = document.createElement('div');
        healthCard.className = 'projects-stat-card';
        healthCard.innerHTML =
            '<div class="flex items-center gap-3">' +
                '<div class="projects-stat-icon bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500"><i class="fas fa-heartbeat"></i></div>' +
                '<div>' +
                    '<div class="projects-stat-value ' + color + '">' + rate + '%</div>' +
                    '<div class="projects-stat-label">' + t('projects_stats_healthy') + '</div>' +
                '</div>' +
            '</div>';
        container.appendChild(healthCard);
    }
}

function renderProjectStalled(stalled, colMap) {
    var container = document.getElementById('projects-stalled-list');
    var section = document.getElementById('projects-stalled-section');
    container.innerHTML = '';
    section.classList.remove('hidden');

    var progKey = colMap.progress_column;

    stalled.forEach(function(item) {
        var card = document.createElement('div');
        card.className = 'projects-stalled-item';

        // 名称 + 责任人 + 停滞天数
        var headerHtml =
            '<div class="projects-stalled-header">' +
                '<span class="projects-stalled-name">' + escapeHtml(item.name || '') + '</span>' +
                '<span class="projects-stalled-days"><i class="fas fa-clock text-xs mr-1"></i>' + (item.days || 0) + t('projects_stalled_days') + '</span>' +
            '</div>';

        // 标签行：城市、行业、评级、责任人
        var tagsHtml = '<div class="projects-stalled-tags">';
        if (item.owner) {
            tagsHtml += '<span class="projects-stalled-tag tag-owner"><i class="fas fa-user text-xs mr-1"></i>' + escapeHtml(item.owner) + '</span>';
        }
        if (item.city) {
            tagsHtml += '<span class="projects-stalled-tag tag-city"><i class="fas fa-map-marker-alt text-xs mr-1"></i>' + escapeHtml(item.city) + '</span>';
        }
        if (item.industry) {
            tagsHtml += '<span class="projects-stalled-tag tag-industry"><i class="fas fa-industry text-xs mr-1"></i>' + escapeHtml(item.industry) + '</span>';
        }
        if (item.rating) {
            tagsHtml += '<span class="projects-stalled-tag tag-rating"><i class="fas fa-star text-xs mr-1"></i>' + escapeHtml(item.rating) + '</span>';
        }
        if (item.milestone) {
            tagsHtml += '<span class="projects-stalled-tag tag-milestone"><i class="fas fa-flag text-xs mr-1"></i>' + escapeHtml(item.milestone) + '</span>';
        }
        tagsHtml += '</div>';

        // 进度条
        var progressHtml = '';
        if (progKey && item.progress !== undefined) {
            var p = Math.min(100, Math.max(0, parseFloat(item.progress) || 0));
            var bc = p < 30 ? '#ef4444' : (p < 70 ? '#f59e0b' : '#22c55e');
            progressHtml =
                '<div class="projects-stalled-progress">' +
                    '<div class="projects-progress-bar">' +
                        '<div class="projects-progress-fill" style="width:' + p + '%;background:' + bc + '"></div>' +
                    '</div>' +
                    '<div class="text-xs text-right text-slate-400 mt-0.5">' + Math.round(p) + '%</div>' +
                '</div>';
        }

        // 额外信息：半年度目标 / 本月目标 / 行动计划
        var extraHtml = '';
        if (item.halfyear_goal || item.monthly_goal || item.action_plan) {
            extraHtml = '<div class="projects-stalled-extra">';
            if (item.halfyear_goal) {
                extraHtml += '<div class="projects-extra-line"><span class="projects-extra-label">' + t('projects_halfyear_goal') + '</span><span class="projects-extra-value">' + escapeHtml(item.halfyear_goal) + '</span></div>';
            }
            if (item.monthly_goal) {
                extraHtml += '<div class="projects-extra-line"><span class="projects-extra-label">' + t('projects_monthly_goal') + '</span><span class="projects-extra-value">' + escapeHtml(item.monthly_goal) + '</span></div>';
            }
            if (item.action_plan) {
                extraHtml += '<div class="projects-extra-line"><span class="projects-extra-label">' + t('projects_action_plan') + '</span><span class="projects-extra-value">' + escapeHtml(item.action_plan) + '</span></div>';
            }
            extraHtml += '</div>';
        }

        card.innerHTML = headerHtml + tagsHtml + progressHtml + extraHtml;
        container.appendChild(card);
    });
}

function renderProjectTable(cols, rows, colMap) {
    var thead = document.getElementById('projects-table-head');
    var tbody = document.getElementById('projects-table-body');
    var section = document.getElementById('projects-table-section');
    thead.innerHTML = '';
    tbody.innerHTML = '';
    section.classList.remove('hidden');

    var headerRow = '<tr>';
    cols.forEach(function(col) {
        headerRow += '<th>' + escapeHtml(col) + '</th>';
    });
    headerRow += '</tr>';
    thead.innerHTML = headerRow;

    rows.forEach(function(row) {
        var tr = '<tr>';
        cols.forEach(function(col, idx) {
            var val = row[idx] !== undefined && row[idx] !== null ? String(row[idx]) : '';
            tr += '<td>' + escapeHtml(val) + '</td>';
        });
        tr += '</tr>';
        tbody.innerHTML += tr;
    });
}

// =====================================================================
// Kingdee AR Overdue Stats
// =====================================================================

function _kanbanArOverdueBuildUrl() {
    var params = 'days=365';
    var dateFrom = document.getElementById('kanban-date-from');
    var dateTo = document.getElementById('kanban-date-to');
    var searchInput = document.getElementById('kanban-search');
    if (dateFrom && dateFrom.value) params += '&start_date=' + encodeURIComponent(dateFrom.value);
    if (dateTo && dateTo.value) params += '&end_date=' + encodeURIComponent(dateTo.value);
    if (searchInput && searchInput.value.trim()) params += '&search=' + encodeURIComponent(searchInput.value.trim());
    return '/api/kingdee/ar-overdue?' + params;
}

function loadKanbanArOverdue() {
    // Ensure mode flags are consistent
    _kanbanIsConversionMode = false;
    _kanbanIsOverdueMode = true;

    var loadingEl = document.getElementById('kanban-ar-overdue-loading');
    var errorEl = document.getElementById('kanban-ar-overdue-error');
    var errorMsg = document.getElementById('kanban-ar-overdue-error-msg');
    var contentEl = document.getElementById('kanban-ar-overdue-content');
    var board = document.getElementById('kanban-board');
    var tableContainer = document.getElementById('kanban-table-container');
    var chartContainer = document.getElementById('kanban-chart-container');
    var conversionContainer = document.getElementById('kanban-conversion-container');
    var overdueContainer = document.getElementById('kanban-ar-overdue-container');
    var viewModeTabs = document.querySelector('.kanban-view-tab') ? document.querySelector('.kanban-view-tab').closest('.flex.items-center.gap-1\\.5') : null;

    // Hide standard kanban views & conversion, show overdue container
    if (board) board.classList.add('hidden');
    if (tableContainer) tableContainer.classList.add('hidden');
    if (chartContainer) chartContainer.classList.add('hidden');
    if (conversionContainer) conversionContainer.classList.add('hidden');
    if (overdueContainer) overdueContainer.classList.remove('hidden');

    // Hide view mode tabs in overdue mode
    if (viewModeTabs) viewModeTabs.classList.add('hidden');

    // Hide main kanban loading indicator
    var mainLoading = document.getElementById('kanban-loading');
    if (mainLoading) mainLoading.classList.add('hidden');

    // Update form tab active state
    document.querySelectorAll('.kanban-tab').forEach(function(btn) {
        btn.classList.toggle('kanban-tab-active', btn.dataset.form === 'ar-overdue');
    });

    // Show loading
    loadingEl.classList.remove('hidden');
    errorEl.classList.add('hidden');
    contentEl.classList.add('hidden');

    fetch(_kanbanArOverdueBuildUrl())
        .then(function(r) { return r.json(); })
        .then(function(data) {
            loadingEl.classList.add('hidden');
            if (data.status !== 'success') {
                errorMsg.textContent = data.message || t('kanban_overdue_error');
                errorEl.classList.remove('hidden');
                return;
            }
            _kanbanOverdueData = data;
            _kanbanOverdueCustomerFilter = '';
            _renderArOverdue(data);
        })
        .catch(function(err) {
            loadingEl.classList.add('hidden');
            errorMsg.textContent = '网络错误: ' + (err.message || '未知错误');
            errorEl.classList.remove('hidden');
        });
}

function _renderArOverdue(data) {
    var contentEl = document.getElementById('kanban-ar-overdue-content');
    contentEl.classList.remove('hidden');

    _renderArOverdueKPI(data.kpi);
    _renderArOverdueAgingChart(data.aging);
    _renderArOverdueCustomerRanking(data.customer_ranking);
    _renderArOverdueDetail(data.detail_rows);
    _renderArOverdueExportToolbar(data);
}

function fmtAmt(val) {
    if (val === undefined || val === null) return '¥0.00';
    return '¥' + Number(val).toLocaleString('zh-CN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function _renderArOverdueKPI(kpi) {
    var kpiEl = document.getElementById('kanban-ar-overdue-kpi');
    if (!kpiEl) return;

    var cards = [
        {icon: 'fa-money-bill-wave', color: 'blue', label: 'kanban_overdue_kpi_total', value: fmtAmt(kpi.total_amount), sub: t('kanban_overdue_kpi_total') + ': ' + kpi.total_count + ' ' + t('kanban_conversion_column_total')},
        {icon: 'fa-exclamation-triangle', color: 'red', label: 'kanban_overdue_kpi_overdue_amt', value: fmtAmt(kpi.overdue_amount), sub: t('kanban_overdue_kpi_overdue_count') + ': ' + kpi.overdue_count + ' ' + t('kanban_conversion_column_total')},
        {icon: 'fa-percentage', color: 'orange', label: 'kanban_overdue_kpi_overdue_rate', value: kpi.overdue_rate + '%', sub: ''},
        {icon: 'fa-calendar-times', color: 'amber', label: 'kanban_overdue_kpi_avg_days', value: kpi.avg_overdue_days + ' ' + t('kanban_conversion_column_qty'), sub: ''},
        {icon: 'fa-bell', color: 'purple', label: 'kanban_overdue_kpi_due_soon', value: fmtAmt(kpi.due_soon_amount), sub: t('kanban_overdue_kpi_due_soon') + ': ' + kpi.due_soon_count + ' ' + t('kanban_conversion_column_total')},
        {icon: 'fa-file-invoice', color: 'slate', label: 'kanban_overdue_kpi_total', value: kpi.total_count + ' ' + t('kanban_conversion_column_total'), sub: t('kanban_overdue_kpi_overdue_amt') + ': ' + fmtAmt(kpi.overdue_amount)},
    ];

    var colorMap = {
        blue: {bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: 'text-blue-500', text: 'text-blue-600 dark:text-blue-400'},
        red: {bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', icon: 'text-red-500', text: 'text-red-600 dark:text-red-400'},
        orange: {bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', icon: 'text-orange-500', text: 'text-orange-600 dark:text-orange-400'},
        amber: {bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', icon: 'text-amber-500', text: 'text-amber-600 dark:text-amber-400'},
        purple: {bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', icon: 'text-purple-500', text: 'text-purple-600 dark:text-purple-400'},
        slate: {bg: 'bg-slate-50 dark:bg-slate-800/50', border: 'border-slate-200 dark:border-slate-700', icon: 'text-slate-500', text: 'text-slate-600 dark:text-slate-400'},
    };

    kpiEl.innerHTML = '';
    cards.forEach(function(card) {
        var clr = colorMap[card.color] || colorMap.blue;
        var div = document.createElement('div');
        div.className = clr.bg + ' rounded-xl border ' + clr.border + ' p-4';
        div.innerHTML =
            '<div class="flex items-center gap-2 mb-2">' +
            '  <i class="fas ' + card.icon + ' ' + clr.icon + '"></i>' +
            '  <span class="text-xs font-medium ' + clr.text + '">' + t(card.label) + '</span>' +
            '</div>' +
            '<div class="text-lg font-bold text-slate-800 dark:text-slate-100">' + card.value + '</div>' +
            (card.sub ? '<div class="text-xs text-slate-400 dark:text-slate-500 mt-1">' + card.sub + '</div>' : '');
        kpiEl.appendChild(div);
    });
}

function _renderArOverdueAgingChart(aging) {
    var chartEl = document.getElementById('kanban-ar-overdue-aging-chart');
    if (!chartEl) return;

    if (!aging || aging.length === 0) {
        chartEl.innerHTML = '<div class="flex items-center justify-center h-full text-sm text-slate-400">' + t('kanban_no_data') + '</div>';
        return;
    }

    var colors = ['#10b981', '#f59e0b', '#f97316', '#ef4444', '#991b1b'];
    var maxAmount = Math.max.apply(null, aging.map(function(a) { return a.amount; }));
    if (maxAmount === 0) maxAmount = 1;

    var html = '<div class="space-y-2">';
    aging.forEach(function(item, idx) {
        var pct = (item.amount / maxAmount * 100).toFixed(1);
        var barColor = colors[idx] || '#64748b';
        html += '<div class="flex items-center gap-3">' +
            '  <span class="text-xs text-slate-500 dark:text-slate-400 w-16 flex-shrink-0 text-right">' + escapeHtml(item.bucket) + '</span>' +
            '  <div class="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-5 overflow-hidden" style="max-width:300px">' +
            '    <div class="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-1.5" style="width:' + pct + '%;background:' + barColor + '">' +
            '      <span class="text-[10px] text-white font-medium leading-none">' + (pct > 15 ? item.count + '笔' : '') + '</span>' +
            '    </div>' +
            '  </div>' +
            '  <span class="text-xs font-semibold text-slate-700 dark:text-slate-200 w-24 text-right flex-shrink-0">' + fmtAmt(item.amount) + '</span>' +
            '  <span class="text-xs text-slate-400 w-10 text-right flex-shrink-0">' + item.pct + '%</span>' +
            '</div>';
    });
    html += '</div>';
    chartEl.innerHTML = html;
}

function _renderArOverdueCustomerRanking(customers) {
    var listEl = document.getElementById('kanban-ar-overdue-customer-list');
    if (!listEl) return;

    if (!customers || customers.length === 0) {
        listEl.innerHTML = '<div class="text-center py-8 text-sm text-slate-400">' + t('kanban_no_data') + '</div>';
        return;
    }

    var maxAmount = customers[0] ? customers[0].overdue_amount : 1;
    if (maxAmount === 0) maxAmount = 1;

    listEl.innerHTML = '';
    customers.forEach(function(c, idx) {
        var barPct = (c.overdue_amount / maxAmount * 100).toFixed(1);
        var rank = idx + 1;
        var medal = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : '<span class="text-xs text-slate-400">#' + rank + '</span>';

        var item = document.createElement('div');
        item.className = 'flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors duration-100';
        item.dataset.customer = c.customer;
        item.onclick = function() {
            _kanbanOverdueCustomerFilter = c.customer;
            document.getElementById('kanban-ar-overdue-customer-filter-name').textContent = c.customer;
            document.getElementById('kanban-ar-overdue-customer-filter').classList.remove('hidden');
            _renderArOverdueDetail(_kanbanOverdueData.detail_rows);
        };
        item.innerHTML =
            '<span class="w-5 flex-shrink-0 text-center">' + medal + '</span>' +
            '<div class="flex-1 min-w-0">' +
            '  <div class="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">' + escapeHtml(c.customer) + '</div>' +
            '  <div class="flex items-center gap-2 text-[10px] text-slate-400">' +
            '    <span>' + c.overdue_count + '笔</span>' +
            '    <span>最长' + c.max_days + '天</span>' +
            '    <span>平均' + c.avg_days + '天</span>' +
            '  </div>' +
            '  <div class="mt-1 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">' +
            '    <div class="h-full rounded-full bg-amber-500" style="width:' + barPct + '%"></div>' +
            '  </div>' +
            '</div>' +
            '<div class="text-xs font-semibold text-red-500 dark:text-red-400 w-20 text-right flex-shrink-0">' + fmtAmt(c.overdue_amount) + '</div>';
        listEl.appendChild(item);
    });
}

function _renderArOverdueDetail(rows) {
    var detailEl = document.getElementById('kanban-ar-overdue-detail');
    if (!detailEl) return;

    var filterCustomer = _kanbanOverdueCustomerFilter;
    var filtered = rows;
    if (filterCustomer) {
        filtered = rows.filter(function(r) { return r.customer === filterCustomer; });
    }

    if (!filtered || filtered.length === 0) {
        detailEl.innerHTML = '<div class="text-center py-8 text-sm text-slate-400">' + t('kanban_no_data') + '</div>';
        return;
    }

    var sorted = filtered.slice(); // already sorted by overdue_days desc from server

    var html = '<div class="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">' +
        '<table class="w-full text-xs">' +
        '<thead>' +
        '<tr class="bg-slate-100 dark:bg-white/10 text-left text-slate-500 dark:text-slate-400">' +
        '<th class="px-3 py-2.5 font-medium">' + t('kanban_overdue_col_billno') + '</th>' +
        '<th class="px-3 py-2.5 font-medium">' + t('kanban_overdue_col_customer') + '</th>' +
        '<th class="px-3 py-2.5 font-medium">' + t('kanban_overdue_col_date') + '</th>' +
        '<th class="px-3 py-2.5 font-medium">' + t('kanban_overdue_col_due_date') + '</th>' +
        '<th class="px-3 py-2.5 font-medium">' + t('kanban_overdue_col_material') + '</th>' +
        '<th class="px-3 py-2.5 font-medium">' + t('kanban_overdue_col_spec') + '</th>' +
        '<th class="px-3 py-2.5 font-medium text-right">' + t('kanban_overdue_col_amount') + '</th>' +
        '<th class="px-3 py-2.5 font-medium text-right">' + t('kanban_overdue_col_settle') + '</th>' +
        '<th class="px-3 py-2.5 font-medium text-right">' + t('kanban_overdue_col_unsettle') + '</th>' +
        '<th class="px-3 py-2.5 font-medium text-right">' + t('kanban_overdue_col_days') + '</th>' +
        '<th class="px-3 py-2.5 font-medium text-center">' + t('kanban_overdue_col_status') + '</th>' +
        '</tr>' +
        '</thead>' +
        '<tbody id="kanban-ar-overdue-detail-body">';

    sorted.forEach(function(r) {
        var isOverdue = r.overdue_days > 0;
        var statusText = isOverdue ? t('kanban_overdue_status_overdue') : t('kanban_overdue_status_normal');
        var statusClass = isOverdue ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20' : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20';
        var daysClass = isOverdue ? 'text-red-500 dark:text-red-400 font-semibold' : 'text-slate-400';
        html += '<tr class="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer" onclick="openKanbanDetail(\'' + escapeHtml(r.bill_no) + '\')">' +
            '<td class="px-3 py-2 text-primary-600 dark:text-primary-400 font-medium">' + escapeHtml(r.bill_no) + '</td>' +
            '<td class="px-3 py-2 text-slate-700 dark:text-slate-200">' + escapeHtml(r.customer) + '</td>' +
            '<td class="px-3 py-2 text-slate-500">' + escapeHtml(r.date) + '</td>' +
            '<td class="px-3 py-2 text-slate-500">' + escapeHtml(r.due_date) + '</td>' +
            '<td class="px-3 py-2 text-slate-600 dark:text-slate-300">' + escapeHtml(r.material_name || '') + '</td>' +
            '<td class="px-3 py-2 text-slate-500">' + escapeHtml(r.specification || '') + '</td>' +
            '<td class="px-3 py-2 text-right text-slate-700 dark:text-slate-200">' + fmtAmt(r.amount) + '</td>' +
            '<td class="px-3 py-2 text-right text-slate-500">' + fmtAmt(r.settle_amount) + '</td>' +
            '<td class="px-3 py-2 text-right text-slate-700 dark:text-slate-200 font-medium">' + fmtAmt(r.unsettle_amount) + '</td>' +
            '<td class="px-3 py-2 text-right ' + daysClass + '">' + r.overdue_days + '</td>' +
            '<td class="px-3 py-2 text-center"><span class="px-1.5 py-0.5 rounded-full text-[10px] font-medium ' + statusClass + '">' + statusText + '</span></td>' +
            '</tr>';
    });

    html += '</tbody></table></div>';
    detailEl.innerHTML = html;
}

function _renderArOverdueExportToolbar(data) {
    var exportBtn = document.getElementById('kanban-ar-overdue-export-btn');
    if (!exportBtn) return;
    exportBtn.classList.remove('hidden');

    exportBtn.onclick = function() {
        var url = _kanbanArOverdueBuildUrl() + '&export=excel&export_mode=detail';
        window.open(url, '_blank');
    };

    // Show has_more hint
    if (data.has_more) {
        var hasMoreEl = document.getElementById('kanban-ar-overdue-has-more');
        if (hasMoreEl) hasMoreEl.classList.remove('hidden');
    }

    // Clear filter handler
    var clearFilter = document.getElementById('kanban-ar-overdue-clear-filter');
    if (clearFilter) {
        clearFilter.onclick = function() {
            _kanbanOverdueCustomerFilter = '';
            document.getElementById('kanban-ar-overdue-customer-filter').classList.add('hidden');
            _renderArOverdueDetail(_kanbanOverdueData.detail_rows);
        };
    }
}

// =====================================================================
// Overdue Stats Page — 独立逾期统计页面（新版）
// =====================================================================
let _overdueData = null;
let _overdueActiveMainTab = 'detail';

function _overdueBuildUrl() {
    var params = 'days=365';
    var dateFrom = document.getElementById('overdue-date-from');
    var dateTo = document.getElementById('overdue-date-to');
    if (dateFrom && dateFrom.value) params += '&start_date=' + encodeURIComponent(dateFrom.value);
    if (dateTo && dateTo.value) params += '&end_date=' + encodeURIComponent(dateTo.value);
    return '/api/kingdee/ar-overdue?' + params;
}

function loadOverduePage() {
    var loadingEl = document.getElementById('overdue-loading');
    var errorEl = document.getElementById('overdue-error');
    var errorMsg = document.getElementById('overdue-error-msg');
    var contentEl = document.getElementById('overdue-content');

    loadingEl.classList.remove('hidden');
    errorEl.classList.add('hidden');
    contentEl.classList.add('hidden');

    fetch(_overdueBuildUrl())
        .then(function(r) { return r.json(); })
        .then(function(data) {
            loadingEl.classList.add('hidden');
            if (data.status !== 'success') {
                errorMsg.textContent = data.message || '加载失败';
                errorEl.classList.remove('hidden');
                return;
            }
            _overdueData = data;
            contentEl.classList.remove('hidden');
            _renderOverdueKPI(data.kpi);
            _renderOverdueSOPTable();
            _setupOverdueFilters(data);
            _bindOverdueEvents();

            // has_more 提示
            var hasMoreEl = document.getElementById('overdue-has-more');
            if (hasMoreEl) {
                hasMoreEl.classList.toggle('hidden', !data.has_more);
            }

            // 统一通过过滤逻辑渲染所有区域（"仅显示逾期"默认勾选，会自动过滤）
            _applyOverdueFilters();

            // 恢复主Tab状态
            _switchOverdueMainTab(_overdueActiveMainTab);
        })
        .catch(function(err) {
            loadingEl.classList.add('hidden');
            errorMsg.textContent = '网络错误: ' + (err.message || '未知错误');
            errorEl.classList.remove('hidden');
        });
}

function _renderOverdueKPI(kpi) {
    var kpiEl = document.getElementById('overdue-kpi');
    if (!kpiEl) return;

    // 4 cards, no gap
    var cards = [
        {key: 'open_amount', icon: 'fa-exclamation-triangle', color: 'red', label: 'overdue_kpi_open_amount', value: fmtAmt(kpi.open_amount), sub: ''},
        {key: 'settle_rate', icon: 'fa-percentage', color: 'green', label: 'overdue_kpi_rate', value: kpi.settle_rate + '%', sub: '已开票核销 / 价税合计'},
        {key: 'overdue_count', icon: 'fa-calendar-times', color: 'orange', label: 'overdue_kpi_overdue_cnt', value: kpi.overdue_count + ' 笔', sub: ''},
        {key: 'saler_count', icon: 'fa-users', color: 'purple', label: 'overdue_kpi_saler_cnt', value: kpi.saler_count + ' 人', sub: ''},
    ];

    var colorMap = {
        blue: {bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: 'text-blue-500', text: 'text-blue-600 dark:text-blue-400'},
        red: {bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', icon: 'text-red-500', text: 'text-red-600 dark:text-red-400'},
        green: {bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', icon: 'text-emerald-500', text: 'text-emerald-600 dark:text-emerald-400'},
        orange: {bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', icon: 'text-orange-500', text: 'text-orange-600 dark:text-orange-400'},
        purple: {bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', icon: 'text-purple-500', text: 'text-purple-600 dark:text-purple-400'},
    };

    kpiEl.innerHTML = '';
    cards.forEach(function(card) {
        var clr = colorMap[card.color] || colorMap.blue;
        var div = document.createElement('div');
        div.className = clr.bg + ' rounded-xl border ' + clr.border + ' p-4';
        div.innerHTML =
            '<div class="flex items-center gap-2 mb-2">' +
            '  <i class="fas ' + card.icon + ' ' + clr.icon + '"></i>' +
            '  <span class="text-xs font-medium ' + clr.text + '">' + t(card.label) + '</span>' +
            '</div>' +
            '<div class="text-lg font-bold text-slate-800 dark:text-slate-100" data-kpi="' + card.key + '">' + card.value + '</div>' +
            (card.sub ? '<div class="text-xs text-slate-400 dark:text-slate-500 mt-1">' + card.sub + '</div>' : '');
        kpiEl.appendChild(div);
    });
}

function _updateOverdueKPIFromFilter(filtered) {
    // 根据过滤后的明细行更新所有4张 KPI 卡片
    var totalOpen = 0, totalAmount = 0, totalSettle = 0, overdueCount = 0, salerSet = {};
    filtered.forEach(function(r) {
        totalOpen += r.open_amount || 0;
        totalAmount += r.amount || 0;
        totalSettle += r.settle || 0;
        if (r.overdue_days > 0) overdueCount++;
        if (r.saler) salerSet[r.saler] = true;
    });
    var openAmtEl = document.querySelector('#overdue-kpi [data-kpi="open_amount"]');
    if (openAmtEl) openAmtEl.textContent = fmtAmt(totalOpen);
    var settleRateEl = document.querySelector('#overdue-kpi [data-kpi="settle_rate"]');
    if (settleRateEl) {
        var rate = totalAmount > 0 ? (totalSettle / totalAmount * 100).toFixed(1) : '0.0';
        settleRateEl.textContent = rate + '%';
    }
    var overdueCntEl = document.querySelector('#overdue-kpi [data-kpi="overdue_count"]');
    if (overdueCntEl) overdueCntEl.textContent = overdueCount + ' 笔';
    var salerCntEl = document.querySelector('#overdue-kpi [data-kpi="saler_count"]');
    if (salerCntEl) salerCntEl.textContent = Object.keys(salerSet).length + ' 人';
}

function _renderOverdueAgingChart(aging) {
    var chartEl = document.getElementById('overdue-aging-chart');
    if (!chartEl) return;

    if (!aging || aging.length === 0) {
        chartEl.innerHTML = '<div class="flex items-center justify-center py-8 text-sm text-slate-400">暂无数据</div>';
        return;
    }

    var barColors = {
        '轻度': '#10b981',
        '中度': '#f59e0b',
        '危险': '#f97316',
        '可能坏账': '#ef4444',
    };

    var maxAmt = Math.max.apply(null, aging.map(function(a) { return a.amount; }));
    if (maxAmt === 0) maxAmt = 1;
    var totalCount = 0, totalAmt = 0;
    aging.forEach(function(a) { totalCount += a.count || 0; totalAmt += a.amount || 0; });

    var html = '<table class="w-full text-xs">' +
        '<thead><tr class="text-left text-slate-400 dark:text-slate-500 text-[10px]">' +
        '<th class="pb-2">程度</th><th class="pb-2">区间</th><th class="pb-2 text-right">笔数</th>' +
        '<th class="pb-2 text-right">金额</th><th class="pb-2 text-right">占比</th><th class="pb-2">风险说明</th>' +
        '</tr></thead><tbody>';
    aging.forEach(function(item) {
        var barColor = barColors[item.bucket] || '#64748b';
        var barPct = (item.amount / maxAmt * 100).toFixed(1);
        html += '<tr class="aging-row border-t border-slate-100 dark:border-white/5">' +
            '<td class="py-2 pr-2 text-slate-700 dark:text-slate-200 font-medium">' + escapeHtml(item.bucket) + '</td>' +
            '<td class="py-2 pr-2 text-slate-400">' + escapeHtml(item.range) + '</td>' +
            '<td class="py-2 pr-2 text-right text-slate-600 dark:text-slate-300 font-medium">' + item.count + '</td>' +
            '<td class="py-2 pr-2 text-right text-slate-700 dark:text-slate-200 font-medium">' + fmtAmt(item.amount) + '</td>' +
            '<td class="py-2 pr-2 text-right text-slate-500">' + item.pct + '%</td>' +
            '<td class="py-2"><div class="aging-bar-bg"><div class="aging-bar-fill" style="width:' + barPct + '%;background:' + barColor + '"></div></div></td>' +
            '</tr>';
    });
    // 合计行
    html += '<tr class="border-t-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-white/5 font-semibold">' +
        '<td class="py-2.5 pr-2 text-slate-800 dark:text-slate-100">合计</td>' +
        '<td class="py-2.5 pr-2 text-slate-400">-</td>' +
        '<td class="py-2.5 pr-2 text-right text-slate-700 dark:text-slate-200">' + totalCount + '</td>' +
        '<td class="py-2.5 pr-2 text-right text-slate-700 dark:text-slate-200">' + fmtAmt(totalAmt) + '</td>' +
        '<td class="py-2.5 pr-2 text-right text-slate-700 dark:text-slate-200">100%</td>' +
        '<td class="py-2.5"><div class="aging-bar-bg"><div class="aging-bar-fill" style="width:100%;background:#94a3b8"></div></div></td>' +
        '</tr>';
    html += '</tbody></table>';
    chartEl.innerHTML = html;
}

function _renderOverdueWorkflow(riskStageSummary) {
    var wfEl = document.getElementById('overdue-workflow');
    if (!wfEl) return;

    var stages = ['预警', '早期', '中期', '重度', '危险', '坏账'];
    var stageIcons = {
        '预警': '⚪ 预警(≤0天)',
        '早期': '🟢 早期(1-30天)',
        '中期': '🟡 中期(31-60天)',
        '重度': '🟠 重度(61-90天)',
        '危险': '🔴 危险(91-180天)',
        '坏账': '⚫ 坏账(>180天)',
    };
    var stageDotColors = {
        '预警': '#6366f1',
        '早期': '#16a34a',
        '中期': '#ca8a04',
        '重度': '#ea580c',
        '危险': '#dc2626',
        '坏账': '#991b1b',
    };
    var stageBgColors = {
        '预警': 'bg-indigo-50 dark:bg-indigo-900/10',
        '早期': 'bg-green-50 dark:bg-green-900/10',
        '中期': 'bg-yellow-50 dark:bg-yellow-900/10',
        '重度': 'bg-orange-50 dark:bg-orange-900/10',
        '危险': 'bg-red-50 dark:bg-red-900/10',
        '坏账': 'bg-red-100 dark:bg-red-900/20',
    };

    var summaryMap = {};
    if (riskStageSummary) {
        riskStageSummary.forEach(function(s) { summaryMap[s.stage] = s; });
    }

    var maxCount = 0;
    stages.forEach(function(st) {
        var data = summaryMap[st];
        if (data && data.count > maxCount) maxCount = data.count;
    });
    if (maxCount === 0) maxCount = 1;

    var html = '';
    stages.forEach(function(stage) {
        var data = summaryMap[stage] || {count: 0, amount: 0};
        var barPct = (data.count / maxCount * 100).toFixed(0);
        var bg = stageBgColors[stage] || 'bg-slate-50';
        var dotColor = stageDotColors[stage] || '#94a3b8';

        html += '<div class="wf-stage-item ' + bg + '">' +
            '  <span class="wf-stage-dot" style="background:' + dotColor + '"></span>' +
            '  <span class="text-xs font-medium text-slate-700 dark:text-slate-200 flex-1 truncate">' + (stageIcons[stage] || stage) + '</span>' +
            '  <div class="wf-stage-bar-bg"><div class="wf-stage-bar-fill" style="width:' + barPct + '%;background:' + dotColor + '"></div></div>' +
            '  <span class="text-xs font-semibold text-slate-600 dark:text-slate-300 flex-shrink-0 w-8 text-right">' + data.count + '笔</span>' +
            '  <span class="text-xs text-slate-400 dark:text-slate-500 w-16 text-right flex-shrink-0">' + fmtAmt(data.amount) + '</span>' +
            '</div>';
    });
    wfEl.innerHTML = html;
}

function _renderOverdueSalerSummary(salers, salerTotal) {
    var tableEl = document.getElementById('overdue-saler-table');
    if (!tableEl) return;

    if (!salers || salers.length === 0) {
        tableEl.innerHTML = '<div class="text-center py-8 text-sm text-slate-400">暂无数据</div>';
        return;
    }

    var totalCount = 0, totalAmount = 0, totalSettle = 0, totalOpen = 0, totalGap = 0;

    var html = '<div class="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">' +
        '<table class="w-full text-xs">' +
        '<thead>' +
        '<tr class="bg-slate-100 dark:bg-white/10 text-left text-slate-500 dark:text-slate-400">' +
        '<th class="px-3 py-2.5 font-medium cursor-pointer hover:text-slate-700" data-sort="saler">' + t('overdue_saler_col_saler') + ' <i class="fas fa-sort text-[9px]"></i></th>' +
        '<th class="px-3 py-2.5 font-medium text-right cursor-pointer hover:text-slate-700" data-sort="count">' + t('overdue_saler_col_count') + ' <i class="fas fa-sort text-[9px]"></i></th>' +
        '<th class="px-3 py-2.5 font-medium text-right cursor-pointer hover:text-slate-700" data-sort="amount">' + t('overdue_saler_col_amount') + ' <i class="fas fa-sort text-[9px]"></i></th>' +
        '<th class="px-3 py-2.5 font-medium text-right cursor-pointer hover:text-slate-700" data-sort="settle">' + t('overdue_saler_col_settle') + ' <i class="fas fa-sort text-[9px]"></i></th>' +
        '<th class="px-3 py-2.5 font-medium text-right cursor-pointer hover:text-slate-700" data-sort="open_amount">' + t('overdue_saler_col_open_amount') + ' <i class="fas fa-sort text-[9px]"></i></th>' +
        '<th class="px-3 py-2.5 font-medium text-right cursor-pointer hover:text-slate-700" data-sort="rate">' + t('overdue_saler_col_rate') + ' <i class="fas fa-sort text-[9px]"></i></th>' +
        '<th class="px-3 py-2.5 font-medium text-right">' + t('overdue_saler_col_avg_days') + '</th>' +
        '<th class="px-3 py-2.5 font-medium text-right">' + t('overdue_saler_col_max_days') + '</th>' +
        '<th class="px-3 py-2.5 font-medium text-right cursor-pointer hover:text-slate-700" data-sort="gap">' + t('overdue_saler_col_gap') + ' <i class="fas fa-sort text-[9px]"></i></th>' +
        '</tr>' +
        '</thead>' +
        '<tbody>';

    salers.forEach(function(s) {
        totalCount += s.count;
        totalAmount += s.amount;
        totalSettle += s.settle;
        totalOpen += s.open_amount;
        totalGap += s.gap;

        var rowClass = '';
        if (s.rate <= 20) rowClass = 'bg-red-50 dark:bg-red-900/10';
        else if (s.rate <= 50) rowClass = 'bg-orange-50 dark:bg-orange-900/10';
        else rowClass = 'bg-emerald-50 dark:bg-emerald-900/10';

        html += '<tr class="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer ' + rowClass + '" data-saler="' + escapeHtml(s.saler) + '">' +
            '<td class="px-3 py-2 text-slate-700 dark:text-slate-200 font-medium">' + escapeHtml(s.saler) + '</td>' +
            '<td class="px-3 py-2 text-right text-slate-600 dark:text-slate-300">' + s.count + '</td>' +
            '<td class="px-3 py-2 text-right text-slate-700 dark:text-slate-200">' + fmtAmt(s.amount) + '</td>' +
            '<td class="px-3 py-2 text-right text-slate-500">' + fmtAmt(s.settle) + '</td>' +
            '<td class="px-3 py-2 text-right text-slate-700 dark:text-slate-200 font-medium">' + fmtAmt(s.open_amount) + '</td>' +
            '<td class="px-3 py-2 text-right"><span class="' + (s.rate >= 75 ? 'text-emerald-600' : (s.rate >= 50 ? 'text-orange-600' : 'text-red-600')) + ' font-semibold">' + s.rate + '%</span></td>' +
            '<td class="px-3 py-2 text-right text-slate-500">' + s.avg_days + '</td>' +
            '<td class="px-3 py-2 text-right text-slate-500">' + s.max_days + '</td>' +
            '<td class="px-3 py-2 text-right text-rose-600 dark:text-rose-400 font-semibold">' + fmtAmt(s.gap) + '</td>' +
            '</tr>';
    });

    // 合计行
    var totalRate = totalAmount > 0 ? (totalSettle / totalAmount * 100).toFixed(1) : '0.0';
    html += '<tr class="border-t-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-white/5 font-semibold">' +
        '<td class="px-3 py-2.5 text-slate-800 dark:text-slate-100">' + t('overdue_saler_total_row') + '</td>' +
        '<td class="px-3 py-2.5 text-right text-slate-700 dark:text-slate-200">' + totalCount + '</td>' +
        '<td class="px-3 py-2.5 text-right text-slate-700 dark:text-slate-200">' + fmtAmt(totalAmount) + '</td>' +
        '<td class="px-3 py-2.5 text-right text-slate-500">' + fmtAmt(totalSettle) + '</td>' +
        '<td class="px-3 py-2.5 text-right text-slate-700 dark:text-slate-200">' + fmtAmt(totalOpen) + '</td>' +
        '<td class="px-3 py-2.5 text-right text-slate-700 dark:text-slate-200">' + totalRate + '%</td>' +
        '<td class="px-3 py-2.5 text-right text-slate-400">-</td>' +
        '<td class="px-3 py-2.5 text-right text-slate-400">-</td>' +
        '<td class="px-3 py-2.5 text-right text-rose-600 dark:text-rose-400">' + fmtAmt(totalGap) + '</td>' +
        '</tr>';

    // 底部额外2行：整体缺口率 + 总资金缺口
    var st = salerTotal || (_overdueData && _overdueData.saler_total);
    if (st) {
        html += '<tr class="border-t border-slate-200 dark:border-white/10 bg-indigo-50 dark:bg-indigo-900/10 text-xs">' +
            '<td class="px-3 py-2 text-slate-500 italic" colspan="6">整体缺口率</td>' +
            '<td class="px-3 py-2 text-right text-slate-700 dark:text-slate-200" colspan="3">' + (st.total_gap_rate * 100).toFixed(1) + '%</td>' +
            '</tr>';
        html += '<tr class="border-t border-slate-200 dark:border-white/10 bg-indigo-50 dark:bg-indigo-900/10 text-xs">' +
            '<td class="px-3 py-2 text-slate-500 italic" colspan="6">总资金缺口</td>' +
            '<td class="px-3 py-2 text-right text-rose-600 dark:text-rose-400 font-semibold" colspan="3">' + fmtAmt(st.total_gap) + '</td>' +
            '</tr>';
    }

    html += '</tbody></table></div>';
    tableEl.innerHTML = html;

    // 行点击下钻联动
    tableEl.querySelectorAll('tbody tr[data-saler]').forEach(function(tr) {
        tr.addEventListener('click', function() {
            var saler = this.dataset.saler;
            var filterEl = document.getElementById('overdue-saler-filter');
            if (filterEl) {
                filterEl.value = saler;
                // 切到应回款Tab
                _switchOverdueMainTab('detail');
                _applyOverdueFilters();
            }
        });
    });

    // 表头排序
    tableEl.querySelectorAll('th[data-sort]').forEach(function(th) {
        th.addEventListener('click', function() {
            var sortKey = this.dataset.sort;
            var desc = this.dataset.dir !== 'desc';
            var source = _overdueData._filteredSalerSummary || _overdueData.saler_summary;
            var sorted = source.slice().sort(function(a, b) {
                var va = a[sortKey], vb = b[sortKey];
                if (typeof va === 'string') return desc ? vb.localeCompare(va) : va.localeCompare(vb);
                return desc ? (vb - va) : (va - vb);
            });
            th.closest('tr').querySelectorAll('th[data-sort]').forEach(function(h) { delete h.dataset.dir; });
            th.dataset.dir = desc ? 'desc' : 'asc';
            var st = _overdueData._filteredSalerTotal || _overdueData.saler_total;
            _renderOverdueSalerSummary(sorted, st);
        });
    });
}

function _switchOverdueMainTab(tabId) {
    _overdueActiveMainTab = tabId;
    // 切换Tab按钮样式
    document.querySelectorAll('.overdue-main-tab').forEach(function(btn) {
        var isActive = btn.dataset.tab === tabId;
        btn.className = 'overdue-main-tab px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-150 cursor-pointer ' +
            (isActive ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200');
    });
    // 切换Tab内容
    document.querySelectorAll('.overdue-tab-content').forEach(function(el) {
        el.classList.toggle('hidden', el.id !== 'overdue-tab-' + tabId);
    });
}

function _renderOverdueDetail(filtered) {
    var tableEl = document.getElementById('overdue-detail-table');
    var summaryEl = document.getElementById('overdue-detail-summary');
    if (!tableEl) return;

    if (!filtered || filtered.length === 0) {
        tableEl.innerHTML = '<div class="text-center py-8 text-sm text-slate-400">暂无匹配数据</div>';
        if (summaryEl) summaryEl.innerHTML = '';
        return;
    }

    var totalAmt = 0, totalOpen = 0;
    filtered.forEach(function(r) {
        totalAmt += r.amount || 0;
        totalOpen += r.open_amount || 0;
    });

    var riskLabels = {
        '预警': {bg: 'risk-badge-warning', badge: 'risk-badge-warning'},
        '早期': {bg: 'risk-badge-early', badge: 'risk-badge-early'},
        '中期': {bg: 'risk-badge-mid', badge: 'risk-badge-mid'},
        '重度': {bg: 'risk-badge-severe', badge: 'risk-badge-severe'},
        '危险': {bg: 'risk-badge-danger', badge: 'risk-badge-danger'},
        '坏账': {bg: 'risk-badge-baddebt', badge: 'risk-badge-baddebt'},
    };

    // 10列：单据编号/客户/业务员/开票日期/到期日/价税合计/已结算/已开票核销/逾期天数/风险阶段
    var html = '<div class="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">' +
        '<table class="w-full text-xs">' +
        '<thead>' +
        '<tr class="bg-slate-100 dark:bg-white/10 text-left text-slate-500 dark:text-slate-400">' +
        '<th class="px-3 py-2.5 font-medium">' + t('kanban_overdue_col_billno') + '</th>' +
        '<th class="px-3 py-2.5 font-medium">' + t('kanban_overdue_col_customer') + '</th>' +
        '<th class="px-3 py-2.5 font-medium">' + t('overdue_col_saler') + '</th>' +
        '<th class="px-3 py-2.5 font-medium">' + t('kanban_overdue_col_date') + '</th>' +
        '<th class="px-3 py-2.5 font-medium">' + t('kanban_overdue_col_due_date') + '</th>' +
        '<th class="px-3 py-2.5 font-medium text-right">' + t('kanban_overdue_col_amount') + '</th>' +
        '<th class="px-3 py-2.5 font-medium text-right">' + t('kanban_overdue_col_settle') + '</th>' +
        '<th class="px-3 py-2.5 font-medium text-right">' + t('kanban_overdue_col_open_amount') + '</th>' +
        '<th class="px-3 py-2.5 font-medium text-right">' + t('kanban_overdue_col_days') + '</th>' +
        '<th class="px-3 py-2.5 font-medium text-center">' + t('overdue_col_risk') + '</th>' +
        '</tr>' +
        '</thead>' +
        '<tbody>';

    filtered.forEach(function(r) {
        var riskStyle = riskLabels[r.risk_stage] || riskLabels['预警'];
        var daysClass = r.overdue_days > 0 ? 'text-red-500 dark:text-red-400 font-semibold' : 'text-slate-400';
        html += '<tr class="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer" onclick="openKanbanDetail(\'' + escapeHtml(r.bill_no) + '\')">' +
            '<td class="px-3 py-2 text-primary-600 dark:text-primary-400 font-medium">' + escapeHtml(r.bill_no) + '</td>' +
            '<td class="px-3 py-2 text-slate-700 dark:text-slate-200">' + escapeHtml(r.customer) + '</td>' +
            '<td class="px-3 py-2 text-slate-600 dark:text-slate-300">' + escapeHtml(r.saler || '') + '</td>' +
            '<td class="px-3 py-2 text-slate-500">' + escapeHtml(r.date) + '</td>' +
            '<td class="px-3 py-2 text-slate-500">' + escapeHtml(r.due_date) + '</td>' +
            '<td class="px-3 py-2 text-right text-slate-700 dark:text-slate-200">' + fmtAmt(r.amount) + '</td>' +
            '<td class="px-3 py-2 text-right text-slate-700 dark:text-slate-200 font-medium">' + fmtAmt(r.settle) + '</td>' +
            '<td class="px-3 py-2 text-right text-slate-700 dark:text-slate-200 font-medium">' + fmtAmt(r.open_amount) + '</td>' +
            '<td class="px-3 py-2 text-right ' + daysClass + '">' + r.overdue_days + '</td>' +
            '<td class="px-3 py-2 text-center"><span class="px-1.5 py-0.5 rounded-full text-[10px] font-medium ' + riskStyle.badge + '">' + escapeHtml(r.risk_stage) + '</span></td>' +
            '</tr>';
    });

    html += '</tbody></table></div>';
    tableEl.innerHTML = html;

    // Summary
    if (summaryEl) {
        summaryEl.innerHTML = '共 ' + filtered.length + ' 笔 | 应回款 ' + fmtAmt(totalAmt) + ' | 已开票核销 ' + fmtAmt(totalOpen);
    }
}

function _renderOverdueSOPTable() {
    var sopEl = document.getElementById('overdue-sop-table');
    if (!sopEl) return;

    var sopData = [
        {stage: '⚪预警', period: '到期前7天', biz: '无动作', commerce: '无', finance: '微信提醒', director: '无', ceo: '无', deliverable: '无'},
        {stage: '⚪预警', period: '到期前3天', biz: '电话/邮件确认付款计划', commerce: '无', finance: '无动作', director: '无', ceo: '无', deliverable: '《客户付款计划确认记录》'},
        {stage: '⚪预警', period: '到期当天', biz: '无动作', commerce: '无', finance: '账龄标记纳入跟踪', director: '无', ceo: '无', deliverable: '《应回款跟进表》'},
        {stage: '🟢早期', period: '逾期1-30天', biz: '电话了解原因并反馈', commerce: '无', finance: '无动作', director: '无', ceo: '无', deliverable: '更新记录'},
        {stage: '🟡中期', period: '31-60天', biz: '跟进资金/书面付款计划/担保', commerce: '提供记录/订单/毛利率/启动停货', finance: '企查查/对账函回签', director: '✅审批付款计划', ceo: '无', deliverable: '《付款计划表》《对账函》'},
        {stage: '🟠重度', period: '61-90天', biz: '跟踪付款计划/上门催收', commerce: '协助跟进回款', finance: '出具催款函/审核诉讼', director: '✅审批诉讼', ceo: '无', deliverable: '《催收记录台账》《催款函》'},
        {stage: '🔴危险', period: '91-180天', biz: '现场盘点/清货抵债评估', commerce: '配合收集诉讼资料', finance: '诉讼资料收集/律师函', director: '✅审批律师函', ceo: '无', deliverable: '《诉讼资料清单》《律师函》'},
        {stage: '⚫坏账', period: '>180天', biz: '配合对账/坏账核销', commerce: '无', finance: '计提坏账准备/办理核销', director: '✅审批核销', ceo: '✅审批最终核销', deliverable: '《坏账核销申请表》'},
    ];

    var html = '<table class="w-full">' +
        '<thead><tr>' +
        '<th>风险阶段</th><th>逾期阶段</th><th>业务岗动作</th><th>商务岗动作</th><th>财务岗动作</th><th>营销总监审批</th><th>总经理审批</th><th>输出交付物</th>' +
        '</tr></thead><tbody>';
    sopData.forEach(function(row) {
        html += '<tr>' +
            '<td class="font-medium">' + row.stage + '</td>' +
            '<td class="text-slate-500">' + escapeHtml(row.period) + '</td>' +
            '<td>' + escapeHtml(row.biz) + '</td>' +
            '<td>' + escapeHtml(row.commerce) + '</td>' +
            '<td>' + escapeHtml(row.finance) + '</td>' +
            '<td class="text-center">' + escapeHtml(row.director) + '</td>' +
            '<td class="text-center">' + escapeHtml(row.ceo) + '</td>' +
            '<td>' + escapeHtml(row.deliverable) + '</td>' +
            '</tr>';
    });
    html += '</tbody></table>';
    sopEl.innerHTML = html;
}

function _setupOverdueFilters(data) {
    // Saler dropdown
    var salerFilter = document.getElementById('overdue-saler-filter');
    if (salerFilter && data.saler_summary) {
        var currentVal = salerFilter.value;
        salerFilter.innerHTML = '<option value="">全部业务员</option>';
        data.saler_summary.forEach(function(s) {
            salerFilter.innerHTML += '<option value="' + escapeHtml(s.saler) + '">' + escapeHtml(s.saler) + '</option>';
        });
        if (currentVal) salerFilter.value = currentVal;
    }

    // Search by saler name
    var salerSearch = document.getElementById('overdue-saler-search');
    if (salerSearch) {
        // Remove old listener by replacing
        var newSearch = salerSearch.cloneNode(true);
        salerSearch.parentNode.replaceChild(newSearch, salerSearch);
        newSearch.addEventListener('input', function() {
            var kw = this.value.trim().toLowerCase();
            var data = _overdueData;
            if (!data) return;
            var source = data._filteredSalerSummary || data.saler_summary;
            if (!source) return;
            var filtered = source.filter(function(s) { return s.saler.toLowerCase().includes(kw); });
            var st = data._filteredSalerTotal || data.saler_total;
            _renderOverdueSalerSummary(filtered, st);
        });
    }
}

function _bindOverdueEvents() {
    // Query button
    var queryBtn = document.getElementById('overdue-query-btn');
    if (queryBtn) {
        queryBtn.addEventListener('click', function() { loadOverduePage(); });
    }

    // Clear date filter
    var clearDateBtn = document.getElementById('overdue-clear-date-btn');
    if (clearDateBtn) {
        clearDateBtn.addEventListener('click', function() {
            document.getElementById('overdue-date-from').value = '';
            document.getElementById('overdue-date-to').value = '';
            loadOverduePage();
        });
    }

    // Main Tab switching (应回款 / 业务员汇总 / 跟进流程)
    document.querySelectorAll('.overdue-main-tab').forEach(function(btn) {
        var handler = function() { _switchOverdueMainTab(this.dataset.tab); };
        btn.removeEventListener('click', handler);
        btn.addEventListener('click', handler);
    });

    // Only overdue checkbox
    var onlyOverdue = document.getElementById('overdue-only-overdue');
    if (onlyOverdue) {
        onlyOverdue.addEventListener('change', function() { _applyOverdueFilters(); });
    }

    // Saler filter dropdown
    var salerFilter = document.getElementById('overdue-saler-filter');
    if (salerFilter) {
        salerFilter.addEventListener('change', function() { _applyOverdueFilters(); });
    }

    // Risk filter dropdown
    var riskFilter = document.getElementById('overdue-risk-filter');
    if (riskFilter) {
        riskFilter.addEventListener('change', function() { _applyOverdueFilters(); });
    }

    // Keyword input (with debounce)
    var keywordInput = document.getElementById('overdue-keyword');
    if (keywordInput) {
        keywordInput.addEventListener('input', function() {
            if (this._debounceTimer) clearTimeout(this._debounceTimer);
            var self = this;
            self._debounceTimer = setTimeout(function() { _applyOverdueFilters(); }, 300);
        });
    }

    // Export button
    var exportBtn = document.getElementById('overdue-detail-export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            var url = _overdueBuildUrl() + '&export=excel&export_mode=detail';
            window.open(url, '_blank');
        });
    }
}

function _applyOverdueFilters() {
    if (!_overdueData || !_overdueData.detail_rows) return;

    var onlyOverdue = document.getElementById('overdue-only-overdue');
    var filterSaler = document.getElementById('overdue-saler-filter');
    var filterRisk = document.getElementById('overdue-risk-filter');
    var keyword = document.getElementById('overdue-keyword');

    // 1. Apply filters
    var filtered = _overdueData.detail_rows.slice();
    if (onlyOverdue && onlyOverdue.checked) {
        filtered = filtered.filter(function(r) { return r.overdue_days > 0; });
    }
    if (filterSaler && filterSaler.value) {
        filtered = filtered.filter(function(r) { return r.saler === filterSaler.value; });
    }
    if (filterRisk && filterRisk.value) {
        filtered = filtered.filter(function(r) { return r.risk_stage === filterRisk.value; });
    }
    if (keyword && keyword.value.trim()) {
        var kw = keyword.value.trim().toLowerCase();
        filtered = filtered.filter(function(r) {
            return (r.customer && r.customer.toLowerCase().includes(kw)) ||
                   (r.bill_no && r.bill_no.toLowerCase().includes(kw));
        });
    }

    // 2. Render detail table
    _renderOverdueDetail(filtered);

    // 3. Update KPI (all 4 cards)
    _updateOverdueKPIFromFilter(filtered);

    // 4. Compute aging distribution (only overdue rows, open_amount as base)
    var agingBuckets = {
        '\u8f7b\u5ea6': {amount: 0, count: 0, range: '<=30\u5929', risk_desc: '\u7535\u8bdd\u63d0\u9192'},
        '\u4e2d\u5ea6': {amount: 0, count: 0, range: '31-90\u5929', risk_desc: '\u4e66\u9762\u50ac\u6536'},
        '\u5371\u9669': {amount: 0, count: 0, range: '91-180\u5929', risk_desc: '\u5f8b\u5e08\u51fd'},
        '\u53ef\u80fd\u574f\u8d26': {amount: 0, count: 0, range: '>180\u5929', risk_desc: '\u6cd5\u52a1\u4ecb\u5165'},
    };
    var agingTotal = 0;
    filtered.forEach(function(r) {
        if (r.overdue_days > 0 && r.open_amount > 0) {
            var bucketName;
            if (r.overdue_days <= 30) bucketName = '\u8f7b\u5ea6';
            else if (r.overdue_days <= 90) bucketName = '\u4e2d\u5ea6';
            else if (r.overdue_days <= 180) bucketName = '\u5371\u9669';
            else bucketName = '\u53ef\u80fd\u574f\u8d26';
            agingBuckets[bucketName].amount += r.open_amount;
            agingBuckets[bucketName].count += 1;
            agingTotal += r.open_amount;
        }
    });
    var agingOrder = ['\u8f7b\u5ea6', '\u4e2d\u5ea6', '\u5371\u9669', '\u53ef\u80fd\u574f\u8d26'];
    var agingList = agingOrder.map(function(name) {
        var d = agingBuckets[name];
        var pct = agingTotal > 0 ? (d.amount / agingTotal * 100).toFixed(1) : '0.0';
        return {bucket: name, range: d.range, amount: Math.round(d.amount * 100) / 100, count: d.count, pct: Number(pct), risk_desc: d.risk_desc};
    });
    _renderOverdueAgingChart(agingList);

    // 5. Compute risk stage summary (all rows, 6 stages)
    var stageNames = ['\u9884\u8b66', '\u65e9\u671f', '\u4e2d\u671f', '\u91cd\u5ea6', '\u5371\u9669', '\u574f\u8d26'];
    var stageMap = {};
    stageNames.forEach(function(s) { stageMap[s] = {count: 0, amount: 0}; });
    filtered.forEach(function(r) {
        var stage = r.risk_stage;
        if (stageMap[stage]) {
            stageMap[stage].count += 1;
            stageMap[stage].amount += (r.open_amount > 0 ? r.open_amount : 0);
        }
    });
    var riskStageSummary = stageNames.map(function(stage) {
        var d = stageMap[stage];
        return {stage: stage, count: d.count, amount: Math.round(d.amount * 100) / 100};
    });
    _renderOverdueWorkflow(riskStageSummary);

    // 6. Compute saler summary from filtered rows
    var salerMap = {};
    filtered.forEach(function(r) {
        var saler = r.saler || '\u672a\u5206\u914d';
        if (!salerMap[saler]) {
            salerMap[saler] = {count: 0, amount: 0, settle: 0, open_amount: 0, days_list: []};
        }
        salerMap[saler].count += 1;
        salerMap[saler].amount += r.amount || 0;
        salerMap[saler].settle += r.settle || 0;
        salerMap[saler].open_amount += r.open_amount || 0;
        if (r.overdue_days > 0) {
            salerMap[saler].days_list.push(r.overdue_days);
        }
    });
    var salerSummary = [];
    Object.keys(salerMap).forEach(function(saler) {
        var data = salerMap[saler];
        var rate = data.amount > 0 ? (data.settle / data.amount * 100) : 0;
        rate = Math.round(rate * 10) / 10;
        var gap = Math.max(0, (0.75 - rate / 100) * data.amount);
        gap = Math.round(gap * 100) / 100;
        var sum = data.days_list.reduce(function(a, b) { return a + b; }, 0);
        var avg_d = data.days_list.length > 0 ? (sum / data.days_list.length) : 0;
        avg_d = Math.round(avg_d * 10) / 10;
        var max_d = data.days_list.length > 0 ? Math.max.apply(null, data.days_list) : 0;
        salerSummary.push({
            saler: saler,
            count: data.count,
            amount: Math.round(data.amount * 100) / 100,
            settle: Math.round(data.settle * 100) / 100,
            open_amount: Math.round(data.open_amount * 100) / 100,
            rate: rate,
            avg_days: avg_d,
            max_days: max_d,
            gap: gap,
        });
    });
    salerSummary.sort(function(a, b) { return b.open_amount - a.open_amount; });

    // Compute saler total for footer rows
    var totalGap = salerSummary.reduce(function(sum, s) { return sum + s.gap; }, 0);
    var totalAmt = salerSummary.reduce(function(sum, s) { return sum + s.amount; }, 0);
    var totalGapRate = totalAmt > 0 ? (totalGap / totalAmt) : 0;

    // Store for saler search and sort
    _overdueData._filteredSalerSummary = salerSummary;
    _overdueData._filteredSalerTotal = {total_gap_rate: totalGapRate, total_gap: Math.round(totalGap * 100) / 100};

    _renderOverdueSalerSummary(salerSummary, _overdueData._filteredSalerTotal);
}

function openKanbanDetail(billNo) {
    var overlay = document.getElementById('kanban-detail-overlay');
    var titleEl = document.getElementById('kanban-detail-title');
    var formIdEl = document.getElementById('kanban-detail-form-id');
    var bodyEl = document.getElementById('kanban-detail-body');

    titleEl.textContent = billNo;
    formIdEl.textContent = 'AR_receivable · ' + billNo;

    // Map view context to actual Kingdee form IDs for detail lookup
    var actualFormId = 'AR_receivable';

    bodyEl.innerHTML = '<div class="flex items-center justify-center py-12"><i class="fas fa-spinner fa-spin text-2xl text-primary-500"></i><span class="ml-3 text-sm text-slate-400 dark:text-slate-500">' + t('kanban_detail_loading') + '</span></div>';
    overlay.classList.remove('hidden');

    fetch('/api/kingdee/bill-detail?form_id=' + encodeURIComponent(actualFormId) + '&number=' + encodeURIComponent(billNo))
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.status !== 'success') {
                bodyEl.innerHTML = '<div class="text-center py-12 text-red-500 text-sm">' + escapeHtml(data.message || '加载失败') + '</div>';
                return;
            }
            var bill = data.bill || {};
            // view_bill 返回嵌套对象，可能是单条或多条（含表体行）
            // 统一成数组处理
            var items = Array.isArray(bill) ? bill : (bill.rows ? bill.rows : [bill]);

            var html = '';

            // ---------- 摘要卡片 (只显示关键字段) ----------
            var headerItem = items[0] || {};
            html += '<div class="bg-slate-50 dark:bg-white/5 rounded-xl p-4 mb-6">';
            html += '  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">';

            // 关键字段白名单：字段名(兼容F前缀/无F前缀) → 中文标签
            var KEY_FIELDS = [
                // view_bill格式(无F) → query_bill格式(有F) → 标签
                {keys: ['BillNo','FBillNo'],             label: '单据编号',    type: 'text'},
                {keys: ['Date','FDate'],                 label: '单据日期',    type: 'date'},
                {keys: ['CreateDate','FCreateDate'],     label: '创建时间',    type: 'date'},
                {keys: ['DocumentStatus','FDocumentStatus'], label: '单据状态', type: 'status'},
                {keys: ['CustId','FCustId'],             label: '客户',        type: 'name'},
                {keys: ['SupplierId','FSupplierId'],     label: '供应商',      type: 'name'},
                {keys: ['SaleOrgId','FSaleOrgId'],       label: '销售组织',    type: 'name'},
                {keys: ['SalerId','FSalerId'],           label: '业务员',      type: 'name'},
                {keys: ['CreatorId','FCreatorId'],       label: '创建人',      type: 'name'},
                {keys: ['ApproverId','FApproverId'],     label: '审核人',      type: 'name'},
                {keys: ['ApproveDate','FApproveDate'],   label: '审核日期',    type: 'date'},
                {keys: ['BillTypeID','FBillTypeID'],     label: '单据类型',    type: 'text'},
                {keys: ['AllAmount','FAllAmount'],       label: '含税合计',    type: 'money'},
                {keys: ['Amount','FAmount'],             label: '金额',        type: 'money'},
                {keys: ['DeliveryDate','FDeliveryDate'], label: '交货日期',    type: 'date'},
                {keys: ['Note','FNote'],                 label: '备注',        type: 'text'},
                {keys: ['SettleTypeId','FSettleTypeId'], label: '结算方式',    type: 'name'},
                {keys: ['ReceiverId','FReceiverId'],     label: '收货方',      type: 'name'},
                {keys: ['CurrencyId','FCurrencyId'],     label: '币别',        type: 'name'},
                {keys: ['ExchangeRate','FExchangeRate'], label: '汇率',        type: 'text'},
            ];

            KEY_FIELDS.forEach(function(fieldInfo) {
                var val = null;
                for (var i = 0; i < fieldInfo.keys.length; i++) {
                    var k = fieldInfo.keys[i];
                    if (headerItem[k] !== undefined && headerItem[k] !== null) {
                        val = headerItem[k];
                        break;
                    }
                }
                if (val === null) return;
                if (Array.isArray(val)) return;

                var displayVal = _formatDetailValue(fieldInfo.type, val);
                if (displayVal === '') return;

                html += '    <div class="flex flex-col">' +
                    '      <span class="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">' + escapeHtml(fieldInfo.label) + '</span>' +
                    '      <span class="text-sm text-slate-700 dark:text-slate-200 break-all">' + displayVal + '</span>' +
                    '    </div>';
            });

            // 显示白名单之外的其他非数组、非ID字段
            var SKIP_KEYS = ['Id','FFormId','FormId','SaleOrgId_Id','Entity','Entity_1','FEntity','FEntity_1',
                             'ResponseStatus'];
            Object.keys(headerItem).forEach(function(key) {
                // 已通过白名单展示的跳过
                for (var i = 0; i < KEY_FIELDS.length; i++) {
                    for (var j = 0; j < KEY_FIELDS[i].keys.length; j++) {
                        if (KEY_FIELDS[i].keys[j] === key) return;
                    }
                }
                // 跳过内部字段
                if (SKIP_KEYS.indexOf(key) >= 0) return;
                var val = headerItem[key];
                if (val === null || val === undefined) return;
                if (Array.isArray(val)) return;

                var displayVal = _formatDetailValue('text', val);
                if (displayVal === '') return;

                html += '    <div class="flex flex-col">' +
                    '      <span class="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">' + escapeHtml(key) + '</span>' +
                    '      <span class="text-sm text-slate-700 dark:text-slate-200 break-all">' + displayVal + '</span>' +
                    '    </div>';
            });

            html += '  </div></div>';

            // ---------- 表体明细行 (检测所有项中是否有数组字段) ----------
            var bodyRows = [];
            // 从 headerItem 中找数组字段 (表体明细行)
            Object.keys(headerItem).forEach(function(key) {
                var val = headerItem[key];
                if (Array.isArray(val) && val.length > 0) {
                    bodyRows = bodyRows.concat(val);
                }
            });

            if (bodyRows.length > 0) {
                html += '<div class="mb-4">';
                html += '  <h4 class="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">物料明细 (' + bodyRows.length + ' 行)</h4>';
                html += '  <div class="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">';
                html += '    <table class="w-full text-xs">';
                html += '      <thead><tr class="bg-slate-100 dark:bg-white/10 text-left text-slate-500 dark:text-slate-400">';
                html += '        <th class="px-3 py-2.5 font-medium">行号</th>';
                html += '        <th class="px-3 py-2.5 font-medium">物料编码</th>';
                html += '        <th class="px-3 py-2.5 font-medium">物料名称</th>';
                html += '        <th class="px-3 py-2.5 font-medium">规格型号</th>';
                html += '        <th class="px-3 py-2.5 font-medium text-right">数量</th>';
                html += '        <th class="px-3 py-2.5 font-medium">单位</th>';
                html += '        <th class="px-3 py-2.5 font-medium text-right">含税单价</th>';
                html += '        <th class="px-3 py-2.5 font-medium text-right">价税合计</th>';
                html += '      </tr></thead><tbody>';
                bodyRows.forEach(function(row, idx) {
                    if (typeof row !== 'object' || row === null) return;
                    // 兼容 F前缀 和 无F前缀
                    var fMatNum = _tryField(row, 'MaterialId', 'FMaterialId', 'FNumber');
                    var fMatName = _tryField(row, 'MaterialId', 'FMaterialId', 'FName');
                    var fModel = row.FSpecification
                        || _tryField(row, 'MaterialId', 'FMaterialId', 'FSpecification')
                        || _tryField(row, 'MaterialId', 'FMaterialId', 'FModel')
                        || row.FModel || row.Model
                        || row.FMaterialModel || '';
                    var fQty = row.Qty || row.FQty || '';
                    var fUnit = _tryField(row, 'UnitId', 'FUnitId', 'FName');
                    var fPrice = _tryField(row, 'TaxPrice', 'FTaxPrice', null) || _tryField(row, 'Price', 'FPrice', null);
                    // 金额字段可能叫 AllAmount / Amount / FAllAmount / FAmount
                    var fAmt = row.AllAmount || row.Amount || row.FAllAmount || row.FAmount || '';
                    html += '<tr class="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">' +
                        '  <td class="px-3 py-2.5 text-slate-500">' + (idx + 1) + '</td>' +
                        '  <td class="px-3 py-2.5 text-slate-600 dark:text-slate-300 font-mono">' + escapeHtml(String(fMatNum)) + '</td>' +
                        '  <td class="px-3 py-2.5 text-slate-700 dark:text-slate-200">' + escapeHtml(String(fMatName)) + '</td>' +
                        '  <td class="px-3 py-2.5 text-slate-500">' + escapeHtml(String(fModel)) + '</td>' +
                        '  <td class="px-3 py-2.5 text-right text-slate-600 dark:text-slate-300">' + escapeHtml(_formatNumStr(fQty)) + '</td>' +
                        '  <td class="px-3 py-2.5 text-slate-500">' + escapeHtml(String(fUnit)) + '</td>' +
                        '  <td class="px-3 py-2.5 text-right text-slate-600 dark:text-slate-300">' + _formatNumStr(fPrice) + '</td>' +
                        '  <td class="px-3 py-2.5 text-right font-medium text-emerald-600 dark:text-emerald-400">' + _formatNumStr(fAmt) + '</td>' +
                        '</tr>';
                });
                html += '    </tbody></table>';
                html += '  </div></div>';
            }

            bodyEl.innerHTML = html;
        })
        .catch(function(err) {
            bodyEl.innerHTML = '<div class="text-center py-12 text-red-500 text-sm">网络错误: ' + escapeHtml(err.message || '') + '</div>';
        });
}

// 格式化详情中的单个字段值（type: text/date/status/money/name）
function _formatDetailValue(type, val) {
    if (val === null || val === undefined) return '';

    // 嵌套对象处理（必须在字符串之前处理）
    if (typeof val === 'object') {
        // SaleOrgId/FCustId 等关联对象：优先取 Name 数组中的中文值
        if (Array.isArray(val.Name) && val.Name.length > 0) {
            for (var i = 0; i < val.Name.length; i++) {
                var entry = val.Name[i];
                if (entry && (entry.Key === 2052 || entry.LocaleId === 2052)) {
                    return escapeHtml(String(entry.Value || entry.Name || ''));
                }
            }
            var first = val.Name[0];
            if (first) return escapeHtml(String(first.Value || first.Name || ''));
        }
        // 标准嵌套：FName / FNumber
        if (val.FName !== undefined) return escapeHtml(String(val.FName));
        if (val.FNumber !== undefined) return escapeHtml(String(val.FNumber));
        if (val.FValue !== undefined) return escapeHtml(String(val.FValue));
        if (val.Number !== undefined) return escapeHtml(String(val.Number));
        return '';
    }

    // 字符串/数字
    if (typeof val === 'string' || typeof val === 'number') {
        var s = String(val);
        // 根据 type 格式化
        if (type === 'money') {
            var n = parseFloat(s);
            if (!isNaN(n)) {
                return '<span class="font-semibold text-emerald-600 dark:text-emerald-400">¥' +
                    n.toLocaleString('zh-CN', {minimumFractionDigits:2, maximumFractionDigits:2}) + '</span>';
            }
        } else if (type === 'status') {
            var MAP = {'Z': '草稿', 'A': '待提交', 'B': '审核中', 'C': '已审核', 'D': '重新审核'};
            return '<span class="font-medium text-primary-600 dark:text-primary-400">' +
                escapeHtml(MAP[s.trim()] || s) + '</span>';
        } else if (type === 'date') {
            if (s.indexOf('T') > 0) s = s.split('T')[0];
        }
        return escapeHtml(s);
    }

    return '';
}

// 从表体行对象中提取字段值，兼容 F前缀 和 无F前缀 两种格式
function _tryField(row, fieldNoF, fieldWithF, subField) {
    if (!row || typeof row !== 'object') return '';
    // 先尝试无 F 前缀，再试有 F 前缀
    var val = row[fieldNoF];
    if (val === undefined || val === null) val = row[fieldWithF];
    if (val === undefined || val === null) return '';

    // 如果是嵌套对象（如 MaterialId 下有 FNumber/Name）
    if (subField && typeof val === 'object') {
        if (val.FNumber !== undefined && subField === 'FNumber') return String(val.FNumber);
        if (val.Number !== undefined && subField === 'FNumber') return String(val.Number);
        if (val.FName !== undefined && subField === 'FName') return String(val.FName);
        // view_bill 中 Name 是数组
        if (subField === 'FName' && Array.isArray(val.Name)) {
            for (var i = 0; i < val.Name.length; i++) {
                var entry = val.Name[i];
                if (entry && (entry.Key === 2052 || entry.LocaleId === 2052)) {
                    return String(entry.Value || entry.Name || '');
                }
            }
            if (val.Name.length > 0 && val.Name[0]) return String(val.Name[0].Value || val.Name[0].Name || '');
        }
        // 通用兜底：直接尝试 subField 属性名（如 FSpecification）
        if (val[subField] !== undefined && val[subField] !== null) return String(val[subField]);
        return '';
    }
    return String(val);
}

function _formatNumStr(val) {
    if (val === null || val === undefined || val === '') return '';
    var n = parseFloat(String(val));
    if (isNaN(n)) return escapeHtml(String(val));
    return n.toLocaleString('zh-CN', {minimumFractionDigits:2, maximumFractionDigits:4});
}

function _formatQty(val) {
    if (val === null || val === undefined || val === '') return '';
    var n = parseFloat(String(val));
    if (isNaN(n)) return escapeHtml(String(val));
    return n.toLocaleString('zh-CN', {minimumFractionDigits:0, maximumFractionDigits:4});
}

function closeKanbanDetail() {
    document.getElementById('kanban-detail-overlay').classList.add('hidden');
    window.__kanbanCurrentCustomerIdx = undefined;
    window.__kanbanFromPerspective = undefined;
}

// ─── Conversion: perspective modal (filtered by type) ───
function _kanbanOpenPerspectiveModal(pairType) {
    var detail = window.__kanbanConversionDetail;
    if (!detail) return;
    var custSummary = detail.customer_summary || [];
    var filtered = [];
    var globalIndices = [];
    custSummary.forEach(function(c, idx) {
        if (c.type === pairType) {
            filtered.push(c);
            globalIndices.push(idx);
        }
    });
    window.__kanbanFromPerspective = pairType;

    var overlay = document.getElementById('kanban-detail-overlay');
    var titleEl = document.getElementById('kanban-detail-title');
    var formIdEl = document.getElementById('kanban-detail-form-id');
    var bodyEl = document.getElementById('kanban-detail-body');
    var modalContainer = overlay.querySelector('div.bg-white');
    if (modalContainer) modalContainer.classList.add('kanban-max-w-6xl');

    var typeLabel = pairType === 'quotation' ? '报价单' : '样品单';
    titleEl.textContent = typeLabel + '视角 - 按客户转化汇总';
    formIdEl.textContent = '';

    var html = '<div class="space-y-3">';
    if (filtered.length === 0) {
        html += '<p class="text-xs text-slate-400 italic py-2">暂无数据</p>';
    } else {
        html += '<div class="overflow-x-auto rounded-lg border border-slate-200 dark:border-white/10">';
        html += '<table class="w-full text-xs border-collapse">';
        html += '<thead><tr class="bg-slate-100 dark:bg-white/5">';
        html += '<th class="px-2.5 py-2 text-left font-medium text-slate-500 dark:text-slate-400">客户</th>';
        html += '<th class="px-2.5 py-2 text-left font-medium text-slate-500 dark:text-slate-400">类型</th>';
        html += '<th class="px-2.5 py-2 text-right font-medium text-slate-500 dark:text-slate-400">总数</th>';
        html += '<th class="px-2.5 py-2 text-right font-medium text-slate-500 dark:text-slate-400">已转化</th>';
        html += '<th class="px-2.5 py-2 text-right font-medium text-slate-500 dark:text-slate-400">转化率</th>';
        html += '</tr></thead><tbody>';
        filtered.forEach(function(c, idx) {
            var isQuotation = c.type === 'quotation';
            var tLabel = isQuotation ? '报价单' : '样品单';
            var gIdx = globalIndices[idx];
            html += '<tr class="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer" onclick="_kanbanOpenCustomerBills(' + gIdx + ')">';
            html += '<td class="px-2.5 py-1.5 text-slate-700 dark:text-slate-300 font-medium">' + escapeHtml(c.customer) + '</td>';
            html += '<td class="px-2.5 py-1.5"><span class="inline-block px-1.5 py-0.5 text-xs rounded ' + (isQuotation ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400') + '">' + tLabel + '</span></td>';
            html += '<td class="px-2.5 py-1.5 text-right text-slate-600 dark:text-slate-300">' + c.total + '</td>';
            html += '<td class="px-2.5 py-1.5 text-right text-slate-600 dark:text-slate-300">' + c.converted + '</td>';
            html += '<td class="px-2.5 py-1.5 text-right font-medium ' + (isQuotation ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400') + '">' + (c.rate || '0%') + '</td>';
            html += '</tr>';
        });
        html += '</tbody></table></div>';
    }
    html += '</div>';
    bodyEl.innerHTML = html;
    overlay.classList.remove('hidden');
}

// ─── Conversion: pair detail modal (dual-bill) ───
function _kanbanOpenConversionPairDetail(pairType, idx) {
    var detail = window.__kanbanConversionDetail;
    if (!detail) return;
    var pairs = pairType === 'quotation' ? (detail.quotation_pairs || []) : (detail.sample_pairs || []);
    if (idx >= pairs.length) return;
    var pair = pairs[idx];

    var overlay = document.getElementById('kanban-detail-overlay');
    var titleEl = document.getElementById('kanban-detail-title');
    var formIdEl = document.getElementById('kanban-detail-form-id');
    var bodyEl = document.getElementById('kanban-detail-body');
    var modalContainer = overlay.querySelector('div.bg-white');
    if (modalContainer) modalContainer.classList.add('kanban-max-w-6xl');

    var sourceFormId, targetFormId, sourceBillNo, targetBillNo, sourceLabel, targetLabel;
    if (pairType === 'quotation') {
        sourceFormId = 'SAL_QUOTATION'; targetFormId = 'SAL_SaleOrder';
        sourceBillNo = pair.qt_bill; targetBillNo = pair.so_bill;
        sourceLabel = '报价单';
        targetLabel = '销售订单';
    } else {
        sourceFormId = 'SAL_SaleOrder'; targetFormId = 'SAL_SaleOrder';
        sourceBillNo = pair.sample_bill; targetBillNo = pair.normal_bill;
        sourceLabel = '样品单';
        targetLabel = '正式订单';
    }

    titleEl.textContent = sourceLabel + ' ' + sourceBillNo + ' → ' + targetLabel + ' ' + targetBillNo;
    formIdEl.textContent = '';
    bodyEl.innerHTML = '<div class="flex items-center justify-center py-12"><i class="fas fa-spinner fa-spin text-2xl text-primary-500"></i><span class="ml-3 text-sm text-slate-400 dark:text-slate-500">加载中...</span></div>';
    overlay.classList.remove('hidden');

    var sp = fetch('/api/kingdee/bill-detail?form_id=' + encodeURIComponent(sourceFormId) + '&number=' + encodeURIComponent(sourceBillNo)).then(function(r) { return r.json(); });
    var tp = fetch('/api/kingdee/bill-detail?form_id=' + encodeURIComponent(targetFormId) + '&number=' + encodeURIComponent(targetBillNo)).then(function(r) { return r.json(); });

    Promise.all([sp, tp])
        .then(function(results) {
            var html = '<div class="kanban-dual-bills">';
            html += _kanbanRenderBillDetailCard(results[0], sourceLabel + ' ' + sourceBillNo, sourceFormId);
            html += _kanbanRenderBillDetailCard(results[1], targetLabel + ' ' + targetBillNo, targetFormId);
            html += '</div>';
            bodyEl.innerHTML = html;
            _appendKanbanBackButton();
        })
        .catch(function(err) {
            bodyEl.innerHTML = '<div class="text-center py-12 text-red-500 text-sm">网络错误: ' + escapeHtml(err.message || '') + '</div>';
            _appendKanbanBackButton();
        });
}

// ─── Conversion: single bill summary card (for dual-panel) ───
function _kanbanRenderBillDetailCard(apiResult, title, formId) {
    if (apiResult.status !== 'success') {
        return '<div class="kanban-dual-bill-panel"><div class="text-center py-8 text-red-500 text-sm">' + escapeHtml(apiResult.message || '加载失败') + '</div></div>';
    }
    var bill = apiResult.bill || {};
    var items = Array.isArray(bill) ? bill : (bill.rows ? bill.rows : [bill]);
    var headerItem = items[0] || {};

    var html = '<div class="kanban-dual-bill-panel">';
    html += '<h4 class="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">' + escapeHtml(title) + '</h4>';
    html += '<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">';

    var KEY_FIELDS = [
        {keys: ['BillNo','FBillNo'], label: '单据编号', type: 'text'},
        {keys: ['Date','FDate'], label: '单据日期', type: 'date'},
        {keys: ['CreateDate','FCreateDate'], label: '创建时间', type: 'date'},
        {keys: ['DocumentStatus','FDocumentStatus'], label: '单据状态', type: 'status'},
        {keys: ['CustId','FCustId'], label: '客户', type: 'name'},
        {keys: ['SupplierId','FSupplierId'], label: '供应商', type: 'name'},
        {keys: ['SaleOrgId','FSaleOrgId'], label: '销售组织', type: 'name'},
        {keys: ['SalerId','FSalerId'], label: '业务员', type: 'name'},
        {keys: ['CreatorId','FCreatorId'], label: '创建人', type: 'name'},
        {keys: ['ApproverId','FApproverId'], label: '审核人', type: 'name'},
        {keys: ['ApproveDate','FApproveDate'], label: '审核日期', type: 'date'},
        {keys: ['BillTypeID','FBillTypeID'], label: '单据类型', type: 'text'},
        {keys: ['AllAmount','FAllAmount'], label: '含税合计', type: 'money'},
        {keys: ['Amount','FAmount'], label: '金额', type: 'money'},
        {keys: ['DeliveryDate','FDeliveryDate'], label: '交货日期', type: 'date'},
        {keys: ['Note','FNote'], label: '备注', type: 'text'},
        {keys: ['SettleTypeId','FSettleTypeId'], label: '结算方式', type: 'name'},
        {keys: ['ReceiverId','FReceiverId'], label: '收货方', type: 'name'},
        {keys: ['CurrencyId','FCurrencyId'], label: '币别', type: 'name'},
        {keys: ['ExchangeRate','FExchangeRate'], label: '汇率', type: 'text'},
    ];

    KEY_FIELDS.forEach(function(fi) {
        var val = null;
        for (var i = 0; i < fi.keys.length; i++) {
            var k = fi.keys[i];
            if (headerItem[k] !== undefined && headerItem[k] !== null) { val = headerItem[k]; break; }
        }
        if (val === null || Array.isArray(val)) return;
        var dv = _formatDetailValue(fi.type, val);
        if (dv === '') return;
        html += '<div class="flex flex-col"><span class="text-[11px] text-slate-400 dark:text-slate-500">' + escapeHtml(fi.label) + '</span><span class="text-xs text-slate-700 dark:text-slate-200 break-all">' + dv + '</span></div>';
    });

    var SKIP_KEYS = ['Id','FFormId','FormId','SaleOrgId_Id','Entity','Entity_1','FEntity','FEntity_1','ResponseStatus'];
    Object.keys(headerItem).forEach(function(key) {
        for (var i = 0; i < KEY_FIELDS.length; i++) {
            for (var j = 0; j < KEY_FIELDS[i].keys.length; j++) {
                if (KEY_FIELDS[i].keys[j] === key) return;
            }
        }
        if (SKIP_KEYS.indexOf(key) >= 0) return;
        var val = headerItem[key];
        if (val === null || val === undefined) return;
        if (Array.isArray(val)) return;
        var displayVal = _formatDetailValue('text', val);
        if (displayVal === '') return;
        html += '<div class="flex flex-col"><span class="text-[11px] text-slate-400 dark:text-slate-500">' + escapeHtml(key) + '</span><span class="text-xs text-slate-700 dark:text-slate-200 break-all">' + displayVal + '</span></div>';
    });

    html += '</div>';

    // Material lines
    var bodyRows = [];
    Object.keys(headerItem).forEach(function(key) {
        var v = headerItem[key];
        if (Array.isArray(v) && v.length > 0) bodyRows = bodyRows.concat(v);
    });

    if (bodyRows.length > 0) {
        html += '<div class="border-t border-slate-200 dark:border-white/10 pt-3 mt-3">';
        html += '<h5 class="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2">物料明细 (' + bodyRows.length + ' 行)</h5>';
        html += '<table class="w-full text-[11px]"><thead><tr class="text-left text-slate-400 dark:text-slate-500">';
        html += '<th class="pb-1 font-medium">物料编码</th><th class="pb-1 font-medium">物料名称</th><th class="pb-1 font-medium">规格型号</th><th class="pb-1 font-medium text-right">数量</th><th class="pb-1 font-medium">单位</th><th class="pb-1 font-medium text-right">含税单价</th><th class="pb-1 font-medium text-right">价税合计</th>';
        html += '</tr></thead><tbody>';
        bodyRows.forEach(function(row, ridx) {
            if (typeof row !== 'object' || row === null) return;
            var fMatNum = _tryField(row, 'MaterialId', 'FMaterialId', 'FNumber');
            var fMatName = _tryField(row, 'MaterialId', 'FMaterialId', 'FName');
            var fModel = row.FSpecification
                || _tryField(row, 'MaterialId', 'FMaterialId', 'FSpecification')
                || _tryField(row, 'MaterialId', 'FMaterialId', 'FModel')
                || row.FModel || row.Model
                || row.FMaterialModel || '';
            var fQty = row.Qty || row.FQty || '';
            var fUnit = _tryField(row, 'UnitId', 'FUnitId', 'FName');
            var fPrice = _tryField(row, 'TaxPrice', 'FTaxPrice', null) || _tryField(row, 'Price', 'FPrice', null);
            var fAmt = row.AllAmount || row.Amount || row.FAllAmount || row.FAmount || '';
            html += '<tr class="border-t border-slate-100 dark:border-white/5">' +
                '<td class="py-1 pr-2 text-slate-600 dark:text-slate-300 font-mono">' + escapeHtml(String(fMatNum)) + '</td>' +
                '<td class="py-1 pr-2 text-slate-700 dark:text-slate-200 truncate max-w-[120px]">' + escapeHtml(String(fMatName)) + '</td>' +
                '<td class="py-1 pr-2 text-slate-500">' + escapeHtml(String(fModel)) + '</td>' +
                '<td class="py-1 text-right text-slate-500">' + escapeHtml(_formatNumStr(fQty)) + '</td>' +
                '<td class="py-1 text-slate-500">' + escapeHtml(String(fUnit)) + '</td>' +
                '<td class="py-1 text-right text-slate-500">' + _formatNumStr(fPrice) + '</td>' +
                '<td class="py-1 text-right font-medium text-emerald-600 dark:text-emerald-400">' + _formatNumStr(fAmt) + '</td></tr>';
        });
        html += '</tbody></table></div>';
    }
    html += '</div>';
    return html;
}

// ─── Conversion: customer bills list modal (from preloaded data) ───
function _kanbanOpenCustomerBills(customerIdx) {
    var detail = window.__kanbanConversionDetail;
    if (!detail) return;
    var custSummary = detail.customer_summary || [];
    if (customerIdx >= custSummary.length) return;
    var c = custSummary[customerIdx];
    window.__kanbanCurrentCustomerIdx = customerIdx;

    var overlay = document.getElementById('kanban-detail-overlay');
    var titleEl = document.getElementById('kanban-detail-title');
    var formIdEl = document.getElementById('kanban-detail-form-id');
    var bodyEl = document.getElementById('kanban-detail-body');
    var modalContainer = overlay.querySelector('div.bg-white');
    if (modalContainer) modalContainer.classList.add('kanban-max-w-6xl');

    var typeLabel = c.type === 'quotation' ? '报价单' : '样品单';
    titleEl.textContent = escapeHtml(c.customer) + ' - ' + typeLabel + '转化明细';
    formIdEl.textContent = '';

    // ─── Filter converted pairs by customer ───
    var qPairs = detail.quotation_pairs || [];
    var sPairs = detail.sample_pairs || [];
    var custBills = detail.customer_bills_detail || [];
    var pairType = c.type;

    var filteredPairs = [];
    var globalIndices = [];
    var pairs = pairType === 'quotation' ? qPairs : sPairs;
    pairs.forEach(function(p, idx) {
        if (p.customer === c.customer) {
            filteredPairs.push(p);
            globalIndices.push(idx);
        }
    });

    // ─── Filter unconverted bills by customer & type ───
    var unconvertedBills = [];
    custBills.forEach(function(b) {
        if (b.customer === c.customer && b.type === pairType && !b.converted) {
            unconvertedBills.push(b);
        }
    });

    var html = '<div class="space-y-3">';

    // ─── 已转化单据对照 section ───
    html += '<div>';
    if (pairType === 'quotation') {
        html += '<h5 class="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">' + t('kanban_conversion_quotation_title') + '</h5>';
    } else {
        html += '<h5 class="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">' + t('kanban_conversion_sample_title') + '</h5>';
    }

    if (filteredPairs.length === 0) {
        html += '<p class="text-xs text-slate-400 italic py-2">' + t('kanban_conversion_no_data') + '</p>';
    } else {
        html += '<div class="overflow-x-auto rounded-lg border border-slate-200 dark:border-white/10">';
        html += '<table class="w-full text-xs border-collapse">';
        html += '<thead><tr class="bg-slate-100 dark:bg-white/5">';
        html += '<th class="px-2.5 py-2 text-left font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">' + t('kanban_conversion_column_customer') + '</th>';
        html += '<th class="px-2.5 py-2 text-right font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">' + t('kanban_conversion_column_amount') + '</th>';
        if (pairType === 'quotation') {
            html += '<th class="px-2.5 py-2 text-left font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">' + t('kanban_conversion_column_qt_bill') + '</th>';
            html += '<th class="px-2.5 py-2 text-left font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">' + t('kanban_conversion_column_qt_date') + '</th>';
            html += '<th class="px-2.5 py-2 text-left font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">' + t('kanban_conversion_column_so_bill') + '</th>';
            html += '<th class="px-2.5 py-2 text-left font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">' + t('kanban_conversion_column_so_date') + '</th>';
        } else {
            html += '<th class="px-2.5 py-2 text-left font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">' + t('kanban_conversion_column_sample_bill') + '</th>';
            html += '<th class="px-2.5 py-2 text-left font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">' + t('kanban_conversion_column_sample_date') + '</th>';
            html += '<th class="px-2.5 py-2 text-left font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">' + t('kanban_conversion_column_normal_bill') + '</th>';
            html += '<th class="px-2.5 py-2 text-left font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">' + t('kanban_conversion_column_normal_date') + '</th>';
        }
        html += '<th class="px-2.5 py-2 text-left font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">' + t('kanban_conversion_column_material') + '</th>';
        html += '<th class="px-2.5 py-2 text-left font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">' + t('kanban_conversion_column_spec') + '</th>';
        html += '</tr></thead><tbody>';
        filteredPairs.forEach(function(p, idx) {
            var gIdx = globalIndices[idx];
            html += '<tr class="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer" onclick="_kanbanOpenConversionPairDetail(\'' + pairType + '\',' + gIdx + ')">';
            html += '<td class="px-2.5 py-1.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">' + escapeHtml(p.customer) + '</td>';
            html += '<td class="px-2.5 py-1.5 text-right text-emerald-600 dark:text-emerald-400 whitespace-nowrap font-medium">¥' + Number(p.amount).toLocaleString('zh-CN', {minimumFractionDigits:2, maximumFractionDigits:2}) + '</td>';
            if (pairType === 'quotation') {
                html += '<td class="px-2.5 py-1.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">' + escapeHtml(p.qt_bill) + '</td>';
                html += '<td class="px-2.5 py-1.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">' + escapeHtml(p.qt_date) + '</td>';
                html += '<td class="px-2.5 py-1.5 text-slate-700 dark:text-slate-300 whitespace-nowrap font-medium">' + escapeHtml(p.so_bill) + '</td>';
                html += '<td class="px-2.5 py-1.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">' + escapeHtml(p.so_date) + '</td>';
            } else {
                html += '<td class="px-2.5 py-1.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">' + escapeHtml(p.sample_bill) + '</td>';
                html += '<td class="px-2.5 py-1.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">' + escapeHtml(p.sample_date) + '</td>';
                html += '<td class="px-2.5 py-1.5 text-slate-700 dark:text-slate-300 whitespace-nowrap font-medium">' + escapeHtml(p.normal_bill) + '</td>';
                html += '<td class="px-2.5 py-1.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">' + escapeHtml(p.normal_date) + '</td>';
            }
            html += '<td class="px-2.5 py-1.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">' + escapeHtml(p.material) + '</td>';
            html += '<td class="px-2.5 py-1.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">' + escapeHtml(p.spec) + '</td>';
            html += '</tr>';
        });
        html += '</tbody></table></div>';
    }
    html += '</div>';

    // ─── 未转化单据 section ───
    html += '<div class="mt-4">';
    html += '<h5 class="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">未转化单据</h5>';
    if (unconvertedBills.length === 0) {
        html += '<p class="text-xs text-slate-400 italic py-2">暂无未转化单据</p>';
    } else {
        html += '<div class="overflow-x-auto rounded-lg border border-slate-200 dark:border-white/10">';
        html += '<table class="w-full text-xs border-collapse">';
        html += '<thead><tr class="bg-slate-100 dark:bg-white/5">';
        html += '<th class="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">单据编号</th>';
        html += '<th class="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">日期</th>';
        html += '<th class="px-3 py-2 text-right font-medium text-slate-500 dark:text-slate-400">价税合计</th>';
        html += '<th class="px-3 py-2 text-center font-medium text-slate-500 dark:text-slate-400">状态</th>';
        html += '</tr></thead><tbody>';
        unconvertedBills.forEach(function(b) {
            var formIdForDetail = b.type === 'quotation' ? 'SAL_QUOTATION' : 'SAL_SaleOrder';
            html += '<tr class="border-t border-slate-100 dark:border-white/5 kanban-bill-row" onclick="_kanbanOpenSingleBillDetail(\'' + escapeHtml(b.bill_no).replace(/'/g, "\\'") + '\', \'' + formIdForDetail + '\')">';
            html += '<td class="px-3 py-2 text-slate-700 dark:text-slate-300 font-mono">' + escapeHtml(b.bill_no) + '</td>';
            html += '<td class="px-3 py-2 text-slate-500 dark:text-slate-400">' + escapeHtml(b.date) + '</td>';
            html += '<td class="px-3 py-2 text-right text-slate-600 dark:text-slate-300 font-medium">¥' + Number(b.amount).toLocaleString('zh-CN', {minimumFractionDigits:2, maximumFractionDigits:2}) + '</td>';
            html += '<td class="px-3 py-2 text-center"><span class="inline-block px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500"><i class="far fa-clock mr-0.5"></i>未转化</span></td>';
            html += '</tr>';
        });
        html += '</tbody></table></div>';
    }
    html += '</div>';

    html += '</div>';
    bodyEl.innerHTML = html;

    // 如果是从视角弹窗进入，添加返回按钮
    if (window.__kanbanFromPerspective) {
        var headerLeft = document.querySelector('#kanban-detail-overlay .flex.items-center.justify-between > div:first-child');
        if (headerLeft) {
            var existing = headerLeft.querySelector('.kanban-back-btn');
            if (existing) existing.remove();
            var btn = document.createElement('button');
            btn.className = 'kanban-back-btn p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer transition-colors duration-150 flex items-center justify-center';
            btn.innerHTML = '<i class="fas fa-arrow-left"></i>';
            btn.title = '返回';
            var savedType = window.__kanbanFromPerspective;
            btn.onclick = function() {
                window.__kanbanFromPerspective = undefined;
                _kanbanOpenPerspectiveModal(savedType);
            };
            headerLeft.insertBefore(btn, headerLeft.firstChild);
        }
    }

    overlay.classList.remove('hidden');
}

// ─── Conversion: single bill detail (from customer bills list) ───
function _kanbanOpenSingleBillDetail(billNo, formId) {
    var overlay = document.getElementById('kanban-detail-overlay');
    var titleEl = document.getElementById('kanban-detail-title');
    var formIdEl = document.getElementById('kanban-detail-form-id');
    var bodyEl = document.getElementById('kanban-detail-body');
    var modalContainer = overlay.querySelector('div.bg-white');
    if (modalContainer) modalContainer.classList.add('kanban-max-w-6xl');

    titleEl.textContent = billNo;
    formIdEl.textContent = formId + ' · ' + billNo;
    bodyEl.innerHTML = '<div class="flex items-center justify-center py-12"><i class="fas fa-spinner fa-spin text-2xl text-primary-500"></i><span class="ml-3 text-sm text-slate-400 dark:text-slate-500">加载中...</span></div>';
    overlay.classList.remove('hidden');

    fetch('/api/kingdee/bill-detail?form_id=' + encodeURIComponent(formId) + '&number=' + encodeURIComponent(billNo))
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.status !== 'success') {
                bodyEl.innerHTML = '<div class="text-center py-12 text-red-500 text-sm">' + escapeHtml(data.message || '加载失败') + '</div>';
                return;
            }
            var bill = data.bill || {};
            var items = Array.isArray(bill) ? bill : (bill.rows ? bill.rows : [bill]);

            var html = '';
            var headerItem = items[0] || {};
            html += '<div class="bg-slate-50 dark:bg-white/5 rounded-xl p-4 mb-6">';
            html += '  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">';

            var KEY_FIELDS = [
                {keys: ['BillNo','FBillNo'],             label: '单据编号',    type: 'text'},
                {keys: ['Date','FDate'],                 label: '单据日期',    type: 'date'},
                {keys: ['CreateDate','FCreateDate'],     label: '创建时间',    type: 'date'},
                {keys: ['DocumentStatus','FDocumentStatus'], label: '单据状态', type: 'status'},
                {keys: ['CustId','FCustId'],             label: '客户',        type: 'name'},
                {keys: ['SupplierId','FSupplierId'],     label: '供应商',      type: 'name'},
                {keys: ['SaleOrgId','FSaleOrgId'],       label: '销售组织',    type: 'name'},
                {keys: ['SalerId','FSalerId'],           label: '业务员',      type: 'name'},
                {keys: ['CreatorId','FCreatorId'],       label: '创建人',      type: 'name'},
                {keys: ['ApproverId','FApproverId'],     label: '审核人',      type: 'name'},
                {keys: ['ApproveDate','FApproveDate'],   label: '审核日期',    type: 'date'},
                {keys: ['BillTypeID','FBillTypeID'],     label: '单据类型',    type: 'text'},
                {keys: ['AllAmount','FAllAmount'],       label: '含税合计',    type: 'money'},
                {keys: ['Amount','FAmount'],             label: '金额',        type: 'money'},
                {keys: ['DeliveryDate','FDeliveryDate'], label: '交货日期',    type: 'date'},
                {keys: ['Note','FNote'],                 label: '备注',        type: 'text'},
                {keys: ['SettleTypeId','FSettleTypeId'], label: '结算方式',    type: 'name'},
                {keys: ['ReceiverId','FReceiverId'],     label: '收货方',      type: 'name'},
                {keys: ['CurrencyId','FCurrencyId'],     label: '币别',        type: 'name'},
                {keys: ['ExchangeRate','FExchangeRate'], label: '汇率',        type: 'text'},
            ];

            KEY_FIELDS.forEach(function(fieldInfo) {
                var val = null;
                for (var i = 0; i < fieldInfo.keys.length; i++) {
                    var k = fieldInfo.keys[i];
                    if (headerItem[k] !== undefined && headerItem[k] !== null) {
                        val = headerItem[k];
                        break;
                    }
                }
                if (val === null) return;
                if (Array.isArray(val)) return;
                var displayVal = _formatDetailValue(fieldInfo.type, val);
                if (displayVal === '') return;
                html += '    <div class="flex flex-col">' +
                    '      <span class="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">' + escapeHtml(fieldInfo.label) + '</span>' +
                    '      <span class="text-sm text-slate-700 dark:text-slate-200 break-all">' + displayVal + '</span>' +
                    '    </div>';
            });

            var SKIP_KEYS = ['Id','FFormId','FormId','SaleOrgId_Id','Entity','Entity_1','FEntity','FEntity_1','ResponseStatus'];
            Object.keys(headerItem).forEach(function(key) {
                for (var i = 0; i < KEY_FIELDS.length; i++) {
                    for (var j = 0; j < KEY_FIELDS[i].keys.length; j++) {
                        if (KEY_FIELDS[i].keys[j] === key) return;
                    }
                }
                if (SKIP_KEYS.indexOf(key) >= 0) return;
                var val = headerItem[key];
                if (val === null || val === undefined) return;
                if (Array.isArray(val)) return;
                var displayVal = _formatDetailValue('text', val);
                if (displayVal === '') return;
                html += '    <div class="flex flex-col">' +
                    '      <span class="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">' + escapeHtml(key) + '</span>' +
                    '      <span class="text-sm text-slate-700 dark:text-slate-200 break-all">' + displayVal + '</span>' +
                    '    </div>';
            });

            html += '  </div></div>';

            var bodyRows = [];
            Object.keys(headerItem).forEach(function(key) {
                var val = headerItem[key];
                if (Array.isArray(val) && val.length > 0) {
                    bodyRows = bodyRows.concat(val);
                }
            });

            if (bodyRows.length > 0) {
                html += '<div class="mb-4">';
                html += '  <h4 class="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">物料明细 (' + bodyRows.length + ' 行)</h4>';
                html += '  <div class="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">';
                html += '    <table class="w-full text-xs">';
                html += '      <thead><tr class="bg-slate-100 dark:bg-white/10 text-left text-slate-500 dark:text-slate-400">';
                html += '        <th class="px-3 py-2.5 font-medium">行号</th>';
                html += '        <th class="px-3 py-2.5 font-medium">物料编码</th>';
                html += '        <th class="px-3 py-2.5 font-medium">物料名称</th>';
                html += '        <th class="px-3 py-2.5 font-medium">规格型号</th>';
                html += '        <th class="px-3 py-2.5 font-medium text-right">数量</th>';
                html += '        <th class="px-3 py-2.5 font-medium">单位</th>';
                html += '        <th class="px-3 py-2.5 font-medium text-right">含税单价</th>';
                html += '        <th class="px-3 py-2.5 font-medium text-right">价税合计</th>';
                html += '      </tr></thead><tbody>';
                bodyRows.forEach(function(row, idx) {
                    if (typeof row !== 'object' || row === null) return;
                    var fMatNum = _tryField(row, 'MaterialId', 'FMaterialId', 'FNumber');
                    var fMatName = _tryField(row, 'MaterialId', 'FMaterialId', 'FName');
                    // 兼容多种规格型号字段位置：嵌套 MaterialId 内、平铺字段
                    var fModel = row.FSpecification
                        || _tryField(row, 'MaterialId', 'FMaterialId', 'FSpecification')
                        || _tryField(row, 'MaterialId', 'FMaterialId', 'FModel')
                        || row.FModel || row.Model
                        || row.FMaterialModel || '';
                    var fQty = row.Qty || row.FQty || '';
                    var fUnit = _tryField(row, 'UnitId', 'FUnitId', 'FName');
                    var fPrice = _tryField(row, 'TaxPrice', 'FTaxPrice', null) || _tryField(row, 'Price', 'FPrice', null);
                    var fAmt = row.AllAmount || row.Amount || row.FAllAmount || row.FAmount || '';
                    html += '<tr class="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">' +
                        '  <td class="px-3 py-2.5 text-slate-500">' + (idx + 1) + '</td>' +
                        '  <td class="px-3 py-2.5 text-slate-600 dark:text-slate-300 font-mono">' + escapeHtml(String(fMatNum)) + '</td>' +
                        '  <td class="px-3 py-2.5 text-slate-700 dark:text-slate-200">' + escapeHtml(String(fMatName)) + '</td>' +
                        '  <td class="px-3 py-2.5 text-slate-500">' + escapeHtml(String(fModel)) + '</td>' +
                        '  <td class="px-3 py-2.5 text-right text-slate-600 dark:text-slate-300">' + escapeHtml(_formatNumStr(fQty)) + '</td>' +
                        '  <td class="px-3 py-2.5 text-slate-500">' + escapeHtml(String(fUnit)) + '</td>' +
                        '  <td class="px-3 py-2.5 text-right text-slate-600 dark:text-slate-300">' + _formatNumStr(fPrice) + '</td>' +
                        '  <td class="px-3 py-2.5 text-right font-medium text-emerald-600 dark:text-emerald-400">' + _formatNumStr(fAmt) + '</td>' +
                        '</tr>';
                });
                html += '    </tbody></table>';
                html += '  </div></div>';
            }
            bodyEl.innerHTML = html;
            _appendKanbanBackButton();
        })
        .catch(function(err) {
            bodyEl.innerHTML = '<div class="text-center py-12 text-red-500 text-sm">网络错误: ' + escapeHtml(err.message || '') + '</div>';
            _appendKanbanBackButton();
        });
}

// ─── Append back button for customer bills detail ───
function _appendKanbanBackButton() {
    if (window.__kanbanCurrentCustomerIdx === undefined) return;
    var headerLeft = document.querySelector('#kanban-detail-overlay .flex.items-center.justify-between > div:first-child');
    if (!headerLeft) return;
    var existing = headerLeft.querySelector('.kanban-back-btn');
    if (existing) existing.remove();
    var btn = document.createElement('button');
    btn.className = 'kanban-back-btn p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer transition-colors duration-150 flex items-center justify-center';
    btn.innerHTML = '<i class="fas fa-arrow-left"></i>';
    btn.title = '返回';
    btn.onclick = function() { _kanbanOpenCustomerBills(window.__kanbanCurrentCustomerIdx); };
    headerLeft.insertBefore(btn, headerLeft.firstChild);
}

// =====================================================================
// Knowledge View
// =====================================================================
let _knowledgeTreeData = [];
let _knowledgeRootFiles = [];
let _knowledgeCurrentFile = null;
let _knowledgeGraphLoaded = false;
const KNOWLEDGE_IMPORT_MAX_FILES = 100;
const KNOWLEDGE_IMPORT_MAX_FILE_SIZE = 10 * 1024 * 1024;
const KNOWLEDGE_IMPORT_MAX_TOTAL_SIZE = 200 * 1024 * 1024;

function loadKnowledgeView(targetPath) {
    // Reset to docs tab
    switchKnowledgeTab('docs');
    _knowledgeGraphLoaded = false;
    _knowledgeCurrentFile = null;

    fetch('/api/knowledge/list').then(r => r.json()).then(data => {
        if (data.status !== 'success') return;
        initKnowledgeImportDropZone();

        const emptyEl = document.getElementById('knowledge-empty');
        const docsPanel = document.getElementById('knowledge-panel-docs');
        const statsEl = document.getElementById('knowledge-stats');

        const tree = data.tree || [];
        const rootFiles = data.root_files || [];
        _knowledgeTreeData = tree;
        _knowledgeRootFiles = rootFiles;
        const stats = data.stats || {};
        const totalPages = stats.pages || 0;
        const sizeStr = stats.size < 1024 ? stats.size + ' B' : (stats.size / 1024).toFixed(1) + ' KB';

        statsEl.textContent = totalPages + ' pages · ' + sizeStr;

        if (totalPages === 0 && tree.length === 0 && rootFiles.length === 0) {
            emptyEl.querySelector('p').textContent = t('knowledge_empty_hint');
            const guideEl = document.getElementById('knowledge-empty-guide');
            if (guideEl) guideEl.classList.remove('hidden');
            emptyEl.classList.remove('hidden');
            docsPanel.classList.add('hidden');
            return;
        }
        emptyEl.classList.add('hidden');
        docsPanel.classList.remove('hidden');

        renderKnowledgeTree(tree, rootFiles);

        // Prefer opening the just created/imported file; ensure its group is
        // expanded so the active item is visible in the tree.
        const targetTitle = targetPath ? _findKnowledgeFileTitle(targetPath) : null;
        if (targetTitle !== null) {
            _expandKnowledgeGroupFor(targetPath);
            openKnowledgeFile(targetPath, targetTitle);
            return;
        }

        // Auto-select the first file (desktop only)
        if (window.innerWidth >= 768) {
            const firstFile = rootFiles.length > 0 ? rootFiles[0] : null;
            const firstGroup = !firstFile ? tree.find(g => g.files && g.files.length > 0) : null;
            if (firstFile) {
                openKnowledgeFile(firstFile.name, firstFile.title);
            } else if (firstGroup) {
                const gf = firstGroup.files[0];
                openKnowledgeFile(firstGroup.dir + '/' + gf.name, gf.title);
            }
        } else {
            document.getElementById('knowledge-content-placeholder').classList.add('hidden');
            document.getElementById('knowledge-content-viewer').classList.add('hidden');
        }
    }).catch(() => {});
}

// Find a file's display title by its relative path within the knowledge tree.
// Returns the title, or null when the path is not present.
function _findKnowledgeFileTitle(path) {
    if (!path) return null;
    const rootHit = (_knowledgeRootFiles || []).find(f => f.name === path);
    if (rootHit) return rootHit.title || rootHit.name;
    const walk = (groups, parentPath) => {
        for (const group of groups || []) {
            const groupPath = parentPath ? `${parentPath}/${group.dir}` : group.dir;
            const hit = (group.files || []).find(f => `${groupPath}/${f.name}` === path);
            if (hit) return hit.title || hit.name;
            const childHit = walk(group.children, groupPath);
            if (childHit !== null) return childHit;
        }
        return null;
    };
    return walk(_knowledgeTreeData, '');
}

// Open every ancestor group of the given file path so it is visible.
function _expandKnowledgeGroupFor(path) {
    if (!path || !path.includes('/')) return;
    const target = document.querySelector(`.knowledge-tree-file[data-path="${CSS.escape(path)}"]`);
    let node = target ? target.closest('.knowledge-tree-group') : null;
    while (node) {
        node.classList.add('open');
        node = node.parentElement ? node.parentElement.closest('.knowledge-tree-group') : null;
    }
}

function renderKnowledgeTree(tree, rootFilesOrFilter, filter) {
    const container = document.getElementById('knowledge-tree');
    container.innerHTML = '';
    let rootFiles, lowerFilter;
    if (typeof rootFilesOrFilter === 'string') {
        rootFiles = _knowledgeRootFiles;
        lowerFilter = (rootFilesOrFilter || '').toLowerCase();
    } else {
        rootFiles = rootFilesOrFilter || _knowledgeRootFiles;
        lowerFilter = (filter || '').toLowerCase();
    }
    (rootFiles || []).forEach(f => {
        if (lowerFilter && !f.title.toLowerCase().includes(lowerFilter) && !f.name.toLowerCase().includes(lowerFilter)) return;
        const fbtn = document.createElement('button');
        fbtn.className = 'knowledge-tree-file' + (_knowledgeCurrentFile === f.name ? ' active' : '');
        fbtn.dataset.path = f.name;
        fbtn.innerHTML = `<i class="fas fa-file-lines text-[10px] text-slate-400"></i><span class="truncate">${escapeHtml(f.title)}</span>${_knowledgeFileActions(f.name)}`;
        fbtn.onclick = () => openKnowledgeFile(f.name, f.title);
        container.appendChild(fbtn);
    });
    _renderKnowledgeGroups(container, tree, '', lowerFilter, 0);
}

function _renderKnowledgeGroups(container, groups, parentPath, lowerFilter, depth) {
    const indent = depth * 12;
    groups.forEach(group => {
        const groupPath = parentPath ? parentPath + '/' + group.dir : group.dir;
        const files = (group.files || []).filter(f =>
            !lowerFilter || f.title.toLowerCase().includes(lowerFilter) || f.name.toLowerCase().includes(lowerFilter)
        );
        const children = group.children || [];
        const hasMatchingChildren = lowerFilter ? _hasFilterMatch(children, lowerFilter) : children.length > 0;
        if (files.length === 0 && !hasMatchingChildren && lowerFilter) return;

        const div = document.createElement('div');
        div.className = 'knowledge-tree-group open';

        const fileCount = _countFiles(group);
        const btn = document.createElement('button');
        btn.className = 'knowledge-tree-group-btn';
        btn.style.paddingLeft = (8 + indent) + 'px';
        btn.innerHTML = `<i class="fas fa-chevron-right chevron"></i><i class="fas fa-folder text-amber-400 text-[11px]"></i><span>${escapeHtml(group.dir)}</span><span class="ml-auto text-[10px] text-slate-400">${fileCount}</span>${_knowledgeCategoryActions(groupPath)}`;
        btn.onclick = () => div.classList.toggle('open');
        div.appendChild(btn);

        const items = document.createElement('div');
        items.className = 'knowledge-tree-group-items';
        files.forEach(f => {
            const fbtn = document.createElement('button');
            const fpath = groupPath + '/' + f.name;
            fbtn.className = 'knowledge-tree-file' + (_knowledgeCurrentFile === fpath ? ' active' : '');
            fbtn.dataset.path = fpath;
            fbtn.style.paddingLeft = (24 + indent) + 'px';
            fbtn.innerHTML = `<i class="fas fa-file-lines text-[10px] text-slate-400"></i><span class="truncate">${escapeHtml(f.title)}</span>${_knowledgeFileActions(fpath)}`;
            fbtn.onclick = () => openKnowledgeFile(fpath, f.title);
            items.appendChild(fbtn);
        });
        if (children.length > 0) {
            _renderKnowledgeGroups(items, children, groupPath, lowerFilter, depth + 1);
        }
        div.appendChild(items);
        container.appendChild(div);
    });
}

function _knowledgeActionButton(icon, title, handler) {
    const danger = icon === 'fa-trash' ? ' danger' : '';
    return `<span role="button" tabindex="0" title="${escapeHtml(title)}" onclick="event.stopPropagation();${handler}" class="knowledge-action${danger}"><i class="fas ${icon}"></i></span>`;
}

function _knowledgeFileActions(path) {
    if (path === 'index.md' || path === 'log.md') return '';
    const value = JSON.stringify(path).replace(/"/g, '&quot;');
    return `<span class="knowledge-actions">${_knowledgeActionButton('fa-arrow-right-arrow-left', '移动', `moveKnowledgeDocument(${value})`)}${_knowledgeActionButton('fa-trash', '删除', `deleteKnowledgeDocument(${value})`)}</span>`;
}

function _knowledgeCategoryActions(path) {
    const value = JSON.stringify(path).replace(/"/g, '&quot;');
    return `<span class="knowledge-actions">${_knowledgeActionButton('fa-pen', '重命名', `renameKnowledgeCategory(${value})`)}${_knowledgeActionButton('fa-trash', '删除', `deleteKnowledgeCategory(${value})`)}</span>`;
}

async function dispatchKnowledgeAction(action, payload, openPathResolver) {
    _setKnowledgeStatus(currentLang === 'zh' ? '处理中...' : 'Working...', false, true);
    try {
        const response = await fetch('/api/knowledge/action', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({action, payload}),
        });
        const result = await response.json();
        if (result.status !== 'success') {
            _setKnowledgeStatus(result.message || (currentLang === 'zh' ? '操作失败' : 'Operation failed'), true);
            loadKnowledgeView();
            return null;
        }
        _setKnowledgeStatus(_knowledgeResultMessage(action, result.payload), false);
        // Optionally auto-open the affected file after the tree refreshes.
        const openPath = openPathResolver ? openPathResolver(result.payload) : null;
        loadKnowledgeView(openPath || undefined);
        return result.payload;
    } catch (error) {
        _setKnowledgeStatus(currentLang === 'zh' ? '请求失败，请稍后重试' : 'Request failed, please try again', true);
        return null;
    }
}

function _setKnowledgeStatus(message, isError, persistent) {
    const el = document.getElementById('knowledge-action-status');
    el.textContent = message;
    el.className = `text-xs transition-opacity duration-200 ${isError ? 'text-red-500' : 'text-primary-500'}`;
    el.classList.remove('opacity-0');
    clearTimeout(el._hideTimer);
    if (!persistent) el._hideTimer = setTimeout(() => el.classList.add('opacity-0'), 3500);
}

function _knowledgeResultMessage(action, payload) {
    if (currentLang !== 'zh') {
        return action === 'create_category' ? 'Category created' :
            action === 'create_document' ? 'Document created' :
            action === 'rename_category' ? 'Category renamed' :
            action === 'delete_category' ? 'Category deleted' :
            action === 'import_documents' ? `${payload?.imported || 0} imported · ${payload?.skipped || 0} skipped · ${payload?.failed || 0} failed` :
            action === 'move_documents' ? `${payload?.moved || 0} document moved` :
            `${payload?.deleted || 0} document deleted`;
    }
    return action === 'create_category' ? '分类已创建' :
        action === 'create_document' ? '文档已创建' :
        action === 'rename_category' ? '分类已重命名' :
        action === 'delete_category' ? '分类已删除' :
        action === 'import_documents' ? `导入 ${payload?.imported || 0} 个，跳过 ${payload?.skipped || 0} 个，失败 ${payload?.failed || 0} 个` :
        action === 'move_documents' ? `已移动 ${payload?.moved || 0} 个文档` :
        `已删除 ${payload?.deleted || 0} 个文档`;
}

function _knowledgeCategoryPaths(groups, parent = '') {
    const paths = [];
    for (const group of groups || []) {
        const path = parent ? `${parent}/${group.dir}` : group.dir;
        paths.push(path, ..._knowledgeCategoryPaths(group.children || [], path));
    }
    return paths;
}

function openKnowledgeDialog(options) {
    const overlay = document.getElementById('knowledge-dialog-overlay');
    const card = document.getElementById('knowledge-dialog-card');
    const input = document.getElementById('knowledge-dialog-input');
    const select = document.getElementById('knowledge-dialog-select');
    const textarea = document.getElementById('knowledge-dialog-textarea');
    const documentForm = document.getElementById('knowledge-document-form');
    const documentFilename = document.getElementById('knowledge-document-filename');
    const documentContent = document.getElementById('knowledge-document-content');
    const templateBtn = document.getElementById('knowledge-document-template');
    const documentPathPreview = document.getElementById('knowledge-document-path-preview');
    const submit = document.getElementById('knowledge-dialog-submit');
    const cancel = document.getElementById('knowledge-dialog-cancel');
    document.getElementById('knowledge-dialog-title').textContent = options.title;
    document.getElementById('knowledge-dialog-subtitle').textContent = options.subtitle || '';
    document.getElementById('knowledge-dialog-label').textContent = options.label;
    document.getElementById('knowledge-dialog-hint').textContent = options.hint || '';
    document.getElementById('knowledge-dialog-error').classList.add('hidden');
    document.getElementById('knowledge-dialog-icon').className = `fas ${options.icon || 'fa-folder'} text-emerald-500`;
    card.classList.toggle('knowledge-document-dialog', options.type === 'document');
    input.classList.toggle('hidden', options.type === 'select' || options.type === 'textarea' || options.type === 'document');
    select.classList.toggle('hidden', options.type !== 'select');
    textarea.classList.toggle('hidden', options.type !== 'textarea');
    documentForm.classList.toggle('hidden', options.type !== 'document');
    input.value = options.value || '';
    textarea.value = options.value || '';
    documentFilename.value = options.filename || '';
    documentContent.value = options.content || '';
    document.getElementById('knowledge-document-category-label').textContent = currentLang === 'zh' ? '目标分类' : 'Destination category';
    documentPathPreview.textContent = options.category
        ? `knowledge/${options.category}/`
        : 'knowledge/';
    documentFilename.oninput = null;
    document.getElementById('knowledge-document-filename-label').textContent = currentLang === 'zh' ? '文件名' : 'Filename';
    document.getElementById('knowledge-document-content-label').textContent = currentLang === 'zh' ? 'Markdown 内容' : 'Markdown content';
    templateBtn.textContent = currentLang === 'zh' ? '插入模板' : 'Insert template';
    templateBtn.onclick = () => {
        if (documentContent.value.trim()) return;
        const title = (documentFilename.value || 'untitled').replace(/\.md$/i, '');
        documentContent.value = currentLang === 'zh'
            ? `# ${title}\n\n## 摘要\n\n\n## 关键点\n\n- \n\n## 参考\n\n`
            : `# ${title}\n\n## Summary\n\n\n## Key points\n\n- \n\n## References\n\n`;
        documentContent.focus();
    };
    if (options.type === 'select') {
        // Use the shared custom dropdown component instead of a native
        // <select> so the arrow / menu match the rest of the console.
        const ddOptions = (options.choices || []).map(value => ({ value, label: value }));
        initDropdown(select, ddOptions, (options.choices || [])[0] || '', null);
    }
    submit.textContent = currentLang === 'zh' ? '确定' : 'Confirm';
    cancel.textContent = currentLang === 'zh' ? '取消' : 'Cancel';
    submit.disabled = options.type === 'select' && !(options.choices || []).length;

    const close = () => overlay.classList.add('hidden');
    const submitAction = async () => {
        const rawValue = options.type === 'select' ? getDropdownValue(select) :
            (options.type === 'textarea' ? textarea.value :
            (options.type === 'document' ? {
                filename: documentFilename.value.trim(),
                content: documentContent.value,
            } : input.value));
        const value = options.type === 'textarea' || options.type === 'document' ? rawValue : rawValue.trim();
        const error = options.validate ? options.validate(value) : (!value ? (currentLang === 'zh' ? '此项不能为空' : 'This field is required') : '');
        if (error) {
            const errorEl = document.getElementById('knowledge-dialog-error');
            errorEl.textContent = error;
            errorEl.classList.remove('hidden');
            return;
        }
        submit.disabled = true;
        const ok = await options.onSubmit(value);
        submit.disabled = false;
        if (ok !== null) close();
    };
    submit.onclick = submitAction;
    cancel.onclick = close;
    overlay.onclick = event => { if (event.target === overlay) close(); };
    input.onkeydown = event => { if (event.key === 'Enter') submitAction(); };
    overlay.classList.remove('hidden');
    setTimeout(() => (options.type === 'select' ? select : (options.type === 'textarea' ? textarea : (options.type === 'document' ? documentFilename : input))).focus(), 0);
}

function closeKnowledgeNewMenu() {
    const list = document.getElementById('knowledge-new-menu-list');
    if (list) list.classList.add('hidden');
    document.removeEventListener('click', _knowledgeNewMenuOutside, true);
}

function _knowledgeNewMenuOutside(event) {
    const menu = document.getElementById('knowledge-new-menu');
    if (menu && !menu.contains(event.target)) closeKnowledgeNewMenu();
}

function toggleKnowledgeNewMenu(event) {
    if (event) event.stopPropagation();
    const list = document.getElementById('knowledge-new-menu-list');
    if (!list) return;
    const willOpen = list.classList.contains('hidden');
    list.classList.toggle('hidden');
    if (willOpen) {
        document.addEventListener('click', _knowledgeNewMenuOutside, true);
    } else {
        document.removeEventListener('click', _knowledgeNewMenuOutside, true);
    }
}

function createKnowledgeCategory() {
    openKnowledgeDialog({
        title: currentLang === 'zh' ? '新建分类' : 'New category',
        subtitle: currentLang === 'zh' ? '分类会创建为 knowledge/ 下的目录' : 'Creates a directory under knowledge/',
        label: currentLang === 'zh' ? '分类路径' : 'Category path',
        hint: currentLang === 'zh' ? '支持嵌套路径，例如 research/ai' : 'Nested paths are supported, e.g. research/ai',
        icon: 'fa-folder-plus',
        onSubmit: path => dispatchKnowledgeAction('create_category', {path}),
    });
}

function createKnowledgeDocument() {
    const categories = _knowledgeCategoryPaths(_knowledgeTreeData);
    if (!categories.length) {
        _setKnowledgeStatus(currentLang === 'zh' ? '请先创建分类' : 'Create a category first', true);
        return;
    }
    openKnowledgeDialog({
        title: currentLang === 'zh' ? '新建文档' : 'New document',
        subtitle: currentLang === 'zh' ? '先选择分类，然后输入文件名' : 'Choose a category, then enter a filename',
        label: currentLang === 'zh' ? '目标分类' : 'Destination category',
        type: 'select',
        choices: categories,
        icon: 'fa-file-circle-plus',
        onSubmit: category => {
            openKnowledgeDocumentEditor(category);
            return null;
        },
    });
}

function openKnowledgeDocumentEditor(category) {
    openKnowledgeDialog({
        title: currentLang === 'zh' ? '新建文档' : 'New document',
        subtitle: currentLang === 'zh' ? `保存到 ${category}` : `Save to ${category}`,
        label: '',
        hint: currentLang === 'zh' ? '文件名可省略 .md 后缀；保存后会自动同步索引。' : 'The .md suffix is optional. Index sync runs after saving.',
        type: 'document',
        category,
        filename: '',
        content: '',
        icon: 'fa-file-circle-plus',
        validate: value => {
            if (!value.filename) return currentLang === 'zh' ? '文件名不能为空' : 'Filename is required';
            if (/\.[^.]+$/i.test(value.filename) && !/\.md$/i.test(value.filename)) {
                return currentLang === 'zh' ? '新建文档仅支持 .md 文件名' : 'New documents must be .md files';
            }
            if (!value.content.trim()) return currentLang === 'zh' ? '内容不能为空' : 'Content is required';
            if (new Blob([value.content]).size > KNOWLEDGE_IMPORT_MAX_FILE_SIZE) {
                return currentLang === 'zh' ? '内容不能超过 10MB' : 'Content cannot exceed 10MB';
            }
            return '';
        },
        onSubmit: value => {
            const safeName = value.filename.endsWith('.md') ? value.filename : `${value.filename}.md`;
            return dispatchKnowledgeAction('create_document', {
                path: `${category}/${safeName}`,
                content: value.content,
                overwrite: false,
            }, payload => payload?.path || `${category}/${safeName}`);
        },
    });
}

function selectKnowledgeImportFiles() {
    const input = document.getElementById('knowledge-import-input');
    input.value = '';
    input.onchange = () => {
        if (input.files && input.files.length) openKnowledgeImportDialog(Array.from(input.files));
    };
    input.click();
}

function openKnowledgeImportDialog(files) {
    const validationError = validateKnowledgeImportFiles(files);
    if (validationError) {
        _setKnowledgeStatus(validationError, true);
        return;
    }
    const choices = _knowledgeCategoryPaths(_knowledgeTreeData);
    openKnowledgeDialog({
        title: currentLang === 'zh' ? '导入文档' : 'Import documents',
        subtitle: currentLang === 'zh' ? `已选择 ${files.length} 个文件` : `${files.length} file(s) selected`,
        label: currentLang === 'zh' ? '目标分类' : 'Destination category',
        hint: choices.length ? (currentLang === 'zh' ? '支持 Markdown 和 TXT，TXT 会转成 Markdown 文档' : 'Markdown and TXT are supported. TXT is converted to Markdown.') :
            (currentLang === 'zh' ? '请先创建一个分类' : 'Create a category first'),
        type: 'select',
        choices,
        icon: 'fa-file-arrow-up',
        onSubmit: target => importKnowledgeDocuments(files, target),
    });
}

async function importKnowledgeDocuments(files, targetCategory) {
    const validationError = validateKnowledgeImportFiles(files);
    if (validationError) {
        _setKnowledgeStatus(validationError, true);
        return null;
    }
    const supported = files.filter(file => /\.(md|txt)$/i.test(file.name || ''));
    if (!supported.length) {
        _setKnowledgeStatus(currentLang === 'zh' ? '请选择 .md 或 .txt 文件' : 'Choose .md or .txt files', true);
        return null;
    }
    const formData = new FormData();
    formData.append('target_category', targetCategory);
    formData.append('conflict_strategy', 'rename');
    supported.forEach(file => formData.append('files', file, file.name));
    _setKnowledgeStatus(currentLang === 'zh' ? '正在导入...' : 'Importing...', false, true);
    try {
        const response = await fetch('/api/knowledge/import', { method: 'POST', body: formData });
        const result = await response.json();
        if (result.status !== 'success') {
            _setKnowledgeStatus(result.message || (currentLang === 'zh' ? '导入失败' : 'Import failed'), true);
            loadKnowledgeView();
            return null;
        }
        _setKnowledgeStatus(_knowledgeResultMessage('import_documents', result.payload), false);
        // Auto-open the first successfully imported document.
        const firstImported = (result.payload?.results || []).find(item => item.status === 'imported');
        loadKnowledgeView(firstImported ? firstImported.path : undefined);
        return result.payload;
    } catch (error) {
        _setKnowledgeStatus(currentLang === 'zh' ? '导入请求失败' : 'Import request failed', true);
        return null;
    }
}

function validateKnowledgeImportFiles(files) {
    if (!files || !files.length) return currentLang === 'zh' ? '请选择文件' : 'Choose files';
    if (files.length > KNOWLEDGE_IMPORT_MAX_FILES) {
        return currentLang === 'zh' ? `一次最多导入 ${KNOWLEDGE_IMPORT_MAX_FILES} 个文件` : `Import at most ${KNOWLEDGE_IMPORT_MAX_FILES} files at a time`;
    }
    let total = 0;
    for (const file of files) {
        total += file.size || 0;
        if ((file.size || 0) > KNOWLEDGE_IMPORT_MAX_FILE_SIZE) {
            return currentLang === 'zh' ? `${file.name} 超过 10MB` : `${file.name} exceeds 10MB`;
        }
    }
    if (total > KNOWLEDGE_IMPORT_MAX_TOTAL_SIZE) {
        return currentLang === 'zh' ? '单次导入总大小不能超过 200MB' : 'Total import size cannot exceed 200MB';
    }
    return '';
}

let _knowledgeImportDropReady = false;
function initKnowledgeImportDropZone() {
    if (_knowledgeImportDropReady) return;
    const panel = document.getElementById('knowledge-panel-docs');
    if (!panel) return;
    _knowledgeImportDropReady = true;
    ['dragenter', 'dragover'].forEach(name => {
        panel.addEventListener(name, event => {
            if (!event.dataTransfer || !event.dataTransfer.types.includes('Files')) return;
            event.preventDefault();
            panel.classList.add('knowledge-import-drag-over');
        });
    });
    ['dragleave', 'drop'].forEach(name => {
        panel.addEventListener(name, event => {
            if (event.type === 'drop') {
                event.preventDefault();
                const files = Array.from(event.dataTransfer?.files || []);
                if (files.length) openKnowledgeImportDialog(files);
            }
            panel.classList.remove('knowledge-import-drag-over');
        });
    });
}

function renameKnowledgeCategory(path) {
    openKnowledgeDialog({
        title: currentLang === 'zh' ? '重命名分类' : 'Rename category',
        subtitle: path,
        label: currentLang === 'zh' ? '新的分类路径' : 'New category path',
        value: path,
        icon: 'fa-pen',
        validate: value => value === path ? (currentLang === 'zh' ? '请输入不同的分类路径' : 'Enter a different category path') : '',
        onSubmit: newPath => dispatchKnowledgeAction('rename_category', {path, new_path: newPath}),
    });
}

function deleteKnowledgeCategory(path) {
    showConfirmDialog({
        title: '删除分类',
        message: `确认删除“${path}”及其中全部文档？`,
        okText: t('confirm_yes'),
        cancelText: t('confirm_cancel'),
        onConfirm: () => dispatchKnowledgeAction('delete_category', {path, confirm: true}),
    });
}

function deleteKnowledgeDocument(path) {
    showConfirmDialog({
        title: '删除文档',
        message: `确认删除“${path}”？`,
        okText: t('confirm_yes'),
        cancelText: t('confirm_cancel'),
        onConfirm: () => dispatchKnowledgeAction('delete_documents', {paths: [path]}),
    });
}

function moveKnowledgeDocument(path) {
    const currentCategory = path.includes('/') ? path.split('/').slice(0, -1).join('/') : '';
    const choices = _knowledgeCategoryPaths(_knowledgeTreeData).filter(value => value !== currentCategory);
    openKnowledgeDialog({
        title: currentLang === 'zh' ? '移动文档' : 'Move document',
        subtitle: path,
        label: currentLang === 'zh' ? '目标分类' : 'Destination category',
        hint: choices.length ? '' : (currentLang === 'zh' ? '请先创建其他分类' : 'Create another category first'),
        type: 'select',
        choices,
        icon: 'fa-arrow-right-arrow-left',
        onSubmit: target => dispatchKnowledgeAction('move_documents', {paths: [path], target_category: target}),
    });
}

function _hasFilterMatch(groups, lowerFilter) {
    for (const g of groups) {
        for (const f of (g.files || [])) {
            if (f.title.toLowerCase().includes(lowerFilter) || f.name.toLowerCase().includes(lowerFilter)) return true;
        }
        if (_hasFilterMatch(g.children || [], lowerFilter)) return true;
    }
    return false;
}

function _countFiles(group) {
    let count = (group.files || []).length;
    for (const child of (group.children || [])) {
        count += _countFiles(child);
    }
    return count;
}

function filterKnowledgeTree(query) {
    renderKnowledgeTree(_knowledgeTreeData, _knowledgeRootFiles, query);
}

function resolveKnowledgePath(currentFilePath, relativeHref) {
    // currentFilePath: e.g. "concepts/mcp-protocol.md"
    // relativeHref: e.g. "../entities/openai.md"
    const parts = currentFilePath.split('/');
    parts.pop(); // remove filename, keep directory
    const segments = [...parts, ...relativeHref.split('/')];
    const resolved = [];
    for (const seg of segments) {
        if (seg === '..') resolved.pop();
        else if (seg !== '.' && seg !== '') resolved.push(seg);
    }
    return resolved.join('/');
}

function bindKnowledgeLinks(container, currentFilePath) {
    container.querySelectorAll('a').forEach(a => {
        const href = a.getAttribute('href');
        if (!href || !href.endsWith('.md')) return;
        // Skip absolute URLs
        if (/^https?:\/\//.test(href)) return;

        a.addEventListener('click', (e) => {
            e.preventDefault();
            const resolved = resolveKnowledgePath(currentFilePath, href);
            const linkTitle = a.textContent.trim() || resolved.replace(/\.md$/, '').split('/').pop();
            openKnowledgeFile(resolved, linkTitle);
        });
        a.style.cursor = 'pointer';
        a.classList.add('text-primary-500', 'hover:underline');
    });
}

function bindChatKnowledgeLinks(container) {
    if (!container) return;
    container.querySelectorAll('a').forEach(a => {
        const href = a.getAttribute('href');
        if (!href || !href.endsWith('.md')) return;
        if (/^https?:\/\//.test(href)) return;

        // Determine knowledge path
        let knowledgePath = null;
        if (href.startsWith('knowledge/')) {
            // Full path from workspace root: knowledge/concepts/moe.md
            knowledgePath = href.replace(/^knowledge\//, '');
        } else if (/^[a-z0-9_-]+\/[a-z0-9_.-]+\.md$/i.test(href)) {
            // Looks like category/file.md pattern without knowledge/ prefix
            knowledgePath = href;
        } else if (href.includes('/') && !href.startsWith('/')) {
            // Relative path like ../entities/deepseek.md — extract filename and search
            const filename = href.split('/').pop();
            knowledgePath = '__search__:' + filename;
        }
        if (!knowledgePath) return;

        a.addEventListener('click', (e) => {
            e.preventDefault();
            if (knowledgePath.startsWith('__search__:')) {
                const filename = knowledgePath.replace('__search__:', '');
                // Find the file in cached tree data
                const found = _findKnowledgeFileByName(filename);
                if (found) {
                    navigateTo('knowledge');
                    setTimeout(() => openKnowledgeFile(found.path, found.title), 100);
                }
            } else {
                navigateTo('knowledge');
                const linkTitle = a.textContent.trim() || knowledgePath.replace(/\.md$/, '').split('/').pop();
                setTimeout(() => openKnowledgeFile(knowledgePath, linkTitle), 100);
            }
        });
        a.style.cursor = 'pointer';
        a.classList.add('text-primary-500', 'hover:underline');
    });
}

function _findKnowledgeFileByName(filename) {
    for (const f of _knowledgeRootFiles) {
        if (f.name === filename) return { path: f.name, title: f.title };
    }
    return _searchFileInGroups(_knowledgeTreeData, '', filename);
}

function _searchFileInGroups(groups, parentPath, filename) {
    for (const group of groups) {
        const groupPath = parentPath ? parentPath + '/' + group.dir : group.dir;
        for (const f of (group.files || [])) {
            if (f.name === filename) {
                return { path: groupPath + '/' + f.name, title: f.title };
            }
        }
        const found = _searchFileInGroups(group.children || [], groupPath, filename);
        if (found) return found;
    }
    return null;
}

function openKnowledgeFile(path, title) {
    _knowledgeCurrentFile = path;
    // Update active state in tree via data-path
    document.querySelectorAll('.knowledge-tree-file').forEach(el => {
        el.classList.toggle('active', el.dataset.path === path);
    });

    // Immediately hide placeholder
    document.getElementById('knowledge-content-placeholder').classList.add('hidden');

    fetch(`/api/knowledge/read?path=${encodeURIComponent(path)}`).then(r => r.json()).then(data => {
        if (data.status !== 'success') return;
        const viewer = document.getElementById('knowledge-content-viewer');
        document.getElementById('knowledge-viewer-title').textContent = title;
        document.getElementById('knowledge-viewer-path').textContent = path;
        const bodyEl = document.getElementById('knowledge-viewer-body');
        bodyEl.innerHTML = renderMarkdown(data.content || '');
        viewer.classList.remove('hidden');
        applyHighlighting(viewer);
        bindKnowledgeLinks(bodyEl, path);

        // Mobile: hide sidebar, show content
        if (window.innerWidth < 768) {
            document.getElementById('knowledge-sidebar').classList.add('hidden');
        }
    }).catch(() => {});
}

function knowledgeMobileBack() {
    document.getElementById('knowledge-sidebar').classList.remove('hidden');
    document.getElementById('knowledge-content-viewer').classList.add('hidden');
}

function switchKnowledgeTab(tab) {
    document.querySelectorAll('.knowledge-tab').forEach(el => el.classList.remove('active'));
    document.getElementById('knowledge-tab-' + tab).classList.add('active');

    const docsPanel = document.getElementById('knowledge-panel-docs');
    const graphPanel = document.getElementById('knowledge-panel-graph');

    if (tab === 'docs') {
        docsPanel.classList.remove('hidden');
        graphPanel.classList.add('hidden');
    } else {
        docsPanel.classList.add('hidden');
        graphPanel.classList.remove('hidden');
        if (!_knowledgeGraphLoaded) {
            loadKnowledgeGraph();
        }
    }
}

let _d3LoadPromise = null;

function ensureD3Loaded() {
    if (window.d3) return Promise.resolve(window.d3);
    if (_d3LoadPromise) return _d3LoadPromise;
    _d3LoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'assets/vendor/d3/d3.min.js';
        script.async = true;
        script.onload = () => resolve(window.d3);
        script.onerror = () => reject(new Error('Failed to load d3'));
        document.head.appendChild(script);
    });
    return _d3LoadPromise;
}

function loadKnowledgeGraph() {
    _knowledgeGraphLoaded = true;
    const container = document.getElementById('knowledge-graph-container');
    container.innerHTML = '<div class="flex items-center justify-center h-full text-slate-400 text-sm"><i class="fas fa-spinner fa-spin mr-2"></i>Loading graph...</div>';

    Promise.all([
        ensureD3Loaded(),
        fetch('/api/knowledge/graph').then(r => r.json()),
    ]).then(([, data]) => {
        const nodes = data.nodes || [];
        const links = data.links || [];
        if (nodes.length === 0) {
            container.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-slate-400"><i class="fas fa-diagram-project text-3xl mb-3 opacity-40"></i><p class="text-sm">${t('knowledge_empty_hint')}</p></div>`;
            return;
        }
        container.innerHTML = '';
        renderKnowledgeGraph(container, nodes, links);
    }).catch(() => {
        container.innerHTML = '<div class="flex items-center justify-center h-full text-slate-400 text-sm">Failed to load graph</div>';
    });
}

function renderKnowledgeGraph(container, nodes, links) {
    const width = container.clientWidth;
    const height = container.clientHeight || 600;

    const categories = [...new Set(nodes.map(n => n.category))];
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(categories);

    // Connection count for sizing
    const connCount = {};
    nodes.forEach(n => connCount[n.id] = 0);
    links.forEach(l => {
        connCount[l.source] = (connCount[l.source] || 0) + 1;
        connCount[l.target] = (connCount[l.target] || 0) + 1;
    });

    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const g = svg.append('g');

    // Zoom with adaptive label visibility
    let currentZoomScale = 1;
    const zoom = d3.zoom()
        .scaleExtent([0.2, 5])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
            currentZoomScale = event.transform.k;
            updateLabelVisibility();
        });
    svg.call(zoom);

    function updateLabelVisibility() {
        if (!label) return;
        if (currentZoomScale < 0.8) {
            label.attr('opacity', 0);
        } else {
            const baseFontSize = Math.min(12, 10 / Math.max(currentZoomScale * 0.7, 0.5));
            label.attr('opacity', 1).attr('font-size', baseFontSize);
        }
    }

    const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(90))
        .force('charge', d3.forceManyBody().strength(-180))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('x', d3.forceX(width / 2).strength(0.06))
        .force('y', d3.forceY(height / 2).strength(0.06))
        .force('collision', d3.forceCollide().radius(d => getNodeRadius(d) + 30));

    function getNodeRadius(d) {
        return Math.max(5, Math.min(16, 5 + (connCount[d.id] || 0) * 2));
    }

    const link = g.append('g')
        .selectAll('line')
        .data(links)
        .join('line')
        .attr('stroke', '#94a3b8')
        .attr('stroke-opacity', 0.3)
        .attr('stroke-width', 1);

    const node = g.append('g')
        .selectAll('circle')
        .data(nodes)
        .join('circle')
        .attr('r', d => getNodeRadius(d))
        .attr('fill', d => colorScale(d.category))
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .call(d3.drag()
            .on('start', (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
            .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
            .on('end', (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
        );

    const label = g.append('g')
        .selectAll('text')
        .data(nodes)
        .join('text')
        .text(d => d.label.length > 15 ? d.label.slice(0, 14) + '…' : d.label)
        .attr('font-size', 9)
        .attr('dx', d => getNodeRadius(d) + 4)
        .attr('dy', 3)
        .attr('fill', '#64748b')
        .style('pointer-events', 'none');

    // Tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'knowledge-graph-tooltip';
    container.style.position = 'relative';
    container.appendChild(tooltip);

    node.on('mouseover', (event, d) => {
        tooltip.textContent = d.label + ' (' + d.category + ')';
        tooltip.style.opacity = '1';
        tooltip.style.left = (event.offsetX + 12) + 'px';
        tooltip.style.top = (event.offsetY - 8) + 'px';
        // Highlight connections
        link.attr('stroke-opacity', l => (l.source.id === d.id || l.target.id === d.id) ? 0.8 : 0.1);
        node.attr('opacity', n => n.id === d.id || links.some(l => (l.source.id === d.id && l.target.id === n.id) || (l.target.id === d.id && l.source.id === n.id)) ? 1 : 0.2);
        label.attr('opacity', n => n.id === d.id || links.some(l => (l.source.id === d.id && l.target.id === n.id) || (l.target.id === d.id && l.source.id === n.id)) ? 1 : 0.1);
    }).on('mousemove', (event) => {
        tooltip.style.left = (event.offsetX + 12) + 'px';
        tooltip.style.top = (event.offsetY - 8) + 'px';
    }).on('mouseout', () => {
        tooltip.style.opacity = '0';
        link.attr('stroke-opacity', 0.3);
        node.attr('opacity', 1);
        label.attr('opacity', 1);
    }).on('click', (event, d) => {
        // Switch to docs tab and open the file
        switchKnowledgeTab('docs');
        openKnowledgeFile(d.id, d.label);
    });

    simulation.on('tick', () => {
        link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
        node.attr('cx', d => d.x).attr('cy', d => d.y);
        label.attr('x', d => d.x).attr('y', d => d.y);
    });

    // Auto fit-to-view when simulation settles
    simulation.on('end', () => {
        const pad = 16;
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        nodes.forEach(n => {
            if (n.x < x0) x0 = n.x;
            if (n.y < y0) y0 = n.y;
            if (n.x > x1) x1 = n.x;
            if (n.y > y1) y1 = n.y;
        });
        const bw = x1 - x0 + pad * 2;
        const bh = y1 - y0 + pad * 2;
        if (bw > 0 && bh > 0) {
            const scale = Math.min(width / bw, height / bh, 4);
            const tx = width / 2 - (x0 + x1) / 2 * scale;
            const ty = height / 2 - (y0 + y1) / 2 * scale;
            svg.transition().duration(500).call(
                zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale)
            );
        }
    });

    // Legend
    const legendDiv = document.createElement('div');
    legendDiv.className = 'knowledge-graph-legend';
    categories.forEach(cat => {
        const item = document.createElement('span');
        item.className = 'knowledge-graph-legend-item';
        item.innerHTML = `<span class="knowledge-graph-legend-dot" style="background:${colorScale(cat)}"></span>${escapeHtml(cat)}`;
        legendDiv.appendChild(item);
    });
    container.appendChild(legendDiv);
}

// =====================================================================
// Authentication
// =====================================================================
function toggleLoginPassword() {
    const input = document.getElementById('login-password');
    const icon = document.querySelector('#login-toggle-pwd i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}
window.toggleLoginPassword = toggleLoginPassword;

function showLoginScreen() {
    const overlay = document.getElementById('login-overlay');
    if (!overlay) return;
    overlay.classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');

    const subtitle = document.getElementById('login-subtitle');
    const loginBtn = document.getElementById('login-btn');
    if (currentLang === 'en') {
        subtitle.textContent = 'Enter password to access the console';
        loginBtn.textContent = 'Login';
    } else if (currentLang === 'zh-Hant') {
        subtitle.textContent = '請輸入密碼以存取控制台';
        loginBtn.textContent = '登入';
    } else {
        subtitle.textContent = '请输入密码以访问控制台';
        loginBtn.textContent = '登录';
    }

    const form = document.getElementById('login-form');
    const pwdInput = document.getElementById('login-password');
    pwdInput.focus();

    form.onsubmit = function(e) {
        e.preventDefault();
        const pwd = pwdInput.value;
        if (!pwd) return;
        const btn = document.getElementById('login-btn');
        const errEl = document.getElementById('login-error');
        btn.disabled = true;
        errEl.classList.add('hidden');

        fetch('/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({password: pwd})
        }).then(r => r.json()).then(data => {
            if (data.status === 'success') {
                overlay.classList.add('hidden');
                document.getElementById('app').classList.remove('hidden');
                const logoutBtn = document.getElementById('logout-btn-header');
                if (logoutBtn) logoutBtn.classList.remove('hidden');
                initApp();
            } else {
                if (currentLang === 'zh-Hant') {
                    errEl.textContent = '密碼錯誤';
                } else if (currentLang === 'zh') {
                    errEl.textContent = '密码错误';
                } else {
                    errEl.textContent = 'Wrong password';
                }
                errEl.classList.remove('hidden');
                pwdInput.value = '';
                pwdInput.focus();
            }
            btn.disabled = false;
        }).catch(() => {
            if (currentLang === 'zh-Hant') {
                errEl.textContent = '網路錯誤，請重試';
            } else if (currentLang === 'zh') {
                errEl.textContent = '网络错误，请重试';
            } else {
                errEl.textContent = 'Network error, please retry';
            }
            errEl.classList.remove('hidden');
            btn.disabled = false;
        });
        return false;
    };
}

function handleLogout() {
    fetch('/auth/logout', {
        method: 'POST'
    }).then(r => r.json()).then(data => {
        if (data.status === 'success') {
            window.location.reload();
        }
    }).catch(() => {
        window.location.reload();
    });
}
window.handleLogout = handleLogout;

// Intercept 401 responses globally to show login screen on session expiry
const _originalFetch = window.fetch;
window.fetch = function(...args) {
    return _originalFetch.apply(this, args).then(response => {
        if (response.status === 401) {
            const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
            if (!url.startsWith('/auth/')) {
                showLoginScreen();
            }
        }
        return response;
    });
};

function initApp() {
    applyI18n();
    _applyInputTooltips();
    _restoreSessionPanel();

    fetch('/api/knowledge/list').then(r => r.json()).then(data => {
        if (data.status === 'success') {
            _knowledgeTreeData = data.tree || [];
            _knowledgeRootFiles = data.root_files || [];
        }
    }).catch(() => {});

    fetch('/api/version').then(r => r.json()).then(data => {
        APP_VERSION = `v${data.version}`;
        document.getElementById('sidebar-version').textContent = `揽盛电气智能体 ${APP_VERSION}`;
    }).catch(() => {
        document.getElementById('sidebar-version').textContent = '揽盛电气智能体';
    });
    chatInput.focus();

    // ========== URL Hash 路由：处理页面初始化和 hash 变化 ==========
    // handleHashRoute() 函数定义在 loadKanbanConversionStats() 之后
    // 页面初始化完成后立即处理当前 hash（如 #kanban、#kanban-conversion）
    handleHashRoute();
}

// =====================================================================
// Initialization
// =====================================================================
applyTheme();
applyI18n();

// 企业微信认证状态
var _wecomUser = false;
var _wecomUserid = '';
var _wecomKingdeeAllowed = false;
var _wecomOpenPages = [];

// 应用企微菜单过滤：隐藏未授权的侧边栏项
function _applyWecomFilter() {
    if (!_wecomUser || _wecomOpenPages.length === 0) return;
    document.querySelectorAll('.sidebar-item[data-view]').forEach(function(el) {
        var view = el.dataset.view;
        if (_wecomOpenPages.indexOf(view) === -1) {
            el.style.display = 'none';
        }
    });
}

// 检查 WeCom 用户是否有权限访问指定 view
function _wecomCanAccess(viewId) {
    if (!_wecomUser) return true;  // 非企微用户不限制
    if (!_wecomOpenPages || _wecomOpenPages.length === 0) return false;  // 无白名单则全部禁止
    // 特殊：chat 视图总是允许（聊天基础功能）
    if (viewId === 'chat') return true;
    return _wecomOpenPages.indexOf(viewId) !== -1;
}

fetch('/auth/check').then(r => r.json()).then(function(data) {
    // 保存企微认证状态
    if (data.wecom_user) {
        _wecomUser = true;
        _wecomUserid = data.userid || '';
        _wecomKingdeeAllowed = !!data.kingdee_allowed;
    }
    if (data.wecom_open_pages) {
        _wecomOpenPages = data.wecom_open_pages;
    }

    if (data.auth_required && !data.authenticated) {
        showLoginScreen();
    } else {
        if (data.auth_required) {
            var logoutBtn = document.getElementById('logout-btn-header');
            if (logoutBtn) logoutBtn.classList.remove('hidden');
        }
        initApp();
        // 企微用户入场后应用菜单过滤
        _applyWecomFilter();
    }
}).catch(function() {
    initApp();
});

requestAnimationFrame(() => {
    document.body.classList.add('transition-colors', 'duration-200');
});

// =====================================================================
// Task Edit Modal
// =====================================================================
let currentEditingTask = null;

function loadTaskChannelOptions(selectedChannelType) {
    const select = document.getElementById('task-edit-channel-type');
    select.innerHTML = '';
    fetch('/api/channels').then(r => r.json()).then(data => {
        if (data.status !== 'success') return;
        const allChannels = data.channels || [];
        // Only include currently active channels, strictly following the channel management page logic
        let channels = allChannels.filter(c => c.active).map(c => {
            const label = (typeof c.label === 'object') ? (c.label[currentLang] || c.label.en || c.name) : (c.label || c.name);
            return { name: c.name, label: label };
        });
        const channelNames = channels.map(c => c.name);
        // Always include the web console channel
        if (!channelNames.includes('web')) {
            channels.unshift({ name: 'web', label: currentLang === 'zh' ? 'Web' : 'Web' });
        }
        // If the currently selected channel is not in the active list (e.g. disabled), append it to preserve selection
        if (selectedChannelType && !channelNames.includes(selectedChannelType) && selectedChannelType !== 'web') {
            const ch = allChannels.find(c => c.name === selectedChannelType);
            const label = ch
                ? ((typeof ch.label === 'object') ? (ch.label[currentLang] || ch.label.en || ch.name) : (ch.label || ch.name))
                : selectedChannelType;
            channels.push({ name: selectedChannelType, label: label });
        }
        channels.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.name;
            opt.textContent = c.label;
            select.appendChild(opt);
        });
        // Set selected value
        if (selectedChannelType) {
            select.value = selectedChannelType;
        }
    }).catch(() => {
        // fallback: at least keep the current selection and web
        select.innerHTML = '';
        const webOpt = document.createElement('option');
        webOpt.value = 'web';
        webOpt.textContent = 'Web';
        select.appendChild(webOpt);
        
        if (selectedChannelType && selectedChannelType !== 'web') {
            const opt = document.createElement('option');
            opt.value = selectedChannelType;
            opt.textContent = selectedChannelType;
            select.appendChild(opt);
        }
        if (selectedChannelType) {
            select.value = selectedChannelType;
        }
        
        // Show error message
        console.error('Failed to load channel options');
    });
}

function openTaskEditModal(task) {
    currentEditingTask = task;
    const overlay = document.getElementById('task-edit-modal-overlay');
    const titleEl = document.querySelector('#task-edit-modal-overlay h3');
    const subtitle = document.getElementById('task-edit-modal-subtitle');
    const deleteBtn = document.getElementById('task-edit-modal-delete');
    const nameInput = document.getElementById('task-edit-name');
    const enabledInput = document.getElementById('task-edit-enabled');
    const scheduleTypeSelect = document.getElementById('task-edit-schedule-type');
    const cronInput = document.getElementById('task-edit-cron-expression');
    const intervalInput = document.getElementById('task-edit-interval-seconds');
    const onceInput = document.getElementById('task-edit-once-time');
    const actionTypeSelect = document.getElementById('task-edit-action-type');
    const receiverInput = document.getElementById('task-edit-receiver');
    const contentInput = document.getElementById('task-edit-content');

    // Set title and subtitle
    titleEl.textContent = t('task_edit_title');
    subtitle.textContent = task.id;
    deleteBtn.classList.remove('hidden');

    // Populate data
    nameInput.value = task.name || '';
    enabledInput.checked = task.enabled !== false;

    const schedule = task.schedule || {};
    scheduleTypeSelect.value = schedule.type || 'cron';

    // Clear all schedule type input values first to avoid stale data
    cronInput.value = '';
    intervalInput.value = '';
    onceInput.value = '';

    if (schedule.type === 'cron') {
        cronInput.value = schedule.expression || '';
    } else if (schedule.type === 'interval') {
        intervalInput.value = schedule.seconds || '';
    } else if (schedule.type === 'once') {
        if (schedule.run_at) {
            // Manually parse ISO time string to avoid cross-browser timezone issues with new Date()
            // run_at format: "YYYY-MM-DDTHH:mm:ss" or "YYYY-MM-DDTHH:mm:ss.ffffff"
            const parts = schedule.run_at.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
            if (parts) {
                const timeInput = document.getElementById('task-edit-once-time');
                timeInput.value = `${parts[1]}-${parts[2]}-${parts[3]}T${parts[4]}:${parts[5]}:${parts[6]}`;
            }
        }
    }

    const action = task.action || {};
    actionTypeSelect.value = action.type || 'send_message';
    receiverInput.value = action.receiver || '';
    contentInput.value = action.content || action.task_description || '';

    // Load channel options and set selected value
    loadTaskChannelOptions(action.channel_type || 'web');

    // Disable channel type selector — channel is read-only when editing.
    // Switching the channel after a task is created is problematic because:
    //   1. The WeChat (weixin/ilink) bot requires a valid context_token that is tied
    //      to a specific user-session on that channel. Changing the channel to weixin
    //      would invalidate the existing token — the new receiver on weixin may not
    //      have an active context_token, causing the scheduled push to silently fail.
    //   2. Other channels (DingTalk, Feishu, etc.) also carry channel-specific fields
    //      (e.g. dingtalk_sender_staff_id) that cannot be trivially re-populated for
    //      a different channel type without user intervention.
    //   3. The receiver identity itself is channel-bound — a weixin user-id means
    //      nothing on a Feishu channel, so changing the channel would orphan the task.
    // For these reasons, the channel type is intentionally frozen once a task exists.
    // Users who need a task on a different channel should create a new task through
    // the chat interface (by asking the bot) rather than editing an existing one.
    document.getElementById('task-edit-channel-type').disabled = true;

    // Update UI
    updateTaskScheduleFields();
    updateTaskActionLabel();

    overlay.classList.remove('hidden');
}

function closeTaskEditModal() {
    document.getElementById('task-edit-modal-overlay').classList.add('hidden');
    currentEditingTask = null;
}

function updateTaskScheduleFields() {
    const scheduleType = document.getElementById('task-edit-schedule-type').value;
    const cronWrap = document.getElementById('task-edit-cron-wrap');
    const intervalWrap = document.getElementById('task-edit-interval-wrap');
    const onceWrap = document.getElementById('task-edit-once-wrap');
    const cronHint = document.getElementById('task-edit-cron-hint');
    const intervalHint = document.getElementById('task-edit-interval-hint');
    
    cronWrap.classList.toggle('hidden', scheduleType !== 'cron');
    intervalWrap.classList.toggle('hidden', scheduleType !== 'interval');
    onceWrap.classList.toggle('hidden', scheduleType !== 'once');
    
    if (cronHint) cronHint.classList.toggle('hidden', scheduleType !== 'cron');
    if (intervalHint) intervalHint.classList.toggle('hidden', scheduleType !== 'interval');
}

function updateTaskActionLabel() {
    const actionType = document.getElementById('task-edit-action-type').value;
    const label = document.getElementById('task-edit-content-label');
    const content = document.getElementById('task-edit-content');
    
    if (actionType === 'send_message') {
        label.textContent = t('task_message_content');
        content.placeholder = t('task_message_content');
    } else {
        label.textContent = t('task_task_description');
        content.placeholder = t('task_task_description');
    }
}

function saveTaskEdit() {
    const nameInput = document.getElementById('task-edit-name');
    const enabledInput = document.getElementById('task-edit-enabled');
    const scheduleTypeSelect = document.getElementById('task-edit-schedule-type');
    const cronInput = document.getElementById('task-edit-cron-expression');
    const intervalInput = document.getElementById('task-edit-interval-seconds');
    const onceInput = document.getElementById('task-edit-once-time');
    const actionTypeSelect = document.getElementById('task-edit-action-type');
    const channelTypeSelect = document.getElementById('task-edit-channel-type');
    const receiverInput = document.getElementById('task-edit-receiver');
    const contentInput = document.getElementById('task-edit-content');
    const statusEl = document.getElementById('task-edit-modal-status');
    const saveBtn = document.getElementById('task-edit-modal-save');
    
    const name = nameInput.value.trim();
    if (!name) {
        statusEl.textContent = currentLang === 'zh' ? '请输入任务名称' : 'Please enter task name';
        statusEl.style.opacity = '1';
        setTimeout(() => { statusEl.style.opacity = '0'; }, 3000);
        return;
    }
    
    const scheduleType = scheduleTypeSelect.value;
    const schedule = { type: scheduleType };
    
    if (scheduleType === 'cron') {
        const expr = cronInput.value.trim();
        if (!expr) {
            statusEl.textContent = currentLang === 'zh' ? '请输入 Cron 表达式' : 'Please enter cron expression';
            statusEl.style.opacity = '1';
            setTimeout(() => { statusEl.style.opacity = '0'; }, 3000);
            return;
        }
        // Basic cron expression format validation: 5 or 6 fields
        const fields = expr.split(/\s+/);
        if (fields.length < 5 || fields.length > 6) {
            statusEl.textContent = currentLang === 'zh' ? 'Cron 表达式格式错误，应为 5 或 6 个字段（分 时 日 月 周）' : 'Invalid cron expression, expected 5 or 6 fields (min hour day month weekday)';
            statusEl.style.opacity = '1';
            setTimeout(() => { statusEl.style.opacity = '0'; }, 3000);
            return;
        }
        schedule.expression = expr;
        // Note: detailed cron expression validity is verified by the backend croniter library; frontend only does basic format validation
    } else if (scheduleType === 'interval') {
        const seconds = parseInt(intervalInput.value);
        if (!seconds || seconds < 60) {
            statusEl.textContent = currentLang === 'zh' ? '间隔秒数最小为 60 秒' : 'Interval must be at least 60 seconds';
            statusEl.style.opacity = '1';
            setTimeout(() => { statusEl.style.opacity = '0'; }, 3000);
            return;
        }
        schedule.seconds = seconds;
    } else if (scheduleType === 'once') {
        const time = onceInput.value;
        if (!time) {
            statusEl.textContent = currentLang === 'zh' ? '请选择执行时间' : 'Please select execution time';
            statusEl.style.opacity = '1';
            setTimeout(() => { statusEl.style.opacity = '0'; }, 3000);
            return;
        }
        // Validate execution time format
        const selectedTime = new Date(time);
        if (isNaN(selectedTime.getTime())) {
            statusEl.textContent = currentLang === 'zh' ? '执行时间格式错误' : 'Invalid execution time format';
            statusEl.style.opacity = '1';
            setTimeout(() => { statusEl.style.opacity = '0'; }, 3000);
            return;
        }
        // Validate that time is in the future for one-time tasks
        if (selectedTime <= new Date()) {
            statusEl.textContent = currentLang === 'zh' ? '执行时间必须在当前时间之后' : 'Execution time must be in the future';
            statusEl.style.opacity = '1';
            setTimeout(() => { statusEl.style.opacity = '0'; }, 3000);
            return;
        }
        // datetime-local value with step="1" is already in YYYY-MM-DDTHH:mm:ss format
        // Backend _parse_naive_local treats strings without timezone suffix as local time
        schedule.run_at = time;
    }
    
    const actionType = actionTypeSelect.value;
    const channelType = channelTypeSelect.value;
    const content = contentInput.value.trim();

    if (!content) {
        statusEl.textContent = currentLang === 'zh' ? '请输入内容' : 'Please enter content';
        statusEl.style.opacity = '1';
        setTimeout(() => { statusEl.style.opacity = '0'; }, 3000);
        return;
    }
    
    // Build action with only necessary fields to avoid stale data
    const action = {
        type: actionType,
        channel_type: channelType,
        receiver: '',
        receiver_name: '',
        is_group: false,
        notify_session_id: ''
    };
    
    if (actionType === 'send_message') {
        action.content = content;
    } else {
        action.task_description = content;
    }
    
    // Preserve the original receiver info (channel is read-only, so it never changes)
    if (currentEditingTask && currentEditingTask.action) {
        action.receiver = currentEditingTask.action.receiver || '';
        action.receiver_name = currentEditingTask.action.receiver_name || '';
        action.is_group = currentEditingTask.action.is_group || false;
        action.notify_session_id = currentEditingTask.action.notify_session_id || '';
        
        // Preserve channel-specific fields (e.g. DingTalk sender_staff_id)
        if (channelType === 'dingtalk' && currentEditingTask.action.dingtalk_sender_staff_id) {
            action.dingtalk_sender_staff_id = currentEditingTask.action.dingtalk_sender_staff_id;
        }
    }
    
    saveBtn.disabled = true;
    
    const payload = {
        task_id: currentEditingTask.id,
        name: name,
        enabled: enabledInput.checked,
        schedule: schedule,
        action: action
    };
    
    fetch('/api/scheduler/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(r => r.json()).then(res => {
        saveBtn.disabled = false;
        if (res.status === 'success') {
            closeTaskEditModal();
            tasksLoaded = false;
            loadTasksView();
        } else {
            statusEl.textContent = res.message || (currentLang === 'zh' ? '保存失败' : 'Save failed');
            statusEl.style.opacity = '1';
            setTimeout(() => { statusEl.style.opacity = '0'; }, 3000);
        }
    }).catch(() => {
        saveBtn.disabled = false;
        statusEl.textContent = currentLang === 'zh' ? '网络错误' : 'Network error';
        statusEl.style.opacity = '1';
        setTimeout(() => { statusEl.style.opacity = '0'; }, 3000);
    });
}

function deleteTask() {
    if (!currentEditingTask) return;
    
    const taskName = currentEditingTask.name || currentEditingTask.id || '未知任务';
    const taskId = currentEditingTask.id;  // Capture early to avoid closure race condition
    showConfirmDialog({
        title: t('task_delete_confirm_title'),
        message: (currentLang === 'zh' ? `确定要删除任务「${taskName}」吗？` : `Are you sure to delete task "${taskName}"?`),
        onConfirm: () => {
            fetch('/api/scheduler/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ task_id: taskId })
            }).then(r => r.json()).then(res => {
                if (res.status === 'success') {
                    closeTaskEditModal();
                    tasksLoaded = false;
                    loadTasksView();
                } else {
                    const statusEl = document.getElementById('task-edit-modal-status');
                    if (statusEl) {
                        statusEl.textContent = res.message || 'Delete failed';
                        statusEl.classList.remove('hidden', 'text-green-500');
                        statusEl.classList.add('text-red-500');
                        setTimeout(() => { statusEl.style.opacity = '0'; }, 3000);
                    }
                }
            }).catch(() => {
                const statusEl = document.getElementById('task-edit-modal-status');
                if (statusEl) {
                    statusEl.textContent = 'Network error';
                    statusEl.classList.remove('hidden', 'text-green-500');
                    statusEl.classList.add('text-red-500');
                    setTimeout(() => { statusEl.style.opacity = '0'; }, 3000);
                }
            });
        }
    });
}

document.getElementById('task-edit-schedule-type').addEventListener('change', updateTaskScheduleFields);
document.getElementById('task-edit-action-type').addEventListener('change', updateTaskActionLabel);
document.getElementById('task-edit-modal-cancel').addEventListener('click', closeTaskEditModal);
document.getElementById('task-edit-modal-save').addEventListener('click', saveTaskEdit);
document.getElementById('task-edit-modal-delete').addEventListener('click', deleteTask);
document.getElementById('task-edit-modal-overlay').addEventListener('click', function(e) {
    if (e.target === this) closeTaskEditModal();
});
