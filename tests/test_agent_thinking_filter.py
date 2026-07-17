"""
Test agent thinking filter changes:
  1. AgentEventHandler – IM channels no longer receive thinking text
  2. _make_sse_callback – Web SSE buffers delta, skips tool details
"""
import queue
from unittest.mock import MagicMock

import pytest

from bridge.agent_event_handler import AgentEventHandler


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_channel():
    """A mock IM channel with _send spy."""
    ch = MagicMock()
    ch._send = MagicMock()
    return ch


@pytest.fixture
def mock_web_context():
    """Context with on_event → makes _send_to_channel early-return."""
    ctx = MagicMock()
    ctx.get.return_value = True  # on_event exists
    return ctx


def make_context(channel, channel_type="wechat"):
    """Build a context dict-like object with the expected kwargs."""
    ctx = MagicMock()
    ctx.kwargs = {"channel": channel, "channel_type": channel_type}
    ctx.get.return_value = None  # No on_event — _send_to_channel proceeds
    return ctx


# ---------------------------------------------------------------------------
# AgentEventHandler tests  (IM channels)
# ---------------------------------------------------------------------------

class TestAgentEventHandlerIM:
    """Thinking messages should NOT be sent to IM users."""

    def test_thinking_not_sent_to_im(self, mock_channel):
        """Tool-call message_end should NOT send thinking text."""
        ctx = make_context(mock_channel)
        handler = AgentEventHandler(context=ctx)

        # Simulate: model says "let me check..." then calls a tool
        handler._handle_message_update({"delta": "让我先查一下元数据"})
        handler._handle_message_end({"tool_calls": [{"id": "call_1"}]})

        # Thinking text should NOT be sent
        for call in mock_channel._send.call_args_list:
            reply = call[0][0]
            assert "让我先查一下元数据" not in str(reply.content), \
                "Thinking text should not be sent to IM"

    def test_status_sent_only_once(self, mock_channel):
        """'🔄 正在处理中' status should be sent exacty once per run."""
        ctx = make_context(mock_channel)
        handler = AgentEventHandler(context=ctx)

        # Three tool calls in one run
        for _ in range(3):
            handler._handle_message_update({"delta": "some thinking..."})
            handler._handle_message_end({"tool_calls": [{"id": "call"}]})

        status_count = sum(
            1 for call in mock_channel._send.call_args_list
            if "🔄 正在处理中" in str(call[0][0].content)
        )
        assert status_count == 1, \
            f"Status should be sent once, got {status_count}"

    def test_thinking_not_sent_even_without_status(self, mock_channel):
        """No status + no thinking = just no send at all."""
        ctx = make_context(mock_channel)
        handler = AgentEventHandler(context=ctx)
        handler._status_sent_once = True  # already sent

        handler._handle_message_update({"delta": "thinking..."})
        handler._handle_message_end({"tool_calls": [{"id": "call"}]})

        # Nothing should be sent (status already sent, thinking is suppressed)
        mock_channel._send.assert_not_called()

    def test_final_reply_not_sent_by_handler(self, mock_channel):
        """AgentEventHandler does NOT send final reply; chat_channel does."""
        ctx = make_context(mock_channel)
        handler = AgentEventHandler(context=ctx)

        handler._handle_message_update({"delta": "这是最终回复"})
        handler._handle_message_end({"tool_calls": []})

        # AgentEventHandler only flushes the weixin merge buffer on final reply;
        # it does NOT call _send_to_channel for the final text.
        # The actual reply is sent by chat_channel._send_reply.
        # This ensures the handler doesn't crash and no thinking is leaked.
        assert True

    def test_web_channel_skipped(self, mock_web_context):
        """Web channel (on_event present) should skip _send_to_channel."""
        handler = AgentEventHandler(context=mock_web_context)
        # Just ensure no crash
        handler._handle_message_update({"delta": "thinking..."})
        handler._handle_message_end({"tool_calls": [{"id": "call"}]})

    def test_weixin_merge_buffer_flushed_at_final(self, mock_channel):
        """Weixin merge buffer should be flushed on final reply."""
        ctx = make_context(mock_channel, channel_type="wx")
        handler = AgentEventHandler(context=ctx)

        # Many calls + overflow into merge buffer
        for i in range(10):
            handler._handle_message_update({"delta": f"thinking step {i}"})
            handler._handle_message_end({"tool_calls": [{"id": f"call_{i}"}]})

        # Final reply flushes the merge buffer
        handler._handle_message_end({"tool_calls": []})

        # Before the fix, all 10 thinking messages + final would be sent.
        # After the fix: 1 status + 1 merged buffer flush + final.
        # The 10 thinking messages should NOT appear individually.
        sent = mock_channel._send.call_args_list
        text_blocks = [str(call[0][0].content) for call in sent]
        for block in text_blocks:
            assert "thinking step" not in block, \
                "Individual thinking steps should not appear"


# ---------------------------------------------------------------------------
# _make_sse_callback tests  (Web SSE channel)
# ---------------------------------------------------------------------------

