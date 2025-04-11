
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

export interface AnnouncementContextType {
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
