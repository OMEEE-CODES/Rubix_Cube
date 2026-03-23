import Cube from "cubejs";

import {
  CUBE_COLORS,
  FACE_IDS,
  STICKERS_PER_FACE,
  TOTAL_STICKERS,
} from "@/lib/cube/constants";
import type {
  CubeColor,
  CubeState,
  CubeStateNotation,
  CubeStateValidationResult,
  FaceId,
} from "@/lib/cube/types";

const FACE_LETTER_BY_COLOR: Record<CubeColor, string> = {
  white: "U",
  red: "R",
  green: "F",
  yellow: "D",
  orange: "L",
  blue: "B",
};

export class CubeStateValidationError extends Error {
  readonly issues: string[];

  constructor(message: string, issues: string[]) {
    super(message);
    this.name = "CubeStateValidationError";
    this.issues = issues;
  }
}

export function validateCubeState(cubeState: CubeState): CubeStateValidationResult {
  const notation = toCubeStateNotation(cubeState);
  const colorCounts = countColors(cubeState);
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const color of CUBE_COLORS) {
    if (colorCounts[color] !== STICKERS_PER_FACE) {
      errors.push(
        `Cube must contain exactly ${STICKERS_PER_FACE} ${color} stickers.`,
      );
    }
  }

  if (notation.length !== TOTAL_STICKERS) {
    errors.push(`Cube notation must contain exactly ${TOTAL_STICKERS} stickers.`);
  }

  const cube = Cube.fromString(notation);
  const cubeJson = cube.toJSON();

  assertPermutation("corner permutation", cubeJson.cp, 8, errors);
  assertPermutation("edge permutation", cubeJson.ep, 12, errors);
  assertOrientation("corner orientation", cubeJson.co, 3, errors);
  assertOrientation("edge orientation", cubeJson.eo, 2, errors);

  if (sum(cubeJson.co) % 3 !== 0) {
    errors.push("Corner orientation is impossible for a physical cube.");
  }

  if (sum(cubeJson.eo) % 2 !== 0) {
    errors.push("Edge orientation is impossible for a physical cube.");
  }

  if (permutationParity(cubeJson.cp) !== permutationParity(cubeJson.ep)) {
    errors.push("Corner and edge parity do not match, so the cube state is impossible.");
  }

  if (errors.length === 0 && cube.isSolved()) {
    warnings.push("Cube is already solved.");
  }

  return {
    isValid: errors.length === 0,
    notation,
    colorCounts,
    errors,
    warnings,
  };
}

export function assertValidCubeState(cubeState: CubeState) {
  const result = validateCubeState(cubeState);
  if (!result.isValid) {
    throw new CubeStateValidationError("Cube state is not solvable.", result.errors);
  }

  return result;
}

export function toCubeStateNotation(cubeState: CubeState): CubeStateNotation {
  return FACE_IDS.flatMap((faceId: FaceId) =>
    cubeState[faceId].map((color) => FACE_LETTER_BY_COLOR[color]),
  ).join("");
}

function countColors(cubeState: CubeState) {
  const counts = Object.fromEntries(
    CUBE_COLORS.map((color) => [color, 0]),
  ) as Record<CubeColor, number>;

  for (const faceId of FACE_IDS) {
    for (const color of cubeState[faceId]) {
      counts[color] += 1;
    }
  }

  return counts;
}

function assertPermutation(
  label: string,
  values: number[],
  expectedLength: number,
  errors: string[],
) {
  if (values.length !== expectedLength) {
    errors.push(`${label} has invalid length.`);
    return;
  }

  const expected = new Set(Array.from({ length: expectedLength }, (_, index) => index));
  for (const value of values) {
    if (!Number.isInteger(value) || !expected.has(value)) {
      errors.push(`${label} contains an invalid cubie index.`);
      return;
    }
    expected.delete(value);
  }

  if (expected.size > 0) {
    errors.push(`${label} is missing one or more cubies.`);
  }
}

function assertOrientation(
  label: string,
  values: number[],
  modulus: number,
  errors: string[],
) {
  for (const value of values) {
    if (!Number.isInteger(value) || value < 0 || value >= modulus) {
      errors.push(`${label} contains an invalid orientation value.`);
      return;
    }
  }
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function permutationParity(values: number[]) {
  const visited = new Array(values.length).fill(false);
  let parity = 0;

  for (let start = 0; start < values.length; start += 1) {
    if (visited[start]) {
      continue;
    }

    let cycleLength = 0;
    let current = start;

    while (!visited[current]) {
      visited[current] = true;
      current = values[current]!;
      cycleLength += 1;
    }

    if (cycleLength > 0) {
      parity += cycleLength - 1;
    }
  }

  return parity % 2;
}
