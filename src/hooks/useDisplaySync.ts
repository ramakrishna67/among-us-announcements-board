
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useDisplaySync = (
  setCurrentDisplay: React.Dispatch<React.SetStateAction<"announcements" | "timer">>
) => {
  useEffect(() => {
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
    
    // Cleanup function
    return () => {
      supabase.removeChannel(displaySettingsChannel);
    };
  }, [setCurrentDisplay]);

  // Update display settings function that tracks the change across all clients
  const updateDisplaySettings = async (display: "announcements" | "timer") => {
    const displaySettingsChannel = supabase.channel('display_settings');
    
    try {
      await displaySettingsChannel.track({
        display: display,
        updated_at: new Date().toISOString()
      });
      
      console.log(`Display updated to: ${display}`);
      return true;
    } catch (error) {
      console.error("Error updating display settings:", error);
      return false;
    }
  };

  return { updateDisplaySettings };
};
