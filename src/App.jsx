import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Login from './components/Login';
import Lancamentos from './components/Lancamentos';
import Perfil from './components/Perfil'; // Importando a nova tela de Configurações

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lancamentos'); // Controla qual aba está ativa ('lancamentos' ou 'configuracoes')

  useEffect(() => {
    // 1. Pega a sessão atual assim que o app carrega
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Escuta mudanças no estado de autenticação (Login / Logout / Exclusão de Conta)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // Se o usuário deslogar ou deletar a conta, resetamos a visualização para a aba padrão
      if (!session) {
        setActiveTab('lancamentos');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400 font-medium">
        Carregando Seu Alvocapital...
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      
      {/* Header atualizado com o menu de Navegação por Abas */}
      <header className="max-w-7xl w-full mx-auto px-4 py-4 flex justify-between items-center border-b border-slate-900">
        <h1 className="text-xl font-bold text-emerald-400">Alvocapital</h1>
        
        {/* Sistema de abas no cabeçalho */}
        <nav className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('lancamentos')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'lancamentos'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800/80'
            }`}
          >
            Lançamentos
          </button>
          
          <button
            onClick={() => setActiveTab('configuracoes')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'configuracoes'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800/80'
            }`}
          >
            Configurações
          </button>
        </nav>
      </header>

      {/* Conteúdo principal renderizado dinamicamente de acordo com a aba ativa */}
      <main className="flex-1 py-6">
        {activeTab === 'lancamentos' ? (
          <Lancamentos session={session} />
        ) : (
          <Perfil session={session} />
        )}
      </main>

    </div>
  );
}