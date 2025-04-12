
import React, { useEffect, useState, useCallback } from "react";
import { useAnnouncements } from "@/context/AnnouncementContext";
import AnnouncementCard from "./AnnouncementCard";
import CountdownTimer from "./CountdownTimer";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const AnnouncementBoard = () => {
  const { announcements, currentDisplay, timer } = useAnnouncements();
  const [visibleDisplay, setVisibleDisplay] = useState<"announcements" | "timer">(currentDisplay);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Effect to handle display changes with a smooth transition
  useEffect(() => {
    if (currentDisplay !== visibleDisplay) {
      console.log(`Display changing from ${visibleDisplay} to ${currentDisplay}`);
      setIsTransitioning(true);
      
      // Add a short delay to ensure animation completes
      const transitionTimeout = setTimeout(() => {
        setVisibleDisplay(currentDisplay);
        setIsTransitioning(false);
        console.log(`Display changed to ${currentDisplay}`);
      }, 300);
      
      return () => clearTimeout(transitionTimeout);
    }
  }, [currentDisplay, visibleDisplay]);
  
  // Check if timer is valid (exists and not expired)
  const isTimerValid = timer && new Date(timer.endTime) > new Date();
  
  // If timer is invalid but we're supposed to show it, force to announcements
  useEffect(() => {
    if (currentDisplay === "timer" && !isTimerValid) {
      console.log("Timer is invalid, forcing display to announcements");
      setVisibleDisplay("announcements");
    }
  }, [currentDisplay, isTimerValid]);
  
  // Determine what should be displayed
  const shouldShowTimer = visibleDisplay === "timer" && isTimerValid;
  
  return (
    <AnimatePresence mode="wait">
      {shouldShowTimer ? (
        <motion.div 
          key="timer"
          className="flex h-screen items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {timer && <CountdownTimer timer={timer} />}
        </motion.div>
      ) : (
        <motion.div 
          key="announcements"
          className="container mx-auto p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="grid grid-cols-1 gap-6">
            <AnimatePresence>
              {announcements.map((announcement, index) => (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`${announcement.type === "emergency" ? "border-2 border-amongus-red" : ""}`}
                >
                  <AnnouncementCard announcement={announcement} />
                </motion.div>
              ))}
            </AnimatePresence>
            
            {announcements.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-64 items-center justify-center rounded-lg bg-card/50 backdrop-blur-sm"
              >
                <p className="text-lg text-amongus-gray">No announcements yet</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnnouncementBoard;
