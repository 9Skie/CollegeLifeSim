export type ExamGrade = "A" | "B" | "C" | "D" | "F";

export type ExamResult = {
  playerId: string;
  playerName: string;
  grade: ExamGrade;
  academicsChange: number;
  oldAcademics: number;
  newAcademics: number;
  wellbeingChange: number;
  oldWellbeing: number;
  newWellbeing: number;
};

const BASE_ACADEMICS = 2;
const BASE_WELLBEING = 5;
const ACADEMICS_WEIGHT = 2;
const WELLBEING_WEIGHT = 1;
const BASE_WEIGHTED = BASE_ACADEMICS * ACADEMICS_WEIGHT + BASE_WELLBEING * WELLBEING_WEIGHT;
const GRADE_TARGETS: Record<ExamGrade, number> = { F: -2, D: -1, C: 0, B: 1, A: 2 };
const SENSITIVITY = 0.05;

const GRADE_RANKS: ExamGrade[] = ["F", "D", "C", "B", "A"];

function rollGrade(academics: number, wellbeing: number): ExamGrade {
  const weightedScore = academics * ACADEMICS_WEIGHT + wellbeing * WELLBEING_WEIGHT;
  const delta = weightedScore - BASE_WEIGHTED;

  const weights = new Map<ExamGrade, number>();
  for (const grade of GRADE_RANKS) {
    const target = GRADE_TARGETS[grade];
    weights.set(grade, Math.max(0.001, 1 + SENSITIVITY * delta * target));
  }

  const totalWeight = Array.from(weights.values()).reduce((sum, w) => sum + w, 0);
  const roll = Math.random() * totalWeight;

  let cumulative = 0;
  for (const grade of GRADE_RANKS) {
    cumulative += weights.get(grade)!;
    if (roll <= cumulative) {
      return grade;
    }
  }

  return "F";
}

const GRADE_ACAD_CHANGE: Record<ExamGrade, number> = { A: 1.5, B: 0.75, C: 0, D: -0.75, F: -1.5 };

export function computeExamResult(
  academics: number,
  wellbeing: number,
  isFinal: boolean
): {
  grade: ExamGrade;
  academicsChange: number;
  wellbeingChange: number;
} {
  const grade = rollGrade(academics, wellbeing);
  const finalMultiplier = isFinal ? 2 : 1;

  return {
    grade,
    academicsChange: Math.round(GRADE_ACAD_CHANGE[grade] * finalMultiplier * 100) / 100,
    wellbeingChange: 1,
  };
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
      wellbeingChange,
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
