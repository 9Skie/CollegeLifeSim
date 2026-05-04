# Wildcard Deck Spec

This is the first-pass design spec for the room-based wildcard deck.

Source of truth for backend-ready metadata now lives in `web/data/wildcards.ts`.

- Total cards: `100`
- Model: true deck per room
- Draw behavior: drawn cards leave the room deck until reshuffle logic is defined
- Wildcards do not use codes
- Private events may later replace or share the same UI slot, but that logic is intentionally separate
- Gimmick cards should only affect the near future: the current day, the next action, the next day, or the next exam

## Metadata Shape

Each card now has backend-ready metadata in `web/data/wildcards.ts`:

- `id`
- `tier`
- `type`
- `title`
- `emoji`
- `description`
- `effectSummary`
- `duration`
- `targetStats`
- `immediate`
- `future`

## Tier Split

| Tier | Count | Notes |
|---|---:|---|
| Really Bad | 12 | Rare disasters, brutal setbacks, or harsh short-lived punishments |
| Bad | 25 | Consistent downside, awkward tradeoffs, or mild near-future penalties |
| Normal | 26 | Slightly better than a normal action, weird but fair |
| Good | 25 | Clearly rewarding, above a normal action |
| Really Good | 12 | Rare jackpots and premium short-term buffs |

## Really Bad (12)

| ID | Type | Title | Description | Effect |
|---|---|---|---|---|
| WC-001 | Stat | Academic Probation 📉 | A late-night portal check reveals that your academic situation is much worse than you thought. The panic does not help. | `Academics -2.0` |
| WC-002 | Stat | Food Poisoning 🤢 | Something from the dining hall wages biological warfare on your stomach. You spend the rest of the day regretting every life choice that led here. | `Wellbeing -2.0` |
| WC-003 | Stat | Wallet Gone 💸 | Somewhere between campus, the bus stop, and your dorm, your wallet stops existing. You will be reconstructing this disaster for days. | `Money -2.0` |
| WC-004 | Stat | Public Humiliation 😬 | You say something incredibly wrong in a crowded room and everyone remembers it longer than they should. The social fallout is immediate. | `Social -2.0` |
| WC-005 | Stat | Group Project Disaster 🧨 | Your teammates vanish, the document is empty, and the deadline is now. You absorb the consequences personally. | `Academics -1.0, Wellbeing -1.0` |
| WC-006 | Stat | ER Visit 🚑 | A dumb accident eats your time, your energy, and more money than you want to think about. Campus life continues without mercy. | `Money -1.0, Wellbeing -1.5` |
| WC-007 | Stat | Spiral Night 🌪️ | What starts as a little doomscrolling turns into a full emotional freefall. By sunrise you are somehow both tired and ashamed. | `Social -0.5, Wellbeing -1.5` |
| WC-008 | Stat | Dorm Flood 💧 | A pipe bursts or a ceiling leaks, and your room briefly becomes a shallow indoor pond. Cleanup costs money and your last nerve. | `Money -1.5, Wellbeing -0.5` |
| WC-009 | Stat | Identity Crisis 🫠 | You lose an entire evening staring at the ceiling and questioning your path, your major, and maybe your entire personality. | `Academics -0.5, Social -0.5, Wellbeing -1.0` |
| WC-010 | Gimmick | Blacklisted Shift 🚫 | You mouth off at the wrong supervisor and discover that service jobs have long memories. The punishment arrives the next time you try to work. | `Money -1.0`, and your `next Work gives 0 Money` |
| WC-011 | Gimmick | Professor Grudge 🧾 | You accidentally antagonize a professor who definitely keeps mental receipts. Their next impression of you is not going to be charitable. | `Academics -0.5`, and your `next Class gives -0.25 Academics instead of its normal gain` |
| WC-012 | Gimmick | Meltdown Week 🔥 | You hold it together just long enough for the week to end, and then everything catches up to you all at once. Tomorrow is going to feel heavier than usual. | `Wellbeing -1.0`, and your `next day adds an extra -0.5 Wellbeing decay` |

## Bad (25)

