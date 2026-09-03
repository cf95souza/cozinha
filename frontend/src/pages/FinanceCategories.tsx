import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function FinanceCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [type, setType] = useState('DESPESA');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = () => {
    api.get('/finance/categories').then(res => setCategories(res.data)).catch(console.error);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);
    try {
      await api.post('/finance/categories', { name, type });
      setName('');
      fetchCategories();
    } catch (err) {
      alert('Erro ao criar categoria');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir esta categoria?')) return;
    try {
      await api.delete(`/finance/categories/${id}`);
      fetchCategories();
    } catch (err) {
      alert('Erro ao excluir (Pode estar em uso)');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Plano de Contas</h1>
        <p className="text-sm text-on-surface-variant">Categorias de Receitas, Despesas e Custos.</p>
      </div>

      <div className="bg-surface p-6 rounded-2xl border border-outline-variant">
        <form onSubmit={handleCreate} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-1">Nome da Categoria</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border rounded-xl" placeholder="Ex: Aluguel, Vendas, Impostos..." required />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Tipo</label>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full px-4 py-2 border rounded-xl bg-white">
              <option value="RECEITA">Receita</option>
              <option value="DESPESA">Despesa Operacional</option>
              <option value="CUSTO">Custo (CMV/Fornecedor)</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:opacity-90">Adicionar</button>
        </form>
      </div>

      <div className="bg-surface rounded-2xl border border-outline-variant overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container-low">
            <tr>
              <th className="p-4">Nome</th>
              <th className="p-4">Tipo</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id} className="border-t border-outline-variant">
                <td className="p-4 font-semibold">{cat.name}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    cat.type === 'RECEITA' ? 'bg-green-100 text-green-700' : 
                    cat.type === 'DESPESA' ? 'bg-red-100 text-red-700' : 
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {cat.type}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => handleDelete(cat.id)} className="text-error hover:underline text-xs">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
