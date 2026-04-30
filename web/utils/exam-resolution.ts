export type ExamGrade = "A" | "B" | "C" | "D" | "F";

export type ExamResult = {
  playerId: string;
  playerName: string;
  grade: ExamGrade;
  academicsChange: number;
  oldAcademics: number;
  newAcademics: number;
  oldWellbeing: number;
  newWellbeing: number;
};

export function computeExamResult(
  academics: number,
  wellbeing: number,
  isFinal: boolean
): {
  grade: ExamGrade;
  academicsChange: number;
  wellbeingChange: number;
} {
  const wellbeingBonus = Math.max(0, (wellbeing - 3) * 0.25);
  const score = academics + wellbeingBonus;
  const maxChange = isFinal ? 3 : 1.5;

  if (score >= 7) {
    return { grade: "A", academicsChange: maxChange, wellbeingChange: 1 };
  }
  if (score >= 5) {
    return { grade: "B", academicsChange: maxChange / 2, wellbeingChange: 1 };
  }
  if (score >= 3) {
    return { grade: "C", academicsChange: 0, wellbeingChange: 1 };
  }
  return { grade: "D", academicsChange: -maxChange, wellbeingChange: 1 };
}

export function resolveExamForRoom({
  currentDay,
  players,
}: {
  currentDay: number;
  players: Array<{
    id: string;
    name: string;
    academics?: number | string | null;
    wellbeing?: number | string | null;
    eliminated?: boolean | null;
  }>;
}): {
  results: ExamResult[];
  playerUpdates: Array<{
    playerId: string;
    academics: number;
    wellbeing: number;
    eliminated: boolean;
  }>;
} {
  const isFinal = currentDay >= 19;

  function toNumber(value: number | string | null | undefined, fallback: number) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  const results: ExamResult[] = [];
  const playerUpdates: Array<{
    playerId: string;
    academics: number;
    wellbeing: number;
    eliminated: boolean;
  }> = [];

  for (const player of players) {
    if (player.eliminated) {
      continue;
    }

    const oldAcademics = toNumber(player.academics, 2);
    const oldWellbeing = toNumber(player.wellbeing, 5);

    const { grade, academicsChange, wellbeingChange } = computeExamResult(
      oldAcademics,
      oldWellbeing,
      isFinal
    );

    const newAcademics = Math.min(10, Math.max(0, oldAcademics + academicsChange));
    const newWellbeing = Math.min(10, Math.max(0, oldWellbeing + wellbeingChange));

    results.push({
      playerId: player.id,
      playerName: player.name,
      grade,
      academicsChange,
      oldAcademics,
      newAcademics,
      oldWellbeing,
      newWellbeing,
    });

    playerUpdates.push({
      playerId: player.id,
      academics: newAcademics,
      wellbeing: newWellbeing,
      eliminated: newWellbeing <= 0,
    });
  }

  return { results, playerUpdates };
}