| ID | Type | Title | Description | Effect |
|---|---|---|---|---|
| WC-013 | Stat | Missed Alarm ⏰ | You wake up in a blind panic, already too late to salvage the plan you had. The day starts behind and never catches up. | `Academics -1.0` |
| WC-014 | Stat | Awkward Hangout 😶 | You try to be charming, but somehow the whole interaction becomes stilted, weird, and hard to recover from. | `Social -1.0` |
| WC-015 | Stat | Impulse Purchase 🛍️ | You convince yourself that buying this thing is self-care, then regret it almost immediately after checkout. | `Money -1.0` |
| WC-016 | Stat | Minor Cold 🤧 | You are not sick enough to stop functioning, just sick enough to feel miserable doing everything. That is somehow worse. | `Wellbeing -1.0` |
| WC-017 | Stat | Parking Ticket 🚓 | Campus parking enforcement remains one of the most competent institutions in your life. It finds you quickly and without mercy. | `Money -0.75, Wellbeing -0.25` |
| WC-018 | Stat | Bad Study Session 📚 | You stare at the same page for an hour and retain nothing except growing self-hatred. The time is gone forever. | `Academics -0.75` |
| WC-019 | Stat | Overheard Rumor 👂 | A dumb story about you starts making the rounds, and the worst part is how little control you have over it. | `Social -0.75, Wellbeing -0.25` |
| WC-020 | Stat | Shattered Phone 📱 | One slip of the hand and your phone screen becomes an expensive spiderweb. You pretend not to care while absolutely caring. | `Money -0.75` |
| WC-021 | Stat | Missed Meal 🍽️ | You get too busy, too stubborn, or too distracted to eat properly, and your body notices before you do. | `Wellbeing -0.75` |
| WC-022 | Stat | Laundry Disaster 🧺 | An entire load comes back shrunk, pink, or mysteriously ruined. You now own fewer usable clothes and more resentment. | `Money -0.5, Wellbeing -0.5` |
| WC-023 | Stat | Peer Comparison 🪞 | Everyone around you suddenly seems more accomplished, more stable, and more sure of themselves. It gets into your head. | `Wellbeing -0.5, Social -0.5` |
| WC-024 | Stat | Broken Printer 🖨️ | The assignment is finished, but the machine you need refuses to cooperate when it matters. Campus technology remains your enemy. | `Academics -0.5, Money -0.25` |
| WC-025 | Stat | Wrong Classroom 🚪 | You sit through a chunk of the wrong lecture before realizing you are not where you are supposed to be. The lost momentum stings. | `Academics -0.5` |
| WC-026 | Stat | Terrible Coffee ☕ | The coffee tastes burnt, costs too much, and somehow still fails to wake you up. It is an insult on every level. | `Money -0.25, Wellbeing -0.5` |
| WC-027 | Stat | Rain-Soaked Walk 🌧️ | You get absolutely drenched between buildings and spend the rest of the day damp, cold, and quietly furious. | `Wellbeing -0.5` |
| WC-028 | Stat | Passive-Aggressive Roommate 🛏️ | Your roommate starts a conflict through body language, weird comments, and the strategic relocation of your stuff. | `Social -0.5, Wellbeing -0.5` |
| WC-029 | Stat | Library Fine 📘 | That borrowed book was due so long ago that the fee feels less like a penalty and more like a personal judgment. | `Money -0.5` |
| WC-030 | Stat | Bad Networking Event 🤝 | You collect free pens, fake smiles, and absolutely no real opportunities. The whole evening feels like a tax on your spirit. | `Social -0.5, Money -0.25` |
| WC-031 | Stat | Late-Night Regret 🌙 | Something that seemed fun in the moment becomes much less charming under the brutal light of tomorrow. | `Wellbeing -0.75, Academics -0.25` |
| WC-032 | Gimmick | Foggy Head 💤 | Your brain never fully boots up, and whatever focus you had planned to use later is already compromised. | Your `next Study loses 0.5 Academics` |
| WC-033 | Gimmick | Cringe Flashback 😵 | Your body decides now is the perfect time to replay something humiliating from years ago in full detail. | Your `next Socialize loses 0.5 Social` |
| WC-034 | Gimmick | Bad Budget Week 📉 | Small expenses keep stacking until your whole week feels cursed by invisible charges. The next shift will not save you. | Your `next Work gives only +0.5 Money` |
| WC-035 | Gimmick | Sore Muscles 🦵 | You move wrong exactly once and spend the next day discovering new ways to be annoyed by your own body. | Your `next Exercise gives 0 Wellbeing` |
| WC-036 | Gimmick | Bad Sleep Spiral 🛌 | You technically sleep, but it is the kind of sleep that feels like a prank your body is playing on you. | Your `next Sleep gives only +0.5 Wellbeing` |
| WC-037 | Stat | Office Hours Panic 😨 | You show up hoping for clarity and leave replaying every awkward second of the conversation in your head. | `Academics -0.25, Wellbeing -0.5` |

