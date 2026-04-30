export const DAY_SLOTS = ["morning", "afternoon", "night"] as const;

export type DaySlot = (typeof DAY_SLOTS)[number];

export type Selection = {
  actionId: string;
  targetId?: string;
  spend?: 0 | 1 | 2;
  code?: string;
};

export type SelectionRecord = Record<DaySlot, Selection | null>;

export type DaySubmissionStatus = "thinking" | "done" | "goner";

export function createEmptySelectionRecord(): SelectionRecord {
  return {
    morning: null,
    afternoon: null,
    night: null,
  };
}

export function isSelection(value: unknown): value is Selection {
  if (!value || typeof value !== "object") {
    return false;
  }

  const selection = value as Record<string, unknown>;
  if (typeof selection.actionId !== "string" || selection.actionId.length === 0) {
    return false;
  }

  if (
    selection.targetId !== undefined &&
    typeof selection.targetId !== "string"
  ) {
    return false;
  }

  if (
    selection.spend !== undefined &&
    selection.spend !== 0 &&
    selection.spend !== 1 &&
    selection.spend !== 2
  ) {
    return false;
  }

  if (selection.code !== undefined && typeof selection.code !== "string") {
    return false;
  }

  return true;
}

export function isSelectionRecord(value: unknown): value is SelectionRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return DAY_SLOTS.every((slot) => record[slot] === null || isSelection(record[slot]));
}

export function getMoneySpentFromSelection(selection: Selection): number {
  if (selection.spend === 2) return 0.5;
  if (selection.spend === 1) return 0.25;
  return 0;
}

export function getSpendFromMoneySpent(
  moneySpent: number | string | null | undefined
): 0 | 1 | 2 | undefined {
  const amount = Number(moneySpent ?? 0);
  if (amount >= 0.5) return 2;
  if (amount >= 0.25) return 1;
  return undefined;
}

export function buildSelectionRecordFromRows(
  rows: Array<{
    slot: string;
    action: string;
    target_id: string | null;
    money_spent: number | string | null;
  }>
): SelectionRecord {
  const selections = createEmptySelectionRecord();

  for (const row of rows) {
    if (!DAY_SLOTS.includes(row.slot as DaySlot)) {
      continue;
    }

    const spend = getSpendFromMoneySpent(row.money_spent);
    selections[row.slot as DaySlot] = {
      actionId: row.action,
      targetId: row.target_id ?? undefined,
      ...(spend !== undefined ? { spend } : {}),
    };
  }

  return selections;
}
