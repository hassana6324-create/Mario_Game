import React, { useState, useEffect } from 'react';
import { GameStatus, LevelData } from './types';
import { generateLevel } from './services/geminiService';
import GameCanvas from './components/GameCanvas';
import { Play, RotateCcw, Trophy, Skull, Loader2, Gamepad2 } from 'lucide-react';
import { FALLBACK_LEVEL } from './constants';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.MENU);
  const [levelData, setLevelData] = useState<LevelData>(FALLBACK_LEVEL);
  const [finalScore, setFinalScore] = useState(0);
  const [hasWon, setHasWon] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  useEffect(() => {
    // Check for API key initially to warn user if needed (though we use fallback)
    if (!process.env.API_KEY) {
      setApiKeyMissing(true);
    }
  }, []);

  const startGame = async () => {
    setStatus(GameStatus.LOADING);
    
    // Slight artificial delay to show loading animation properly or fetch API
    try {
        const level = await generateLevel();
        setLevelData(level);
        setStatus(GameStatus.PLAYING);
    } catch (e) {
        console.error(e);
        // Fallback handled in service, but safety net here
        setLevelData(FALLBACK_LEVEL);
        setStatus(GameStatus.PLAYING);
    }
  };

  const handleGameOver = (score: number, win: boolean) => {
    setFinalScore(score);
    setHasWon(win);
    setStatus(win ? GameStatus.VICTORY : GameStatus.GAME_OVER);
  };

  const restartGame = () => {
    startGame();
  };

  const goToMenu = () => {
    setStatus(GameStatus.MENU);
  };

  return (
    <div className="w-full h-screen bg-slate-900 flex items-center justify-center font-cairo overflow-hidden">
      
      {/* Menu Screen */}
      {status === GameStatus.MENU && (
        <div className="text-center p-8 bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-slate-700 animate-fade-in">
          <div className="mb-6 flex justify-center text-yellow-400">
             <Gamepad2 size={64} />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">مغامرة الصحراء</h1>
          <p className="text-slate-400 mb-8 text-lg">اقفز، تفادى الأعداء، واجمع الذهب!</p>
          
          {apiKeyMissing && (
             <div className="mb-4 p-3 bg-yellow-500/20 text-yellow-200 text-sm rounded border border-yellow-500/30">
                ملاحظة: لم يتم العثور على مفتاح API. سيتم استخدام المستوى الافتراضي بدلاً من الذكاء الاصطناعي.
             </div>
          )}

          <button
            onClick={startGame}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center gap-3 text-xl shadow-lg shadow-blue-900/50"
          >
            <Play fill="currentColor" /> ابدأ المغامرة
          </button>
          
          <div className="mt-6 text-slate-500 text-sm">
             استخدم الأسهم للحركة أو أزرار اللمس.
          </div>
        </div>
      )}

      {/* Loading Screen */}
      {status === GameStatus.LOADING && (
        <div className="text-center text-white">
            <Loader2 size={64} className="animate-spin text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold animate-pulse">جاري بناء العالم بالذكاء الاصطناعي...</h2>
            <p className="text-slate-400 mt-2">يقوم Gemini بتصميم التضاريس والأعداء الآن.</p>
        </div>
      )}

      {/* Playing Canvas */}
      {status === GameStatus.PLAYING && (
        <GameCanvas 
            levelData={levelData} 
            onGameOver={handleGameOver} 
            onRestart={restartGame}
        />
      )}

      {/* Game Over / Victory Screen */}
      {(status === GameStatus.GAME_OVER || status === GameStatus.VICTORY) && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center p-8 bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full border border-slate-700 animate-bounce-in">
                <div className={`mb-4 flex justify-center ${hasWon ? 'text-yellow-400' : 'text-red-500'}`}>
                    {hasWon ? <Trophy size={80} /> : <Skull size={80} />}
                </div>
                
                <h2 className="text-3xl font-bold text-white mb-2">
                    {hasWon ? 'انتصار ساحق!' : 'انتهت اللعبة!'}
                </h2>
                
                <div className="bg-slate-900 p-4 rounded-lg mb-6 border border-slate-700">
                    <p className="text-slate-400 text-sm">النقاط النهائية</p>
                    <p className="text-4xl font-mono font-bold text-white">{finalScore}</p>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={restartGame}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <RotateCcw size={20} /> العب مرة أخرى
                    </button>
                    <button
                        onClick={goToMenu}
                        className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                        القائمة الرئيسية
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;