import { AlarmClock, Bell, BellOff, CheckSquare, Coffee, Link2, Link2Off, MoreVertical, Pause, Play, RotateCcw, Square, Timer } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

import PomodoroSettingsModal from "@/modals/PomodoroSettingsModal";
import SectionTitle from '@/components/SectionTitle';
import { formatPomoTime } from "@/hooks/useTimers";
import toast from "react-hot-toast";
import { useAuth } from '@/hooks/useAuth';
import useEventListener from "@/hooks/useEventListener";
import usePomodorosToday from '@/hooks/usePomodorosToday';
import { useSelector } from 'react-redux';
import useTheme from "@/hooks/useTheme";

// Initial modes
const INITIAL_MODES = [
  { label: "50/10", work: 50 * 60, break: 10 * 60, longBreak: 30 * 60 },
  { label: "25/5", work: 25 * 60, break: 5 * 60, longBreak: 15 * 60 },
  { label: "90/30", work: 90 * 60, break: 30 * 60, longBreak: 45 * 60 },
  { label: "Custom", work: 45 * 60, break: 15 * 60, longBreak: 30 * 60 }, // Add default custom mode
];

// Preload sounds
const sounds = {
  work: new Audio("/sounds/pomo-end.mp3"),
  break: new Audio("/sounds/break-end.mp3"),
  longBreak: new Audio("/sounds/break-end.mp3") // Using same sound for now
};

// Initialize sounds
Object.values(sounds).forEach(sound => {
  sound.load();
  sound.volume = 0.5;
});

