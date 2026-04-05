# Tournament Artifact distributed-smoke

- Created: 2026-04-05T15:13:50.705Z
- Tournament: tournament-4df42a73
- League style: ICPC Sprint
- Personas enabled: no
- Fix rounds enabled: yes

## Overall

- Consensus Bundle Collective: composite score 34
- Blackboard Collective: composite score 33
- Gossip Mesh: composite score 22
- Universalist Solo: composite score 10
- CRDT Mesh: composite score 8

## ICPC Sprint

- Universalist Solo: {"team":"Universalist Solo","solved":1,"penaltyMinutes":1}
- Gossip Mesh: {"team":"Gossip Mesh","solved":1,"penaltyMinutes":1}
- Consensus Bundle Collective: {"team":"Consensus Bundle Collective","solved":1,"penaltyMinutes":1}
- CRDT Mesh: {"team":"CRDT Mesh","solved":0,"penaltyMinutes":41}
- Blackboard Collective: {"team":"Blackboard Collective","solved":0,"penaltyMinutes":61}

## Season

- Consensus Bundle Collective: 34 season points, 1 wins, 5 podiums
- Universalist Solo: 32 season points, 2 wins, 4 podiums
- Gossip Mesh: 32 season points, 1 wins, 4 podiums
- Blackboard Collective: 24 season points, 1 wins, 2 podiums
- CRDT Mesh: 13 season points, 0 wins, 0 podiums

## Raw Summary

```json
{
  "builders": [
    {
      "strategyId": "universalist_solo",
      "label": "Universalist Solo",
      "tasks": 1,
      "totalBuildScore": 10,
      "hiddenPasses": 2,
      "visiblePasses": 2,
      "totalDurationMs": 6315
    },
    {
      "strategyId": "gossip_mesh",
      "label": "Gossip Mesh",
      "tasks": 1,
      "totalBuildScore": 10,
      "hiddenPasses": 2,
      "visiblePasses": 2,
      "totalDurationMs": 11270
    },
    {
      "strategyId": "consensus_bundle_collective",
      "label": "Consensus Bundle Collective",
      "tasks": 1,
      "totalBuildScore": 10,
      "hiddenPasses": 2,
      "visiblePasses": 2,
      "totalDurationMs": 9520
    },
    {
      "strategyId": "blackboard_collective",
      "label": "Blackboard Collective",
      "tasks": 1,
      "totalBuildScore": 3,
      "hiddenPasses": 1,
      "visiblePasses": 0,
      "totalDurationMs": 13424
    },
    {
      "strategyId": "crdt_mesh",
      "label": "CRDT Mesh",
      "tasks": 1,
      "totalBuildScore": 0,
      "hiddenPasses": 0,
      "visiblePasses": 0,
      "totalDurationMs": 9551
    }
  ],
  "breakers": [
    {
      "strategyId": "gossip_breaker_mesh",
      "label": "Gossip Breaker Mesh",
      "attempts": 5,
      "successfulBreaks": 3,
      "family": "breaker",
      "totalDurationMs": 28536
    },
    {
      "strategyId": "stigmergy_test_hive",
      "label": "Stigmergy Test Hive",
      "attempts": 5,
      "successfulBreaks": 0,
      "family": "tester",
      "totalDurationMs": 35621
    }
  ],
  "defenses": [
    {
      "strategyId": "universalist_solo",
      "label": "Universalist Solo",
      "attacksFaced": 6,
      "successfulBreaksAgainstIt": 0,
      "recoveredBreaks": 0,
      "remainingBreaksAfterFix": 0
    },
    {
      "strategyId": "crdt_mesh",
      "label": "CRDT Mesh",
      "attacksFaced": 6,
      "successfulBreaksAgainstIt": 0,
      "recoveredBreaks": 0,
      "remainingBreaksAfterFix": 0
    },
    {
      "strategyId": "consensus_bundle_collective",
      "label": "Consensus Bundle Collective",
      "attacksFaced": 6,
      "successfulBreaksAgainstIt": 0,
      "recoveredBreaks": 0,
      "remainingBreaksAfterFix": 0
    },
    {
      "strategyId": "gossip_mesh",
      "label": "Gossip Mesh",
      "attacksFaced": 6,
      "successfulBreaksAgainstIt": 4,
      "recoveredBreaks": 0,
      "remainingBreaksAfterFix": 4
    },
    {
      "strategyId": "blackboard_collective",
      "label": "Blackboard Collective",
      "attacksFaced": 6,
      "successfulBreaksAgainstIt": 6,
      "recoveredBreaks": 6,
      "remainingBreaksAfterFix": 0
    }
  ],
  "swapAttackers": [
    {
      "strategyId": "gossip_mesh",
      "label": "Gossip Mesh",
      "swapMatches": 4,
      "successfulBreaks": 3
    },
    {
      "strategyId": "consensus_bundle_collective",
      "label": "Consensus Bundle Collective",
      "swapMatches": 4,
      "successfulBreaks": 3
    },
    {
      "strategyId": "crdt_mesh",
      "label": "CRDT Mesh",
      "swapMatches": 4,
      "successfulBreaks": 1
    },
    {
      "strategyId": "universalist_solo",
      "label": "Universalist Solo",
      "swapMatches": 4,
      "successfulBreaks": 0
    },
    {
      "strategyId": "blackboard_collective",
      "label": "Blackboard Collective",
      "swapMatches": 4,
      "successfulBreaks": 0
    }
  ],
  "fixers": [
    {
      "strategyId": "blackboard_collective",
      "label": "Blackboard Collective",
      "rounds": 1,
      "confirmedFailures": 6,
      "recoveredBreaks": 6,
      "remainingBreaks": 0,
      "retainedHiddenPasses": 2
    },
    {
      "strategyId": "gossip_mesh",
      "label": "Gossip Mesh",
      "rounds": 1,
      "confirmedFailures": 4,
      "recoveredBreaks": 0,
      "remainingBreaks": 4,
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
      "strategyId": "gossip_mesh",
      "label": "Gossip Mesh",
      "arenaEvents": 0,
      "arenaPoints": 0,
      "arenaWins": 0,
      "arenaLosses": 0
    },
    {
      "strategyId": "crdt_mesh",
      "label": "CRDT Mesh",
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
    }
  ],
  "overall": [
    {
      "strategyId": "consensus_bundle_collective",
      "label": "Consensus Bundle Collective",
      "compositeScore": 34
    },
    {
      "strategyId": "blackboard_collective",
      "label": "Blackboard Collective",
      "compositeScore": 33
    },
    {
      "strategyId": "gossip_mesh",
      "label": "Gossip Mesh",
      "compositeScore": 22
    },
    {
      "strategyId": "universalist_solo",
      "label": "Universalist Solo",
      "compositeScore": 10
    },
    {
      "strategyId": "crdt_mesh",
      "label": "CRDT Mesh",
      "compositeScore": 8
    }
  ]
}
```
