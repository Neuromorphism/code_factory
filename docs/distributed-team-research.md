# Distributed Team Research

## Goal

Add agent-team strategies that borrow coordination ideas from decentralized systems instead of defaulting to a manager with specialists.

## Protocols used

- `Universalist Solo`
  - not distributed, but it is the control case for "make one agent do everything well"
  - inspired by self-refinement loops rather than team coordination
  - implementation goal: one strong agent internally executes spec, plan, implementation, QA, review, and repair before returning

- `Blackboard Collective`
  - inspired by blackboard architectures and distributed blackboard variants
  - coordination model: every peer sees the full task and opportunistically updates a shared board
  - useful property: agents can contribute without waiting for a leader to assign work

- `Gossip Mesh`
  - inspired by epidemic or gossip protocols
  - coordination model: peers exchange compact digests of what they know until the team converges
  - useful property: robust under partial, stale, or delayed local views

- `CRDT Mesh`
  - inspired by conflict-free replicated data types
  - coordination model: peers append monotonic facts, tests, issues, and changes that can merge without central arbitration
  - useful property: leaderless convergence from independently produced local state

- `Consensus Bundle Collective`
  - inspired by decentralized auction and bundle-allocation methods
  - coordination model: each peer claims the most valuable remaining contribution and reconciles with others through a shared claim ledger
  - useful property: explicit local task selection without a standing planner role

- `Gossip Breaker Mesh`
  - decentralized adversarial team
  - coordination model: share exploit hypotheses and keep only cases that survive distributed peer scrutiny

- `Stigmergy Test Hive`
  - inspired by stigmergy and swarm coordination
  - coordination model: peers reinforce promising test directions by leaving traces in a shared environment
  - useful property: under-tested edges attract more effort without central scheduling

## Source notes

- Distributed blackboard
  - https://link.springer.com/article/10.1007/s10846-015-0275-2
  - abstract emphasizes distributed blackboards with boundary rules as coordination points while minimizing replication traffic

- Gossip / epidemic propagation
  - https://doi.org/10.1145/43921.43922
  - classic epidemic algorithms paper: simple randomized propagation drives replicas toward convergence without central control

- CRDTs
  - https://webarchive.di.uminho.pt/haslab.uminho.pt/cbm/publications/comprehensive-study-convergent-and-commutative-replicated-data-types.html
  - eventual consistency through merge-safe replicated data types rather than foreground synchronization

- Contract Net Protocol
  - https://dblp.org/rec/journals/tc/Smith80a
  - classic distributed problem-solving protocol based on local task announcements and bids

- Consensus-based bundle allocation
  - https://doi.org/10.1109/TRO.2009.2022423
  - decentralized auction plus local consensus for conflict-free task allocation

## Expected hypotheses

- `Universalist Solo` may win on simple tasks where coordination overhead is pure cost.
- `Blackboard Collective` should improve when the problem benefits from shared tests and repair notes.
- `Gossip Mesh` may be more robust than a rigid pipeline when some agents produce noisy intermediate reasoning.
- `CRDT Mesh` may help on tasks where monotonic accumulation of invariants and edge cases matters more than a single elegant plan.
- `Consensus Bundle Collective` may pay off on mixed tasks where design, QA, and implementation value shifts over time.
- `Gossip Breaker Mesh` and `Stigmergy Test Hive` should be tested against stronger builders because they are designed to increase adversarial pressure rather than raw build throughput.