const Pomodoro = () => {
  const { accentPalette } = useTheme();
  const iconColor = accentPalette === "#ffffff" ? "#000000" : "#ffffff";
  const { user } = useAuth();

  // State declarations
  const [modes, setModes] = useState(() => {
    const savedModes = localStorage.getItem("pomodoroModes");
    return savedModes ? JSON.parse(savedModes) : INITIAL_MODES;
  });

  const syncPomodoroWithTimer = useSelector(state => state.ui.syncPomodoroWithTimer);
  const isStudyRunningRedux = useSelector(state => state.ui.isStudyRunning);

  // Usar syncPomodoroWithTimer en vez de isSyncedWithStudyTimer en todos los listeners y lógica de sincronización
  // Restaurar pomoState de localStorage de forma segura
  const [pomoState, setPomoState] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    const savedState = localStorage.getItem("pomodoroState");
    const defaultModeIndex = 0;
    const defaultMode = "work";
    const defaultTimeLeft = INITIAL_MODES[defaultModeIndex][defaultMode];
    const defaultWorkSessionsBeforeLongBreak = 4;
    const safe = v => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        const safeState = {
          modeIndex: safe(Number(parsed.modeIndex)),
          currentMode: typeof parsed.currentMode === 'string' ? parsed.currentMode : defaultMode,
          timeLeft: safe(Number(parsed.timeLeft)) || defaultTimeLeft,
          isRunning: false,
          pomodoroToday: safe(parseInt(localStorage.getItem(`pomodoroDailyCount_${today}`) || "0")),
          workSessionsBeforeLongBreak: safe(Number(parsed.workSessionsBeforeLongBreak)) || defaultWorkSessionsBeforeLongBreak,
          workSessionsCompleted: safe(Number(parsed.workSessionsCompleted)),
          startTime: safe(Number(parsed.startTime)),
          pausedTime: safe(Number(parsed.pausedTime)),
          lastManualAdjustment: 0,
          pomodorosThisSession: safe(parseInt(localStorage.getItem('pomodorosThisSession') || '0')),
        };
        if (Object.values(safeState).some(v => typeof v === 'number' && !Number.isFinite(v))) {
          localStorage.removeItem('pomodoroState');
          localStorage.removeItem('pomodoroIsRunning');
          localStorage.removeItem('pomodorosThisSession');
          return {
            modeIndex: defaultModeIndex,
            currentMode: defaultMode,
            timeLeft: defaultTimeLeft,
            isRunning: false,
            pomodoroToday: 0,
            workSessionsBeforeLongBreak: defaultWorkSessionsBeforeLongBreak,
            workSessionsCompleted: 0,
            startTime: 0,
            pausedTime: 0,
            lastManualAdjustment: 0,
            pomodorosThisSession: 0,
          };
        }
        return safeState;
      } catch (error) {
        return {
          modeIndex: defaultModeIndex,
          currentMode: defaultMode,
          timeLeft: defaultTimeLeft,
          isRunning: false,
          pomodoroToday: 0,
          workSessionsBeforeLongBreak: defaultWorkSessionsBeforeLongBreak,
          workSessionsCompleted: 0,
          startTime: 0,
          pausedTime: 0,
          lastManualAdjustment: 0,
          pomodorosThisSession: 0,
        };
      }
    }
    return {
      modeIndex: defaultModeIndex,
      currentMode: defaultMode,
      timeLeft: defaultTimeLeft,
      isRunning: false,
      pomodoroToday: 0,
      workSessionsBeforeLongBreak: defaultWorkSessionsBeforeLongBreak,
      workSessionsCompleted: 0,
      startTime: 0,
      pausedTime: 0,
      lastManualAdjustment: 0,
      pomodorosThisSession: 0,
    };
  });

  const [isSyncedWithStudyTimer, setIsSyncedWithStudyTimer] = useState(() => {
    const savedState = localStorage.getItem('isSyncedWithStudyTimer');
    return savedState ? JSON.parse(savedState) : false;
  });

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [alarmEnabled, setAlarmEnabled] = useState(() => {
    const saved = localStorage.getItem('pomodoroAlarmEnabled');
    return saved === null ? true : saved === 'true';
  });

  const toggleAlarm = () => {
    setAlarmEnabled(prev => {
      localStorage.setItem('pomodoroAlarmEnabled', String(!prev));
      return !prev;
    });
  };

  // Detectar si hay sesión activa
  const activeSessionId = localStorage.getItem('activeSessionId');
  // Hook para pomodoros today
  const { total: pomodorosToday, fetchPomodoros } = usePomodorosToday(user?.id);

  const [pomodorosTodayLocal, setPomodorosTodayLocal] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    return parseInt(localStorage.getItem(`pomodoroDailyCount_${today}`) || '0', 10);
  });

  // Estado local para el toggle visual
  const [syncToggle, setSyncToggle] = useState(() => {
    return localStorage.getItem('isSyncedWithStudyTimer') === 'true';
  });

  // Mantener syncToggle en sync con cambios externos
  useEffect(() => {
    const handler = (e) => {
      setSyncToggle(e.detail.isSyncedWithStudyTimer);
    };
    window.addEventListener('studyTimerSyncStateChanged', handler);
    return () => window.removeEventListener('studyTimerSyncStateChanged', handler);
  }, []);

  // Handler para el toggle visual
  const handleSyncToggle = () => {
    const newSync = !syncToggle;
    setSyncToggle(newSync);
    localStorage.setItem('isSyncedWithStudyTimer', newSync ? 'true' : 'false');
    setIsSyncedWithStudyTimer(newSync);
    window.dispatchEvent(new CustomEvent('studyTimerSyncStateChanged', { detail: { isSyncedWithStudyTimer: newSync } }));
  };

  const [lastSyncTimestamp, setLastSyncTimestamp] = useState(null);

  // All function declarations first
  const handlePomodoroComplete = useCallback(() => {
    const isWork = pomoState.currentMode === "work";
    const shouldTakeLongBreak = isWork &&
      (pomoState.workSessionsCompleted + 1) % pomoState.workSessionsBeforeLongBreak === 0;

    const nextMode = isWork
      ? (shouldTakeLongBreak ? "longBreak" : "break")
      : "work";

    const sound = sounds[isWork ? "work" : (pomoState.currentMode === "longBreak" ? "longBreak" : "break")];

    // Play sound
    sound.currentTime = 0;
    sound.play().catch(console.error);

    // Update state
    setPomoState(prev => {
      // Increment pomodoroToday at the end of a work session
      const shouldIncrementPomodoro = isWork;
      const newPomodoroToday = shouldIncrementPomodoro ? prev.pomodoroToday + 1 : prev.pomodoroToday;
      // Immediately update localStorage for daily count
      if (shouldIncrementPomodoro) {
        const today = new Date().toISOString().slice(0, 10);
        const prevCount = parseInt(localStorage.getItem(`pomodoroDailyCount_${today}`) || '0', 10);
        const newCount = prevCount + 1;
        localStorage.setItem(`pomodoroDailyCount_${today}`, String(newCount));
        setPomodorosTodayLocal(newCount);
      }
      const newWorkSessionsCompleted = isWork ? prev.workSessionsCompleted + 1 : prev.workSessionsCompleted;
      return {
        ...prev,
        currentMode: nextMode,
        timeLeft: modes[prev.modeIndex][nextMode],
        pomodoroToday: newPomodoroToday,
        workSessionsCompleted: newWorkSessionsCompleted,
        pomodorosThisSession: shouldIncrementPomodoro ? prev.pomodorosThisSession + 1 : prev.pomodorosThisSession, // Increment session counter
      };
    });

    // Show toast notification
    if (isWork) {
      if (shouldTakeLongBreak) {
        toast.success("Work session complete! Time for a long break. 🎉", {
          duration: 3000,
          position: 'top-right',
          style: {
            backgroundColor: '#000',
            color: '#fff',
            border: '2px solid var(--border-primary)',
          },
        });
      } else {
        toast.success("Work session complete! Time for a break.", {
          position: 'top-right',
          style: {
            backgroundColor: '#000',
            color: '#fff',
            border: '2px solid var(--border-primary)',
          },
        });
      }
    } else {
      toast.success("Break is over! Let's get back to work! 💪", {
        duration: 3000,
        position: 'top-right',
        style: {
          backgroundColor: '#000',
          color: '#fff',
          border: '2px solid var(--border-primary)',
        },
      });
    }

    // Show browser notification
    showNotification(
      isWork
        ? (shouldTakeLongBreak ? "Work Session Complete! Time for a Long Break! 🎉" : "Work Session Complete! 🎉")
        : "Break Complete! ⏰",
      {
        body: isWork
          ? (shouldTakeLongBreak
            ? "Great job! Time to take a well-deserved long break."
            : "Great job! Time to take a short break.")
          : "Break is over! Time to get back to work.",
        icon: isWork ? "🍅" : "💪",
        badge: isWork ? "🍅" : "💪",
        tag: "pomodoro-notification",
        requireInteraction: true
      }
    );
  }, [pomoState.currentMode, pomoState.modeIndex, pomoState.workSessionsCompleted, pomoState.workSessionsBeforeLongBreak, Notification.permission, modes]);

  const handleStart = useCallback((baseTimestamp, fromSync) => {
    const modeDuration = modes[pomoState.modeIndex][pomoState.currentMode];
    const now = baseTimestamp || Date.now();
    setPomoState(prev => ({
      ...prev,
      isRunning: true,
      startTime: now / 1000,
      pausedTime: 0,
      timeLeft: prev.pausedTime > 0 ? prev.timeLeft : modeDuration,
      lastManualAdjustment: now
    }));
    if (!fromSync && syncPomodoroWithTimer) {
      window.dispatchEvent(new CustomEvent("playPomodoroSync", { detail: { baseTimestamp: now } }));
      window.dispatchEvent(new CustomEvent("playCountdownSync", { detail: { baseTimestamp: now } }));
    }
  }, [pomoState.modeIndex, pomoState.currentMode, modes, syncPomodoroWithTimer]);

  const handleStop = useCallback((fromSync) => {
    setPomoState(prev => ({
      ...prev,
      isRunning: false,
      pausedTime: Date.now() / 1000,
      lastManualAdjustment: Date.now()
    }));
    if (!fromSync && syncPomodoroWithTimer) {
      window.dispatchEvent(new CustomEvent("pauseTimerSync", { detail: { baseTimestamp: Date.now() } }));
    }
  }, [syncPomodoroWithTimer]);

  const handleReset = useCallback((fromSync) => {
    const modeDuration = modes[pomoState.modeIndex]['work'];
    setPomoState(prev => ({
      ...prev,
      isRunning: false,
      currentMode: 'work',
      timeLeft: modeDuration,
      startTime: 0,
      pausedTime: 0,
      lastManualAdjustment: Date.now()
    }));
    // Limpiar localStorage
    localStorage.removeItem('pomodoroState');
    localStorage.removeItem('pomodoroIsRunning');
    localStorage.removeItem('pomodorosThisSession');
    if (!fromSync && syncPomodoroWithTimer) {
      window.dispatchEvent(new CustomEvent("resetPomodoroSync", { detail: { baseTimestamp: Date.now() } }));
      window.dispatchEvent(new CustomEvent("resetCountdownSync", { detail: { baseTimestamp: Date.now() } }));
    }
  }, [pomoState.modeIndex, modes, syncPomodoroWithTimer]);

  const handleModeChange = useCallback((index) => {
    const safeIndex = Math.min(index, modes.length - 1);
    setPomoState(prev => ({
      ...prev,
      modeIndex: safeIndex,
      timeLeft: modes[safeIndex][prev.currentMode],
      isRunning: false,
    }));
  }, [modes]);

  const handleSaveCustomMode = useCallback((customMode) => {
    setModes(prev => {
      const newModes = [...prev];
      const customModeIndex = newModes.length - 1;
      newModes[customModeIndex] = customMode;
      handleModeChange(customModeIndex);
      return newModes;
    });
  }, [handleModeChange]);

  const handleTimeAdjustment = useCallback((adjustment) => {
    const now = Date.now();
    const currentMode = modes[pomoState.modeIndex];
    const maxTime = currentMode[pomoState.currentMode];

    let newTimeLeft;
    if (pomoState.isRunning) {
      newTimeLeft = Math.max(0, Math.min(pomoState.timeLeft + adjustment, maxTime));
      setPomoState(prev => ({
        ...prev,
        timeLeft: newTimeLeft,
        startTime: now / 1000,
        pausedTime: 0,
        lastManualAdjustment: now
      }));
      if (newTimeLeft === 0) {
        handlePomodoroComplete();
      }
    } else {
      newTimeLeft = Math.max(0, Math.min(pomoState.timeLeft + adjustment, maxTime));
      setPomoState(prev => ({
        ...prev,
        timeLeft: newTimeLeft,
        lastManualAdjustment: now
      }));
      if (newTimeLeft === 0) {
        handlePomodoroComplete();
      }
    }

    if (syncPomodoroWithTimer) {
      window.dispatchEvent(new CustomEvent("adjustStudyTimerTime", {
        detail: {
          adjustment: -adjustment,
          forceSync: true
        }
      }));
    }
  }, [pomoState.isRunning, pomoState.currentMode, pomoState.timeLeft, modes, pomoState.modeIndex, syncPomodoroWithTimer, handlePomodoroComplete]);

  const handleWorkSessionsChange = useCallback((newWorkSessions) => {
    setPomoState(prev => ({
      ...prev,
      workSessionsBeforeLongBreak: newWorkSessions,
      workSessionsCompleted: 0
    }));
  }, []);

  // All event listeners after all function declarations
  useEventListener("startPomodoro", handleStart, [handleStart]);
  useEventListener("pauseTimerSync", () => {
    if (pomoState.isRunning && syncPomodoroWithTimer) {
      handleStop();
    }
  }, [pomoState.isRunning, handleStop, syncPomodoroWithTimer]);
  useEventListener("stopPomodoro", handleStop, [handleStop]);
  useEventListener("resetPomodoro", handleReset, [handleReset]);
  useEventListener("playTimerSync", (event) => {
    if (!syncPomodoroWithTimer) return;
    const baseTimestamp = event?.detail?.baseTimestamp || Date.now();
    if (lastSyncTimestamp === baseTimestamp) return;
    setLastSyncTimestamp(baseTimestamp);
    if (!pomoState.isRunning) {
      handleStart(baseTimestamp, true);
    }
  }, [syncPomodoroWithTimer, pomoState.isRunning, lastSyncTimestamp]);

  useEventListener("playPomodoroSync", (event) => {
    if (!syncPomodoroWithTimer) return;
    const baseTimestamp = event?.detail?.baseTimestamp || Date.now();
    if (lastSyncTimestamp === baseTimestamp) return;
    setLastSyncTimestamp(baseTimestamp);
    if (!pomoState.isRunning) {
      handleStart(baseTimestamp, true);
    }
  }, [syncPomodoroWithTimer, pomoState.isRunning, lastSyncTimestamp]);

  useEventListener("pausePomodoroSync", (event) => {
    if (!syncPomodoroWithTimer) return;
    const baseTimestamp = event?.detail?.baseTimestamp || Date.now();
    if (lastSyncTimestamp === baseTimestamp) return;
    setLastSyncTimestamp(baseTimestamp);
    if (pomoState.isRunning) {
      handleStop(true);
    }
  }, [syncPomodoroWithTimer, pomoState.isRunning, lastSyncTimestamp]);

  useEventListener("resetTimerSync", (event) => {
    if (!syncPomodoroWithTimer) return;
    const baseTimestamp = event?.detail?.baseTimestamp || Date.now();
    if (lastSyncTimestamp === baseTimestamp) return;
    setLastSyncTimestamp(baseTimestamp);
    handleReset(true);
  }, [syncPomodoroWithTimer, lastSyncTimestamp]);

  useEventListener("studyTimerReset", () => {
    if (syncPomodoroWithTimer) {
      handleReset();
    }
  }, [syncPomodoroWithTimer, handleReset]);

  useEventListener("studyTimerPause", () => {
    if (syncPomodoroWithTimer && pomoState.isRunning) {
      handleStop();
    }
  }, [syncPomodoroWithTimer, pomoState.isRunning, handleStop]);

  useEventListener("studyTimerStart", () => {
    if (syncPomodoroWithTimer && !pomoState.isRunning) {
      handleStart();
    }
  }, [syncPomodoroWithTimer, pomoState.isRunning, handleStart]);

  useEventListener("studyTimerSyncStateChanged", (event) => {
    const { isSyncedWithStudyTimer: newSyncState } = event.detail;
    setIsSyncedWithStudyTimer(newSyncState);
  }, []);

  useEventListener("studyTimerTimeUpdate", (event) => {
    if (!syncPomodoroWithTimer) return;

    const studyTime = Math.floor(event.detail.time);
    const currentMode = modes[pomoState.modeIndex];
    const totalWorkTime = currentMode.work;
    const totalBreakTime = currentMode.break;
    const totalCycleTime = totalWorkTime + totalBreakTime;

    // Ignorar actualizaciones si ha habido un ajuste manual reciente (dentro de 2 segundos)
    const now = Date.now();
    if (now - pomoState.lastManualAdjustment < 2000) {
      return;
    }

    // Calcular posición en el ciclo
    const positionInCycle = studyTime % totalCycleTime;
    const shouldBeWorkMode = positionInCycle < totalWorkTime;
    const isTransitionPoint = positionInCycle === 0 || positionInCycle === totalWorkTime;

    // Actualizar el estado del Pomodoro
    if (isTransitionPoint && shouldBeWorkMode !== (pomoState.currentMode === "work")) {
      setPomoState(prev => ({
        ...prev,
        currentMode: shouldBeWorkMode ? "work" : "break",
        timeLeft: shouldBeWorkMode ? totalWorkTime : totalBreakTime,
        pomodoroToday: shouldBeWorkMode ? prev.pomodoroToday + 1 : prev.pomodoroToday,
        pomodorosThisSession: shouldBeWorkMode ? prev.pomodorosThisSession + 1 : prev.pomodorosThisSession,
        isRunning: prev.isRunning // Solo mantener corriendo si ya estaba corriendo
      }));

      // Play sound and show notification
      const sound = sounds[shouldBeWorkMode ? "break" : "work"];
      sound.currentTime = 0;
      sound.play().catch(console.error);

      // Show notifications
      if (shouldBeWorkMode) {
        toast.success("Break is over! Let's get back to work! 💪", {
          duration: 3000,
          position: 'top-right',
          style: {
            backgroundColor: '#000',
            color: '#fff',
            border: '2px solid var(--border-primary)',
          },
        });
      } else {
        toast.success("Work session complete! Time for a break.", {
          position: 'top-right',
          style: {
            backgroundColor: '#000',
            color: '#fff',
            border: '2px solid var(--border-primary)',
          },
        });
      }

      // Show browser notification
      if ("Notification" in window && Notification.permission === "granted") {
        showNotification(
          shouldBeWorkMode ? "Break Complete! ⏰" : "Work Session Complete! 🎉",
          {
            body: shouldBeWorkMode
              ? "Break is over! Time to get back to work."
              : "Great job! Time to take a well-deserved break.",
            icon: shouldBeWorkMode ? "💪" : "🍅",
            badge: shouldBeWorkMode ? "💪" : "🍅",
            tag: "pomodoro-notification",
            requireInteraction: true
          }
        );
      }
    }

    // Actualizar el tiempo restante
    const maxTime = shouldBeWorkMode ? totalWorkTime : totalBreakTime;
    const timeLeft = shouldBeWorkMode
      ? Math.min(maxTime, totalWorkTime - positionInCycle)
      : Math.min(maxTime, totalBreakTime - (positionInCycle - totalWorkTime));

    setPomoState(prev => ({
      ...prev,
      timeLeft: Math.max(0, timeLeft),
      isRunning: prev.isRunning // Solo mantener corriendo si ya estaba corriendo
    }));
  }, [syncPomodoroWithTimer, modes, pomoState.modeIndex, pomoState.currentMode, pomoState.lastManualAdjustment, Notification.permission]);

  useEventListener("adjustPomodoroTime", (event) => {
    const { adjustment } = event.detail;
    handleTimeAdjustment(adjustment);
  }, [handleTimeAdjustment]);

  // Listen for finishSession event to reset session pomodoro counter
  useEventListener("finishSession", () => {
    setPomoState(prev => ({
      ...prev,
      pomodorosThisSession: 0
    }));
  }, []);

  // Listen for session start event to reset session pomodoro counter
  useEventListener("sessionStarted", () => {
    setPomoState(prev => ({
      ...prev,
      pomodorosThisSession: 0
    }));
  }, []);

  // Effects after all event listeners
  useEffect(() => {
    localStorage.setItem("pomodoroModes", JSON.stringify(modes));
  }, [modes]);

  useEffect(() => {
    // Guardar solo valores válidos
    const safe = (v, def) => (typeof v === 'number' && Number.isFinite(v) ? v : def);
    const stateToSave = {
      modeIndex: safe(pomoState.modeIndex, 0),
      currentMode: typeof pomoState.currentMode === 'string' ? pomoState.currentMode : 'work',
      timeLeft: safe(pomoState.timeLeft, 1500),
      startTime: safe(pomoState.startTime, 0),
      pausedTime: safe(pomoState.pausedTime, 0),
      workSessionsBeforeLongBreak: safe(pomoState.workSessionsBeforeLongBreak, 4),
      workSessionsCompleted: safe(pomoState.workSessionsCompleted, 0),
      pomodoroToday: safe(pomoState.pomodoroToday, 0)
    };
    // Si algún valor es NaN, limpiar localStorage
    if (Object.values(stateToSave).some(v => typeof v === 'number' && !Number.isFinite(v))) {
      localStorage.removeItem('pomodoroState');
    } else {
      localStorage.setItem('pomodoroState', JSON.stringify(stateToSave));
    }
    localStorage.setItem('pomodoroIsRunning', pomoState.isRunning.toString());
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(`pomodoroDailyCount_${today}`, safe(pomoState.pomodoroToday, 0).toString());
  }, [pomoState]);

  useEffect(() => {
    localStorage.setItem('pomodorosThisSession', pomoState.pomodorosThisSession.toString());
  }, [pomoState.pomodorosThisSession]);

  // On mount, update pomodorosTodayLocal in case the day changed
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setPomodorosTodayLocal(parseInt(localStorage.getItem(`pomodoroDailyCount_${today}`) || '0', 10));
  }, []);

  // Resetear el contador diario a medianoche
  useEffect(() => {
    const resetDailyCount = () => {
      const today = new Date().toISOString().slice(0, 10);
      const lastReset = localStorage.getItem('lastPomodoroReset');

      if (lastReset !== today) {
        localStorage.setItem('lastPomodoroReset', today);
        localStorage.setItem(`pomodoroDailyCount_${today}`, '0');
        setPomoState(prev => ({
          ...prev,
          pomodoroToday: 0
        }));
      }
    };

    // Resetear al cargar la página
    resetDailyCount();

    // Configurar el intervalo para verificar a medianoche
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const timeUntilMidnight = midnight.getTime() - now.getTime();

    const midnightTimeout = setTimeout(() => {
      resetDailyCount();
      // Configurar el intervalo para verificar cada día
      setInterval(resetDailyCount, 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);

    return () => clearTimeout(midnightTimeout);
  }, []);

  // Timer logic
  useEffect(() => {
    let interval;
    if (isStudyRunningRedux && pomoState.timeLeft > 0) {
      // Restart interval whenever isRunning or timeLeft changes
      const startTime = Date.now();
      const startCountingDownFrom = pomoState.timeLeft;

      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const newTimeLeft = Math.max(0, startCountingDownFrom - elapsed);

        if (newTimeLeft <= 0) {
          if (alarmEnabled) {
            try {
              new Audio('/sounds/pomo-end.mp3').play();
            } catch {}
          }
          handlePomodoroComplete();
          return;
        }

        setPomoState(prev => ({
          ...prev,
          timeLeft: newTimeLeft
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStudyRunningRedux, pomoState.timeLeft, alarmEnabled]);

  // Fetch al montar y al terminar sesión
  useEffect(() => {
    fetchPomodoros();
    // Escuchar evento para refrescar
    const handler = () => fetchPomodoros();
    window.addEventListener('refreshStats', handler);
    return () => window.removeEventListener('refreshStats', handler);
  }, [fetchPomodoros]);

  const showNotification = (title, options) => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    try {
      const notification = new window.Notification(title, {
        ...options,
        silent: false,
        vibrate: [200, 100, 200]
      });

      // Close notification after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle notification click
      notification.onclick = () => {
        if (typeof window !== 'undefined') {
          window.focus();
        }
        notification.close();
      };
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  const isRunning = syncPomodoroWithTimer ? isStudyRunningRedux : pomoState.isRunning;
  const handlePlayPause = () => {
    if (syncPomodoroWithTimer) {
      if (isStudyRunningRedux) {
        window.dispatchEvent(new CustomEvent("pausePomodoroSync", { detail: { baseTimestamp: Date.now() } }));
        window.dispatchEvent(new CustomEvent("pauseCountdownSync", { detail: { baseTimestamp: Date.now() } }));
      } else {
        window.dispatchEvent(new CustomEvent("playPomodoroSync", { detail: { baseTimestamp: Date.now() } }));
        window.dispatchEvent(new CustomEvent("playCountdownSync", { detail: { baseTimestamp: Date.now() } }));
      }
    } else {
      if (pomoState.isRunning) {
        handleStop();
      } else {
        handleStart();
      }
    }
  };

  return (
    <div className="flex flex-col items-center h-full">
      {/* Header: Icon, Title, Settings Button */}
      <div className="section-title justify-center mb-4 relative w-full px-4 py-3">
        <AlarmClock size={24} className="icon" style={{ color: 'var(--accent-primary)' }} />
        <span className="font-bold text-lg sm:text-xl text-[var(--text-primary)] ml-1">Pomodoro</span>
        {/* Botón de configuración de sesión */}
        <button
          onClick={() => setIsSettingsModalOpen(true)}
          className="absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Configure pomodoro"
        >
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Timer display con tooltip */}
      <div className="relative group text-4xl sm:text-5xl font-mono mb-6 text-center" role="timer" aria-label="Current pomodoro time">
        <span>{formatPomoTime(pomoState.timeLeft)}</span>
        <div className="absolute left-1/2 -translate-x-1/2 mt-2 z-50 hidden group-hover:block bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-4 py-2 text-sm text-[var(--text-primary)] shadow-xl min-w-[180px] text-center">
          <div className="font-semibold mb-1">
            {pomoState.currentMode === 'work' && 'Work'}
            {pomoState.currentMode === 'break' && 'Break'}
            {pomoState.currentMode === 'longBreak' && 'Long Break'}
          </div>
          <div>
            Pomodoros done today: <b>{user ? pomodorosToday : pomodorosTodayLocal}</b>
          </div>
          {activeSessionId && (
            <div>
              Pomodoros during session: <b>{pomoState.pomodorosThisSession}</b>
            </div>
          )}
        </div>
      </div>

      {/* Time adjustment buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => handleTimeAdjustment(-600)}
          className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Subtract 10 minutes"
        >
          -10
        </button>
        <button
          onClick={() => handleTimeAdjustment(-300)}
          className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Subtract 5 minutes"
        >
          -5
        </button>
        <button
          onClick={() => handleTimeAdjustment(300)}
          className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Add 5 minutes"
        >
          +5
        </button>
        <button
          onClick={() => handleTimeAdjustment(600)}
          className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Add 10 minutes"
        >
          +10
        </button>
      </div>

      {/* Timer controls */}
      <div className="timer-controls flex justify-center items-center gap-3">
        <button
          onClick={handleReset}
          className="control-button flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Reset timer"
        >
          <RotateCcw size={24} style={{ color: "var(--accent-primary)" }} />
        </button>
        {!isRunning ? (
          <button
            onClick={() => handleStart()}
            className="control-button flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Start timer"
          >
            <Play size={24} style={{ color: "var(--accent-primary)" }} />
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="control-button flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Pause timer"
          >
            <Pause size={24} style={{ color: "var(--accent-primary)" }} />
          </button>
        )}
      </div>

      {/* Quitar visualización directa de modo y pomodoros debajo del timer */}

      {/* Add Pomodoro Settings Modal */}
      <PomodoroSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentModeIndex={pomoState.modeIndex}
        modes={modes}
        onModeChange={handleModeChange}
        onSaveCustomMode={handleSaveCustomMode}
        workSessionsBeforeLongBreak={pomoState.workSessionsBeforeLongBreak}
        onWorkSessionsChange={handleWorkSessionsChange}
      />
    </div>
  );
};

export default Pomodoro; 