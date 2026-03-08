---
type: blog_post
title: "Why the Game Logic Runs on the Server: Lessons from Building Multiplayer Pong"
publishedAt: 2026-03-01T10:00:00.000Z
tags:
  - websockets
  - django
  - python
  - architecture
platformVariants:
  linkedin: "One of the most interesting decisions in the transcend project: Pong physics run in Python on the server, then get mirrored to JavaScript for rendering. Client-side rendering of server-authoritative state — a pattern that solves cheating, desync, and replay all at once."
---

[transcend](https://github.com/andresmejiaro/transcend) is a full-stack multiplayer Pong application — Django backend, vanilla JS frontend, WebSockets throughout, OAuth, tournaments, a friend system, and a curses-based CLI client that speaks the same protocol as the browser. 617 commits.

The most interesting architectural decision was where to run the game physics.

## The Problem With Client-Side Physics

The naive approach to multiplayer games: run the physics in the browser, send state updates to the server, broadcast to other players. It's easy to implement. It's also trivially exploitable — any client that controls its own physics can move the paddle anywhere, report any ball position, and the server has no way to tell the difference from normal play.

For a school project this doesn't matter. For anything real, it does. And getting the architecture right once is better than retrofitting it later.

## Server-Authoritative Physics

In transcend, the Pong game logic — `Ball`, `Paddle`, `MovingRectangle`, `Player`, `Game` — runs in Python on the server inside Django Channels WebSocket consumers. The server is the canonical source of truth for all game state.

The JavaScript frontend doesn't simulate physics. It renders what the server tells it. The client sends inputs (paddle direction); the server applies them, advances the simulation, and pushes the resulting state to all connected clients.

This means:
- **No cheating** — clients can't manipulate ball position or score
- **No desync** — there's one simulation, not two trying to stay in sync
- **Replay is trivial** — record server state, play it back

The tradeoff is latency sensitivity. The round-trip between input and rendered response goes through the server. For Pong, at LAN or low-latency internet, this is imperceptible. For a fast-twitch FPS, you'd need client-side prediction layered on top.

## The JavaScript Mirror

The JS side has a mirrored implementation of the Pong physics. It doesn't run the authoritative simulation — it's used for rendering interpolation and local prediction to smooth out the visual experience between server updates.

The authoritative state comes from the server. The client smooths the animation between frames. Same pattern used in every major multiplayer game engine; we just did it from scratch.

## Four WebSocket Consumers

The real-time infrastructure is split across four Django Channels consumers:

- **`gameconsumer`** — active game session, paddle inputs in, state out
- **`gameconsumerasbride`** — bridges between game instances (spectating, replays)
- **`lobbyconsumer`** — friend invites, match setup, notifications
- **`tournamentconsumer`** — bracket management, match progression

Each consumer handles a distinct real-time flow. Keeping them separate meant we could evolve the tournament logic without touching the game loop, and add notifications without touching the game state.

## Custom JWT From Scratch

The auth layer doesn't use a JWT library — `jwt/sign.py`, `jwt/decode.py`, and `jwt/verify.py` are hand-rolled. This was a project requirement (42 school pushes you to implement rather than import), but it taught something real: JWT is not magic. It's a base64-encoded header and payload plus an HMAC signature. Understanding that makes you better at evaluating libraries that do it for you.

## The CLI Client

The thing I'm most proud of in this project: a separate CLI client written in Python curses that speaks the same HTTP and WebSocket protocol as the browser.

It has its own MVC structure, its own window manager, its own login flow, and it can actually play Pong — in a terminal. It even has ASCII art textures.

Building the CLI client forced us to think of the API as a real contract, not just something the browser happened to call. If the CLI can authenticate, join a lobby, start a game, and play, the backend is genuinely protocol-correct. It was the best integration test we had.
