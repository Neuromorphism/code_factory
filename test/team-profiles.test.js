import test from "node:test";
import assert from "node:assert/strict";
import { assignProfile, listTeamProfiles } from "../src/league/team-profiles.js";

test("team profiles provide reusable backstories for persona experiments", () => {
  assert.ok(listTeamProfiles().length >= 4);
  const profile = assignProfile("solo_builder", 0);
  assert.equal(profile.teamName, "Pixel Forge");
  assert.equal(profile.assignedToStrategyId, "solo_builder");
});
