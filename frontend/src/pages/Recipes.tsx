import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function Recipes() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    productId: '',
    expectedYield: '',
    preparationTime: '',
    instructions: '',
  });
  
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [recRes, prodRes] = await Promise.all([
        api.get('/recipes'),
        api.get('/products')
      ]);
      setRecipes(Array.isArray(recRes.data) ? recRes.data.filter((r: any) => r.product) : []);
      setProducts(prodRes.data.data || prodRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId || !form.expectedYield || items.length === 0) {
      alert('Preencha os campos obrigatórios e adicione ao menos um ingrediente.');
      return;
    }
    
    try {
      await api.post('/recipes', {
        ...form,
        expectedYield: Number(form.expectedYield),
        preparationTime: form.preparationTime ? Number(form.preparationTime) : null,
        items
      });
      setIsModalOpen(false);
      setForm({ productId: '', expectedYield: '', preparationTime: '', instructions: '' });
      setItems([]);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar ficha técnica');
    }
  };

  const addIngredientRow = () => {
    setItems([...items, { ingredientId: '', quantity: '' }]);
  };

  const removeIngredientRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  if (loading) return (
    <div className="p-12 text-center flex flex-col items-center gap-3 text-on-surface-variant">
      <span className="material-symbols-outlined notranslate animate-spin text-4xl">sync</span>
      <span className="text-sm font-semibold">Carregando fichas técnicas...</span>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Fichas Técnicas</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Crie receitas para padronizar o rendimento e dar baixa automática no estoque.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary-hover transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined notranslate text-[20px]">add</span>
          Nova Ficha
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {recipes.map(recipe => (
          <div key={recipe.id} className="bg-surface border border-outline-variant rounded-2xl shadow-sm flex flex-col relative overflow-hidden hover:border-primary/30 transition-colors group">
             <div className="absolute -right-4 -top-4 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-500">
              <span className="material-symbols-outlined notranslate text-9xl">menu_book</span>
            </div>
            
            <div className="p-6 pb-4 border-b border-outline-variant z-10 flex flex-col gap-1">
              <h3 className="font-bold text-lg text-on-surface leading-tight line-clamp-2 min-h-[2.5rem] flex items-center">{recipe.product.name}</h3>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-low border border-outline-variant rounded-md w-max mt-2">
                <span className="material-symbols-outlined notranslate text-[14px] text-on-surface-variant">scale</span>
                <span className="text-xs font-bold text-on-surface">Rende {recipe.expectedYield} {recipe.product.unit}</span>
              </div>
            </div>
            
            <div className="p-6 pt-4 flex-1 z-10 flex flex-col bg-surface-container-lowest">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center justify-between">
                <span>Ingredientes</span>
                <span className="bg-surface-container-low px-1.5 py-0.5 rounded text-on-surface">{recipe.items.length}</span>
              </p>
              
              <ul className="space-y-2 flex-1">
                {recipe.items.map((item: any) => (
                  <li key={item.id} className="text-sm flex justify-between items-start gap-2 border-b border-outline-variant/30 pb-2 last:border-0 last:pb-0">
                    <span className="text-on-surface line-clamp-2">{item.ingredient.name}</span>
                    <span className="font-bold text-on-surface-variant shrink-0">{item.quantity} {item.ingredient.unit}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {recipe.nutrition && (
              <div className="p-4 bg-surface-container-low border-t border-outline-variant z-10">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-bold text-on-surface uppercase tracking-wider">Informação Nutricional</h4>
                  <span className="text-[9px] text-on-surface-variant bg-surface border border-outline-variant px-1.5 py-0.5 rounded">Porção / 100g</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <div className="flex justify-between items-center"><span className="text-on-surface-variant">Calorias</span><span className="font-bold text-on-surface">{recipe.nutrition.perPortion.calories} kcal</span></div>
                  <div className="flex justify-between items-center"><span className="text-on-surface-variant">Carboidratos</span><span className="font-bold text-on-surface">{recipe.nutrition.perPortion.carbohydrates} g</span></div>
                  <div className="flex justify-between items-center"><span className="text-on-surface-variant">Proteínas</span><span className="font-bold text-on-surface">{recipe.nutrition.perPortion.proteins} g</span></div>
                  <div className="flex justify-between items-center"><span className="text-on-surface-variant">Gorduras</span><span className="font-bold text-on-surface">{recipe.nutrition.perPortion.fats} g</span></div>
                  <div className="flex justify-between items-center col-span-2 border-t border-outline-variant/50 pt-1.5 mt-0.5">
                     <span className="text-on-surface-variant">Sódio</span><span className="font-bold text-on-surface">{recipe.nutrition.perPortion.sodium} mg</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {recipes.length === 0 && (
          <div className="col-span-full p-16 text-center text-on-surface-variant bg-surface rounded-2xl shadow-sm border border-outline-variant border-dashed flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined notranslate text-5xl opacity-50">menu_book</span>
            <div>
              <p className="font-bold text-lg text-on-surface">Nenhuma ficha técnica cadastrada</p>
              <p className="text-sm mt-1">Crie a primeira receita para iniciar o controle.</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="mt-2 text-primary font-bold hover:underline"
            >
              Criar Nova Ficha
            </button>
          </div>
        )}
      </div>

      {/* Modal Nova Ficha */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-surface w-full max-w-2xl rounded-2xl shadow-xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-on-surface">Criar Ficha Técnica</h2>
                <p className="text-xs text-on-surface-variant mt-1">Define os ingredientes e rendimento de um produto fabricado.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined notranslate text-[20px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-on-surface">Produto Produzido <span className="text-error">*</span></label>
                  <select 
                    required 
                    value={form.productId} 
                    onChange={e => setForm({...form, productId: e.target.value})}
                    className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="">Selecione...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-on-surface">Rendimento Esperado <span className="text-error">*</span></label>
                  <input 
                    type="number" step="0.01" required
                    value={form.expectedYield} 
                    onChange={e => setForm({...form, expectedYield: e.target.value})}
                    placeholder="Ex: 5"
                    className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
                  <div>
                    <label className="block text-sm font-semibold text-on-surface">Ingredientes Necessários <span className="text-error">*</span></label>
                    <p className="text-xs text-on-surface-variant">Matéria-prima consumida para este rendimento</p>
                  </div>
                  <button type="button" onClick={addIngredientRow} className="text-sm text-primary font-bold flex items-center gap-1 hover:bg-primary-container px-3 py-1.5 rounded-lg transition-colors">
                    <span className="material-symbols-outlined notranslate text-[18px]">add</span> Adicionar
                  </button>
                </div>
                
                {items.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-outline-variant rounded-xl bg-surface-container-lowest flex flex-col items-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined notranslate text-3xl opacity-50">kitchen</span>
                    <p className="text-sm">Adicione pelo menos um ingrediente para compor a ficha técnica.</p>
                    <button type="button" onClick={addIngredientRow} className="text-primary font-bold text-sm hover:underline mt-1">Adicionar Ingrediente</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div key={index} className="flex gap-2 items-center bg-surface-container-lowest p-2 rounded-xl border border-outline-variant">
                        <select 
                          required
                          value={item.ingredientId}
                          onChange={e => updateItem(index, 'ingredientId', e.target.value)}
                          className="flex-1 px-3 py-2 border border-outline-variant rounded-lg bg-surface text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        >
                           <option value="">Selecione o ingrediente...</option>
                           {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <input 
                          type="number" step="0.001" required
                          value={item.quantity}
                          onChange={e => updateItem(index, 'quantity', e.target.value)}
                          placeholder="Qtd (Ex: 0.5)"
                          className="w-28 px-3 py-2 border border-outline-variant rounded-lg bg-surface text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                        <button type="button" onClick={() => removeIngredientRow(index)} className="w-9 h-9 flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container rounded-lg transition-colors shrink-0">
                          <span className="material-symbols-outlined notranslate text-[18px]">delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-outline-variant mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 font-bold text-on-surface border border-outline-variant rounded-xl hover:bg-surface-container transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow-sm hover:bg-primary-hover transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined notranslate text-[18px]">save</span>
                  Salvar Ficha Técnica
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
