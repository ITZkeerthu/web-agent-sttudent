#!/usr/bin/env python3
"""
Agent Engine — Main entrypoint for the Goal-Oriented Autonomous Web Agent.

Replaces the deterministic engine.py with an LLM-driven reasoning loop:
  Observe → Reason → Act → Evaluate → Update Memory → Repeat

Usage:
  python3 agent_engine.py
"""
import asyncio
import random
import time
import traceback
import gc
from datetime import datetime

from config import Timing
from database import SupabaseStore
from agent_core import AgentReasoningCore


class AgentExecutionController:
    """
    Top-level execution controller for the web agent.
    Manages the agent lifecycle with safety guardrails.
    """

    def __init__(self):
        self.db = SupabaseStore()
        self.agent = AgentReasoningCore(self.db)
        self._running = False
        self._start_time = datetime.utcnow()
        self._total_cycles = 0
        self._total_offers = 0

    async def initialize(self):
        """Seed keywords and prepare agent."""
        print("=" * 60)
        print("  GOAL-ORIENTED AUTONOMOUS WEB AGENT")
        print("  Objective: Discover legitimate student benefits")
        print("  Model: moonshotai/kimi-k2-instruct (NVIDIA)")
        print("=" * 60)
        print()

        print("[AgentEngine] Initializing database...")
        await self.db.initialize_keyword_pool()
        print("[AgentEngine] Ready.\n")

    async def run_forever(self):
        """Main agent loop."""
        await self.initialize()
        self._running = True

        while self._running:
            try:
                # Run one agent cycle
                summary = await self.agent.run_cycle()
                self._total_cycles += 1
                self._total_offers += summary.get("offers_found", 0)

                # Print cumulative stats
                runtime = datetime.utcnow() - self._start_time
                print(f"\n[AgentEngine] Cumulative: {self._total_cycles} cycles, "
                      f"{self._total_offers} offers, runtime: {runtime}")

                # Randomized sleep between cycles (shorter than deterministic engine)
                sleep_minutes = random.randint(
                    max(1, Timing.CYCLE_MIN_SLEEP // 3),
                    max(2, Timing.CYCLE_MAX_SLEEP // 3),
                )
                print(f"[AgentEngine] Sleeping {sleep_minutes} minutes...\n")

                for _ in range(sleep_minutes * 6):  # 10s chunks
                    if not self._running:
                        break
                    await asyncio.sleep(10)

                gc.collect()

            except KeyboardInterrupt:
                print("\n[AgentEngine] Interrupted by user")
                break
            except Exception as e:
                print(f"[AgentEngine] Critical error: {e}")
                traceback.print_exc()
                await asyncio.sleep(60)

        await self.shutdown()

    async def run_single_cycle(self):
        """Run just one cycle (for testing)."""
        await self.initialize()
        summary = await self.agent.run_cycle()
        await self.shutdown()
        return summary

    def stop(self):
        self._running = False

    async def shutdown(self):
        """Clean shutdown."""
        print("[AgentEngine] Shutting down...")
        await self.agent.shutdown()

        runtime = datetime.utcnow() - self._start_time
        print(f"[AgentEngine] Total cycles: {self._total_cycles}")
        print(f"[AgentEngine] Total offers: {self._total_offers}")
        print(f"[AgentEngine] Runtime: {runtime}")
        print("[AgentEngine] Shutdown complete")


def run():
    """Entry point."""
    controller = AgentExecutionController()
    try:
        asyncio.run(controller.run_forever())
    except Exception as e:
        print(f"Fatal error: {e}")
        traceback.print_exc()


def run_once():
    """Run a single cycle for testing."""
    controller = AgentExecutionController()
    try:
        return asyncio.run(controller.run_single_cycle())
    except Exception as e:
        print(f"Fatal error: {e}")
        traceback.print_exc()


if __name__ == "__main__":
    run()
