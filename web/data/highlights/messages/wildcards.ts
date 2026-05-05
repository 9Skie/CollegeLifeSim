// ------------------------------------------------------------------
// Wildcard Tier Messages — 10 per tier
// Template vars: {name}, {card}
// ------------------------------------------------------------------

export const WILDCARD_TIER_MESSAGES: Record<string, string[]> = {
  catastrophic: [
    "{name} pulled {card} and everything immediately went sideways.",
    "{name} drew {card}. The room held its breath. Then screamed.",
    "{name} played {card} and watched their plans crumble in real time.",
    "{name}'s {card} was a disaster so complete it became legend.",
    "{name} thought {card} would be funny. Nobody else did.",
    "{name} drew {card} and the professor stopped class to stare.",
    "{name}'s {card} backfired so hard they're considering transferring.",
    "{name} played {card} and single-handedly ruined their own week.",
    "{name} drew {card}. Campus security got involved.",
    "{name}'s {card} was the worst decision since skipping syllabus week.",
  ],

  bad: [
    "{name} drew {card}. Not great, not terrible. Actually, kind of terrible.",
    "{name} played {card} and the outcome was a solid shrug.",
    "{name}'s {card} did the bare minimum. And missed.",
    "{name} drew {card} and got exactly what they feared.",
    "{name} played {card} and immediately thought 'should've just studied.'",
    "{name}'s {card} was a swing and a miss. A big miss.",
    "{name} drew {card} and the universe said 'nah.'",
    "{name} played {card}. Could've been worse. But it was still bad.",
    "{name}'s {card} made a small problem into a medium problem.",
    "{name} drew {card} and learned a valuable lesson about hubris.",
  ],

  neutral: [
    "{name} played {card}. The room held its breath. Nothing happened.",
    "{name} drew {card} and the outcome was... fine. Just fine.",
    "{name}'s {card} was the definition of a wash.",
    "{name} played {card} and things stayed exactly as weird as before.",
    "{name} drew {card}. Not a win, not a loss. Just a thing that happened.",
    "{name}'s {card} confused everyone, including them.",
    "{name} played {card} and the universe shrugged.",
    "{name} drew {card}. Anticlimactic doesn't begin to cover it.",
    "{name}'s {card} changed nothing and everything at the same time.",
    "{name} played {card}. History books will not remember this.",
  ],

  good: [
    "{name} pulled {card} at exactly the right moment.",
    "{name} drew {card} and things actually started going their way.",
    "{name}'s {card} turned a boring day into a lucky break.",
    "{name} played {card} and the dominoes fell perfectly.",
    "{name} drew {card} and got exactly what they needed.",
    "{name}'s {card} was a calculated risk that paid off.",
    "{name} played {card} and the table cheered.",
    "{name} drew {card} and their luck finally turned around.",
    "{name}'s {card} opened a door they didn't even know existed.",
    "{name} played {card} and walked away looking like a genius.",
  ],

  amazing: [
    "{name} drew {card} and the whole campus is talking about it.",
    "{name} pulled {card} and became a legend before lunch.",
    "{name}'s {card} was so perfect people are asking if they cheated.",
    "{name} played {card} and everything just... clicked.",
    "{name} drew {card} and walked into the best day of their semester.",
    "{name}'s {card} was a masterstroke. Professors are impressed.",
    "{name} played {card} and accidentally solved three other problems.",
    "{name} drew {card} and their group chat hasn't stopped celebrating.",
    "{name}'s {card} was the kind of luck that makes you believe in something.",
    "{name} played {card} and now everyone wants to know their secret.",
  ],
};
