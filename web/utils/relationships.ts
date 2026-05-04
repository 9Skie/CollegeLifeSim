export type RelationshipRow = {
  room_code: string;
  player_a: string;
  player_b: string;
  level: number;
  progress: number;
};

export type RelationshipBonusStat = "academics" | "wellbeing" | "money";

export function normalizeRelationshipPair(playerOneId: string, playerTwoId: string) {
  return playerOneId < playerTwoId
    ? { playerA: playerOneId, playerB: playerTwoId }
    : { playerA: playerTwoId, playerB: playerOneId };
}

export function getRelationshipKey(playerOneId: string, playerTwoId: string) {
  const { playerA, playerB } = normalizeRelationshipPair(playerOneId, playerTwoId);
  return `${playerA}:${playerB}`;
}

export function getRelationshipLevel(progress: number) {
  if (progress >= 6) return 3;
  if (progress >= 3) return 2;
  return 1;
}

export function getRelationshipBonusAmount(level: number) {
  if (level === 3) return 0.5;
  if (level === 2) return 0.25;
  return 0;
}

export function pickRelationshipBonusStat({
  academics,
  wellbeing,
  money,
}: {
  academics: number;
  wellbeing: number;
  money: number;
}): RelationshipBonusStat {
  const allStats: RelationshipBonusStat[] = ["academics", "wellbeing", "money"];
  const uncappedStats = allStats.filter((stat) => {
    if (stat === "academics") return academics < 10;
    if (stat === "wellbeing") return wellbeing < 10;
    return money < 10;
  });

  const pool = uncappedStats.length > 0 ? uncappedStats : allStats;
  return pool[Math.floor(Math.random() * pool.length)];
}
