import { supabase } from '../supabaseClient';
import { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function Lancamentos({ session }) {
  const [transacoes, setTransacoes] = useState([]);

  // Estado para os campos do formulário
  const [form, setForm] = useState({
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    valor: '',
    categoria: 'Alimentação',
    tipo: 'Gasto',
    formaPagamento: 'Cartão de Crédito'
  });

  // 1. FUNÇÃO MEMOIZADA COM USECALLBACK (Remove o aviso do useEffect de vez)
  const buscarTransacoes = useCallback(async () => {
    if (!session?.user?.id) return;

    const { data, error } = await supabase
      .from('transacoes')
      .select('*')
      .eq('user_id', session.user.id) // FILTRA POR USUÁRIO
      .order('data', { ascending: false });

    if (error) {
      console.error('Erro ao buscar usuário:', error.message);
    } else {
      const dadosFormatados = data.map(t => ({
        id: t.id,
        data: t.data,
        descricao: t.descricao,
        valor: t.valor,
        categoria: t.categoria,
        tipo: t.tipo,
        formaPagamento: t.forma_pagamento
      }));
      setTransacoes(dadosFormatados);
    }
  }, []);

  // 2. CARREGAR DADOS AO MONTAR A TELA
  useEffect(() => {
    const executarBusca = async () => {
      await buscarTransacoes();
    };

    executarBusca();
  }, [buscarTransacoes]);

  // 3. PREPARAR DADOS PARA O GRÁFICO (Filtra por 'Gasto')
  const prepararDadosGrafico = () => {
    const despesas = transacoes.filter(t => t.tipo === 'Gasto');

    const agrupado = despesas.reduce((acumulador, t) => {
      const cat = t.categoria || 'Outros';
      acumulador[cat] = (acumulador[cat] || 0) + Number(t.valor);
      return acumulador;
    }, {});

    return Object.keys(agrupado).map(chave => ({
      name: chave,
      value: agrupado[chave]
    }));
  };

  // Cores modernas que contrastam muito bem no fundo escuro
  const CORES = ['#f43f5e', '#3b82f6', '#eab308', '#a855f7', '#10b981', '#64748b'];

  // Captura as alterações dos inputs
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 4. ENVIO DO FORMULÁRIO
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.descricao || !form.valor) return alert('Por favor, preencha os dados!');

    const novaLinha = {
      user_id: session.user.id,
      data: form.data,
      descricao: form.descricao,
      valor: parseFloat(form.valor),
      categoria: form.categoria,
      tipo: form.tipo,
      forma_pagamento: form.formaPagamento
    };

    const { data, error } = await supabase
      .from('transacoes')
      .insert([novaLinha])
      .select();

    if (error) {
      console.error('Erro ao salvar:', error.message);
      alert('Erro ao salvar o lançamento!');
    } else {
      if (data && data.length > 0) {
        const transacaoCriada = {
          id: data[0].id,
          data: data[0].data,
          descricao: data[0].descricao,
          valor: data[0].valor,
          categoria: data[0].categoria,
          tipo: data[0].tipo,
          formaPagamento: data[0].forma_pagamento
        };
        setTransacoes([transacaoCriada, ...transacoes]);
      } else {
        buscarTransacoes();
      }

      // Limpa o formulário
      setForm({
        data: new Date().toISOString().split('T')[0],
        descricao: '',
        valor: '',
        categoria: 'Alimentação',
        tipo: 'Gasto',
        formaPagamento: 'Cartão de Crédito'
      });
    }
  };

  // 5. EXCLUIR REGISTRO
  const handleExcluir = async (id) => {
    if (confirm('Tem certeza que deseja apagar este lançamento?')) {
      const { error } = await supabase
        .from('transacoes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar:', error.message);
        alert('Não foi possível excluir o registro.');
      } else {
        setTransacoes(transacoes.filter(t => t.id !== id));
      }
    }
  };

  // Cálculos em tempo real
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
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* CABEÇALHO */}
        <header className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-emerald-400">Alvocapital</h1>
            <p className="text-xs text-slate-400">Controle Financeiro Pessoal</p>
          </div>
        </header>

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

        {/* GRÁFICO DE GASTOS POR CATEGORIA (Posicionado entre os Cards e o Fluxo) */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <h2 className="text-lg font-semibold text-slate-200 mb-4 border-b border-slate-800 pb-2">Gastos por Categoria</h2>
          
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={prepararDadosGrafico()} 
                  cx="50%"
                  cy="50%"
                  innerRadius={60} 
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {prepararDadosGrafico().map((entry, index) => (
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
        </div>

        {/* GRID DO FORMULÁRIO E DA TABELA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* FORMULÁRIO */}
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <h2 className="text-lg font-semibold text-slate-200 mb-2 border-b border-slate-800 pb-2">Novo Lançamento</h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-slate-400 font-medium block mb-1">Tipo de Lançamento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, tipo: 'Gasto' })}
                    className={`py-2 rounded-lg font-medium text-sm transition-all border cursor-pointer ${form.tipo === 'Gasto' ? 'bg-rose-500/10 border-rose-500 text-rose-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                  >
                    Gasto
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, tipo: 'Receita' })}
                    className={`py-2 rounded-lg font-medium text-sm transition-all border cursor-pointer ${form.tipo === 'Receita' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                  >
                    Receita
                  </button>
                </div>
              </div>

              <div className="col-span-2">
                <label className="text-xs text-slate-400 font-medium block mb-1">Descrição</label>
                <input
                  type="text"
                  name="descricao"
                  value={form.descricao}
                  onChange={handleChange}
                  placeholder="Ex: Mercado / Salário..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg p-2.5 text-sm text-slate-100 outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Valor (R$)</label>
                <input
                  type="number"
                  name="valor"
                  step="0.01"
                  value={form.valor}
                  onChange={handleChange}
                  placeholder="1500.00 / Mil e quinhentos reais"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg p-2.5 text-sm text-slate-100 outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Data</label>
                <input
                  type="date"
                  name="data"
                  value={form.data}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg p-2.5 text-sm text-slate-100 outline-none transition-all [color-scheme:dark]"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs text-slate-400 font-medium block mb-1">Categoria</label>
                <select
                  name="categoria"
                  value={form.categoria}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg p-2.5 text-sm text-slate-100 outline-none transition-all"
                >
                  <option value="Aluguel">Aluguel</option>
                  <option value="Alimentação">Alimentação</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Lazer">Lazer</option>
                  <option value="Salário">Salário</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-xs text-slate-400 font-medium block mb-1">Forma de Pagamento</label>
                <select
                  name="formaPagamento"
                  value={form.formaPagamento}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg p-2.5 text-sm text-slate-100 outline-none transition-all"
                >
                  <option value="Pix">Pix</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Boleto">Boleto</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold py-3 rounded-lg transition-all cursor-pointer text-sm"
            >
              Confirmar Lançamento
            </button>
          </form>

          {/* TABELA HISTÓRICO */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-200">Histórico de Fluxo</h2>
              <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-full text-slate-400 font-medium">
                {transacoes.length} registros
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800">
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider">Data</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider">Descrição</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider">Categoria</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider">Pagamento</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-right">Valor</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {transacoes.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 text-slate-300 font-mono whitespace-nowrap">{t.data.split('-').reverse().join('/')}</td>
                      <td className="p-4 font-medium text-slate-100">{t.descricao}</td>
                      <td className="p-4">
                        <span className="bg-slate-800 border border-slate-700/50 text-slate-300 px-2 py-0.5 rounded text-xs font-medium">
                          {t.categoria}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 text-xs">{t.formaPagamento}</td>
                      <td className={`p-4 text-right font-semibold whitespace-nowrap ${t.tipo === 'Receita' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.tipo === 'Receita' ? '+' : '-'} R$ {formatarMoeda(t.valor)}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleExcluir(t.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer text-xs"
                          title="Excluir Lançamento"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                  {transacoes.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-500 text-sm">
                        Nenhum lançamento efetuado ainda.
                      </td>
                    </tr>
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