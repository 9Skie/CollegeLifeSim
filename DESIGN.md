# College Life Simulator — Design Document

A 3-week multiplayer party game where 3–12 players secretly plan their college lives one slot at a time, balancing four stats — Academics, Social, Wellbeing, Money — while navigating events, hidden traits, and each other.

Inspired by Jackbox: everyone joins a room with a 4-letter code, plays on their own laptop, and the game runs ~30–45 minutes.

---

## Part 1 — Game Mechanics

### 1.0 Number Grid (hard rule)

**Every value in this game is a multiple of 0.25.** Allowed deltas: `0.25, 0.5, 0.75, 1` (and their negatives). After every modifier (outcome tier × repetition penalty × event/trait), the final delta is **rounded to the nearest 0.25** before being applied to a stat.

### 1.1 Calendar

- **3 weeks × 7 days × 3 slots = 63 actions per player**
- Slots: **Morning · Afternoon · Night**
- Players batch-submit one full day at a time → 21 day-submissions per player
- Class days: Monday–Thursday
- **Week 1:** no exam
- **Week 2 end:** Midterm
- **Week 3 end:** Final

### 1.2 Stats (4 total)

All stats use a **0–10 scale in 0.25 steps**. Every effect in the game is a multiple of 0.25 (allowed deltas: `0.25, 0.5, 0.75, 1, …`). After all modifiers stack, the final delta is **rounded to the nearest 0.25** before being applied.

| Stat | Start | Display | Daily decay |
|---|---|---|---|
| Academics | 1.0 | bar `0.0–10.0` | −0.5 |
| Social | 1.0 | bar `0.0–10.0` | −0.5 |
| Wellbeing | 5.0 | bar `0.0–10.0` | −0.5 |
| Money | 2.0 | bar `0.0–10.0` with `$25 / $50` spend labels | −1 _(= $25)_ |

- **Wellbeing 0 → eliminated** (final score 0).
- **Character creation:** each player gets **3 free points** to distribute. 1 point = +1 to any stat. No cap on starting allocation.
- Current `web` prototype uses these starting values directly in `CharacterSetup.tsx` and `DayView.tsx`.

### 1.3 Relationships

Per-pair, hidden, range 0–3.

| Level | Multiplier on shared actions |
|---|---|
| 0 | 1.0× |
| 1 | 1.25× |
| 2 | 1.5× |
| 3 | 1.75× |

Each player only sees their own row. Multipliers chosen so that base × rel-mult lands cleanly on the 0.25 grid after rounding.

### 1.4 Outcome System (Bad / Normal / Good)

Every action resolves into one of three tiers:

- **Bad** → base × **0.5**
- **Normal** → base × **1**
- **Good** → base × **1.5**

**Outcome odds are linear in current Wellbeing:**

- Normal: always 60%
- Bad % = 40 × (1 − Wellbeing/10)
- Good % = 40 × (Wellbeing/10)

| Wellbeing | Bad | Normal | Good |
|---|---|---|---|
| 10 | 0% | 60% | 40% |
| 7.5 | 10% | 60% | 30% |
| 5 (start) | 20% | 60% | 20% |
| 2.5 | 30% | 60% | 10% |
| 0.5 | 38% | 60% | 2% |
| 0 | 💀 eliminated, score 0 |

Modifier order on each action: **outcome tier → relationship multiplier → event modifiers → trait modifiers → repetition penalty → round to nearest 0.25 → apply.**

### 1.5 Action Menu

**Actions never reduce stats.** Only daily decay, bad Wildcard cards, skipping class, missed homework quota, broke penalty, no-sleep penalty, and exam failures can reduce stats.

#### Morning slot

| Action | Base effect | Cost | Notes |
|---|---|---|---|
| Study (solo) | Academics +1 | — | |
| Study Together (target) | Academics +0.75, Social +0.5 | — | Half if mismatched |
| Work | Money +1 _($25)_ | — | Day-slot only; picker availability is currently class-gated |
| Exercise | Wellbeing +1 | — | Morning/Afternoon only |
| Socialize Free (target) | Social +1 | $0 | Half if mismatched |
| Socialize Coffee (target) | Social +1.25 | $25 (1 Money) | Half if mismatched, money still spent |
| Socialize Dinner (target) | Social +1.5 | $50 (2 Money) | Half if mismatched, money still spent |
| Rest | Wellbeing +0.5 | — | Day recovery |
| Wildcard | random card OR redeem event code | — | 1/day cap |
| Class | Academics +0.75, Social +0.25 | — | Shown when a class is scheduled in that slot |

#### Afternoon slot

Same as Morning.

| Action | Base effect | Notes |
|---|---|---|
| Class | Academics +0.75, Social +0.25 | Selectable when player has class this slot |
| Skip Class | Academics −0.5 | Any non-Class pick in a class slot counts as skipping |

#### Night slot

