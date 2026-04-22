import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Trophy, Gamepad2 } from 'lucide-react';

const EMOJIS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export default function KidsGame({ onClose }: { onClose: () => void }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    const shuffled = [...EMOJIS, ...EMOJIS].sort(() => Math.random() - 0.5);
    setCards(shuffled.map((emoji, index) => ({ id: index, emoji, isFlipped: false, isMatched: false })));
    setFlippedIndices([]);
    setMoves(0);
    setWon(false);
    setIsLocked(false);
  };

  const handleCardClick = (index: number) => {
    if (isLocked || cards[index].isFlipped || cards[index].isMatched) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setIsLocked(true);
      setMoves(m => m + 1);

      const [first, second] = newFlipped;
      if (cards[first].emoji === cards[second].emoji) {
        newCards[first].isMatched = true;
        newCards[second].isMatched = true;
        setCards(newCards);
        setFlippedIndices([]);
        setIsLocked(false);
        
        if (newCards.every(c => c.isMatched)) {
          setWon(true);
        }
      } else {
        setTimeout(() => {
          const resetCards = [...cards];
          resetCards[first].isFlipped = false;
          resetCards[second].isFlipped = false;
          setCards(resetCards);
          setFlippedIndices([]);
          setIsLocked(false);
        }, 1000);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0A0A0A] text-[#F5F5F5] overflow-y-auto w-full h-full flex flex-col">
      <header className="flex items-center justify-between p-4 lg:p-8 border-b border-white/10 shrink-0">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#E1C27A] hover:text-white transition-colors font-mono"
        >
          <ArrowLeft className="w-4 h-4" /> Back to App
        </button>
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-blue-400" />
          <span className="font-serif italic text-xl tracking-wide text-blue-400 font-bold">Kids Arcade</span>
        </div>
        <button onClick={startNewGame} className="flex items-center gap-2 text-[10px] uppercase font-mono tracking-widest text-white/50 hover:text-white">
          <RefreshCw className="w-3 h-3" /> Restart
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {won && (
          <div className="mb-8 text-center animate-in slide-in-from-bottom flex flex-col items-center">
            <Trophy className="w-16 h-16 text-yellow-400 mb-4 animate-bounce" />
            <h2 className="text-3xl font-bold text-yellow-400 mb-2">You Won!</h2>
            <p className="text-white/60 font-mono text-sm uppercase tracking-widest">Total Moves: {moves}</p>
            <button 
              onClick={startNewGame}
              className="mt-6 px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold uppercase tracking-widest transition-transform hover:scale-105"
            >
              Play Again
            </button>
          </div>
        )}

        {!won && (
          <div className="mb-6 flex justify-between w-full max-w-md px-4">
            <span className="text-sm font-mono text-white/50 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/10">Memory Match</span>
            <span className="text-sm font-mono text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">Moves: {moves}</span>
          </div>
        )}

        <div className={`grid grid-cols-4 gap-3 md:gap-4 max-w-md w-full ${won ? 'opacity-50 pointer-events-none' : ''}`}>
          {cards.map((card, index) => (
            <div 
              key={card.id}
              onClick={() => handleCardClick(index)}
              className={`aspect-square rounded-2xl cursor-pointer flex items-center justify-center text-4xl select-none transition-all duration-300 transform-gpu perspective-1000 ${card.isFlipped || card.isMatched ? 'bg-blue-500/20 border-blue-500/50 scale-95 shadow-inner' : 'bg-white/10 hover:bg-white/20 border-white/20 hover:scale-105 shadow-xl'} border border-b-4`}
            >
              <div className={`transition-opacity duration-300 flex items-center justify-center ${card.isFlipped || card.isMatched ? 'opacity-100' : 'opacity-0'}`}>
                {card.emoji}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
