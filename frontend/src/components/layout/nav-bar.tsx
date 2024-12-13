"use client";

import { useAuth } from '@/lib/hooks/useAuth';

export function NavBar() {
  const { isAuthenticated, isLoading, user, login, logout } = useAuth();

  return (
    <nav className="flex justify-between items-center p-4">
      <div className="logo">Video Creator</div>
      
      <div className="flex items-center gap-4">
        {isLoading ? (
          <div>Loading...</div>
        ) : isAuthenticated ? (
          <>
            <div className="user-info">
              <img 
                src={user?.picture} 
                alt="Profile" 
                className="w-8 h-8 rounded-full"
              />
              <span>{user?.name}</span>
            </div>
            <button onClick={() => logout()}>
              Logout
            </button>
          </>
        ) : (
          <button onClick={() => login()}>
            Login
          </button>
        )}
      </div>
    </nav>
  );
} 