| Action | Base effect | Cost | Notes |
|---|---|---|---|
| Study (solo) | Academics +1 | — | |
| Study Together (target) | Academics +0.75, Social +0.5 | — | |
| Socialize Free (target) | Social +1 | $0 | |
| Socialize Coffee (target) | Social +1.25 | $25 | |
| Socialize Dinner (target) | Social +1.5 | $50 | |
| Sleep | Wellbeing +1 | — | Night-only — see No-Sleep penalty |
| Wildcard | random card OR redeem event code | — | |

(No Class, Work, or Exercise at night.)

### 1.6 Class Schedule

Each player gets **3 random class sessions** placed across the **Mon–Thu morning/afternoon grid** (4 days × 2 slots = 8 candidate cells).

Generation rule:
- Pick **3 distinct days** from {Mon, Tue, Wed, Thu}
- For each chosen day, randomly assign **morning OR afternoon** as the class slot
- **Never two classes on the same day**
- Schedules are personalized → coordination friction for Study Together / Socialize

Effects:
- **Class**: Academics +0.75, Social +0.25
- **Skip Class**: Academics −0.5 (any non-Class action selected in a class slot counts as skipping)
- **Work × Class conflict:** the current picker suppresses some Work options around class availability; exact slot exposure is still provisional in the prototype.

### 1.7 Sleep & No-Sleep Penalty

- Sleep is **night-only**, gives Wellbeing +1.
- **If your Night slot is NOT Sleep, end-of-day Wellbeing + −1.5 extra** (on top of the −0.5 daily decay).
- Net effect of an all-nighter day: Wellbeing −2.0 vs. a normal-sleep day's −0.5.

### 1.8 Mutual-Confirm Shared Actions

**Socialize (any tier) and Study Together** require picking a target player.

- Both must pick each other in the **same slot** to match
- **Match** → full effect, +1 relationship progress (every 2 progress = +1 relationship level, max 3)
- **Mismatch** → 50% effect, no relationship gain, money still spent

### 1.9 Same-Day Repetition Penalty

Per day, per action type:

| Use # that day | Effectiveness multiplier |
|---|---|
| 1st | × 1.0 |
| 2nd | × 0.5 |
| 3rd | × 0.25 |

Applied **after** the outcome tier multiplier. Final delta is rounded to the nearest 0.25 before apply. Counted per action type — the three Socialize tiers count as one type.

### 1.10 Daily Decay

Applied at the end of each day, after action effects:

| Stat | Decay |
|---|---|
| Academics | −0.5 |
| Social | −0.5 |
| Wellbeing | −0.5 |
| Money | −1 _(= $25)_ |

**Broke penalty:** if Money clamps at 0, **additional Wellbeing −1.5 that day** (on top of the −0.5 base). Coffee/Dinner Socialize unavailable when Money < cost.

### 1.11 Homework Quota

- **4 Studies required per week** (solo Study OR Study Together; Class does NOT count)
- Penalty applied at end of week:

| Studies completed | Penalty |
|---|---|
| 4+ | none |
| 3 | Academics −0.5 |
| 2 | Academics −1 |
| 1 | Academics −1.5 |
| 0 | Academics −2 |

### 1.12 Exams

Exam result reuses the Bad/Normal/Good roll, but on a different input:

**Effective Exam Wellbeing = (current Wellbeing + current Academics) / 2**

That value sets the Bad/Normal/Good odds (same linear formula as actions in §1.4).

| Exam | Bad | Normal | Good |
|---|---|---|---|
| Midterm (end Wk2) | Academics −1 | ±0 | Academics +1 |
| Final (end Wk3) | Academics −2 | ±0 | Academics +2 |

### 1.13 Wildcard Deck (21 cards)

If you hold no event code, Wildcard pulls a random card. If you hold a code, the slot becomes "Attend [Event Name]" instead.

**Distribution (intentional variance):** 6 big-positive, 6 small-positive, 3 neutral, 3 small-negative, 3 big-negative.

- **Small positive** ≈ effect of one normal action (~+1 to a stat).
- **Big positive** ≈ ~2× a normal action (+2, or +1/+1 split).
- **Small negative** ≈ −1 to a stat.
- **Big negative** ≈ −2 to a stat.
- **Neutral** = mixed or nothing.

Wildcard pulls **bypass the Bad/Normal/Good roll** — the card *is* the outcome.

| # | Name | Tier | Effect |
|---|---|---|---|
| 1 | Eureka Moment | + big | Academics +2 |
| 2 | Viral Post | + big | Social +2 |
| 3 | Runner's High | + big | Wellbeing +2 |
| 4 | Scratch-Off Win | + big | Money +2 _($50)_ |
| 5 | Karma Day | + big | Social +1, Wellbeing +1 |
| 6 | Side Hustle Pops | + big | Money +1, Academics +1 |
| 7 | Cracked the Concept | + small | Academics +1 |
| 8 | Great Convo | + small | Social +1 |
| 9 | Productive Walk | + small | Wellbeing +1 |
| 10 | Found a Twenty | + small | Money +1 _($25)_ |
| 11 | Free Cafeteria Meal | + small | Wellbeing +0.5, Money +0.5 |
| 12 | Dorm Pizza Run | + small | Social +0.5, Wellbeing +0.5 |
| 13 | Doomscrolled | neutral | nothing happens |
| 14 | Mixed Bag | neutral | +1 random stat, −0.5 different random stat |
| 15 | Phone Call Home | neutral | Wellbeing +0.5 OR −0.5 (50/50) |
| 16 | Caught a Cold | − small | Wellbeing −1 |
| 17 | Pickpocketed | − small | Money −1 _($25)_ |
| 18 | Awkward Drama | − small | Social −1 |
| 19 | Mono Outbreak | − big | Wellbeing −2 |
| 20 | Wallet Stolen | − big | Money −2 _($50)_ |
| 21 | Public Embarrassment | − big | Social −2 |

