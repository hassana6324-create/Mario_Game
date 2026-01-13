import { GoogleGenAI, Type } from "@google/genai";
import { LevelData, GameObject } from '../types';
import { FALLBACK_LEVEL, TILE_SIZE, CANVAS_HEIGHT } from '../constants';

// We map simple simplified types from AI to our robust GameObject types
interface AILevelResponse {
  platforms: { x: number; y: number; width: number }[];
  enemies: { x: number; y: number }[];
  coins: { x: number; y: number }[];
  themeHue: string;
}

export const generateLevel = async (): Promise<LevelData> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.warn("No API Key found, using fallback level.");
    // Return a deep copy to avoid mutation issues
    return JSON.parse(JSON.stringify(FALLBACK_LEVEL));
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // We ask for a simple JSON structure representing a platformer level
    // We use gemini-3-flash-preview for speed
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a JSON for a 2D platformer level. 
      The level is 3000 units long. 
      Ground level is at y=${CANVAS_HEIGHT - 50}.
      Include:
      1. 'platforms': array of objects {x, y, width}. Height is always 20. Make sure they are reachable by jumping.
      2. 'enemies': array of objects {x, y}. They are 30x30 size.
      3. 'coins': array of objects {x, y}.
      4. 'themeHue': a hex color string for the sky background.
      
      Output MUST be valid JSON matching this schema.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            platforms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  width: { type: Type.NUMBER },
                }
              }
            },
            enemies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                }
              }
            },
            coins: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                }
              }
            },
            themeHue: { type: Type.STRING }
          }
        }
      }
    });

    const data = JSON.parse(response.text || '{}') as AILevelResponse;

    // Transform AI data to Game Objects
    const platforms: GameObject[] = [
        // Always add a base ground
        { x: 0, y: CANVAS_HEIGHT - 50, w: 3000, h: 50, type: 'platform' },
        ...data.platforms.map(p => ({
            x: p.x,
            y: p.y,
            w: p.width,
            h: 20,
            type: 'platform' as const
        }))
    ];

    const enemies: GameObject[] = data.enemies.map(e => ({
        x: e.x,
        y: e.y,
        w: 30,
        h: 30,
        type: 'enemy' as const,
        vx: -2 // Initial enemy velocity
    }));

    const coins: GameObject[] = data.coins.map(c => ({
        x: c.x,
        y: c.y,
        w: 20,
        h: 20,
        type: 'coin' as const
    }));

    // Place flag at the end
    const flag: GameObject = {
        x: 2800,
        y: CANVAS_HEIGHT - 150,
        w: 40,
        h: 100,
        type: 'flag'
    };

    return {
        platforms,
        enemies,
        coins,
        flag,
        themeColor: data.themeHue || '#3b82f6'
    };

  } catch (error) {
    console.error("Gemini Level Generation Failed:", error);
    return JSON.parse(JSON.stringify(FALLBACK_LEVEL));
  }
};
