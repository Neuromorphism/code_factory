# Virtual League

## Goal

Turn raw agent-team experiments into league-style coding competitions that look and score more like real contests.

## Real-world inspirations

- ICPC-style sprints: teams solve as many problems as possible, ranked by problems solved and then penalty time. Regional rules and notes consistently use solved-count first and penalty time as the main tiebreak.
- Topcoder Marathon Matches: iterative provisional leaderboards followed by hidden final system testing.
- Topcoder SRM challenge phase: competitors can gain ground by breaking other competitors' solutions with valid counterexamples.
- Meta Hacker Cup and AtCoder-style rounds: fixed problem sets with correctness-first ranking and time as the key tiebreak.
- Build-it, Break-it, Fix-it: teams ship software, exchange attacks, then recover in a fix round.
- DARPA-style autonomous cyber competitions: offense, defense, and uptime all matter, not just raw correctness.

## Sources

- ICPC regional scoring examples and freeze behavior:
  - https://na.icpc.global/socal/what-to-expect/
  - https://ec.na.icpc.global/rules-info/
  - https://euc.icpc.global/home-2024/rules/
- Topcoder Marathon and SRM behavior:
  - https://www.topcoder.com/marathon-match-tournament/overview
  - https://help.topcoder.com/hc/en-us/articles/24954728938011-Marathon-Matches-MM
  - https://help.topcoder.com/hc/en-us/articles/24954129102491-Single-Round-Matches-SRMs
- AtCoder time and penalty conventions:
  - https://atcoder.jp/contests/agc041/rules
- Meta Hacker Cup context:
  - https://www.facebook.com/codingcompetitions/hacker-cup/
- Build-It Break-It Fix-It and secure development studies:
  - https://www.usenix.org/conference/usenixsecurity20/presentation/greenberg
- Autonomous cyber challenge context:
  - https://www.darpa.mil/research/programs/cyber-grand-challenge

## Prompt-pattern research inputs

- Multi-agent debate:
  - https://composable-models.github.io/llm_debate/
- Self-refinement loops:
  - https://www.sciencestack.ai/paper/2303.17651v2
- Role-play prompting / personas:
  - https://www.catalyzex.com/paper/better-zero-shot-reasoning-with-role-play

## League formats in code_factory

- `icpc_sprint`
  - multiple small problems
  - solved-count first
  - penalty minutes based on completion time and failed cases
- `topcoder_marathon`
  - provisional visible-case leaderboard
  - final hidden-case leaderboard
- `srm_challenge`
  - build score plus swap-attack challenge points
- `hacker_cup_round`
  - correctness first, total time second
- `bibifi_showdown`
  - build score plus verified break credit plus fix recovery
  - unresolved break penalties matter
- `aixcc_patch_race`
  - availability, patch recovery, swap attacks, and arena play all contribute

## Persona experiments

The league layer also supports optional team backstories and member personas. The immediate experiment question is simple:

- does a backstory improve build quality?
- does it help adversarial attacking?
- does it help testing more than building?

The initial implementation keeps personas lightweight: team identity, motto, and role-specific member flavor text are appended to prompts when persona mode is enabled. The current benchmark plan treats persona mode as an ablation, not an assumption: run the same batch with personas off and on, then compare builder, breaker, fix, and arena scores.