### 1.14 Events

The full design has **20 public events + 20 private events**. **Each game session samples 10 of each** from the respective deck and distributes them across the 21 days. Different sessions see different event mixes for variety.

#### 1.14a Public (Major) Events — 20 in deck, 10 sampled per session

Announced to the whole room at day start. Don't consume a slot — apply as multipliers / passives on specific action types for that one day. Multiple public events can fire on the same day.

| # | Name | Affects | Modifier |
|---|---|---|---|
| 1 | Heatwave | Exercise | outcome ×0.5 |
| 2 | Cram Season _(Wk2 only)_ | Study, Study Together | outcome ×1.5 |
| 3 | Frat Row Block Party | Socialize (night) | outcome ×1.5 |
| 4 | Campus Power Outage | Study (morning) | outcome ×0.5 |
| 5 | Hiring Spree | Work | outcome ×1.5 |
| 6 | Wellness Week | Rest, Sleep | outcome ×1.5 |
| 7 | Snow Day | Class | cancelled — no skip penalty |
| 8 | Group Project Assigned | Study Together | outcome ×1.5 |
| 9 | Flu Outbreak | passive | Wellbeing decay −1.5 today |
| 10 | Surprise Pop Quiz | passive | Studied yesterday → Academics +0.5; else Academics −0.5 |
| 11 | Sunny Quad Day | Exercise | outcome ×1.5 |
| 12 | Career Fair | Work | outcome ×1.5; Work also gives Academics +0.25 |
| 13 | Tuition Bill Due | passive | All players Money −1 today |
| 14 | Coffee Shop Promo | Socialize Coffee | cost waived today |
| 15 | Library Renovation | Study (solo) | outcome ×0.5 |
| 16 | Homecoming Weekend | All Socialize tiers | outcome ×1.25 |
| 17 | Roommate Drama _(targeted)_ | passive | Random player: Wellbeing −0.5 |
| 18 | Cafeteria Food Poisoning | Rest | outcome ×0.5 |
| 19 | Spring Sun Spell | Rest, Exercise | outcome ×1.25 (both) |
| 20 | Midterm Stress Wave _(Wk2 only)_ | passive | Wellbeing decay −1.5 today |

#### 1.14b Private Events — 20 in deck, 10 sampled per session

Sampled events are dealt as **codes** to a small subset of players (3–5 players, depending on lobby size) on the day they fire. Effects target ≈ **1.75× a normal action** on the relevant stat.

**One-hop sharing:** original holder may pass code to ONE other player; recipient cannot re-share. Redeeming costs a Wildcard slot.

**Most events have a prerequisite** the holder must meet to redeem (stat threshold, major restriction, or target requirement). If the prereq fails, the slot is wasted.

| # | Name | Prerequisite | Effect |
|---|---|---|---|
| 1 | Secret Study Group | Academics ≥ 3 | Academics +1.75 |
| 2 | Underground Poker | Money ≥ 2 | Money +3 OR Money −2 _(Wellbeing roll)_ |
| 3 | VIP Concert | Social ≥ 3 | Social +1.75, Wellbeing +0.5 |
| 4 | Office Hours Invite | CS / Pre-Med major | Academics +2, costs $25 |
| 5 | Greek Mixer | Business / Arts major | Social +1.75 |
| 6 | Insider Internship | Academics ≥ 5 | Money +1.75 |
| 7 | Research Lab Invite | CS / Pre-Med, Academics ≥ 4 | Academics +1.75 |
| 8 | Brand Deal Slide-In | Social ≥ 6 | Money +1.75 |
| 9 | House Party | Social ≥ 2 | Social +1.5, Wellbeing +0.25 |
| 10 | Date Night | needs target, Rel ≥ 1 | Both: Social +1, Wellbeing +0.75, +1 Rel progress |
| 11 | Tutoring Gig | Academics ≥ 4 | Money +1.5, Academics +0.25 |
| 12 | Sketchy Crypto Tip | Money ≥ 3 | Money +3 OR Money −2 _(roll)_ |
| 13 | Senior Mentor Coffee | none | Academics +1, Social +0.75 |
| 14 | Pre-Game Hookup Party | Social ≥ 4 | Social +1.5, Wellbeing −0.5 |
| 15 | Late-Night Diner | none | Social +1, Wellbeing +0.75, costs $25 |
| 16 | Gym Buddy Pact | Wellbeing ≥ 4 | Wellbeing +1.75 |
| 17 | Frat Pledge Night | Business major | Social +1.75, Wellbeing −0.5 |
| 18 | Open Mic Performance | Arts major, Social ≥ 3 | Social +1.75 |
| 19 | Underground Art Show | Arts major | Social +1, Wellbeing +0.75 |
| 20 | Family Emergency | none | Money −1, Wellbeing +1 _(perspective)_ |

