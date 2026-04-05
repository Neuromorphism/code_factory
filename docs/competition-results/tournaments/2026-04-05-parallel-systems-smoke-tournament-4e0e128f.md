# Tournament Artifact parallel-systems-smoke

- Created: 2026-04-05T18:46:23.746Z
- Tournament: tournament-4e0e128f
- League style: ICPC Sprint
- Personas enabled: no
- Fix rounds enabled: yes

## Overall

- Universalist Solo: composite score 107
- Collab Pod Builder: composite score 97
- Parallel Clone Swarm: composite score 20
- Blackboard Collective: composite score -1
- Consensus Bundle Collective: composite score -1

## ICPC Sprint

- Universalist Solo: {"team":"Universalist Solo","solved":0,"penaltyMinutes":121}
- Blackboard Collective: {"team":"Blackboard Collective","solved":0,"penaltyMinutes":141}
- Parallel Clone Swarm: {"team":"Parallel Clone Swarm","solved":0,"penaltyMinutes":142}
- Collab Pod Builder: {"team":"Collab Pod Builder","solved":0,"penaltyMinutes":142}
- Consensus Bundle Collective: {"team":"Consensus Bundle Collective","solved":0,"penaltyMinutes":161}

## Season

- Universalist Solo: 47 season points, 4 wins, 5 podiums
- Collab Pod Builder: 32 season points, 1 wins, 4 podiums
- Parallel Clone Swarm: 27 season points, 0 wins, 5 podiums
- Blackboard Collective: 17 season points, 0 wins, 1 podiums
- Consensus Bundle Collective: 12 season points, 0 wins, 0 podiums

## Raw Summary