## Normal (26)

| ID | Type | Title | Description | Effect |
|---|---|---|---|---|
| WC-038 | Stat | Found Twenty 💵 | A crumpled bill appears in a coat pocket or an old notebook like the universe taking pity on you. It is not much, but it feels blessed. | `Money +1.0` |
| WC-039 | Stat | Unexpected Nap 😌 | You lie down "for ten minutes" and wake up noticeably more human than you were before. It saves the whole day. | `Wellbeing +1.0` |
| WC-040 | Stat | Clean Notes Swap 📝 | Someone shares notes that are somehow clearer than the lecture itself. You suddenly understand much more than you should. | `Academics +1.0` |
| WC-041 | Stat | Friendly Hallway Chat 🙂 | A small conversation catches you at exactly the right moment and leaves you lighter than it has any right to. | `Social +1.0` |
| WC-042 | Stat | Free Pizza Slice 🍕 | You drift into a student event you had no intention of attending and still leave fed. That counts as a win. | `Money +0.5, Wellbeing +0.5` |
| WC-043 | Stat | Good Playlist 🎧 | The right song at the right time makes walking across campus feel cinematic instead of miserable. Mood matters more than you admit. | `Wellbeing +0.75, Social +0.25` |
| WC-044 | Stat | Study Groove 🧠 | You finally hit a patch of concentration where the words stick and the work moves. It feels almost suspicious. | `Academics +0.75, Wellbeing +0.25` |
| WC-045 | Stat | Tipsy Tip Jar ☕ | Your shift is boring, but people are weirdly generous all night and that changes your opinion of humanity a little. | `Money +0.75, Social +0.25` |
| WC-046 | Stat | Sunny Bench Break 🌤️ | You end up alone in a warm patch of sunlight for ten peaceful minutes and return to life less brittle than before. | `Wellbeing +0.75` |
| WC-047 | Stat | Good Hair Day 💁 | Your reflection surprises you in a good way and your confidence quietly spikes for the rest of the day. | `Social +0.75` |
| WC-048 | Stat | Club Flyer Curiosity 📣 | You follow a random flyer or friend into a room you would normally ignore and accidentally learn something useful. | `Social +0.5, Academics +0.5` |
| WC-049 | Stat | Meal Swipe Gift 🎟️ | Someone with an extra swipe saves you from paying and from pretending instant noodles are a personality trait. | `Money +0.5, Wellbeing +0.5` |
| WC-050 | Stat | Tutor Tip 💡 | One offhand explanation from the right person makes a concept click in a way your textbook never managed. | `Academics +0.75` |
| WC-051 | Stat | Free Bus Ride 🚌 | You save both time and energy by catching a lucky ride when your body was already done with walking. | `Money +0.25, Wellbeing +0.5` |
| WC-052 | Stat | Late Library Hours 🌃 | The library stays open just long enough for you to actually get something done instead of giving up and spiraling. | `Academics +0.5, Wellbeing +0.25` |
| WC-053 | Stat | Compliment from a Stranger 🌟 | Someone says something kind at exactly the moment you needed a reason to stop being so harsh on yourself. | `Social +0.5, Wellbeing +0.25` |
| WC-054 | Stat | Campus Freebie Bag 🎁 | Most of the bag is nonsense, but enough of it is useful that the whole experience feels like a tiny festival of luck. | `Money +0.75` |
| WC-055 | Stat | Rain Delay Reset ☔ | Plans fall apart, but the forced pause gives you a little more room to breathe than your day had before. | `Wellbeing +0.75` |
| WC-056 | Stat | Lucky Seat in Class 🪑 | You sit next to the one person who actually understood the lecture and they explain it in plain language after class. | `Academics +0.5, Social +0.25` |
| WC-057 | Stat | Decent Shift 🍽️ | Nothing dramatic happens, nobody yells at you, and the money arrives exactly as promised. That alone feels rare. | `Money +1.0` |
| WC-058 | Stat | Stretch Break 🧘 | A simple break for your body resets more tension than you realized you were carrying. | `Wellbeing +0.75` |
| WC-059 | Stat | Small Scholarship Email 📩 | It is not a life-changing amount, but it lands in your inbox at exactly the right time to matter. | `Money +0.75` |
| WC-060 | Stat | Lucky Guess ❓ | You make a guess on something you probably should not know and somehow come out looking competent. | `Academics +0.75` |
| WC-061 | Stat | Vending Jackpot 🥤 | The machine double-drops your snack and you briefly feel favored by forces beyond your understanding. | `Money +0.25, Wellbeing +0.5` |
| WC-062 | Gimmick | Next Study Boost 📖 | You stumble across a clue, a source, or a trick that will make your next real study session much more productive. | Your `next Study gains +0.75 Academics` |
| WC-063 | Gimmick | Next Work Boost 💼 | Someone offers you an easy task, a good shift, or a small advantage that turns your next work session into a better deal. | Your `next Work gains +0.75 Money` |

