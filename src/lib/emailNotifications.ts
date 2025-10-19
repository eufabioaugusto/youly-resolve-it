import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'

interface NovoJobEmailData {
  montadorNome: string
  montadorEmail: string
  jobDescricao: string
  jobCategoria: string
  jobEndereco: string
  linkJob: string
}

interface NovaCandidaturaEmailData {
  clienteNome: string
  clienteEmail: string
  montadorNome: string
  jobDescricao: string
  montadorAvaliacao: number
  montadorProjetos: number
  linkCandidaturas: string
}

interface OrcamentoEnviadoEmailData {
  clienteNome: string
  clienteEmail: string
  montadorNome: string
  jobDescricao: string
  valorOrcamento: number
  linkNegociacao: string
}

interface PagamentoEmailData {
  userName: string
  userEmail: string
  userType: 'cliente' | 'montador'
  jobDescricao: string
  valorPagamento: number
  linkOrdemServico: string
}

interface PesquisaSatisfacaoEmailData {
  clienteNome: string
  clienteEmail: string
  montadorNome: string
  jobDescricao: string
  linkPesquisa: string
}

export async function sendNovoJobEmail(data: NovoJobEmailData) {
  try {
    logger.info('email', 'Enviando e-mail de novo job', { to: data.montadorEmail })
    
    const { error } = await supabase.functions.invoke('send-notification-email', {
      body: {
        type: 'novo_job',
        to: data.montadorEmail,
        data: {
          montadorNome: data.montadorNome,
          jobDescricao: data.jobDescricao,
          jobCategoria: data.jobCategoria,
          jobEndereco: data.jobEndereco,
          linkJob: data.linkJob,
        },
      },
    })

    if (error) throw error
    logger.info('email', 'E-mail de novo job enviado com sucesso')
  } catch (error: any) {
    logger.error('email', 'Erro ao enviar e-mail de novo job', error)
  }
}

export async function sendNovaCandidaturaEmail(data: NovaCandidaturaEmailData) {
  try {
    logger.info('email', 'Enviando e-mail de nova candidatura', { to: data.clienteEmail })
    
    const { error } = await supabase.functions.invoke('send-notification-email', {
      body: {
        type: 'nova_candidatura',
        to: data.clienteEmail,
        data: {
          clienteNome: data.clienteNome,
          montadorNome: data.montadorNome,
          jobDescricao: data.jobDescricao,
          montadorAvaliacao: data.montadorAvaliacao,
          montadorProjetos: data.montadorProjetos,
          linkCandidaturas: data.linkCandidaturas,
        },
      },
    })

    if (error) throw error
    logger.info('email', 'E-mail de nova candidatura enviado com sucesso')
  } catch (error: any) {
    logger.error('email', 'Erro ao enviar e-mail de nova candidatura', error)
  }
}

export async function sendOrcamentoEnviadoEmail(data: OrcamentoEnviadoEmailData) {
  try {
    logger.info('email', 'Enviando e-mail de orçamento enviado', { to: data.clienteEmail })
    
    const { error } = await supabase.functions.invoke('send-notification-email', {
      body: {
        type: 'orcamento_enviado',
        to: data.clienteEmail,
        data: {
          clienteNome: data.clienteNome,
          montadorNome: data.montadorNome,
          jobDescricao: data.jobDescricao,
          valorOrcamento: data.valorOrcamento,
          linkNegociacao: data.linkNegociacao,
        },
      },
    })

    if (error) throw error
    logger.info('email', 'E-mail de orçamento enviado com sucesso')
  } catch (error: any) {
    logger.error('email', 'Erro ao enviar e-mail de orçamento', error)
  }
}

export async function sendPagamentoEmail(data: PagamentoEmailData) {
  try {
    logger.info('email', 'Enviando e-mail de pagamento', { to: data.userEmail, type: data.userType })
    
    const { error } = await supabase.functions.invoke('send-notification-email', {
      body: {
        type: 'pagamento',
        to: data.userEmail,
        data: {
          userName: data.userName,
          userType: data.userType,
          jobDescricao: data.jobDescricao,
          valorPagamento: data.valorPagamento,
          linkOrdemServico: data.linkOrdemServico,
        },
      },
    })

    if (error) throw error
    logger.info('email', 'E-mail de pagamento enviado com sucesso')
  } catch (error: any) {
    logger.error('email', 'Erro ao enviar e-mail de pagamento', error)
  }
}

export async function sendPesquisaSatisfacaoEmail(data: PesquisaSatisfacaoEmailData) {
  try {
    logger.info('email', 'Enviando e-mail de pesquisa de satisfação', { to: data.clienteEmail })
    
    const { error } = await supabase.functions.invoke('send-notification-email', {
      body: {
        type: 'pesquisa_satisfacao',
        to: data.clienteEmail,
        data: {
          clienteNome: data.clienteNome,
          montadorNome: data.montadorNome,
          jobDescricao: data.jobDescricao,
          linkPesquisa: data.linkPesquisa,
        },
      },
    })

    if (error) throw error
    logger.info('email', 'E-mail de pesquisa de satisfação enviado com sucesso')
  } catch (error: any) {
    logger.error('email', 'Erro ao enviar e-mail de pesquisa de satisfação', error)
  }
}
