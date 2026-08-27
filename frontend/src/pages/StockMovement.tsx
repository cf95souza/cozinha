import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { ArrowRightLeft, PackageCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Branch { id: string; name: string; }
interface Location { id: string; name: string; branchId: string | null; }
interface Product { id: string; name: string; unit: string; }

export default function StockMovement() {
  const [loading, setLoading] = useState(true);
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    originBranchId: '',
    originLocationId: '',
    destinationBranchId: '',
    destinationLocationId: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      // We load all branches and locations so the user can transfer between ANY branch they have access to
      const [brRes, locRes, prodRes] = await Promise.all([
        api.get('/branches'),
        api.get('/locations'),
        api.get('/products') // get all products
      ]);
      setBranches(brRes.data);
      setLocations(locRes.data.data || locRes.data);
      setProducts(prodRes.data.data || prodRes.data);
    } catch (err) {
      console.error('Erro ao carregar dados para movimentação', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        productId: formData.productId,
        quantity: Number(formData.quantity),
        originBranchId: formData.originBranchId || null,
        originLocationId: formData.originLocationId || null,
        destinationBranchId: formData.destinationBranchId || null,
        destinationLocationId: formData.destinationLocationId || null
      };

      if (!payload.originBranchId && !payload.destinationBranchId) {
        alert('Defina uma origem ou um destino!');
        return;
      }

      await api.post('/stock/transfer', payload);
      alert('Movimentação realizada com sucesso!');
      
      // Reset only quantity
      setFormData(prev => ({ ...prev, quantity: '' }));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao realizar movimentação');
    }
  };

  if (loading) return <div className="p-8 text-on-surface">Carregando formulário de transferência...</div>;

  const originLocations = locations.filter(l => l.branchId === formData.originBranchId);
  const destinationLocations = locations.filter(l => l.branchId === formData.destinationBranchId);
  const selectedProduct = products.find(p => p.id === formData.productId);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-display-sm font-section-title text-on-surface">Movimentação de Estoque</h1>
        <p className="text-body text-on-surface-variant mt-1">
          Transfira produtos entre filiais ou registre entradas/saídas manuais.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
        
        {/* Product Selection */}
        <div className="p-6 border-b border-outline-variant bg-surface-container-lowest">
          <label className="block text-sm font-metadata font-bold text-on-surface uppercase mb-2">Selecione o Produto *</label>
          <select 
            required 
            value={formData.productId} 
            onChange={e => setFormData({...formData, productId: e.target.value})} 
            className="w-full max-w-lg border-outline-variant rounded-md py-3 px-4 border bg-surface text-on-surface shadow-sm focus:ring-2 focus:ring-secondary"
          >
            <option value="">-- Escolha um produto --</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_auto_1fr] items-center p-8 gap-8">
          
          {/* ORIGEM */}
          <div className="space-y-4 bg-error-container/10 p-6 rounded-xl border border-error/20">
            <h3 className="font-section-title text-lg text-error font-bold flex items-center gap-2">
              <span className="material-symbols-outlined">outbox</span>
              Origem (Saída)
            </h3>
            
            <div>
              <label className="block text-sm font-metadata font-bold text-on-surface uppercase mb-1">Filial / Unidade</label>
              <select 
                value={formData.originBranchId} 
                onChange={e => setFormData({...formData, originBranchId: e.target.value, originLocationId: ''})} 
                className="w-full border-outline-variant rounded-md py-2.5 px-3 border bg-surface-container-lowest text-on-surface"
              >
                <option value="">-- Nenhuma (Entrada Externa) --</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            {formData.originBranchId && (
              <div>
                <label className="block text-sm font-metadata font-bold text-on-surface uppercase mb-1">Local de Armazenamento *</label>
                <select 
                  required
                  value={formData.originLocationId} 
                  onChange={e => setFormData({...formData, originLocationId: e.target.value})} 
                  className="w-full border-outline-variant rounded-md py-2.5 px-3 border bg-surface-container-lowest text-on-surface"
                >
                  <option value="">Selecione o local...</option>
                  {originLocations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* ICON */}
          <div className="hidden lg:flex justify-center items-center h-full text-outline">
            <ArrowRightLeft className="w-10 h-10" />
          </div>

          {/* DESTINO */}
          <div className="space-y-4 bg-primary-container/20 p-6 rounded-xl border border-primary/20">
            <h3 className="font-section-title text-lg text-primary font-bold flex items-center gap-2">
              <span className="material-symbols-outlined">move_to_inbox</span>
              Destino (Entrada)
            </h3>
            
            <div>
              <label className="block text-sm font-metadata font-bold text-on-surface uppercase mb-1">Filial / Unidade</label>
              <select 
                value={formData.destinationBranchId} 
                onChange={e => setFormData({...formData, destinationBranchId: e.target.value, destinationLocationId: ''})} 
                className="w-full border-outline-variant rounded-md py-2.5 px-3 border bg-surface-container-lowest text-on-surface"
              >
                <option value="">-- Nenhuma (Saída Externa / Perda) --</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            {formData.destinationBranchId && (
              <div>
                <label className="block text-sm font-metadata font-bold text-on-surface uppercase mb-1">Local de Armazenamento *</label>
                <select 
                  required
                  value={formData.destinationLocationId} 
                  onChange={e => setFormData({...formData, destinationLocationId: e.target.value})} 
                  className="w-full border-outline-variant rounded-md py-2.5 px-3 border bg-surface-container-lowest text-on-surface"
                >
                  <option value="">Selecione o local...</option>
                  {destinationLocations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-8 py-6 bg-surface-container-lowest border-t border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-metadata font-bold text-on-surface uppercase mb-1">Quantidade a movimentar *</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  step="0.01"
                  required
                  min="0.01"
                  value={formData.quantity} 
                  onChange={e => setFormData({...formData, quantity: e.target.value})} 
                  className="w-32 border-outline-variant rounded-md py-2 px-3 border bg-surface text-on-surface text-lg font-bold text-center" 
                  placeholder="0.00"
                />
                <span className="text-on-surface-variant font-bold">{selectedProduct?.unit || 'UN'}</span>
              </div>
            </div>
          </div>
          
          <button type="submit" className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-md active:scale-95">
            <PackageCheck className="w-6 h-6" />
            Confirmar Movimentação
          </button>
        </div>

      </form>
    </div>
  );
}
