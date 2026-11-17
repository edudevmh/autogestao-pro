import React, { createContext, useState } from 'react';

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user] = useState({ 
    id: 1, 
    email: 'edu.devmh@gmail.com', 
    perfil: 'ADM_SISTEMA' 
  });

  const value = {
    signed: true,
    user,
    usuario: user,
    login: () => {},
    logout: () => {}
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}