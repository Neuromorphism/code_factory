# Tournament Artifact arena-smoke

- Created: 2026-04-05T05:12:26.304Z
- Tournament: tournament-5dc77e39
- League style: Build-It Break-It Fix-It
- Personas enabled: no
- Fix rounds enabled: yes

## Overall

- Solo Builder: composite score 32
- Pipeline Five-Stage: composite score 8

## Build-It Break-It Fix-It

- Pipeline Five-Stage: {"team":"Pipeline Five-Stage","shipScore":0,"breakBonus":12,"fixRecovery":0,"unresolvedPenalty":0,"totalScore":12}
- Solo Builder: {"team":"Solo Builder","shipScore":2,"breakBonus":0,"fixRecovery":0,"unresolvedPenalty":8,"totalScore":-6}

## Season

- Pipeline Five-Stage: 44 season points, 3 wins, 5 podiums
- Solo Builder: 41 season points, 2 wins, 5 podiums

## Persona Comparison

```json
{
  "batchId": "arena-smoke",
  "baselineOverall": [
    {
      "strategyId": "solo_builder",
      "label": "Solo Builder",
      "compositeScore": 32
    },
    {
      "strategyId": "pipeline_five_stage",
      "label": "Pipeline Five-Stage",
      "compositeScore": 8
    }
  ],
  "personaOverall": [
    {
      "strategyId": "solo_builder",
      "label": "Solo Builder",
      "compositeScore": 46
    },
    {
      "strategyId": "pipeline_five_stage",
      "label": "Pipeline Five-Stage",
      "compositeScore": 0
    }
  ]
}
```

## Raw Summary

```json
{
  "builders": [
    {
      "strategyId": "solo_builder",
      "label": "Solo Builder",
      "tasks": 1,
      "totalBuildScore": 2,
      "hiddenPasses": 0,
      "visiblePasses": 1,
      "totalDurationMs": 5256
    },
    {
      "strategyId": "pipeline_five_stage",
      "label": "Pipeline Five-Stage",
      "tasks": 1,
      "totalBuildScore": 0,
      "hiddenPasses": 0,
      "visiblePasses": 0,
      "totalDurationMs": 12283
    }
  ],
  "breakers": [
    {
      "strategyId": "breaker_solo",
      "label": "Solo Breaker",
      "attempts": 2,
      "successfulBreaks": 1,
      "family": "breaker",
      "totalDurationMs": 8552
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
      "strategyId": "pipeline_five_stage",
      "label": "Pipeline Five-Stage",
      "attacksFaced": 2,
      "successfulBreaksAgainstIt": 0,
      "recoveredBreaks": 0,
      "remainingBreaksAfterFix": 0
    },
    {
      "strategyId": "solo_builder",
      "label": "Solo Builder",
      "attacksFaced": 2,
      "successfulBreaksAgainstIt": 2,
      "recoveredBreaks": 0,
      "remainingBreaksAfterFix": 2
    }
  ],
  "swapAttackers": [
    {
      "strategyId": "pipeline_five_stage",
      "label": "Pipeline Five-Stage",
      "swapMatches": 1,
      "successfulBreaks": 1
    },
    {
      "strategyId": "solo_builder",
      "label": "Solo Builder",
      "swapMatches": 1,
      "successfulBreaks": 0
    }
  ],
  "fixers": [
    {
      "strategyId": "solo_builder",
      "label": "Solo Builder",
      "rounds": 1,
      "confirmedFailures": 2,
      "recoveredBreaks": 0,
      "remainingBreaks": 2,
      "retainedHiddenPasses": 0
    }
  ],
  "arenas": [
    {
      "strategyId": "solo_builder",
      "label": "Solo Builder",
      "arenaEvents": 1,
      "arenaPoints": 36,
      "arenaWins": 12,
      "arenaLosses": 0
    },
    {
      "strategyId": "pipeline_five_stage",
      "label": "Pipeline Five-Stage",
      "arenaEvents": 1,
      "arenaPoints": 0,
      "arenaWins": 0,
      "arenaLosses": 12
    }
  ],
  "overall": [
    {
      "strategyId": "solo_builder",
      "label": "Solo Builder",
      "compositeScore": 32
    },
    {
      "strategyId": "pipeline_five_stage",
      "label": "Pipeline Five-Stage",
      "compositeScore": 8
    }
  ]
}
```
