import GraficoPizza from './GraficoPizza';

export default function Dashboard({ transacoes }) {
  // Cálculos matemáticos limpos isolados no Dashboard
  const totalReceitas = transacoes
    .filter(t => t.tipo === 'Receita')
    .reduce((acc, curr) => acc + curr.valor, 0);

  const totalGastos = transacoes
    .filter(t => t.tipo === 'Gasto')
    .reduce((acc, curr) => acc + curr.valor, 0);

  const saldoTotal = totalReceitas - totalGastos;

  const formatarMoeda = (valor) => {
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

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

      {/* GRID DOS DOIS GRÁFICOS LADO A LADO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* GRÁFICO DE GASTOS */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-rose-400 mb-4 border-b border-slate-800 pb-2">
            Gastos por Categoria
          </h2>
          <GraficoPizza transacoes={transacoes} tipo="Gasto" />
        </div>

        {/* GRÁFICO DE RECEITAS */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-400 mb-4 border-b border-slate-800 pb-2">
            Receitas por Categoria
          </h2>
          <GraficoPizza transacoes={transacoes} tipo="Receita" />
        </div>
      </div>
    </div>
  );
}