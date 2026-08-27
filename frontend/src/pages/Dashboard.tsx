import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export default function Dashboard() {
  const { user, activeBranch } = useAuth();
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeBranch) {
      setLoading(true);
      api.get(`/dashboard/kpis?branchId=${activeBranch.id}`)
        .then(res => setKpis(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [activeBranch]);

  if (loading || !kpis) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-on-surface-variant flex flex-col items-center gap-3">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
          <p className="text-sm">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  /* ═══════ CORES GRÁFICOS ═══════ */
  const CHART_COLORS = ['#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

  return (
    <div className="space-y-8 w-full pb-8">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Início</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Atualizado hoje às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <section className="flex flex-wrap gap-3">
        <button 
          onClick={() => navigate('/recebimentos')}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Receber Mercadoria
        </button>
        <button 
          onClick={() => navigate('/etiquetas')}
          className="flex items-center gap-2 px-5 py-2.5 bg-surface text-on-surface rounded-xl text-sm font-semibold border border-outline-variant hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">label</span>
          Gerar Etiqueta
        </button>
        <button 
          onClick={() => navigate('/producao')}
          className="flex items-center gap-2 px-5 py-2.5 bg-surface text-on-surface rounded-xl text-sm font-semibold border border-outline-variant hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">skillet</span>
          Produzir
        </button>
        <button 
          onClick={() => navigate('/inventario')}
          className="flex items-center gap-2 px-5 py-2.5 bg-surface text-on-surface rounded-xl text-sm font-semibold border border-outline-variant hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">rule</span>
          Auditar Estoque
        </button>
      </section>

      {/* KPI Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI: Valor em Estoque */}
        <div className="bg-surface border border-outline-variant p-6 rounded-2xl flex flex-col gap-1">
          <span className="text-xs text-on-surface-variant font-medium">Valor em Estoque</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-sm text-on-surface-variant font-medium">R$</span>
            <span className="text-kpi font-extrabold text-on-surface tracking-tight">
              {kpis.totalValue?.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
          <span className="text-xs text-on-surface-variant">valor total</span>
        </div>

        {/* KPI: Produtos */}
        <div className="bg-surface border border-outline-variant p-6 rounded-2xl flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant font-medium">Produtos Cadastrados</span>
            {kpis.pendingReceivings > 0 && (
              <span className="text-[10px] bg-primary-container text-primary px-2 py-0.5 rounded-full font-semibold">
                {kpis.pendingReceivings} pendentes
              </span>
            )}
          </div>
          <span className="text-kpi font-extrabold text-on-surface tracking-tight mt-1">{kpis.totalProducts}</span>
          <span className="text-xs text-on-surface-variant">produtos ativos</span>
        </div>

        {/* KPI: Validades */}
        <div className={`border p-6 rounded-2xl flex flex-col gap-1 ${
          kpis.expiredLots > 0 ? 'bg-error-container/30 border-error/30' : 'bg-surface border-outline-variant'
        }`}>
          <span className={`text-xs font-medium ${kpis.expiredLots > 0 ? 'text-error' : 'text-on-surface-variant'}`}>
            Lotes Críticos
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-kpi font-extrabold tracking-tight ${kpis.expiredLots > 0 ? 'text-error' : 'text-on-surface'}`}>
              {kpis.expiredLots + kpis.expiringLots}
            </span>
            {kpis.expiredLots > 0 && (
              <span className="text-xs font-semibold text-error bg-error/10 px-2 py-0.5 rounded-full">
                {kpis.expiredLots} vencidos
              </span>
            )}
          </div>
          <span className={`text-xs ${kpis.expiredLots > 0 ? 'text-error/70' : 'text-on-surface-variant'}`}>lotes em atenção</span>
        </div>

        {/* KPI: Abaixo do Mínimo */}
        <div className={`border p-6 rounded-2xl flex flex-col gap-1 ${
          kpis.belowMinCount > 0 ? 'bg-tertiary-container/30 border-tertiary/30' : 'bg-surface border-outline-variant'
        }`}>
          <span className={`text-xs font-medium ${kpis.belowMinCount > 0 ? 'text-on-tertiary-container' : 'text-on-surface-variant'}`}>
            Abaixo do Mínimo
          </span>
          <span className={`text-kpi font-extrabold tracking-tight mt-1 ${kpis.belowMinCount > 0 ? 'text-on-tertiary-container' : 'text-on-surface'}`}>
            {kpis.belowMinCount}
          </span>
          <button 
            onClick={() => navigate('/compras')} 
            className="text-xs text-primary font-semibold hover:underline self-start mt-1"
          >
            Ver detalhes →
          </button>
        </div>
      </section>

      {/* Charts Row */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Gráfico de Barras */}
        <div className="bg-surface border border-outline-variant rounded-2xl p-5 lg:col-span-2 flex flex-col h-80">
          <h3 className="font-semibold text-on-surface text-sm mb-4">Fluxo de Estoque (7 dias)</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kpis.movementsChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="entradas" name="Entradas" fill="#10B981" radius={[6, 6, 0, 0]} barSize={24} />
                <Bar dataKey="saidas" name="Saídas / Perdas" fill="#EF4444" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico Donut */}
        <div className="bg-surface border border-outline-variant rounded-2xl p-5 flex flex-col h-80">
          <h3 className="font-semibold text-on-surface text-sm mb-4">Valor por Categoria</h3>
          <div className="flex-1 w-full min-h-0 flex items-center justify-center">
            {kpis.categoryChart?.length === 0 ? (
              <span className="text-on-surface-variant text-sm">Sem dados</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={kpis.categoryChart}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {kpis.categoryChart?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Legenda */}
          <div className="space-y-1.5 mt-2">
            {kpis.categoryChart?.slice(0, 4).map((cat: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-on-surface-variant">{cat.name}</span>
                </div>
                <span className="font-semibold text-on-surface">{cat.value?.toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detail Cards Row */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Reposição Urgente */}
        <div className="bg-surface border border-outline-variant rounded-2xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
            <h3 className="font-semibold text-on-surface text-sm">Reposição Urgente</h3>
            <span className="text-xs bg-primary-container text-primary px-2 py-0.5 rounded-full font-semibold">
              {kpis.criticalProducts?.length || 0}
            </span>
          </div>
          <div className="overflow-y-auto h-64">
            {kpis.criticalProducts?.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant text-sm flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-3xl text-secondary">check_circle</span>
                Estoque saudável
              </div>
            ) : (
              <div className="divide-y divide-outline-variant">
                {kpis.criticalProducts?.map((item: any) => (
                  <div key={item.id} className="px-5 py-3 hover:bg-surface-container-low transition-colors">
                    <p className="font-semibold text-sm text-on-surface">{item.name}</p>
                    <div className="flex justify-between mt-0.5">
                      <p className="text-xs text-on-surface-variant">{item.location}</p>
                      <p className="text-xs font-semibold text-error">{item.quantity} {item.unit} <span className="text-on-surface-variant font-normal">/ min: {item.minStock}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Lotes Vencendo */}
        <div className="bg-surface border border-outline-variant rounded-2xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
            <h3 className="font-semibold text-on-surface text-sm">Lotes Vencendo</h3>
            <span className="text-xs bg-error-container text-on-error-container px-2 py-0.5 rounded-full font-semibold">
              {kpis.expiringLotsDetails?.length || 0}
            </span>
          </div>
          <div className="overflow-y-auto h-64">
            {kpis.expiringLotsDetails?.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant text-sm flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-3xl text-secondary">check_circle</span>
                Nenhum lote crítico
              </div>
            ) : (
              <div className="divide-y divide-outline-variant">
                {kpis.expiringLotsDetails?.map((lot: any) => {
                  const isExpired = new Date(lot.expirationDate) < new Date();
                  return (
                    <div key={lot.id} className="px-5 py-3 hover:bg-surface-container-low transition-colors">
                      <p className="font-semibold text-sm text-on-surface truncate">{lot.product?.name}</p>
                      <div className="flex justify-between mt-0.5">
                        <p className="text-xs text-on-surface-variant">Lote: {lot.number}</p>
                        <p className={`text-xs font-semibold ${isExpired ? 'text-error' : 'text-tertiary'}`}>
                          {new Date(lot.expirationDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Últimas Ações */}
        <div className="bg-surface border border-outline-variant rounded-2xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
            <h3 className="font-semibold text-on-surface text-sm">Últimas Ações</h3>
            <button onClick={() => navigate('/relatorios')} className="text-xs text-primary font-semibold hover:underline">Ver todas →</button>
          </div>
          <div className="overflow-y-auto h-64">
            {kpis.recentMovements?.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant text-sm">Nenhuma movimentação.</div>
            ) : (
              <div className="divide-y divide-outline-variant">
                {kpis.recentMovements?.map((mov: any) => (
                  <div key={mov.id} className="px-5 py-3 flex items-center gap-3 hover:bg-surface-container-low transition-colors">
                    <span className={`material-symbols-outlined text-[18px] ${
                      mov.type.includes('ENTRADA') ? 'text-secondary' : 
                      mov.type.includes('SAIDA') || mov.type.includes('PERDA') ? 'text-error' : 'text-primary'
                    }`}>
                      {mov.type.includes('ENTRADA') ? 'arrow_downward' : 
                       mov.type.includes('SAIDA') || mov.type.includes('PERDA') ? 'arrow_upward' : 'sync_alt'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-on-surface truncate">{mov.product?.name}</p>
                      <p className="text-xs text-on-surface-variant">{mov.user?.name?.split(' ')[0]} • {new Date(mov.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                    <span className={`text-sm font-semibold ${mov.type.includes('ENTRADA') ? 'text-secondary' : 'text-on-surface'}`}>
                      {mov.type.includes('ENTRADA') ? '+' : mov.type.includes('TRANSFERENCIA') ? '' : '-'}{mov.quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
