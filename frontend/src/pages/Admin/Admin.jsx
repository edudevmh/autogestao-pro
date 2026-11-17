import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Admin.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8080"
).replace(/\/$/, "");

const obterToken = () => {
  try {
    const sessao = sessionStorage.getItem("autogestao_sessao");
    if (sessao) {
      const dados = JSON.parse(sessao);
      if (dados.token) return dados.token;
    }
    
    const tokenLocal = localStorage.getItem("token");
    if (tokenLocal) return tokenLocal;

    return "fake-jwt-token-estudo";
  } catch {
    return "fake-jwt-token-estudo";
  }
};

async function buscarOficinas(signal) {
  const token = obterToken();

  const response = await fetch(`${API_URL}/api/oficinas`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal,
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Sua sessão expirou. Faça login novamente.");
    }

    if (response.status === 403) {
      throw new Error("Você não tem permissão para consultar oficinas.");
    }

    throw new Error("Não foi possível carregar as oficinas.");
  }

  const dados = await response.json();

  if (!Array.isArray(dados)) {
    throw new Error("Formato de resposta inesperado.");
  }

  return dados;
}

const Icon = ({ name, size = 20 }) => {
  const paths = {
    building: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M9 21v-4h6v4M8 7h1M15 7h1M8 11h1M15 11h1" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    pause: (
      <>
        <rect x="6" y="4" width="4" height="16" rx="1" />
        <rect x="14" y="4" width="4" height="16" rx="1" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
      </>
    ),
    external: (
      <>
        <path d="M13 5h6v6M19 5l-9 9" />
        <path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M5 9a8 8 0 0 1 14-2l1 5M4 12l1 5a8 8 0 0 0 14-2" />
      </>
    ),
    alert: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 7v6M12 17h.01" />
      </>
    ),
    close: <path d="M18 6 6 18M6 6l12 12" />,
    link: (
      <>
        <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
        <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
      </>
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </>
    ),
    edit: (
      <>
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
};

