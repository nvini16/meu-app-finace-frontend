import { useState, useEffect, useRef } from 'react';

// FUNÇÃO EXTERNA: O React Compiler não valida pureza aqui dentro
const criarObjetoMensagem = (texto, remetente) => ({
  id: `${remetente}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  texto,
  remetente
});

export default function ChatAlvo({ transacoes, mesSelecionado }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [digitando, setDigitando] = useState(false);
  const [mensagens, setMensagens] = useState([
    {
      id: 1,
      texto: "Olá! Sou o Alvo, seu consultor financeiro. Vi que temos alguns lançamentos este mês. Como posso te ajudar a poupar ou analisar seus dados hoje?",
      remetente: 'ia'
    }
  ]);

  const chatEndRef = useRef(null);

  // Rolagem automática para a última mensagem
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, digitando]);

  // Perguntas de atalho dinâmicas baseadas no histórico do mês
  const chipsSugestoes = [
    `Resumo do mês ${mesSelecionado}`,
    "Onde posso economizar?",
    "Qual meu saldo atual?",
  ];

  const handleEnviarMensagem = async (textoMensagem) => {
    if (!textoMensagem.trim()) return;

    // 1. Cria a mensagem do usuário
    const novaMensagemUsuario = criarObjetoMensagem(textoMensagem, 'user');
    
    // Atualiza a tela para o usuário ver o que digitou
    setMensagens(prev => [...prev, novaMensagemUsuario]);
    setInput('');
    setDigitando(true);

    // CORREÇÃO 1: Cria o histórico atualizado na hora para a IA receber a pergunta atual
    const novoHistorico = [...mensagens, novaMensagemUsuario];

    try {
      // 2. Chamada real para a Edge Function do Supabase
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/alvo-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          historico: novoHistorico, // Enviando o histórico corrigido
          transacoes: transacoes
        })
      });

      if (!response.ok) throw new Error('Erro na resposta do Alvo');

      const data = await response.json();
      
      // 3. Adiciona a resposta real da IA na tela
      const respostaIA = criarObjetoMensagem(data.resposta, 'ia');
      setMensagens(prev => [...prev, respostaIA]);

    } catch (error) {
      console.error("Erro ao conversar com o Alvo:", error);
      
      const erroMensagem = criarObjetoMensagem(
        "Desculpe, tive um problema para conectar com meu servidor. Pode tentar de novo?", 
        "ia"
      );
      setMensagens(prev => [...prev, erroMensagem]);
    } finally {
      setDigitando(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans text-slate-200">
      
      {/* JANELA DO CHAT */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[360px] h-[500px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          
          {/* TOPO DO CHAT */}
          <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                {/* Container do Avatar adaptado para o personagem */}
                <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center overflow-hidden">
                  <img 
                    src="/Design_sem_nome-removebg-preview.png" 
                    alt="Alvo IA Avatar" 
                    className="w-full h-full object-contain p-0.28"
                  />
                </div>
                {/* Indicador Online */}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-950 rounded-full"></span>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-100 leading-tight">Alvo IA</h4>
                <p className="text-xs text-slate-400">Consultor Financeiro</p>
              </div>
            </div>
            
            {/* Botão de Fechar reposicionado corretamente dentro do Topo */}
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer text-sm"
            >
              ✕
            </button>
          </div>

          {/* CORPO DO CHAT (MENSAGENS) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-800">
            {mensagens.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.remetente === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-md leading-relaxed ${
                  msg.remetente === 'user' 
                    ? 'bg-emerald-500 text-slate-950 font-medium rounded-tr-none' 
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-line'
                }`}>
                  {msg.texto}
                </div>
              </div>
            ))}

            {/* EFEITO DIGITANDO... */}
            {digitando && (
              <div className="flex justify-start">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 shadow-md flex items-center gap-1">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* CHIPS DE SUGESTÃO */}
          <div className="px-3 pt-2 pb-1 bg-slate-900/50 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
            {chipsSugestoes.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleEnviarMensagem(chip)}
                className="text-xs bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-400 px-3 py-1.5 rounded-full transition-all cursor-pointer shadow-sm flex-shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* BARRA DE INPUT */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEnviarMensagem(input)}
              placeholder="Pergunte ao Alvo..."
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-500/50 text-slate-100 placeholder-slate-500 rounded-xl px-3.5 py-2 text-sm outline-none transition-all"
            />
            <button
              onClick={() => handleEnviarMensagem(input)}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 p-2.5 rounded-xl font-bold transition-all shadow-md cursor-pointer flex items-center justify-center w-9 h-9"
            >
              ⥤
            </button>
          </div>

        </div>
      )}

      {/* BOTÃO FLUTUANTE INFERIOR */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-2xl transition-all cursor-pointer transform hover:scale-105 active:scale-95 ${
          isOpen 
            ? 'bg-rose-500 text-white rotate-90' 
            : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/10'
        }`}
        title="Conversar com o Alvo"
      >
        {isOpen ? '✧' : '✦'}
      </button>

    </div>
  );
}