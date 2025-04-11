
import React from "react";
import { Announcement } from "@/context/AnnouncementContext";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface AnnouncementCardProps {
  announcement: Announcement;
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ announcement }) => {
  const isEmergency = announcement.type === "emergency";
  
  return (
    <div
      className={cn(
        "announcement-card animate-slide-up",
        isEmergency ? "emergency-announcement" : ""
      )}
    >
      <div className="flex items-start justify-between">
        <h3 className={cn(
          "text-2xl font-bold mb-3",
          isEmergency ? "text-amongus-red" : "text-amongus-purple"
        )}>
          {announcement.title}
        </h3>
        <span className="text-xs text-amongus-gray">
          {formatDistanceToNow(announcement.createdAt, { addSuffix: true })}
        </span>
      </div>
      
      <p className="text-white text-lg mb-4">{announcement.content}</p>
      
      {announcement.imageUrl && (
        <div className="mt-4 rounded-md overflow-hidden">
          <img 
            src={announcement.imageUrl} 
            alt={announcement.title} 
            className="w-full h-auto object-cover"
          />
        </div>
      )}
      
      {announcement.videoUrl && (
        <div className="mt-4 rounded-md overflow-hidden">
          <video 
            src={announcement.videoUrl} 
            controls
            className="w-full h-auto"
          />
        </div>
      )}
      
      {isEmergency && (
        <div className="absolute -top-3 -right-3 bg-amongus-red text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
          EMERGENCY
        </div>
      )}
    </div>
  );
};

export default AnnouncementCard;