## Good (25)

| ID | Type | Title | Description | Effect |
|---|---|---|---|---|
| WC-064 | Stat | Professor Mercy 🎓 | The professor hands out a hint, extension, or grading break that they absolutely did not have to give you. | `Academics +1.5` |
| WC-065 | Stat | Perfect Sleep 😴 | You wake up feeling startlingly rested, like your body briefly remembered how to function correctly. | `Wellbeing +1.5` |
| WC-066 | Stat | Cash Gig 💼 | A random one-day job appears and somehow pays better than your actual normal opportunities. | `Money +1.5` |
| WC-067 | Stat | Magnetic Energy ✨ | People are weirdly drawn to you today, and every interaction goes a little smoother than expected. | `Social +1.5` |
| WC-068 | Stat | Locked-In Study Day 📚 | The distractions fall away, the tasks line up, and you spend hours actually making progress instead of pretending to. | `Academics +1.25, Wellbeing +0.25` |
| WC-069 | Stat | Healing Weekend 🛀 | You accidentally do everything right for one stretch of time and your body rewards you for it immediately. | `Wellbeing +1.25, Social +0.25` |
| WC-070 | Stat | Great Tips Night 🍻 | Customers are cheerful, management is absent, and the cash accumulates faster than your stress does. | `Money +1.25, Social +0.25` |
| WC-071 | Stat | Campus Celebrity Moment 📸 | For one evening, people know who you are for a good reason and the glow carries farther than expected. | `Social +1.25, Wellbeing +0.25` |
| WC-072 | Stat | Advisor Hookup 🧠 | You get pointed toward exactly the right person, office, or resource just before you would have given up. | `Academics +1.0, Money +0.5` |
| WC-073 | Stat | Recharge Day 🌿 | You do less, breathe more, and still come out ahead because your brain and body finally stop fighting you. | `Wellbeing +1.0, Academics +0.5` |
| WC-074 | Stat | Good Crowd 🫶 | You land in a room where everyone is easy to talk to and no one makes you regret leaving home. | `Social +1.0, Money +0.5` |
| WC-075 | Stat | Paid Opportunity 📑 | Someone notices competence and turns it into a concrete chance to earn. It is one of those tiny lucky pivots. | `Money +1.0, Academics +0.5` |
| WC-076 | Stat | Lucky Break 🍀 | Two or three small things line up in your favor and the whole day becomes much easier to live inside. | `Academics +0.75, Wellbeing +0.75` |
| WC-077 | Stat | Confidence Surge 🔥 | You stop hesitating, stop second-guessing, and suddenly every choice feels easier to commit to. | `Social +0.75, Wellbeing +0.75` |
| WC-078 | Stat | Free Groceries 🛒 | Someone moving out or cleaning house hands you a ridiculous amount of useful food and basic supplies. | `Money +0.75, Wellbeing +0.75` |
| WC-079 | Stat | Research Assistant Lead 🔬 | A professor, TA, or grad student gives you the kind of opening that makes you feel smarter just for hearing it. | `Academics +1.25` |
| WC-080 | Stat | Great Gym Session 🏋️ | Your body cooperates, your lungs behave, and the endorphins actually show up on time. | `Wellbeing +1.25` |
| WC-081 | Stat | Unexpected Venmo 📲 | Somebody finally pays you back for something ancient and you immediately stop believing in karma out of sheer surprise. | `Money +1.25` |
| WC-082 | Stat | Party Win 🪩 | You leave the night with new names, new confidence, and the rare sense that going out was absolutely the right choice. | `Social +1.25` |
| WC-083 | Gimmick | Next-Day Focus Buff 🎯 | Something clicks mentally and leaves behind just enough structure that your next study session starts stronger. | Your `next Study gains +0.75 Academics` |
| WC-084 | Gimmick | Next-Day Recovery Buff 🛌 | Your body is set up to recover better the next time you actually let it rest. | Your `next Sleep or Rest gains +0.75 Wellbeing` |
| WC-085 | Gimmick | Next-Day Hustle Buff 🚀 | You find an easier route to money, and your next time working will benefit from that momentum. | Your `next Work gains +0.75 Money` |
| WC-086 | Gimmick | Social Momentum 🗣️ | You become easier to talk to for a little while, as if your charm has finally stopped buffering. | Your `next Socialize gains +0.75 Social` |
| WC-087 | Gimmick | Safety Net 🛡️ | You feel strangely protected, like the next disaster has already been politely asked to stay away. | Your `next bad outcome becomes normal` |
| WC-088 | Gimmick | Calm Mind 🌙 | The static in your head clears just enough that tomorrow's stress has less room to hurt you. | Tomorrow you ignore `one wellbeing-related penalty` |

