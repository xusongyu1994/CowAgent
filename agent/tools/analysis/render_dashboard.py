#!/usr/bin/env python3
# -*- coding=utf-8 -*-
"""金蝶数据分析 · 看板渲染工具

agent 在金蝶查询后调用本工具，将聚合后的数据组织成标准 ChartSpec JSON，
前端（analysis.js）从工具结果（tool_result）中提取并渲染看板图表。

设计（与方案 §6.4 一致）：
  - 本工具**不做金蝶查询**，只负责把 agent 传入的数据规范化为 ChartSpec
  - agent 先用 query_bill_json 等金蝶工具查数据并聚合，再调用本工具输出
  - append_to_board=false → 模板初始看板（多图表，重建看板）
  - append_to_board=true  → 动态下钻/对话（单图表，追加）
"""

import json
import logging

from agent.tools.base_tool import BaseTool, ToolResult

logger = logging.getLogger(__name__)

# 支持的图表类型
SUPPORTED_TYPES = {"line", "bar", "pie", "area", "kpi", "table"}


def _validate_chart(chart: dict) -> tuple:
    """校验单个图表是否可用。返回 (ok, fallback_type_or_none)。"""
    ctype = chart.get("type", "")
    if ctype not in SUPPORTED_TYPES:
        return False, "table"          # 未知类型降级为表格
    data = chart.get("data")
    if not isinstance(data, list) or len(data) == 0:
        return False, None             # 空数据 → 前端空状态
    if ctype in ("line", "bar", "pie", "area"):
        y_key = chart.get("yKey") or "value"
        if not any(isinstance(d.get(y_key), (int, float)) for d in data if isinstance(d, dict)):
            return False, "table"      # 缺数值字段降级为表格
    return True, None


class RenderDashboard(BaseTool):
    """输出规范化的金蝶看板 ChartSpec JSON（前端据此渲染）。"""

    name: str = "render_dashboard"
    description: str = (
        "把已聚合的金蝶数据分析结果组织成看板图表（ChartSpec JSON），供前端渲染。"
        "调用前请先用 query_bill_json/query_bill_all 等金蝶工具查询数据并按维度聚合。"
        "参数 charts 中的每个元素含 type(折线line/柱状bar/饼图pie/面积area/KPI卡kpi/表格table)、"
        "title(标题)、data(数据数组)、xKey/yKey(维度/数值字段)。"
        "data 中每个数据点除 xKey/yKey 外，可携带该维度的伴随指标字段（如订单数/数量/占比/环比），"
        "前端会展示在悬浮提示与明细表格中；每张图可另带 dimensionLabel（数据点维度名，如客户/产品线），"
        "供用户点击数据点时定点下钻；还可带 analysis_meta（口径/维度/时间范围/可下钻方向）供下钻定位。"
        "_ 前缀的键为内部隐藏字段（如 _custId），前端不展示但可参与精确下钻。"
        "量化指标必须是数值（可参与多系列/排序）；占比/环比/同比等百分比用带%的字符串（仅展示）。"
        "模板初始看板请用 append_to_board=false；下钻/对话新增图表用 append_to_board=true。"
    )
    params: dict = {
        "type": "object",
        "properties": {
            "dashboard_title": {"type": "string", "description": "看板标题"},
            "append_to_board": {
                "type": "boolean",
                "description": "false=重建整个看板(模板初始)，true=追加新图表(下钻/对话)",
                "default": True,
            },
            "charts": {
                "type": "array",
                "description": "图表数组，每个含 type/title/data/xKey/yKey",
                "items": {"type": "object"},
            },
            "suggestions": {
                "type": "array",
                "description": "可选的下一步分析建议，每个含 title(建议标题)/prompt(点击后发送的指令)",
                "items": {"type": "object"},
            },
            "no_data_message": {
                "type": "string",
                "description": "无数据/无权限时填写的提示文案（charts 可为空数组）",
            },
        },
        "required": ["charts"],
    }

    def execute(self, params: dict) -> ToolResult:
        try:
            charts = params.get("charts") or []
            # 规范化每个图表
            normalized = []
            for chart in charts:
                if not isinstance(chart, dict):
                    continue
                ok, fallback = _validate_chart(chart)
                c = dict(chart)
                if not ok:
                    if fallback == "table":
                        c["type"] = "table"
                        c["_note"] = "该数据无法绘制为图表，已降级为表格展示"
                    else:
                        continue  # 空数据图表跳过（前端显示空状态）
                normalized.append(c)

            spec = {
                "dashboard_title": params.get("dashboard_title", ""),
                "append_to_board": bool(params.get("append_to_board", True)),
                "charts": normalized,
            }
            if params.get("suggestions"):
                spec["suggestions"] = params["suggestions"]
            if params.get("no_data_message"):
                spec["no_data_message"] = params["no_data_message"]

            return ToolResult.success(
                json.dumps(spec, ensure_ascii=False),
                ext_data=spec,
            )
        except Exception as e:
            logger.error(f"[RenderDashboard] error: {e}")
            return ToolResult.fail(f"生成看板失败: {e}")
