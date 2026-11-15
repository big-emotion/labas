/** Equirectangular projection framed on Africa and the Indian Ocean islands. */
export const MAP_WIDTH = 360;
export const MAP_HEIGHT = 380;

const WEST = -26;
const EAST = 60;
const NORTH = 38;
const SOUTH = -36;
const MARGIN = 12;

export function project(lat: number, lon: number): { x: number; y: number } {
  return {
    x: MARGIN + ((lon - WEST) / (EAST - WEST)) * (MAP_WIDTH - 2 * MARGIN),
    y: MARGIN + ((NORTH - lat) / (NORTH - SOUTH)) * (MAP_HEIGHT - 2 * MARGIN),
  };
}

export type DotTier = "faint" | "lilac" | "coral" | "saffron";

/** The better a city fits (0 to 1 within the current ranking), the warmer its dot. */
export function dotTier(relative: number): DotTier {
  if (relative >= 0.85) return "saffron";
  if (relative >= 0.7) return "coral";
  if (relative >= 0.45) return "lilac";
  return "faint";
}

export interface Label {
  name: string;
  x: number;
  y: number;
  /** Where the text baseline sits, pushed down when a neighbour's name is in the way. */
  labelY: number;
  anchor: "start" | "end";
}

const LABEL_GAP = 14;

/** Places the top cities' names beside their dots so that no two names overlap. */
export function placeLabels(points: { name: string; x: number; y: number }[]): Label[] {
  const lastY = { start: -Infinity, end: -Infinity };
  return [...points]
    .sort((a, b) => a.y - b.y)
    .map((point) => {
      const anchor = point.x > MAP_WIDTH * 0.75 ? "end" : "start";
      const labelY = Math.max(point.y + 4, lastY[anchor] + LABEL_GAP);
      lastY[anchor] = labelY;
      return { ...point, labelY, anchor };
    });
}

/**
 * One answer says too little to rank 115 cities: the first one alone puts North Africa on top
 * because it only weighs safety and cost. The map stays neutral until enough answers agree.
 */
export const ANSWERS_TO_LIGHT = 3;

export function answersBeforeLight(answered: number): number {
  return Math.max(0, ANSWERS_TO_LIGHT - answered);
}
