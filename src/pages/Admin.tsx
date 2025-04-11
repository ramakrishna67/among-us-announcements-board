
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLogin from "@/components/AdminLogin";
import AdminPanel from "@/components/admin/AdminPanel";

const Admin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  
  const handleLogin = () => {
    setIsLoggedIn(true);
  };
  
  const handleLogout = () => {
    setIsLoggedIn(false);
    navigate('/');
  };
  
  return (
    <div className="min-h-screen">
      {isLoggedIn ? (
        <AdminPanel onLogout={handleLogout} />
      ) : (
        <AdminLogin onLogin={handleLogin} />
      )}
    </div>
  );
};

export default Admin;
