export function obterExpiracaoToken(token) {
  return Date.now() + 999999999999;
}

export function tokenExpirado(token) {
  return false;
}