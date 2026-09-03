import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Quotations() {
  const navigate = useNavigate();
  const { activeBranch } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Seleção
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  
  // Matriz de preços [productId][supplierId] = string (valor digitado)
  const [prices, setPrices] = useState<Record<string, Record<string, string>>>({});
  // Quantidades a comprar por produto
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, suppRes] = await Promise.all([
        api.get('/products'),
        api.get('/suppliers')
      ]);
      setProducts(prodRes.data.data || prodRes.data);
      setSuppliers(suppRes.data.data || suppRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (productId: string, supplierId: string, val: string) => {
    setPrices(prev => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [supplierId]: val
      }
    }));
  };

  const handleQtyChange = (productId: string, val: string) => {
    setQuantities(prev => ({ ...prev, [productId]: val }));
  };

  // Encontra o supplier mais barato para uma linha
  const getCheapestSupplierId = (productId: string) => {
    const row = prices[productId];
    if (!row) return null;
    let min = Infinity;
    let winner = null;
    for (const supId of Object.keys(row)) {
      const val = parseFloat(row[supId]);
      if (!isNaN(val) && val < min) {
        min = val;
        winner = supId;
      }
    }
    return winner;
  };

  const handleGeneratePOs = async () => {
    // Para cada fornecedor, recolhe os produtos em que ele ganhou (foi mais barato)
    const ordersBySupplier: Record<string, any[]> = {};

    let hasQuotations = false;
    const allQuotesToSave: any[] = [];

    for (const pId of selectedProductIds) {
      const qty = parseFloat(quantities[pId]) || 1;
      const winnerId = getCheapestSupplierId(pId);
      
      // Salva no histórico todos os preços cotados
      if (prices[pId]) {
        for (const sId of Object.keys(prices[pId])) {
           const p = parseFloat(prices[pId][sId]);
           if (!isNaN(p)) {
             hasQuotations = true;
             allQuotesToSave.push({
               productId: pId,
               supplierId: sId,
               price: p,
               quantity: qty
             });
           }
        }
      }

      if (winnerId) {
        if (!ordersBySupplier[winnerId]) ordersBySupplier[winnerId] = [];
        ordersBySupplier[winnerId].push({
          productId: pId,
          supplierId: winnerId,
          price: parseFloat(prices[pId][winnerId]),
          quantity: qty
        });
      }
    }

    if (!hasQuotations) {
      toast.error('Preencha os valores antes de gerar.');
      return;
    }

    if (!activeBranch?.id) {
      toast.error('Selecione uma filial no topo para gerar os pedidos.');
      return;
    }

    try {
      // Para cada fornecedor vencedor, envia um bloco chamando o saveQuotations com generatePO = true
      for (const supId of Object.keys(ordersBySupplier)) {
         await api.post('/quotations', {
           quotations: allQuotesToSave.filter(q => q.supplierId === supId), // manda as quotes dele
           generatePO: true,
           supplierId: supId,
           branchId: activeBranch.id
         });
      }
      
      // As cotações perdidas precisam ir pro histórico também
      const loserQuotes = allQuotesToSave.filter(q => !ordersBySupplier[q.supplierId]);
      if (loserQuotes.length > 0) {
         await api.post('/quotations', { quotations: loserQuotes, generatePO: false, branchId: activeBranch.id });
      }

      toast.success('Pedidos de compra gerados com sucesso!');
      navigate('/pedidos-compra');
    } catch (error) {
      toast.error('Erro ao gerar ordens');
    }
  };

  if (loading) return null;

  return (
    <div className="max-w-full mx-auto space-y-6 pb-12 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Cotação Multi-fornecedor</h1>
        <p className="text-sm text-on-surface-variant">Compare preços e gere Pedidos de Compra para as opções mais baratas.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Seleção */}
        <div className="w-full md:w-64 space-y-6 shrink-0">
          <div className="bg-surface p-4 rounded-2xl border border-outline-variant">
            <h3 className="font-bold text-sm mb-3">Selecionar Produtos</h3>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {products.map(p => (
                <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-surface-container p-1 rounded">
                  <input type="checkbox" 
                    checked={selectedProductIds.includes(p.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedProductIds([...selectedProductIds, p.id]);
                      else setSelectedProductIds(selectedProductIds.filter(id => id !== p.id));
                    }}
                    className="rounded border-outline-variant text-primary focus:ring-primary"
                  />
                  <span className="line-clamp-1">{p.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-surface p-4 rounded-2xl border border-outline-variant">
            <h3 className="font-bold text-sm mb-3">Selecionar Fornecedores</h3>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {suppliers.map(s => (
                <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-surface-container p-1 rounded">
                  <input type="checkbox" 
                    checked={selectedSupplierIds.includes(s.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedSupplierIds([...selectedSupplierIds, s.id]);
                      else setSelectedSupplierIds(selectedSupplierIds.filter(id => id !== s.id));
                    }}
                    className="rounded border-outline-variant text-primary focus:ring-primary"
                  />
                  <span className="line-clamp-1">{s.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Planilha */}
        <div className="flex-1 bg-surface border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {selectedProductIds.length === 0 || selectedSupplierIds.length === 0 ? (
            <div className="p-16 text-center text-on-surface-variant flex flex-col items-center gap-3">
              <span className="material-symbols-outlined notranslate text-4xl opacity-50">table_view</span>
              <p>Selecione produtos e fornecedores ao lado para iniciar a cotação.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-surface-container-lowest border-b border-outline-variant text-on-surface-variant">
                      <th className="p-3 font-semibold w-64 min-w-[16rem]">Produto</th>
                      <th className="p-3 font-semibold w-24">Qtd. Solicitada</th>
                      {selectedSupplierIds.map(sId => (
                        <th key={sId} className="p-3 font-semibold text-center min-w-[140px]">
                          {suppliers.find(s => s.id === sId)?.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {selectedProductIds.map(pId => {
                      const p = products.find(x => x.id === pId);
                      const winnerId = getCheapestSupplierId(pId);
                      return (
                        <tr key={pId} className="hover:bg-surface-container-lowest transition-colors">
                          <td className="p-3 font-medium text-on-surface">{p?.name}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <input 
                                type="number" 
                                className="w-16 px-2 py-1 bg-surface border border-outline-variant rounded text-right outline-none focus:ring-1 focus:ring-primary"
                                placeholder="1"
                                value={quantities[pId] || ''}
                                onChange={e => handleQtyChange(pId, e.target.value)}
                              />
                              <span className="text-xs text-on-surface-variant font-bold">{p?.unit}</span>
                            </div>
                          </td>
                          {selectedSupplierIds.map(sId => {
                            const isWinner = winnerId === sId;
                            return (
                              <td key={sId} className="p-3 text-center">
                                <div className="relative inline-block">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant opacity-70">R$</span>
                                  <input 
                                    type="number" step="0.01"
                                    className={`w-28 pl-7 pr-2 py-1.5 border rounded-lg text-right outline-none transition-colors ${
                                      isWinner 
                                        ? 'bg-primary-container/30 border-primary text-primary font-bold focus:ring-2 focus:ring-primary/40' 
                                        : 'bg-surface border-outline-variant focus:ring-2 focus:ring-primary/20'
                                    }`}
                                    value={prices[pId]?.[sId] || ''}
                                    onChange={e => handlePriceChange(pId, sId, e.target.value)}
                                  />
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex justify-end gap-3">
                <button 
                  onClick={handleGeneratePOs}
                  className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow-sm hover:bg-primary-hover transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined notranslate text-[18px]">auto_awesome</span>
                  Gerar Pedidos Mágicos
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
