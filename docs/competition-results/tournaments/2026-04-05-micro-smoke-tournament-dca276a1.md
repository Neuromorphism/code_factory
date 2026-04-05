# Tournament Artifact micro-smoke

- Created: 2026-04-05T04:58:47.859Z
- Tournament: tournament-dca276a1
- League style: ICPC Sprint
- Personas enabled: no
- Fix rounds enabled: yes

## Overall

- Solo Builder: composite score 10

## ICPC Sprint

- Solo Builder: {"team":"Solo Builder","solved":1,"penaltyMinutes":1}

## Season

- Solo Builder: 50 season points, 5 wins, 5 podiums

## Raw Summary

```json
{
  "builders": [
    {
      "strategyId": "solo_builder",
      "label": "Solo Builder",
      "tasks": 1,
      "totalBuildScore": 10,
      "hiddenPasses": 2,
      "visiblePasses": 2,
      "totalDurationMs": 2715
    }
  ],
  "breakers": [
    {
      "strategyId": "breaker_solo",
      "label": "Solo Breaker",
      "attempts": 1,
      "successfulBreaks": 0,
      "family": "breaker",
      "totalDurationMs": 6300
    },
    {
      "strategyId": "qa_fuzzer",
      "label": "QA Fuzzer",
      "attempts": 0,
      "successfulBreaks": 0,
      "family": "tester",
      "totalDurationMs": 0
    },
    {
      "strategyId": "test_mesh",
      "label": "Test Mesh",
      "attempts": 0,
      "successfulBreaks": 0,
      "family": "tester",
      "totalDurationMs": 0
    }
  ],
  "defenses": [
    {
      "strategyId": "solo_builder",
      "label": "Solo Builder",
      "attacksFaced": 1,
      "successfulBreaksAgainstIt": 0,
      "recoveredBreaks": 0,
      "remainingBreaksAfterFix": 0
    }
  ],
  "swapAttackers": [
    {
      "strategyId": "solo_builder",
      "label": "Solo Builder",
      "swapMatches": 0,
      "successfulBreaks": 0
    }
  ],
  "fixers": [],
  "arenas": [
    {
      "strategyId": "solo_builder",
      "label": "Solo Builder",
      "arenaEvents": 0,
      "arenaPoints": 0,
      "arenaWins": 0,
      "arenaLosses": 0
    }
  ],
  "overall": [
    {
      "strategyId": "solo_builder",
      "label": "Solo Builder",
      "compositeScore": 10
    }
  ]
}
```