### 1.15 Majors (5)

Each player is randomly assigned a major at character creation. Majors do two things:
1. Determine the **scoring weights** at end of game.
2. Determine **eligibility** for major-restricted private events.

Weights sum to 10:

| Major | wA | wS | wW | wM | Private event tag(s) |
|---|---|---|---|---|---|
| Computer Science | 4 | 1 | 2 | 3 | CS / Pre-Med |
| Business | 2 | 3 | 2 | 3 | Business / Arts |
| Pre-Med | 4 | 1 | 4 | 1 | CS / Pre-Med |
| Arts / Media | 1 | 4 | 3 | 2 | Business / Arts |
| Undecided | 2.5 | 2.5 | 2.5 | 2.5 | any |

### 1.16 Traits (1 positive + 1 negative per player, randomly dealt)

Visible only to the owner via the side panel.

#### Positive (20)

| # | Name | Effect |
|---|---|---|
| 1 | Night Owl | Night-slot actions: outcome ×1.25 |
| 2 | Disciplined | Study never rolls Bad |
| 3 | Charismatic | Successful Socialize: +0.25 extra Social |
| 4 | Athletic | Exercise: outcome ×1.5 |
| 5 | Penny-Pincher | Daily Money decay −0.5 instead of −1 |
| 6 | Early Bird | Morning-slot actions: outcome ×1.25 |
| 7 | Quick Study | Good Study outcomes give +0.25 extra Academics |
| 8 | Lucky | Once per day, re-roll one Bad outcome |
| 9 | Networker | Study Together: +0.25 extra Social on success |
| 10 | Trust Fund Kid | +1 starting Money |
| 11 | Resilient | First time Wellbeing would hit 0, set to 1 instead |
| 12 | Influencer | At Social ≥ 7, gain +0.25 Social passive each day |
| 13 | Bookworm | Solo Study: +0.25 extra Academics |
| 14 | Gym Rat | Exercise also gives +0.25 Social |
| 15 | Study Buddy | Study Together never rolls Bad |
| 16 | Optimist | Wellbeing decay −0.25 instead of −0.75 |
| 17 | Adaptable | Same-day repetition penalty does not apply |
| 18 | Hustler | Work: outcome ×1.25 |
| 19 | Connected | Start Wk1 with 1 free private event code |
| 20 | Charmer | Free Socialize match treated as Coffee-tier effect |

#### Negative (20)

| # | Name | Effect |
|---|---|---|
| 1 | FOMO | If anyone Socializes and you don't that day: Wellbeing −0.5 |
| 2 | Anxious | Mismatched shared actions: Wellbeing −0.5 |
| 3 | Couch Potato | Exercise rolls Bad 50% regardless of Wellbeing |
| 4 | Broke Family | Start with Money 0 |
| 5 | Sickly | Wellbeing decay −1.25 instead of −0.75 |
| 6 | Procrastinator | First Study each week is auto-Bad |
| 7 | Loose Lips | Event codes you receive auto-leak to 1 random other player |
| 8 | Penny-Wise | Coffee/Dinner Socialize give Free-tier effect (money still spent) |
| 9 | Loner | Successful shared actions: outcome ×0.75 |
| 10 | Insomniac | Sleep: outcome ×0.5 |
| 11 | Hot-Headed | Mismatched shared actions cost 1 Relationship progress |
| 12 | Distracted | Class gives only Academics +0.25 (not +0.75) |
| 13 | Spendthrift | Daily Money decay −1.5 instead of −1 |
| 14 | Pessimist | Your Good rolls become Normal |
| 15 | Hypochondriac | At Wellbeing ≤ 4, +10% Bad chance on all actions |
| 16 | Heartbreaker | Cannot reach Relationship Lvl 3 with anyone |
| 17 | Forgetful | 1 random class per week is auto-skipped |
| 18 | Phone Addict | Wildcard never pulls a positive-tier card |
| 19 | Burnout-Prone | Studying 2 days in a row → Wellbeing −1 the second day |
| 20 | Allergic | Exercise Wellbeing gain halved |

### 1.17 Achievements (15, hidden until end)

Hidden during play. Revealed at end ceremony with flat score bonus.

