import { useState } from "react";
import "./Login.css";
import { Link, useSearchParams } from "react-router-dom";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8080"
).replace(/\/$/, "");

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [searchParams] = useSearchParams();
  const slugOficina = searchParams.get("oficina");

  async function handleLogin(event) {
    event.preventDefault();
    setCarregando(true);
    setErro("");

    try {
      // Faz a requisição real para a rota de login do back-end
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          senha: senha.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "E-mail ou senha incorretos.");
      }

      // Salva os dados reais retornados pelo back-end no navegador
      localStorage.setItem("token", data.token || data.accessToken);
      localStorage.setItem("usuario", JSON.stringify(data.usuario || data.user));
      
      // Salva também no sessionStorage se necessário
      sessionStorage.setItem("autogestao_sessao", JSON.stringify(data));

      // Define o destino com base no perfil retornado pela API
      const perfil = data.usuario?.perfil || data.user?.perfil;
      const destino = perfil === "ADM_SISTEMA" ? "/admin" : "/gestao";

      // Redireciona para o painel correto
      window.location.href = destino;
    } catch (error) {
      setErro(error.message || "Erro ao realizar login.");
      setCarregando(false);
    }
  }

  return (
    <main className="login-page">
      {/* Painel de apresentação */}
      <section className="login-brand">
        <h1>AutoGestão Pro</h1>

        <div className="login-brand-content">
          <h2>Gestão inteligente para sua oficina.</h2>

          <p>
            Simplifique processos, acompanhe resultados e tenha o controle da
            sua oficina em um só lugar.
          </p>
        </div>

        <footer className="login-brand-footer">
          © 2026 AutoGestão Pro. Todos os direitos reservados.
        </footer>
      </section>

      {/* Painel de autenticação */}
      <section className="login-form-container">
        <div className="login-form-content">
          <header className="login-form-header">
            <h2>Bem-vindo de volta!</h2>
            <p>Entre com suas credenciais para acessar sua conta.</p>
          </header>

          <form onSubmit={handleLogin}>
            <div className="login-field">
              <label htmlFor="email">E-mail</label>

              <input
                type="email"
                id="email"
                name="email"
                placeholder="Digite seu e-mail"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="login-field">
              <label htmlFor="senha">Senha</label>

              <input
                type="password"
                id="senha"
                name="senha"
                placeholder="Digite sua senha"
                required
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
              />
            </div>

            {erro && (
              <p role="alert" style={{ color: "var(--color-danger)", marginBottom: "12px", fontSize: "13px" }}>
                {erro}
              </p>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={carregando}
            >
              {carregando ? "Entrando..." : "Entrar"}
            </button>
            <div className="login-first-access">
              <span>Primeiro acesso?</span>
              <Link
                to={
                  slugOficina
                    ? `/primeiro-acesso?oficina=${encodeURIComponent(slugOficina)}`
                    : "/primeiro-acesso"
                }
              >
                Ative sua conta
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

export default Login;