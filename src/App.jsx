import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Login from './components/Login';
import Lancamentos from './components/Lancamentos';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Pega a sessão atual assim que o app carrega
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Escuta mudanças no estado de autenticação (Login / Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400 font-medium">
        Carregando Alvocapital...
      </div>
    );
  }

  // Se não estiver logado, exibe a tela de Login
  if (!session) {
    return <Login />;
  }

  // Se estiver logado, exibe o app principal (Passando a sessão ou usuário se precisar)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Barra Superior / Header simples para Logout */}
      <header className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center border-b border-slate-900">
        <h1 className="text-xl font-bold text-emerald-400">Alvocapital</h1>
        <button
          onClick={handleLogout}
          className="text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 px-3 py-1.5 rounded-lg transition-colors"
        >
          Sair da Conta
        </button>
      </header>

      {/* Seu componente principal com o gráfico e tabela */}
      <main className="py-6">
        <Lancamentos session={session} />
      </main>
    </div>
  );
}