| # | Name | Condition | Bonus |
|---|---|---|---|
| 1 | Dean's List | Academics ≥ 9 at end | +5 |
| 2 | Famous | Social ≥ 9 at end | +5 |
| 3 | Drop-Out Rich | Money ≥ 9 at end | +5 |
| 4 | Zen Master | Wellbeing ≥ 9 at end | +5 |
| 5 | Best Friends Forever | Reach Rel 3 with any player | +3 |
| 6 | Survivor | Wellbeing dipped < 2 then recovered to ≥ 6 | +5 |
| 7 | Broke But Alive | Hit Money 0, finish alive | +3 |
| 8 | Internship Landed | Insider Internship redeemed + Academics ≥ 7 | +4 |
| 9 | Locked In | Never skipped a class | +3 |
| 10 | Networker | Successful Socialize with 4+ different players | +4 |
| 11 | Researcher | Research Lab Invite redeemed + Academics ≥ 8 | +5 |
| 12 | Heartthrob | Reach Rel 2 with 3+ players | +3 |
| 13 | Renaissance Student | All four stats ≥ 6 at end | +6 |
| 14 | Master of One | Any single stat = 10 | +5 |
| 15 | Hustler King | Money = 10 at end | +6 |

### 1.18 Final Score Formula

```
Score = (Academics  × wA)
      + (Social     × wS)
      + (Wellbeing  × wW)
      + (Money      × wM)
      + (Best Relationship Level × 2)
      + Σ Achievement Bonuses
```

All four stats share the same 0–10 scale, so no normalization on Money.

Eliminated players (Wellbeing 0): final score = 0.

### 1.19 Day Resolution Pipeline

Once all players submit a day:

1. **Validate** each submitted action (slot legal, work-vs-class, money sufficient, target exists, etc.)
2. **Resolve mutual-confirm** matches for Socialize / Study Together / Date Night
3. **Roll outcome tiers** per action using current Wellbeing
4. **Apply modifiers in order:** outcome × relationship × event × trait × repetition penalty → **round to nearest 0.25** → apply
5. **Apply paid Socialize money cost** (cost is paid even on mismatch / Bad)
6. **Apply daily decay** (−0.75 to Academics/Social/Wellbeing, −1 to Money)
7. **No-sleep penalty:** if Night ≠ Sleep, Wellbeing −1.5 extra
8. **Broke penalty:** if Money clamped to 0, additional Wellbeing −1.5 on top of base decay
9. **Check elimination** (Wellbeing ≤ 0 → out, score locked at 0)
10. **End-of-week checks:** homework quota → Academics penalty
11. **Exam check:** end of Wk2 → Midterm; end of Wk3 → Final
12. **Pick 5 highlights** from the day's eligible events (Bad / Good outcomes only — Normal is silent — plus all wildcard pulls, event firings, mismatches, no-sleep, broke, eliminations, exam Bad/Good)
13. **Broadcast resolution animation** to all players

### 1.21 Flavor Text Pool

