import asyncio
import os
import sys
import types

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# agent_memory imports `database`, which needs the supabase client. The memory
# logic under test does not, so stub the module when it cannot be imported.
if "database" not in sys.modules:
    _stub = types.ModuleType("database")
    _stub.SupabaseStore = object
    sys.modules["database"] = _stub

from agent_memory import AgentMemory  # noqa: E402


class _Query:
    def __init__(self, data=None, count=0):
        self._result = types.SimpleNamespace(data=data, count=count)

    def __getattr__(self, name):  # select/eq/order/limit are all chainable
        return lambda *a, **k: self

    def execute(self):
        return self._result


class FakeClient:
    def __init__(self, tables):
        self.tables = tables

    def table(self, name):
        return self.tables[name]


class FakeDB:
    def __init__(self, tables):
        self.client = FakeClient(tables)

    async def count_processed(self):
        return 42

    async def count_offers(self):
        return 7


def test_record_cycle_yield_tracks_consecutive_low_yield():
    m = AgentMemory(db=None)
    m.record_cycle_yield(0)
    m.record_cycle_yield(0)
    assert m.state.consecutive_low_yield == 2
    m.record_cycle_yield(3)
    assert m.state.consecutive_low_yield == 0
    assert m.state.last_cycle_yield == 3


def test_decision_log_is_capped_and_keeps_newest():
    m = AgentMemory(db=None)
    for i in range(60):
        m.record_decision({"action": f"a{i}"})
    assert len(m._decision_log) == 50
    assert m._decision_log[-1]["action"] == "a59"
    assert m._decision_log[0]["action"] == "a10"


def test_build_context_prompt_empty_state():
    prompt = AgentMemory(db=None).build_context_prompt()
    assert prompt.count("(none yet)") == 3
    assert "Consecutive low-yield cycles: 0" in prompt


def test_observe_populates_state_and_discovery_rate():
    tables = {
        "keyword_pool": _Query(count=12),
        "domains": _Query(
            data=[{"domain": "a.edu", "trust_score": 0.9, "offer_count": 3, "spam_count": 0}],
            count=2,
        ),
        "offers": _Query(data=[{"domain": "a.edu", "title": None, "score": 80}]),
    }
    m = AgentMemory(db=FakeDB(tables))
    m.record_cycle_yield(2)
    m.record_cycle_yield(4)
    state = asyncio.run(m.observe())
    assert state.total_urls_processed == 42
    assert state.total_offers_found == 7
    assert state.active_keywords == 12
    assert state.blacklisted_domains == 2
    assert state.recent_offers == [{"domain": "a.edu", "title": "", "score": 80}]
    assert state.discovery_rate == 3.0
    assert "a.edu" in m.build_context_prompt()


def test_observe_swallows_database_errors():
    class BrokenDB:
        async def count_processed(self):
            raise RuntimeError("db down")

    state = asyncio.run(AgentMemory(db=BrokenDB()).observe())
    assert state.total_urls_processed == 0
