import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Printer, TrendingUp, TrendingDown, Percent, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dre() {
  const { activeBranch } = useAuth();
  const [dre, setDre] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    setStartDate(start);
    setEndDate(end);
  }, []);

  useEffect(() => {
    if (activeBranch && startDate && endDate) {
      fetchDre();
    }
  }, [activeBranch, startDate, endDate]);

  const fetchDre = () => {
    setLoading(true);
    const branchParam = activeBranch?.id ? `branchId=${activeBranch.id}&` : '';
    api.get(`/finance/dre?${branchParam}startDate=${startDate}&endDate=${endDate}`)
       .then(res => setDre(res.data))
       .catch(() => toast.error('Erro ao calcular DRE. Verifique o período.'))
       .finally(() => setLoading(false));
  };

  const handlePrint = () => {
    window.print();
  };

  // Cores para o gráfico de pizza
  const COLORS = ['#EF4444', '#F97316', '#EAB308'];

  const chartData = dre ? [
    { name: 'CMV (Custos)', value: dre.cmv },
    { name: 'Impostos', value: dre.impostos },
    { name: 'Despesas Operacionais', value: dre.despesasOperacionais }
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">D.R.E.</h1>
          <p className="text-on-surface-variant mt-1">Demonstrativo de Resultados do Exercício (Visão Gerencial).</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex gap-2 items-center bg-surface p-2 rounded-xl border border-outline-variant shadow-sm">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm bg-surface outline-none focus:ring-2 focus:ring-primary/20" />
            <span className="text-on-surface-variant font-medium">até</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm bg-surface outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <button onClick={handlePrint} className="p-3 bg-surface border border-outline-variant rounded-xl hover:bg-surface-container text-on-surface-variant transition-colors shadow-sm" title="Imprimir Relatório">
            <Printer size={20} />
          </button>
        </div>
      </div>

      {/* Título de Impressão (Só aparece no print) */}
      <div className="hidden print:block text-center mb-8">
        <h1 className="text-2xl font-bold">Demonstrativo de Resultados do Exercício</h1>
        <p className="text-sm text-gray-500">Período: {new Date(startDate + 'T00:00:00').toLocaleDateString()} a {new Date(endDate + 'T00:00:00').toLocaleDateString()}</p>
        {activeBranch && <p className="text-sm font-semibold">Unidade: {activeBranch.name}</p>}
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : dre ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUNA ESQUERDA: ESTRUTURA DO DRE */}
          <div className="lg:col-span-2 space-y-4">
            
            <div className="bg-surface rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
              {/* RECEITA BRUTA */}
              <div className="p-6 bg-green-50/50 flex justify-between items-center border-b border-outline-variant">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 text-green-600 rounded-lg"><TrendingUp size={24} /></div>
                  <h2 className="text-lg font-bold text-green-800">(=) Receita Bruta</h2>
                </div>
                <span className="text-2xl font-black text-green-700">R$ {dre.receitaBruta.toFixed(2)}</span>
              </div>

              {/* DEDUÇÕES / CMV */}
              <div className="p-6 border-b border-outline-variant space-y-4">
                <div className="flex justify-between items-center text-on-surface">
                  <h2 className="font-semibold flex items-center gap-2 text-orange-600"><Percent size={18} /> (-) Impostos e Deduções</h2>
                  <span className="font-bold text-orange-600">R$ {dre.impostos.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-on-surface">
                  <h2 className="font-semibold flex items-center gap-2 text-red-600"><AlertCircle size={18} /> (-) Custos (CMV)</h2>
                  <span className="font-bold text-red-600">R$ {dre.cmv.toFixed(2)}</span>
                </div>
              </div>

              {/* LUCRO BRUTO */}
              <div className="p-6 bg-primary/5 flex justify-between items-center border-b border-outline-variant">
                <h2 className="text-lg font-bold text-primary">(=) Lucro Bruto</h2>
                <span className="text-2xl font-black text-primary">R$ {dre.lucroBruto.toFixed(2)}</span>
              </div>

              {/* DESPESAS OPERACIONAIS */}
              <div className="p-6 border-b border-outline-variant">
                <div className="flex justify-between items-center text-red-600 mb-4">
                  <h2 className="font-semibold flex items-center gap-2"><TrendingDown size={18} /> (-) Despesas Operacionais</h2>
                  <span className="font-bold">R$ {dre.despesasOperacionais.toFixed(2)}</span>
                </div>
                
                {/* Detalhe das Despesas */}
                {dre.detalhes.length > 0 && (
                  <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/50">
                    <p className="text-xs font-bold text-on-surface-variant uppercase mb-3">Composição das Despesas / Custos</p>
                    <ul className="space-y-2 text-sm text-on-surface-variant">
                      {dre.detalhes.filter((d: any) => d.total > 0).sort((a: any, b: any) => b.total - a.total).map((d: any) => (
                        <li key={d.name} className="flex justify-between border-b border-outline-variant/30 pb-1 last:border-0 last:pb-0">
                          <span>{d.name}</span>
                          <span className="font-semibold text-on-surface">R$ {d.total.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* LUCRO LÍQUIDO */}
              <div className={`p-8 flex flex-col items-center justify-center ${dre.lucroLiquido >= 0 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                <h2 className="text-xl font-bold opacity-90 mb-1">(=) Resultado Líquido</h2>
                <span className="text-5xl font-black">R$ {dre.lucroLiquido.toFixed(2)}</span>
                <span className="mt-4 text-sm font-bold opacity-90 border border-white/20 px-4 py-1.5 rounded-full backdrop-blur-sm bg-black/10">
                  Margem Líquida: {dre.margemLiquida.toFixed(2)}%
                </span>
              </div>
            </div>

          </div>

          {/* COLUNA DIREITA: ANÁLISE GRÁFICA */}
          <div className="space-y-6 print:hidden">
            <div className="bg-surface rounded-2xl border border-outline-variant p-6 shadow-sm">
              <h2 className="text-lg font-bold text-on-surface mb-2">Composição de Saídas</h2>
              <p className="text-sm text-on-surface-variant mb-6">Como as receitas foram consumidas.</p>
              
              {chartData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`R$ ${value.toFixed(2)}`, undefined]}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-on-surface-variant text-sm">
                  Sem dados de saída suficientes.
                </div>
              )}
            </div>

            <div className="bg-surface-container-low rounded-2xl border border-outline-variant p-6 shadow-sm">
              <h3 className="font-bold text-sm uppercase text-on-surface-variant mb-2">Resumo da Margem</h3>
              <p className="text-sm text-on-surface mb-4">
                De cada <strong>R$ 100,00</strong> que entraram neste período, a empresa lucrou <strong>R$ {dre.margemLiquida.toFixed(2)}</strong> após todos os impostos, custos (CMV) e despesas operacionais.
              </p>
            </div>
          </div>
          
        </div>
      ) : null}
    </div>
  );
}
