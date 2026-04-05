# Competition Results

This directory stores competition-run artifacts that are intended to be committed and pushed as progress checkpoints.

Each benchmark run should generate in the top-level directory:

- one JSON summary for machines and follow-on automation,
- one Markdown summary for review in GitHub.

Tournament and virtual-league runs additionally generate under `docs/competition-results/tournaments`:

- one JSON artifact with tournament summaries, league standings, season standings, and optional persona-ablation data,
- one Markdown artifact with a PR-friendly scoreboard and narrative summary.

The intent is to let live competition progress land in Git incrementally so the GitHub PR becomes the review surface for both the harness and its ongoing benchmark results.
