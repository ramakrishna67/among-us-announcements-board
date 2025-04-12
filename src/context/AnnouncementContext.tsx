
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
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

interface AnnouncementContextType {
  announcements: Announcement[];
  addAnnouncement: (announcement: Omit<Announcement, "id" | "createdAt">) => void;
  deleteAnnouncement: (id: string) => void;
  currentDisplay: "announcements" | "timer";
  setCurrentDisplay: (display: "announcements" | "timer") => Promise<void>;
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
  const [currentDisplay, setCurrentDisplayState] = useState<"announcements" | "timer">("announcements");
  const [timer, setTimerState] = useState<Timer | null>(null);
  const [playSound, setPlaySound] = useState(false);
  const [soundDuration, setSoundDuration] = useState(5); // default 5 seconds
  const [loading, setLoading] = useState(true);
  
  // Simplified display channel setup
  const displayChannelRef = useRef<any>(null);
  
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
          
          // Only set to timer display if it's still valid
          if (new Date(data.end_time) > new Date()) {
            setCurrentDisplayState("timer");
          }
        }
      } catch (error) {
        console.error("Error fetching timer:", error);
      }
    };
    
    // Initialize display settings channel with a simpler approach
    const initDisplayChannel = () => {
      const channel = supabase.channel('display_settings');
      
      // Set up broadcast channel for syncing display type
      channel
        .on('broadcast', { event: 'display_change' }, (payload) => {
          console.log('Received display change broadcast:', payload);
          if (payload?.payload?.display) {
            setCurrentDisplayState(payload.payload.display);
            
            // Show toast when display changes
            const message = payload.payload.display === "timer" 
              ? "Now displaying timer" 
              : "Now displaying announcements";
            
            toast.info(message);
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to display channel');
          } else {
            console.log('Subscription status:', status);
          }
        });
      
      displayChannelRef.current = channel;
      return channel;
    };
    
    fetchAnnouncements();
    fetchActiveTimer();
    const displayChannel = initDisplayChannel();
    
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
            
            // Only switch to timer if it's still valid
            if (new Date(newTimer.end_time) > new Date()) {
              setCurrentDisplayAndBroadcast("timer");
            }
            
            toast.info("Timer updated!", {
              description: newTimer.title,
            });
          } else if (payload.eventType === 'UPDATE' && !newTimer.active && timer?.id === newTimer.id) {
            setTimerState(null);
            setCurrentDisplayAndBroadcast("announcements");
          }
        } else if (payload.eventType === 'DELETE' && timer?.id === payload.old.id) {
          setTimerState(null);
          setCurrentDisplayAndBroadcast("announcements");
        }
      })
      .subscribe();
      
    // Cleanup function
    return () => {
      supabase.removeChannel(announcementsChannel);
      supabase.removeChannel(timersChannel);
      if (displayChannelRef.current) {
        supabase.removeChannel(displayChannelRef.current);
      }
    };
  }, [playSound, soundDuration, timer?.id]);
  
  // Simplified function to update and broadcast display settings
  const setCurrentDisplayAndBroadcast = async (display: "announcements" | "timer") => {
    console.log(`Setting display to: ${display}`);
    
    // Update local state immediately
    setCurrentDisplayState(display);
    
    // Broadcast the change to all clients if channel is available
    if (displayChannelRef.current) {
      try {
        await displayChannelRef.current.send({
          type: 'broadcast',
          event: 'display_change',
          payload: { 
            display,
            timestamp: new Date().toISOString()
          }
        });
        console.log(`Broadcasted display change to: ${display}`);
      } catch (error) {
        console.error("Error broadcasting display change:", error);
        toast.error("Failed to sync display with other devices");
      }
    } else {
      console.warn("Display channel not initialized yet");
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
        // Switch to timer display
        setCurrentDisplayAndBroadcast("timer");
      } else {
        setTimerState(null);
        // Switch back to announcements
        setCurrentDisplayAndBroadcast("announcements");
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
        setCurrentDisplay: setCurrentDisplayAndBroadcast,
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
