import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  AlarmClockCheck,
  ChevronDown,
} from "lucide-react";
import { toast } from "react-toastify";

const workSound = new Audio("dist/assets/sounds/pomo-end.mp3");
const breakSound = new Audio("dist/assets/sounds/break-end.mp3");

const MODES = [
  { label: "50/10", work: 50 * 60, break: 10 * 60 },
  { label: "25/5", work: 25 * 60, break: 5 * 60 },
  { label: "90/30", work: 90 * 60, break: 30 * 60 },
];

const Pomodoro = () => {
  const [modeIndex, setModeIndex] = useState(0);
  const [mode, setMode] = useState("work");
  const [timeLeft, setTimeLeft] = useState(MODES[modeIndex].work);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const intervalRef = useRef(null);
  const menuRef = useRef(null);

  // 🔔 Solicitar permiso para notificaciones al cargar la página
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  // 📌 Función para enviar notificación al sistema
  const sendNotification = (title, body) => {
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: "🍅" });
    }
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(
        () => setTimeLeft((prev) => prev - 1),
        1000
      );
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0) {
      const sound =
        mode === "work"
          ? workSound.cloneNode(true)
          : breakSound.cloneNode(true);
      sound.play();

      const message =
        mode === "work"
          ? "🍅 Pomodoro finished. ¡Take a break!"
          : "⏳ Break finished. ¡Time to work!";

      // 🚀 Notificación visual con react-toastify
      toast(message, { position: "top-right", autoClose: 4000, theme: "dark" });

      // 🔔 Notificación al sistema
      sendNotification("Pomodoro Timer", message);

      setTimeout(() => {
        if (mode === "work") {
          setMode("break");
          setTimeLeft(MODES[modeIndex].break);
          setPomodoroCount((prev) => prev + 1);
        } else {
          setMode("work");
          setTimeLeft(MODES[modeIndex].work);
        }
        setIsRunning(true);
      }, 100);
    }
  }, [timeLeft, mode, modeIndex]);

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleOutsideClick = (e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setMenuOpen(false);
    }
  };

  useEffect(() => {
    // Cerrar el menú cuando se haga clic fuera de él
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <div className="maincard">
      <div>
        <div className="text-2xl font-bold mb-4 flex items-center gap-2">
          {/* Pomodoro e Intervalo a la izquierda */}
          <h2 className="text-2xl font-bold flex items-center">
            <AlarmClockCheck size={24} className="mr-2" /> {/* Añadimos un margen a la derecha */}
            Pomodoro ({MODES[modeIndex].label})
            <h3 className="text-xl font-medium text-left pl-8">
              {mode === "work" ? "Work Time" : "Break Time"}
            </h3>
          </h2>
        </div>
        <div className="relative w-auto">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="editbutton"
          >
            Edit <ChevronDown size={16} />
          </button>
          {menuOpen && (
            <div
              ref={menuRef}
              className="absolute right-0 top-full  bg-bg-surface rounded-lg shadow-lg z-10"
            >
              {MODES.map((m, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setModeIndex(index);
                    setMode("work");
                    setTimeLeft(MODES[index].work);
                    setIsRunning(false);
                    setMenuOpen(false);
                  }}
                  className="block px-4 py-2 w-full text-center hover:bg-bg-tertiary rounded-md transition-colors duration-200"
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="text-5xl font-mono mb-4 text-center">
        {formatTime(timeLeft)}
      </div>

      <div className="flex justify-center space-x-4 mb-6">
        {!isRunning ? (
          <button onClick={() => setIsRunning(true)} className="button">
            <Play size={20} />
          </button>
        ) : (
          <button onClick={() => setIsRunning(false)} className="button">
            <Pause size={20} />
          </button>
        )}
        <button
          onClick={() => {
            setIsRunning(false);
            setTimeLeft(
              mode === "work" ? MODES[modeIndex].work : MODES[modeIndex].break
            );
          }}
          className="button"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      <div className="text-center text-lg font-medium">
        Completed Pomodoros: {pomodoroCount}
      </div>
    </div>
  );
};

export default Pomodoro;
