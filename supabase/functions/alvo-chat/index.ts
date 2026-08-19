import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apiKey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { historico, transacoes } = await req.json()
    
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!GROQ_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Variáveis de ambiente do sistema não configuradas corretamente.')
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // IDENTIFICAR O USUÁRIO LOGADO
    const authHeader = req.headers.get('Authorization')
    let userId = null
    let nomeUsuario = ""

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const { data: { user } } = await supabase.auth.getUser(token)
      if (user) {
        userId = user.id
        const meta = user.user_metadata
        const nomeCompleto = meta?.full_name || meta?.name || meta?.first_name || ""
        if (nomeCompleto) {
          nomeUsuario = nomeCompleto.split(' ')[0]
        }
      }
    }

    // 1. BUSCAR MEMÓRIAS DE LONGO PRAZO
    let memoriasFormatadas = 'Nenhum fato memorizado ainda. Este é o início da sua relação com o usuário.'
    if (userId) {
      const { data: dadosMemorias } = await supabase
        .from('alvo_memorias')
        .select('conteudo')
        .eq('user_id', userId)
        .order('criado_em', { ascending: true })

      const listaMemorias = dadosMemorias?.map(m => m.conteudo) || []
      if (listaMemorias.length > 0) {
        memoriasFormatadas = listaMemorias.map(m => `- ${m}`).join('\n')
      }
    }

    const formaDeTratamento = nomeUsuario ? `${nomeUsuario}` : "meu rei"

    // 2. ESTRUTURAR O DIÁLOGO RECENTE PASSO A PASSO
    // Formata o histórico em um formato de roteiro legível para a IA entender a linha do tempo
    const arrayHistorico = Array.isArray(historico) ? historico : []
    const dialogoFormatado = arrayHistorico.map((msg: any) => {
      const dono = (msg.role === 'assistant' || msg.sender === 'alvo' || msg.role === 'alvo') ? 'Alvo' : 'Usuário';
      const conteudo = msg.content || msg.text || msg.texto || '';
      return `${dono}: ${conteudo}`;
    }).join('\n');

    // Captura a última frase real que o usuário digitou
    const historicoInvertido = [...arrayHistorico].reverse();
    const ultimaMensagemUser = historicoInvertido.find((m: any) => m.role === 'user' || m.sender === 'user' || !m.role);
    const textoUltimaMensagem = ultimaMensagemUser?.content || ultimaMensagemUser?.text || ultimaMensagemUser?.texto || "Olá";

    // 3. PROMPT DE CONTEXTO AJUSTADO PARA CONTINUIDADE
    const contextoSistema = `Você é o "Alvo", consultor financeiro baiano carismático, focado e direto.

CRUCIAL - FLUXO DA CONVERSA:
- Você está em um bate-papo contínuu. NÃO reinicie a conversa a cada mensagem.
- NÃO repita saudações iniciais (como "Bom dia, cara", "Vamos dar uma olhada") se você já estiver conversando.
- Responda diretamente e exclusivamente à última mensagem enviada pelo usuário, dando sequência natural ao assunto como um amigo faria no WhatsApp.
- Trate o usuário pelo nome: ${formaDeTratamento}. Fale sempre no singular.

Memória de longo prazo (fatos sobre o usuário):
${memoriasFormatadas}

Dados financeiros atuais (use apenas se o usuário perguntar sobre saldos, gastos ou metas):
${JSON.stringify(transacoes, null, 2)}

Regras de Formatação ("resposta"):
- TEXTO PURO: Proibido o uso de markdown ou asteriscos (**). Use quebras de linha comuns.
- Sotaque baiano dosado com inteligência (máximo 1 ou 2 gírias).

Sua resposta deve ser obrigatoriamente um objeto JSON contendo exatamente duas chaves:
1. "resposta": O texto fluido e natural que responde à interação atual.
2. "novas_memorias": Uma array de strings com fatos inéditos extraídos se o usuário revelou algo marcante sobre a vida dele (caso contrário, retorne []).`

    // O prompt final amarra o histórico e foca na última ação
    const promptFinal = `${contextoSistema}

Histórico recente da conversa:
${dialogoFormatado}

Mensagem atual do Usuário para você responder agora: "${textoUltimaMensagem}"

Resposta:`

    const responseGroq = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        response_format: { "type": "json_object" },
        messages: [
          {
            role: "user",
            content: promptFinal
          }
        ],
        temperature: 0.4
      })
    });

    const dataGroq = await responseGroq.json()
    
    if (!responseGroq.ok) {
      throw new Error(`Groq Error: ${JSON.stringify(dataGroq)}`)
    }

    const payloadIA = JSON.parse(dataGroq.choices[0].message.content)
    const textoParaOUser = payloadIA.resposta
    const fatosParaMemorizar = payloadIA.novas_memorias || []

    // 4. SALVAR AS NOVAS MEMÓRIAS
    if (fatosParaMemorizar.length > 0 && userId) {
      const inserts = fatosParaMemorizar.map((fato: string) => ({ 
        conteudo: fato,
        user_id: userId 
      }))
      await supabase.from('alvo_memorias').insert(inserts)
    }

    return new Response(
      JSON.stringify({ resposta: textoParaOUser }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("CRASH NA EDGE FUNCTION:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})