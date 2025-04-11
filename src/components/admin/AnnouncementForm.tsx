
import React, { useState } from "react";
import { useAnnouncements } from "@/context/AnnouncementContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { AlertCircle, FileImage, FileVideo } from "lucide-react";

const AnnouncementForm = () => {
  const { addAnnouncement } = useAnnouncements();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"regular" | "emergency">("regular");
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [videoUrl, setVideoUrl] = useState<string | undefined>();
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!title.trim()) {
      newErrors.title = "Title is required";
    }
    
    if (!content.trim()) {
      newErrors.content = "Content is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      toast.error("Please fix the errors in the form");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await addAnnouncement({
        title,
        content,
        type,
        imageUrl,
        videoUrl,
      });
      
      // Reset form
      setTitle("");
      setContent("");
      setType("regular");
      setImageUrl(undefined);
      setVideoUrl(undefined);
      
    } catch (error) {
      console.error("Error submitting announcement:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card className="p-6 bg-card/70 backdrop-blur-sm border border-amongus-purple/20">
      <h3 className="text-xl font-semibold mb-4 text-amongus-purple">Create Announcement</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="among-input"
            placeholder="Announcement title"
          />
          {errors.title && (
            <div className="text-amongus-red text-sm mt-1 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.title}
            </div>
          )}
        </div>
        
        <div>
          <Label htmlFor="content">Content</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="among-input min-h-[120px]"
            placeholder="Announcement content"
          />
          {errors.content && (
            <div className="text-amongus-red text-sm mt-1 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.content}
            </div>
          )}
        </div>
        
        <div>
          <Label htmlFor="type">Announcement Type</Label>
          <RadioGroup 
            value={type} 
            onValueChange={(value) => setType(value as "regular" | "emergency")}
            className="flex space-x-4 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="regular" id="regular" className="text-amongus-purple" />
              <Label htmlFor="regular" className="text-white">Regular</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="emergency" id="emergency" className="text-amongus-red" />
              <Label htmlFor="emergency" className="text-amongus-red">Emergency</Label>
            </div>
          </RadioGroup>
        </div>
        
        <div>
          <Label htmlFor="imageUrl" className="flex items-center">
            <FileImage className="h-4 w-4 mr-2" /> Image URL (optional)
          </Label>
          <Input
            id="imageUrl"
            value={imageUrl || ""}
            onChange={(e) => setImageUrl(e.target.value)}
            className="among-input"
            placeholder="https://example.com/image.jpg"
          />
        </div>
        
        <div>
          <Label htmlFor="videoUrl" className="flex items-center">
            <FileVideo className="h-4 w-4 mr-2" /> Video URL (optional)
          </Label>
          <Input
            id="videoUrl"
            value={videoUrl || ""}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="among-input"
            placeholder="https://example.com/video.mp4"
          />
        </div>
        
        <div className="pt-4">
          <Button 
            type="submit" 
            className={`w-full ${type === "emergency" ? "emergency-button" : "among-button"}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Posting..." : "Post Announcement"}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default AnnouncementForm;
