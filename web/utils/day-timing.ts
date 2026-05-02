export const DAY_DURATION_SECONDS = 60;

export function getDayDeadlineAt(updatedAt: string | null | undefined) {
  if (!updatedAt) {
    return null;
  }

  const startedAtMs = Date.parse(updatedAt);
  if (!Number.isFinite(startedAtMs)) {
    return null;
  }

  return new Date(startedAtMs + DAY_DURATION_SECONDS * 1000).toISOString();
}

export function getDaySecondsRemaining(
  updatedAt: string | null | undefined,
  nowMs = Date.now()
) {
  const deadlineAt = getDayDeadlineAt(updatedAt);
  if (!deadlineAt) {
    return DAY_DURATION_SECONDS;
  }

  const remainingMs = Date.parse(deadlineAt) - nowMs;
  return Math.max(0, Math.ceil(remainingMs / 1000));
}

export function isDayExpired(
  updatedAt: string | null | undefined,
  nowMs = Date.now()
) {
  return getDaySecondsRemaining(updatedAt, nowMs) <= 0;
}
