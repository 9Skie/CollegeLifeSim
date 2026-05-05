export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

const AVATAR_COLORS = [
  "#d94f4f",
  "#f0a868",
  "#5b8c5a",
  "#4f8cd9",
  "#d94fb8",
  "#a17b1a",
  "#8a8579",
  "#4fd9c9",
  "#d96f4f",
];

export function getAvatarColor(name: string): string {
  return AVATAR_COLORS[hashString(name) % AVATAR_COLORS.length];
}

export function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}
