import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AnnouncementForm from "./AnnouncementForm";
import TimerForm from "./TimerForm";
import SoundControl from "./SoundControl";
import { useAnnouncements } from "@/context/AnnouncementContext";
import { LogOut, Bell, Timer, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface AdminPanelProps {
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const { 
    announcements, 
    deleteAnnouncement, 
    currentDisplay,
    setCurrentDisplay,
    timer
  } = useAnnouncements();
  
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDisplayUpdating, setIsDisplayUpdating] = useState<boolean>(false);
  
  const [lastDisplay, setLastDisplay] = useState<string>(currentDisplay);
  
  useEffect(() => {
    if (lastDisplay !== currentDisplay) {
      setLastDisplay(currentDisplay);
    }
  }, [currentDisplay, lastDisplay]);
  
  const handleLogout = () => {
    toast.info("Logged out successfully");
    onLogout();
  };
  
  const handleDisplayToggle = async (display: "announcements" | "timer") => {
    if (display === currentDisplay) return;
    
    setIsDisplayUpdating(true);
    
    try {
      await setCurrentDisplay(display);
      toast.success(`Display changed to: ${display === "announcements" ? "Announcements" : "Timer"}`);
    } catch (error) {
      console.error("Error updating display:", error);
      toast.error("Failed to update display settings");
    } finally {
      setTimeout(() => {
        setIsDisplayUpdating(false);
      }, 1000);
    }
  };
  
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteAnnouncement(id);
    } finally {
      setDeletingId(null);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-amongus-purple">SUS-Hacks Admin Panel</h1>
        <Button 
          onClick={handleLogout} 
          variant="outline"
          className="border-amongus-red text-amongus-red hover:bg-amongus-red/10"
        >
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>
      
      <div className="mb-8">
        <Card className="bg-card/70 backdrop-blur-sm p-4 border border-amongus-purple/20">
          <h2 className="mb-4 text-xl font-semibold text-white">Display Control</h2>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button
              className={`flex items-center ${
                currentDisplay === "announcements" 
                  ? "bg-amongus-purple" 
                  : "bg-card hover:bg-amongus-purple/20"
              }`}
              onClick={() => handleDisplayToggle("announcements")}
              disabled={isDisplayUpdating || currentDisplay === "announcements"}
            >
              <MessageSquare className="mr-2 h-4 w-4" /> 
              {isDisplayUpdating 
                ? "Updating..."
                : currentDisplay === "announcements" 
                  ? "Currently Showing Announcements"
                  : "Display Announcements"}
            </Button>
            
            <Button
              className={`flex items-center ${
                currentDisplay === "timer" 
                  ? "bg-amongus-purple" 
                  : "bg-card hover:bg-amongus-purple/20"
              }`}
              onClick={() => handleDisplayToggle("timer")}
              disabled={isDisplayUpdating || currentDisplay === "timer" || !timer}
            >
              <Timer className="mr-2 h-4 w-4" /> 
              {isDisplayUpdating 
                ? "Updating..."
                : currentDisplay === "timer" 
                  ? "Currently Showing Timer"
                  : timer 
                    ? "Display Timer" 
                    : "No Active Timer"}
            </Button>
          </div>
          <div className="mt-2 text-xs text-amongus-gray">
            {currentDisplay === "timer" 
              ? "Currently displaying timer to all connected devices." 
              : "Currently displaying announcements to all connected devices."}
          </div>
        </Card>
      </div>
      
      <Tabs defaultValue="announcements" className="w-full">
        <TabsList className="mb-8 grid w-full grid-cols-3 bg-amongus-dark">
          <TabsTrigger value="announcements" className="text-white">
            <MessageSquare className="mr-2 h-4 w-4" /> Announcements
          </TabsTrigger>
          <TabsTrigger value="timer" className="text-white">
            <Timer className="mr-2 h-4 w-4" /> Timer
          </TabsTrigger>
          <TabsTrigger value="sound" className="text-white">
            <Bell className="mr-2 h-4 w-4" /> Sound
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="announcements">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <AnnouncementForm />
            
            <div>
              <h3 className="mb-4 text-xl font-semibold text-amongus-purple">Recent Announcements</h3>
              <div className="max-h-[500px] space-y-4 overflow-y-auto pr-2">
                {announcements.length > 0 ? (
                  announcements.map((announcement) => (
                    <Card key={announcement.id} className="announcement-card">
                      <div className="flex items-start justify-between">
                        <h4 className={`font-bold ${
                          announcement.type === "emergency" 
                            ? "text-amongus-red" 
                            : "text-amongus-purple"
                        }`}>
                          {announcement.title}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(announcement.id)}
                          disabled={deletingId === announcement.id}
                          className="text-amongus-red hover:bg-amongus-red/10"
                        >
                          {deletingId === announcement.id ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                      <p className="mt-2 text-sm text-white">{announcement.content}</p>
                      <div className="mt-2 text-xs text-amongus-gray">
                        {formatDistanceToNow(announcement.createdAt, { addSuffix: true })}
                      </div>
                    </Card>
                  ))
                ) : (
                  <p className="text-amongus-gray">No announcements yet</p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="timer">
          <TimerForm />
        </TabsContent>
        
        <TabsContent value="sound">
          <SoundControl />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
