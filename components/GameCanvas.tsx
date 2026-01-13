import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameStatus, LevelData, GameObject } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, PHYSICS, PLAYER_SIZE } from '../constants';
import { ArrowLeft, ArrowRight, ArrowUp, RefreshCw } from 'lucide-react';

interface GameCanvasProps {
  levelData: LevelData;
  onGameOver: (score: number, win: boolean) => void;
  onRestart: () => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ levelData, onGameOver, onRestart }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  // Game State Refs (Mutable for performance in loop)
  const player = useRef<GameObject>({
    x: 50, y: 400, w: PLAYER_SIZE.w, h: PLAYER_SIZE.h, vx: 0, vy: 0, type: 'player'
  });
  const keys = useRef<{ [key: string]: boolean }>({});
  const cameraX = useRef(0);
  const score = useRef(0);
  const isGameOver = useRef(false);
  
  // Local state for UI updates only (score display)
  const [currentScore, setCurrentScore] = useState(0);

  // Entities
  const platformsRef = useRef<GameObject[]>([]);
  const enemiesRef = useRef<GameObject[]>([]);
  const coinsRef = useRef<GameObject[]>([]);
  const flagRef = useRef<GameObject | null>(null);

  // Initialize Level
  useEffect(() => {
    platformsRef.current = JSON.parse(JSON.stringify(levelData.platforms));
    enemiesRef.current = JSON.parse(JSON.stringify(levelData.enemies));
    coinsRef.current = JSON.parse(JSON.stringify(levelData.coins));
    flagRef.current = { ...levelData.flag };
    player.current = { x: 50, y: 400, w: PLAYER_SIZE.w, h: PLAYER_SIZE.h, vx: 0, vy: 0, type: 'player' };
    cameraX.current = 0;
    score.current = 0;
    isGameOver.current = false;
    setCurrentScore(0);
  }, [levelData]);

  // AABB Collision Detection
  const checkCollision = (rect1: GameObject, rect2: GameObject) => {
    return (
      rect1.x < rect2.x + rect2.w &&
      rect1.x + rect1.w > rect2.x &&
      rect1.y < rect2.y + rect2.h &&
      rect1.y + rect1.h > rect2.y
    );
  };

  const update = useCallback(() => {
    if (isGameOver.current) return;

    const p = player.current;

    // 1. Input Handling
    if (keys.current['ArrowRight'] || keys.current['d']) {
      if (p.vx && p.vx < PHYSICS.speed) p.vx++;
      else p.vx = PHYSICS.speed;
    } else if (keys.current['ArrowLeft'] || keys.current['a']) {
      if (p.vx && p.vx > -PHYSICS.speed) p.vx--;
      else p.vx = -PHYSICS.speed;
    } else {
      p.vx = (p.vx || 0) * PHYSICS.friction;
    }

    if ((keys.current['ArrowUp'] || keys.current['w'] || keys.current[' ']) && !p.vy) {
       // Only jump if on ground (checking collision below handles 'on ground' state logic implicitly via collision resolution, 
       // but for simple jump, we need a flag. Let's simplify: simple jump check is handled by setting vy to 0 on collision)
       // We need a grounded flag.
    }
    
    // Apply Gravity
    p.vy = (p.vy || 0) + PHYSICS.gravity;

    // 2. X Movement & Collision
    p.x += p.vx || 0;
    let grounded = false;

    // Platform Collisions (X)
    for (const plat of platformsRef.current) {
        if (checkCollision(p, plat)) {
            if ((p.vx || 0) > 0) p.x = plat.x - p.w;
            else if ((p.vx || 0) < 0) p.x = plat.x + plat.w;
            p.vx = 0;
        }
    }

    // 3. Y Movement & Collision
    p.y += p.vy;
    
    for (const plat of platformsRef.current) {
        if (checkCollision(p, plat)) {
            if ((p.vy || 0) > 0) { // Falling down
                p.y = plat.y - p.h;
                grounded = true;
            } else if ((p.vy || 0) < 0) { // Jumping up
                p.y = plat.y + plat.h;
            }
            p.vy = 0;
        }
    }

    // Jump Logic (Needs grounded check)
    if (grounded && (keys.current['ArrowUp'] || keys.current['w'] || keys.current[' '])) {
        p.vy = PHYSICS.jumpForce;
        grounded = false;
    }

    // World Bounds (Fall Death)
    if (p.y > CANVAS_HEIGHT) {
        isGameOver.current = true;
        onGameOver(score.current, false);
        return;
    }

    // 4. Enemy Interaction
    enemiesRef.current.forEach(enemy => {
        // Simple Enemy AI (Patrol)
        enemy.vx = enemy.vx || -2;
        enemy.x += enemy.vx;
        
        // Enemy turnaround logic (simple time based or collision based, let's just bounce constantly)
        // Check platform under enemy to turn around? Too complex for this snippet.
        // Let's just bounce off a range or platforms. 
        // Simply: reverse if hitting a platform
        let enemyHitWall = false;
        for (const plat of platformsRef.current) {
             if (checkCollision(enemy, plat)) {
                 enemyHitWall = true;
             }
        }
        if (enemyHitWall) {
            enemy.vx *= -1;
            enemy.x += enemy.vx * 2; // unstuck
        }

        // Player vs Enemy
        if (checkCollision(p, enemy)) {
            // Did player jump on top?
            const hitFromTop = p.y + p.h - (p.vy || 0) <= enemy.y + (enemy.h * 0.5);
            
            if (hitFromTop && (p.vy || 0) > 0) {
                // Kill Enemy
                score.current += 100;
                setCurrentScore(score.current);
                enemy.y = 10000; // Move away
                p.vy = -7; // Bounce
            } else {
                // Die
                isGameOver.current = true;
                onGameOver(score.current, false);
            }
        }
    });

    // 5. Coin Collection
    coinsRef.current.forEach((coin, index) => {
        if (!coin.isDead && checkCollision(p, coin)) {
            coin.isDead = true;
            score.current += 10;
            setCurrentScore(score.current);
        }
    });

    // 6. Win Condition
    if (flagRef.current && checkCollision(p, flagRef.current)) {
        isGameOver.current = true;
        onGameOver(score.current, true);
    }

    // 7. Camera Follow
    const targetCamX = p.x - CANVAS_WIDTH / 3;
    // Smooth camera
    cameraX.current += (targetCamX - cameraX.current) * 0.1;
    if (cameraX.current < 0) cameraX.current = 0; // Don't show left of start
    if (cameraX.current > 2200) cameraX.current = 2200; // End limit

  }, [onGameOver]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear Screen
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Sky (Gradient)
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, levelData.themeColor);
    gradient.addColorStop(1, '#ffffff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    ctx.translate(-Math.floor(cameraX.current), 0);

    // Draw Platforms
    ctx.fillStyle = '#654321'; // Dirt color
    platformsRef.current.forEach(p => {
        ctx.fillRect(p.x, p.y, p.w, p.h);
        // Grass top
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(p.x, p.y, p.w, 5);
        ctx.fillStyle = '#654321';
    });

    // Draw Enemies (Goomba style - Red Box)
    enemiesRef.current.forEach(e => {
        if (e.y < 2000) { // Don't draw dead ones
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(e.x, e.y, e.w, e.h);
            // Eyes
            ctx.fillStyle = 'white';
            ctx.fillRect(e.x + 5, e.y + 5, 8, 8);
            ctx.fillRect(e.x + 18, e.y + 5, 8, 8);
            ctx.fillStyle = 'black';
            ctx.fillRect(e.x + 7, e.y + 7, 4, 4);
            ctx.fillRect(e.x + 20, e.y + 7, 4, 4);
        }
    });

    // Draw Coins
    ctx.fillStyle = '#eab308';
    coinsRef.current.forEach(c => {
        if (!c.isDead) {
            ctx.beginPath();
            ctx.arc(c.x + c.w/2, c.y + c.h/2, c.w/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });

    // Draw Flag
    if (flagRef.current) {
        const f = flagRef.current;
        ctx.fillStyle = 'white'; // Pole
        ctx.fillRect(f.x, f.y, 5, f.h);
        ctx.fillStyle = '#10b981'; // Flag
        ctx.beginPath();
        ctx.moveTo(f.x + 5, f.y);
        ctx.lineTo(f.x + 40, f.y + 20);
        ctx.lineTo(f.x + 5, f.y + 40);
        ctx.fill();
    }

    // Draw Player
    const p = player.current;
    ctx.fillStyle = '#3b82f6'; // Blue shirt
    ctx.fillRect(p.x, p.y, p.w, p.h);
    // Hat
    ctx.fillStyle = '#ef4444'; 
    ctx.fillRect(p.x - 2, p.y - 5, p.w + 4, 10);
    // Face
    ctx.fillStyle = '#fca5a5';
    ctx.fillRect(p.x + 5, p.y + 5, p.w - 10, 10);

    ctx.restore();

    // UI Overlay (Score) inside canvas
    ctx.font = 'bold 24px Cairo';
    ctx.fillStyle = 'black';
    ctx.fillText(`النقاط: ${score.current}`, 20, 40);
    ctx.fillStyle = '#eab308';
    ctx.fillText(`النقاط: ${score.current}`, 22, 42);

  }, [levelData]);

  const loop = useCallback(() => {
    update();
    draw();
    requestRef.current = requestAnimationFrame(loop);
  }, [update, draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [loop]);

  // Key Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.key] = false; };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Mobile Controls handlers
  const handleTouchStart = (key: string) => { keys.current[key] = true; };
  const handleTouchEnd = (key: string) => { keys.current[key] = false; };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-gray-900">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-4 border-gray-700 rounded-lg shadow-2xl bg-sky-300 max-w-full h-auto object-contain"
        style={{ aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}
      />
      
      {/* Mobile Controls */}
      <div className="flex justify-between w-full max-w-[800px] mt-4 px-4 pb-4 md:hidden">
         <div className="flex gap-4">
            <button 
                className="p-4 bg-white/20 rounded-full active:bg-white/40 text-white backdrop-blur-sm"
                onTouchStart={() => handleTouchStart('ArrowLeft')}
                onTouchEnd={() => handleTouchEnd('ArrowLeft')}
            >
                <ArrowLeft size={32} />
            </button>
            <button 
                className="p-4 bg-white/20 rounded-full active:bg-white/40 text-white backdrop-blur-sm"
                onTouchStart={() => handleTouchStart('ArrowRight')}
                onTouchEnd={() => handleTouchEnd('ArrowRight')}
            >
                <ArrowRight size={32} />
            </button>
         </div>
         <div className="flex gap-4">
             <button 
                className="p-4 bg-red-500/80 rounded-full active:bg-red-500 text-white shadow-lg"
                onTouchStart={() => handleTouchStart('ArrowUp')}
                onTouchEnd={() => handleTouchEnd('ArrowUp')}
            >
                <ArrowUp size={32} />
            </button>
         </div>
      </div>
    </div>
  );
};

export default GameCanvas;