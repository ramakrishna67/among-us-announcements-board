
import React from "react";
import { useAnnouncements } from "@/context/AnnouncementContext";
import AnnouncementCard from "./AnnouncementCard";
import CountdownTimer from "./CountdownTimer";
import { motion } from "framer-motion";

const AnnouncementBoard = () => {
  const { announcements, currentDisplay, timer } = useAnnouncements();
  
  if (currentDisplay === "timer" && timer) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <CountdownTimer timer={timer} />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 gap-6">
        {announcements.map((announcement, index) => (
          <motion.div
            key={announcement.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <AnnouncementCard announcement={announcement} />
          </motion.div>
        ))}
        
        {announcements.length === 0 && (
          <div className="flex h-64 items-center justify-center rounded-lg bg-card/50 backdrop-blur-sm">
            <p className="text-lg text-amongus-gray">No announcements yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementBoard;
