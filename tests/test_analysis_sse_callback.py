# encoding:utf-8
"""验证 _make_sse_callback 能把 render_dashboard 工具结果推送到 SSE。

这是"选模板后图表不生成"的关键修复点：
后端 agent 调用 render_dashboard 返回 ChartSpec，但原逻辑在
tool_execution_end 用 `pass` 丢弃了结果，前端收不到 ChartSpec。
本测试确认修复后结果能通过 publish 推送到前端。
"""

import threading

import pytest

from channel.web import web_channel as wc


class _FakeStreamState:
    """模拟 SSEStreamState，仅用于让 _make_sse_callback 通过存在性检查。"""

    def __init__(self):
        self.condition = threading.Condition()
        self.events = []
        self.retired = False


def _make_channel(monkeypatch, request_id):
    """构造一个 WebChannel 实例，mock sse_streams 和 _publish_sse_event。"""
    channel = wc.WebChannel()
    state = _FakeStreamState()
    channel.sse_streams = {request_id: state}
    published = []

    def fake_publish(request_id_, item):
        published.append(item)
        state.events.append({"seq": len(state.events), **item})
        return True

    monkeypatch.setattr(channel, "_publish_sse_event", fake_publish)
    return channel, state, published


def test_render_dashboard_result_is_published(monkeypatch):
    request_id = "req-1"
    channel, state, published = _make_channel(monkeypatch, request_id)
    cb = channel._make_sse_callback(request_id)

    chart_spec = {
        "dashboard_title": "销售经营日报",
        "append_to_board": False,
        "charts": [{"type": "bar", "title": "排行", "data": [{"name": "A", "value": 1}]}],
    }
    cb({
        "type": "tool_execution_end",
        "data": {
            "tool_name": "render_dashboard",
            "result": __import__("json").dumps(chart_spec),
        },
    })

    end_events = [e for e in published if e["type"] == "tool_execution_end"]
    assert len(end_events) == 1
    assert end_events[0]["tool_name"] == "render_dashboard"
    assert "charts" in end_events[0]["result"]  # ChartSpec JSON 已推送


def test_non_render_dashboard_tool_not_published(monkeypatch):
    request_id = "req-2"
    channel, state, published = _make_channel(monkeypatch, request_id)
    cb = channel._make_sse_callback(request_id)

    cb({
        "type": "tool_execution_end",
        "data": {"tool_name": "query_bill_all", "result": "{}"},
    })

    end_events = [e for e in published if e["type"] == "tool_execution_end"]
    assert end_events == []  # 普通工具结果不推送


def test_message_end_with_tool_calls_uses_publish_not_q(monkeypatch):
    """修复 name 'q' is not defined：message_end 有工具调用时改用 publish。"""
    request_id = "req-3"
    channel, state, published = _make_channel(monkeypatch, request_id)
    cb = channel._make_sse_callback(request_id)

    # 模拟有工具调用的 message_end → 不应因 'q' 未定义而崩溃
    cb({
        "type": "message_end",
        "data": {"tool_calls": [{"name": "render_dashboard"}]},
    })

    # 推送了 message_end 事件（而非崩溃）
    assert any(e["type"] == "message_end" for e in published)
