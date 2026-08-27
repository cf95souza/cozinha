import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import type { Branch } from '../contexts/AuthContext';

export default function Transfers() {
  const { user, activeBranch } = useAuth();
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [originLocations, setOriginLocations] = useState<any[]>([]);
  const [destLocations, setDestLocations] = useState<any[]>([]);

  const [originBranchId, setOriginBranchId] = useState(activeBranch?.id || '');
  const [destBranchId, setDestBranchId] = useState('');
  
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  
  const [originLocationId, setOriginLocationId] = useState('');
  const [destLocationId, setDestLocationId] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Carregar todas as filiais disponíveis para transferência
    api.get('/branches').then(res => setBranches(res.data));
  }, []);

  useEffect(() => {
    if (originBranchId) {
      // Carregar produtos que têm saldo na filial de origem
      api.get(`/stock/balances?branchId=${originBranchId}`).then(res => {
        // Obter produtos únicos a partir dos saldos
        const uniqueProducts = Array.from(new Set(res.data.map((b:any) => b.product.id)))
          .map(id => res.data.find((b:any) => b.product.id === id).product);
        setProducts(uniqueProducts);
      });
      // Carregar locais da filial de origem
      api.get(`/locations?branchId=${originBranchId}`).then(res => setOriginLocations(res.data.data || res.data));
    } else {
      setProducts([]);
      setOriginLocations([]);
    }
  }, [originBranchId]);

  useEffect(() => {
    if (destBranchId) {
      // Carregar locais da filial de destino
      api.get(`/locations?branchId=${destBranchId}`).then(res => setDestLocations(res.data.data || res.data));
    } else {
      setDestLocations([]);
    }
  }, [destBranchId]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originBranchId || !destBranchId || !productId || !quantity || !originLocationId || !destLocationId) {
      toast.error('Preencha todos os campos!');
      return;
    }
    
    if (originBranchId === destBranchId && originLocationId === destLocationId) {
      toast.error('A origem e o destino não podem ser idênticos.');
      return;
    }

    try {
      setLoading(true);
      await api.post('/stock/transfer', {
        productId,
        quantity: parseFloat(quantity),
        originBranchId,
        originLocationId,
        destinationBranchId: destBranchId,
        destinationLocationId: destLocationId
      });
      
      toast.success('Transferência realizada com sucesso!');
      setProductId('');
      setQuantity('');
      setOriginLocationId('');
      setDestLocationId('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao realizar transferência');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Transferência de Estoque</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Mova mercadorias entre locais da mesma filial ou filiais diferentes.</p>
        </div>
      </div>

      <div className="bg-surface border border-outline-variant rounded-2xl shadow-sm p-8">
        
        <form onSubmit={handleTransfer} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            
            {/* Ícone de conexão visual entre os cards (Apenas visual em telas grandes) */}
            <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-surface border border-outline-variant rounded-full items-center justify-center text-primary shadow-sm">
              <span className="material-symbols-outlined">swap_horiz</span>
            </div>

            {/* ORIGEM */}
            <div className="bg-surface-container-lowest p-6 border border-outline-variant rounded-2xl space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-outline-variant">
                <div className="w-8 h-8 rounded-full bg-error-container text-error flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                </div>
                <h3 className="font-bold text-on-surface text-lg">Origem (Saída)</h3>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">Filial de Origem</label>
                <select 
                  value={originBranchId}
                  onChange={e => setOriginBranchId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  required
                >
                  <option value="">Selecione...</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">Local de Estoque</label>
                <select 
                  value={originLocationId}
                  onChange={e => setOriginLocationId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer disabled:opacity-50"
                  required
                  disabled={!originBranchId}
                >
                  <option value="">Selecione...</option>
                  {originLocations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* DESTINO */}
            <div className="bg-surface-container-lowest p-6 border border-outline-variant rounded-2xl space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-outline-variant">
                <div className="w-8 h-8 rounded-full bg-primary-container text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                </div>
                <h3 className="font-bold text-on-surface text-lg">Destino (Entrada)</h3>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">Filial de Destino</label>
                <select 
                  value={destBranchId}
                  onChange={e => setDestBranchId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  required
                >
                  <option value="">Selecione...</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">Local de Estoque</label>
                <select 
                  value={destLocationId}
                  onChange={e => setDestLocationId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer disabled:opacity-50"
                  required
                  disabled={!destBranchId}
                >
                  <option value="">Selecione...</option>
                  {destLocations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-container-low p-6 rounded-2xl border border-outline-variant">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4 border-b border-outline-variant pb-2">O que será transferido?</h3>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1">Produto</label>
              <select 
                value={productId}
                onChange={e => setProductId(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer disabled:opacity-50"
                required
                disabled={!originBranchId}
              >
                <option value="">Selecione um produto com saldo...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1">Quantidade</label>
              <input 
                type="number"
                step="0.01"
                min="0.01"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="Ex: 5"
                className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button 
              type="submit"
              disabled={loading}
              className="bg-primary text-on-primary font-bold px-8 py-3 rounded-xl shadow-sm hover:bg-primary-hover transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
              ) : (
                <span className="material-symbols-outlined text-[20px]">send</span>
              )}
              Confirmar Transferência
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
