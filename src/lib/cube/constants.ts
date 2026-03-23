export const FACE_IDS = ["up", "right", "front", "down", "left", "back"] as const;

export const CUBE_COLORS = [
  "white",
  "red",
  "green",
  "yellow",
  "orange",
  "blue",
] as const;

export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const SOLVER_MODES = ["mock", "cubejs"] as const;

export const STICKERS_PER_FACE = 9;
export const TOTAL_FACES = 6;
export const TOTAL_STICKERS = STICKERS_PER_FACE * TOTAL_FACES;

export const CENTER_COLOR_BY_FACE = {
  up: "white",
  right: "red",
  front: "green",
  down: "yellow",
  left: "orange",
  back: "blue",
} as const;

export const SOLVED_CUBE_STATE = {
  up: Array.from({ length: STICKERS_PER_FACE }, () => CENTER_COLOR_BY_FACE.up),
  right: Array.from({ length: STICKERS_PER_FACE }, () => CENTER_COLOR_BY_FACE.right),
  front: Array.from({ length: STICKERS_PER_FACE }, () => CENTER_COLOR_BY_FACE.front),
  down: Array.from({ length: STICKERS_PER_FACE }, () => CENTER_COLOR_BY_FACE.down),
  left: Array.from({ length: STICKERS_PER_FACE }, () => CENTER_COLOR_BY_FACE.left),
  back: Array.from({ length: STICKERS_PER_FACE }, () => CENTER_COLOR_BY_FACE.back),
} as const;
