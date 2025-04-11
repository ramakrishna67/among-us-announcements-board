
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

export type AnnouncementType = "regular" | "emergency";

export interface Timer {
  endTime: Date;
  title: string;
  description?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  createdAt: Date;
  imageUrl?: string;
  videoUrl?: string;
}

interface AnnouncementContextType {
  announcements: Announcement[];
  addAnnouncement: (announcement: Omit<Announcement, "id" | "createdAt">) => void;
  deleteAnnouncement: (id: string) => void;
  currentDisplay: "announcements" | "timer";
  setCurrentDisplay: (display: "announcements" | "timer") => void;
  timer: Timer | null;
  setTimer: (timer: Timer | null) => void;
  playSound: boolean;
  setPlaySound: (play: boolean) => void;
  soundDuration: number;
  setSoundDuration: (duration: number) => void;
}

const AnnouncementContext = createContext<AnnouncementContextType | undefined>(undefined);

export const useAnnouncements = () => {
  const context = useContext(AnnouncementContext);
  if (context === undefined) {
    throw new Error("useAnnouncements must be used within an AnnouncementProvider");
  }
  return context;
};

// Mock announcements for initial state
const initialAnnouncements: Announcement[] = [
  {
    id: "1",
    title: "Welcome to SUS-Hacks!",
    content: "The hackathon begins at 9:00 AM in the main hall. Don't be sus, be on time!",
    type: "regular",
    createdAt: new Date(),
  },
  {
    id: "2",
    title: "EMERGENCY MEETING!",
    content: "All teams gather in Meeting Room B for important announcements!",
    type: "emergency",
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
  },
];

export const AnnouncementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [currentDisplay, setCurrentDisplay] = useState<"announcements" | "timer">("announcements");
  const [timer, setTimer] = useState<Timer | null>(null);
  const [playSound, setPlaySound] = useState(false);
  const [soundDuration, setSoundDuration] = useState(5); // default 5 seconds
  
  // In a real app, this would sync with a database using Supabase
  const addAnnouncement = (newAnnouncement: Omit<Announcement, "id" | "createdAt">) => {
    const announcementWithId = {
      ...newAnnouncement,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    
    setAnnouncements((prevAnnouncements) => [announcementWithId, ...prevAnnouncements]);
    
    // Show notification
    toast.success("New announcement posted!", {
      description: newAnnouncement.title,
    });
    
    // Play sound if enabled
    if (playSound) {
      const audio = new Audio("/announcement-sound.mp3");
      audio.play();
      
      // Stop sound after specified duration
      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
      }, soundDuration * 1000);
    }
  };
  
  const deleteAnnouncement = (id: string) => {
    setAnnouncements((prevAnnouncements) => 
      prevAnnouncements.filter((announcement) => announcement.id !== id)
    );
  };
  
  return (
    <AnnouncementContext.Provider
      value={{
        announcements,
        addAnnouncement,
        deleteAnnouncement,
        currentDisplay,
        setCurrentDisplay,
        timer,
        setTimer,
        playSound,
        setPlaySound,
        soundDuration,
        setSoundDuration,
      }}
    >
      {children}
    </AnnouncementContext.Provider>
  );
};
