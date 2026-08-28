import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Pagination } from '../components/Pagination';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

interface Location {
  id: string;
  name: string;
  type?: string;
  minTemperature?: number;
  maxTemperature?: number;
  capacity?: number;
}

export default function Locations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Location>>({ type: 'DRY' });
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const { activeBranch } = useAuth();

  const fetchData = async () => {
    if (!activeBranch) return;
    try {
      setLoading(true);
      const res = await api.get(`/locations?branchId=${activeBranch.id}&page=${page}&limit=10`);
      setLocations(res.data.data);
      setTotalPages(res.data.meta.totalPages);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar locais.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeBranch, page]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let val: any = value;
    if (type === 'number') val = value ? Number(value) : undefined;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/locations/${editingId}`, formData);
        toast.success('Local atualizado com sucesso');
      } else {
        await api.post('/locations', { ...formData, branchId: activeBranch?.id });
        toast.success('Local criado com sucesso');
      }
      setIsModalOpen(false);
      setFormData({ type: 'DRY' });
      setEditingId(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar local');
    }
  };

  const handleEdit = (loc: Location) => {
    setEditingId(loc.id);
    setFormData({
      name: loc.name,
      type: loc.type || 'DRY',
      minTemperature: loc.minTemperature,
      maxTemperature: loc.maxTemperature,
      capacity: loc.capacity
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este local?')) return;
    try {
      await api.delete(`/locations/${id}`);
      toast.success('Local removido com sucesso');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao remover local');
    }
  };

  if (loading && activeBranch) return <div className="p-8 text-on-surface">Carregando locais...</div>;
  if (!activeBranch) return <div className="p-8 text-on-surface">Selecione uma filial no topo para continuar.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Locais de Armazenamento</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Organize as prateleiras e câmaras da filial: {activeBranch.name}</p>
        </div>
        
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({ type: 'DRY' });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:bg-primary-hover transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined notranslate text-[18px]">add</span>
          Novo Local
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
        ) : locations.length === 0 ? (
          <div className="px-6 py-12 text-center text-on-surface-variant text-sm flex flex-col items-center gap-2">
            <span className="material-symbols-outlined notranslate text-4xl text-outline mb-2">shelves</span>
            Nenhum local cadastrado.
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="divide-y divide-outline-variant">
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-surface-container-low text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                <div className="col-span-5">Nome do Local</div>
                <div className="col-span-3">Tipo</div>
                <div className="col-span-2 text-center">Temp (Mín/Máx)</div>
                <div className="col-span-2 text-right">Ações</div>
              </div>

              {locations.map(loc => (
                <div key={loc.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 hover:bg-surface-container-low transition-colors items-center">
                  <div className="col-span-1 md:col-span-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0">
                      <span className="material-symbols-outlined notranslate text-[20px]">pin_drop</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-on-surface">{loc.name}</p>
                      {loc.capacity && <p className="text-xs text-on-surface-variant mt-0.5">Capacidade: {loc.capacity}</p>}
                    </div>
                  </div>
                  
                  <div className="col-span-1 md:col-span-3">
                    <span className="text-sm font-semibold text-on-surface-variant">{loc.type}</span>
                  </div>
                  
                  <div className="col-span-1 md:col-span-2 flex md:justify-center">
                    {loc.minTemperature != null || loc.maxTemperature != null ? (
                      <span className="text-xs font-semibold bg-surface-container text-on-surface-variant px-2.5 py-1 rounded-full">
                        {loc.minTemperature ?? '?'}° / {loc.maxTemperature ?? '?'}°
                      </span>
                    ) : (
                      <span className="text-xs text-on-surface-variant">-</span>
                    )}
                  </div>
                  
                  <div className="col-span-1 md:col-span-2 flex justify-end gap-1">
                    <button 
                      onClick={() => handleEdit(loc)}
                      className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-container rounded-full transition-colors"
                      title="Editar"
                    >
                      <span className="material-symbols-outlined notranslate text-[20px]">edit</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(loc.id)}
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
                {editingId ? 'Editar Local' : 'Novo Local'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-on-surface-variant hover:bg-surface-container p-1 rounded-full transition-colors">
                <span className="material-symbols-outlined notranslate">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">Nome *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Ex: Câmara Fria, Estoque Seco..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">Tipo de Local</label>
                <select name="type" value={formData.type || 'DRY'} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
                  <option value="DRY">Estoque Seco</option>
                  <option value="COLD">Refrigerador</option>
                  <option value="FREEZER">Congelador</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1">Temp. Mín (°C)</label>
                  <input type="number" step="0.1" name="minTemperature" value={formData.minTemperature || ''} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1">Temp. Máx (°C)</label>
                  <input type="number" step="0.1" name="maxTemperature" value={formData.maxTemperature || ''} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">Capacidade</label>
                <input type="number" name="capacity" value={formData.capacity || ''} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Ex: 50" />
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
