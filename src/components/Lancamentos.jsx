import ChatAlvo from './ChatAlvo';
import { supabase } from '../supabaseClient';
import { useState, useEffect, useCallback } from 'react';
import Dashboard from './Dashboard';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Lancamentos({ session }) {
  const hoje = new Date();
  
  //  ESTADOS PARA O FILTRO DE MÊS E ANO (COMPETÊNCIA)
  const [mesSelecionado, setMesSelecionado] = useState(String(hoje.getMonth() + 1).padStart(2, '0'));
  const [anoSelecionado, setAnoSelecionado] = useState(String(hoje.getFullYear()));

  const [transacoes, setTransacoes] = useState([]);
  const [editandoId, setEditandoId] = useState(null); // Estado para controlar a edição

  const [form, setForm] = useState({
    data: hoje.toISOString().split('T')[0],
    descricao: '',
    valor: '',
    categoria: 'Alimentação',
    tipo: 'Gasto',
    formaPagamento: 'Cartão de Crédito'
  });

  //  BUSCA FILTRADA NO SUPABASE POR MÊS/ANO
  const buscarTransacoes = useCallback(async () => {
    if (!session?.user?.id) return;

    // Calcula o intervalo perfeito de dias do mês selecionado
    const primeiroDia = `${anoSelecionado}-${mesSelecionado}-01`;
    const ultimoDiaNum = new Date(parseInt(anoSelecionado), parseInt(mesSelecionado), 0).getDate();
    const ultimoDia = `${anoSelecionado}-${mesSelecionado}-${String(ultimoDiaNum).padStart(2, '0')}`;

    const { data, error } = await supabase
      .from('transacoes')
      .select('*')
      .eq('user_id', session.user.id)
      .gte('data', primeiroDia)
      .lte('data', ultimoDia)
      .order('data', { ascending: false });

    if (error) {
      console.error('Erro ao buscar transações:', error.message);
    } else {
      const dadosFormatados = data.map(t => ({
        id: t.id,
        data: t.data,
        descricao: t.descricao,
        valor: t.valor,
        categoria: t.categoria,
        tipo: t.tipo,
        formaPagamento: t.forma_pack || t.forma_pagamento
      }));
      setTransacoes(dadosFormatados);
    }
  }, [session, mesSelecionado, anoSelecionado, setTransacoes]);

  // RECARREGA USANDO MICROTASK PARA EVITAR CASCADING RENDERS NO COMPILER
  useEffect(() => {
    Promise.resolve().then(() => {
      buscarTransacoes();
    });
  }, [buscarTransacoes]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // FUNÇÕES DE CONTROLE DE EDIÇÃO
  const handleIniciarEdicao = (t) => {
    setEditandoId(t.id);
    setForm({
      data: t.data,
      descricao: t.descricao,
      valor: t.valor.toString(),
      categoria: t.categoria,
      tipo: t.tipo,
      formaPagamento: t.formaPagamento
    });
  };

  const handleCancelarEdicao = () => {
    setEditandoId(null);
    setForm({
      data: new Date().toISOString().split('T')[0],
      descricao: '',
      valor: '',
      categoria: 'Alimentação',
      tipo: 'Gasto',
      formaPagamento: 'Cartão de Crédito'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.descricao || !form.valor) return alert('Por favor, preencha os dados!');

    const dadosLinha = {
      user_id: session.user.id,
      data: form.data,
      descricao: form.descricao,
      valor: parseFloat(form.valor),
      categoria: form.categoria,
      tipo: form.tipo,
      forma_pagamento: form.formaPagamento
    };

    if (editandoId) {
      const { data, error } = await supabase
        .from('transacoes')
        .update(dadosLinha)
        .eq('id', editandoId)
        .select();

      if (error) {
        console.error('Erro ao atualizar:', error.message);
        alert('Erro ao atualizar o lançamento!');
      } else {
        if (data && data.length > 0) {
          const transacaoAtualizada = {
            id: data[0].id,
            data: data[0].data,
            descricao: data[0].descricao,
            valor: data[0].valor,
            categoria: data[0].categoria,
            tipo: data[0].tipo,
            formaPagamento: data[0].forma_pagamento
          };
          
          const [anoLado, mesLado] = data[0].data.split('-');
          if (anoLado === anoSelecionado && mesLado === mesSelecionado) {
            setTransacoes(transacoes.map(t => t.id === editandoId ? transacaoAtualizada : t));
          } else {
            setTransacoes(transacoes.filter(t => t.id !== editandoId));
          }
        } else {
          buscarTransacoes();
        }
        
        handleCancelarEdicao();
        alert('Lançamento atualizado com sucesso!');
      }

    } else {
      const { data, error } = await supabase
        .from('transacoes')
        .insert([dadosLinha])
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
          
          const [anoLado, mesLado] = data[0].data.split('-');
          if (anoLado === anoSelecionado && mesLado === mesSelecionado) {
            setTransacoes([transacaoCriada, ...transacoes]);
          }
        } else {
          buscarTransacoes();
        }

        setForm({
          data: new Date().toISOString().split('T')[0],
          descricao: '',
          valor: '',
          categoria: 'Alimentação',
          tipo: 'Gasto',
          formaPagamento: 'Cartão de Crédito'
        });
      }
    }
  };

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
        if (editandoId === id) setEditandoId(null);
        setTransacoes(transacoes.filter(t => t.id !== id));
      }
    }
  };

  const formatarMoeda = (valor) => {
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const exportarParaPDF = () => {
    if (transacoes.length === 0) {
      return alert('Não há lançamentos neste período para exportar!');
    }

    try {
      const doc = new jsPDF();

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(16, 185, 129);
      doc.text('Alvocapital', 14, 20);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Relatório de Controle Financeiro — Período: ${mesSelecionado}/${anoSelecionado}`, 14, 26);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 31);

      const totalReceitas = transacoes.filter(t => t.tipo === 'Receita').reduce((acc, curr) => acc + curr.valor, 0);
      const totalGastos = transacoes.filter(t => t.tipo === 'Gasto').reduce((acc, curr) => acc + curr.valor, 0);
      const saldoTotal = totalReceitas - totalGastos;

      doc.setFillColor(241, 245, 249); 
      doc.rect(14, 38, 182, 24, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      
      doc.text(`Total Receitas: R$ ${formatarMoeda(totalReceitas)}`, 18, 44);
      doc.text(`Total Gastos: R$ ${formatarMoeda(totalGastos)}`, 18, 50);
      
      if (saldoTotal >= 0) doc.setTextColor(16, 185, 129); else doc.setTextColor(244, 63, 94);
      doc.text(`Saldo Líquido: R$ ${formatarMoeda(saldoTotal)}`, 18, 56);

      const colunasTabela = ['Data', 'Descrição', 'Categoria', 'Forma Pagamento', 'Tipo', 'Valor'];
      const linhasTabela = transacoes.map(t => [
        t.data ? t.data.split('-').reverse().join('/') : 'N/A',
        t.descricao || '',
        t.categoria || '',
        t.formaPagamento || '',
        t.tipo || '',
        `${t.tipo === 'Receita' ? '+' : '-'} R$ ${formatarMoeda(t.valor || 0)}`
      ]);

      autoTable(doc, {
        head: [colunasTabela],
        body: linhasTabela,
        startY: 68,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], fontStyle: 'bold' },
        styles: { font: 'helvetica', fontSize: 9 },
        columnStyles: {
          5: { halign: 'right', fontStyle: 'bold' }
        }
      });

      doc.save(`relatorio_alvocapital_${mesSelecionado}_${anoSelecionado}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert(`Erro ao gerar o PDF: ${error.message}`);
    }
  };

  const exportarParaJSON = useCallback(() => {
    if (transacoes.length === 0) {
      alert('Não há dados de lançamentos para criar um backup!');
      return;
    }
    try {
      const dataStr = JSON.stringify(transacoes, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `alvocapital_backup_${mesSelecionado}_${anoSelecionado}.json`;
      link.click();
      URL.revokeObjectURL(url);

      alert('Backup do período gerado com sucesso!');
    } catch (error) {
      console.error("Erro ao exportar backup:", error);
    }
  }, [transacoes, mesSelecionado, anoSelecionado]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* CABEÇALHO COM LOGO CORRIGIDA */}
        <header className="flex justify-between items-center border-b border-slate-800 pb-1 pt-0">
          <img 
            src="/publicpwa-512x512.png" 
            alt="Alvocapital" 
            className="w-48 h-48 object-contain opacity-50 drop-shadow-[0_0_8px_rgba(52,211,153,0.2)] -my-16 -ml-4" 
          />
          <div className="text-right py-2">
            <h1 className="text-2xl font-bold tracking-tight text-emerald-400 leading-tight">Alvocapital</h1>
            <p className="text-xs text-slate-500 leading-none mt-1">Controle Financeiro Pessoal</p>
          </div>
        </header>

        {/* BARRA DE FILTRO DE COMPETÊNCIA (MÊS/ANO) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Período de Visualização</h3>
            <p className="text-xs text-slate-400">Dados filtrados do banco em tempo real</p>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={mesSelecionado}
              onChange={(e) => setMesSelecionado(e.target.value)}
              className="bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-200 text-sm font-medium rounded-xl p-2.5 outline-none cursor-pointer transition-all flex-1 sm:flex-none"
            >
              <option value="01">Janeiro</option>
              <option value="02">Fevereiro</option>
              <option value="03">Março</option>
              <option value="04">Abril</option>
              <option value="05">Maio</option>
              <option value="06">Junho</option>
              <option value="07">Julho</option>
              <option value="08">Agosto</option>
              <option value="09">Setembro</option>
              <option value="10">Outubro</option>
              <option value="11">Novembro</option>
              <option value="12">Dezembro</option>
            </select>

            <select
              value={anoSelecionado}
              onChange={(e) => setAnoSelecionado(e.target.value)}
              className="bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-200 text-sm font-medium rounded-xl p-2.5 outline-none cursor-pointer transition-all"
            >
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>
        </div>

        {/* PAINEL DE CARDS E GRÁFICOS */}
        <Dashboard transacoes={transacoes} />

        {/* GRID DO FORMULÁRIO E DA TABELA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* FORMULÁRIO DINÂMICO (NOVO / EDITAR) */}
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <h2 className="text-lg font-semibold text-slate-200 mb-2 border-b border-slate-800 pb-2">
              {editandoId ? 'Editar Lançamento' : 'Novo Lançamento'}
            </h2>
            
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
                  placeholder="1500.00"
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

            <div className="space-y-2 pt-2">
              <button
                type="submit"
                className={`w-full font-semibold py-3 rounded-lg transition-all cursor-pointer text-sm ${editandoId ? 'bg-amber-500 hover:bg-amber-600 text-slate-950' : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'}`}
              >
                {editandoId ? 'Salvar Alterações' : 'Confirmar Lançamento'}
              </button>

              {editandoId && (
                <button
                  type="button"
                  onClick={handleCancelarEdicao}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2 rounded-lg transition-all cursor-pointer text-xs border border-slate-700"
                >
                  Cancelar Edição
                </button>
              )}
            </div>
          </form>

          {/* TABELA HISTÓRICO */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-slate-200">Fluxo do Período</h2>
                <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-full text-slate-400 font-medium">
                  {transacoes.length} no mês
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={exportarParaPDF}
                  className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <span>⥥</span> Exportar Mês
                </button>

                <button
                  type="button"
                  onClick={exportarParaJSON}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-3 py-1.5 rounded-lg transition-all border border-slate-700/80 cursor-pointer flex items-center gap-1.5"
                  title="Salvar backup em formato JSON"
                >
                  <span>⥣</span> Cópia JSON
                </button>
              </div>
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
                    <tr key={t.id} className={`transition-colors ${editandoId === t.id ? 'bg-amber-500/10 hover:bg-amber-500/15' : 'hover:bg-slate-800/30'}`}>
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
                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleIniciarEdicao(t)}
                            className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer text-xs font-medium"
                          >
                            Editar
                          </button>
                          <span className="text-slate-700">|</span>
                          <button
                            type="button"
                            onClick={() => handleExcluir(t.id)}
                            className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer text-xs"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {transacoes.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-500 text-sm">
                        Nenhum lançamento encontrado para o período selecionado.
                      </td>
                    </tr>
                  )}
                </tbody>
            </table>
          </div>
        </div>

        </div>
      </div>

      {/* SEU COMPONENTE DE CHAT FLUTUANTE DA IA */}
      <ChatAlvo transacoes={transacoes} mesSelecionado={mesSelecionado} />
    </div>
  );
}