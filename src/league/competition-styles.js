export const COMPETITION_STYLES = [
  {
    id: "icpc_sprint",
    label: "ICPC Sprint",
    inspiration: "ICPC-style multi-problem onsite contest",
    sourceUrl: "https://ec.na.icpc.global/rules-info/",
    venueTheme: "onsite finals hall",
    summary:
      "Rank by problems solved, then lowest penalty time. Penalty is based on completion time plus failed-attempt cost.",
    scoring: {
      type: "solved_then_penalty",
      wrongAttemptPenaltyMinutes: 20,
      scoreboardFreezeMinutes: 60
    }
  },
  {
    id: "topcoder_marathon",
    label: "Topcoder Marathon",
    inspiration: "Topcoder provisional then hidden system testing",
    sourceUrl: "https://help.topcoder.com/hc/en-us/articles/24954728938011-Marathon-Matches-MM",
    venueTheme: "online ladder arena",
    summary:
      "Use provisional scores during the coding phase, then final standings after hidden-case system testing.",
    scoring: {
      type: "provisional_then_final",
      leaderboardMode: "iterative"
    }
  },
  {
    id: "srm_challenge",
    label: "SRM Challenge",
    inspiration: "Topcoder SRM challenge phase",
    sourceUrl: "https://help.topcoder.com/hc/en-us/articles/24954129102491-Single-Round-Matches-SRMs",
    venueTheme: "challenge phase arena",
    summary:
      "Score build performance, then award challenge bonuses for breaking opponent solutions during the attack phase.",
    scoring: {
      type: "build_plus_challenge",
      successfulChallengePoints: 10,
      failedChallengePenalty: 5
    }
  },
  {
    id: "hacker_cup_round",
    label: "Hacker Cup Round",
    inspiration: "Meta Hacker Cup fixed-round algorithm contest",
    sourceUrl: "https://www.facebook.com/codingcompetitions/hacker-cup/",
    venueTheme: "fixed-round remote finals",
    summary:
      "Rank by hidden test completion and then total completion time, emphasizing clean correctness under a fixed round clock.",
    scoring: {
      type: "correctness_then_time"
    }
  },
  {
    id: "bibifi_showdown",
    label: "Build-It Break-It Fix-It",
    inspiration: "Build-it, Break-it, Fix-it secure software contest",
    sourceUrl: "https://www.usenix.org/conference/usenixsecurity20/presentation/greenberg",
    venueTheme: "security gauntlet",
    summary:
      "Teams score for shipping working code, earning verified breaks, and recovering functionality in a fix round after adversarial exchange.",
    scoring: {
      type: "build_break_fix",
      shipWeight: 1,
      breakWeight: 12,
      fixRecoveryWeight: 6,
      unresolvedBreakPenalty: 4
    }
  },
  {
    id: "aixcc_patch_race",
    label: "AIxCC Patch Race",
    inspiration: "DARPA AI Cyber Challenge patch-and-attack scoring",
    sourceUrl: "https://www.darpa.mil/research/programs/cyber-grand-challenge",
    venueTheme: "autonomous offense-defense arena",
    summary:
      "Prioritize maintaining functionality while patching vulnerabilities quickly, with secondary credit for finding and exploiting weaknesses.",
    scoring: {
      type: "availability_security_patch",
      patchWeight: 3,
      breakWeight: 1,
      availabilityWeight: 2
    }
  }
];

export function listCompetitionStyles() {
  return COMPETITION_STYLES;
}

export function getCompetitionStyle(styleId) {
  return COMPETITION_STYLES.find((style) => style.id === styleId) ?? null;
}
