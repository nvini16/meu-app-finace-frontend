// Ajustado 'gasto: gastoAtual' para capturar o que vem do Dashboard sem quebrar o código interno
export default function BarraMeta({ categoria, gasto: gastoAtual = 0, limite = 0 }) {
  
  // Evita divisão por zero e calcula a porcentagem gasta (máximo 100% para não quebrar o layout)
  const percentagem = limite > 0 ? Math.min((gastoAtual / limite) * 100, 100) : 0;

  // Determina a cor da barra com base no nível do gasto
  let corBarra = "bg-emerald-500"; // Verde limpo (até 69%)
  if (percentagem >= 90) {
    corBarra = "bg-rose-500";      // Vermelho alerta (90% ou mais)
  } else if (percentagem >= 70) {
    corBarra = "bg-amber-500";     // Amarelo atenção (entre 70% e 89%)
  }

  return (
    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-slate-200">{categoria}</span>
        <span className="text-slate-400 text-xs">
          R$ {gastoAtual.toFixed(2)} / <span className="text-slate-300 font-semibold text-sm">R$ {limite.toFixed(2)}</span>
        </span>
      </div>

      {/* Fundo da barra de progresso */}
      <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
        {/* Barra preenchida dinamicamente */}
        <div 
          className={`h-full ${corBarra} transition-all duration-500 ease-out`}
          style={{ width: `${percentagem}%` }}
        />
      </div>
      
      {/* Mensagem de status */}
      <div className="flex justify-between items-center text-[11px]">
        <span className="text-slate-500">
          {percentagem.toFixed(0)}% do teto atingido
        </span>
        <span className={`font-medium ${percentagem >= 100 ? "text-rose-400 animate-pulse" : "text-slate-400"}`}>
          {percentagem >= 100 ? "Limite estourado!" : `R$ ${(limite - gastoAtual).toFixed(2)} restantes`}
        </span>
      </div>
    </div>
  );
}