---
type: blog_post
title: "Zappy AI: Behavior-Tree Swarm Coordination Without a Shared Map"
publishedAt: 2026-05-13T10:00:00.000Z
tags:
  - python
  - ai
  - behavior-trees
  - networking
  - "42"
platformVariants:
  linkedin: "Wrote up the AI system I built for the 42 Zappy project — a Python behavior-tree framework driving autonomous agents that coordinate without a shared map. The queen protocol turns relative broadcast directions into a practical coordination center. Full post on the site."
---

Zappy is a 42 team project. Four people, three components:

- **C++ game server** — [PepeSegura](https://github.com/PepeSegura) and [samuelcordero](https://github.com/samuelcordero) · [repo](https://github.com/PepeSegura/zappy)
- **Godot graphical client** — [Tagamydev](https://github.com/Tagamydev) · [repo](https://github.com/Tagamydev/ZAPPY_GC)
- **Python AI clients** — [andresmejiaro](https://github.com/andresmejiaro) · [repo](https://github.com/andresmejiaro/zappy_ai)

The server owns the protocol and game rules. The Godot client renders the world. My part was the AI — autonomous agents that must survive, gather resources, and coordinate level-ups without a shared map or coordinate system.

This post covers the behavior-tree framework and the swarm coordination design.

## The Core Problem

Most multi-agent coordination assumes either shared state or a common reference frame. Zappy provides neither. Broadcast messages tell you *which direction* a teammate's sound came from, but not their absolute position. Vision is partial: you see a 7-tile diamond around your agent. Each agent accumulates its own local map relative to its spawn point — two agents spawned at different corners of the map have entirely different coordinate systems.

The design had to work within those constraints rather than fight them.

## Behavior-Tree Architecture

I built a small behavior-tree framework in Python. Every node returns one of three states:

```python
S = "success"
F = "failure"
O = "ongoing"
```

The `ongoing` state is the key to handling async I/O. Zappy commands — `avance`, `voir`, `inventaire`, `prend`, `pose`, `fork`, `incantation` — are not instant. You send a command to the server over TCP and wait for a response: `ok`, `ko`, a vision payload, an inventory payload, or a level-up notification. The behavior tree must stay live while waiting. A node that issues a command returns `O` until the response arrives, then transitions to `S` or `F`.

### Node Types

**`AND`** — sequential execution without memory. Runs children left to right; fails fast on the first `F`. Used for steps that must all succeed and don't need to resume midway.

**`AND_P`** — sequential with memory. Stores a pointer to the current child so resumption picks up where it left off after an `O` return. Essential for multi-step plans like "move to tile, pick up resource, return to queen."

**`OR`** — priority selector. Tries children in order; succeeds on the first `S`. The top of the main decision tree is an `OR` over prioritized behaviors: survival first, then structural tasks, then role behavior.

**`LOGIC`** — boolean condition node. Wraps a pure Python predicate; returns `S` or `F` with no side effects. Used to guard subtrees without executing them.

**`GEN`** — dynamic plan generator. Evaluates at runtime to build a plan from the current agent state. Used for path planning and resource targeting, where the sequence of steps depends on what the agent currently knows.

**`GATE`** — stateful guard with explicit open and close conditions. Prevents hysteresis bugs. The hunger behavior is a `GATE`: it opens when food drops below a threshold and stays open until food is above a recovery level, so the agent doesn't rapidly toggle between eating and not eating.

**`Interaction`** — async command node. Sends one command to the server and registers a callback for the expected response type. Returns `O` until the response resolves it to `S` or `F`. All network I/O goes through this node.

### Top-Level Priority Tree

```
OR
├── GATE(food_critical) → eat behavior
├── LOGIC(slots_available) → fork subtree
├── LOGIC(level_1_pending) → first incantation subtree
├── LOGIC(broadcast_alive) → periodic alive ping
└── OR
    ├── LOGIC(is_queen) → queen behavior
    └── drone behavior
```

Each subtree is itself a tree of the node types above. The queen and drone subtrees differ mainly in how they respond to broadcast messages.

## Agent State Model

Each Python client maintains its own world model:

- **Position** — tracked relative to its own spawn point by integrating movement commands.
- **Direction** — facing tracked through explicit turn counts.
- **Local map** — tiles with resource counts and a last-seen timestamp. Old data is downweighted so the agent prefers re-exploring tiles it hasn't seen recently.
- **Inventory** — updated after each `inventaire` response.
- **Teammate registry** — records each known teammate's level, inventory, food status, and last broadcast timestamp. Teammates that go silent for too long are dropped from active consideration.
- **Broadcast queue** — incoming messages parsed as JSON, buffered and processed each tick.
- **Level-up state** — tracks whether the agent is gathering for an incantation, waiting for teammates, or executing one.
- **Fork state** — tracks whether the agent should fork on the next available turn.

Movement accounts for the toroidal map. When targeting a known tile, the agent evaluates all wrapped paths (direct and through each edge) and selects the shortest Chebyshev distance.

## Queen-Based Coordination

The hardest problem was coordination without a shared coordinate system.

My solution: the **queen protocol**. One agent assumes the queen role — typically the first agent to level up to 2. The queen becomes the team's operational center and periodically broadcasts structured JSON over the game's broadcast channel:

```json
{
  "type": "queen_status",
  "level": 3,
  "food": 18,
  "gathering_food": false,
  "team_needs": {"linemate": 2, "deraumere": 1},
  "level_up_list": ["player_3", "player_7"],
  "request_fork": true
}
```

Drones parse these broadcasts and use the **direction** the message arrived from as a "Marco Polo" signal. They don't need to know the queen's absolute coordinates — they just move toward the sound source, adjusting direction as new broadcasts arrive. When a drone is adjacent to the queen, it broadcasts a confirmation and the queen records it as "present."

This collapses the coordinate problem. The queen *is* the coordinate. The team doesn't need a global map; it needs a stable center it can move toward.

## Drone Behavior

Drone behavior is a priority `OR` over these subtrees:

1. **Survival** — if food estimate drops below threshold, find food immediately. The `GATE` node keeps this active until food recovers above a threshold, preventing thrashing.
2. **Follow queen** — move toward the last queen broadcast direction. Re-orients on each new broadcast.
3. **Gather** — if `team_needs` contains resources the drone doesn't have, search for them. Prefers known tiles; falls back to exploration via uncertainty mask (tiles not seen recently get higher priority).
4. **Return to queen** — if carrying needed resources, move back and drop them.
5. **Join incantation** — if the drone's name appears in `level_up_list`, move to the queen's totem tile and prepare.
6. **Fork** — if `request_fork` is true and the drone has a fork available, execute it.

Both the gathering and exploration plans are `GEN` nodes — the specific targets are computed at runtime from the current known map state.

## Level-Up Strategy

The queen aggregates teammate inventories and levels through broadcast messages. From that state, she computes the resource deficit for the next incantation tier — how many of each stone type are missing across the whole team.

When the deficit is covered and enough eligible players are nearby, the queen broadcasts a `level_up_list`. Selected drones move to the queen's totem and prepare. Before triggering the incantation, the queen checks food levels across the team: there is no point leveling up if half the team is about to starve.

Division of labor:
- The queen tracks needs, calls incantations, and manages forks.
- Drones gather, feed, return, and execute on command.
- Broadcast messages keep the swarm loosely synchronized without tight coupling.

## What I'd Change

The `AND_P` node stores a pointer inside the node itself. A cleaner approach would be to keep resumption state in the agent model rather than the tree, so emergency interrupts can cleanly discard a partial plan without leaving stale pointers.

The queen role assignment is also fragile — first-to-level-2 rather than any fitness criterion. An election protocol where the healthiest, most central agent takes the role (and can transfer it if the current queen dies or goes silent) would be more robust.

## Result

The final AI behaves like a cooperative swarm. Each client is autonomous, but the queen protocol gives the team a stable center of coordination. The behavior tree makes the decision system modular: survival, exploration, gathering, regrouping, forking, and leveling are separate subtrees that compose cleanly.

The design worked because it matched the actual constraints of the game — partial information, relative directions, no shared map — rather than trying to paper over them.

[Watch the gameplay video on YouTube](https://youtu.be/Z4MsLuqpKp8)

![zappy gameplay](/projects/zappy-linkedin-gameplay.gif)
