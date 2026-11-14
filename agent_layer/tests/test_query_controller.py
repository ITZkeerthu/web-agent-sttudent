import asyncio
import os
import sys
import types

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# query_controller imports the Supabase-backed store; stub it so tests run
# without the supabase dependency or network access.
if "database" not in sys.modules:
    stub = types.ModuleType("database")
    stub.SupabaseStore = object
    sys.modules["database"] = stub

from config import Limits
from query_controller import QueryBudgetController


class FakeDB:
    def __init__(self):
        self.calls = []

    async def update_keyword_yield(self, query, delta):
        self.calls.append((query, delta))


def test_select_queries_respects_budget_and_is_unique():
    c = QueryBudgetController(FakeDB())
    picked = c.select_queries(budget=5)
    assert len(picked) == 5 and len(set(picked)) == 5
    assert len(c.select_queries()) <= Limits.MAX_QUERIES_PER_CYCLE


def test_update_yield_without_event_loop_does_not_raise():
    c = QueryBudgetController(FakeDB())
    q = next(iter(c._queries))
    c.update_yield(q, 0)
    assert c._queries[q].consecutive_zero_yields == 1
    c.update_yield(q, 3)
    assert c._queries[q].consecutive_zero_yields == 0
    assert c._queries[q].total_results == 3


def test_update_yield_schedules_db_write_in_running_loop():
    db = FakeDB()
    c = QueryBudgetController(db)
    q = next(iter(c._queries))

    async def run():
        c.update_yield(q, 2)
        await asyncio.sleep(0)

    asyncio.run(run())
    assert db.calls and db.calls[0][0] == q


def test_expand_with_synonyms_is_whole_word_and_capped():
    c = QueryBudgetController(FakeDB())
    out = c.expand_with_synonyms("student offers")
    assert len(out) <= 3
    assert all("offers" in e for e in out)
    assert "academic offers" in out