## Really Good (12)

| ID | Type | Title | Description | Effect |
|---|---|---|---|---|
| WC-089 | Stat | Secret Answer Key 🔑 | You accidentally find exactly the clue, answer pattern, or hidden advantage you were never supposed to see. It is a little illegal and extremely useful. | `Academics +2.0` |
| WC-090 | Stat | Scholarship Win 🏆 | Real money, no strings, no fake internship catch, and no follow-up email asking for your banking password. | `Money +2.0` |
| WC-091 | Stat | Miracle Recovery 🌈 | Whatever was wrong with your brain, body, or spirit briefly gets patched by divine intervention. | `Wellbeing +2.0` |
| WC-092 | Stat | Legendary Social Night 🎉 | You become the center of the room for all the right reasons and ride the high all the way home. | `Social +2.0` |
| WC-093 | Stat | Dream Internship Offer 💼 | A ridiculous opportunity lands in your lap and somehow turns out to be both real and useful. | `Money +1.5, Academics +0.75` |
| WC-094 | Stat | Peak Flow State 🧠 | You become terrifyingly efficient for one stretch of time and tear through work that should have taken twice as long. | `Academics +1.5, Wellbeing +0.75` |
| WC-095 | Stat | Perfect Reset Weekend 🛏️ | You sleep, eat, breathe, and recover like a person in a self-help book instead of a college student. | `Wellbeing +1.5, Social +0.75` |
| WC-096 | Stat | Main Character Arc 🌟 | For one glorious moment, the universe remembers your name and decides to reward your existence. | `Social +1.5, Money +0.75` |
| WC-097 | Stat | Double Lucky Break 🍀🍀 | Two unrelated good things happen back to back and you do not trust either of them, but both are real. | `Academics +1.0, Money +1.0` |
| WC-098 | Gimmick | Guardian Angel 😇 | Something invisible steps between you and catastrophe, and the protection lingers just long enough to matter. | Your `next two bad outcomes become normal` |
| WC-099 | Gimmick | Momentum Chain ⚡ | Success starts feeding itself, and the next couple of things you do inherit some of that spark. | Your `next two actions each gain +0.5 to their main stat` |
| WC-100 | Gimmick | Golden Ticket 🎫 | You pull the kind of luck people tell stories about later, and it keeps paying out after the first shock wears off. | Draw `1 additional wildcard immediately`, then also gain `Wellbeing +0.5` |
