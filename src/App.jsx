import { useState, useEffect } from 'react';

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'Gasto', 
    category: 'Alimentação',
    paymentMethod: 'Cartão de Crédito'
  });

const API_URL = "https://meu-app-finace-backend.onrender.com/transactions";

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch(API_URL);
        const data = await response.json();
        if (Array.isArray(data)) {
          setTransactions(data);
        }
      } catch (error) {
        console.error("Erro ao buscar transações:", error);
      }
    };

    fetchTransactions();
  }, []);

  // 📊 CÁLCULO DOS CARDS SINCRONIZADO PERFEITAMENTE
  const income = transactions
    .filter(t => {
      if (!t.type) return false;
      const typeStr = String(t.type).toLowerCase().trim();
      return typeStr === 'receita' || typeStr === 'income' || typeStr === 'entrada';
    })
    .reduce((acc, t) => acc + (typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0), 0);

  const expense = transactions
    .filter(t => {
      if (!t.type) return false;
      const typeStr = String(t.type).toLowerCase().trim();
      return typeStr === 'gasto' || typeStr === 'expense' || typeStr === 'saída' || typeStr === 'saida';
    })
    .reduce((acc, t) => acc + (typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0), 0);

  const balance = income - expense;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.description || !formData.amount) {
      alert("Por favor, preencha a descrição e o valor!");
      return;
    }

    try {
      // 🛡️ TRATAMENTO: Limpa a string digitada e gera o float puro para enviar
      const cleanAmount = (() => {
        let valueStr = String(formData.amount).trim();

        if (valueStr.includes(',')) {
          const cleanValue = valueStr
            .replace(/\./g, '') // Remove o ponto de milhar
            .replace(',', '.'); // Troca a vírgula pelo ponto decimal
          return parseFloat(cleanValue) || 0;
        }

        return parseFloat(valueStr) || 0;
      })();

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: cleanAmount 
        })
      });

      if (response.ok) {
        const result = await response.json();
        const newRecord = result.data || result;
        
        // Adiciona no topo do estado local
        setTransactions(prev => [newRecord, ...prev]);

        setFormData({
          description: '',
          amount: '',
          type: 'Gasto',
          category: 'Alimentação',
          paymentMethod: 'Cartão de Crédito'
        });
      } else {
        const errorData = await response.json();
        alert(`Erro: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja remover este item?")) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTransactions(prev => prev.filter(t => String(t.id) !== String(id)));
      } else {
        const errorData = await response.json();
        alert(`Erro: ${errorData.error || "Erro ao deletar o item."}`);
      }
    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-emerald-500 selection:text-slate-900">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-900 pb-4 gap-2">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-wide text-slate-100">
              SISTEMA DE CONTROLE FINANCEIRO
            </h1>
            <p className="text-xs text-slate-400 font-medium">Gestão de ativos e fluxo de caixa corporativo</p>
          </div>
          <span className="text-xs font-mono px-2.5 py-0.5 bg-slate-900 border border-slate-800 text-emerald-400 rounded">
            ● Conectada
          </span>
        </header>

        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 p-5 rounded-lg border border-slate-800 shadow-sm">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Total de Entradas</p>
            <p className="text-xl md:text-2xl font-bold text-emerald-400 font-mono">
              R$ {income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-slate-900 p-5 rounded-lg border border-slate-800 shadow-sm">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Total de Saídas</p>
            <p className="text-xl md:text-2xl font-bold text-rose-400 font-mono">
              R$ {expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className={`p-5 rounded-lg border shadow-sm transition-colors ${
            balance >= 0 ? 'bg-slate-900 border-slate-800' : 'bg-rose-950/20 border-rose-900/40'
          }`}>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Saldo Atual</p>
            <p className={`text-xl md:text-2xl font-bold font-mono ${balance >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
              R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* CORPO PRINCIPAL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* FORMULÁRIO */}
          <div className="bg-slate-900 p-5 rounded-lg border border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-200 uppercase tracking-wide">Novo Lançamento</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Descrição do Ativo / Despesa</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Ex: Super Mercado / Ifood..."
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Valor (R$)</label>
                  <input
                    type="text"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="1.300,50 ou 1300"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Fluxo</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-2 text-slate-100 focus:outline-none focus:border-slate-600"
                  >
                    <option value="Gasto">Saída</option>
                    <option value="Receita">Entrada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Categoria</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-slate-600"
                >
                  <option value="Investimentos">Investimentos (Bolsa)</option>
                  <option value="Alimentação">Alimentação</option>
                  <option value="Lazer">Lazer / Viagem</option>
                  <option value="Transporte">Transporte / Uber</option>
                  <option value="Moradia">Moradia / Contas</option>
                  <option value="Salário">Salário / Receitas</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Método de Liquidação</label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-slate-600"
                >
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Pix">Pix</option>
                  <option value="Dinheiro">Dinheiro em Espécie</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-100 hover:bg-white text-slate-950 font-bold py-2.5 rounded transition-all active:scale-[0.99] uppercase tracking-wider text-xs"
              >
                Confirmar Registro
              </button>
            </form>
          </div>

          {/* TABELA DE EXTRATO */}
          <div className="md:col-span-2 bg-slate-900 rounded-lg border border-slate-800 shadow-sm p-5 space-y-4 overflow-hidden">
            <h2 className="text-base font-bold text-slate-200 uppercase tracking-wide">Extrato de Ativos e Fluxo</h2>
            
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse min-w-[550px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-medium uppercase tracking-wider">
                    <th className="pb-3">Descrição</th>
                    <th className="pb-3">Categoria</th>
                    <th className="pb-3">Liquidação</th>
                    <th className="pb-3 text-right">Valor</th>
                    <th className="pb-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-300">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-600 italic">
                        Nenhum registro encontrado no banco de dados.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((t) => {
                      const isIncome = t.type && (t.type.toLowerCase().trim() === 'receita' || t.type.toLowerCase().trim() === 'income' || t.type.toLowerCase().trim() === 'entrada');
                      
                      return (
                        <tr key={t.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="py-3 font-medium text-slate-200">{t.description}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 text-[11px] font-medium rounded border border-slate-800 bg-slate-950 text-slate-400">
                              {t.category}
                            </span>
                          </td>
                          <td className="py-3 text-slate-400">{t.paymentMethod}</td>
                          <td className={`py-3 text-right font-semibold font-mono ${
                            isIncome ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {isIncome ? '+' : '-'} R$ {window.isNaN(Number(t.amount)) ? t.amount : Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => handleDelete(t.id)}
                              className="text-rose-500 hover:text-rose-400 p-1 rounded hover:bg-rose-950/20 transition-colors font-medium text-xs border border-transparent hover:border-rose-900/30 px-2"
                              title="Remover lançamento"
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}