# Shared Action Coordination And Wellbeing Rework

## Goal

Reduce noisy failed shared actions, make coordination feel intentional, and simplify result readability by:

- replacing blind reciprocal shared-action guessing with an invite/accept/lock flow
- collapsing result bands to `bad`, `normal`, and `good`
- making wellbeing the linear driver for both result odds and effect magnitude

## Shared Action Planning

This applies to `StudyTogether` and `Socialize`.

Each slot resolves in two phases:

1. Every player evaluates solo actions and at most one outgoing shared-action invite.
2. All incoming invites are compared by the receiver.
3. Each player may accept at most one invite for the slot.
4. Accepted pairs are locked into the shared action for that slot.
5. Unpaired players execute their already-chosen solo action.

## Invite Selection Rules

- A player may send at most one invite per slot.
- A player may accept at most one invite per slot.
- If multiple invites are received, the AI accepts the one with the best expected return.
- A shared action only resolves as a full shared success if both players are locked to each other for that slot.

## Failed Invite Rule

If a shared-action invite is not accepted:

- the initiator does not fall back to a solo action
- the initiator still resolves the intended action type
- the result is flatly reduced by `25%` from its normal value

This replaces the current variable partial-turn fallback logic for failed shared actions.

## Result Bands

All current four-band outcomes are replaced with:

- `bad`
- `normal`
- `good`

The fixed baseline probabilities are:

- `normal = 75%`
- `good = 25% * (wellbeing / 10)`
- `bad = 25% * (1 - wellbeing / 10)`

Anchor examples:

- `wellbeing = 0` -> `25% bad / 75% normal / 0% good`
- `wellbeing = 5` -> `12.5% bad / 75% normal / 12.5% good`
- `wellbeing = 10` -> `0% bad / 75% normal / 25% good`

## Effect Multipliers

Wellbeing is also a linear multiplier driver for outcome magnitude.

- `goodMultiplier = 0.5 + 1.5 * (wellbeing / 10)`
- `normalMultiplier = 1.0`
- `badMultiplier = 2.0 - 1.5 * (wellbeing / 10)`

Anchor examples:

- `wellbeing = 0` -> `good 0.5x`, `normal 1.0x`, `bad 2.0x`
- `wellbeing = 5` -> `good 1.25x`, `normal 1.0x`, `bad 1.25x`
- `wellbeing = 10` -> `good 2.0x`, `normal 1.0x`, `bad 0.5x`

## Scope Of Multipliers

By default, the resolved band multiplier should apply to numeric stat deltas, including:

- action gains
- action penalties
- decay-style stat changes
- scheduled numeric adjustments

The multiplier should not apply to hard state assignments or structural rules, including:

- setting current energy directly
- relationship level thresholds
- action availability constraints

## Wellbeing And Stat Floors

- wellbeing range becomes `0..10`
- every player starts at `wellbeing = 5`
- all tracked stats are clamped to a minimum of `0`

## Logging And Readability

Logs and UI labels should only use:

- `bad`
- `normal`
- `good`

Shared-action logs should reflect accepted coordination versus declined or failed invitations, rather than repeated "missed link" style spam.

## Engine Changes

The implementation needs to:

- replace isolated shared-target planning with slot-level invite/accept/lock coordination
- add expected-return scoring for incoming invites
- preserve existing solo-action scoring for non-paired players
- replace current failed shared-action partial resolution with the flat `25%` deduction rule
- collapse all four-tier outcome tables and labels to three bands
- update tier sampling to the wellbeing-driven linear probabilities
- update all delta application paths to use the new band multipliers
- initialize players at `wellbeing = 5`
- clamp tracked stats to `0`

## Test Coverage

Add regression coverage for:

- one accepted invite locking exactly one pair
- multiple invites causing one best invite to be accepted
- unaccepted invites resolving with a flat `25%` deduction
- wellbeing interpolation at `0`, `5`, and `10`
- logs and labels only using `bad`, `normal`, and `good`
- tracked stats never dropping below `0`
