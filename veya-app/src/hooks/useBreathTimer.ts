import { useState, useEffect, useRef } from 'react';

interface UseBreathTimerOptions {
  duration: number; // Duration in seconds
  onComplete?: () => void;
}

export const useBreathTimer = ({
  duration,
  onComplete,
}: UseBreathTimerOptions) => {
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer >= duration) {
            setIsActive(false);
            if (onComplete) {
              onComplete();
            }
            return 0;
          }
          return prevTimer + 0.1;
        });
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, duration, onComplete]);

  const start = () => {
    setIsActive(true);
  };

  const pause = () => {
    setIsActive(false);
  };

  const reset = () => {
    setTimer(0);
    setIsActive(false);
  };

  return {
    timer,
    isActive,
    start,
    pause,
    reset,
  };
};

