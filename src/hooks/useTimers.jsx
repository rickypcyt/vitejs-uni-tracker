import { useRef, useEffect } from "react";

// Hook corregido para StudyTimer
export function useStudyTimer(callback, isRunning, timeAtStart = 0, lastStart = null) {
  const intervalRef = useRef();
  const savedCallback = useRef();
  const startTimeRef = useRef(null);

  // Guardar el callback actual
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Efecto principal del timer
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (!isRunning || !lastStart) {
      return;
    }

    // Inicializar el tiempo de inicio usando lastStart
    startTimeRef.current = lastStart;

    // Actualizar cada 100ms para mantener la precisión
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = timeAtStart + ((now - startTimeRef.current) / 1000);
      savedCallback.current(elapsed);
    }, 100);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeAtStart, lastStart]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}

export function usePomoTimer(callback, isRunning, duration, initialRemaining) {
  const rafRef = useRef();
  const savedCallback = useRef();
  const endTime = useRef();
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  // Update the useEffect in usePomoTimer
  useEffect(() => {
    if (!isRunning) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    const startTime = performance.now();
    endTime.current = startTime + initialRemaining * 1000;
    const tick = (currentTime) => {
      const remaining = Math.max(0, (endTime.current - currentTime) / 1000);
      savedCallback.current(remaining);
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isRunning, duration]); // Removed initialRemaining from dependencies
}
// Funciones de utilidad mejoradas
export const formatStudyTime = (totalSeconds, roundUp = false) => {
  try {
    const s = Math.max(0, roundUp ? Math.ceil(totalSeconds) : Math.floor(totalSeconds));
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = Math.floor(s % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('Error formatting study time:', error);
    return '00:00:00';
  }
};

export const formatPomoTime = (totalSeconds, roundUp = false) => {
  try {
    // Ensure totalSeconds is a valid number
    const s = Math.max(0, Math.floor(roundUp ? Math.ceil(totalSeconds) : totalSeconds));
    const minutes = Math.floor(s / 60);
    const seconds = Math.floor(s % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('Error formatting pomo time:', error);
    return '00:00';
  }
};

export const getMonthYear = (date, locale = "default") => {
  const options = { month: "long", year: "numeric" };
  return new Date(date).toLocaleDateString(locale, options);
};