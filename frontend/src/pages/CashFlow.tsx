import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Clock, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import toast from 'react-hot-toast';

export default function CashFlow() {
  const { activeBranch } = useAuth();
  const [statement, setStatement] = useState<any>(null);
  const [payables, setPayables] = useState<any[]>([]);
  const [receivables, setReceivables] = useState<any[]>([]);
  
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
      fetchData();
    }
  }, [activeBranch, startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const branchParam = activeBranch?.id ? `branchId=${activeBranch.id}` : '';
      
      const [statementRes, payablesRes, receivablesRes] = await Promise.all([
        api.get(`/finance/statement?${branchParam}&startDate=${startDate}&endDate=${endDate}`),
        api.get(`/finance/payables?${branchParam}&status=PENDENTE`),
        api.get(`/finance/receivables?${branchParam}&status=PENDENTE`)
      ]);

      setStatement(statementRes.data);
      setPayables(payablesRes.data);
      setReceivables(receivablesRes.data);
    } catch (err) {
      toast.error('Erro ao carregar fluxo de caixa');
    } finally {
      setLoading(false);
    }
  };

  // ========================
  // PROCESSAMENTO DE DADOS
  // ========================

  const processedData = useMemo(() => {
    if (!statement) return null;

    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');

    // Filtrar Payables/Receivables dentro do período
    const pendingPayables = payables.filter(p => {
      const date = new Date(p.dueDate + 'T00:00:00');
      return date >= start && date <= end;
    });

    const pendingReceivables = receivables.filter(r => {
      const date = new Date(r.dueDate + 'T00:00:00');
      return date >= start && date <= end;
    });

    // Calcular Totais Previstos
    const totalPrevistoIn = pendingReceivables.reduce((acc, r) => acc + r.amount, 0);
    const totalPrevistoOut = pendingPayables.reduce((acc, p) => acc + p.amount, 0);

    // Preparar dados para o Gráfico (agrupando por dia)
    const chartMap = new Map<string, { date: string, Receita: number, Despesa: number }>();
    
    // Inserir Realizado
    statement.transactions.forEach((t: any) => {
      const dateStr = new Date(t.date).toLocaleDateString('pt-BR');
      if (!chartMap.has(dateStr)) chartMap.set(dateStr, { date: dateStr, Receita: 0, Despesa: 0 });
      if (t.type === 'ENTRADA') chartMap.get(dateStr)!.Receita += t.amount;
      if (t.type === 'SAIDA' || t.type === 'PERDA') chartMap.get(dateStr)!.Despesa += t.amount;
    });

    // Inserir Previsto
    pendingReceivables.forEach(r => {
      const dateStr = new Date(r.dueDate + 'T00:00:00').toLocaleDateString('pt-BR');
      if (!chartMap.has(dateStr)) chartMap.set(dateStr, { date: dateStr, Receita: 0, Despesa: 0 });
      chartMap.get(dateStr)!.Receita += r.amount;
    });

    pendingPayables.forEach(p => {
      const dateStr = new Date(p.dueDate + 'T00:00:00').toLocaleDateString('pt-BR');
      if (!chartMap.has(dateStr)) chartMap.set(dateStr, { date: dateStr, Receita: 0, Despesa: 0 });
      chartMap.get(dateStr)!.Despesa += p.amount;
    });

    // Ordenar Gráfico
    const chartData = Array.from(chartMap.values()).sort((a, b) => {
      const [d1, m1, y1] = a.date.split('/');
      const [d2, m2, y2] = b.date.split('/');
      return new Date(`${y1}-${m1}-${d1}`).getTime() - new Date(`${y2}-${m2}-${d2}`).getTime();
    });

    // Tabela Unificada (Realizado + Previsto)
    const unifiedList = [
      ...statement.transactions.map((t: any) => ({
        id: `t_${t.id}`,
        date: new Date(t.date),
        type: t.type === 'ENTRADA' ? 'RECEITA' : 'DESPESA',
        description: t.description,
        amount: t.amount,
        status: 'REALIZADO'
      })),
      ...pendingReceivables.map(r => ({
        id: `r_${r.id}`,
        date: new Date(r.dueDate + 'T00:00:00'),
        type: 'RECEITA',
        description: r.description,
        amount: r.amount,
        status: 'PREVISTO'
      })),
      ...pendingPayables.map(p => ({
        id: `p_${p.id}`,
        date: new Date(p.dueDate + 'T00:00:00'),
        type: 'DESPESA',
        description: p.description,
        amount: p.amount,
        status: 'PREVISTO'
      }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime()); // Mais recentes primeiro (ou futuros)

    return {
      totalPrevistoIn,
      totalPrevistoOut,
      saldoPrevisto: totalPrevistoIn - totalPrevistoOut,
      chartData,
      unifiedList
    };
  }, [statement, payables, receivables, startDate, endDate]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Fluxo de Caixa</h1>
          <p className="text-on-surface-variant mt-1">Visão consolidada entre o que foi realizado (Extrato) e o que está previsto.</p>
        </div>
        <div className="flex gap-2 items-center bg-surface p-2 rounded-xl border border-outline-variant shadow-sm">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm bg-surface outline-none focus:ring-2 focus:ring-primary/20" />
          <span className="text-on-surface-variant font-medium">até</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm bg-surface outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : processedData && statement ? (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bloco Realizado */}
            <div className="bg-surface rounded-2xl border border-outline-variant p-6 shadow-sm">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-on-surface">
                <DollarSign className="text-green-600" /> Realizado (Em Conta)
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
                  <span className="text-on-surface-variant font-medium">Entradas</span>
                  <span className="text-green-600 font-bold">R$ {statement.totalIn.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
                  <span className="text-on-surface-variant font-medium">Saídas</span>
                  <span className="text-red-600 font-bold">R$ {statement.totalOut.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-on-surface font-bold text-lg">Saldo</span>
                  <span className={`font-black text-xl ${statement.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {statement.balance.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bloco Previsto */}
            <div className="bg-surface rounded-2xl border border-outline-variant p-6 shadow-sm">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-on-surface">
                <Clock className="text-orange-500" /> Previsto (Pendentes)
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
                  <span className="text-on-surface-variant font-medium">A Receber</span>
                  <span className="text-blue-600 font-bold">R$ {processedData.totalPrevistoIn.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
                  <span className="text-on-surface-variant font-medium">A Pagar</span>
                  <span className="text-red-600 font-bold">R$ {processedData.totalPrevistoOut.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-on-surface font-bold text-lg">Projeção do Saldo</span>
                  <span className={`font-black text-xl ${processedData.saldoPrevisto >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    R$ {processedData.saldoPrevisto.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Resultado Final (Projetado Total) */}
          <div className="bg-surface-container-low rounded-2xl border border-outline-variant p-6 text-center shadow-sm">
            <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Caixa Projetado no Final do Período</p>
            <p className={`text-4xl font-black ${(statement.balance + processedData.saldoPrevisto) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {(statement.balance + processedData.saldoPrevisto).toFixed(2)}
            </p>
          </div>

          {/* Gráfico */}
          <div className="bg-surface rounded-2xl border border-outline-variant p-6 shadow-sm">
            <h2 className="text-lg font-bold text-on-surface mb-6">Desempenho Diário (Realizado + Previsto)</h2>
            {processedData.chartData.length > 0 ? (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={processedData.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#6B7280', fontSize: 12 }} 
                      tickLine={false} 
                      axisLine={false} 
                      dy={10}
                    />
                    <YAxis 
                      tick={{ fill: '#6B7280', fontSize: 12 }} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `R$ ${value}`}
                    />
                    <Tooltip 
                      cursor={{ fill: '#F3F4F6' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [`R$ ${value.toFixed(2)}`, undefined]}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="Receita" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="Despesa" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-12 text-center text-on-surface-variant">
                Nenhum dado financeiro para o período selecionado.
              </div>
            )}
          </div>

          {/* Tabela Unificada */}
          <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-outline-variant bg-surface-container-low/30">
              <h3 className="font-bold text-lg">Histórico e Lançamentos Futuros</h3>
            </div>
            
            {processedData.unifiedList.length === 0 ? (
              <div className="p-12"><EmptyState icon={TrendingUp} title="Sem movimentações" message="Nenhuma conta paga, recebida ou pendente neste período." /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-surface-container-low text-on-surface-variant">
                    <tr>
                      <th className="p-4 font-semibold">Data</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold">Descrição</th>
                      <th className="p-4 font-semibold text-right">Valor (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {processedData.unifiedList.map(item => (
                      <tr key={item.id} className="hover:bg-surface-container-lowest transition-colors">
                        <td className="p-4 font-medium text-on-surface">
                          {item.date.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                        </td>
                        <td className="p-4">
                          {item.status === 'REALIZADO' ? (
                            <span className="px-2 py-1 bg-surface-variant text-on-surface-variant text-[10px] font-bold rounded">EXTRATO</span>
                          ) : (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-[10px] font-bold rounded">PREVISTO</span>
                          )}
                        </td>
                        <td className="p-4 text-on-surface flex items-center gap-2">
                          {item.type === 'RECEITA' ? (
                            <TrendingUp size={16} className="text-green-600" />
                          ) : (
                            <TrendingDown size={16} className="text-red-600" />
                          )}
                          {item.description}
                        </td>
                        <td className={`p-4 font-bold text-right ${item.type === 'RECEITA' ? 'text-green-600' : 'text-red-600'}`}>
                          {item.type === 'RECEITA' ? '+' : '-'} {item.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
