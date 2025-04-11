
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface AdminLoginProps {
  onLogin: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // In a real app, this would verify against a secure backend
  // For demo purposes, we're hardcoding the password
  const ADMIN_PASSWORD = "sushacks";
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    // Simulate API call
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        toast.success("Successfully logged in as admin");
        onLogin();
      } else {
        setError("Invalid password. Try again.");
        toast.error("Login failed");
      }
      setIsLoading(false);
    }, 800);
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="announcement-card w-full max-w-md p-8">
        <div className="mb-6 flex justify-center">
          <div className="h-20 w-20 rounded-full bg-amongus-dark p-5">
            <Shield className="h-full w-full text-amongus-purple" />
          </div>
        </div>
        
        <h2 className="mb-6 text-center text-2xl font-bold text-amongus-purple">Admin Access</h2>
        
        <form onSubmit={handleLogin}>
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-white">
              Enter Admin Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="among-input"
              placeholder="••••••••"
              required
            />
          </div>
          
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-md bg-amongus-red/10 p-3 text-sm text-amongus-red">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full among-button" 
            disabled={isLoading}
          >
            {isLoading ? "Verifying..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
