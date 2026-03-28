#!/usr/bin/env python3
"""
generate_demo_transcript.py

基于 seed 数据生成简单的 demo 文本，帮助审查房间内容是不是太空。
可以输出为纯文本或 Markdown，供团队快速浏览世界内容。
"""

import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("错误：需要安装 PyYAML。请运行: pip install pyyaml")
    sys.exit(1)


WORLD_DIR = Path(__file__).parent.parent / "world"
ROOMS_DIR = WORLD_DIR / "rooms"
AGENTS_DIR = WORLD_DIR / "agents"
OBJECTS_DIR = WORLD_DIR / "objects"


def load_all(directory: Path) -> dict:
    result = {}
    for filepath in directory.glob("*.yaml"):
        with open(filepath, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        if data and "id" in data:
            result[data["id"]] = data
    return result


def generate_markdown(rooms: dict, agents: dict, objects: dict) -> str:
    lines = []
    lines.append("# DragonWorld Demo Transcript")
    lines.append("")
    lines.append("*本内容由 generate_demo_transcript.py 自动生成，用于快速预览世界内容。*")
    lines.append("")

    for rid in sorted(rooms.keys()):
        room = rooms[rid]
        lines.append(f"## {room.get('name', rid)}")
        lines.append("")
        lines.append(f"**类型**：{room.get('kind', 'unknown')}")
        lines.append("")
        lines.append(room.get('short_description', '暂无描述'))
        lines.append("")

        # Ambient
        ambient = room.get('ambient_text', [])
        if ambient:
            lines.append("**环境氛围**：")
            for text in ambient:
                lines.append(f"- {text}")
            lines.append("")

        # Agents
        room_agents = room.get('agents', [])
        if room_agents:
            lines.append("**在场角色**：")
            for aid in room_agents:
                agent = agents.get(aid, {})
                lines.append(f"- **{agent.get('name', aid)}** ({agent.get('title', '无头衔')})")
                lines.append(f"  - 角色：{agent.get('role', 'unknown')}")
                lines.append(f"  - 问候语：{agent.get('greeting', '...')}")
            lines.append("")

        # Objects
        room_objects = room.get('objects', [])
        if room_objects:
            lines.append("**可交互物品**：")
            for oid in room_objects:
                obj = objects.get(oid, {})
                lines.append(f"- **{obj.get('name', oid)}** ({obj.get('type', 'unknown')})")
                lines.append(f"  - 状态：{obj.get('status_text', '...')}")
            lines.append("")

        # Exits
        exits = room.get('exits', {})
        if exits:
            lines.append("**出口**：")
            for direction, target in exits.items():
                target_name = rooms.get(target, {}).get('name', target)
                lines.append(f"- {direction} → {target_name}")
            lines.append("")

        lines.append("---")
        lines.append("")

    # Summary
    lines.append("## 世界统计")
    lines.append("")
    lines.append(f"- 房间总数：{len(rooms)}")
    lines.append(f"- 角色总数：{len(agents)}")
    lines.append(f"- 物品总数：{len(objects)}")
    lines.append("")

    return "\n".join(lines)


def main():
    rooms = load_all(ROOMS_DIR)
    agents = load_all(AGENTS_DIR)
    objects = load_all(OBJECTS_DIR)

    output = generate_markdown(rooms, agents, objects)

    output_path = Path(__file__).parent.parent / "examples" / "demo_transcript.md"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(output)

    print(f"✅ Demo transcript 已生成：{output_path}")
    print(f"   房间：{len(rooms)} 个")
    print(f"   角色：{len(agents)} 个")
    print(f"   物品：{len(objects)} 个")


if __name__ == "__main__":
    main()
