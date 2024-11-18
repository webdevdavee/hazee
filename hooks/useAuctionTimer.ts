import React from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const useAuctionTimer = (endTime: number | undefined) => {
  const [timeLeft, setTimeLeft] = React.useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isEnded, setIsEnded] = React.useState(false);

  React.useEffect(() => {
    if (!endTime) return;

    const calculateTimeLeft = () => {
      const now = Date.now();
      const endTimeMs = endTime * 1000;
      const difference = endTimeMs - now;

      if (difference <= 0) {
        setIsEnded(true);
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        ),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    };

    const updateTimer = () => {
      setTimeLeft(calculateTimeLeft());
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  return { timeLeft, isEnded };
};