End of each day, the server picks **5 highlights** from the day's notable events. **Only Bad and Good outcomes are eligible for highlights** — Normal outcomes are silent, since they're the boring baseline. Mix of public and private lines (private lines only render on the involved player's screen; others see a redacted "Sam had a moment…" placeholder).

Each entry in the pool has **3–6 hand-written variants** with `{name}`, `{target}`, `{location}` placeholders. UI picks a random variant.

#### Highlight eligibility

A line is eligible for the daily 5-pick if it comes from:
- An action that rolled **Bad** or **Good** (not Normal)
- Any **Wildcard** pull
- Any **Public event** firing (announcement only)
- Any **Private event** redemption
- A **mutual-confirm mismatch** (Socialize, Study Together, Date Night, etc.)
- A **no-sleep**, **broke**, or **elimination** trigger
- An **exam** result that rolled **Bad** or **Good** (Normal exam = silent)

#### Coverage table

| Bucket | Variants needed | Count |
|---|---|---|
| Each action × {Bad, Good} | 3–6 each | ~11 actions × 2 ≈ 75 |
| Each wildcard (21) | 3–6 each | ~80 |
| Each public event (20) | 1–2 announcement lines | ~30 |
| Each private event (20) redeemed | 3–6 each | ~80 |
| Mutual-confirm mismatch _(generic + shared-event variants)_ | 10 generic | 10 |
| No-sleep penalty | 4 generic | 4 |
| Broke penalty | 4 generic | 4 |
| Elimination | 6 generic | 6 |
| Exam result × {Bad, Good} × {Midterm, Final} | 4 each | ~16 |
| **Total target** | | **~300 lines** |


#### Tone

Dorm-life specific, observational, slightly mean, never cruel. Examples per bucket below.

#### Examples — Action × Outcome

**Exercise — Bad**
- "{name} just wasn't having a good day — stubbed their toe on the treadmill and limped home."
- "{name} pulled something during squats and is going to feel that tomorrow."
- "{name} threw up in the gym water fountain. Gym is now closed."

**Exercise — Good**
- "{name} hit a new PR. They will not stop talking about it."
- "{name} ran past the engineering building three times for no reason. Vibes."

**Study — Bad**
- "{name} opened the textbook, read the same paragraph 11 times, and went to sleep."
- "{name} highlighted the entire page. That counts, right?"

**Socialize Free — Match, Good**
- "{name} and {target} got way too into a debate about pineapple on pizza. Bond formed."
- "{name} ran into {target} at the vending machine and they ended up talking for two hours."

**Socialize — Mismatch**
- "{name} waited at Starbucks for {target}, who was at the gym. Awkward."
- "{name} texted {target} 'we still on?' six times. {target} did not respond."

**Work — Normal**
- "{name} stocked shelves at the bookstore. The work is honest."
- "{name} pulled a closing shift at the dining hall. Smells like garlic now."

**Sleep — skipped (no-sleep penalty)**
- "{name} pulled an all-nighter. The sun rose. They saw God for a second."

#### Examples — Wildcards

**Pickpocketed**
- "{name} took a stroll downtown today and somehow found their wallet missing on the way back to the dorm."
- "{name}'s back pocket was lighter on the bus home. Classic."

**Caught a Cold**
- "{name} has been sniffling since 9am. Everyone is moving away from them."

**Eureka Moment**
- "{name} solved the problem in the shower. They're texting their group chat in caps."

**Doomscrolled**
- "{name} watched 47 minutes of dog videos and accomplished nothing else."

**Public Embarrassment**
- "{name} called the professor 'Mom' in front of the whole lecture hall."

#### Examples — Events

**Frat Row Block Party (announcement)**
- "Frat Row is going OFF tonight. Everyone heard the speakers from the library."

**Snow Day**
- "Two feet of snow. Class is cancelled. The dining hall is somehow still open."

**Office Hours Invite (private redeem)**
- "{name} sat in the professor's office for 45 minutes and walked out understanding everything."

**Underground Poker — bad roll**
- "{name} thought they had a flush. {name} did not have a flush."

#### Examples — Exam

**Final — Good**
- "{name} walked into the final, finished early, and walked out smiling. Suspicious."

**Final — Bad**
- "{name} stared at question 1 for 40 minutes and put 'C' for everything else."

> **Implementation note:** flavor pool lives in `data/flavor.ts` as `{ key: string; variants: string[] }[]`. Resolver emits a structured event log; UI joins log → flavor pool → renders.


---

## Part 2 — Web Design

### 2.1 Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI primitives | Custom components (shadcn/ui added as needed) |
| Realtime + DB | Supabase (Postgres + Realtime channels) — to be wired in next |
| Hosting | Vercel (frontend) + Supabase (DB) |
| Auth | None — name + 4-letter room code, identity persisted in `localStorage` |

Project lives at `/web` inside this repo. Old prototype (`game.js`, `index.html`) preserved at root for reference.

### 2.2 Design Tokens

Mood: dorm-room poster vibes — dark, warm, tactile. Not corporate SaaS.

| Token | Value | Use |
|---|---|---|
| `--background` | `#0e1014` | Page bg |
| `--foreground` | `#f4ead5` | Default text (paper) |
| `--paper` | `#f4ead5` | Bright text |
| `--ink` | `#1a1d23` | Text on light buttons |
| `--accent` | `#d94f4f` | Primary action (red) |
| `--accent-soft` | `#f0a868` | Secondary action (warm orange) |
| `--muted` | `#8a8579` | Secondary text |
| `--card` | `#181b21` | Card surface |
| `--card-border` | `#2a2e36` | Card outline |

Effects:
- Subtle SVG noise grain overlay on body (4% opacity)
- Radial gradient hints in corners (red top-left, orange bottom-right)
- Title `wobble` keyframe (6s ease-in-out)
- Buttons: `active:translate-y-0.5` for tactile press
- Code input: monospace, 0.5rem letter-spacing
- Typography currently uses system sans + system monospace stacks (no external font dependency in local dev)

### 2.3 Screens (8 total)

| # | Route | Status | Description |
|---|---|---|---|
| 1 | `/` | ✅ **Built** | Home — Create / Join |
| 2 | `/room/[code]` (lobby state) | 🟡 **Prototype built** | Lobby — players gather, copy code, host starts game |
| 3 | `/room/[code]` (setup state) | 🟡 **Prototype built** | Character setup — random major+traits, distribute 3 stat points |
| 4 | `/room/[code]` (day state) | 🟡 **Prototype built** | Day View — fill 3 slots, inspect sidebar, submit the day |
| 5 | `/room/[code]` (resolution state) | 🟡 **Prototype built** | Day Resolution — per-slot roulette, wildcard flip, stat animation, Next Day button |
| 6 | `/room/[code]` (exam state) | ⏳ | Exam screen — Midterm / Final reveal |
| 7 | `/room/[code]` (end state) | ⏳ | End reveal — achievements unveiled, scores, narrative phase |
| — | play sidebar | 🟡 **Prototype built** | Character info, stats, calendar, class/study trackers, relationships (mock data) |

The room route is a single page that switches sub-views by game state. In the current prototype, that state is local React state inside `app/room/[code]/page.tsx`; the planned server-backed version is still future work.

### 2.4 Built So Far

**`/` (Home)** — `app/page.tsx`
- Title with subtle wobble animation
- Two card buttons: Create Game / Join Game
- Inline form expansion (no modals) — clicking a card swaps content
- Create flow: name input → generates 4-letter code → navigates to `/room/[CODE]`
- Join flow: code input (auto-uppercase, A–Z only, 4 chars) + name → navigates
- Validation: name 1–20 chars, code exactly 4 letters
- Identity persisted to `localStorage` (`cls.name`, `cls.role`)

**`/room/[code]` (client room shell)** — `app/room/[code]/page.tsx`
- Client component with local phase state: `lobby` → `setup` → `day` → `resolution`
- Hydrates `cls.name` and `cls.role` from `localStorage`
- Lobby shows giant monospace room code with copy-to-clipboard interaction
- Player roster renders local player immediately and supports dev-only "Add test player"
- Start button unlocks at 3–12 players; host can advance into setup
- Leave button routes back to `/`

**Character Setup** — `app/room/[code]/CharacterSetup.tsx`
- Three roulette cards reveal Major, Positive Trait, and Negative Trait over staggered durations
- Revealed cards open into detail text and weight/effect summaries
- Players distribute exactly 3 stat points across Academics, Social, Wellbeing, Money
- Chosen major, traits, and allocated stats persist to `localStorage`

**Day View** — `app/room/[code]/DayView.tsx` and `ActionPicker.tsx`
- Left sidebar shows character summary, current stats, calendar, weekly trackers, and top relationships
- Main area shows a day header, mock player avatars, event banners, and three slot cards
- Action picking happens in a modal picker with target selection, spend tiers, wildcard once-per-day cap, and class-skip warning states
- Class/work conflict logic: when a slot has class, Study is replaced by Class, Study Together is removed, and Work is removed (or shifted to afternoon if morning has class)
- Stat preview bars show daily decay in dark red and projected gains in white when all 3 slots are filled
- Player status indicators ("Thinking…" / "Done") in top bar
- Current prototype uses seeded mock events, a mocked player list, and local-only submit flow into resolution

**Resolution Screen** — `app/room/[code]/ResolutionView.tsx`
- Sequential fade-in: morning → afternoon → night action cards, each paired with a vertical roulette tile (66px, deceleration animation over ~1.8s)
- Result badge (Bad / Normal / Good) appears inside each action card after roulette lands, with color-coded multiplier
- 3D rotateY wildcard card flip if Wildcard was played, showing event name, flavor text, and effect
- Animated stat bars transition from old → new values, with net change shown
- "Next Day" button appears immediately with the stats section (not blocked by any secondary content)
- All outcomes are deterministic (hash-based) for prototyping; no real random rolls yet

### 2.5 Identity & Room Codes

- Room code: 4 letters from `ABCDEFGHJKLMNPQRSTUVWXYZ` (skip I, O for visual clarity)
- No accounts. Identity = `(roomCode, playerId, name)` stored in `localStorage`
- `localStorage` keys currently used by the web app: `cls.name`, `cls.role`, `cls.major`, `cls.posTrait`, `cls.negTrait`, `cls.stats`
- Refresh-safe in the current prototype means local identity/character data survives reloads on the same browser
- Player count cap: 12 (UI scales to that)

### 2.6 State Model

Current prototype:
- Entirely client-local; no Supabase, no realtime channels, no shared room state yet
- Room phase lives in React state inside `app/room/[code]/page.tsx`
- Character identity and setup choices persist through `localStorage`
- Day view currently uses mocked player data, a hardcoded room seed, and local-only submission

Planned server-authoritative flow:

Server-authoritative. Flow:

```
Client → POST action → Server validates → Server resolves day →
Server broadcasts public state to room channel →
Server broadcasts private state to each player's private channel
```

Hidden info (your traits, your event codes, your action plans before submit) only sent to that player's private channel. Public state (room roster, current day, who has submitted, public events, resolution flavor lines) goes to the room channel.

### 2.7 Database Schema (planned)

```
rooms        (code PK, status, host_id, current_day, current_phase, created_at)
players      (id PK, room_code FK, name, major, pos_trait, neg_trait,
              academics, social, wellbeing, money,
              class_schedule jsonb, eliminated bool)
relationships (room_code, player_a, player_b, level, progress)
day_actions  (room_code, day, slot, player_id, action, target_id, money_spent, submitted_at)
events       (room_code, day, event_id, public bool, holders jsonb)
resolutions  (room_code, day, log jsonb)
```

### 2.8 Realtime Channels (planned)

- `room:{code}` — public state changes (player joined, day started, day resolved)
- `player:{playerId}` — private state changes (your traits revealed, event code received, action validated)

### 2.9 Day Resolution Animation

- Cherry-picks ~7 events from across all players' resolved actions
- Eligible events: Good rolls, Bad rolls, mismatched shared actions, Wildcard pulls, event attendance, eliminations, achievements unlocked (silent — surfaced at end)
- Pool of 200+ flavor lines, keyed by action + outcome + context
- Examples:
  - "Maya went studying but got absolutely demolished by a band partying nearby"
  - "Jake hit gold chatting up a stranger at Starbucks — instant connection"
  - "Sam tried to study together with Riley, but Riley was already at the gym. Awkward."
- Sequential reveal, ~3 seconds per line, with lightweight motion

### 2.10 Side Panel

Current prototype day view uses a **left sidebar** showing:

- Current stats (Academics, Social, Wellbeing, Money) with bars
- Day / week indicator
- Character identity plus clickable major / positive trait / negative trait cards
- Weekly class and study progress trackers
- Relationship rows for the top visible entries

Planned fuller version:
- Class schedule (the 3 randomly-placed slots)
- Hidden info: positive trait, negative trait, held event codes
- Relationship row: your relationship level with each other player
- Compact: takes ~25–30% of screen during play

### 2.11 Frontend Gaps (What's Missing Before Backend)

The prototype renders every screen, but most mechanical systems are **stubbed, mocked, or entirely absent**. Below is the delta between the current UI and the design intent.

| System | Design Intent | Current State |
|---|---|---|
| **Outcome randomness** | Wellbeing-scaled odds (§1.4), true random per-action | Fixed 20/60/20 distribution; deterministic hash-based "random" |
| **Trait effects** | 20 positive + 20 negative traits with mechanical impact (§1.16) | Traits are dealt and displayed but **do nothing** mechanically |
| **Relationship system** | Per-pair hidden 0–3 levels with multipliers on shared actions (§1.3, §1.8) | Sidebar shows a mock "Top 3" list; no real tracking, no mutual-confirm matching |
| **Mutual-confirm actions** | Both players must pick each other in the same slot to match (§1.8) | Target can be selected, but there is no match/mismatch resolution |
| **Same-day repetition penalty** | 2nd use of same action type = ×0.5, 3rd = ×0.25 (§1.9) | Not implemented |
| **No-sleep penalty** | Night ≠ Sleep → extra Wellbeing −1.5 (§1.7) | Not implemented |
| **Broke penalty** | Money clamps at 0 → extra Wellbeing −1.5 (§1.10) | Not implemented |
| **Homework quota** | 4 Studies required per week or Academics penalty (§1.11) | Not implemented; no weekly tracking |
| **Exams** | Midterm (Wk2) and Final (Wk3) with Bad/Normal/Good rolls (§1.12) | No exam screen built |
| **Achievements + final score** | 15 hidden achievements, weighted scoring by major (§1.15, §1.17, §1.18) | No end-of-game screen; no score calculation |
| **Public events** | 20-event deck, 10 sampled per session, announced at day start (§1.14a) | One mock event banner shown; no real event system |
| **Private events** | 20-event deck, dealt as codes to subset of players, one-hop shareable (§1.14b) | 6 hardcoded events in a flip card; no code-dealing, no prereq checks |
| **Wildcard deck** | 21 cards with defined distribution (§1.13) | Not implemented — Wildcard pulls from the 6 private events instead |
| **Flavor text / highlights** | ~300 lines, 5 highlights per day (§1.21, §2.9) | Briefly prototyped then removed; no narrative feedback on resolutions |
| **Day-to-day persistence** | Stats carry over; history accumulates | Stats reset to `localStorage` base every day; no history log |
| **Calendar / class visualization** | Visual schedule showing which upcoming days have class (§2.10) | Calendar is present but does not highlight class days |
| **Elimination** | Wellbeing ≤ 0 → out, score locked at 0 (§1.2) | Not implemented |
| **Major scoring weights** | wA/wS/wW/wM multipliers at endgame (§1.15) | Not used |
| **Money labels** | Displayed as `$25 / $50` spend tiers alongside 0–10 scale (§1.2) | Shows raw 0–10 numbers only |
| **Day counter / semester progress** | "Day X of 21" with week indicators (§1.1) | Shows "Day 1" statically; no progression concept |
| **Tutorial / onboarding** | First-time overlay explaining stats, slots, submission (was out-of-scope) | No tutorial; players are dropped in cold |

### 2.12 Out of Scope for v1

- Mobile-first layout (laptop-primary; mobile is best-effort)
- Spectator mode (eliminated players watch passively)
- Sound effects / music
- Public room browser
- Replay / save game
- Profanity filter on names
- Animation polish beyond the basics

---

## Part 3 — Build Status

| Task | Status |
|---|---|
| Design doc (this file) | ✅ |
| Logic spec — core loop | ✅ (this rev) |
| Logic spec — wildcards/events/majors/traits | ⏳ rebalance pending |
| Next.js project scaffolded | ✅ |
| Home screen built | ✅ |
| Dev server running on `localhost:3000` | ✅ |
| Room route shell | ✅ |
| Lobby screen | 🟡 prototype |
| Character setup | 🟡 prototype |
| Day view | 🟡 prototype |
| Day resolution | 🟡 prototype |
| Exam screen | ⏳ |
| End reveal | ⏳ |
| Side panel | 🟡 prototype |
| Supabase backend wired | ⏳ |
| 200+ flavor lines written | ⏳ |
| Vercel deployment | ⏳ |

## Part 4 — How to Run

```bash
cd web
npm run dev
# open http://localhost:3000
```

To stop: kill the running `next dev` process.
