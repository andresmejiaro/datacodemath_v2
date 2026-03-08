---
type: blog_post
title: "Backprop from Scratch: What You Learn When You Can't Use PyTorch"
publishedAt: 2026-02-15T10:00:00.000Z
tags:
  - machine-learning
  - python
  - neural-networks
platformVariants:
  linkedin: "Wrote about building a neural net from scratch — no PyTorch, no TensorFlow. The exercise forced me to understand what frameworks actually do, and why the chain rule isn't just a calculus fact but the thing your entire training loop depends on."
---

At some point every ML engineer reaches for `model.fit()` and stops thinking about what happens inside. That's fine for production. It's not fine if you don't know what you'd do if you couldn't use it.

The multilayer-perceptron project was a constraint: build a working feedforward network in Python, no ML frameworks. Forward pass, backpropagation, weight updates — all by hand.

## What the Architecture Looks Like

The project splits into four concerns:

- **`layer.py`** — a single network layer: weights, biases, activation function, and the math for both forward and backward pass
- **`training.py`** — the training loop: iterate over batches, forward pass, compute loss, backward pass, update weights
- **`predict.py`** — inference only, no gradient tracking
- **`preprocesing.py`** — normalization, train/test split, data prep before anything else touches it

That split is worth noting. It would have been easy to dump everything into one script. Keeping layers as a reusable unit is what lets you stack them without rewriting anything.

## Why the Chain Rule Is the Whole Thing

The forward pass is the easy part. You multiply weights by inputs, add biases, apply an activation. Repeat per layer. Not hard to implement.

The backward pass is where most tutorial implementations go wrong.

Backpropagation is the chain rule applied layer-by-layer. Each layer needs to:
1. Receive the gradient of the loss with respect to its output
2. Compute the gradient with respect to its weights (for the update)
3. Compute the gradient with respect to its input (to pass backwards to the previous layer)

If you mess up step 3, the gradients upstream are wrong and the network doesn't learn. The bug is invisible — loss just stops decreasing, or decreases too slowly. You don't get an error.

Implementing this by hand makes the chain rule concrete in a way that no tutorial does. You can't hand-wave it.

## The MNIST Sanity Check

The repo includes an `nmist_example/` directory with an end-to-end demo on the MNIST digit dataset. This is the right choice for a from-scratch implementation: MNIST is simple enough that you can verify it's working (decent accuracy on a held-out test set), but complex enough that a broken gradient calculation won't accidentally stumble into the right answer.

If your hand-rolled backprop is wrong, MNIST will not forgive it.

## What Frameworks Actually Do

After doing this once, using PyTorch feels different. You know that `loss.backward()` is traversing a computation graph and doing exactly what you just did manually, just faster and with autograd handling the chain rule automatically. You know why `.zero_grad()` is necessary. You know what `requires_grad=True` is telling the engine.

That's the value of the exercise. Not to avoid frameworks — use frameworks — but to know what you're giving up control of when you do.

The code is on [GitHub](https://github.com/andresmejiaro/multilayer-perceptron).
