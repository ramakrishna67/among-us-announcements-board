
import React, { useRef, useEffect } from "react";
import { useAnnouncements } from "@/context/AnnouncementContext";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Volume, Volume2, VolumeX, Music } from "lucide-react";

const SoundControl = () => {
  const { 
    playSound, 
    setPlaySound, 
    soundDuration, 
    setSoundDuration,
    testSound 
  } = useAnnouncements();
  
  const handleTestSound = () => {
    if (!playSound) {
      toast.warning("Sound is disabled. Enable it first.");
      return;
    }
    
    toast.success("Playing test sound");
    testSound();
  };
  
  return (
    <Card className="p-6 bg-card/70 backdrop-blur-sm border border-amongus-purple/20">
      <h3 className="text-xl font-semibold mb-4 text-amongus-purple">Sound Settings</h3>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {playSound ? <Volume2 className="h-5 w-5 text-amongus-purple" /> : <VolumeX className="h-5 w-5 text-amongus-gray" />}
            <Label htmlFor="sound-toggle" className="text-white">
              Enable announcement sounds
            </Label>
          </div>
          <Switch 
            id="sound-toggle"
            checked={playSound}
            onCheckedChange={setPlaySound}
            className="data-[state=checked]:bg-amongus-purple"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="sound-duration" className="text-white">Sound Duration: {soundDuration} seconds</Label>
            <Volume className="h-5 w-5 text-amongus-purple" />
          </div>
          <Slider
            id="sound-duration"
            min={1}
            max={10}
            step={1}
            value={[soundDuration]}
            onValueChange={(value) => setSoundDuration(value[0])}
            className="[&_[role=slider]]:bg-amongus-purple"
            disabled={!playSound}
          />
          <div className="flex justify-between text-xs text-amongus-gray">
            <span>1s</span>
            <span>5s</span>
            <span>10s</span>
          </div>
        </div>
        
        <Button 
          onClick={handleTestSound}
          className="among-button w-full mt-4"
          disabled={!playSound}
        >
          <Music className="w-4 h-4 mr-2" /> Test Sound
        </Button>
        
        <div className="mt-4 rounded-md bg-card p-4 text-sm text-amongus-gray">
          <p className="mb-2 text-white">Sound will play:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>When a new announcement is posted</li>
            <li>For the duration set above</li>
            <li>Only if sound is enabled</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default SoundControl;
