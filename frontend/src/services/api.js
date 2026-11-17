const API_URL = "http://localhost:8080";
const STORAGE_KEY = "autogestao_sessao";

// Função para descobrir o ID da oficina logada caso não seja passado por parâmetro
function getOficinaIdAtual() {
  try {
    // Tenta pegar do objeto de sessão ou do usuário salvo no localStorage
    const sessao = sessionStorage.getItem(STORAGE_KEY);
    if (sessao) {
      const parsed = JSON.parse(sessao);
      if (parsed.id || parsed.user?.id) return parsed.id || parsed.user.id;
    }

    const usuarioSalvo = localStorage.getItem("usuario") || localStorage.getItem("user");
    if (usuarioSalvo) {
      const parsed = JSON.parse(usuarioSalvo);
      return parsed.id || parsed.usuario?.id || parsed.user?.id || null;
    }
  } catch (e) {
    console.error("Erro ao ler ID da oficina", e);
  }
  return null;
}

// Função central para requisições autenticadas
export async function apiFetch(endpoint, options = {}) {
  let token = null;

  try {
    const dados = sessionStorage.getItem(STORAGE_KEY);
    if (dados) {
      const parsed = JSON.parse(dados);
      if (parsed.token) token = parsed.token;
    }
  } catch {
    // ignora erro de parse
  }

  // Fallback para o localStorage ou token de estudo se não achar no sessionStorage
  if (!token) {
    token = localStorage.getItem("token") || "fake-jwt-token-estudo";
  }

  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
}

// CLIENTES

export async function getClientes(oficinaIdParam) {
  const oficinaId = oficinaIdParam || getOficinaIdAtual();
  const endpoint = oficinaId ? `/api/clientes?oficinaId=${oficinaId}` : "/api/clientes";
  
  const response = await apiFetch(endpoint);

  if (!response.ok) {
    throw new Error("Erro ao buscar clientes");
  }

  return response.json();
}

export async function createCliente(cliente) {
  const response = await apiFetch("/api/clientes", {
    method: "POST",
    body: JSON.stringify(cliente),
  });

  if (!response.ok) {
    throw new Error("Erro ao criar cliente");
  }

  return response.json();
}

// VEÍCULOS

export async function getVeiculos(oficinaIdParam) {
  const oficinaId = oficinaIdParam || getOficinaIdAtual();
  const endpoint = oficinaId ? `/api/veiculos?oficinaId=${oficinaId}` : "/api/veiculos";

  const response = await apiFetch(endpoint);

  if (!response.ok) {
    throw new Error("Erro ao buscar veículos");
  }

  return response.json();
}

// ORDENS DE SERVIÇO

export async function getOrdensServico(oficinaIdParam) {
  const oficinaId = oficinaIdParam || getOficinaIdAtual();
  const endpoint = oficinaId ? `/api/ordens?oficinaId=${oficinaId}` : "/api/ordens";

  const response = await apiFetch(endpoint);

  if (!response.ok) {
    throw new Error("Erro ao buscar ordens de serviço");
  }

  return response.json();
}

export async function createOrdemServico(ordem) {
  const response = await apiFetch("/api/ordens", {
    method: "POST",
    body: JSON.stringify(ordem),
  });

  if (!response.ok) {
    throw new Error("Erro ao criar ordem de serviço");
  }

  return response.json();
}

export async function finalizarOrdemServico(id) {
  const response = await apiFetch(`/api/ordens/${id}/finalizar`, {
    method: "PUT",
  });

  if (!response.ok) {
    throw new Error("Erro ao finalizar ordem de serviço");
  }

  return response.json();
}