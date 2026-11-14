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
