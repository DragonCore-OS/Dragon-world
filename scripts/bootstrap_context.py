#!/usr/bin/env python3
"""
Dragon-system Context Bootstrap Script

Run this at the start of every development session to recover engineering context.
"""

import os
import sys
import yaml
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

REQUIRED_FILES = [
    "runtime/system_state.yaml",
    "docs/01_system_architecture.md",
    "runtime/task_graph.yaml",
    "handoff/latest_boot_packet.md",
]


def check_files() -> list[str]:
    missing = []
    for f in REQUIRED_FILES:
        p = REPO_ROOT / f
        if not p.exists():
            missing.append(f)
    return missing


def load_yaml(path: Path):
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def print_summary(state: dict, tasks: dict):
    print("=" * 60)
    print("DRAGON-SYSTEM SESSION BOOT PACKET")
    print("=" * 60)
    print(f"Project : {state.get('project', 'N/A')} {state.get('version', 'N/A')}")
    print(f"North Star: {state.get('north_star', 'N/A').strip()}")
    print()

    print("PHASES:")
    phases = state.get("phases", {})
    for key, val in phases.items():
        status = val.get("status", "unknown")
        title = val.get("title", key)
        marker = "[*]" if status == "in_progress" else "[ ]"
        print(f"  {marker} {key}: {title} ({status})")
    print()

    goal = state.get("current_goal", {})
    print(f"CURRENT GOAL: {goal.get('id', 'N/A')} - {goal.get('title', 'N/A')}")
    print(f"  {goal.get('description', '').strip()}")
    print()

    print("NEXT ACTIONS:")
    for action in state.get("next_actions", []):
        aid = action.get("id", "N/A")
        title = action.get("title", "N/A")
        status = action.get("status", "unknown")
        marker = "[*]" if status == "in_progress" else "[ ]"
        print(f"  {marker} {aid}: {title}")
    print()

    blocked = state.get("blocked_by", [])
    if blocked:
        print("BLOCKED BY:")
        for b in blocked:
            print(f"  [!] {b.get('item', 'N/A')} (impact: {b.get('impact', 'N/A')})")
        print()

    print("ACTIVE MODULES:")
    for name, info in state.get("active_modules", {}).items():
        print(f"  - {name}: {info.get('status', 'N/A')} ({info.get('path', 'N/A')})")
    print()

    print("TASK GRAPH (Sprint):")
    sprints = tasks.get("sprints", [])
    for sp in sprints:
        if sp.get("status") == "in_progress":
            print(f"  Sprint: {sp.get('id')} - {sp.get('title')} ({sp.get('start_date')} ~ {sp.get('end_date')})")
            print(f"  Goals: {', '.join(sp.get('goals', []))}")
    print()

    in_progress = [t for t in tasks.get("tasks", []) if t.get("status") == "in_progress"]
    if in_progress:
        print("IN-PROGRESS TASKS:")
        for t in in_progress:
            print(f"  [*] {t.get('id')}: {t.get('title')} (owner: {t.get('owner')})")
    print()

    print("=" * 60)
    print("Next: read the 4 required files, then start coding.")
    print("=" * 60)


def main():
    missing = check_files()
    if missing:
        print("ERROR: Missing required context files:")
        for m in missing:
            print(f"  - {m}")
        sys.exit(1)

    state = load_yaml(REPO_ROOT / "runtime/system_state.yaml")
    tasks = load_yaml(REPO_ROOT / "runtime/task_graph.yaml")

    print_summary(state, tasks)

    # Update last_booted timestamp in a lightweight marker file
    boot_marker = REPO_ROOT / "runtime/.last_booted"
    boot_marker.write_text(datetime.now(timezone.utc).isoformat(), encoding="utf-8")


if __name__ == "__main__":
    main()