function Admin() {
  const navigate = useNavigate();
  const [oficinas, setOficinas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todas");
  const [modal, setModal] = useState(null);
  const [modalEdicao, setModalEdicao] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState("");

  const requisicaoRef = useRef(null);

  const fazerLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/");
  };

  useEffect(() => {
    const controller = new AbortController();
    requisicaoRef.current = controller;

    buscarOficinas(controller.signal)
      .then((dados) => {
        if (controller.signal.aborted) return;
        setOficinas(dados);
        setErro("");
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setErro(error.message);
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setCarregando(false);
      });

    return () => {
      controller.abort();
    };
  }, []);

  const atualizarOficinas = useCallback(async () => {
    requisicaoRef.current?.abort();

    const controller = new AbortController();
    requisicaoRef.current = controller;

    setCarregando(true);
    setErro("");

    try {
      const dados = await buscarOficinas(controller.signal);
      if (controller.signal.aborted) return;
      setOficinas(dados);
    } catch (error) {
      if (controller.signal.aborted) return;
      setErro(error.message);
    } finally {
      if (!controller.signal.aborted) {
        setCarregando(false);
      }
    }
  }, []);

  const indicadores = useMemo(() => {
    const ativas = oficinas.filter((oficina) => oficina.ativo).length;
    return {
      total: oficinas.length,
      ativas,
      inativas: oficinas.length - ativas,
    };
  }, [oficinas]);

  const oficinasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return oficinas.filter((oficina) => {
      const correspondeBusca = [oficina.nome, oficina.cnpj, oficina.slug].some(
        (valor) =>
          String(valor || "")
            .toLowerCase()
            .includes(termo),
      );

      const correspondeFiltro =
        filtro === "todas" ||
        (filtro === "ativas" && oficina.ativo) ||
        (filtro === "inativas" && !oficina.ativo);

      return correspondeBusca && correspondeFiltro;
    });
  }, [oficinas, busca, filtro]);

  const linkOficina = (slug) =>
    `${window.location.origin}/o/${encodeURIComponent(slug)}`;

  const copiarLink = async (slug) => {
    try {
      await navigator.clipboard.writeText(linkOficina(slug));
      setAviso("Link copiado para a área de transferência.");
    } catch {
      setAviso("Não foi possível copiar o link.");
    }
  };

  const alterarAtivacao = async () => {
    if (!modal || salvando) return;

    setSalvando(true);
    setErro("");

    try {
      const token = obterToken();
      const novoStatus = !modal.ativo;

      const response = await fetch(
        `${API_URL}/api/oficinas/${modal.id}/ativacao`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ativo: novoStatus }),
        },
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Sua sessão expirou. Faça login novamente.");
        }

        if (response.status === 403) {
          throw new Error("Você não tem permissão para alterar esta oficina.");
        }

        throw new Error("Não foi possível alterar a situação da oficina.");
      }

      setOficinas((anteriores) =>
        anteriores.map((oficina) =>
          oficina.id === modal.id ? { ...oficina, ativo: novoStatus } : oficina,
        ),
      );

      setAviso(
        novoStatus
          ? `Oficina "${modal.nome}" ativada com sucesso.`
          : `Oficina "${modal.nome}" pausada com sucesso.`,
      );

      setModal(null);
    } catch (error) {
      setErro(error.message);
      setModal(null);
    } finally {
      setSalvando(false);
    }
  };

  const salvarEdicao = async (event) => {
    event.preventDefault();
    if (!modalEdicao || salvando) return;

    setSalvando(true);
    setErro("");

    try {
      const token = obterToken();
      const response = await fetch(`${API_URL}/api/oficinas/${modalEdicao.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: modalEdicao.nome,
          cnpj: modalEdicao.cnpj,
          telefone: modalEdicao.telefone,
          endereco: modalEdicao.endereco,
          email: modalEdicao.email,
          senha: modalEdicao.senha,
        }),
      });

      if (!response.ok) {
        throw new Error("Não foi possível atualizar os dados da oficina.");
      }

      const dadosResp = await response.json();
      const oficinaAtualizada = dadosResp.oficina;

      setOficinas((anteriores) =>
        anteriores.map((oficina) =>
          oficina.id === oficinaAtualizada.id ? oficinaAtualizada : oficina
        )
      );

      setAviso(`Oficina "${oficinaAtualizada.nome}" atualizada com sucesso.`);
      setModalEdicao(null);
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-topbar">
        <div className="admin-topbar-inner" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <div className="admin-brand">
            <span className="admin-brand-icon">
              <Icon name="building" size={23} />
            </span>

            <div>
              <strong>AutoGestão Pro</strong>
              <small>Administração da plataforma</small>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="admin-user-badge">ADM_SISTEMA</span>
            
            <button
              type="button"
              onClick={fazerLogout}
              className="admin-btn admin-btn-outline"
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", fontSize: "13px" }}
              title="Encerrar sessão"
            >
              <Icon name="logout" size={16} />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="admin-container">
        <section className="admin-heading">
          <div>
            <span className="admin-eyebrow">PAINEL ADMINISTRATIVO</span>

            <h1>Gestão de oficinas</h1>

            <p>
              Gerencie os cadastros, acompanhe os acessos e controle a situação
              das oficinas.
            </p>
          </div>

          <button
            className="admin-btn admin-btn-primary"
            onClick={() => window.location.assign("/admin/oficinas/nova")}
          >
            <Icon name="plus" size={19} />
            Nova oficina
          </button>
        </section>

        {aviso && (
          <div className="admin-notice" role="status">
            <Icon name="check" size={18} />
            <span>{aviso}</span>

            <button
              type="button"
              onClick={() => setAviso("")}
              aria-label="Fechar aviso"
            >
              <Icon name="close" size={17} />
            </button>
          </div>
        )}

        {erro && (
          <div className="admin-error" role="alert">
            <Icon name="alert" size={19} />
            <span>{erro}</span>

            <button
              type="button"
              onClick={() => setErro("")}
              aria-label="Fechar erro"
            >
              <Icon name="close" size={17} />
            </button>
          </div>
        )}

        <section className="admin-stats">
          <div className="admin-stat">
            <div className="admin-stat-icon admin-stat-blue">
              <Icon name="building" />
            </div>

            <span>Total de oficinas</span>
            <strong>{carregando ? "—" : indicadores.total}</strong>
            <small>Cadastradas na plataforma</small>
          </div>

          <div className="admin-stat">
            <div className="admin-stat-icon admin-stat-green">
              <Icon name="check" />
            </div>

            <span>Oficinas ativas</span>
            <strong>{carregando ? "—" : indicadores.ativas}</strong>
            <small>Com acesso liberado</small>
          </div>

          <div className="admin-stat">
            <div className="admin-stat-icon admin-stat-orange">
              <Icon name="pause" />
            </div>

            <span>Oficinas inativas</span>
            <strong>{carregando ? "—" : indicadores.inativas}</strong>
            <small>Aguardando liberação ou pausadas</small>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>Oficinas cadastradas</h2>
              <p>Consulte e gerencie todas as oficinas da plataforma.</p>
            </div>

            <button
              type="button"
              className="admin-btn admin-btn-outline"
              onClick={atualizarOficinas}
              disabled={carregando}
            >
              <Icon name="refresh" size={17} />
              Atualizar
            </button>
          </div>

          <div className="admin-toolbar">
            <div className="admin-search">
              <Icon name="search" size={19} />

              <input
                type="search"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar por nome, CNPJ ou slug..."
                aria-label="Buscar oficinas"
              />
            </div>

            <div className="admin-filters">
              {[
                ["todas", "Todas"],
                ["ativas", "Ativas"],
                ["inativas", "Inativas"],
              ].map(([valor, label]) => (
                <button
                  type="button"
                  key={valor}
                  className={filtro === valor ? "active" : ""}
                  onClick={() => setFiltro(valor)}
                  aria-pressed={filtro === valor}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-result-count">
            {carregando
              ? "Carregando oficinas..."
              : `${oficinasFiltradas.length} oficina(s) encontrada(s)`}
          </div>

          {carregando ? (
            <div className="admin-empty">Carregando oficinas...</div>
          ) : erro && oficinas.length === 0 ? (
            <div className="admin-empty">
              Não foi possível carregar a listagem.
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={atualizarOficinas}
              >
                Tentar novamente
              </button>
            </div>
          ) : oficinasFiltradas.length === 0 ? (
            <div className="admin-empty">
              Nenhuma oficina encontrada para os filtros selecionados.
            </div>
          ) : (
            <div className="admin-offices">
              {oficinasFiltradas.map((oficina) => (
                <article className="admin-office" key={oficina.id}>
                  <div className="admin-office-main">
                    <div className="admin-office-avatar">
                      <Icon name="building" size={22} />
                    </div>

                    <div className="admin-office-info">
                      <div className="admin-office-title">
                        <h3>{oficina.nome}</h3>

                        <span
                          className={`admin-status ${
                            oficina.ativo ? "is-active" : "is-inactive"
                          }`}
                        >
                          <span className="admin-status-dot" />
                          {oficina.ativo ? "Ativa" : "Inativa"}
                        </span>
                      </div>

                      <p>CNPJ: {oficina.cnpj} | Tel: {oficina.telefone || "Não informado"}</p>
                      <p>{oficina.email}</p>
                    </div>
                  </div>

                  <div className="admin-office-link">
                    <span>
                      <Icon name="link" size={16} />
                      Link público da oficina
                    </span>

                    <code>/o/{oficina.slug}</code>
                  </div>

                  <div className="admin-office-actions">
                    <div className="admin-link-actions" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="admin-btn admin-btn-outline"
                        onClick={() => copiarLink(oficina.slug)}
                      >
                        <Icon name="copy" size={16} />
                        Copiar link
                      </button>

                      <a
                        className="admin-btn admin-btn-outline"
                        href={linkOficina(oficina.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Icon name="external" size={16} />
                        Abrir página
                      </a>

                      <button
                        type="button"
                        className="admin-btn admin-btn-outline"
                        onClick={() => setModalEdicao({ ...oficina, senha: "" })}
                      >
                        <Icon name="edit" size={16} />
                        Editar
                      </button>
                    </div>

                    <button
                      type="button"
                      className={`admin-btn ${
                        oficina.ativo ? "admin-btn-danger" : "admin-btn-primary"
                      }`}
                      onClick={() => setModal(oficina)}
                    >
                      <Icon
                        name={oficina.ativo ? "pause" : "check"}
                        size={17}
                      />

                      {oficina.ativo ? "Pausar acesso" : "Ativar oficina"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* MODAL DE ATIVAÇÃO / PAUSA */}
      {modal && (
        <div
          className="admin-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !salvando) {
              setModal(null);
            }
          }}
        >
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-modal-title"
          >
            <div
              className={`admin-modal-icon ${
                modal.ativo ? "admin-modal-warning" : "admin-modal-success"
              }`}
            >
              <Icon name={modal.ativo ? "pause" : "check"} size={26} />
            </div>

            <h2 id="admin-modal-title">
              {modal.ativo ? "Pausar acesso da oficina?" : "Ativar oficina?"}
            </h2>

            <p>
              {modal.ativo
                ? `A oficina "${modal.nome}" terá seu acesso às funcionalidades protegidas bloqueado.`
                : `Deseja liberar o acesso da oficina "${modal.nome}" à plataforma?`}
            </p>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => setModal(null)}
                disabled={salvando}
              >
                Cancelar
              </button>

              <button
                type="button"
                className={`admin-btn ${
                  modal.ativo ? "admin-btn-danger" : "admin-btn-primary"
                }`}
                onClick={alterarAtivacao}
                disabled={salvando}
              >
                {salvando
                  ? "Salvando..."
                  : modal.ativo
                    ? "Confirmar pausa"
                    : "Confirmar ativação"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DA OFICINA */}
      {modalEdicao && (
        <div
          className="admin-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !salvando) {
              setModalEdicao(null);
            }
          }}
        >
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            style={{ maxWidth: "500px", textAlign: "left" }}
          >
            <h2>Editar Oficina</h2>
            <p style={{ marginBottom: "16px", color: "#64748b", fontSize: "13px" }}>
              Altere os dados cadastrais ou redefina a senha da oficina abaixo.
            </p>

            <form onSubmit={salvando ? (e) => e.preventDefault() : salvarEdicao}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Nome da Oficina</label>
                <input
                  type="text"
                  value={modalEdicao.nome || ""}
                  onChange={(e) => setModalEdicao({ ...modalEdicao, nome: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  required
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>CNPJ</label>
                <input
                  type="text"
                  value={modalEdicao.cnpj || ""}
                  onChange={(e) => setModalEdicao({ ...modalEdicao, cnpj: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  required
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Telefone</label>
                <input
                  type="text"
                  value={modalEdicao.telefone || ""}
                  onChange={(e) => setModalEdicao({ ...modalEdicao, telefone: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>E-mail</label>
                <input
                  type="email"
                  value={modalEdicao.email || ""}
                  onChange={(e) => setModalEdicao({ ...modalEdicao, email: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  required
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Nova Senha (Opcional)</label>
                <input
                  type="password"
                  value={modalEdicao.senha || ""}
                  onChange={(e) => setModalEdicao({ ...modalEdicao, senha: e.target.value })}
                  placeholder="Preencha apenas se desejar alterar a senha"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Endereço</label>
                <input
                  type="text"
                  value={modalEdicao.endereco || ""}
                  onChange={(e) => setModalEdicao({ ...modalEdicao, endereco: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setModalEdicao(null)}
                  disabled={salvando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={salvando}
                >
                  {salvando ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;