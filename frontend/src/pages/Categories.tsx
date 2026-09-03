import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Pagination } from '../components/Pagination';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

interface Category {
  id: string;
  name: string;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const { activeBranch } = useAuth();

  const fetchData = async () => {
    if (!activeBranch) return;
    try {
      setLoading(true);
      const res = await api.get(`/categories?branchId=${activeBranch.id}&page=${page}&limit=10`);
      setCategories(res.data.data);
      setTotalPages(res.data.meta.totalPages);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar categorias.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeBranch, page]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, { name });
        toast.success('Categoria atualizada com sucesso');
      } else {
        await api.post('/categories', { name, branchId: activeBranch?.id });
        toast.success('Categoria criada com sucesso');
      }
      setIsModalOpen(false);
      setName('');
      setEditingId(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar categoria');
    }
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover esta categoria?')) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Categoria removida com sucesso');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao remover categoria');
    }
  };

  if (loading && activeBranch) return <div className="p-8 text-on-surface">Carregando categorias...</div>;
  if (!activeBranch) return <div className="p-8 text-on-surface">Selecione uma filial no topo para continuar.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Categorias</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Organize seus produtos na filial: {activeBranch.name}</p>
        </div>
        
        <button 
          onClick={() => {
            setEditingId(null);
            setName('');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:bg-primary-hover transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined notranslate text-[18px]">add</span>
          Nova Categoria
        </button>
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton />
          </div>
        ) : categories.length === 0 ? (
          <div className="px-6 py-12 text-center text-on-surface-variant text-sm flex flex-col items-center gap-2">
            <span className="material-symbols-outlined notranslate text-4xl text-outline mb-2">style</span>
            Nenhuma categoria cadastrada.
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="divide-y divide-outline-variant">
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-surface-container-low text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                <div className="col-span-10">Nome da Categoria</div>
                <div className="col-span-2 text-right">Ações</div>
              </div>

              {categories.map(cat => (
                <div key={cat.id} className="flex md:grid md:grid-cols-12 gap-4 px-6 py-4 hover:bg-surface-container-low transition-colors items-center justify-between border-b border-outline-variant md:border-0 last:border-0">
                  <div className="w-full md:col-span-10 flex items-center justify-between md:justify-start gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0">
                        <span className="material-symbols-outlined notranslate text-[20px]">sell</span>
                      </div>
                      <p className="font-semibold text-sm text-on-surface">{cat.name}</p>
                    </div>
                    
                    {/* Botões Ação (Mobile) */}
                    <div className="md:hidden flex justify-end gap-1 shrink-0">
                      <button 
                        onClick={() => handleEdit(cat)}
                        className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-container rounded-full transition-colors"
                        title="Editar"
                      >
                        <span className="material-symbols-outlined notranslate text-[20px]">edit</span>
                      </button>
                      <button 
                        onClick={() => handleDelete(cat.id)}
                        className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full transition-colors"
                        title="Remover"
                      >
                        <span className="material-symbols-outlined notranslate text-[20px]">delete</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Botões Ação (Desktop) */}
                  <div className="hidden md:flex md:col-span-2 justify-end gap-1">
                    <button 
                      onClick={() => handleEdit(cat)}
                      className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-container rounded-full transition-colors"
                      title="Editar"
                    >
                      <span className="material-symbols-outlined notranslate text-[20px]">edit</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(cat.id)}
                      className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full transition-colors"
                      title="Remover"
                    >
                      <span className="material-symbols-outlined notranslate text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-lowest">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined notranslate text-primary">{editingId ? 'edit_square' : 'add_box'}</span>
                {editingId ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-on-surface-variant hover:bg-surface-container p-1 rounded-full transition-colors">
                <span className="material-symbols-outlined notranslate">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">Nome</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Ex: Laticínios, Carnes..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:bg-primary-hover transition-colors shadow-sm"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
