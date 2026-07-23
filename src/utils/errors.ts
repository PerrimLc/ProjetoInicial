export function traduzirErroFirebase(code: string): string {
  const erros: Record<string, string> = {
    'auth/user-not-found': 'E-mail não cadastrado.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/email-already-in-use': 'Este e-mail já está em uso.',
    'auth/invalid-email': 'E-mail inválido.',
    'auth/weak-password': 'Senha muito fraca. Use pelo menos 6 caracteres.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde e tente novamente.',
    'auth/network-request-failed': 'Sem conexão com a internet.',
    'permission-denied': 'Você não tem permissão para realizar esta ação.',
    'not-found': 'Registro não encontrado.',
    'unavailable': 'Serviço temporariamente indisponível.',
  }
  return erros[code] ?? 'Ocorreu um erro inesperado. Tente novamente.'
}
