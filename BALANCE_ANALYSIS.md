# Math Analysis: Average Player Outcomes

## Constants
- Starting stats: Acad=3.0, Soc=3.0, Well=5.0, Money=2.0 ($50)
- Daily decay: Acad/Soc/Well = −0.75, Money = −1.0 ($25)
- At Wellbeing=5 (start): expected outcome multiplier = 1.0 (20%×0.5 + 60%×1 + 20%×1.5)
- 3 classes per week (Mon–Thu). 4 weekdays + 3 weekend days.

## Per-Slot Expected Gains (Wellbeing=5, 1st use)
| Action | Acad | Soc | Well | Money |
|---|---|---|---|---|
| Study | +1.0 | — | — | — |
| Class | +0.75 | +0.25 | — | — |
| Exercise | — | — | +1.0 | — |
| Sleep | — | — | +1.0 | — |
| Work | — | — | — | +1.0 ($25) |
| Soc Free | — | +0.50 | — | — |
| Soc Coffee | — | +0.75 | — | −1.0 ($25) |
| Soc Dinner | — | +1.00 | — | −2.0 ($50) |
| Night Soc Free | — | +0.75 | — | — |
| Night Soc Coffee | — | +1.00 | — | −1.0 |
| Night Soc Dinner | — | +1.25 | — | −2.0 |

---

## Scenario 1: “The Scholar” (Studies hard, sleeps, no social)

**Pattern:** 2× Study + Sleep on most days. Works sometimes to avoid broke.

### One Week (7 days)
- **3 class days:** Class + Study + Sleep
  - Gain: Acad +0.75 +1.0, Soc +0.25, Well +1.0
  - Decay: Acad −0.75, Soc −0.75, Well −0.75, Money −1.0
  - Net per day: Acad +1.0, Soc −0.5, Well +0.25, Money −1.0
- **1 non-class weekday:** Study + Study + Sleep
  - 2nd Study ×0.5 penalty = +0.5
  - Net: Acad +0.75, Soc −0.75, Well +0.25, Money −1.0
- **3 weekend days:** Study + Exercise + Sleep
  - Net: Acad +0.25, Soc −0.75, Well +1.25, Money −1.0

**Weekly Total**
| Stat | Δ |
|---|---|
| Acad | 3×(+1.0) + 1×(+0.75) + 3×(+0.25) = **+4.5** |
| Soc | 3×(−0.5) + 4×(−0.75) = **−4.5** |
| Well | 3×(+0.25) + 1×(+0.25) + 3×(+1.25) = **+4.75** |
| Money | 7×(−1.0) = **−7.0** |

**Result after Week 1**
- Acad: 3.0 → 7.5 ✅
- Soc: 3.0 → **−1.5** → 0 💀
- Well: 5.0 → 9.75 ✅
- Money: 2.0 → **−5.0** → 0 (broke by Day 2) 💀

---

## Scenario 2: “Sustainable Worker” (Works to avoid broke)

Replace 3 Study slots with Work:

**Weekly changes:**
- Lose 3× Study gains ≈ −2.25 Acad
- Gain 3× Work = +3.0 Money, offsetting 3 days of decay

**Adjusted Weekly Total**
| Stat | Δ |
|---|---|
| Acad | +4.5 − 2.25 = **+2.25** |
| Soc | **−4.5** |
| Well | **+4.75** |
| Money | −7.0 + 3.0 = **−4.0** |

**Result after Week 1**
- Acad: 3.0 → 5.25 ✅
- Soc: 3.0 → 0 💀
- Well: 5.0 → 9.75 ✅
- Money: 2.0 → **−2.0** → 0 (still broke) 💀

---

## Scenario 3: “Social Butterfly” (Tries to keep Soc alive)

Replace 2 Study slots with Free Socialize (day + night):

**Per socialize day:** Soc +0.5 (day) or +0.75 (night) −0.75 decay = −0.25 or 0
Actually worse: Soc +0.5 −0.75 decay = −0.25 net even on a socialize slot.

Let me try Weekend = 2× Socialize Free Night + Exercise + Sleep
- Night Free Soc: +0.75 Soc
- Decay: −0.75 Soc
- Net: **0** on social for that slot
- Plus decay from other slots...

Weekly total still ends with Soc ~−3.5 minimum. **Social is doomed to bleed out in 1 week unless you devote ALL slots to it.**

---

## Conclusion

| Question | Answer |
|---|---|
| Can a player grow ALL stats? | **No.** Decay hits 4 stats, you get 3 slots. |
| Can a player even maintain all stats? | **No.** 3 slots address maybe 3 stats, but repetition penalty and class schedule make it ~2.5 effectively. |
| Is Social viable as secondary stat? | **No.** Social gains are tiny (+0.5–1.25) vs decay (−0.75/day). Bleeds to 0 within a week. |
| Is Money viable without working daily? | **No.** Start at $50, lose $25/day. Broke by Day 3 if you ever skip work. |

**The economy is broken.** Players must choose between:
- Going broke (eliminated by Wellbeing penalty within 5 days)
- Working so much they can't build any stat effectively

---

## Recommended Fixes

### Fix A: Reduce decay on "covered" stats (soft specialization)
If you took an action affecting a stat today, it doesn't decay:
- Study/Class → skip Academics decay
- Socialize → skip Social decay  
- Exercise/Rest/Sleep → skip Wellbeing decay
- Money always decays (living costs)

**Effect:** Players naturally protect 2–3 stats. Opportunity cost is real but survivable.

### Fix B: Reduce base decay across the board
| Stat | Current | Proposed |
|---|---|---|
| Academics | −0.75 | −0.5 |
| Social | −0.75 | −0.5 |
| Wellbeing | −0.75 | −0.5 |
| Money | −1.0 | −0.75 |

**Effect:** Net positive growth possible for specialists, slight bleed for generalists. Social can survive with 1–2 slots/week.

### Fix C: Buff action bases (risk: inflation)
- Study +1 → Study +1.5
- But this is harder to keep on the 0.25 grid cleanly.

### Fix D: Reduce broke/no-sleep penalties
- Broke: Wellbeing −1.5 → Wellbeing −0.75 (same as base decay)
- No-sleep: Wellbeing −1.5 → Wellbeing −1.0

**Effect:** Lowers punishment floor so one mistake doesn't spiral.

**My recommendation: Fix B + Fix D.**
- Players feel progress when they specialize (slight net positive).
- Generalists tread water (slight net negative).
- Mistakes hurt but don't eliminate you in a week.
- Social can survive without consuming all slots.

With −0.5 decay:

**Revised “Scholar” Week (same pattern)**
- Acad: +4.5 − 3.5 = **+1.0** (was +4.5)
- Soc: −4.5 + 2.0 = **−2.5** (still bleeds, but slower)
- Well: +4.75 − 3.5 = **+1.25** (healthy)
- Money: −7.0 + 1.5 = **−5.5** (still broke) → needs Fix D or work pattern

Student works 2–3 days: Money −7 + 3 = −4 → still broke.

Hmm, Money still broken. Maybe Money decay should be −0.5 ($12.50) too:

With **ALL decay at −0.5**:
- Scholar who works 2 days: Money 2.0 − 3.5 + 2.0 = +0.5 per week → viable!
- Social who works 1 day + 2 socialize nights: Money 2.0 − 3.5 + 1.0 − 2.0 = −2.5 → needs 2 work days minimum.

This creates real choices without death spirals.
