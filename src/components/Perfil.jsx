// src/components/Perfil.jsx
import { useState } from 'react';
import { supabase } from '../supabaseClient';
import Modal from './Modal'; // Reutilizando o seu modal personalizado

export default function Perfil({ session }) {
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Função para fazer logout de forma segura
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Erro ao sair:', error.message);
  };

  // Função disparada quando o usuário confirma a exclusão no Modal
  const executarExclusaoConta = async () => {
    setLoading(true);
    try {
      // Executa a função CASCADE que configuramos no banco
      const { error } = await supabase.rpc('deletar_propria_conta');
      if (error) throw error;

      // Desloga o usuário imediatamente após deletar
      await supabase.auth.signOut();
      
    } catch (error) {
      console.error("Erro ao deletar conta:", error.message);
      alert("Não foi possível excluir a conta: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      
      {/* CABEÇALHO DA TELA */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Configurações</h1>
        <p className="text-sm text-slate-400">Gerencie suas informações e preferências de conta.</p>
      </div>

      {/* SEÇÃO 1: PERFIL DO USUÁRIO */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <h2 className="text-lg font-semibold text-emerald-400 border-b border-slate-800/60 pb-2">
          Meu Perfil
        </h2>
        
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            E-mail Vinculado
          </label>
          <div className="text-slate-200 bg-slate-950 border border-slate-800/80 rounded-lg px-4 py-3 font-medium">
            {session?.user?.email || 'usuario@email.com'}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            ID do Usuário
          </label>
          <div className="text-slate-400 bg-slate-950/50 border border-slate-800/40 rounded-lg px-4 py-2 font-mono text-xs select-all">
            {session?.user?.id || '00000000-0000-0000-0000-000000000000'}
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: AÇÕES DA CONTA (SAIR / EXCLUIR) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
        <div>
          <h2 className="text-lg font-semibold text-slate-100 mb-1">Ações de Conta</h2>
          <p className="text-xs text-slate-400">Gerencie o acesso ou encerre seus serviços.</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
          <div>
            <h3 className="text-sm font-medium text-slate-200">Desconectar do App</h3>
            <p className="text-xs text-slate-400">Encerra sua sessão atual com segurança.</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors cursor-pointer text-center"
          >
            Sair da Conta
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-rose-950/10 border border-rose-950/30 rounded-xl">
          <div>
            <h3 className="text-sm font-medium text-rose-400">Zona de Perigo</h3>
            <p className="text-xs text-slate-400">Apaga permanentemente seu perfil e dados financeiros.</p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => setIsModalOpen(true)} // Abre nosso modal lindo
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 text-center"
          >
            {loading ? 'Processando...' : 'Excluir Conta'}
          </button>
        </div>
      </div>

      {/* NOSSO MODAL PERSONALIZADO INSTANCIADO COM SUCESSO AQUI */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={executarExclusaoConta}
        title="Deseja mesmo excluir sua conta?"
        message="Aviso: Esta ação é totalmente irreversível. Por conta da nossa regra de integridade do banco de dados, todos os seus registros e transações do Alvocapital serão deletados permanentemente e não poderão ser recuperados."
        tipo="perigo"
      />

    </div>
  );
}