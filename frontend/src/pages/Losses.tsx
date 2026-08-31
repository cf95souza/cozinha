import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function Losses() {
  const { activeBranch, user } = useAuth();
  const [losses, setLosses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    unit: 'UN',
    reason: 'VENCIMENTO',
    notes: ''
  });

  useEffect(() => {
    if (activeBranch) {
      loadData();
    }
  }, [activeBranch]);

  const loadData = async () => {
    try {
      const [lossesRes, productsRes] = await Promise.all([
        api.get(`/losses?branchId=${activeBranch?.id}`),
        api.get(`/products?branchId=${activeBranch?.id}`)
      ]);
      setLosses(Array.isArray(lossesRes.data) ? lossesRes.data.filter((l: any) => l.product && l.user) : []);
      setProducts(productsRes.data.data || productsRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/losses', {
        ...formData,
        branchId: activeBranch?.id,
        userId: user?.id,
      });
      setIsModalOpen(false);
      setFormData({ productId: '', quantity: '', unit: 'UN', reason: 'VENCIMENTO', notes: '' });
      loadData();
    } catch (error) {
      alert('Erro ao registrar perda');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Controle de Perdas</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Histórico de baixas por vencimento, quebra ou deterioração.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-error text-on-error rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-sm"
        >
          <span className="material-symbols-outlined notranslate text-[18px]">delete_forever</span>
          Registrar Perda
        </button>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
        <div className="divide-y divide-outline-variant">
          
          <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-surface-container-low text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            <div className="col-span-2">Data</div>
            <div className="col-span-4">Produto</div>
            <div className="col-span-2 text-center">Motivo</div>
            <div className="col-span-2 text-right">Quantidade</div>
            <div className="col-span-2 text-right">Responsável</div>
          </div>

          {losses.map(loss => (
            <div key={loss.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 hover:bg-surface-container-low transition-colors items-center">
              <div className="col-span-1 md:col-span-2">
                <span className="text-sm font-semibold text-on-surface">{new Date(loss.date).toLocaleDateString('pt-BR')}</span>
              </div>
              
              <div className="col-span-1 md:col-span-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0">
                  <span className="material-symbols-outlined notranslate text-[20px]">inventory</span>
                </div>
                <span className="font-semibold text-sm text-on-surface">{loss.product.name}</span>
              </div>
              
              <div className="col-span-1 md:col-span-2 flex md:justify-center">
                <span className="bg-error-container text-on-error-container text-xs px-2.5 py-1 rounded-full font-bold">
                  {loss.reason}
                </span>
              </div>
              
              <div className="col-span-1 md:col-span-2 flex md:justify-end">
                <span className="text-sm font-bold text-on-surface">{loss.quantity} {loss.unit}</span>
              </div>

              <div className="col-span-1 md:col-span-2 flex md:justify-end">
                <span className="text-sm text-on-surface-variant">{loss.user.name?.split(' ')[0]}</span>
              </div>
            </div>
          ))}
          
          {losses.length === 0 && (
            <div className="px-6 py-12 text-center text-on-surface-variant text-sm flex flex-col items-center gap-2">
              <span className="material-symbols-outlined notranslate text-3xl text-secondary">check_circle</span>
              Nenhuma perda registrada.
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <h2 className="text-lg font-bold text-error flex items-center gap-2">
                <span className="material-symbols-outlined notranslate">delete_forever</span>
                Registrar Nova Perda
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-on-surface-variant hover:bg-surface-container p-1 rounded-full transition-colors">
                <span className="material-symbols-outlined notranslate">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-1 text-on-surface">Produto</label>
                <select 
                  required
                  value={formData.productId} 
                  onChange={e => setFormData({...formData, productId: e.target.value})}
                  className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  <option value="">Selecione...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-on-surface">Quantidade</label>
                  <input 
                    type="number" 
                    required min="0.1" step="0.1"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: e.target.value})}
                    className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-on-surface">Unid.</label>
                  <select 
                    value={formData.unit}
                    onChange={e => setFormData({...formData, unit: e.target.value})}
                    className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    <option value="UN">UN</option>
                    <option value="KG">KG</option>
                    <option value="L">L</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-on-surface">Motivo</label>
                <select 
                  value={formData.reason}
                  onChange={e => setFormData({...formData, reason: e.target.value})}
                  className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  <option value="VENCIMENTO">Vencimento</option>
                  <option value="DETERIORACAO">Deterioração</option>
                  <option value="QUEBRA">Quebra</option>
                  <option value="CONTAMINACAO">Contaminação</option>
                  <option value="OUTROS">Outros</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-1 text-on-surface">Observações</label>
                <textarea 
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  rows={2}
                  placeholder="Detalhes opcionais..."
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 font-bold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 bg-error text-on-error font-bold rounded-xl hover:opacity-90 transition-opacity">Confirmar Baixa</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
