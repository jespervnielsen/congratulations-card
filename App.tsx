
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Star, Cake } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- Helpers ---

const ANNIVERSARY_MONTH = 4; // April (1-indexed for Intl)
const ANNIVERSARY_DAY = 22;
const TIMEZONE = 'Europe/Copenhagen';

/** Returns the current date parts in Copenhagen local time. */
const getCphDate = (now = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now);
  return {
    year: Number(parts.find(p => p.type === 'year')!.value),
    month: Number(parts.find(p => p.type === 'month')!.value),
    day: Number(parts.find(p => p.type === 'day')!.value),
  };
};

const isAnniversaryToday = (): boolean => {
  const { month, day } = getCphDate();
  return month === ANNIVERSARY_MONTH && day === ANNIVERSARY_DAY;
};

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** Returns milliseconds until midnight on a given yyyy-mm-dd in Copenhagen time. */
const getMidnightCph = (year: number, month: number, day: number): Date => {
  // 'sv-SE' locale uses YYYY-MM-DD format, giving us a clean ISO date string
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  // Create a timestamp by treating the date as a Copenhagen midnight
  // We iterate to find the exact UTC ms for midnight in Copenhagen
  const approx = new Date(`${dateStr}T00:00:00`);
  // Use the formatter to confirm/adjust: find the UTC offset at that approximate time
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  // Binary search / direct offset: get what Copenhagen time corresponds to our approx UTC
  const local = formatter.format(approx);
  // local is like "2026-04-22, 02:00:00" — parse hour offset and adjust
  const hourMatch = local.match(/(\d{2}):(\d{2}):(\d{2})$/);
  if (hourMatch) {
    const h = parseInt(hourMatch[1], 10);
    const m = parseInt(hourMatch[2], 10);
    const s = parseInt(hourMatch[3], 10);
    // Subtract local hours to reach midnight
    return new Date(approx.getTime() - (h * 3600 + m * 60 + s) * 1000);
  }
  return approx;
};

const getTimeUntilAnniversary = (): Countdown => {
  const now = new Date();
  const { year, month, day } = getCphDate(now);
  const isToday = month === ANNIVERSARY_MONTH && day === ANNIVERSARY_DAY;
  // Find the next upcoming anniversary midnight (skip today — it's already here)
  const targetYear = isToday || (month > ANNIVERSARY_MONTH || (month === ANNIVERSARY_MONTH && day > ANNIVERSARY_DAY))
    ? year + 1
    : year;
  const target = getMidnightCph(targetYear, ANNIVERSARY_MONTH, ANNIVERSARY_DAY);
  const diff = Math.max(0, target.getTime() - now.getTime());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
};

// --- Dodging button hook ---

const useDodgingButton = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDodging, setIsDodging] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const moveButton = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const btnWidth = rect.width;
    const btnHeight = rect.height;

    setPosition(prev => {
      const initialX = rect.left - prev.x;
      const initialY = rect.top - prev.y;
      const minTransX = -initialX + 20;
      const maxTransX = window.innerWidth - initialX - btnWidth - 20;
      const minTransY = -initialY + 20;
      const maxTransY = window.innerHeight - initialY - btnHeight - 20;
      const jumpRange = 250;
      let nextX = prev.x + (Math.random() - 0.5) * jumpRange * 2;
      let nextY = prev.y + (Math.random() - 0.5) * jumpRange * 2;
      nextX = Math.max(minTransX, Math.min(maxTransX, nextX));
      nextY = Math.max(minTransY, Math.min(maxTransY, nextY));
      return { x: nextX, y: nextY };
    });
    setIsDodging(true);
  }, []);

  return { buttonRef, position, isDodging, moveButton };
};

// --- Components ---

const FloatingStars = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-bounce text-yellow-300 opacity-40"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${3 + Math.random() * 5}s`
          }}
        >
          <Star size={20 + Math.random() * 30} fill="currentColor" />
        </div>
      ))}
    </div>
  );
};

const SuccessView: React.FC = () => {
  useEffect(() => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: ReturnType<typeof setInterval> = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-in fade-in zoom-in duration-500">
      <div className="bg-white rounded-3xl p-8 shadow-2xl border-8 border-yellow-200 text-center max-w-md w-full relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-pink-400 to-yellow-400"></div>

        <img
          src="https://media.giphy.com/media/OfkGZ5H2H3f8Y/giphy.gif"
          alt="Celebrating"
          className="w-64 h-64 mx-auto mb-6 rounded-2xl object-cover shadow-lg"
        />

        <h1 className="text-4xl font-pacifico text-yellow-600 mb-4 animate-bounce">
          Tillykke Nikita! 🎉
        </h1>

        <p className="text-xl text-gray-700 font-semibold mb-6">
          Ja, tillykke — nu skal vi fejre med jordbærkage! 🍓🎂
        </p>

        <div className="flex justify-center gap-4">
          <Cake className="text-pink-500 animate-pulse" size={32} />
          <Star className="text-yellow-400 animate-spin fill-yellow-400" size={32} />
          <Cake className="text-pink-500 animate-pulse" size={32} />
        </div>
      </div>
    </div>
  );
};

