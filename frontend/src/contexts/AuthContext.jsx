import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext({
  signed: false,
  usuario: null,
  login: () => {},
  logout: () => {}
});

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      const sessao = sessionStorage.getItem("autogestao_sessao") || localStorage.getItem("usuario") || localStorage.getItem("user");
      if (sessao) {
        const parsed = JSON.parse(sessao);
        return parsed.user || parsed.usuario || parsed;
      }
    } catch (e) {
      console.error("Erro ao carregar sessão", e);
    }
    return null;
  });

  const signed = !!usuario;

  function login(dadosUsuario) {
    setUsuario(dadosUsuario);
    localStorage.setItem("usuario", JSON.stringify(dadosUsuario));
  }

  function logout() {
    setUsuario(null);
    localStorage.removeItem("usuario");
    localStorage.removeItem("user");
    sessionStorage.removeItem("autogestao_sessao");
  }

  return (
    <AuthContext.Provider value={{ signed, usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}