#!/usr/bin/env python3
"""
Dragon-system Handoff Packet Generator

Generates handoff/latest_boot_packet.md from runtime state.
Run this after update_state.py at the end of every session.
"""

import os
import sys
import yaml
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

STATE_PATH = REPO_ROOT / "runtime/system_state.yaml"
TASK_PATH = REPO_ROOT / "runtime/task_graph.yaml"
HANDOFF_PATH = REPO_ROOT / "handoff/latest_boot_packet.md"


def load_yaml(path: Path):
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def ask(question: str, default: str = "") -> str:
    prompt = f"{question}"
    if default:
        prompt += f" [{default}]"
    prompt += ": "
    answer = input(prompt).strip()
    return answer if answer else default


def generate():
    state = load_yaml(STATE_PATH)
    tasks = load_yaml(TASK_PATH)

    now = datetime.now(timezone.utc).isoformat()
    session_id = ask("Session ID / name?", f"session_{now[:19].replace(':', '')}")

    print("\nWhat did you accomplish this session? (blank line to finish)")
    accomplishments = []
    while True:
        line = input("- ").strip()
        if not line:
            break
        accomplishments.append(line)

    print("\nAny new risks or blockers to note? (blank line to finish)")
    risks = []
    while True:
        line = input("- ").strip()
        if not line:
            break
        risks.append(line)

    print("\nKey files modified this session? (blank line to finish)")
    key_files = []
    while True:
        line = input("- ").strip()
        if not line:
            break
        key_files.append(line)

    goal = state.get("current_goal", {})
    in_progress_tasks = [t for t in tasks.get("tasks", []) if t.get("status") == "in_progress"]
    next_pending = [t for t in tasks.get("tasks", []) if t.get("status") == "pending"][:3]

    lines = [
        "# Latest Boot Packet",
        "",
        f"> Generated: {now}  ",
        f"> Session: {session_id}",
        "",
        "## 本次完成的事項",
        "",
    ]
    for item in accomplishments:
        lines.append(f"1. {item}")
    if not accomplishments:
        lines.append("_暫無_")

    lines.extend([
        "",
        "## 當前系統狀態摘要",
        "",
        f"- **Project**: {state.get('project', 'N/A')} {state.get('version', 'N/A')}",
        f"- **Phase**: 正在進行 Phase 0 (Anti-amnesia infrastructure)",
        f"- **Current Goal**: {goal.get('id', 'N/A')} - {goal.get('title', 'N/A')}",
        f"- **In-Progress Tasks**: {len(in_progress_tasks)}",
    ])

    lines.extend([
        "",
        "## 下一個優先任務",
        "",
    ])
    if next_pending:
        for t in next_pending:
            lines.append(f"1. {t.get('id')} - {t.get('title')}")
    else:
        lines.append("_暫無待處理任務_")

    lines.extend([
        "",
        "## 已知風險與阻塞",
        "",
    ])
    blocked = state.get("blocked_by", [])
    if blocked or risks:
        for b in blocked:
            lines.append(f"- **阻塞**: {b.get('item')} (影響: {b.get('impact')})")
        for r in risks:
            lines.append(f"- **風險**: {r}")
    else:
        lines.append("_暫無_")

    lines.extend([
        "",
        "## 需要特別注意的文件",
        "",
    ])
    if key_files:
        for f in key_files:
            lines.append(f"- `{f}`")
    else:
        lines.append("- `runtime/system_state.yaml`")
        lines.append("- `docs/01_system_architecture.md`")
        lines.append("- `handoff/latest_boot_packet.md`")

    lines.extend([
        "",
        "## 啟動指令",
        "",
        "```bash",
        "cd DragonCore-OS/Dragon-world",
        "python scripts/bootstrap_context.py",
        "```",
        "",
        "然後閱讀：",
        "1. `runtime/system_state.yaml`",
        "2. `docs/01_system_architecture.md`",
        "3. `runtime/task_graph.yaml`",
        "4. `handoff/latest_boot_packet.md`",
    ])

    HANDOFF_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"\nGenerated: {HANDOFF_PATH}")


def main():
    if not STATE_PATH.exists() or not TASK_PATH.exists():
        print("ERROR: Required state files missing.")
        sys.exit(1)

    generate()
    print("\nDone. Next steps:")
    print("  1. Review handoff/latest_boot_packet.md")
    print("  2. git add runtime/ handoff/ docs/adr/ specs/ scripts/")
    print("  3. git commit -m 'docs: update engineering state and handoff packet'")


if __name__ == "__main__":
    main()
