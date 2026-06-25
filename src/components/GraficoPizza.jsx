import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function GraficoPizza({ transacoes, tipo }) {
  // 1. Filtra as transações pelo tipo específico
  const dadosFiltrados = transacoes.filter(t => t.tipo === tipo);

  // 2. Agrupa os valores por categoria
  const agrupado = dadosFiltrados.reduce((acumulador, t) => {
    const cat = t.categoria || 'Outros';
    acumulador[cat] = (acumulador[cat] || 0) + Number(t.valor);
    return acumulador;
  }, {});

  // 3. Formata para o padrão que o Recharts exige
  const dadosGrafico = Object.keys(agrupado).map(chave => ({
    name: chave,
    value: agrupado[chave]
  }));

  // 4. Paletas de cores inteligentes separadas por contexto visual
  const CORES_GASTO = ['#f43f5e', '#f97316', '#eab308', '#a855f7', '#64748b'];
  const CORES_RECEITA = ['#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#14b8a6'];
  const CORES = tipo === 'Gasto' ? CORES_GASTO : CORES_RECEITA;

  // Estado vazio amigável
  if (dadosGrafico.length === 0) {
    return (
      <div className="h-[260px] flex items-center justify-center text-slate-500 text-sm font-medium border border-dashed border-slate-800 rounded-xl">
        Nenhum registro de {tipo.toLowerCase()} para gerar o gráfico.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={dadosGrafico}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
          >
            {dadosGrafico.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
            itemStyle={{ color: '#f1f5f9' }}
            formatter={(value) => `R$ ${Number(value).toFixed(2)}`}
          />
          <Legend formatter={(value) => <span className="text-slate-300 text-sm ml-1">{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}