import { db, Timestamp } from './firestore'

/**
 * Localiza (ou cria) o contato e a conversa "whatsapp" de um número de
 * telefone dentro de uma empresa. Mantém o mesmo formato que o app usa
 * em src/services/atendimento/conversaService.ts e contatoService.ts.
 */
export async function buscarOuCriarConversaWhatsApp(
  empresaId: string,
  telefone: string
): Promise<{ conversaId: string; contatoNome: string }> {
  const conversasRef = db.collection(`empresas/${empresaId}/conversas`)

  const existente = await conversasRef
    .where('telefone', '==', telefone)
    .where('origem', '==', 'whatsapp')
    .limit(1)
    .get()

  if (!existente.empty) {
    const doc = existente.docs[0]
    return { conversaId: doc.id, contatoNome: doc.data().contatoNome as string }
  }

  const contatoRef = await db.collection(`empresas/${empresaId}/contatos`).add({
    nome: telefone,
    telefone,
    etiquetaIds: [],
    origem: 'whatsapp',
    ativo: true,
    criadoEm: Timestamp.now(),
    atualizadoEm: Timestamp.now(),
  })

  const conversaRef = await conversasRef.add({
    contatoId: contatoRef.id,
    contatoNome: telefone,
    telefone,
    status: 'aguardando',
    ultimaMensagem: '',
    ultimaMensagemEm: Timestamp.now(),
    mensagensNaoLidas: 0,
    etiquetaIds: [],
    origem: 'whatsapp',
    criadoEm: Timestamp.now(),
    atualizadoEm: Timestamp.now(),
  })

  return { conversaId: conversaRef.id, contatoNome: telefone }
}

export interface MensagemParaSalvar {
  texto: string
  tipo: 'texto' | 'sistema'
  direcao: 'entrada' | 'saida'
  remetenteId?: string
  status: 'enviando' | 'enviada' | 'entregue' | 'lida' | 'erro'
  whatsappMessageId?: string
}

/**
 * Grava uma mensagem na conversa. Se whatsappMessageId for informado, usa
 * ele como ID do documento — assim uma reentrega do mesmo webhook pela Meta
 * não duplica a mensagem (a escrita simplesmente sobrescreve o mesmo doc).
 */
export async function salvarMensagem(
  empresaId: string,
  conversaId: string,
  dados: MensagemParaSalvar
): Promise<{ id: string; jaExistia: boolean }> {
  const colecao = db.collection(`empresas/${empresaId}/conversas/${conversaId}/mensagens`)

  if (dados.whatsappMessageId) {
    const docId = `wa_${dados.whatsappMessageId}`
    const ref = colecao.doc(docId)
    const existente = await ref.get()
    if (existente.exists) return { id: docId, jaExistia: true }

    await ref.set({ ...dados, conversaId, enviadaEm: Timestamp.now() })
    await atualizarUltimaMensagem(empresaId, conversaId, dados)
    return { id: docId, jaExistia: false }
  }

  const ref = await colecao.add({ ...dados, conversaId, enviadaEm: Timestamp.now() })
  await atualizarUltimaMensagem(empresaId, conversaId, dados)
  return { id: ref.id, jaExistia: false }
}

async function atualizarUltimaMensagem(
  empresaId: string,
  conversaId: string,
  dados: Pick<MensagemParaSalvar, 'texto' | 'direcao'>
): Promise<void> {
  const conversaRef = db.doc(`empresas/${empresaId}/conversas/${conversaId}`)
  const update: Record<string, unknown> = {
    ultimaMensagem: dados.texto,
    ultimaMensagemEm: Timestamp.now(),
    atualizadoEm: Timestamp.now(),
  }
  if (dados.direcao === 'entrada') {
    const atual = (await conversaRef.get()).data()?.mensagensNaoLidas as number | undefined
    update.mensagensNaoLidas = (atual ?? 0) + 1
  }
  await conversaRef.update(update)
}

export async function buscarHistoricoMensagens(
  empresaId: string,
  conversaId: string
): Promise<{ texto: string; direcao: 'entrada' | 'saida' }[]> {
  const snap = await db
    .collection(`empresas/${empresaId}/conversas/${conversaId}/mensagens`)
    .orderBy('enviadaEm')
    .get()

  return snap.docs.map((d) => ({
    texto: d.data().texto as string,
    direcao: d.data().direcao as 'entrada' | 'saida',
  }))
}

export async function buscarConfiguracaoIA(
  empresaId: string
): Promise<Record<string, unknown> | null> {
  const snap = await db.doc(`empresas/${empresaId}/configuracoes/principal`).get()
  if (!snap.exists) return null
  return (snap.data()?.ia as Record<string, unknown>) ?? null
}

export async function buscarConversa(
  empresaId: string,
  conversaId: string
): Promise<{ atendenteId?: string; origem?: string } | null> {
  const snap = await db.doc(`empresas/${empresaId}/conversas/${conversaId}`).get()
  if (!snap.exists) return null
  const data = snap.data()!
  return { atendenteId: data.atendenteId, origem: data.origem }
}
