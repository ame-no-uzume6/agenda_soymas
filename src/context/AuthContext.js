import React, { createContext, useContext, useEffect, useState } from 'react';

// LocalStorage key where users are stored
const USERS_KEY = 'app_users_v1';
const CURRENT_USER_KEY = 'app_current_user_email';

const AuthContext = createContext(null);

function seedDefaultUsers() {
  const existing = localStorage.getItem(USERS_KEY);
  if (existing) return;

  const userA = {
    email: 'ana@example.com',
    password: 'pass123',
    name: 'Ana López',
    oficio: 'programacion',
    asistencia: {}, // map date->boolean
    compromisos: {}, // map weekKey -> array of {tipo, descripcion, target}
    tareas: {} // map dateKey -> array of tasks
  };

  const userB = {
    email: 'maria@example.com',
    password: 'maria123',
    name: 'María Pérez',
    oficio: 'gastronomia',
    asistencia: {},
    compromisos: {},
    tareas: {}
  };

  localStorage.setItem(USERS_KEY, JSON.stringify([userA, userB]));
}

export function AuthProvider({ children }){
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(()=>{
    seedDefaultUsers();
    // restore current user email if any
    const email = localStorage.getItem(CURRENT_USER_KEY);
    if(email){
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      const found = users.find(u => u.email === email);
      if(found){
        setCurrentUser(found);
        // load user data into app-local keys (compat)
        restoreUserDataToApp(found);
      }
    }
  }, []);

  const restoreUserDataToApp = (user) =>{
    // write user's compromisos and tareas and asistencia to the app's expected localStorage keys
    try{
      // compromisos is a map of weekKey->array, copy each into localStorage
      if(user.compromisos){
        Object.keys(user.compromisos).forEach(k => {
          localStorage.setItem(k, JSON.stringify(user.compromisos[k]));
        });
      }
      if(user.tareas){
        Object.keys(user.tareas).forEach(k=>{
          localStorage.setItem(k, JSON.stringify(user.tareas[k]));
        });
      }
      if(user.asistencia){
        // store as 'asistencia-YYYY-MM-DD' entries or a single key
        localStorage.setItem('user-asistencia-' + user.email, JSON.stringify(user.asistencia));
      }
    }catch(e){
      console.error('restore user data failed', e);
    }
  };

  const login = (email, password) =>{
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const found = users.find(u => u.email === email && u.password === password);
    if(found){
      setCurrentUser(found);
      localStorage.setItem(CURRENT_USER_KEY, email);
      restoreUserDataToApp(found);
      return { ok: true };
    }
    return { ok: false, message: 'Credenciales inválidas' };
  };

  const logout = () =>{
    setCurrentUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  const updateCurrentUserData = (updater) =>{
    // updater receives the current user object and should return a new user object
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if(!currentUser) return;
    const newUser = updater(currentUser);
    // replace in array
    const next = users.map(u => u.email === newUser.email ? newUser : u);
    localStorage.setItem(USERS_KEY, JSON.stringify(next));
    setCurrentUser(newUser);
    // persist user-specific parts to app keys
    restoreUserDataToApp(newUser);
  };

  const switchUser = (email) => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const found = users.find(u => u.email === email);
    if(found){
      setCurrentUser(found);
      localStorage.setItem(CURRENT_USER_KEY, email);
      restoreUserDataToApp(found);
      return { ok: true };
    }
    return { ok:false, message: 'Usuario no encontrado' };
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
