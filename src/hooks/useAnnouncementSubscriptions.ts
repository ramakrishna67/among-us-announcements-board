
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Announcement, Timer, AnnouncementType } from "@/types/announcement.types";
import { toast } from "sonner";

interface UseAnnouncementSubscriptionsProps {
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  setTimerState: React.Dispatch<React.SetStateAction<Timer | null>>;
  setCurrentDisplay: React.Dispatch<React.SetStateAction<"announcements" | "timer">>;
  timer: Timer | null;
  playSound: boolean;
  soundDuration: number;
}

export const useAnnouncementSubscriptions = ({
  setAnnouncements,
  setTimerState,
  setCurrentDisplay,
  timer,
  playSound,
  soundDuration
}: UseAnnouncementSubscriptionsProps) => {
  useEffect(() => {
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
            // Note: We don't automatically change the display here
            // as that will happen through the display sync mechanism
            
            toast.info("Timer updated!", {
              description: newTimer.title,
            });
          } else if (payload.eventType === 'UPDATE' && !newTimer.active && timer?.id === newTimer.id) {
            setTimerState(null);
            // Note: We don't automatically change the display here
            // as that will happen through the display sync mechanism
          }
        } else if (payload.eventType === 'DELETE' && timer?.id === payload.old.id) {
          setTimerState(null);
          // Note: We don't automatically change the display here
          // as that will happen through the display sync mechanism
        }
      })
      .subscribe();

    // Cleanup function
    return () => {
      supabase.removeChannel(announcementsChannel);
      supabase.removeChannel(timersChannel);
    };
  }, [setAnnouncements, setTimerState, setCurrentDisplay, timer, playSound, soundDuration]);
};
