
import { supabase } from "@/integrations/supabase/client";
import { Announcement, Timer } from "@/types/announcement.types";
import { toast } from "sonner";

export const addAnnouncement = async (newAnnouncement: Omit<Announcement, "id" | "createdAt">) => {
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
    return data;
  } catch (error) {
    console.error("Error adding announcement:", error);
    toast.error("Failed to post announcement");
    throw error;
  }
};

export const deleteAnnouncement = async (id: string) => {
  try {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    toast.success("Announcement deleted successfully!");
    return true;
  } catch (error) {
    console.error("Error deleting announcement:", error);
    toast.error("Failed to delete announcement");
    throw error;
  }
};

export const setTimer = async (timerData: Timer | null) => {
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
      return data;
    } else {
      toast.info("Timer cleared");
      return null;
    }
  } catch (error) {
    console.error("Error setting timer:", error);
    toast.error("Failed to set timer");
    throw error;
  }
};
