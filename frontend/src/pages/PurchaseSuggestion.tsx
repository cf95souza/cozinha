import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function PurchaseSuggestion() {
  const { activeBranch } = useAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeBranch) {
      setLoading(true);
      api.get(`/suggestions/purchase?branchId=${activeBranch.id}`)
        .then(res => setSuggestions(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [activeBranch]);

  if (loading) {
    return (
      <div className="p-12 text-center text-on-surface-variant flex flex-col items-center gap-3">
        <span className="material-symbols-outlined animate-spin text-4xl">sync</span>
        <span className="font-semibold text-sm">Analisando inteligência de compras...</span>
      </div>
    );
  }

  const totalEstimatedCost = suggestions.reduce((acc, item) => acc + item.estimatedCost, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            Sugestão de Compras
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Produtos que caíram abaixo do nível mínimo de estoque.</p>
        </div>
      </div>

      {suggestions.length === 0 ? (
        <div className="bg-surface rounded-2xl p-12 shadow-sm border border-outline-variant text-center border-dashed">
          <div className="bg-primary-container text-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px]">check_circle</span>
          </div>
          <h3 className="text-lg font-bold text-on-surface">Estoque Saudável!</h3>
          <p className="text-sm text-on-surface-variant mt-2 max-w-md mx-auto">
            No momento, nenhum produto cadastrado com controle de Mínimo/Máximo está abaixo do limite configurado.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-primary-container text-on-primary-container p-6 rounded-2xl shadow-sm border border-primary/20 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="font-bold text-lg">Resumo da Reposição</h3>
              <p className="text-sm opacity-90">{suggestions.length} produtos precisam ser repostos para atingir o estoque máximo.</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">Custo Estimado Total</p>
              <p className="text-3xl font-black">R$ {totalEstimatedCost.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
            <div className="flex flex-col">
              <div className="divide-y divide-outline-variant">
                <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-surface-container-low text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  <div className="col-span-4">Produto</div>
                  <div className="col-span-3">Fornecedor Sugerido</div>
                  <div className="col-span-2 text-right">Qtd Atual</div>
                  <div className="col-span-2 text-right">Reposição Sugerida</div>
                  <div className="col-span-1 text-center">Ação</div>
                </div>

                {suggestions.map(item => (
                  <div key={item.productId} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 hover:bg-surface-container-low transition-colors items-center text-sm">
                    <div className="col-span-1 md:col-span-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-error-container text-error flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[20px]">trending_down</span>
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">{item.productName}</p>
                        <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">SKU: {item.sku || 'S/N'}</p>
                      </div>
                    </div>
                    
                    <div className="col-span-1 md:col-span-3">
                      <span className="text-on-surface-variant font-semibold">{item.supplierName || 'Sem Fornecedor Padrão'}</span>
                    </div>
                    
                    <div className="col-span-1 md:col-span-2 flex flex-col md:items-end justify-center">
                      <span className="font-bold text-error">{item.currentQty}</span>
                      <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Min: {item.minStock}</span>
                    </div>
                    
                    <div className="col-span-1 md:col-span-2 flex flex-col md:items-end justify-center gap-1">
                      <span className="font-bold text-primary bg-primary-container px-3 py-1 rounded-full text-xs">
                        + {item.qtyToBuy} {item.unit}
                      </span>
                      <span className="text-[10px] text-on-surface-variant font-bold">~ R$ {item.estimatedCost.toFixed(2)}</span>
                    </div>
                    
                    <div className="col-span-1 md:col-span-1 flex justify-center">
                      <button 
                        onClick={() => navigate(`/produto/${item.productId}`)}
                        className="p-2 text-primary hover:bg-primary-container rounded-full transition-colors flex items-center justify-center"
                        title="Ver Raio-X"
                      >
                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
