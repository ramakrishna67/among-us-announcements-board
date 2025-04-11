
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import AnnouncementBoard from "@/components/AnnouncementBoard";
import SUSHacksLogo from "@/components/SUSHacksLogo";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

const Index = () => {
  // Listening for keypress 'a' to navigate to admin
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'a' && e.ctrlKey) {
        window.location.href = '/admin';
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col py-8">
      <header>
        <SUSHacksLogo />
      </header>
      
      <main className="flex-grow">
        <AnnouncementBoard />
      </main>
      
      <footer className="mt-8 p-4 text-center">
        <Link to="/admin">
          <Button variant="ghost" size="sm" className="text-amongus-gray hover:text-white">
            <Lock className="h-4 w-4 mr-2" /> Admin Access
          </Button>
        </Link>
      </footer>
    </div>
  );
};

export default Index;
