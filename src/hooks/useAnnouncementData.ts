
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Announcement, Timer, AnnouncementType } from "@/types/announcement.types";
import { toast } from "sonner";

export const useAnnouncementData = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [timer, setTimerState] = useState<Timer | null>(null);
  const [loading, setLoading] = useState(true);

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
        }
      } catch (error) {
        console.error("Error fetching timer:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
    fetchActiveTimer();
  }, []);

  return { announcements, setAnnouncements, timer, setTimerState, loading };
};
