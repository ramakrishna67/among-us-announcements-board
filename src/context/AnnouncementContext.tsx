
import React, { createContext, useContext, useState } from "react";
import { 
  AnnouncementContextType, 
  Announcement, 
  Timer 
} from "@/types/announcement.types";
import { toast } from "sonner";
import { useAnnouncementData } from "@/hooks/useAnnouncementData";
import { useAnnouncementSubscriptions } from "@/hooks/useAnnouncementSubscriptions";
import { useDisplaySync } from "@/hooks/useDisplaySync";
import { 
  addAnnouncement as addAnnouncementService, 
  deleteAnnouncement as deleteAnnouncementService,
  setTimer as setTimerService
} from "@/services/announcementService";

const AnnouncementContext = createContext<AnnouncementContextType | undefined>(undefined);

export const useAnnouncements = () => {
  const context = useContext(AnnouncementContext);
  if (context === undefined) {
    throw new Error("useAnnouncements must be used within an AnnouncementProvider");
  }
  return context;
};

export const AnnouncementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State management
  const { 
    announcements, 
    setAnnouncements, 
    timer, 
    setTimerState, 
    loading 
  } = useAnnouncementData();
  
  // Initialize the current display based on timer presence
  const [currentDisplay, setCurrentDisplay] = useState<"announcements" | "timer">(
    timer ? "timer" : "announcements"
  );
  const [playSound, setPlaySound] = useState(false);
  const [soundDuration, setSoundDuration] = useState(5); // default 5 seconds
  
  // Set up display sync with other clients
  const { updateDisplaySettings } = useDisplaySync(setCurrentDisplay);
  
  // Set up real-time subscriptions
  useAnnouncementSubscriptions({
    setAnnouncements,
    setTimerState,
    setCurrentDisplay,
    timer,
    playSound,
    soundDuration
  });
  
  // API functions
  const addAnnouncement = async (newAnnouncement: Omit<Announcement, "id" | "createdAt">) => {
    try {
      await addAnnouncementService(newAnnouncement);
    } catch (error) {
      // Error handling is done in the service
    }
  };
  
  const deleteAnnouncement = async (id: string) => {
    try {
      await deleteAnnouncementService(id);
    } catch (error) {
      // Error handling is done in the service
    }
  };
  
  const setTimer = async (timerData: Timer | null) => {
    try {
      await setTimerService(timerData);
      
      // Update the display mode based on timer presence
      if (timerData) {
        // Use the tracked display settings update to ensure synchronization
        const success = await updateDisplaySettings("timer");
        if (!success) {
          toast.error("Failed to update display mode");
        }
      } else {
        setTimerState(null);
        // Use the tracked display settings update to ensure synchronization
        const success = await updateDisplaySettings("announcements");
        if (!success) {
          toast.error("Failed to update display mode");
        }
      }
    } catch (error) {
      console.error("Error setting timer:", error);
      toast.error("Failed to set timer");
    }
  };
  
  // Sync display settings across clients
  const handleSetCurrentDisplay = async (display: "announcements" | "timer") => {
    try {
      // Only update if the display mode is actually changing
      if (display !== currentDisplay) {
        console.log(`Changing display from ${currentDisplay} to ${display}`);
        
        const success = await updateDisplaySettings(display);
        if (success) {
          // The actual state update will happen through the presence subscription
          toast.success(`Display updated to ${display}`);
        } else {
          toast.error("Failed to update display settings");
        }
      }
    } catch (error) {
      console.error("Error updating display settings:", error);
      toast.error("Failed to update display settings");
    }
  };
  
  // If still loading, show a simple loading state or nothing
  if (loading) {
    return null;
  }
  
  return (
    <AnnouncementContext.Provider
      value={{
        announcements,
        addAnnouncement,
        deleteAnnouncement,
        currentDisplay,
        setCurrentDisplay: handleSetCurrentDisplay,
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

// Re-export types from the context - Fixed with export type
export type { AnnouncementType, Timer, Announcement } from "@/types/announcement.types";
