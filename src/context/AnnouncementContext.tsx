
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type AnnouncementType = "regular" | "emergency";

export interface Timer {
  id?: string;
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

interface DisplaySettings {
  mode: "announcements" | "timer";
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

export const AnnouncementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentDisplay, setCurrentDisplay] = useState<"announcements" | "timer">("announcements");
  const [timer, setTimerState] = useState<Timer | null>(null);
  const [playSound, setPlaySound] = useState(false);
  const [soundDuration, setSoundDuration] = useState(5); // default 5 seconds
  const [loading, setLoading] = useState(true);
  
  // Fetch initial data
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        if (data) {
          const formattedAnnouncements: Announcement[] = data.map(item => ({
            id: item.id,
            title: item.title,
            content: item.content,
            type: item.type as AnnouncementType,
            createdAt: new Date(item.created_at),
            imageUrl: item.image_url,
            videoUrl: item.video_url
          }));
          
          setAnnouncements(formattedAnnouncements);
        }
      } catch (error) {
        console.error("Error fetching announcements:", error);
        toast.error("Failed to load announcements");
      } finally {
        setLoading(false);
      }
    };
    
    const fetchActiveTimer = async () => {
      try {
        const { data, error } = await supabase
          .from('timers')
          .select('*')
          .eq('active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (error) {
          if (error.code !== 'PGRST116') { // PGRST116 is "No rows returned" which is expected if no timer is active
            console.error("Error fetching timer:", error);
          }
          return;
        }
        
        if (data) {
          setTimerState({
            id: data.id,
            title: data.title,
            description: data.description,
            endTime: new Date(data.end_time)
          });
          
          if (new Date(data.end_time) > new Date()) {
            setCurrentDisplay("timer");
          }
        }
      } catch (error) {
        console.error("Error fetching timer:", error);
      }
    };
    
    // Create a display settings channel to sync display mode across clients
    const displaySettingsChannel = supabase.channel('display_settings');
    
    displaySettingsChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Subscribed to display settings channel');
      }
    });
    
    // Track presence state for display settings
    displaySettingsChannel.on('presence', { event: 'sync' }, () => {
      const state = displaySettingsChannel.presenceState();
      console.log('Display settings state synced:', state);
      
      // Get the latest display settings from any client
      const allStates = Object.values(state).flat() as any[];
      if (allStates.length > 0) {
        // Use the most recent state
        const latestState = allStates.sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )[0];
        
        if (latestState && latestState.display) {
          console.log('Setting display mode from presence:', latestState.display);
          setCurrentDisplay(latestState.display);
        }
      }
    });
    
    fetchAnnouncements();
    fetchActiveTimer();
    
    // Set up realtime subscriptions
    const announcementsChannel = supabase
      .channel('public:announcements')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'announcements' 
      }, (payload) => {
        console.log('Announcement change received!', payload);
        
        if (payload.eventType === 'INSERT') {
          const newAnnouncement = payload.new;
          const formattedAnnouncement: Announcement = {
            id: newAnnouncement.id,
            title: newAnnouncement.title,
            content: newAnnouncement.content,
            type: newAnnouncement.type as AnnouncementType,
            createdAt: new Date(newAnnouncement.created_at),
            imageUrl: newAnnouncement.image_url,
            videoUrl: newAnnouncement.video_url
          };
          
          setAnnouncements(prev => [formattedAnnouncement, ...prev]);
          
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
          
          toast.info("New announcement received!", {
            description: newAnnouncement.title,
          });
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old.id;
          setAnnouncements(prev => prev.filter(a => a.id !== deletedId));
        } else if (payload.eventType === 'UPDATE') {
          const updatedAnnouncement = payload.new;
          setAnnouncements(prev => prev.map(a => {
            if (a.id === updatedAnnouncement.id) {
              return {
                ...a,
                title: updatedAnnouncement.title,
                content: updatedAnnouncement.content,
                type: updatedAnnouncement.type,
                imageUrl: updatedAnnouncement.image_url,
                videoUrl: updatedAnnouncement.video_url
              };
            }
            return a;
          }));
        }
      })
      .subscribe();
      
    const timersChannel = supabase
      .channel('public:timers')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'timers' 
      }, (payload) => {
        console.log('Timer change received!', payload);
        
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const newTimer = payload.new;
          
          if (newTimer.active) {
            const timerObj: Timer = {
              id: newTimer.id,
              title: newTimer.title,
              description: newTimer.description,
              endTime: new Date(newTimer.end_time)
            };
            
            setTimerState(timerObj);
            setCurrentDisplay("timer");
            
            toast.info("Timer updated!", {
              description: newTimer.title,
            });
          } else if (payload.eventType === 'UPDATE' && !newTimer.active && timer?.id === newTimer.id) {
            setTimerState(null);
            setCurrentDisplay("announcements");
          }
        } else if (payload.eventType === 'DELETE' && timer?.id === payload.old.id) {
          setTimerState(null);
          setCurrentDisplay("announcements");
        }
      })
      .subscribe();
      
    // Cleanup function
    return () => {
      supabase.removeChannel(announcementsChannel);
      supabase.removeChannel(timersChannel);
      supabase.removeChannel(displaySettingsChannel);
    };
  }, [playSound, soundDuration, timer?.id]);
  
  // Update display settings function that tracks the change across all clients
  const updateDisplaySettings = async (display: "announcements" | "timer") => {
    const displaySettingsChannel = supabase.channel('display_settings');
    
    try {
      await displaySettingsChannel.track({
        display: display,
        updated_at: new Date().toISOString()
      });
      
      setCurrentDisplay(display);
      console.log(`Display updated to: ${display}`);
    } catch (error) {
      console.error("Error updating display settings:", error);
      toast.error("Failed to update display settings");
    }
  };
  
  const addAnnouncement = async (newAnnouncement: Omit<Announcement, "id" | "createdAt">) => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .insert({
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          type: newAnnouncement.type,
          image_url: newAnnouncement.imageUrl,
          video_url: newAnnouncement.videoUrl
        })
        .select()
        .single();
        
      if (error) throw error;
      
      toast.success("Announcement posted successfully!");
    } catch (error) {
      console.error("Error adding announcement:", error);
      toast.error("Failed to post announcement");
    }
  };
  
  const deleteAnnouncement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success("Announcement deleted successfully!");
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast.error("Failed to delete announcement");
    }
  };
  
  const setTimer = async (timerData: Timer | null) => {
    try {
      // First, deactivate any existing active timers
      await supabase
        .from('timers')
        .update({ active: false })
        .eq('active', true);
        
      if (timerData) {
        const { data, error } = await supabase
          .from('timers')
          .insert({
            title: timerData.title,
            description: timerData.description,
            end_time: timerData.endTime.toISOString(),
            active: true
          })
          .select()
          .single();
          
        if (error) throw error;
        
        toast.success("Timer set successfully!");
        // Use the tracked display settings update
        updateDisplaySettings("timer");
      } else {
        setTimerState(null);
        // Use the tracked display settings update
        updateDisplaySettings("announcements");
        toast.info("Timer cleared");
      }
    } catch (error) {
      console.error("Error setting timer:", error);
      toast.error("Failed to set timer");
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
        setCurrentDisplay: updateDisplaySettings, // Use the tracked update function
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
