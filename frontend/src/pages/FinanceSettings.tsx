import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Settings, Plus, Building2, Tag, ArrowRightLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FinanceSettings() {
  const [activeTab, setActiveTab] = useState<'costCenter' | 'type' | 'origin'>('costCenter');
  
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [origins, setOrigins] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [resCC, resTypes, resOrigins] = await Promise.all([
        api.get('/finance/cost-centers'),
        api.get('/finance/invoice-types'),
        api.get('/finance/invoice-origins'),
      ]);
      setCostCenters(resCC.data);
      setTypes(resTypes.data);
      setOrigins(resOrigins.data);
    } catch (err) {
      toast.error('Erro ao carregar parâmetros financeiros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    
    setSaving(true);
    try {
      if (activeTab === 'costCenter') {
        await api.post('/finance/cost-centers', { name: newItemName });
      } else if (activeTab === 'type') {
        await api.post('/finance/invoice-types', { name: newItemName });
      } else {
        await api.post('/finance/invoice-origins', { name: newItemName });
      }
      toast.success('Adicionado com sucesso!');
      setNewItemName('');
      fetchData();
    } catch (error) {
      toast.error('Erro ao salvar item');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-on-surface">Carregando parâmetros...</div>;

  const currentList = activeTab === 'costCenter' ? costCenters : activeTab === 'type' ? types : origins;
  const currentTitle = activeTab === 'costCenter' ? 'Centros de Custo' : activeTab === 'type' ? 'Tipos de Nota' : 'Origens de Nota';
  const currentDesc = activeTab === 'costCenter' ? 'Cadastre os centros de custo (ex: Administrativo, Operacional, Compartilhado)' : activeTab === 'type' ? 'Tipos de despesa (ex: Material de venda, Energia, Aluguel)' : 'Origem das despesas cadastradas';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-fade-in">
      <div>
        <h1 className="text-display-sm font-section-title text-on-surface">Parâmetros Financeiros</h1>
        <p className="text-body text-on-surface-variant mt-1">Configure Centros de Custo e Classificações para Notas Fiscais de Consumo.</p>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-outline-variant overflow-hidden">
        <div className="flex border-b border-outline-variant bg-surface-container-lowest">
          <button
            onClick={() => setActiveTab('costCenter')}
            className={`flex-1 py-4 px-6 text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${activeTab === 'costCenter' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:bg-surface-variant/50'}`}
          >
            <Building2 className="w-5 h-5" /> Centros de Custo
          </button>
          <button
            onClick={() => setActiveTab('type')}
            className={`flex-1 py-4 px-6 text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${activeTab === 'type' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:bg-surface-variant/50'}`}
          >
            <Tag className="w-5 h-5" /> Tipos de Nota
          </button>
          <button
            onClick={() => setActiveTab('origin')}
            className={`flex-1 py-4 px-6 text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${activeTab === 'origin' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:bg-surface-variant/50'}`}
          >
            <ArrowRightLeft className="w-5 h-5" /> Origens de Nota
          </button>
        </div>

        <div className="p-6">
          <h2 className="text-lg font-bold text-on-surface mb-1">{currentTitle}</h2>
          <p className="text-sm text-on-surface-variant mb-6">{currentDesc}</p>

          <form onSubmit={handleAddItem} className="flex gap-4 mb-8">
            <input 
              type="text"
              required
              placeholder="Digite o nome..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="flex-1 px-4 py-2 border border-outline-variant rounded-xl bg-surface-container focus:ring-2 focus:ring-primary outline-none"
            />
            <button 
              type="submit" 
              disabled={saving}
              className="px-6 py-2 bg-primary text-on-primary rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              Adicionar
            </button>
          </form>

          <div className="space-y-3">
            {currentList.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant bg-surface-container rounded-xl border border-outline-variant border-dashed">
                Nenhum item cadastrado.
              </div>
            ) : (
              currentList.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant rounded-xl">
                  <span className="font-semibold text-on-surface">{item.name}</span>
                  <span className="text-xs bg-success-container text-on-success-container px-2 py-1 rounded-full font-bold">ATIVO</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
