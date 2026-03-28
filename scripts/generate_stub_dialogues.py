#!/usr/bin/env python3
"""
generate_stub_dialogues.py

基于 world/agents/ 下的 agent manifest，批量生成 world/dialogue/ 下的对话模板。
减少手工重复劳动，确保对话文件与 agent 定义保持一致。
"""

import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("错误：需要安装 PyYAML。请运行: pip install pyyaml")
    sys.exit(1)


WORLD_DIR = Path(__file__).parent.parent / "world"
AGENTS_DIR = WORLD_DIR / "agents"
DIALOGUE_DIR = WORLD_DIR / "dialogue"


def generate_dialogue(agent_data: dict) -> dict:
    """根据 agent 数据生成对话模板。"""
    agent_id = agent_data["id"]
    greeting = agent_data.get("greeting", "你好。")
    fallback_lines = agent_data.get("fallback_lines", ["我暂时无法回应这个请求。"])

    return {
        "agent_id": agent_id,
        "greeting": [greeting],
        "repeat": [
            "你回来了。有什么新的吩咐吗？",
            "我们可以继续刚才的话题。",
            f"{agent_data.get('name', '我')} 在此听候差遣。"
        ],
        "fallback": fallback_lines,
        "not_here": [
            "当前房间未发现该角色。你可以先用 /look 查看附近实体。",
            f"{agent_data.get('name', '该角色')} 不在这个房间。",
            "这里没有回应，角色应该在别处。"
        ]
    }


def main():
    DIALOGUE_DIR.mkdir(parents=True, exist_ok=True)
    generated = 0
    skipped = 0

    for filepath in sorted(AGENTS_DIR.glob("*.yaml")):
        with open(filepath, "r", encoding="utf-8") as f:
            agent_data = yaml.safe_load(f)

        if not agent_data or "id" not in agent_data:
            print(f"⚠️  跳过无效文件: {filepath.name}")
            continue

        agent_id = agent_data["id"]
        dialogue_path = DIALOGUE_DIR / f"{agent_id}.yaml"

        if dialogue_path.exists():
            print(f"⏭️  已存在，跳过: {dialogue_path.name}")
            skipped += 1
            continue

        dialogue_data = generate_dialogue(agent_data)
        with open(dialogue_path, "w", encoding="utf-8") as f:
            yaml.dump(dialogue_data, f, allow_unicode=True, sort_keys=False)

        print(f"✅ 生成: {dialogue_path.name}")
        generated += 1

    print()
    print(f"完成：生成 {generated} 个，跳过 {skipped} 个")


if __name__ == "__main__":
    main()
