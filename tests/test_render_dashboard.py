# encoding:utf-8
"""render_dashboard 工具测试：ChartSpec 规范化、类型校验、降级逻辑。"""

import json

from agent.tools.analysis.render_dashboard import (
    RenderDashboard,
    _validate_chart,
    SUPPORTED_TYPES,
)


def test_supported_types_include_core_charts():
    assert {"line", "bar", "pie", "area", "kpi", "table"} <= SUPPORTED_TYPES


# ---------- _validate_chart ----------

def test_valid_bar_chart_passes():
    chart = {"type": "bar", "data": [{"name": "A", "value": 100}]}
    ok, fallback = _validate_chart(chart)
    assert ok is True
    assert fallback is None


def test_unknown_type_falls_back_to_table():
    chart = {"type": "scatter3d", "data": [{"name": "A", "value": 1}]}
    ok, fallback = _validate_chart(chart)
    assert ok is False
    assert fallback == "table"


def test_empty_data_returns_none_fallback():
    chart = {"type": "bar", "data": []}
    ok, fallback = _validate_chart(chart)
    assert ok is False
    assert fallback is None


def test_missing_numeric_field_falls_back_to_table():
    chart = {"type": "pie", "data": [{"name": "A", "note": "文本"}]}
    ok, fallback = _validate_chart(chart)
    assert ok is False
    assert fallback == "table"


def test_kpi_and_table_skip_numeric_check():
    kpi = {"type": "kpi", "data": [{"value": 123}]}
    assert _validate_chart(kpi)[0] is True
    table = {"type": "table", "data": [{"a": 1, "b": "x"}]}
    assert _validate_chart(table)[0] is True


# ---------- execute ----------

def test_execute_normalizes_valid_charts():
    tool = RenderDashboard()
    result = tool.execute({
        "dashboard_title": "测试看板",
        "append_to_board": False,
        "charts": [
            {"type": "bar", "title": "排行", "data": [{"name": "A", "value": 10}]},
            {"type": "pie", "title": "占比", "data": [{"name": "B", "value": 20}]},
        ],
    })
    assert result.status == "success"
    spec = json.loads(result.result)
    assert spec["append_to_board"] is False
    assert len(spec["charts"]) == 2


def test_execute_degrades_unknown_type_to_table():
    tool = RenderDashboard()
    result = tool.execute({
        "append_to_board": True,
        "charts": [
            {"type": "scatter", "title": "坏图", "data": [{"name": "A", "value": 5}]}
        ],
    })
    spec = json.loads(result.result)
    assert spec["charts"][0]["type"] == "table"
    assert spec["charts"][0].get("_note")


def test_execute_skips_empty_charts():
    tool = RenderDashboard()
    result = tool.execute({
        "append_to_board": True,
        "charts": [{"type": "line", "title": "空", "data": []}],
    })
    spec = json.loads(result.result)
    assert spec["charts"] == []


def test_execute_preserves_suggestions_and_no_data_message():
    tool = RenderDashboard()
    result = tool.execute({
        "append_to_board": True,
        "charts": [],
        "suggestions": [{"title": "建议一", "prompt": "继续分析"}],
        "no_data_message": "暂无数据",
    })
    spec = json.loads(result.result)
    assert spec["suggestions"][0]["title"] == "建议一"
    assert spec["no_data_message"] == "暂无数据"


def test_execute_handles_invalid_params():
    tool = RenderDashboard()
    result = tool.execute({})  # 无 charts
    assert result.status == "success"
    spec = json.loads(result.result)
    assert spec["charts"] == []


# ---------- v2 多字段契约透传 ----------

def test_execute_preserves_multi_field_data_points():
    """v2：数据点携带伴随指标字段（数量/占比/环比等）应原样透传给前端。"""
    tool = RenderDashboard()
    chart = {
        "type": "bar",
        "title": "客户销售排行",
        "dimensionLabel": "客户",
        "xKey": "name",
        "yKey": "value",
        "analysis_meta": {
            "metric": "销售额=已审核订单含税合计",
            "dimension": "客户",
            "time_range": "2026-02-01 ~ 2026-02-28",
            "drill_candidates": ["订单构成", "产品分布"],
        },
        "data": [
            {"name": "华东客户A", "value": 12860000, "订单数": 86, "数量": 15200,
             "占比": "22.6%", "环比": "+12.4%", "_custId": "C001"},
            {"name": "华南客户B", "value": 11240000, "订单数": 71, "数量": 13100,
             "占比": "19.8%", "环比": "+3.2%", "_custId": "C002"},
        ],
    }
    result = tool.execute({"append_to_board": True, "charts": [chart]})
    assert result.status == "success"
    spec = json.loads(result.result)
    out = spec["charts"][0]
    assert out["dimensionLabel"] == "客户"
    assert out["analysis_meta"]["metric"].startswith("销售额")
    # 伴随字段原样保留
    assert out["data"][0]["订单数"] == 86
    assert out["data"][0]["占比"] == "22.6%"
    assert out["data"][0]["环比"] == "+12.4%"
    # 隐藏字段保留（供精确定位），不被工具吞掉
    assert out["data"][0]["_custId"] == "C001"


def test_execute_keeps_kpi_and_table_unchanged():
    """v2：KPI / table 类型不因多字段而误降级。"""
    tool = RenderDashboard()
    result = tool.execute({
        "append_to_board": False,
        "charts": [
            {"type": "kpi", "title": "本月销售额", "data": [{"value": 12860000, "delta": 12.4}]},
            {"type": "table", "title": "明细", "data": [{"客户": "A", "金额": 100, "备注": "含税"}]},
        ],
    })
    assert result.status == "success"
    spec = json.loads(result.result)
    assert spec["charts"][0]["type"] == "kpi"
    assert spec["charts"][1]["type"] == "table"


def test_execute_table_does_not_drop_non_numeric_columns():
    """v2：table 类型多列（含字符串列）应全保留，不受数值校验影响。"""
    tool = RenderDashboard()
    result = tool.execute({
        "append_to_board": True,
        "charts": [{
            "type": "table", "title": "逾期清单",
            "data": [{"客户": "A", "逾期天数": 45, "金额": 80000, "状态": "已到期"}],
        }],
    })
    assert result.status == "success"
    spec = json.loads(result.result)
    row = spec["charts"][0]["data"][0]
    assert row["客户"] == "A" and row["状态"] == "已到期"
    assert row["逾期天数"] == 45


def test_execute_empty_charts_with_no_data_message():
    """v2：空 charts + no_data_message 原样透传（前端据此不建标签页、对话区高亮）。"""
    tool = RenderDashboard()
    result = tool.execute({
        "append_to_board": True,
        "charts": [],
        "no_data_message": "您没有「采购单」表单(PUR_PurchaseOrder)的访问权限，或该维度暂无数据",
    })
    assert result.status == "success"
    spec = json.loads(result.result)
    assert spec["charts"] == []
    assert "PUR_PurchaseOrder" in spec["no_data_message"]
