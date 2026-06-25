export default function Modal({ isOpen, onClose, onConfirm, title, message, tipo = 'perigo' }) {
  // Se o modal não estiver aberto, não renderiza absolutamente nada na tela
  if (!isOpen) return null;

  // Define a cor do botão de confirmação com base no tipo do aviso
  const corBotaoConfirmar = tipo === 'perigo'
    ? 'bg-rose-500 hover:bg-rose-600 text-white'
    : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      
      {/* CARD DO MODAL */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        
        {/* TÍTULO E ÍCONE */}
        <div className="flex items-center space-x-3">
          {tipo === 'perigo' ? (
            <span className="text-xl bg-rose-500/10 text-rose-400 p-2 rounded-lg">⚠️</span>
          ) : (
            <span className="text-xl bg-emerald-500/10 text-emerald-400 p-2 rounded-lg">👍</span>
          )}
          <h3 className="text-lg font-bold text-slate-100">{title}</h3>
        </div>
        
        {/* MENSAGEM */}
        <p className="text-sm text-slate-400 leading-relaxed">
          {message}
        </p>

        {/* BOTÕES DE AÇÃO */}
        <div className="flex justify-end space-x-3 pt-2 border-t border-slate-800/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(); // Executa a função (ex: deletar conta)
              onClose();   // Fecha o modal
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${corBotaoConfirmar}`}
          >
            Confirmar
          </button>
        </div>

      </div>
    </div>
  );
}