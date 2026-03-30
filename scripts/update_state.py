#!/usr/bin/env python3
"""
Dragon-system State Update Script

Interactive helper to update runtime/system_state.yaml and runtime/task_graph.yaml.
Run this at the end of a development session.
"""

import os
import sys
import yaml
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

STATE_PATH = REPO_ROOT / "runtime/system_state.yaml"
TASK_PATH = REPO_ROOT / "runtime/task_graph.yaml"


def load_yaml(path: Path):
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def save_yaml(path: Path, data: dict):
    with open(path, "w", encoding="utf-8") as f:
        yaml.dump(data, f, sort_keys=False, allow_unicode=True)


def ask(question: str, default: str = "") -> str:
    prompt = f"{question}"
    if default:
        prompt += f" [{default}]"
    prompt += ": "
    answer = input(prompt).strip()
    return answer if answer else default


def ask_bool(question: str, default: bool = False) -> bool:
    default_str = "Y/n" if default else "y/N"
    answer = input(f"{question} [{default_str}]: ").strip().lower()
    if not answer:
        return default
    return answer in ("y", "yes")


def update_state():
    print("\n--- Updating runtime/system_state.yaml ---\n")
    state = load_yaml(STATE_PATH)

    print(f"Current version: {state.get('version')}")
    new_version = ask("New version?", state.get("version", "0.1.0"))
    state["version"] = new_version
    state["last_updated"] = datetime.now(timezone.utc).isoformat()

    print("\nPhases:")
    for key, val in state.get("phases", {}).items():
        print(f"  {key}: {val.get('title')} -> {val.get('status')}")
        if ask_bool(f"Update status for {key}?"):
            new_status = ask("Status (pending/in_progress/done/blocked)?", val.get("status"))
            val["status"] = new_status

    print("\nActive modules:")
    for name, info in state.get("active_modules", {}).items():
        print(f"  {name}: {info.get('status')}")
        if ask_bool(f"Update status for {name}?"):
            new_status = ask("Status?", info.get("status"))
            info["status"] = new_status

    print("\nCurrent goal:")
    goal = state.get("current_goal", {})
    print(f"  {goal.get('id')}: {goal.get('title')}")
    if ask_bool("Update current goal?"):
        goal["id"] = ask("Goal ID?", goal.get("id", ""))
        goal["title"] = ask("Goal title?", goal.get("title", ""))
        goal["description"] = ask("Goal description?", goal.get("description", ""))

    print("\nNext actions:")
    for action in state.get("next_actions", []):
        print(f"  {action.get('id')}: {action.get('title')} ({action.get('status')})")
        if ask_bool(f"Mark {action.get('id')} as done?"):
            action["status"] = "done"

    if ask_bool("Add a new next action?"):
        new_id = ask("Action ID?")
        new_title = ask("Action title?")
        state["next_actions"].append({"id": new_id, "title": new_title, "status": "pending"})

    print("\nBlocked by:")
    blocked = state.get("blocked_by", [])
    for i, b in enumerate(blocked):
        print(f"  {i+1}. {b.get('item')}")
        if ask_bool(f"Remove this blocker?"):
            blocked.pop(i)

    if ask_bool("Add new blocker?"):
        item = ask("Blocker item?")
        impact = ask("Impact?")
        blocked.append({"item": item, "impact": impact})

    save_yaml(STATE_PATH, state)
    print(f"\nSaved: {STATE_PATH}")


def update_tasks():
    print("\n--- Updating runtime/task_graph.yaml ---\n")
    tasks = load_yaml(TASK_PATH)

    for task in tasks.get("tasks", []):
        tid = task.get("id")
        title = task.get("title")
        status = task.get("status")
        print(f"  {tid}: {title} ({status})")
        if ask_bool(f"Update status for {tid}?"):
            new_status = ask("Status (pending/in_progress/done/blocked)?", status)
            task["status"] = new_status
            if new_status == "done":
                task["completed_at"] = datetime.now(timezone.utc).isoformat()

    save_yaml(TASK_PATH, tasks)
    print(f"\nSaved: {TASK_PATH}")


def main():
    if not STATE_PATH.exists() or not TASK_PATH.exists():
        print("ERROR: state files not found.")
        sys.exit(1)

    update_state()
    update_tasks()
    print("\nAll state files updated. Remember to run generate_handoff.py next.")


if __name__ == "__main__":
    main()
