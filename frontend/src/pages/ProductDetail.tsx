import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, TrendingUp, TrendingDown, Package, Clock, History } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeBranch } = useAuth();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeBranch && id) {
      setLoading(true);
      api.get(`/products/${id}/history?branchId=${activeBranch.id}`)
        .then(res => setData(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [activeBranch, id]);

  if (loading) {
    return <div className="p-12 text-center text-on-surface-variant">Carregando Raio-X do produto...</div>;
  }

  if (!data || !data.product) {
    return <div className="p-12 text-center text-error">Produto não encontrado.</div>;
  }

  const { product, variationChart } = data;
  const currentTotalQty = product.stockBalances?.reduce((acc: number, b: any) => acc + b.quantity, 0) || 0;

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-surface hover:bg-surface-container rounded-full text-on-surface-variant transition-colors border border-outline-variant shadow-sm">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-display-sm font-section-title text-on-surface">{product.name}</h1>
          <p className="text-body text-on-surface-variant mt-1">
            SKU: <span className="font-mono">{product.sku}</span> • Categoria: {product.category?.name || '-'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* KPI: Saldo Atual */}
        <div className="bg-surface rounded-xl p-6 shadow-sm border border-outline-variant flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs uppercase font-bold text-on-surface-variant tracking-wider">Saldo Atual</span>
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div className="mt-4">
            <span className="text-4xl font-black text-primary">{currentTotalQty}</span>
            <span className="text-sm font-bold text-on-surface-variant ml-2">{product.unit}</span>
          </div>
        </div>

        {/* KPI: Custo Estimado */}
        <div className="bg-surface rounded-xl p-6 shadow-sm border border-outline-variant flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs uppercase font-bold text-on-surface-variant tracking-wider">Custo em Estoque</span>
            <span className="material-symbols-outlined notranslate text-secondary text-xl">payments</span>
          </div>
          <div className="mt-4">
            <span className="text-4xl font-black text-secondary">
              <span className="text-xl opacity-70 mr-1">R$</span>
              {((product.costPrice || 0) * currentTotalQty).toFixed(2)}
            </span>
          </div>
        </div>

        {/* KPI: Saúde */}
        <div className={`rounded-xl p-6 shadow-sm border flex flex-col justify-between ${currentTotalQty < product.minStock ? 'bg-error-container/30 border-error/50' : 'bg-surface border-outline-variant'}`}>
          <div className="flex items-start justify-between">
            <span className="text-xs uppercase font-bold text-on-surface-variant tracking-wider">Status do Estoque</span>
            {currentTotalQty < product.minStock ? <TrendingDown className="w-5 h-5 text-error" /> : <TrendingUp className="w-5 h-5 text-primary" />}
          </div>
          <div className="mt-4">
            <p className="text-sm text-on-surface-variant font-bold">Mínimo: {product.minStock}</p>
            <p className="text-sm text-on-surface-variant font-bold">Máximo: {product.maxStock}</p>
            {currentTotalQty < product.minStock && (
              <p className="text-xs font-bold text-error mt-2">Abaixo do mínimo ideal!</p>
            )}
          </div>
        </div>

      </div>

      {/* Chart */}
      <div className="bg-surface rounded-xl p-6 shadow-sm border border-outline-variant">
        <h3 className="font-bold text-on-surface flex items-center gap-2 mb-6">
          <History className="w-5 h-5 text-on-surface-variant" />
          Variação de Saldo (Últimos 30 dias)
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={variationChart}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#757575' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#757575' }} axisLine={false} tickLine={false} />
              <RechartsTooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`${value} ${product.unit}`, 'Estoque']}
              />
              <Line type="monotone" dataKey="quantidade" stroke="#0ea5e9" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Saldos por Local */}
        <div className="bg-surface rounded-xl shadow-sm border border-outline-variant overflow-hidden">
          <div className="p-4 border-b border-outline-variant bg-surface-container-lowest">
            <h3 className="font-bold text-on-surface">Distribuição Física</h3>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-variant text-on-surface-variant text-xs uppercase">
              <tr>
                <th className="px-4 py-3">Local</th>
                <th className="px-4 py-3 text-right">Quantidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {product.stockBalances?.map((b: any) => (
                <tr key={b.id}>
                  <td className="px-4 py-3 font-bold">{b.location.name}</td>
                  <td className="px-4 py-3 text-right font-bold text-primary">{b.quantity}</td>
                </tr>
              ))}
              {(!product.stockBalances || product.stockBalances.length === 0) && (
                <tr>
                  <td colSpan={2} className="p-4 text-center text-on-surface-variant">Sem saldo registrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Lotes Ativos */}
        <div className="bg-surface rounded-xl shadow-sm border border-outline-variant overflow-hidden">
          <div className="p-4 border-b border-outline-variant bg-surface-container-lowest">
            <h3 className="font-bold text-on-surface">Lotes Ativos</h3>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-variant text-on-surface-variant text-xs uppercase">
              <tr>
                <th className="px-4 py-3">Lote</th>
                <th className="px-4 py-3">Vencimento</th>
                <th className="px-4 py-3 text-right">Qtd</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {product.lots?.map((l: any) => {
                const isExpired = new Date(l.expirationDate) < new Date();
                return (
                  <tr key={l.id}>
                    <td className="px-4 py-3 font-mono text-xs">{l.number}</td>
                    <td className={`px-4 py-3 font-bold ${isExpired ? 'text-error' : 'text-on-surface'}`}>
                      {new Date(l.expirationDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right font-bold">{l.currentQty}</td>
                  </tr>
                );
              })}
              {(!product.lots || product.lots.length === 0) && (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-on-surface-variant">Nenhum lote ativo.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Últimas Movimentações */}
        <div className="bg-surface rounded-xl shadow-sm border border-outline-variant overflow-hidden lg:col-span-2">
          <div className="p-4 border-b border-outline-variant bg-surface-container-lowest">
            <h3 className="font-bold text-on-surface">Histórico de Movimentações (Últimas 20)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-variant text-on-surface-variant text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3 text-right">Qtd</th>
                  <th className="px-4 py-3">Responsável</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {product.movements?.map((m: any) => (
                  <tr key={m.id}>
                    <td className="px-4 py-3">{new Date(m.date).toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold text-xs uppercase">{m.type.replace('_', ' ')}</td>
                    <td className={`px-4 py-3 text-right font-bold ${m.type.includes('SAIDA') || m.type.includes('PERDA') ? 'text-error' : 'text-secondary'}`}>
                      {m.quantity}
                    </td>
                    <td className="px-4 py-3">{m.user?.name}</td>
                  </tr>
                ))}
                {(!product.movements || product.movements.length === 0) && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-on-surface-variant">Nenhuma movimentação.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