const CountdownView: React.FC = () => {
  const [countdown, setCountdown] = useState<Countdown>(getTimeUntilAnniversary);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getTimeUntilAnniversary());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-in fade-in zoom-in duration-500">
      <div className="bg-white rounded-3xl p-8 shadow-2xl border-8 border-blue-200 text-center max-w-md w-full relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400"></div>

        <img
          src="https://media.giphy.com/media/l4FGuhL4U2WyjdkaY/giphy.gif"
          alt="Waiting"
          className="w-48 h-48 mx-auto mb-6 rounded-2xl object-cover shadow-lg"
        />

        <h1 className="text-3xl font-pacifico text-blue-600 mb-2">
          Desværre ikke
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Nikitas årsdag er om:
        </p>

        <div className="grid grid-cols-4 gap-2 mb-6">
          {[
            { label: 'Dage', value: countdown.days },
            { label: 'Timer', value: countdown.hours },
            { label: 'Min', value: countdown.minutes },
            { label: 'Sek', value: countdown.seconds },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center bg-blue-50 rounded-xl p-3">
              <span className="text-3xl font-bold text-blue-700">
                {String(value).padStart(2, '0')}
              </span>
              <span className="text-xs text-gray-500 mt-1">{label}</span>
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-400">Vi glæder os! 🎉</p>
      </div>
    </div>
  );
};

const CongratulationsCard: React.FC<{ onYes: () => void; onNo: () => void }> = ({ onYes, onNo }) => {
  const specialDay = isAnniversaryToday();
  const dodging = useDodgingButton();

  // On the special day: No dodges. Otherwise: Yes dodges.
  const yesDodgeProps = !specialDay
    ? {
        ref: dodging.buttonRef,
        onMouseEnter: dodging.moveButton,
        onClick: dodging.moveButton,
        style: {
          transform: dodging.isDodging ? `translate(${dodging.position.x}px, ${dodging.position.y}px)` : 'none',
          transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
        },
        className: 'px-10 py-4 bg-green-500 text-white font-bold rounded-full shadow-lg text-xl cursor-default select-none touch-none',
      }
    : {
        onClick: onYes,
        className: 'px-10 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full shadow-lg transform hover:scale-110 active:scale-95 transition-all text-xl z-20',
      };

  const noDodgeProps = specialDay
    ? {
        ref: dodging.buttonRef,
        onMouseEnter: dodging.moveButton,
        onClick: dodging.moveButton,
        style: {
          transform: dodging.isDodging ? `translate(${dodging.position.x}px, ${dodging.position.y}px)` : 'none',
          transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
        },
        className: 'px-10 py-4 bg-gray-200 text-gray-500 font-bold rounded-full shadow-md text-xl cursor-default select-none touch-none',
      }
    : {
        onClick: onNo,
        className: 'px-10 py-4 bg-gray-200 hover:bg-gray-300 text-gray-600 font-bold rounded-full shadow-md text-xl transition-all z-20',
      };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10">
      <div className="bg-white rounded-3xl p-8 shadow-2xl border-8 border-yellow-200 text-center max-w-md w-full animate-in slide-in-from-bottom-10 duration-700">
        <img
          src="https://media.giphy.com/media/WK7omsLop0431tZjXb/giphy.gif"
          alt="Celebration"
          className="w-48 h-48 mx-auto mb-6 rounded-full border-4 border-yellow-100 shadow-inner"
        />

        <h1 className="text-4xl font-bold text-gray-800 mb-8 leading-tight">
          Har Nikita <br />
          <span className="text-yellow-500 decoration-yellow-300 underline underline-offset-4">årsdag</span>?
        </h1>

        <div className="relative h-24 flex items-center justify-center gap-6">
          <button {...(yesDodgeProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
            Ja! 🎉
          </button>

          <button {...(noDodgeProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
            Nej
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

type View = 'card' | 'success' | 'countdown';

const getInitialView = (): View => {
  const params = new URLSearchParams(window.location.search);
  const param = params.get('view');
  if (param === 'success' || param === 'countdown') return param;
  return 'card';
};

export default function App() {
  const [view, setView] = useState<View>(getInitialView);

  return (
    <main className="min-h-screen bg-yellow-50 text-gray-900 relative">
      <FloatingStars />

      {view === 'card' && (
        <CongratulationsCard
          onYes={() => setView('success')}
          onNo={() => setView('countdown')}
        />
      )}
      {view === 'success' && <SuccessView />}
      {view === 'countdown' && <CountdownView />}

      <div className="fixed bottom-4 right-4 text-yellow-400 font-medium text-xs pointer-events-none z-50">
        Lavet med 🎂 til Nikita
      </div>
    </main>
  );
}
