# Tournament Artifact smoke

- Created: 2026-04-05T04:59:04.350Z
- Tournament: tournament-d2c65493
- League style: ICPC Sprint
- Personas enabled: no
- Fix rounds enabled: yes

## Overall

- Solo Builder: composite score 10
- Pipeline Five-Stage: composite score 10

## ICPC Sprint

- Solo Builder: {"team":"Solo Builder","solved":1,"penaltyMinutes":1}
- Pipeline Five-Stage: {"team":"Pipeline Five-Stage","solved":1,"penaltyMinutes":1}

## Season

- Solo Builder: 50 season points, 5 wins, 5 podiums
- Pipeline Five-Stage: 35 season points, 0 wins, 5 podiums

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
      "totalDurationMs": 2691
    },
    {
      "strategyId": "pipeline_five_stage",
      "label": "Pipeline Five-Stage",
      "tasks": 1,
      "totalBuildScore": 10,
      "hiddenPasses": 2,
      "visiblePasses": 2,
      "totalDurationMs": 11196
    }
  ],
  "breakers": [
    {
      "strategyId": "breaker_solo",
      "label": "Solo Breaker",
      "attempts": 2,
      "successfulBreaks": 0,
      "family": "breaker",
      "totalDurationMs": 5234
    },
    {
      "strategyId": "qa_fuzzer",
      "label": "QA Fuzzer",
      "attempts": 2,
      "successfulBreaks": 0,
      "family": "tester",
      "totalDurationMs": 23052
    }
  ],
  "defenses": [
    {
      "strategyId": "solo_builder",
      "label": "Solo Builder",
      "attacksFaced": 3,
      "successfulBreaksAgainstIt": 0,
      "recoveredBreaks": 0,
      "remainingBreaksAfterFix": 0
    },
    {
      "strategyId": "pipeline_five_stage",
      "label": "Pipeline Five-Stage",
      "attacksFaced": 3,
      "successfulBreaksAgainstIt": 0,
      "recoveredBreaks": 0,
      "remainingBreaksAfterFix": 0
    }
  ],
  "swapAttackers": [
    {
      "strategyId": "solo_builder",
      "label": "Solo Builder",
      "swapMatches": 1,
      "successfulBreaks": 0
    },
    {
      "strategyId": "pipeline_five_stage",
      "label": "Pipeline Five-Stage",
      "swapMatches": 1,
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
    },
    {
      "strategyId": "pipeline_five_stage",
      "label": "Pipeline Five-Stage",
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
    },
    {
      "strategyId": "pipeline_five_stage",
      "label": "Pipeline Five-Stage",
      "compositeScore": 10
    }
  ]
}
```
