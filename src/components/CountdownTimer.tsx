
import React, { useState, useEffect } from "react";
import { Timer } from "@/context/AnnouncementContext";

interface CountdownTimerProps {
  timer: Timer;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ timer }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const endTime = new Date(timer.endTime);
      const difference = endTime.getTime() - now.getTime();
      
      if (difference <= 0) {
        setIsComplete(true);
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        };
      }
      
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };
    
    setTimeLeft(calculateTimeLeft());
    
    // Renamed from 'timer' to 'intervalId' to avoid collision with prop name
    const intervalId = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [timer.endTime]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-card/70 backdrop-blur-lg rounded-2xl border border-amongus-purple/30 shadow-lg">
      {isComplete ? (
        <div className="text-center">
          <h2 className="text-4xl font-bold text-amongus-red animate-pulse">Time's Up!</h2>
          <p className="text-xl mt-4">{timer.title}</p>
          {timer.description && <p className="mt-2 text-amongus-gray">{timer.description}</p>}
        </div>
      ) : (
        <>
          <h2 className="text-3xl font-bold mb-8 text-amongus-purple">{timer.title}</h2>
          {timer.description && <p className="mb-8 text-lg text-amongus-gray">{timer.description}</p>}
          
          <div className="flex space-x-4 md:space-x-8">
            <TimeBlock value={timeLeft.days} label="Days" />
            <TimeBlock value={timeLeft.hours} label="Hours" />
            <TimeBlock value={timeLeft.minutes} label="Minutes" />
            <TimeBlock value={timeLeft.seconds} label="Seconds" />
          </div>
        </>
      )}
    </div>
  );
};

interface TimeBlockProps {
  value: number;
  label: string;
}

const TimeBlock: React.FC<TimeBlockProps> = ({ value, label }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-amongus-dark border border-amongus-purple/50 rounded-md px-6 py-4 text-center min-w-[100px]">
        <span className="text-4xl font-bold text-white">{value.toString().padStart(2, '0')}</span>
      </div>
      <span className="text-amongus-gray mt-2">{label}</span>
    </div>
  );
};

export default CountdownTimer;
