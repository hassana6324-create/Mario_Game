import { GameConfig } from './types';

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const PHYSICS: GameConfig = {
  gravity: 0.6,
  friction: 0.85,
  speed: 5,
  jumpForce: -14
};

export const PLAYER_SIZE = { w: 30, h: 40 };
export const TILE_SIZE = 40;

// Fallback level if AI fails
export const FALLBACK_LEVEL = {
  platforms: [
    { x: 0, y: 550, w: 2000, h: 50, type: 'platform' }, // Ground
    { x: 300, y: 450, w: 100, h: 20, type: 'platform' },
    { x: 500, y: 350, w: 100, h: 20, type: 'platform' },
    { x: 700, y: 250, w: 100, h: 20, type: 'platform' },
    { x: 900, y: 450, w: 100, h: 20, type: 'platform' },
  ],
  enemies: [
    { x: 600, y: 510, w: 30, h: 30, type: 'enemy', vx: -2 },
    { x: 920, y: 410, w: 30, h: 30, type: 'enemy', vx: -2 }
  ],
  coins: [
    { x: 320, y: 400, w: 20, h: 20, type: 'coin' },
    { x: 520, y: 300, w: 20, h: 20, type: 'coin' },
    { x: 720, y: 200, w: 20, h: 20, type: 'coin' },
    { x: 920, y: 350, w: 20, h: 20, type: 'coin' }
  ],
  flag: { x: 1800, y: 450, w: 40, h: 100, type: 'flag' },
  themeColor: '#3b82f6'
};