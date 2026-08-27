import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function Production() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [productions, setProductions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({
    recipeId: '',
    plannedQuantity: '',
    producedQuantity: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [recRes, prodRes] = await Promise.all([
        api.get('/recipes'),
        api.get('/productions')
      ]);
      setRecipes(recRes.data);
      setProductions(prodRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const selectedRecipe = recipes.find(r => r.id === form.recipeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/productions', form);
      alert('Produção registrada com sucesso! Estoque atualizado.');
      setForm({ recipeId: '', plannedQuantity: '', producedQuantity: '', notes: '' });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao registrar produção');
      setLoading(false);
    }
  };

  if (loading && recipes.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-on-surface-variant flex flex-col items-center gap-3">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
          <p className="text-sm">Carregando módulo de produção...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Cozinha / Produção</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Registre o que foi feito hoje para baixa automática no estoque.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Painel de Registro */}
        <div className="lg:col-span-1 bg-surface border border-outline-variant p-6 rounded-2xl h-fit">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-on-surface text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">skillet</span>
              Registrar Produção
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-1 text-on-surface">Ficha Técnica</label>
              <select 
                required 
                value={form.recipeId} 
                onChange={e => setForm({...form, recipeId: e.target.value})}
                className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="">Selecione...</option>
                {recipes.map(r => <option key={r.id} value={r.id}>{r.product.name}</option>)}
              </select>
            </div>

            {selectedRecipe && (
              <div className="p-4 bg-primary-container/30 rounded-xl border border-primary/20 text-sm">
                <p className="font-semibold text-primary mb-1">Rendimento Padrão: {selectedRecipe.expectedYield} {selectedRecipe.product.unit}</p>
                <p className="text-on-surface-variant text-xs">Os ingredientes serão descontados proporcionalmente.</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-on-surface">Qtd. Planejada</label>
                <input 
                  type="number" step="0.01" required disabled={!form.recipeId}
                  value={form.plannedQuantity} 
                  onChange={e => setForm({...form, plannedQuantity: e.target.value})}
                  className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                  placeholder="Ex: 10"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-on-surface">Qtd. Rendeu</label>
                <input 
                  type="number" step="0.01" required disabled={!form.recipeId}
                  value={form.producedQuantity} 
                  onChange={e => setForm({...form, producedQuantity: e.target.value})}
                  className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                  placeholder="Ex: 9.5"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-on-surface">Observações</label>
              <textarea 
                value={form.notes} disabled={!form.recipeId}
                onChange={e => setForm({...form, notes: e.target.value})}
                className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                placeholder="Ex: Sobrou algo, assou demais..."
                rows={2}
              ></textarea>
            </div>

            <button type="submit" disabled={!form.recipeId || loading} className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:hover:bg-primary">
              {loading ? 'Processando...' : 'Confirmar e Dar Baixa'}
            </button>
          </form>
        </div>

        {/* Histórico / Timeline */}
        <div className="lg:col-span-2 bg-surface border border-outline-variant rounded-2xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
            <h3 className="font-semibold text-on-surface text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">history</span>
              Produzidos Hoje
            </h3>
            <span className="text-xs bg-primary-container text-primary px-2 py-0.5 rounded-full font-semibold">
              {productions.length} itens
            </span>
          </div>

          <div className="p-6">
            {productions.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant text-sm flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-3xl text-secondary">check_circle</span>
                Nenhuma produção registrada hoje.
              </div>
            ) : (
              <div className="relative border-l border-outline-variant ml-3 space-y-6">
                {productions.map((prod, index) => {
                  const COLORS = ['bg-primary', 'bg-error', 'bg-tertiary', 'bg-secondary'];
                  const colorClass = COLORS[index % COLORS.length];

                  return (
                    <div key={prod.id} className="relative pl-6 hover:bg-surface-container-low transition-colors rounded-r-xl p-2 -my-2">
                      {/* Timeline Dot with Number */}
                      <div className={`absolute -left-3.5 top-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ring-4 ring-surface ${colorClass}`}>
                        {index + 1}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pl-2">
                        <div>
                          <h3 className="font-semibold text-sm text-on-surface">{prod.product.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-on-surface-variant">
                              Resp: {prod.user.name?.split(' ')[0]}
                            </p>
                            <span className="w-1 h-1 bg-outline rounded-full"></span>
                            <p className="text-xs text-on-surface-variant">
                              {new Date(prod.finishedAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-xs text-on-surface-variant font-medium">Produção Total</span>
                            <span className="font-extrabold text-base text-on-surface">
                              {prod.producedQuantity} {prod.product.unit}
                            </span>
                          </div>
                          {prod.yieldPercentage !== undefined && (
                            <div className="flex flex-col items-end w-20">
                              <span className="text-xs text-on-surface-variant font-medium">Rendimento</span>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 ${prod.yieldPercentage >= 100 ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'}`}>
                                {prod.yieldPercentage.toFixed(0)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