```json
{
  "builders": [
    {
      "strategyId": "universalist_solo",
      "label": "Universalist Solo",
      "tasks": 1,
      "totalBuildScore": 5,
      "hiddenPasses": 1,
      "visiblePasses": 1,
      "totalDurationMs": 9995
    },
    {
      "strategyId": "blackboard_collective",
      "label": "Blackboard Collective",
      "tasks": 1,
      "totalBuildScore": 2,
      "hiddenPasses": 0,
      "visiblePasses": 1,
      "totalDurationMs": 29693
    },
    {
      "strategyId": "parallel_clone_swarm",
      "label": "Parallel Clone Swarm",
      "tasks": 1,
      "totalBuildScore": 2,
      "hiddenPasses": 0,
      "visiblePasses": 1,
      "totalDurationMs": 65466
    },
    {
      "strategyId": "collab_pod_builder",
      "label": "Collab Pod Builder",
      "tasks": 1,
      "totalBuildScore": 2,
      "hiddenPasses": 0,
      "visiblePasses": 1,
      "totalDurationMs": 73129
    },
    {
      "strategyId": "consensus_bundle_collective",
      "label": "Consensus Bundle Collective",
      "tasks": 1,
      "totalBuildScore": 0,
      "hiddenPasses": 0,
      "visiblePasses": 0,
      "totalDurationMs": 16133
    }
  ],
  "breakers": [
    {
      "strategyId": "gossip_breaker_mesh",
      "label": "Gossip Breaker Mesh",
      "attempts": 5,
      "successfulBreaks": 11,
      "family": "breaker",
      "totalDurationMs": 44505
    },
    {
      "strategyId": "test_mesh",
      "label": "Test Mesh",
      "attempts": 5,
      "successfulBreaks": 10,
      "family": "tester",
      "totalDurationMs": 53999
    },
    {
      "strategyId": "break_squad",
      "label": "Break Squad",
      "attempts": 5,
      "successfulBreaks": 7,
      "family": "breaker",
      "totalDurationMs": 64736
    },
    {
      "strategyId": "breaker_solo",
      "label": "Solo Breaker",
      "attempts": 5,
      "successfulBreaks": 0,
      "family": "breaker",
      "totalDurationMs": 0
    }
  ],
  "defenses": [
    {
      "strategyId": "universalist_solo",
      "label": "Universalist Solo",
      "attacksFaced": 8,
      "successfulBreaksAgainstIt": 6,
      "recoveredBreaks": 0,
      "remainingBreaksAfterFix": 6
    },
    {
      "strategyId": "collab_pod_builder",
      "label": "Collab Pod Builder",
      "attacksFaced": 8,
      "successfulBreaksAgainstIt": 11,
      "recoveredBreaks": 4,
      "remainingBreaksAfterFix": 7
    },
    {
      "strategyId": "blackboard_collective",
      "label": "Blackboard Collective",
      "attacksFaced": 8,
      "successfulBreaksAgainstIt": 17,
      "recoveredBreaks": 0,
      "remainingBreaksAfterFix": 17
    },
    {
      "strategyId": "parallel_clone_swarm",
      "label": "Parallel Clone Swarm",
      "attacksFaced": 8,
      "successfulBreaksAgainstIt": 18,
      "recoveredBreaks": 0,
      "remainingBreaksAfterFix": 18
    },
    {
      "strategyId": "consensus_bundle_collective",
      "label": "Consensus Bundle Collective",
      "attacksFaced": 8,
      "successfulBreaksAgainstIt": 27,
      "recoveredBreaks": 1,
      "remainingBreaksAfterFix": 26
    }
  ],
  "swapAttackers": [
    {
      "strategyId": "universalist_solo",
      "label": "Universalist Solo",
      "swapMatches": 4,
      "successfulBreaks": 15
    },
    {
      "strategyId": "collab_pod_builder",
      "label": "Collab Pod Builder",
      "swapMatches": 4,
      "successfulBreaks": 12
    },
    {
      "strategyId": "consensus_bundle_collective",
      "label": "Consensus Bundle Collective",
      "swapMatches": 4,
      "successfulBreaks": 9
    },
    {
      "strategyId": "parallel_clone_swarm",
      "label": "Parallel Clone Swarm",
      "swapMatches": 4,
      "successfulBreaks": 9
    },
    {
      "strategyId": "blackboard_collective",
      "label": "Blackboard Collective",
      "swapMatches": 4,
      "successfulBreaks": 6
    }
  ],
  "fixers": [
    {
      "strategyId": "collab_pod_builder",
      "label": "Collab Pod Builder",
      "rounds": 1,
      "confirmedFailures": 11,
      "recoveredBreaks": 4,
      "remainingBreaks": 7,
      "retainedHiddenPasses": 1
    },
    {
      "strategyId": "consensus_bundle_collective",
      "label": "Consensus Bundle Collective",
      "rounds": 1,
      "confirmedFailures": 27,
      "recoveredBreaks": 1,
      "remainingBreaks": 26,
      "retainedHiddenPasses": 0
    },
    {
      "strategyId": "universalist_solo",
      "label": "Universalist Solo",
      "rounds": 1,
      "confirmedFailures": 6,
      "recoveredBreaks": 0,
      "remainingBreaks": 6,
      "retainedHiddenPasses": 1
    },
    {
      "strategyId": "blackboard_collective",
      "label": "Blackboard Collective",
      "rounds": 1,
      "confirmedFailures": 17,
      "recoveredBreaks": 0,
      "remainingBreaks": 17,
      "retainedHiddenPasses": 0
    },
    {
      "strategyId": "parallel_clone_swarm",
      "label": "Parallel Clone Swarm",
      "rounds": 1,
      "confirmedFailures": 18,
      "recoveredBreaks": 0,
      "remainingBreaks": 18,
      "retainedHiddenPasses": 0
    }
  ],
  "arenas": [
    {
      "strategyId": "universalist_solo",
      "label": "Universalist Solo",
      "arenaEvents": 0,
      "arenaPoints": 0,
      "arenaWins": 0,
      "arenaLosses": 0
    },
    {
      "strategyId": "blackboard_collective",
      "label": "Blackboard Collective",
      "arenaEvents": 0,
      "arenaPoints": 0,
      "arenaWins": 0,
      "arenaLosses": 0
    },
    {
      "strategyId": "consensus_bundle_collective",
      "label": "Consensus Bundle Collective",
      "arenaEvents": 0,
      "arenaPoints": 0,
      "arenaWins": 0,
      "arenaLosses": 0
    },
    {
      "strategyId": "parallel_clone_swarm",
      "label": "Parallel Clone Swarm",
      "arenaEvents": 0,
      "arenaPoints": 0,
      "arenaWins": 0,
      "arenaLosses": 0
    },
    {
      "strategyId": "collab_pod_builder",
      "label": "Collab Pod Builder",
      "arenaEvents": 0,
      "arenaPoints": 0,
      "arenaWins": 0,
      "arenaLosses": 0
    }
  ],
  "overall": [
    {
      "strategyId": "universalist_solo",
      "label": "Universalist Solo",
      "compositeScore": 107
    },
    {
      "strategyId": "collab_pod_builder",
      "label": "Collab Pod Builder",
      "compositeScore": 97
    },
    {
      "strategyId": "parallel_clone_swarm",
      "label": "Parallel Clone Swarm",
      "compositeScore": 20
    },
    {
      "strategyId": "blackboard_collective",
      "label": "Blackboard Collective",
      "compositeScore": -1
    },
    {
      "strategyId": "consensus_bundle_collective",
      "label": "Consensus Bundle Collective",
      "compositeScore": -1
    }
  ]
}
```
