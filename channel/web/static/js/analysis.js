/* =========================================================================
 * 金蝶数据分析页面 · 前端逻辑
 *
 * 依赖后端：
 *   GET  /api/analysis/context         初始化上下文（身份/权限/模板）
 *   POST /api/analysis/template/apply  应用模板（返回看板指令）
 *   POST /api/analysis/chat            专用对话（身份修正，返回 request_id）
 *   GET  /api/analysis/history         历史会话恢复
 *
 * SSE 消息流：POST /api/analysis/chat 返回 request_id 后，
 *   GET /stream?request_id=xxx 建立 EventSource，接收：
 *     - delta          : agent 文字增量
 *     - tool_execution_end : tool_name === 'render_dashboard' 时 result 为 ChartSpec JSON
 *     - message_end    : 本轮结束
 * ========================================================================= */

(function () {
    'use strict';

    const API = {
        context: '/api/analysis/context',
        apply: '/api/analysis/template/apply',
        chat: '/api/analysis/chat',
        history: '/api/analysis/history',
        stream: '/stream',
    };

    // localStorage key：按用户命名空间隔离，避免同浏览器切换企微账号后历史/看板串看
    function analysisSessionKey(userid) {
        return 'cow_analysis_session_id_' + (userid || 'anon');
    }
    // 会话 id 携带当前用户前缀（analysis_{userid}_），供后端校验归属
    function analysisNewSessionId(userid) {
        return 'analysis_' + (userid || 'anon') + '_' + Date.now();
    }

    const state = {
        userid: '',
        wecomAuthenticated: false,
        kingdeeAllowed: false,
        agentAvailable: true, // 是否注册专用 kingdee-analysis 智能体
        scope: 'all',
        templates: [],       // 可用模板
        lockedTemplates: [], // 无权限模板
        sessionId: '',       // init() 中按 ctx.userid 生成带命名空间的会话 id（旧格式 analysis_时间戳 弃用）
        currentTemplate: null,
        boardCount: 0,       // 动态图表卡片数
        activeStream: null,  // 当前 SSE
        charts: [],          // 当前激活标签页的图表卡片
        tabs: [],            // 标签页列表 [{id, title, charts[]}]
        activeTabId: null,   // 当前激活标签页 id
        tabSeq: 0,           // 标签页自增 id
        pendingOp: null,     // 最近一次操作 {type:'template'|'drill'|'suggestion'|'chat', title}
        loading: false,      // 是否分析中（closeTab 防御、CSS loading 类用）
        pendingTabs: [],     // 本轮分析中新生成的标签 id（A3：done 后一次性切到最后一个）
        boardCols: 1,        // 图表网格列数 1/2（KPI 独立排不受影响）
        timePreset: 'last_month',   // 时间范围预设（默认上月）
        timeStart: '',              // 起日期 YYYY-MM-DD
        timeEnd: '',                // 止日期 YYYY-MM-DD
    };

    const els = {};
    let chartInstances = []; // 保存 Chart.js 实例以便销毁
    let chartSpecs = [];     // 保存与 Chart 实例对应的 chart spec（用于销毁/下钻定位）
    const MAX_BOARD = 20;    // 单标签页图表网格卡片上限

    /* =====================================================================
     * 基础工具
     * ===================================================================== */

    function qs(sel) { return document.querySelector(sel); }

    async function api(path, opts) {
        const res = await fetch(path, {
            ...opts,
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', ...(opts && opts.headers) },
        });
        if (!res.ok) {
            // 会话过期/未认证 → 重新显示登录框
            if (res.status === 401 && typeof showLoginScreen === 'function') {
                const overlay = qs('#login-overlay');
                if (overlay && overlay.classList.contains('hidden')) {
                    showLoginScreen();
                }
            }
            throw new Error('HTTP ' + res.status);
        }
        return res.json();
    }

    function escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function toast(msg, type) {
        const t = qs('#toast');
        t.className = 'fixed bottom-5 right-5 z-50 px-4 py-2 rounded-lg text-sm text-white shadow-lg fade-in '
            + (type === 'error' ? 'bg-red-500' : 'bg-neutral-800 dark:bg-neutral-700');
        t.textContent = msg;
        t.classList.remove('hidden');
        clearTimeout(toast._t);
        toast._t = setTimeout(function () { t.classList.add('hidden'); }, 3000);
    }

    function scrollChatBottom() {
        els.chatStream.scrollTop = els.chatStream.scrollHeight;
    }

    /* =====================================================================
     * 对话区渲染
     * ===================================================================== */

    function addUserMsg(text) {
        const div = document.createElement('div');
        div.className = 'flex justify-end fade-in';
        div.innerHTML = '<div class="max-w-[85%] msg-user px-4 py-2.5 text-[13px]">' + escapeHtml(text) + '</div>';
        els.chatStream.appendChild(div);
        scrollChatBottom();
    }

    function addAiMsg(html) {
        const div = document.createElement('div');
        div.className = 'flex gap-2.5 fade-in';
        div.innerHTML = '<div class="w-7 h-7 rounded-full bg-primary-500/20 text-primary-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">AI</div>'
            + '<div class="flex-1"><div class="msg-ai px-4 py-3 text-[13px] leading-relaxed">' + html + '</div></div>';
        els.chatStream.appendChild(div);
        scrollChatBottom();
    }

    // 无数据/无权限提示：对话区高亮展示（agent 返回 charts:[] + no_data_message 时）
    function addNoDataMsg(message) {
        const div = document.createElement('div');
        div.className = 'flex gap-2.5 fade-in';
        div.innerHTML = '<div class="w-7 h-7 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"><i class="fas fa-exclamation-triangle"></i></div>'
            + '<div class="flex-1"><div class="msg-nodata"><i class="fas fa-info-circle mr-1"></i>' + escapeHtml(message) + '</div></div>';
        els.chatStream.appendChild(div);
        scrollChatBottom();
    }

    function showTyping(on) {
        let t = qs('#typing-indicator');
        if (on) {
            if (t) return;
            t = document.createElement('div');
            t.id = 'typing-indicator';
            t.className = 'flex gap-2.5 fade-in';
            t.innerHTML = '<div class="w-7 h-7 rounded-full bg-primary-500/20 text-primary-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">AI</div>'
                + '<div class="msg-ai px-4 py-3 flex items-center gap-1">'
                + '<span class="typing-dot text-neutral-400 text-xl">·</span>'
                + '<span class="typing-dot text-neutral-400 text-xl" style="animation-delay:.3s">·</span>'
                + '<span class="typing-dot text-neutral-400 text-xl" style="animation-delay:.6s">·</span>'
                + '<span class="text-[12px] text-neutral-400 ml-1">正在查询金蝶数据并生成看板...</span></div>';
            els.chatStream.appendChild(t);
            scrollChatBottom();
        } else if (t) {
            t.remove();
        }
    }

    /* =====================================================================
     * 初始化：加载上下文 + 渲染模板墙
     * ===================================================================== */

    async function init() {
        try {
            const ctx = await api(API.context);
            if (ctx.status !== 'success') {
                toast(ctx.message || '初始化失败', 'error');
                return;
            }
            state.userid = ctx.userid || '';
            state.wecomAuthenticated = !!ctx.wecom_authenticated;
            state.kingdeeAllowed = !!ctx.kingdee_allowed;
            state.agentAvailable = ctx.agent_available !== false;
            state.scope = ctx.scope || 'all';
            state.templates = ctx.templates || [];
            state.lockedTemplates = ctx.locked_templates || [];

            // 会话 id 按当前用户命名空间规范化：旧格式(analysis_时间戳)一律弃用，
            // 避免账号切换/他人猜测导致跨用户历史串看。
            var uid = state.userid || 'anon';
            var nsKey = analysisSessionKey(uid);
            var sid = localStorage.getItem(nsKey);
            if (!sid || sid.indexOf('analysis_' + uid + '_') !== 0) {
                sid = analysisNewSessionId(uid);
                try { localStorage.setItem(nsKey, sid); } catch (_) {}
            }
            state.sessionId = sid;

            // 用户信息栏
            const scopeLabel = { all: '全部数据', self: '仅本人', self_and_subordinates: '本人+下属', none: '无权限' };
            qs('#currentUserLabel').textContent =
                (ctx.wecom_authenticated ? (ctx.userid || '企微用户') : '管理员') + ' · ' + (scopeLabel[state.scope] || state.scope);
            qs('#permissionHint').textContent =
                state.kingdeeAllowed
                    ? ('数据权限: ' + (scopeLabel[state.scope] || state.scope))
                    : '您没有金蝶查询权限，请联系管理员开通';

            if (!state.kingdeeAllowed) {
                renderLockedNoPermission();
                return;
            }

            renderTemplateGrid();
            addAiMsg('你好，我是你的<span class="text-primary-500 font-medium">金蝶数据分析智能体</span>。👋<br>我可以帮你分析销售、订单、应收、出库等经营数据，并主动给出下一步分析建议。<br><span class="text-[12px] text-neutral-400">👇 先在右侧选择一个分析模板，或直接告诉我你想看什么。</span>');

            // 恢复历史会话（若存在）
            await restoreHistory();
        } catch (e) {
            toast('初始化失败: ' + e.message, 'error');
        }
    }

    function renderLockedNoPermission() {
        els.templatePicker.innerHTML = '';
        els.templatePicker.innerHTML = '<div class="text-center py-16">'
            + '<div class="text-3xl mb-3">🔒</div>'
            + '<div class="text-sm text-neutral-500">您没有金蝶查询权限，无法使用数据分析功能。</div>'
            + '<div class="text-[12px] text-neutral-400 mt-2">请联系管理员在「权限管理 → 金蝶权限」中为您开通。</div></div>';
    }

    function renderTemplateGrid() {
        const grid = qs('#templateGrid');
        grid.innerHTML = '';

        state.templates.forEach(function (t) {
            grid.appendChild(templateCard(t, false));
        });
        state.lockedTemplates.forEach(function (t) {
            grid.appendChild(templateCard(t, true));
        });
    }

    function templateCard(t, locked) {
        const div = document.createElement('div');
        div.className = 'template-card bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-5 relative'
            + (locked ? ' locked' : '');
        const badge = locked
            ? '<span class="absolute top-3 right-3 text-[10px] text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">🔒 无权限</span>'
            : '<span class="absolute top-3 right-3 text-[10px] text-primary-500 bg-primary-500/10 px-1.5 py-0.5 rounded">✓ 已授权</span>';
        div.innerHTML = badge
            + '<div class="text-3xl mb-3">' + (t.icon || '📊') + '</div>'
            + '<div class="font-medium text-sm mb-1">' + escapeHtml(t.name) + '</div>'
            + '<div class="text-[12px] text-neutral-500 leading-relaxed">' + escapeHtml(t.description || '') + '</div>'
            + (locked
                ? '<div class="mt-3 text-[11px] text-neutral-400">未授权表单 · 无法使用</div>'
                : '<div class="mt-3 text-[11px] text-primary-500">使用此模板 →</div>');
        if (!locked) {
            div.addEventListener('click', function () { applyTemplate(t); });
        } else {
            div.addEventListener('click', function () {
                toast('您没有该模板所需的表单权限', 'error');
            });
        }
        return div;
    }

    /* =====================================================================
     * 模板应用 + 生成初始看板
     * ===================================================================== */

    // 日期格式化 YYYY-MM-DD
    function fmtDate(d) {
        var y = d.getFullYear();
        var m = ('0' + (d.getMonth() + 1)).slice(-2);
        var day = ('0' + d.getDate()).slice(-2);
        return y + '-' + m + '-' + day;
    }

    // 根据预设计算时间范围，写入 state.timeStart / timeEnd
    function computeTimeRange(preset) {
        var now = new Date();
        var start, end;
        switch (preset) {
            case 'last_month': {
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            }
            case 'this_quarter': {
                var q = Math.floor(now.getMonth() / 3);
                start = new Date(now.getFullYear(), q * 3, 1);
                end = now;
                break;
            }
            case 'this_year': {
                start = new Date(now.getFullYear(), 0, 1);
                end = now;
                break;
            }
            case 'last_7d': {
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
                end = now;
                break;
            }
            case 'last_30d': {
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
                end = now;
                break;
            }
            case 'custom': {
                // 自定义：从日期 input 读取
                var s = qs('#timeStart').value;
                var e = qs('#timeEnd').value;
                state.timeStart = s;
                state.timeEnd = e;
                return;
            }
            case 'this_month':
            default: {
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = now;
                break;
            }
        }
        state.timeStart = fmtDate(start);
        state.timeEnd = fmtDate(end);
    }

    // 时间范围切换：更新预设、显示/隐藏自定义日期 input、更新 state
    function onTimePresetChange() {
        var sel = qs('#timeRangePreset');
        state.timePreset = sel ? sel.value : 'this_month';
        var isCustom = state.timePreset === 'custom';
        qs('#timeStart').classList.toggle('hidden', !isCustom);
        qs('#timeSep').classList.toggle('hidden', !isCustom);
        qs('#timeEnd').classList.toggle('hidden', !isCustom);
        if (isCustom && !qs('#timeStart').value) {
            // 默认给自定义日期初始值（本月）
            var now = new Date();
            qs('#timeStart').value = fmtDate(new Date(now.getFullYear(), now.getMonth(), 1));
            qs('#timeEnd').value = fmtDate(now);
        }
        computeTimeRange(state.timePreset);
    }

    // 自定义日期改变时更新 state
    function onTimeInputChange() {
        if (state.timePreset === 'custom') {
            computeTimeRange('custom');
        }
    }

    // 当前时间范围的描述文本（用于提示/发送给 agent）
    function timeRangeText() {
        computeTimeRange(state.timePreset);
        return (state.timeStart || '') + ' ~ ' + (state.timeEnd || '');
    }

    async function applyTemplate(t) {
        try {
            const res = await api(API.apply, {
                method: 'POST',
                body: JSON.stringify({ template_id: t.id }),
            });
            if (res.status !== 'success') {
                toast(res.message || '模板应用失败', 'error');
                return;
            }
            state.currentTemplate = res.template;
            // 模板指令作为系统引导，发起 agent 生成；附带当前时间范围
            const range = timeRangeText();
            qs('#currentTemplateLabel').textContent = t.name;
            qs('#boardTitle').textContent = t.name;
            qs('#metricHint').textContent = (res.template.metric_definition || '') + ' · 时间范围: ' + range;
            qs('#scopeBadge').textContent = scopeLabel();
            showTemplatePicker(false);
            addUserMsg('我选择用「' + t.name + '」模板，分析时间范围 ' + range);
            showTyping(true);
            // 把时间范围注入模板指令，让 agent 按此范围查询金蝶数据
            const instruction = res.instruction + '\n【时间范围】请按此范围分析：' + range + '（日期字段用 FDate，闭区间 FDate >= \'' + state.timeStart + '\' AND FDate <= \'' + state.timeEnd + '\'）';
            state.pendingOp = { type: 'template', title: t.name };
            await sendChatToAgent(instruction, true);
        } catch (e) {
            toast('模板应用失败: ' + e.message, 'error');
        }
    }

    function scopeLabel() {
        const map = { all: '全部数据', self: '仅本人', self_and_subordinates: '本人+下属' };
        return map[state.scope] || state.scope;
    }

    /* =====================================================================
     * 对话发送（走 SSE）
     * ===================================================================== */

    async function sendChat() {
        const input = qs('#userInput');
        let text = input.value.trim();
        if (!text) return;
        input.value = '';
        addUserMsg(text);
        // 用户对话默认带上当前选择的时间范围（除非用户消息里已含日期关键词）
        const range = timeRangeText();
        const hasDateKw = /今天|昨天|本月|上月|本季度|本季|今年|本年|近7天|近30天|近\s*\d+\s*天|\d{4}-\d{2}-\d{2}/.test(text);
        if (state.timeStart && !hasDateKw) {
            text = text + '\n（分析时间范围：' + range + '，日期字段 FDate 闭区间 ' + state.timeStart + ' ~ ' + state.timeEnd + '）';
        }
        // 记录操作类型与标题（用于标签页命名）
        const title = text.slice(0, 12);
        state.pendingOp = { type: 'chat', title: title };
        await sendChatToAgent(text, false);
    }

    async function sendChatToAgent(message, isTemplate) {
        // 会话串行：若已有流在跑，阻止新发送
        if (state.activeStream) {
            toast('智能体正在处理中，请稍候', 'error');
            return;
        }
        try {
            // 专用金蝶分析智能体可用则用之；未配置时回退默认 agent（功能仍可用）
            const agentId = state.agentAvailable ? 'kingdee-analysis' : 'default';
            const res = await api(API.chat, {
                method: 'POST',
                body: JSON.stringify({
                    session_id: state.sessionId,
                    message: message,
                    stream: true,
                    agent_id: agentId,
                }),
            });
            if (res.status !== 'success') {
                showTyping(false);
                addAiMsg('抱歉，发送失败：' + escapeHtml(res.message || '未知错误'));
                return;
            }
            await connectStream(res.request_id, res.stream);
        } catch (e) {
            showTyping(false);
            addAiMsg('抱歉，发送失败：' + escapeHtml(e.message));
        }
    }

    function connectStream(requestId, useStream) {
        return new Promise(function (resolve) {
            if (!useStream) { resolve(); return; }
            // 每轮独立：重置本轮新标签队列，避免上轮异常残留导致 done 错切
            state.pendingTabs = [];
            let accumulated = '';
            const es = new EventSource(API.stream + '?request_id=' + encodeURIComponent(requestId));
            state.activeStream = es;
            setAnalysisStatus('analyzing');   // 开始分析：显示"分析中"
            setLoading(true);                 // 锁定页面交互（禁用输入/图表）

            es.onmessage = function (e) {
                let item;
                try { item = JSON.parse(e.data); } catch (_) { return; }

                if (item.type === 'delta') {
                    accumulated += item.content || '';
                    updateTypingMsg(accumulated);
                } else if (item.type === 'tool_execution_end') {
                    // 提取 render_dashboard 工具结果 → ChartSpec
                    if (item.tool_name === 'render_dashboard') {
                        try {
                            const spec = parseChartSpec(item.result);
                            if (spec) renderChartSpec(spec);
                        } catch (_) { /* 忽略坏结果 */ }
                    }
                } else if (item.type === 'file') {
                    // agent 发送文件（如导出的 Excel）→ 渲染下载链接
                    renderFileDownload(item);
                } else if (item.type === 'done' || item.type === 'message_end') {
                    finalizeBotReply(accumulated);
                    if (item.type === 'done') {
                        es.close();
                        state.activeStream = null;
                        showTyping(false);
                        setAnalysisStatus('done');   // 分析完成
                        setLoading(false);           // 先解锁：新标签需在可交互状态切换
                        // A3：整轮结束后一次性切到本轮最终新标签（无新图则不动；
                        // 首图已即时切换时 activeTabId 已指向它，跳过避免重复渲染闪烁）
                        if (state.pendingTabs.length) {
                            var lastTabId = state.pendingTabs[state.pendingTabs.length - 1];
                            state.pendingTabs = [];
                            if (lastTabId !== state.activeTabId) {
                                switchTab(lastTabId);
                            }
                        }
                        showAnalysisDoneModal();     // 弹出分析完成通知
                        state.pendingOp = null;      // 清空本次操作标题
                        resolve();
                    }
                }
            };
            es.onerror = function () {
                es.close();
                state.activeStream = null;
                showTyping(false);
                finalizeBotReply(accumulated);
                setAnalysisStatus('done');   // 异常结束也标记完成
                setLoading(false);
                state.pendingTabs = [];      // 异常：半成品不跳转，仅停留在当前标签
                showAnalysisDoneModal(true); // 异常也通知（可选）
                state.pendingOp = null;
                resolve();
            };
        });
    }

    // 页面锁定/解锁：分析期间禁止输入、点击图表、操作工具栏
    function setLoading(loading) {
        state.loading = loading;
        const input = qs('#userInput');
        if (input) input.disabled = loading;

        // 发送按钮禁用
        const sendBtn = qs('#sendBtn');
        if (sendBtn) {
            sendBtn.disabled = loading;
            sendBtn.classList.toggle('opacity-50', loading);
            sendBtn.classList.toggle('cursor-not-allowed', loading);
        }

        // 看板顶部分析状态条（不遮挡图表；sticky 贴顶，仅显隐切换）
        const overlay = qs('#dashboardLoading');
        if (overlay) overlay.classList.toggle('hidden', !loading);

        // 工具栏按钮禁用
        document.querySelectorAll('.toolbar-btn').forEach(function (b) {
            b.disabled = loading;
            b.classList.toggle('opacity-50', loading);
            b.classList.toggle('cursor-not-allowed', loading);
        });

        // 建议面板卡片禁用点击
        const sugPanel = qs('#suggestionPanel');
        if (sugPanel) {
            sugPanel.classList.toggle('pointer-events-none', loading);
            sugPanel.classList.toggle('opacity-60', loading);
        }

        // v1.4：不锁 dashboardArea 整体（保证外层 #mainArea 滚动与标签切换可用）。
        // 通过 .loading 类驱动 CSS 锁定 KPI/图表内容区 + 禁用标签 × 关闭。
        const dashArea = qs('#dashboardArea');
        if (dashArea) {
            dashArea.classList.toggle('loading', loading);
        }
    }

    // 分析完成通知弹窗
    function showAnalysisDoneModal(isError) {
        const modal = qs('#analysisDoneModal');
        if (!modal) return;
        if (isError) {
            const title = qs('#doneModalTitle');
            const desc = qs('#doneModalDesc');
            if (title) title.textContent = '分析已结束';
            if (desc) desc.textContent = '本次分析已完成（可能存在异常），现在可以继续操作了。';
        }
        modal.classList.remove('hidden');
    }

    function dismissDoneModal() {
        const modal = qs('#analysisDoneModal');
        if (modal) modal.classList.add('hidden');
    }

    // 分析状态提示："分析中" → "分析完成" → 隐藏
    function setAnalysisStatus(mode) {
        const bar = qs('#analysisStatus');
        if (!bar) return;
        const icon = qs('#analysisStatusIcon');
        const text = qs('#analysisStatusText');
        if (mode === 'analyzing') {
            bar.classList.remove('hidden');
            icon.className = 'w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0';
            text.textContent = '分析中，智能体正在查询金蝶数据并生成看板...';
        } else if (mode === 'done') {
            bar.classList.remove('hidden');
            icon.className = 'w-2 h-2 rounded-full bg-emerald-500 shrink-0';
            text.textContent = '分析完成 ✅';
            // 2 秒后隐藏
            clearTimeout(setAnalysisStatus._t);
            setAnalysisStatus._t = setTimeout(function () { bar.classList.add('hidden'); }, 2000);
        } else {
            bar.classList.add('hidden');
        }
    }

    // agent 发送的文件（如导出的 Excel）→ 在对话区渲染下载链接
    function renderFileDownload(item) {
        const fileName = item.file_name || (item.content || '').split('/').pop() || '文件';
        const isExcel = /\.(xlsx|xls|csv)$/i.test(fileName);
        const icon = isExcel ? 'fas fa-file-excel' : 'fas fa-file';
        const div = document.createElement('div');
        div.className = 'flex gap-2.5 fade-in';
        div.innerHTML = '<div class="w-7 h-7 rounded-full bg-primary-500/20 text-primary-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">AI</div>'
            + '<div class="flex-1"><div class="msg-ai px-4 py-3 text-[13px]">'
            + '<a href="' + escapeHtml(item.content) + '" download="' + escapeHtml(fileName) + '" target="_blank" '
            + 'class="inline-flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-lg text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition-colors">'
            + '<i class="' + icon + '"></i><span>下载 ' + escapeHtml(fileName) + '</span></a>'
            + '</div></div>';
        els.chatStream.appendChild(div);
        scrollChatBottom();
    }

    let _typingEl = null;
    function updateTypingMsg(text) {
        if (!_typingEl) {
            _typingEl = document.createElement('div');
            _typingEl.className = 'flex gap-2.5 fade-in';
            _typingEl.innerHTML = '<div class="w-7 h-7 rounded-full bg-primary-500/20 text-primary-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">AI</div>'
                + '<div class="flex-1"><div class="msg-ai px-4 py-3 text-[13px] leading-relaxed"></div></div>';
            els.chatStream.appendChild(_typingEl);
            scrollChatBottom();
        }
        _typingEl.querySelector('.msg-ai').innerHTML = escapeHtml(text);
        scrollChatBottom();
    }

    function finalizeBotReply(accumulated) {
        if (_typingEl) {
            if (accumulated && accumulated.trim()) {
                _typingEl.querySelector('.msg-ai').innerHTML = escapeHtml(accumulated.trim());
            } else {
                _typingEl.remove();
            }
            _typingEl = null;
        }
    }

    /* =====================================================================
     * ChartSpec 解析与看板渲染
     * ===================================================================== */

    function parseChartSpec(raw) {
        // 工具结果为 JSON 字符串（可能是嵌套字符串）
        if (typeof raw === 'string') {
            try { raw = JSON.parse(raw); } catch (_) { return null; }
        }
        // 若 result 包了一层 {status, result}
        if (raw && typeof raw === 'object' && raw.result && !raw.charts) {
            return parseChartSpec(raw.result);
        }
        if (!raw || !Array.isArray(raw.charts)) return null;
        return raw;
    }

    function renderChartSpec(spec, restore) {
        var charts = spec.charts || [];
        // 无数据/无权限：不创建空白标签页、看板不追加卡片，no_data_message 在对话区高亮展示一次
        if (charts.length === 0) {
            if (spec.no_data_message && !restore) {
                addNoDataMsg(spec.no_data_message);
            }
            return;
        }
        // 方案A：每次有图表生成的操作（模板/下钻/对话）都新建标签页
        var title = '';
        if (state.pendingOp && state.pendingOp.title) {
            title = state.pendingOp.title;
        } else if (spec.dashboard_title) {
            title = spec.dashboard_title;
        }
        if (!title) title = '分析结果';
        // 模板名去掉图标 emoji 前缀，更整洁
        title = title.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\s]+/u, '');

        // 为每张图初始化前端视图状态（数量/类型/系列），切标签页不丢
        charts.forEach(function (c) { c._view = initViewState(c); });

        var tabId = createTab(title, charts);
        // 建议卡片：agent 通过 render_dashboard 的 suggestions 字段返回
        if (spec.suggestions && spec.suggestions.length) {
            renderSuggestions(spec.suggestions);
        }

        if (restore) {
            // 历史恢复：保持现状——逐条重建并停到最后一个标签（switchTab 内部同步标题）
            showDashboard();
            switchTab(tabId);
        } else if (state.activeTabId === null) {
            // 首图（当前无任何标签）：立即展示，避免看空看板；同步标题
            state.pendingTabs.push(tabId);
            showDashboard();
            switchTab(tabId);
        } else {
            // 后续图（A3）：后台追加排队，不切走当前标签、不改标题；done 统一跳转
            state.pendingTabs.push(tabId);
            showDashboard();
        }
    }

    // 新建标签页并渲染其图表
    function createTab(title, charts) {
        var MAX_TABS = 15;
        if (state.tabs.length >= MAX_TABS) {
            toast('标签页数量已达上限（' + MAX_TABS + '），请先关闭部分标签页', 'error');
            return state.activeTabId;
        }
        var id = 'tab_' + (++state.tabSeq);
        state.tabs.push({ id: id, title: title || '分析结果', charts: charts || [] });
        renderTabs();
        return id;
    }

    // 获取当前激活标签页
    function getActiveTab() {
        for (var i = 0; i < state.tabs.length; i++) {
            if (state.tabs[i].id === state.activeTabId) return state.tabs[i];
        }
        return state.tabs.length ? state.tabs[state.tabs.length - 1] : null;
    }

    // 渲染标签栏
    function renderTabs() {
        var tabsEl = qs('#dashboardTabs');
        if (!tabsEl) return;
        if (state.tabs.length === 0) {
            tabsEl.classList.add('hidden');
            return;
        }
        tabsEl.classList.remove('hidden');
        tabsEl.innerHTML = '';
        state.tabs.forEach(function (tab) {
            var isActive = tab.id === state.activeTabId;
            var el = document.createElement('div');
            el.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] cursor-pointer shrink-0 fade-in '
                + (isActive
                    ? 'bg-primary-500/15 border border-primary-500/40 text-primary-500'
                    : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:border-neutral-400');
            el.innerHTML = '<span class="max-w-[140px] truncate">' + escapeHtml(tab.title) + '</span>'
                + '<span class="tab-close text-neutral-500 hover:text-red-400" title="关闭">&times;</span>';
            el.addEventListener('click', function (e) {
                if (e.target.classList.contains('tab-close')) {
                    closeTab(tab.id);
                } else {
                    switchTab(tab.id);
                }
            });
            tabsEl.appendChild(el);
        });
    }

    // 切换标签页
    function switchTab(id) {
        state.activeTabId = id;
        var tab = getActiveTab();
        if (!tab) return;
        destroyAllCharts();
        state.charts = tab.charts;
        state.boardCount = tab.charts.length;
        renderAllCards();
        renderTabs();
        qs('#boardTitle').textContent = tab.title;
    }

    // 关闭标签页
    function closeTab(id) {
        // 分析中禁止关闭：防止与进行中的 SSE 标签追加/切换产生状态竞态（CSS 已禁用 ×，此处双保险）
        if (state.loading) {
            toast('智能体分析中，请稍候再关闭标签页', 'error');
            return;
        }
        var idx = -1;
        for (var i = 0; i < state.tabs.length; i++) {
            if (state.tabs[i].id === id) { idx = i; break; }
        }
        if (idx < 0) return;
        state.tabs.splice(idx, 1);
        if (state.activeTabId === id) {
            state.activeTabId = null;
        }
        renderTabs();
        if (state.tabs.length === 0) {
            destroyAllCharts();
            state.charts = [];
            state.boardCount = 0;
            clearCardContainers();
            qs('#boardTitle').textContent = '看板';
            return;
        }
        // 激活最后一个标签页
        var last = state.tabs[state.tabs.length - 1];
        switchTab(last.id);
    }

    function showDashboard() {
        els.templatePicker.classList.add('hidden');
        els.dashboardArea.classList.remove('hidden');
        els.suggestionPanel.classList.remove('hidden');
    }

    // 清空所有标签页 + 看板
    function clearDashboard() {
        destroyAllCharts();
        state.charts = [];
        state.tabs = [];
        state.activeTabId = null;
        state.boardCount = 0;
        state.pendingTabs = [];   // 清空看板时同步丢弃待切换队列
        var tabsEl = qs('#dashboardTabs');
        if (tabsEl) { tabsEl.innerHTML = ''; tabsEl.classList.add('hidden'); }
        clearCardContainers();
    }

    function clearCardContainers() {
        if (els.kpiGrid) els.kpiGrid.innerHTML = '';
        if (els.chartGrid) els.chartGrid.innerHTML = '';
    }

    function destroyAllCharts() {
        chartInstances.forEach(function (c) { try { c.destroy(); } catch (_) {} });
        chartInstances = [];
        chartSpecs = [];
    }

    // 渲染当前标签页全部卡片：KPI 进独立行（auto-fit），图卡进图表网格
    function renderAllCards() {
        clearCardContainers();
        var charts = state.charts || [];
        charts.forEach(function (chart) {
            if (!chart || !chart.type) return;
            if (chart.type === 'kpi') { renderKpiCard(chart); }
            else { renderChartCard(chart); }
        });
        // KPI 容器无内容则隐藏，避免空高
        if (els.kpiGrid && els.kpiGrid.children.length === 0) els.kpiGrid.classList.add('hidden');
        else if (els.kpiGrid) els.kpiGrid.classList.remove('hidden');
    }

    // KPI 卡：紧凑小卡，独立排布，点击=围绕该指标整图下钻
    function renderKpiCard(chart) {
        var grid = els.kpiGrid;
        var data = chart.data && chart.data[0] || {};
        var card = document.createElement('div');
        card.className = 'kpi-card bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 fade-in';
        card.innerHTML = '<div class="flex items-center justify-between">'
            + '<div class="text-[12px] text-neutral-500">' + escapeHtml(chart.title || '') + '</div>'
            + '<button class="export-btn card-icon-btn" title="导出为 Excel"><i class="fas fa-file-excel"></i></button></div>'
            + '<div class="text-2xl font-semibold mt-1">' + escapeHtml(formatValue(data.value)) + '</div>'
            + '<div class="text-[11px] mt-1 ' + (data.delta != null && data.delta >= 0 ? 'text-emerald-500' : 'text-red-500') + '">'
            + (data.delta != null ? ((data.delta >= 0 ? '▲ ' : '▼ ') + escapeHtml(Math.abs(data.delta))) : '') + '</div>';
        card.addEventListener('click', function () { drillWhole(chart, '围绕该指标深入分析构成与趋势'); });
        card.querySelector('.export-btn').addEventListener('click', function (e) {
            e.stopPropagation();
            exportChartToExcel(chart);
        });
        grid.appendChild(card);
    }

    // 图表卡片核心：header(标题+徽标+导出+⚙) + 视图区(260px) + Chart.js/表格 + 下钻
    function renderChartCard(chart) {
        var grid = els.chartGrid;
        if (!grid) return;
        if (grid.children.length >= MAX_BOARD) {
            toast('该标签页看板卡片已达上限（' + MAX_BOARD + '）', 'error');
            return;
        }
        // 纯降级：数据无法绘制任何图（无数值字段/非数组）→ 只读表格卡
        if (!isChartRenderable(chart)) {
            renderTableCard(grid, chart);
            return;
        }
        var card = document.createElement('div');
        card.className = 'chart-card relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 fade-in';
        card.innerHTML = headerHtml(chart)
            + '<div class="view-slot h-[260px] relative"></div>'
            + '<div class="absolute bottom-1.5 right-3 text-[9px] text-primary-500/80">🔍 点击数据点定点下钻 · 空白整图下钻</div>';
        grid.appendChild(card);
        var slot = card.querySelector('.view-slot');
        // 点击 slot 空白区（非 canvas/表格/交互控件）→ 整图下钻
        slot.addEventListener('click', function (e) {
            if (e.target === slot || (e.target.classList && e.target.classList.contains('empty-slot'))) {
                drillWhole(chart, '对整图继续下钻');
            }
        });
        renderChartCardView(chart, card);
        bindCardControls(chart, card);
    }

    // 卡 header：类型徽标 + 导出 + ⚙（⚙ 设置收进弹出小菜单，避免窄列拥挤）
    function headerHtml(chart) {
        var view = chart._view || {};
        var badgeMap = { line: '趋势', bar: '排行', pie: '占比', area: '面积', table: '表格' };
        var tLabel = badgeMap[view.type] || badgeMap[chart.type] || chart.type;
        var dimHint = chart.dimensionLabel ? ('（' + chart.dimensionLabel + '）') : '';
        return '<div class="flex items-center justify-between mb-2 gap-2">'
            + '<div class="text-[13px] font-medium truncate" title="' + escapeHtml(chart.title || '') + '">' + escapeHtml(chart.title || '') + dimHint + '</div>'
            + '<div class="flex items-center gap-1 shrink-0">'
            + '<span class="view-badge text-[10px] px-1.5 py-0.5 rounded bg-primary-500/10 text-primary-500">' + escapeHtml(tLabel) + '</span>'
            + '<button class="card-icon-btn export-btn" title="导出全量数据"><i class="fas fa-file-excel"></i></button>'
            + '<button class="card-icon-btn gear-btn" title="视图设置：数量/图类型/数值系列"><i class="fas fa-cog"></i></button>'
            + '</div></div>';
    }

    // 绑定 header 上导出 / ⚙ 交互（stopPropagation 防误触发下钻）
    function bindCardControls(chart, card) {
        card.querySelector('.export-btn').addEventListener('click', function (e) {
            e.stopPropagation();
            exportChartToExcel(chart);
        });
        card.querySelector('.gear-btn').addEventListener('click', function (e) {
            e.stopPropagation();
            toggleViewMenu(chart, card);
        });
        // 关闭其他打开的菜单
        document.addEventListener('click', function (e) {
            if (!e.target.closest('.view-menu') && !e.target.closest('.gear-btn')) {
                var menus = document.querySelectorAll('.view-menu');
                menus.forEach(function (m) { m.classList.add('hidden'); });
            }
        });
    }

    // ⚙ 菜单：显示数量 / 图类型 / 数值系列勾选
    function toggleViewMenu(chart, card) {
        var menu = card.querySelector('.view-menu');
        if (!menu) { menu = buildViewMenu(chart, card); card.appendChild(menu); }
        var menus = document.querySelectorAll('.view-menu');
        menus.forEach(function (m) { if (m !== menu) m.classList.add('hidden'); });
        menu.classList.toggle('hidden');
    }

    function buildViewMenu(chart, card) {
        var view = chart._view = chart._view || initViewState(chart);
        var menu = document.createElement('div');
        menu.className = 'view-menu absolute right-2 top-12 z-40 w-60 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-xl p-3 text-[12px] hidden';
        // 数值候选：yKey 外数值字段（遍历全部行推断，不依赖 agent 声明 numericFields）
        var rows = chart.data || [];
        var numericCandidates = [];
        var seen = {};
        rows.forEach(function (r) {
            Object.keys(r).forEach(function (k) {
                if (seen[k]) return;
                if (k === chart.xKey) return;
                if (k.indexOf('_') === 0) return;
                if (typeof r[k] === 'number') { seen[k] = true; numericCandidates.push(k); }
            });
        });
        if (chart.yKey && numericCandidates.indexOf(chart.yKey) === -1) {
            numericCandidates.unshift(chart.yKey);
        }
        // 数量选项
        var total = rows.length;
        var limitCur = view.limit === 0 ? '全部' : ('前' + view.limit);
        var limitOpts = total > 5
            ? ['前5', '前10', '前20', '全部']
            : ['全部'];
        var html = '<div class="font-medium mb-2 flex items-center gap-1"><i class="fas fa-sliders-h text-primary-500"></i> 视图设置</div>';
        // 数量
        html += '<div class="mb-2"><div class="text-[10px] text-neutral-400 mb-1">显示数量</div>'
            + '<select class="limit-sel">' + limitOpts.map(function (o) {
                return '<option value="' + o + '" ' + (o === limitCur ? 'selected' : '') + '>' + o + '</option>';
            }).join('') + '</select></div>';
        // 图类型
        var types = [['bar', '柱状'], ['line', '折线'], ['pie', '饼图'], ['area', '面积'], ['table', '表格']];
        html += '<div class="mb-2"><div class="text-[10px] text-neutral-400 mb-1">图类型</div><div class="flex flex-wrap gap-1">'
            + types.map(function (t) {
                var on = view.type === t[0];
                return '<span class="type-chip px-1.5 py-0.5 rounded border text-[11px] ' + (on ? 'active' : '') + '" data-type="' + t[0] + '">' + t[1] + '</span>';
            }).join('') + '</div></div>';
        // 数值系列
        html += '<div class="mb-1"><div class="text-[10px] text-neutral-400 mb-1">数值系列（多选=多系列/双Y轴）</div><div class="grid grid-cols-2 gap-1">'
            + numericCandidates.map(function (f) {
                var on = view.series.indexOf(f) !== -1;
                return '<label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" class="series-cb" data-field="' + escapeHtml(f) + '" ' + (on ? 'checked' : '') + '> ' + escapeHtml(fieldLabel(f)) + '</label>';
            }).join('') + '</div></div>';
        html += '<div class="text-[9px] text-neutral-400 mt-1">占比/环比等带%字段仅展示；选择会自动记忆</div>';
        menu.innerHTML = html;

        menu.querySelector('.limit-sel').addEventListener('change', function (e) {
            e.stopPropagation();
            var v = this.value;
            view.limit = v === '全部' ? 0 : parseInt(v.replace('前', ''), 10);
            refreshChartCardView(chart, card);
        });
        menu.querySelectorAll('.type-chip').forEach(function (el) {
            el.addEventListener('click', function (e) {
                e.stopPropagation();
                var t = el.getAttribute('data-type');
                view.type = t;
                if (t === 'pie' && view.series.length > 1) {
                    view.series = [view.series[0]];
                    toast('饼图仅支持单系列，已收敛为主指标', 'error');
                }
                refreshChartCardView(chart, card);
                updateViewMenu(chart, card);
            });
        });
        menu.querySelectorAll('.series-cb').forEach(function (el) {
            el.addEventListener('change', function (e) {
                e.stopPropagation();
                var f = el.getAttribute('data-field');
                if (el.checked) {
                    if (view.type === 'pie' && view.series.length >= 1 && view.series.indexOf(f) === -1) {
                        el.checked = false;
                        toast('饼图仅支持单系列', 'error');
                        return;
                    }
                    if (view.series.indexOf(f) === -1) view.series.push(f);
                } else {
                    view.series = view.series.filter(function (x) { return x !== f; });
                }
                if (!view.series.length) {
                    view.series = [view.series[0] || numericCandidates[0] || chart.yKey || 'value'];
                    el.checked = true;
                    toast('至少保留一个数值系列', 'error');
                }
                refreshChartCardView(chart, card);
            });
        });
        return menu;
    }

    function updateViewMenu(chart, card) {
        var menu = card.querySelector('.view-menu');
        if (!menu) return;
        var view = chart._view;
        // 更新类型 chip 高亮
        menu.querySelectorAll('.type-chip').forEach(function (el) {
            el.classList.toggle('active', el.getAttribute('data-type') === view.type);
        });
        // 更新徽标
        var badgeMap = { line: '趋势', bar: '排行', pie: '占比', area: '面积', table: '表格' };
        var badge = card.querySelector('.view-badge');
        if (badge) badge.textContent = badgeMap[view.type] || view.type;
    }

    function initViewState(chart) {
        return {
            type: chart.type || 'bar',
            limit: 0,  // 默认全部（agent 返回条数有限）
            series: [chart.yKey || 'value'],
        };
    }

    function isChartRenderable(chart) {
        var data = chart.data;
        if (!Array.isArray(data) || data.length === 0) return false;
        var yKey = chart.yKey || 'value';
        return data.some(function (d) { return typeof d[yKey] === 'number'; });
    }

    // 表格卡片：全字段全行（滚动），行点击定点下钻
    function renderTableCard(grid, chart) {
        var card = document.createElement('div');
        card.className = 'chart-card relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 fade-in';
        var rows = chart.data || [];
        var colMeta = buildTableCols(chart, rows);
        var inner = '<div class="text-[13px] font-medium">' + escapeHtml(chart.title || '数据明细') + '</div>'
            + '<div class="flex items-center gap-1 shrink-0">'
            + '<button class="card-icon-btn export-btn" title="导出全量数据"><i class="fas fa-file-excel"></i></button>'
            + '<span class="text-[10px] text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded">' + (isChartRenderable(chart) ? '明细' : '降级为表格') + '</span>'
            + '</div>';
        var body = rows.length
            ? '<div class="max-h-[260px] overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-700 table-detail">'
            + '<table class="w-full text-[12px]"><thead class="sticky top-0"><tr class="bg-neutral-100 dark:bg-neutral-800">'
            + colMeta.map(function (m) { return '<th class="px-2 py-1.5 text-left text-neutral-500 font-medium whitespace-nowrap">' + escapeHtml(m.label) + '</th>'; }).join('')
            + '</tr></thead><tbody>'
            + rows.map(function (r, i) {
                return '<tr data-i="' + i + '" title="点击行定点下钻该' + (chart.dimensionLabel || '数据') + '">'
                    + colMeta.map(function (m) { return '<td class="px-2 py-1.5 text-neutral-700 dark:text-neutral-300 whitespace-nowrap">' + escapeHtml(r[m.key] != null ? r[m.key] : '-') + '</td>'; }).join('')
                    + '</tr>';
            }).join('')
            + '</tbody></table></div>'
            : '<div class="empty-slot text-center py-10 text-[12px] text-neutral-400">暂无数据</div>';
        card.innerHTML = '<div class="flex items-center justify-between mb-2 gap-2">' + inner + '</div>' + body;
        var exportBtn = card.querySelector('.export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                exportChartToExcel(chart);
            });
        }
        // 行点击 → 定点下钻该行
        card.querySelectorAll('tbody tr').forEach(function (tr) {
            tr.addEventListener('click', function () {
                var i = parseInt(tr.getAttribute('data-i'), 10);
                drillPoint(chart, rows[i]);
            });
        });
        grid.appendChild(card);
    }

    // 在已有 card 内重建视图（数量/类型/系列变化后）
    function refreshChartCardView(chart, card) {
        var slot = card.querySelector('.view-slot');
        if (!slot) return;
        destroyChartInstance(chart);
        renderChartCardView(chart, card);
        updateViewMenu(chart, card);
    }

    function renderChartCardView(chart, card) {
        var slot = card.querySelector('.view-slot');
        var view = chart._view = chart._view || initViewState(chart);
        if (!slot) return;
        slot.innerHTML = '';
        // 表格视图
        if (view.type === 'table') {
            renderTableInline(slot, chart, view);
            return;
        }
        var data = slicedByLimit(chart.data || [], view.limit);
        if (!data.length) {
            slot.innerHTML = '<div class="empty-slot h-[260px] flex items-center justify-center text-[12px] text-neutral-400">暂无数据</div>';
            return;
        }
        var canvas = document.createElement('canvas');
        slot.appendChild(canvas);
        drawChart(chart, view, data, canvas);
    }

    function slicedByLimit(rows, limit) {
        if (!limit || limit >= rows.length) return rows;
        return rows.slice(0, limit);
    }

    function destroyChartInstance(chart) {
        if (chart._chart) { try { chart._chart.destroy(); } catch (_) {} }
        chart._chart = null;
    }

    // 表格作为图类型之一（内嵌在图表卡，行点击定点下钻）
    function renderTableInline(slot, chart, view) {
        var rows = slicedByLimit(chart.data || [], view.limit);
        if (!rows.length) {
            slot.innerHTML = '<div class="empty-slot h-[260px] flex items-center justify-center text-[12px] text-neutral-400">暂无数据</div>';
            return;
        }
        var colMeta = buildTableCols(chart, rows);
        slot.innerHTML = '<div class="max-h-[260px] overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-700 table-detail">'
            + '<table class="w-full text-[12px]"><thead class="sticky top-0"><tr class="bg-neutral-100 dark:bg-neutral-800">'
            + colMeta.map(function (m) { return '<th class="px-2 py-1.5 text-left text-neutral-500 font-medium whitespace-nowrap">' + escapeHtml(m.label) + '</th>'; }).join('')
            + '</tr></thead><tbody>'
            + rows.map(function (r, i) {
                return '<tr data-i="' + i + '" title="点击行定点下钻该' + (chart.dimensionLabel || '数据') + '">'
                    + colMeta.map(function (m) { return '<td class="px-2 py-1.5 text-neutral-700 dark:text-neutral-300 whitespace-nowrap">' + escapeHtml(r[m.key] != null ? r[m.key] : '-') + '</td>'; }).join('')
                    + '</tr>';
            }).join('')
            + '</tbody></table></div>';
        slot.querySelectorAll('tbody tr').forEach(function (tr) {
            tr.addEventListener('click', function () {
                var i = parseInt(tr.getAttribute('data-i'), 10);
                drillPoint(chart, rows[i]);
            });
        });
    }

    // 核心图表渲染：多系列 + 自动聚类双Y轴 + 负值取消0基线 + tooltip 多字段 + 定点/空白下钻
    function drawChart(chart, view, data, canvas) {
        var ctx = canvas.getContext('2d');
        if (!ctx) return;
        var xKey = chart.xKey || 'name';
        var yKey = chart.yKey || 'value';
        var series = view.series && view.series.length ? view.series : [yKey];
        var isDark = document.documentElement.classList.contains('dark');
        var gridColor = isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)';
        var tickColor = isDark ? '#9ca3af' : '#6b7280';
        var palette = ['#35A85B', '#3b82f6', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#64748b'];
        var labels = data.map(function (d) { return d[xKey] != null ? String(d[xKey]) : ''; });

        // 自动聚类分轴：主系列(第1个)值域为基准，其余系列值域跨度比 ≥20 → 右轴(y1)，否则共用左轴
        function spanOf(field) {
            var vals = data.map(function (r) { return r[field]; }).filter(function (v) { return typeof v === 'number' && isFinite(v); });
            if (!vals.length) return 0;
            return Math.max(Math.max.apply(null, vals), Math.max.apply(null, vals.map(function (v) { return -v; })));
        }
        var baseSpan = spanOf(series[0]) || 1e-9;
        var axisOf = {};
        series.forEach(function (f, i) {
            axisOf[f] = (i === 0) ? 'y' : ((spanOf(f) / baseSpan) >= 20 ? 'y1' : 'y');
        });
        var hasRight = series.some(function (f) { return axisOf[f] === 'y1'; });
        // 负值检测（按轴）→ 取消 0 基线
        function hasNeg(f) {
            return data.some(function (r) { return typeof r[f] === 'number' && r[f] < 0; });
        }
        var yNeg = series.some(function (f) { return axisOf[f] === 'y' && hasNeg(f); });
        var y1Neg = series.some(function (f) { return axisOf[f] === 'y1' && hasNeg(f); });

        var singleSeries = series.length === 1;
        var datasets = series.map(function (f, i) {
            var onRight = axisOf[f] === 'y1';
            var color = onRight ? '#3b82f6' : palette[i % palette.length];
            var isLineLike = view.type === 'line' || view.type === 'area';
            // 分色：
            //  - pie（必单系列）：逐扇区分色
            //  - bar 单系列：逐柱分色（排行图每根柱不同色）
            //  - bar 多系列 / line / area：按系列固定色
            var perPoint = (view.type === 'pie') || (view.type === 'bar' && singleSeries);
            var bg, bc;
            if (perPoint) {
                bg = data.map(function (_, j) { return palette[j % palette.length]; });
                bc = data.map(function (_, j) { return palette[j % palette.length]; });
            } else if (isLineLike) {
                bg = onRight ? 'rgba(59,130,246,.18)' : 'rgba(53,168,91,.18)';
                bc = color;
            } else {
                bg = color + (onRight ? '99' : 'cc');
                bc = color;
            }
            return {
                label: fieldLabel(f),
                data: data.map(function (r) { return r[f] != null ? r[f] : null; }),
                backgroundColor: bg,
                borderColor: bc,
                borderWidth: 1.5,
                fill: view.type === 'area',
                tension: .3,
                pointRadius: 2.5,
                yAxisID: onRight ? 'y1' : 'y',
            };
        });

        var chartType = view.type === 'pie' ? 'pie' : (view.type === 'bar' ? 'bar' : 'line');

        var tooltipCb = {
            title: function (items) {
                if (!items.length) return '';
                var idx = items[0].dataIndex;
                return String(data[idx] ? data[idx][xKey] : '');
            },
            label: function (ctxItem) {
                return ' ' + ctxItem.dataset.label + ': ' + formatValue(ctxItem.parsed && ctxItem.parsed.y != null ? ctxItem.parsed.y : ctxItem.raw);
            },
            afterBody: function (items) {
                if (!items.length) return [];
                var idx = items[0].dataIndex;
                var row = data[idx] || {};
                var lines = [];
                Object.keys(row).forEach(function (k) {
                    if (k === xKey) return;
                    if (k.indexOf('_') === 0) return;
                    if (view.series.indexOf(k) !== -1) return; // 系列已在 label 展示
                    lines.push(' ' + fieldLabel(k) + ': ' + formatValue(row[k]));
                });
                return lines;
            },
        };

        var chartConfig = {
            type: chartType,
            data: { labels: labels, datasets: datasets },
            // 挂载内置数据标签插件（柱/线/面积标数值，饼图标名称+占比）
            plugins: [dataLabelPlugin],
            options: {
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: 'nearest', intersect: false },
                layout: view.type === 'pie' ? {} : { padding: { top: 16 } },
                plugins: {
                    legend: {
                        display: datasets.length > 1 || view.type === 'pie',
                        position: 'bottom',
                        onClick: null,
                        labels: { color: tickColor, font: { size: 10 }, boxWidth: 10 },
                    },
                    tooltip: {
                        backgroundColor: isDark ? 'rgba(15,23,42,.95)' : 'rgba(255,255,255,.96)',
                        titleColor: isDark ? '#f1f5f9' : '#111827',
                        bodyColor: isDark ? '#cbd5e1' : '#374151',
                        borderColor: isDark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.1)',
                        borderWidth: 1,
                        callbacks: tooltipCb,
                    },
                    analysisDataLabels: { display: true },
                },
                scales: view.type === 'pie' ? {} : {
                    x: { ticks: { color: tickColor, font: { size: 10 }, maxRotation: 40, autoSkip: true }, grid: { display: false } },
                    y: {
                        beginAtZero: !yNeg, position: 'left',
                        title: { display: datasets.length > 1, text: series.filter(function (f) { return axisOf[f] === 'y'; }).map(fieldLabel).join(' / '), color: '#228547', font: { size: 9 } },
                        ticks: { color: tickColor, font: { size: 9 } }, grid: { color: gridColor },
                    },
                    y1: {
                        beginAtZero: !y1Neg, position: 'right', display: hasRight,
                        title: { display: hasRight, text: series.filter(function (f) { return axisOf[f] === 'y1'; }).map(fieldLabel).join(' / '), color: '#2563eb', font: { size: 9 } },
                        ticks: { color: tickColor, font: { size: 9 } }, grid: { drawOnChartArea: false },
                    },
                },
                onClick: function (evt, elements) {
                    if (evt.native) evt.native.stopPropagation();
                    if (elements && elements.length) {
                        var idx = elements[0].index;
                        var row = data[idx];
                        if (row) drillPoint(chart, row);
                    } else {
                        drillWhole(chart, '对整图继续下钻');
                    }
                },
                onHover: function (evt, elements) {
                    if (evt.native && evt.native.target) {
                        evt.native.target.style.cursor = (elements && elements.length) ? 'pointer' : 'default';
                    }
                },
            },
        };
        try {
            var chartInst = new Chart(ctx, chartConfig);
            chart._chart = chartInst;
            chartInstances.push(chartInst);
            chartSpecs.push(chart);
        } catch (e) {
            console.warn('[analysis] chart render error', e);
        }
    }

    function palette(n) {
        var base = ['#35A85B', '#3b82f6', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#64748b'];
        var out = [];
        for (var i = 0; i < n; i++) out.push(base[i % base.length]);
        return out;
    }

    function formatValue(v) {
        if (v == null) return '-';
        if (typeof v === 'number') {
            if (Math.abs(v) >= 100000000) return (v / 100000000).toFixed(2) + '亿';
            if (Math.abs(v) >= 10000) return (v / 10000).toFixed(1) + '万';
            return v.toLocaleString();
        }
        return String(v);
    }

    // 常见英文字段键 → 中文展示名（tooltip/图例/轴名/⚙菜单/表格表头/导出）。未命中保留原键。
    const FIELD_LABELS = {
        value: '数值', amount: '金额', total: '合计', sum: '合计', totalAmount: '金额合计',
        order: '订单数', orders: '订单数', orderCount: '订单数', billCount: '单据数',
        qty: '数量', quantity: '数量', count: '数量', num: '数量', qtyAll: '合计数量',
        rate: '占比', ratio: '占比', percent: '占比', proportion: '占比',
        mom: '环比', momGrowth: '环比', momRate: '环比', yoy: '同比', yoyGrowth: '同比',
        growth: '增长率', changeRate: '变动率', delta: '环比',
        allAmount: '含税合计', fAllAmount: '含税合计', amountFor: '应收金额',
    };

    // 字段名中文化：value→数值、order→订单数 等；未命中保留原键
    function fieldLabel(k) {
        if (k == null) return '';
        var s = String(k);
        if (Object.prototype.hasOwnProperty.call(FIELD_LABELS, s)) return FIELD_LABELS[s];
        return s;
    }

    // 一组原始字段键 → 中文列名（自动去重：两键映射到同一中文时后续加 _2/_3）
    function colLabels(cols) {
        var used = {};
        return cols.map(function (c) {
            var base = fieldLabel(c) || String(c);
            if (!used[base]) { used[base] = 1; return base; }
            var n = used[base] + 1;
            used[base] = n;
            return base + '_' + n;
        });
    }

    // 表格列头：首列(维度)优先用 dimensionLabel，其余列 fieldLabel 中文化，整表去重（多键→同中文加 _2）
    function buildTableCols(chart, rows) {
        var xKey = chart.xKey || 'name';
        var allCols = [];
        rows.forEach(function (r) {
            Object.keys(r).forEach(function (k) {
                if (k.indexOf('_') !== 0 && allCols.indexOf(k) === -1) allCols.push(k);
            });
        });
        var rawCols = [xKey].concat(allCols.filter(function (c) { return c !== xKey; }));
        var used = {};
        return rawCols.map(function (c) {
            var isDim = c === xKey;
            var base = isDim
                ? (chart.dimensionLabel || fieldLabel(c) || '维度')
                : (fieldLabel(c) || String(c));
            if (!used[base]) { used[base] = 1; return { key: c, label: base }; }
            var n = used[base] + 1;
            used[base] = n;
            return { key: c, label: base + '_' + n };
        });
    }

    // 感知扇区/柱背景亮度 → 返回适合的文字颜色（深底白字 / 浅底深字）
    function contrastTextColor(bg) {
        if (!bg) return '#374151';
        var m = String(bg).match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/);
        var r, g, b;
        if (m) { r = +m[1]; g = +m[2]; b = +m[3]; }
        else if (/^#/.test(bg)) {
            var hex = bg.slice(1); if (hex.length === 3) hex = hex.split('').map(function (x) { return x + x; }).join('');
            r = parseInt(hex.slice(0, 2), 16); g = parseInt(hex.slice(2, 4), 16); b = parseInt(hex.slice(4, 6), 16);
        } else { return '#374151'; }
        // 相对亮度 (0~1)
        var lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return lum > 0.55 ? '#1f2937' : '#ffffff';
    }

    // 内置轻量数据标签插件（无 CDN）。柱/线/面积标注主系列数值；饼图标注"名称 占比%"。
    // 避密：非饼图数据点 >12 时只标注 |值| 最大的 Top 8。
    var dataLabelPlugin = {
        id: 'analysisDataLabels',
        afterDatasetsDraw: function (chart, args, opts) {
            if (!chart || !chart.config) return;
            if (opts && opts.display === false) return; // 由 options.plugins.analysisDataLabels 控制开关
            var ctx = chart.ctx;
            if (!ctx) return;
            var area = chart.chartArea;
            if (!area || area.width <= 10) return;
            var ctype = chart.config.type;
            var meta0 = chart.getDatasetMeta ? chart.getDatasetMeta(0) : null;
            if (!meta0 || !meta0.data || !meta0.data.length) return;
            var ds0 = chart.data.datasets[0];
            if (!ds0) return;
            var labels = chart.data.labels || [];
            var isPie = ctype === 'pie';
            var maxShow = 12;
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '10px Inter, system-ui, -apple-system, sans-serif';

            if (isPie) {
                // 饼图：扇区中心标 "名称 占比%"
                var total = 0;
                (ds0.data || []).forEach(function (v) { if (typeof v === 'number') total += Math.abs(v); });
                meta0.data.forEach(function (el, i) {
                    if (!el || el.hidden) return;
                    var v = ds0.data[i];
                    if (v == null || !isFinite(v) || total === 0) return;
                    var pct = ((Math.abs(v) / total) * 100).toFixed(1);
                    var name = String(labels[i] != null ? labels[i] : '').slice(0, 8);
                    var text = (name ? name + ' ' : '') + pct + '%';
                    var mid = (el.startAngle + el.endAngle) / 2;
                    var rad = (el.innerRadius + el.outerRadius) / 2;
                    var x = el.x + Math.cos(mid) * rad;
                    var y = el.y + Math.sin(mid) * rad;
                    ctx.fillStyle = contrastTextColor(el.options && el.options.backgroundColor);
                    ctx.fillText(text, x, y);
                });
            } else {
                // 柱/线/面积：标注主系列(dataset 0)数值
                var dsAxisId = ds0.yAxisID || 'y';
                var yScale = chart.scales[dsAxisId] || chart.scales.y;
                if (!yScale) { ctx.restore(); return; }
                var visibleCount = labels.length;
                var showTop = visibleCount > maxShow ? 8 : visibleCount;
                var keepIdx = null;
                if (visibleCount > maxShow) {
                    var arr = [];
                    (ds0.data || []).forEach(function (v, i) {
                        arr.push({ i: i, a: (typeof v === 'number' && isFinite(v)) ? Math.abs(v) : -1 });
                    });
                    arr.sort(function (a, b) { return b.a - a.a; });
                    keepIdx = {};
                    for (var k = 0; k < Math.min(showTop, arr.length); k++) {
                        if (arr[k].a >= 0) keepIdx[arr[k].i] = true;
                    }
                }
                var dsColor = ds0.borderColor || ds0.backgroundColor || '#374151';
                var textColor = contrastTextColor(Array.isArray(dsColor) ? dsColor[0] : dsColor);
                // 数据点较多且非 Top8 内一律不画；折线/面积点元素 y 即点位置，柱元素取柱顶
                meta0.data.forEach(function (el, i) {
                    if (!el || el.hidden) return;
                    if (keepIdx && !keepIdx[i]) return;
                    var v = ds0.data[i];
                    if (v == null || !isFinite(v)) return;
                    var px = el.x;
                    var py = el.y;
                    if (ctype === 'bar' && el.$context && el.$context.raw != null) {
                        var raw = el.$context.raw;
                        py = yScale.getPixelForValue(raw);
                        // 正值标柱顶上方，负值标柱底下方
                        if (raw >= 0) { py = py - 3; ctx.textBaseline = 'bottom'; }
                        else { py = py + 3; ctx.textBaseline = 'top'; }
                    } else {
                        py = py - 3; ctx.textBaseline = 'bottom';
                    }
                    // 防截断：限制在图区垂直范围内
                    py = Math.max(area.top + 2, Math.min(py, area.bottom - 2));
                    ctx.fillStyle = textColor;
                    ctx.fillText(formatValue(v), px, py);
                });
            }
            ctx.restore();
        },
    };

    /* =====================================================================
     * Excel 导出（前端 SheetJS，与项目 web 端一致）
     * ===================================================================== */

    // 把单个 chart.data 转成二维数组（含表头）；过滤 _ 前缀内部隐藏字段，表头中文化+去重
    function chartDataToAoa(chart) {
        const data = chart.data || [];
        if (!Array.isArray(data) || data.length === 0) return [[]];
        const cols = Object.keys(data[0] || {}).filter(function (c) { return c.indexOf('_') !== 0; });
        if (cols.length === 0) return [[]];
        const header = colLabels(cols);
        const rows = [header];
        data.forEach(function (r) {
            rows.push(cols.map(function (c) { return r[c]; }));
        });
        return rows;
    }

    function safeSheetName(name) {
        // SheetJS 不支持某些字符（: \ / ? * [ ]），且长度受限
        let s = String(name || 'Sheet').replace(/[:\\/?*\[\]]/g, '_').slice(0, 28);
        return s || 'Sheet';
    }

    function ensureXlsx(cb) {
        if (typeof XLSX !== 'undefined') { cb(); return; }
        // 兜底：动态加载本地 vendor 库
        const script = document.createElement('script');
        script.src = 'assets/vendor/xlsx/xlsx.full.min.js';
        script.onload = cb;
        script.onerror = function () { toast('Excel 导出库未加载，请刷新页面后重试', 'error'); };
        document.head.appendChild(script);
    }

    function downloadWorkbook(wb, fileName) {
        try {
            XLSX.writeFile(wb, fileName);
        } catch (e) {
            try {
                const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = fileName;
                document.body.appendChild(a); a.click();
                setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 100);
            } catch (e2) {
                toast('导出失败，请重试', 'error');
            }
        }
    }

    // 单图导出 Excel
    function exportChartToExcel(chart) {
        ensureXlsx(function () {
            const wb = XLSX.utils.book_new();
            const aoa = chartDataToAoa(chart);
            const ws = XLSX.utils.aoa_to_sheet(aoa);
            // 数值列加宽，便于阅读
            if (aoa.length > 0) {
                ws['!cols'] = aoa[0].map(function () { return { wch: 18 }; });
            }
            XLSX.utils.book_append_sheet(wb, ws, safeSheetName(chart.title || '图表数据'));
            const dateStr = new Date().toISOString().slice(0, 10);
            downloadWorkbook(wb, (chart.title || '图表数据') + '_' + dateStr + '.xlsx');
            toast('图表数据已导出为 Excel');
        });
    }

    // 看板整体导出 Excel（每个图表一个 sheet）
    function exportDashboard() {
        const charts = state.charts || [];
        if (charts.length === 0) {
            toast('当前看板没有可导出的图表', 'error');
            return;
        }
        ensureXlsx(function () {
            const wb = XLSX.utils.book_new();
            const seenNames = {};
            charts.forEach(function (chart) {
                const aoa = chartDataToAoa(chart);
                if (aoa.length <= 1) return;  // 无数据图表跳过
                let sheetName = safeSheetName(chart.title || '图表数据');
                // 避免重名 sheet
                if (seenNames[sheetName]) {
                    let n = 2;
                    while (seenNames[sheetName + '_' + n]) n++;
                    sheetName = sheetName + '_' + n;
                }
                seenNames[sheetName] = true;
                const ws = XLSX.utils.aoa_to_sheet(aoa);
                ws['!cols'] = aoa[0].map(function () { return { wch: 18 }; });
                XLSX.utils.book_append_sheet(wb, ws, sheetName);
            });
            if (wb.SheetNames.length === 0) {
                toast('看板没有可导出的数据', 'error');
                return;
            }
            const dateStr = new Date().toISOString().slice(0, 10);
            const title = qs('#boardTitle').textContent || '金蝶看板';
            downloadWorkbook(wb, title + '_' + dateStr + '.xlsx');
            toast('看板数据已导出为 Excel');
        });
    }

    /* =====================================================================
     * 建议面板
     * ===================================================================== */

    function renderSuggestions(suggestions) {
        const container = qs('#suggestionCards');
        container.innerHTML = '';
        suggestions.slice(0, 4).forEach(function (s, i) {
            const card = document.createElement('div');
            card.className = 'sug-card bg-white dark:bg-neutral-900 border border-primary-500/30 rounded-xl px-4 py-3 min-w-[220px] shrink-0 fade-in';
            card.innerHTML = '<div class="text-[12px] text-primary-500 mb-1">💡 建议</div>'
                + '<div class="text-[12px] leading-snug">' + escapeHtml(s.title || '') + '</div>'
                + '<div class="flex items-center gap-2 mt-2">'
                + '<button class="sug-exec text-[10px] text-primary-500 border border-primary-500/40 rounded px-1.5 py-0.5 cursor-pointer">分析</button>'
                + '<button class="sug-like text-[10px] text-neutral-400 hover:text-emerald-500 cursor-pointer">👍</button>'
                + '<button class="sug-ignore text-[10px] text-neutral-400 hover:text-red-500 cursor-pointer">忽略</button>'
                + '</div>';
            card.querySelector('.sug-exec').addEventListener('click', function () {
                const prompt = s.prompt || s.title;
                addUserMsg('💡 ' + prompt);
                state.pendingOp = { type: 'suggestion', title: (s.title || '建议分析').slice(0, 12) };
                sendChatToAgent(prompt, false);
            });
            card.querySelector('.sug-like').addEventListener('click', function () {
                toast('已记录采纳反馈');
            });
            card.querySelector('.sug-ignore').addEventListener('click', function () {
                card.remove();
                toast('已忽略该建议');
            });
            container.appendChild(card);
        });
    }

    function toggleSuggestionPanel() {
        const cards = qs('#suggestionCards');
        const btn = qs('#sugToggleBtn');
        const hidden = cards.classList.contains('hidden');
        cards.classList.toggle('hidden', !hidden);
        btn.textContent = hidden ? '收起 ▾' : '展开 ▸';
    }

    /* =====================================================================
     * 图表联动下钻：定点下钻(数据点/表格行) vs 整图下钻(图表空白/KPI)
     * ===================================================================== */

    // 时间口径：以图表原 analysis_meta.time_range 为准（保证与图数据可比一致）；
    // 无 meta（旧数据/自由对话图）→ 用前端当前所选时间范围回退。
    function drillTimeCtx(chart) {
        if (chart && chart.analysis_meta && chart.analysis_meta.time_range) {
            return chart.analysis_meta.time_range;
        }
        computeTimeRange(state.timePreset);
        if (state.timeStart && state.timeEnd) {
            return state.timeStart + ' ~ ' + state.timeEnd;
        }
        return '';
    }

    // 定点下钻：点击图表内某根柱子/扇区/折线点/表格行 → 针对该对象下钻
    function drillPoint(chart, row) {
        const dim = chart.dimensionLabel || '该维度';
        const val = row ? (row[chart.xKey || 'name'] != null ? row[chart.xKey || 'name'] : row.name) : '';
        const range = drillTimeCtx(chart);
        const meta = chart.analysis_meta;
        // 附带隐藏内部标识（如 _custId），帮助 agent 精确定位到对象
        const idHint = row ? Object.keys(row).filter(k => k.indexOf('_') === 0)
            .map(k => k + '=' + row[k]).join(' ') : '';
        let prompt = '我在数据分析看板图表「' + (chart.title || '') + '」中点击了「'
            + dim + ': ' + val + '」。请针对该' + dim + '做定点下钻分析（深入拆解其订单构成/产品分布/业务员明细/异常归因等）。';
        if (meta) {
            prompt += '\n该图口径 analysis_meta：' + JSON.stringify(meta, null, 0);
        }
        if (range) {
            prompt += '\n时间范围（以该图口径为准）：' + range;
        }
        if (idHint) {
            prompt += '\n内部标识（用于精确定位）：' + idHint;
        }
        addUserMsg('🔍 点击「' + dim + ': ' + val + '」定点下钻');
        state.pendingOp = { type: 'drill', title: (dim + ':' + val).slice(0, 12) };
        sendChatToAgent(prompt, false);
    }

    // 整图下钻：点击图表空白 / KPI 卡 → 围绕整图继续深入分析
    function drillWhole(chart, hint) {
        const range = drillTimeCtx(chart);
        const meta = chart.analysis_meta;
        let prompt = '请针对图表「' + (chart.title || '') + '」继续下钻分析，给出更深入的维度拆解和洞察。';
        if (hint) prompt += '\n分析方向：' + hint;
        if (meta) {
            prompt += '\n该图口径 analysis_meta：' + JSON.stringify(meta, null, 0);
        }
        if (range) {
            prompt += '\n时间范围（以该图口径为准）：' + range;
        }
        addUserMsg('🔍 点击图表「' + (chart.title || '') + '」继续下钻');
        state.pendingOp = { type: 'drill', title: ((chart.title || '下钻') + ' 下钻').slice(0, 12) };
        sendChatToAgent(prompt, false);
    }

    /* =====================================================================
     * 模板切换 / 清空会话
     * ===================================================================== */

    // 收起对话栏 → 看板几乎占满全屏（Chart.resize 适配）
    function collapseChat() {
        if (!els.chatPanel) return;
        els.chatPanel.classList.add('hidden');
        if (els.expandChatBtn) els.expandChatBtn.classList.remove('hidden');
        resizeAllCharts();
    }

    // 展开对话栏 → 恢复双栏
    function expandChat() {
        if (!els.chatPanel) return;
        els.chatPanel.classList.remove('hidden');
        if (els.expandChatBtn) els.expandChatBtn.classList.add('hidden');
        resizeAllCharts();
    }

    // 列数切换：只作用于图表网格；KPI 独立排不受影响；偏好存 localStorage
    function applyBoardCols(n) {
        n = n === 2 ? 2 : 1;
        state.boardCols = n;
        var g = els.chartGrid;
        if (g) g.className = 'grid gap-5 ' + (n === 2 ? 'grid-cols-2' : 'grid-cols-1');
        [1, 2].forEach(function (i) {
            var b = qs('#colBtn' + i);
            if (b) b.classList.toggle('active', i === n);
        });
    }

    function setBoardCols(n) {
        applyBoardCols(n);
        try { localStorage.setItem('analysis_board_cols', String(n)); } catch (_) {}
        resizeAllCharts();
    }

    function resizeAllCharts() {
        chartInstances.forEach(function (c) { try { c.resize(); } catch (_) {} });
    }

    function showTemplatePicker(show) {
        const showAll = show === undefined ? true : show;
        els.templatePicker.classList.toggle('hidden', !showAll);
        els.dashboardArea.classList.toggle('hidden', showAll);
    }

    function clearSession() {
        if (!confirm('确定要清空当前会话和看板吗？将同时清空对话历史，且不可恢复。')) return;
        var uid = state.userid || 'anon';
        state.sessionId = analysisNewSessionId(uid);
        try { localStorage.setItem(analysisSessionKey(uid), state.sessionId); } catch (_) {}
        els.chatStream.innerHTML = '';
        clearDashboard();
        qs('#dashboardArea').classList.add('hidden');
        qs('#suggestionPanel').classList.add('hidden');
        qs('#currentTemplateLabel').textContent = '选择模板';
        els.templatePicker.classList.remove('hidden');
        state.boardCount = 0;
        addAiMsg('已清空当前会话与看板，你可以重新选择模板或直接对话开始新的分析。');
    }

    /* =====================================================================
     * 历史会话恢复
     * ===================================================================== */

    async function restoreHistory() {
        if (!state.sessionId) return;
        try {
            const res = await api(API.history + '?session_id=' + encodeURIComponent(state.sessionId) + '&page=1&page_size=50');
            if (res.status !== 'success' || !res.history || !res.history.messages) return;
            const messages = res.history.messages || [];
            // 重建对话 + 看板
            messages.forEach(function (m) {
                if (m.role === 'user') {
                    addUserMsg(m.content || '');
                } else if (m.role === 'assistant') {
                    if (m.content && m.content.trim()) addAiMsg(escapeHtml(m.content));
                    // 从 tool_calls 提取 render_dashboard 的 ChartSpec 重建看板
                    (m.tool_calls || []).forEach(function (tc) {
                        if (tc.name === 'render_dashboard') {
                            const spec = parseChartSpec(tc.result);
                            if (spec) renderChartSpec(spec, true);
                        }
                    });
                }
            });
        } catch (e) {
            console.warn('[analysis] restore history failed', e);
        }
    }

    /* =====================================================================
     * 启动
     * ===================================================================== */

    document.addEventListener('DOMContentLoaded', function () {
        els.chatStream = qs('#chatStream');
        els.templatePicker = qs('#templatePicker');
        els.dashboardArea = qs('#dashboardArea');
        els.kpiGrid = qs('#kpiGrid');
        els.chartGrid = qs('#chartGrid');
        els.suggestionPanel = qs('#suggestionPanel');
        els.chatPanel = qs('#chatPanel');
        els.expandChatBtn = qs('#expandChatBtn');
        // 初始化时间范围（默认本月）+ 绑定自定义日期变化
        onTimePresetChange();
        qs('#timeStart').addEventListener('change', onTimeInputChange);
        qs('#timeEnd').addEventListener('change', onTimeInputChange);
        // 恢复列数偏好 + 高亮
        var savedCols = parseInt(localStorage.getItem('analysis_board_cols') || '1', 10);
        if (savedCols === 2 || savedCols === 1) state.boardCols = savedCols;
        applyBoardCols(state.boardCols);
        // 先检查认证，通过后才加载数据分析页
        initAuth();
    });

    // 认证检查：普通浏览器未认证 → 显示密码登录框；企微浏览器未认证 → 跳 OAuth
    function initAuth() {
        fetch('/auth/check', { credentials: 'include' })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.auth_required && !data.authenticated) {
                    // 企微浏览器 → 跳 OAuth 免密登录
                    var ua = navigator.userAgent || '';
                    if (window.COW_WECOM_CONFIGURED && (ua.indexOf('wxwork') !== -1 || ua.indexOf('MicroMessenger') !== -1)) {
                        window.location.replace('/auth/wecom/start?target=analysis');
                        return;
                    }
                    // 普通浏览器 → 显示密码登录框
                    showLoginScreen();
                    return;
                }
                // 已认证（密码或企微）→ 正常初始化
                init();
            })
            .catch(function () {
                // 网络异常等：尝试直接初始化（后端可能未启用密码）
                init();
            });
    }

    // 密码登录框
    function showLoginScreen() {
        var overlay = qs('#login-overlay');
        if (!overlay) return;
        overlay.classList.remove('hidden');
        qs('#app').classList.add('hidden');
        var form = qs('#login-form');
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var pwd = qs('#login-password').value;
            fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: pwd }),
                credentials: 'include',
            })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.status === 'success') {
                    overlay.classList.add('hidden');
                    qs('#app').classList.remove('hidden');
                    init();
                } else {
                    qs('#login-error').classList.remove('hidden');
                }
            })
            .catch(function () {
                qs('#login-error').classList.remove('hidden');
            });
        });
    }

    // 暴露到全局
    window.analysis = {
        sendChat: sendChat,
        showTemplatePicker: showTemplatePicker,
        clearSession: clearSession,
        toggleSuggestionPanel: toggleSuggestionPanel,
        exportDashboard: exportDashboard,
        dismissDoneModal: dismissDoneModal,
        onTimePresetChange: onTimePresetChange,
        onTimeInputChange: onTimeInputChange,
        collapseChat: collapseChat,
        expandChat: expandChat,
        setBoardCols: setBoardCols,
    };
})();
