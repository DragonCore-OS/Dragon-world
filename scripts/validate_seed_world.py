#!/usr/bin/env python3
"""
validate_seed_world.py

检查 DragonWorld 的 seed 数据是否满足基本一致性约束：
- YAML 是否可解析
- room / agent / object id 是否重复
- exits 是否有悬挂引用
- agent/object 所属房间是否存在
"""

import sys
from pathlib import Path
from collections import defaultdict

try:
    import yaml
except ImportError:
    print("错误：需要安装 PyYAML。请运行: pip install pyyaml")
    sys.exit(1)


WORLD_DIR = Path(__file__).parent.parent / "world"
ROOMS_DIR = WORLD_DIR / "rooms"
AGENTS_DIR = WORLD_DIR / "agents"
OBJECTS_DIR = WORLD_DIR / "objects"

errors = []
warnings = []


def load_yaml_files(directory: Path):
    """加载目录下所有 yaml 文件，返回 {id: data} 字典。"""
    result = {}
    for filepath in directory.glob("*.yaml"):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)
            if data is None:
                errors.append(f"{filepath.name}: YAML 文件为空")
                continue
            obj_id = data.get("id")
            if not obj_id:
                errors.append(f"{filepath.name}: 缺少 id 字段")
                continue
            if obj_id in result:
                errors.append(f"重复 id: {obj_id} 出现在多个文件中")
                continue
            result[obj_id] = data
        except yaml.YAMLError as e:
            errors.append(f"{filepath.name}: YAML 解析失败 - {e}")
        except Exception as e:
            errors.append(f"{filepath.name}: 读取失败 - {e}")
    return result


def validate_rooms(rooms: dict):
    """验证房间数据。"""
    required_fields = ["id", "name", "kind", "description", "short_description",
                       "ambient_text", "exits", "objects", "agents", "tags"]
    for rid, data in rooms.items():
        for field in required_fields:
            if field not in data:
                errors.append(f"房间 {rid}: 缺少字段 {field}")

        # 检查 exits 目标房间是否存在
        exits = data.get("exits", {})
        for direction, target in exits.items():
            if target not in rooms:
                errors.append(f"房间 {rid}: 出口 {direction} 指向不存在的房间 {target}")


def validate_agents(agents: dict, rooms: dict):
    """验证角色数据。"""
    required_fields = ["id", "name", "title", "role", "owner_room",
                       "supervisor", "skills", "greeting", "fallback_lines",
                       "memory_namespace", "notes"]
    for aid, data in agents.items():
        for field in required_fields:
            if field not in data:
                errors.append(f"角色 {aid}: 缺少字段 {field}")

        owner = data.get("owner_room")
        if owner and owner not in rooms:
            errors.append(f"角色 {aid}: 所属房间 {owner} 不存在")


def validate_objects(objects: dict, rooms: dict):
    """验证物品数据。"""
    required_fields = ["id", "name", "type", "room", "description",
                       "interactions", "status_text"]
    for oid, data in objects.items():
        for field in required_fields:
            if field not in data:
                errors.append(f"物品 {oid}: 缺少字段 {field}")

        room = data.get("room")
        if room and room not in rooms:
            errors.append(f"物品 {oid}: 所在房间 {room} 不存在")


def validate_room_agent_object_consistency(rooms: dict, agents: dict, objects: dict):
    """验证房间中声明的 agent/object 是否真实存在。"""
    for rid, data in rooms.items():
        for agent_id in data.get("agents", []):
            if agent_id not in agents:
                errors.append(f"房间 {rid}: 声明了不存在的角色 {agent_id}")
            elif agents[agent_id].get("owner_room") != rid:
                warnings.append(
                    f"房间 {rid}: 角色 {agent_id} 的 owner_room 是 "
                    f"{agents[agent_id].get('owner_room')}，但出现在房间 {rid} 中"
                )

        for obj_id in data.get("objects", []):
            if obj_id not in objects:
                errors.append(f"房间 {rid}: 声明了不存在的物品 {obj_id}")
            elif objects[obj_id].get("room") != rid:
                warnings.append(
                    f"房间 {rid}: 物品 {obj_id} 的 room 字段是 "
                    f"{objects[obj_id].get('room')}，但出现在房间 {rid} 中"
                )


def main():
    print("=" * 50)
    print("DragonWorld Seed 数据验证器")
    print("=" * 50)

    rooms = load_yaml_files(ROOMS_DIR)
    agents = load_yaml_files(AGENTS_DIR)
    objects = load_yaml_files(OBJECTS_DIR)

    print(f"加载房间: {len(rooms)} 个")
    print(f"加载角色: {len(agents)} 个")
    print(f"加载物品: {len(objects)} 个")
    print()

    validate_rooms(rooms)
    validate_agents(agents, rooms)
    validate_objects(objects, rooms)
    validate_room_agent_object_consistency(rooms, agents, objects)

    # 检查双向连通性（可选）
    for rid, data in rooms.items():
        for direction, target in data.get("exits", {}).items():
            target_room = rooms.get(target)
            if target_room:
                # 简单的反向检查：不要求严格对称，但给出警告
                reverse_map = {"north": "south", "south": "north",
                               "east": "west", "west": "east",
                               "up": "down", "down": "up"}
                reverse = reverse_map.get(direction)
                if reverse and target_room.get("exits", {}).get(reverse) != rid:
                    warnings.append(
                        f"房间 {rid} -> {direction} -> {target}，"
                        f"但 {target} 没有反向出口 {reverse} -> {rid}"
                    )

    if warnings:
        print(f"⚠️  警告 ({len(warnings)} 条):")
        for w in warnings:
            print(f"  - {w}")
        print()

    if errors:
        print(f"❌ 错误 ({len(errors)} 条):")
        for e in errors:
            print(f"  - {e}")
        print()
        print("验证失败，请修复上述错误。")
        sys.exit(1)
    else:
        print("✅ 所有 seed 数据验证通过！")
        if warnings:
            print("（存在警告，但不影响基本运行）")
        sys.exit(0)


if __name__ == "__main__":
    main()
