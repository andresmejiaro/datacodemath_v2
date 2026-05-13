---
type: activity
title: "zappy — networked game server walkthrough video"
publishedAt: 2026-05-13T10:00:00.000Z
tags:
  - c
  - networking
  - "42"
platformVariants:
  linkedin: "Made a walkthrough video of zappy — a 42 project where you build a networked tile-based game from scratch in C. Server handles multiple simultaneous clients over TCP, manages game state, and broadcasts updates in real time. AI clients (bots) run the actual gameplay: collecting resources, coordinating incantations to level up. The graphical client visualizes everything live. The interesting part isn't the game — it's keeping the server consistent when dozens of clients are hammering it at once. https://youtu.be/Z4MsLuqpKp8"
---

Made a walkthrough video of zappy — a 42 team project. C++ server by [PepeSegura](https://github.com/PepeSegura) and [samuelcordero](https://github.com/samuelcordero), Godot GUI by [Tagamydev](https://github.com/Tagamydev), Python AI by me.

The AI part: each client runs a custom behavior-tree that handles async TCP commands, partial vision, and no shared coordinate system. Coordination is solved through a queen protocol — drones use the broadcast message direction as a Marco Polo signal to regroup without ever sharing a map.

![zappy gameplay](/projects/zappy-linkedin-gameplay.gif)

[Watch on YouTube](https://youtu.be/Z4MsLuqpKp8) · [Full write-up](/posts/zappy-behavior-tree)
