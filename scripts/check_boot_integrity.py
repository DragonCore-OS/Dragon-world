#!/usr/bin/env python3
"""
Dragon-system Boot Integrity Checker

Validates that all required context files exist and are well-formed.
Can be used in CI, pre-commit hooks, or local development.
"""

import sys
from pathlib import Path
import yaml
import json

REPO_ROOT = Path(__file__).resolve().parent.parent

REQUIRED_FILES = [
    "runtime/system_state.yaml",
    "runtime/task_graph.yaml",
    "runtime/module_registry.yaml",
    "handoff/latest_boot_packet.md",
    "docs/01_system_architecture.md",
    "docs/dragon_system_boot_protocol.md",
    "specs/action_schema.json",
    "specs/event_schema.json",
    "specs/skill_schema.json",
    "specs/provider_schema.json",
]

REQUIRED_ADRS = [
    "docs/adr/ADR-0001-monorepo-boundary.md",
    "docs/adr/ADR-0002-kimi-provider-only.md",
    "docs/adr/ADR-0003-kernel-harness-separation.md",
    "docs/adr/ADR-0004-repo-semantic-upgrade.md",
    "docs/adr/ADR-0005-windows11-only.md",
    "docs/adr/ADR-0006-windows-action-plane.md",
]


def error(msg: str) -> None:
    print(f"[FAIL] {msg}")


def ok(msg: str) -> None:
    print(f"[OK]   {msg}")


def check_files_exist() -> int:
    errors = 0
    for f in REQUIRED_FILES:
        p = REPO_ROOT / f
        if p.exists():
            ok(f"exists: {f}")
        else:
            error(f"missing: {f}")
            errors += 1
    return errors


def check_adrs() -> int:
    errors = 0
    for f in REQUIRED_ADRS:
        p = REPO_ROOT / f
        if not p.exists():
            error(f"missing ADR: {f}")
            errors += 1
            continue
        content = p.read_text(encoding="utf-8")
        if "## 狀態" not in content and "## Status" not in content:
            error(f"malformed ADR (missing status): {f}")
            errors += 1
        else:
            ok(f"valid ADR: {f}")
    return errors


def check_yaml(path: Path, label: str) -> int:
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        if data is None:
            error(f"empty YAML: {label}")
            return 1
        ok(f"valid YAML: {label}")
        return 0
    except Exception as e:
        error(f"invalid YAML {label}: {e}")
        return 1


def check_json(path: Path, label: str) -> int:
    try:
        with open(path, "r", encoding="utf-8") as f:
            json.load(f)
        ok(f"valid JSON: {label}")
        return 0
    except Exception as e:
        error(f"invalid JSON {label}: {e}")
        return 1


def check_state_consistency() -> int:
    errors = 0
    state_path = REPO_ROOT / "runtime/system_state.yaml"
    task_path = REPO_ROOT / "runtime/task_graph.yaml"

    with open(state_path, "r", encoding="utf-8") as f:
        state = yaml.safe_load(f)
    with open(task_path, "r", encoding="utf-8") as f:
        tasks = yaml.safe_load(f)

    # Check that state last_updated matches task last_updated roughly (same day)
    state_ts = state.get("last_updated", "")
    task_ts = tasks.get("last_updated", "")
    if state_ts[:10] != task_ts[:10]:
        error(f"state/task timestamps out of sync: {state_ts} vs {task_ts}")
        errors += 1
    else:
        ok("state/task timestamps aligned")

    # Check that current_goal id appears in tasks
    goal_id = state.get("current_goal", {}).get("id")
    task_ids = {t.get("id") for t in tasks.get("tasks", [])}
    if goal_id and goal_id not in task_ids:
        error(f"current_goal {goal_id} not found in task_graph")
        errors += 1
    else:
        ok(f"current_goal {goal_id} tracked in task_graph")

    # Check that next_actions appear in tasks
    next_ids = {a.get("id") for a in state.get("next_actions", []) if a.get("id")}
    missing = next_ids - task_ids
    if missing:
        error(f"next_actions missing from task_graph: {missing}")
        errors += 1
    else:
        ok("next_actions aligned with task_graph")

    return errors


def check_handoff_freshness() -> int:
    handoff_path = REPO_ROOT / "handoff/latest_boot_packet.md"
    state_path = REPO_ROOT / "runtime/system_state.yaml"

    if not handoff_path.exists() or not state_path.exists():
        return 0

    with open(state_path, "r", encoding="utf-8") as f:
        state = yaml.safe_load(f)

    state_ts = state.get("last_updated", "")[:10]
    content = handoff_path.read_text(encoding="utf-8")

    # Very loose check: handoff should mention a date close to state update
    if state_ts in content:
        ok("handoff packet references current state date")
        return 0
    else:
        error("handoff packet may be stale (does not reference current state date)")
        return 1


def main() -> int:
    print("=" * 60)
    print("Dragon-system Boot Integrity Check")
    print("=" * 60)
    errors = 0
    errors += check_files_exist()
    errors += check_adrs()
    errors += check_yaml(REPO_ROOT / "runtime/system_state.yaml", "system_state.yaml")
    errors += check_yaml(REPO_ROOT / "runtime/task_graph.yaml", "task_graph.yaml")
    errors += check_yaml(REPO_ROOT / "runtime/module_registry.yaml", "module_registry.yaml")
    errors += check_json(REPO_ROOT / "specs/action_schema.json", "action_schema.json")
    errors += check_json(REPO_ROOT / "specs/event_schema.json", "event_schema.json")
    errors += check_json(REPO_ROOT / "specs/skill_schema.json", "skill_schema.json")
    errors += check_json(REPO_ROOT / "specs/provider_schema.json", "provider_schema.json")
    errors += check_state_consistency()
    errors += check_handoff_freshness()

    print("=" * 60)
    if errors == 0:
        print("ALL CHECKS PASSED")
        return 0
    else:
        print(f"FOUND {errors} ERROR(S)")
        return 1


if __name__ == "__main__":
    sys.exit(main())
