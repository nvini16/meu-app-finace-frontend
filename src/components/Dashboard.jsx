import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import GraficoPizza from './GraficoPizza';
import BarraMeta from './BarraMeta';

export default function Dashboard({ transacoes = [] }) { 
  const [metas, setMetas] = useState([]);
  
  // Estados para controlar o formulário de criação de metas
  const [mostrarForm, setMostrarForm] = useState(false);
  const [categoria, setCategoria] = useState('');
  const [limite, setLimite] = useState('');
  const [loadingForm, setLoadingForm] = useState(false);

  // ESTADO PARA O BADGE DE NOVIDADE (Corrigido: Já nasce com o valor certo do localStorage)
  const [exibirNovidade, setExibirNovidade] = useState(() => {
    if (typeof window !== 'undefined') {
      // Se NÃO existir o registro, retorna true (mostra a novidade). Se existir, retorna false.
      return !localStorage.getItem('alvocapital_novidade_metas');
    }
    return false;
  });

  // CÁLCULOS MATEMÁTICOS
  const totalReceitas = transacoes
    .filter(t => t.tipo === 'Receita')
    .reduce((acc, curr) => acc + (curr.valor || 0), 0);

  const totalGastos = transacoes
    .filter(t => t.tipo === 'Gasto')
    .reduce((acc, curr) => acc + (curr.valor || 0), 0);

  const saldoTotal = totalReceitas - totalGastos;

  const formatarMoeda = (valor) => {
    const n = Number(valor) || 0;
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // 1. BUSCA OS DADOS NO SUPABASE
  async function carregarMetasDoBanco() {
    const mesAtual = new Date().toISOString().slice(0, 7);
    const { data, error } = await supabase
      .from('metas_gastos')
      .select('*')
      .eq('mes_ano', mesAtual);

    if (error) throw error;
    return data || [];
  }

  useEffect(() => {
    // Carrega os dados normais do banco
    carregarMetasDoBanco()
      .then((dados) => {
        setMetas(dados);
      })
      .catch((error) => {
        console.error('Erro ao carregar metas:', error);
      });

    // Se for a primeira vez que o utilizador entra, grava já no localStorage para o próximo F5
    if (typeof window !== 'undefined' && !localStorage.getItem('alvocapital_novidade_metas')) {
      localStorage.setItem('alvocapital_novidade_metas', 'true');
    }
  }, []);

  // FUNÇÃO PARA REMOVER O AVISO ASSIM QUE HOUVER INTERAÇÃO
  const lidarComInteracao = () => {
    if (exibirNovidade) {
      setExibirNovidade(false);
    }
  };

  // 2. FUNÇÃO PARA ADICIONAR NOVA CATEGORIA/TETO NO BANCO
  async function handleSubmit(e) {
    e.preventDefault();
    if (!categoria || !limite) return;

    setLoadingForm(true);
    try {
      const mesAtual = new Date().toISOString().slice(0, 7);
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('metas_gastos')
        .insert([
          {
            categoria: categoria,
            limite: parseFloat(limite),
            mes_ano: mesAtual,
            user_id: user?.id
          }
        ])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setMetas((prev) => [...prev, data[0]]);
      }

      setCategoria('');
      setLimite('');
      setMostrarForm(false);
    } catch (error) {
      console.error('Erro ao criar meta:', error.message);
      alert('Erro ao salvar o teto de gastos.');
    } finally {
      setLoadingForm(false);
    }
  }

  // 3. FUNÇÃO PARA EXCLUIR UM TETO DO BANCO
  async function handleExcluirMeta(id) {
    if (!confirm('Deseja realmente apagar este teto de gasto?')) return;

    try {
      const { error } = await supabase
        .from('metas_gastos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMetas((prev) => prev.filter((meta) => meta.id !== id));
    } catch (error) {
      console.error('Erro ao apagar meta:', error.message);
      alert('Não foi possível excluir o teto de gastos.');
    }
  }

  return (
    <div className="space-y-6">
      {/* CARDS INDICADORES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs font-medium text-slate-400 block mb-1">Total Receitas</span>
          <span className="text-2xl font-bold text-emerald-400">R$ {formatarMoeda(totalReceitas)}</span>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs font-medium text-slate-400 block mb-1">Total Gastos</span>
          <span className="text-2xl font-bold text-rose-400">R$ {formatarMoeda(totalGastos)}</span>
        </div>
        <div className="bg-slate-900/50 border border-[#10b981]/20 p-4 rounded-xl shadow-lg">
          <span className="text-xs font-medium text-slate-400 block mb-1">Saldo Líquido</span>
          <span className={`text-2xl font-bold ${saldoTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            R$ {formatarMoeda(saldoTotal)}
          </span>
        </div>
      </div>

      {/* GRID DOS GRÁFICOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-rose-400 mb-4 border-b border-slate-800 pb-2">
            Gastos por Categoria
          </h2>
          <GraficoPizza transacoes={transacoes} tipo="Gasto" />
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-400 mb-4 border-b border-slate-800 pb-2">
            Receitas por Categoria
          </h2>
          <GraficoPizza transacoes={transacoes} tipo="Receita" />
        </div>
      </div>

      {/* SEÇÃO DE TETOS E LIMITES */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div 
          onClick={lidarComInteracao}
          className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2 select-none"
        >
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
              Limites de Gastos do Mês
            </h2>
            
            {/* BADGE DINÂMICO "NOVO!" */}
            {exibirNovidade && (
              <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-md animate-pulse decoration-none">
                NOVO!
              </span>
            )}
          </div>

          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            className="text-xs bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium"
          >
            {mostrarForm ? 'Fechar' : '+ Definir Teto'}
          </button>
        </div>

        {/* FORMULÁRIO */}
        {mostrarForm && (
          <form onSubmit={handleSubmit} className="space-y-3 mb-6 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Nome da Categoria</label>
              <input
                type="text"
                placeholder="Ex: Alimentação, Uber, Lazer..."
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                required
                className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Valor Limite (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={limite}
                onChange={(e) => setLimite(e.target.value)}
                required
                className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loadingForm}
              className="w-full text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold p-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {loadingForm ? 'Salvando...' : 'Salvar Teto'}
            </button>
          </form>
        )}
        
        {metas.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">Nenhum limite de gastos definido para este mês.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metas.map((meta) => {
              const gastoAtual = transacoes
                .filter(t => t.categoria === meta.categoria && t.tipo === 'Gasto')
                .reduce((acc, curr) => acc + (curr.valor || 0), 0);

              return (
                <div 
                  key={meta.id} 
                  className="group relative bg-slate-950/30 p-3 rounded-xl border border-slate-800/40 flex justify-between items-center gap-4 hover:border-slate-800 transition-all"
                >
                  <div className="flex-1">
                    <BarraMeta 
                      categoria={meta.categoria}
                      limite={meta.limite}
                      gasto={gastoAtual}
                    />
                  </div>

                  <button
                    onClick={() => handleExcluirMeta(meta.id)}
                    className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100 cursor-pointer text-sm shrink-0"
                    title="Excluir meta"
                  >
                    Excluir
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}