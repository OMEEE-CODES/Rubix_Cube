declare module "cubejs" {
  export type CubeJsonState = {
    center: number[];
    cp: number[];
    co: number[];
    ep: number[];
    eo: number[];
  };

  export default class Cube {
    constructor(state?: Cube | CubeJsonState);
    static fromString(str: string): Cube;
    static initSolver(): void;
    static inverse(algorithm: string | string[] | number): string | string[] | number;
    toJSON(): CubeJsonState;
    asString(): string;
    clone(): Cube;
    isSolved(): boolean;
    move(algorithm: string | string[] | number): Cube;
    solve(maxDepth?: number): string;
    upright(): string;
  }
}
