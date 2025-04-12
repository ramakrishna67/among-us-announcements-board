
import React, { useEffect, useState, useCallback } from "react";
import { useAnnouncements } from "@/context/AnnouncementContext";
import AnnouncementCard from "./AnnouncementCard";
import CountdownTimer from "./CountdownTimer";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const AnnouncementBoard = () => {
  const { announcements, currentDisplay, timer } = useAnnouncements();
  const [previousDisplay, setPreviousDisplay] = useState<"announcements" | "timer">(currentDisplay);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionCount, setTransitionCount] = useState(0);
  
  // Function to handle display transitions with retries if needed
  const handleDisplayTransition = useCallback(() => {
    if (previousDisplay !== currentDisplay) {
      // Increment transition counter to track attempts
      setTransitionCount(prev => prev + 1);
      setIsTransitioning(true);
      
      const message = currentDisplay === "timer" 
        ? "Now displaying timer" 
        : "Now displaying announcements";
      
      toast.info(message, {
        position: "top-center",
        duration: 3000,
      });
      
      // Small delay to ensure transition animation completes
      setTimeout(() => {
        setPreviousDisplay(currentDisplay);
        setIsTransitioning(false);
        setTransitionCount(0); // Reset counter after successful transition
      }, 600);
    }
  }, [currentDisplay, previousDisplay]);
  
  // Effect to handle display transitions
  useEffect(() => {
    handleDisplayTransition();
  }, [handleDisplayTransition]);
  
  // Additional effect to force update if transition seems stuck
  useEffect(() => {
    // If we've been transitioning for too long (5+ seconds), force an update
    if (isTransitioning) {
      const forceUpdateTimeout = setTimeout(() => {
        console.log("Forcing display update after timeout");
        setPreviousDisplay(currentDisplay);
        setIsTransitioning(false);
      }, 5000);
      
      return () => clearTimeout(forceUpdateTimeout);
    }
  }, [isTransitioning, currentDisplay]);
  
  // Check if timer is valid (exists and not expired)
  const isTimerValid = timer && new Date(timer.endTime) > new Date();
  
  // Determine what to display based on current state
  const shouldShowTimer = currentDisplay === "timer" && isTimerValid;
  
  return (
    <AnimatePresence mode="wait">
      {shouldShowTimer ? (
        <motion.div 
          key="timer"
          className="flex h-screen items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
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
          transition={{ duration: 0.5 }}
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
