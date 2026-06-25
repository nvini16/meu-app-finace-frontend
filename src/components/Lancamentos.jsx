import { supabase } from '../supabaseClient';
import { useState, useEffect, useCallback } from 'react';
import Dashboard from './Dashboard'; // Importa o novo painel completo

// IMPORTAÇÕES AJUSTADAS E SEGURAS PARA EVITAR CRASH NO VITE
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Lancamentos({ session }) {
  const [transacoes, setTransacoes] = useState([]);

  const [form, setForm] = useState({
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    valor: '',
    categoria: 'Alimentação',
    tipo: 'Gasto',
    formaPagamento: 'Cartão de Crédito'
  });

  const buscarTransacoes = useCallback(async () => {
    if (!session?.user?.id) return;

    const { data, error } = await supabase
      .from('transacoes')
      .select('*')
      .eq('user_id', session.user.id)
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
        formaPagamento: t.forma_pack || t.forma_pagamento
      }));
      setTransacoes(dadosFormatados);
    }
  }, [session]);

  // 2. CARREGAR DADOS AO MONTAR A TELA
  useEffect(() => {
    Promise.resolve().then(() => {
      buscarTransacoes();
    });
  }, [buscarTransacoes]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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

  const formatarMoeda = (valor) => {
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  //  FUNÇÃO DE EXPORTAÇÃO COMPLETA E PROTEGIDA CONTRA ERROS SILENCIOSOS
  const exportarParaPDF = () => {
    if (transacoes.length === 0) {
      return alert('Não há lançamentos para exportar!');
    }

    try {
      const doc = new jsPDF();

      // 1. Cabeçalho do PDF
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(16, 185, 129); // Emerald do Alvocapital
      doc.text('Alvocapital', 14, 20);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text('Relatório de Controle Financeiro Pessoal', 14, 26);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 31);

      // 2. Resumos Financeiros para o Topo do PDF
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

      // 3. Mapeamento dos Dados da Tabela com travas de segurança
      const colunasTabela = ['Data', 'Descrição', 'Categoria', 'Forma Pagamento', 'Tipo', 'Valor'];
      const linhasTabela = transacoes.map(t => [
        t.data ? t.data.split('-').reverse().join('/') : 'N/A',
        t.descricao || '',
        t.categoria || '',
        t.formaPagamento || '',
        t.tipo || '',
        `${t.tipo === 'Receita' ? '+' : '-'} R$ ${formatarMoeda(t.valor || 0)}`
      ]);

      // Chamada direta do autoTable (Evita o erro clássico 'doc.autoTable is not a function')
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

      // 4. Salvar arquivo
      const dataFormatada = new Date().toISOString().split('T')[0];
      doc.save(`relatorio_alvocapital_${dataFormatada}.pdf`);

    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert(`Ocorreu um erro técnico ao gerar o PDF: ${error.message}`);
    }
  };

  //  MECANISMO DE BACKUP: GERAÇÃO E DOWNLOAD DO ARQUIVO JSON
  const exportarParaJSON = useCallback((silencioso = false) => {
    if (transacoes.length === 0) {
      if (!silencioso) alert('Não há dados de lançamentos para criar um backup!');
      return;
    }
    try {
      const dataStr = JSON.stringify(transacoes, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      const hojeStr = new Date().toISOString().split('T')[0];
      link.download = `alvocapital_backup_${hojeStr}.json`;
      link.click();
      URL.revokeObjectURL(url);

      // Guarda a data em que o último backup via arquivo foi gerado
      localStorage.setItem('alvocapital_ultimo_backup_data', hojeStr);
      if (!silencioso) alert('Backup de segurança (.json) gerado e baixado com sucesso!');
    } catch (error) {
      console.error("Erro ao exportar backup em JSON:", error);
      if (!silencioso) alert("Erro técnico ao gerar o arquivo de backup.");
    }
  }, [transacoes]);

  //  CAMADA 1: ESPELHAMENTO AUTOMÁTICO EM TEMPO REAL NO LOCALSTORAGE
  useEffect(() => {
    if (transacoes.length > 0 && session?.user?.id) {
      localStorage.setItem(`alvocapital_backup_local_${session.user.id}`, JSON.stringify(transacoes));
    }
  }, [transacoes, session]);

  //  CAMADA 2: ROTINA DE BACKUP AUTOMÁTICO EM ARQUIVO A CADA 7 DIAS
   useEffect(() => {
    if (transacoes.length === 0) return;

    const ultimaDataBackup = localStorage.getItem('alvocapital_ultimo_backup_data');
    const hoje = new Date();

    if (!ultimaDataBackup) {
      exportarParaJSON(true);
    } else {
      const dataUltimo = new Date(ultimaDataBackup);
      const diferencaTempo = hoje.getTime() - dataUltimo.getTime();
      const diferencaDias = Math.floor(diferencaTempo / (1000 * 60 * 60 * 24));

      if (diferencaDias >= 7) {
        exportarParaJSON(true);
      }
    }
  }, [transacoes, exportarParaJSON]);

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

        {/* PAINEL DE CARDS E GRÁFICOS DUPLOS */}
        <Dashboard transacoes={transacoes} />

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

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold py-3 rounded-lg transition-all cursor-pointer text-sm"
            >
              Confirmar Lançamento
            </button>
          </form>

          {/* TABELA HISTÓRICO COM OS BOTÕES DE AÇÃO ADICIONADOS */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-slate-200">Histórico de Fluxo</h2>
                <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-full text-slate-400 font-medium">
                  {transacoes.length} registros
                </span>
              </div>
              
              {/* ÁREA DE EXPORTAÇÃO E BACKUP */}
              <div className="flex items-center gap-2">
                {/* Botão Exportar PDF */}
                <button
                  type="button"
                  onClick={exportarParaPDF}
                  className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <span>⥥</span> Exportar PDF
                </button>

                {/* Botão Criar Backup Manual (.JSON) */}
                <button
                  type="button"
                  onClick={() => exportarParaJSON(false)}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-3 py-1.5 rounded-lg transition-all border border-slate-700/80 cursor-pointer flex items-center gap-1.5"
                  title="Gerar cópia de segurança em JSON manualmente"
                >
                  <span>⥣</span> Criar Backup
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