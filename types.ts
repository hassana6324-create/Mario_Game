export enum GameStatus {
  MENU = 'MENU',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export interface Vector {
  x: number;
  y: number;
}

export interface Size {
  w: number;
  h: number;
}

export interface GameObject extends Vector, Size {
  type: 'platform' | 'player' | 'enemy' | 'coin' | 'flag';
  color?: string;
  vx?: number;
  vy?: number;
  id?: string;
  isDead?: boolean; // For enemies or coins
}

export interface LevelData {
  platforms: GameObject[];
  enemies: GameObject[];
  coins: GameObject[];
  flag: GameObject;
  themeColor: string;
}

export interface GameConfig {
  gravity: number;
  friction: number;
  speed: number;
  jumpForce: number;
}