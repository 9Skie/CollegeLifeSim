export type WildcardTier =
  | "really_bad"
  | "bad"
  | "normal"
  | "good"
  | "really_good";

export type WildcardStat = "academics" | "social" | "wellbeing" | "money";

export type WildcardActionType =
  | "class"
  | "study"
  | "work"
  | "exercise"
  | "socialize"
  | "rest"
  | "sleep"
  | "wildcard"
  | "rest_or_sleep"
  | "any";

export type WildcardDuration =
  | "immediate"
  | "next_action"
  | "next_day"
  | "next_two_actions"
  | "until_triggered"
  | "instant";

export type WildcardImmediateEffect = Partial<Record<WildcardStat, number>>;

export type WildcardFutureEffect =
  | {
      kind: "action_bonus";
      duration: "next_action";
      action: WildcardActionType;
      stat: WildcardStat;
      amount: number;
    }
  | {
      kind: "action_override";
      duration: "next_action";
      action: WildcardActionType;
      override: "zero_money_gain" | "class_academics_negative" | "zero_wellbeing_gain";
      amount?: number;
    }
  | {
      kind: "extra_decay";
      duration: "next_day";
      stat: WildcardStat;
      amount: number;
    }
  | {
      kind: "ignore_penalty";
      duration: "next_day" | "until_triggered";
      penalty: "wellbeing";
      count: number;
    }
  | {
      kind: "convert_bad_outcomes";
      duration: "until_triggered";
      count: number;
    }
  | {
      kind: "draw_extra";
      duration: "instant";
      count: number;
    }
  | {
      kind: "momentum_chain";
      duration: "next_two_actions";
      amount: number;
      excludes?: WildcardActionType[];
    };

export type WildcardCard = {
  id: string;
  tier: WildcardTier;
  title: string;
  emoji: string;
  description: string;
  effectSummary: string;
  duration: WildcardDuration;
  targetStats: WildcardStat[];
  immediate: WildcardImmediateEffect;
  future: WildcardFutureEffect | null;
};
