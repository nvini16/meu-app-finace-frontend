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

 const handleDeleteAccount = async () => {
    const confirmar = window.confirm(
      "ATENÇÃO: Tem certeza que deseja deletar sua conta?\n\nTodos os seus lançamentos financeiros serão apagados permanentemente e esta ação não poderá ser desfeita."
    );

    if (!confirmar) return;

    try {
      // 1. Deleta o usuário lá no banco de dados do Supabase
      const { error } = await supabase.rpc('deletar_propria_conta');
      if (error) throw error;

      // 2. O AJUSTE: Força a limpeza do token local no navegador
      await supabase.auth.signOut();

      alert("Sua conta e todos os seus dados foram apagados com sucesso.");
      
    } catch (error) {
      alert(`Erro ao deletar conta: ${error.message}`);
    }
  };

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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header atualizado com os dois botões */}
      <header className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center border-b border-slate-900">
        <h1 className="text-xl font-bold text-emerald-400">Alvocapital</h1>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            Sair da Conta
          </button>
          
          <button
            onClick={handleDeleteAccount}
            className="text-xs bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/50 text-rose-400 hover:text-rose-200 px-3 py-1.5 rounded-lg transition-colors font-medium"
          >
            Deletar Conta
          </button>
        </div>
      </header>

      <main className="py-6">
        <Lancamentos session={session} />
      </main>
    </div>
  );
}