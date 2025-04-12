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
  testSound: () => void;
}

const AnnouncementContext = createContext<AnnouncementContextType | undefined>(undefined);

export const useAnnouncements = () => {
  const context = useContext(AnnouncementContext);
  if (context === undefined) {
    throw new Error("useAnnouncements must be used within an AnnouncementProvider");
  }
  return context;
};

const SOUND_FILE_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

export const AnnouncementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentDisplay, setCurrentDisplayState] = useState<"announcements" | "timer">("announcements");
  const [timer, setTimerState] = useState<Timer | null>(null);
  const [playSound, setPlaySound] = useState(true); // Default to true for better user experience
  const [soundDuration, setSoundDuration] = useState(5); // default 5 seconds
  const [loading, setLoading] = useState(true);
  
  const displayChannelRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    audioRef.current = new Audio(SOUND_FILE_URL);
    audioRef.current.volume = 0.7;
    audioRef.current.load();
    
    if (audioRef.current) {
      audioRef.current.addEventListener('canplaythrough', () => {
        console.log("Audio is ready to play through");
      });
      
      audioRef.current.addEventListener('error', (e) => {
        console.error("Audio loading error:", e);
      });
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);
  
  const playAnnouncementSound = () => {
    if (!playSound) return;
    
    console.log("Playing announcement sound");
    
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(SOUND_FILE_URL);
        audioRef.current.volume = 0.7;
        audioRef.current.load();
      }
      
      audioRef.current.currentTime = 0;
      
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("Sound playing successfully");
            setTimeout(() => {
              if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
              }
            }, soundDuration * 1000);
          })
          .catch(error => {
            console.error("Error playing sound:", error);
            const fallbackAudio = new Audio(SOUND_FILE_URL);
            fallbackAudio.volume = 0.7;
            fallbackAudio.play().catch(fallbackError => {
              console.error("Fallback audio also failed:", fallbackError);
              toast.error("Sound playback failed. Check browser autoplay settings.");
            });
          });
      }
    } catch (error) {
      console.error("Error with announcement sound:", error);
    }
  };
  
  const testSound = () => {
    playAnnouncementSound();
  };
  
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
          if (error.code !== 'PGRST116') {
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
            setCurrentDisplayState("timer");
          }
        }
      } catch (error) {
        console.error("Error fetching timer:", error);
      }
    };
    
    const initDisplayChannel = () => {
      const channel = supabase.channel('display_settings');
      
      channel
        .on('broadcast', { event: 'display_change' }, (payload) => {
          console.log('Received display change broadcast:', payload);
          if (payload?.payload?.display) {
            setCurrentDisplayState(payload.payload.display);
            
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
          
          playAnnouncementSound();
          
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
      
    return () => {
      supabase.removeChannel(announcementsChannel);
      supabase.removeChannel(timersChannel);
      if (displayChannelRef.current) {
        supabase.removeChannel(displayChannelRef.current);
      }
    };
  }, [timer?.id]);
  
  const setCurrentDisplayAndBroadcast = async (display: "announcements" | "timer") => {
    console.log(`Setting display to: ${display}`);
    
    setCurrentDisplayState(display);
    
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
        setCurrentDisplayAndBroadcast("timer");
      } else {
        setTimerState(null);
        setCurrentDisplayAndBroadcast("announcements");
        toast.info("Timer cleared");
      }
    } catch (error) {
      console.error("Error setting timer:", error);
      toast.error("Failed to set timer");
    }
  };
  
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
        testSound,
      }}
    >
      {children}
    </AnnouncementContext.Provider>
  );
};
