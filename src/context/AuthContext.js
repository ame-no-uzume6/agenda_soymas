import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }){
  const [currentUser, setCurrentUser] = useState(null);

  // on mount, do nothing (we removed localStorage). App requires explicit login.
  useEffect(()=>{
    // noop
  }, []);

  const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';

  const login = async (email, password) =>{
    try{
      const res = await fetch(`${serverUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if(!data.ok) return { ok: false, message: data.message || 'Login failed' };
      // fetch user details
      const userRes = await fetch(`${serverUrl}/api/user?email=${encodeURIComponent(email)}`);
      const userData = await userRes.json();
      if(!userData.ok) return { ok: false, message: 'Failed to load user' };
      setCurrentUser(userData.user);
      return { ok: true };
    }catch(e){
      console.error('login error', e);
      return { ok: false, message: 'Network error' };
    }
  };

  const logout = () =>{
    // Clear any client-side user-specific cached data to fully disconnect the previous user
    try{
      const prefixes = ['compromisos-week-', 'tasks-', 'asistencia-'];
      // iterate backwards because removing keys mutates length
      for(let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (!key) continue;
        for(const p of prefixes){
          if (key.startsWith(p)) {
            localStorage.removeItem(key);
            break;
          }
        }
      }
    }catch(e){
      console.warn('logout cleanup failed', e);
    }
    setCurrentUser(null);
  };

  const updateCurrentUserData = async (updater) =>{
    // updater receives currentUser and must return new user object (client-only changes)
    if(!currentUser) return;
    const newUser = updater(currentUser);
    setCurrentUser(newUser);
    // If asistencia present, try to sync to server
    try{
      if(newUser && newUser.asistencia){
        await fetch(`${serverUrl}/api/syncAsistencia`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: newUser.email, asistencia: newUser.asistencia })
        });
      }
    }catch(e){
      console.warn('sync to server failed', e);
    }
  };

  const switchUser = async (email) => {
    // load user from server
    try{
      const userRes = await fetch(`${serverUrl}/api/user?email=${encodeURIComponent(email)}`);
      const userData = await userRes.json();
      if(!userData.ok) return { ok:false, message: 'Usuario no encontrado' };
      setCurrentUser(userData.user);
      return { ok: true };
    }catch(e){
      console.error('switchUser error', e);
      return { ok:false, message: 'Network error' };
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, updateCurrentUserData, switchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(){
  return useContext(AuthContext);
}

export default AuthContext;
