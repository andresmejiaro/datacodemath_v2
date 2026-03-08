---
type: blog_post
title: "The Interpreter Pattern in RL: Your Agent Shouldn't Know What Game It's Playing"
publishedAt: 2026-02-22T10:00:00.000Z
tags:
  - reinforcement-learning
  - python
  - architecture
platformVariants:
  linkedin: "The design decision I'm most happy about in my Snake RL project: the agent has no idea it's playing Snake. It sees a state vector and returns an action index. The Interpreter translates. That separation made the whole thing easier to debug, tune, and understand."
---

When I built [slither](https://github.com/andresmejiaro/slither) — a Deep Q-Learning agent that learns to play Snake — the first design decision was the one that mattered most: the agent should have no idea what game it's playing.

This sounds like over-engineering for a Snake project. It isn't.

## The Four-File Architecture

The project is split across four main files, and the split is deliberate:

- **`Game.py`** — Pygame rendering and game rules. Knows what Snake is, what valid moves are, when the game ends, where the food is.
- **`Interpreter.py`** — converts raw game state (snake positions, food location, board dimensions) into a feature vector the agent can consume. Also computes the reward signal.
- **`Agent.py`** — a Deep Q-Network implemented in TensorFlow. Takes a state vector, returns an action index. Has no concept of Snake.
- **`Bill.py`** — the orchestrator. Runs the training loop, exhibition mode (`-exhibit`), or human play mode (`-play`).

The Interpreter is the seam. On one side: game state (concrete, visual, game-specific). On the other side: a tensor (abstract, numerical, model-ready).

## Why This Matters for Debugging

RL bugs are notoriously hard to find because training failures are silent. Loss curves that look reasonable can hide broken reward signals. The agent can appear to be learning while actually exploiting a quirk in how you encoded the state.

Keeping the Interpreter separate makes this category of bug easier to find. If the agent isn't learning, you check two things independently:

1. Is the state encoding actually informative? Log what the Interpreter produces and inspect it.
2. Is the reward signal correct? The Interpreter owns reward shaping — check it in isolation.

When everything lives in one class, these questions blur together.

## The Reward Signal Lives in the Interpreter

This is the non-obvious part. The reward function is not in the agent — it's in the Interpreter. The Interpreter knows the game state (before and after a step) and can compute the delta: did the snake eat, die, or get closer to food?

The agent receives a scalar and updates its Q-values accordingly. It doesn't know what "food" is.

That constraint keeps the agent genuinely general. Swap the Interpreter for a different game and the agent retrains on the new environment without changes.

## The Training Loop in Practice

`Bill.py` drives everything. The CLI supports three modes:

```
python main.py -sessions 100   # train for 100 sessions
python main.py -exhibit        # watch the trained model play
python main.py -play           # human plays
```

Trained weights are persisted to `models/` — you can interrupt training and resume without losing progress. Hyperparameters (learning rate α, discount factor γ) live in `game_settings.py`, separate from the training logic.

## What I'd Change

The Interpreter mixes two concerns: state encoding and reward shaping. They're related (both need game state) but they're different decisions. State encoding is about what information the agent receives; reward shaping is about what it's optimizing for. In a next version I'd split them.

But for a single-environment project, the current design is clean enough. The agent doesn't know what Snake is. That's the part that mattered.
