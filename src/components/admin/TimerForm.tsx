
import React, { useState } from "react";
import { useAnnouncements } from "@/context/AnnouncementContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const TimerForm = () => {
  const { setTimer } = useAnnouncements();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!title.trim()) {
      newErrors.title = "Title is required";
    }
    
    if (!date) {
      newErrors.date = "Date is required";
    }
    
    if (!time) {
      newErrors.time = "Time is required";
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
    
    // Combine date and time
    const endDate = new Date(date!);
    const [hours, minutes] = time.split(":").map(Number);
    endDate.setHours(hours, minutes);
    
    // Ensure the date is in the future
    if (endDate <= new Date()) {
      toast.error("Timer date must be in the future");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await setTimer({
        title,
        description: description || undefined,
        endTime: endDate,
      });
      
      // Reset form
      setTitle("");
      setDescription("");
      setDate(undefined);
      setTime("");
      
    } catch (error) {
      console.error("Error setting timer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const clearTimer = async () => {
    try {
      await setTimer(null);
      toast.success("Timer cleared");
    } catch (error) {
      console.error("Error clearing timer:", error);
      toast.error("Failed to clear timer");
    }
  };
  
  return (
    <Card className="p-6 bg-card/70 backdrop-blur-sm border border-amongus-purple/20">
      <h3 className="text-xl font-semibold mb-4 text-amongus-purple">Set Timer</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="timer-title">Timer Title</Label>
          <Input
            id="timer-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="among-input"
            placeholder="Timer title"
          />
          {errors.title && (
            <div className="text-amongus-red text-sm mt-1 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.title}
            </div>
          )}
        </div>
        
        <div>
          <Label htmlFor="timer-description">Description (optional)</Label>
          <Textarea
            id="timer-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="among-input min-h-[100px]"
            placeholder="Timer description"
          />
        </div>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal mt-1 among-input",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Select date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {errors.date && (
              <div className="text-amongus-red text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.date}
              </div>
            )}
          </div>
          
          <div>
            <Label htmlFor="time">End Time</Label>
            <div className="flex items-center mt-1">
              <Clock className="mr-2 h-4 w-4 text-amongus-purple" />
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="among-input"
              />
            </div>
            {errors.time && (
              <div className="text-amongus-red text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.time}
              </div>
            )}
          </div>
        </div>
        
        <div className="pt-4 flex gap-4">
          <Button 
            type="submit" 
            className="among-button flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Setting..." : "Set Timer"}
          </Button>
          
          <Button 
            type="button"
            variant="outline" 
            className="border-amongus-red text-amongus-red hover:bg-amongus-red/10"
            onClick={clearTimer}
          >
            Clear Timer
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default TimerForm;