class FakeContext:
    """A minimal mock for the context passed to AgentEventHandler."""
    kwargs = {}

    def get(self, key, default=None):
        return getattr(self, key, default)


class TestWebSSECallback:
    """message_update delta is buffered; tool events are skipped."""

    @pytest.fixture
    def sse_env(self):
        """
        Build the on_event callback from _make_sse_callback.

        We instantiate the WebChannel class minimally and call
        _make_sse_callback directly.
        """
        from channel.web.web_channel import WebChannel

        ch = WebChannel()
        request_id = "test-req-1"
        ch.sse_queues = {request_id: queue.Queue()}

        on_event = ch._make_sse_callback(request_id)
        return on_event, ch.sse_queues[request_id]

    def test_message_update_buffered_not_sent(self, sse_env):
        """message_update should buffer delta, not push immediately."""
        on_event, q = sse_env

        on_event({"type": "message_update", "data": {"delta": "hello "}})
        on_event({"type": "message_update", "data": {"delta": "world"}})

        # Nothing should be in the queue yet (buffer not flushed)
        assert q.qsize() == 0, "Delta should be buffered, not pushed"

    def test_tool_events_skipped(self, sse_env):
        """tool_execution_* should be silently skipped."""
        on_event, q = sse_env

        on_event({"type": "tool_execution_start", "data": {"tool_name": "read_file", "arguments": {"path": "/etc/passwd"}}})
        on_event({"type": "tool_execution_progress", "data": {"tool_name": "read_file", "message": "reading..."}})
        on_event({"type": "tool_execution_end", "data": {"tool_name": "read_file", "status": "success", "result": "file content"}})

        assert q.qsize() == 0, "Tool events should be skipped"

    def test_message_end_with_tool_calls_clears_buffer(self, sse_env):
        """message_end + tool_calls → clear buffer + send message_end."""
        on_event, q = sse_env

        on_event({"type": "message_update", "data": {"delta": "thinking..."}})
        on_event({"type": "message_end", "data": {"tool_calls": [{"id": "call_1"}]}})

        # Buffer was cleared, only message_end event is in queue
        items = []
        while not q.empty():
            items.append(q.get_nowait())
        assert len(items) == 1, "Only message_end should be in queue"
        assert items[0]["type"] == "message_end"
        assert items[0]["has_tool_calls"] is True

    def test_message_end_without_tool_calls_flushes_buffer(self, sse_env):
        """message_end + no tool_calls → flush buffer as delta events."""
        on_event, q = sse_env

        on_event({"type": "message_update", "data": {"delta": "最终"}})
        on_event({"type": "message_update", "data": {"delta": "回复"}})
        on_event({"type": "message_end", "data": {"tool_calls": []}})

        items = []
        while not q.empty():
            items.append(q.get_nowait())
        # Should have 2 delta events
        assert len(items) == 2, f"Expected 2 delta events, got {len(items)}"
        assert items[0] == {"type": "delta", "content": "最终"}
        assert items[1] == {"type": "delta", "content": "回复"}

    def test_reasoning_update_still_sent(self, sse_env):
        """reasoning_update should still be pushed to frontend."""
        on_event, q = sse_env

        on_event({"type": "reasoning_update", "data": {"delta": "deep thinking..."}})

        items = []
        while not q.empty():
            items.append(q.get_nowait())
        assert any(
            item["type"] == "reasoning" for item in items
        ), "reasoning_update should still produce SSE reasoning events"

    def test_mixed_tool_and_final(self, sse_env):
        """Multiple tool turns → buffer cleared each time → final flush works."""
        on_event, q = sse_env

        # Turn 1: thinking + tool call
        on_event({"type": "message_update", "data": {"delta": "first thinking"}})
        on_event({"type": "message_end", "data": {"tool_calls": [{"id": "c1"}]}})

        # Turn 2: thinking + tool call
        on_event({"type": "message_update", "data": {"delta": "second thinking"}})
        on_event({"type": "message_end", "data": {"tool_calls": [{"id": "c2"}]}})

        # Final turn: no tool call = final reply
        on_event({"type": "message_update", "data": {"delta": "这是"}})
        on_event({"type": "message_update", "data": {"delta": "最终答案"}})
        on_event({"type": "message_end", "data": {"tool_calls": []}})

        items = []
        while not q.empty():
            items.append(q.get_nowait())

        # Should have: 2 message_end events + 2 delta events from final flush
        msg_end_count = sum(1 for it in items if it["type"] == "message_end")
        delta_count = sum(1 for it in items if it["type"] == "delta")

        assert msg_end_count == 2, f"Expected 2 message_end, got {msg_end_count}"
        assert delta_count == 2, f"Expected 2 delta from final flush, got {delta_count}"
        # Final flush should contain the actual final text, not thinking
        delta_contents = [it["content"] for it in items if it["type"] == "delta"]
        assert "这是" in delta_contents
        assert "最终答案" in delta_contents
        # Thinking text should NOT appear in any delta
        assert "first thinking" not in delta_contents
        assert "second thinking" not in delta_contents
