/* 金蝶看板 / 转换统计 / 逾期统计 / 项目管理 视图逻辑。
   提取自重构前的 console.js（上游把 console.js 拆成 core/chat/views 后保留）。
   与 core/ 及既有 views/ 共享同一全局作用域，故命名一律以 _kanban/_overdue/
   projects 前缀区分，避免与上游模块的顶层声明冲突。 */

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
