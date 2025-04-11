
import React, { useEffect, useState } from "react";
import { useAnnouncements } from "@/context/AnnouncementContext";
import AnnouncementCard from "./AnnouncementCard";
import CountdownTimer from "./CountdownTimer";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const AnnouncementBoard = () => {
  const { announcements, currentDisplay, timer } = useAnnouncements();
  const [previousDisplay, setPreviousDisplay] = useState<"announcements" | "timer">(currentDisplay);
  
  // Effect to show a toast when display mode changes
  useEffect(() => {
    if (previousDisplay !== currentDisplay) {
      const message = currentDisplay === "timer" 
        ? "Now displaying timer" 
        : "Now displaying announcements";
      
      toast.info(message, {
        position: "top-center",
        duration: 3000,
      });
      
      setPreviousDisplay(currentDisplay);
    }
  }, [currentDisplay, previousDisplay]);
  
  return (
    <AnimatePresence mode="wait">
      {currentDisplay === "timer" && timer ? (
        <motion.div 
          key="timer"
          className="flex h-screen items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <CountdownTimer timer={timer} />
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
