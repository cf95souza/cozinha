import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Store, Plus, Trash2, Edit2, MapPin } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  tradeName?: string;
  document?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  managerName?: string;
  type: string;
  status: string;
}

export default function Branches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<Partial<Branch>>({ type: 'RESTAURANTE', status: 'ATIVO' });

  const fetchBranches = async () => {
    try {
      const response = await api.get('/branches');
      setBranches(response.data);
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar unidades.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData(branch);
    } else {
      setEditingBranch(null);
      setFormData({ type: 'RESTAURANTE', status: 'ATIVO' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBranch) {
        await api.put(`/branches/${editingBranch.id}`, formData);
      } else {
        await api.post('/branches', formData);
      }
      setIsModalOpen(false);
      fetchBranches();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao salvar unidade.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover esta unidade?')) return;
    try {
      await api.delete(`/branches/${id}`);
      fetchBranches();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao excluir unidade.');
    }
  };

  if (loading) return <div className="p-8 text-on-surface">Carregando unidades...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-display-sm font-section-title text-on-surface">Gestão de Filiais</h1>
          <p className="text-body text-on-surface-variant mt-1">Gerencie as unidades, cozinhas e centros de distribuição.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-primary text-on-primary px-6 py-2.5 rounded-md font-bold hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" /> Nova Unidade
        </button>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-outline-variant overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-variant text-on-surface-variant text-sm font-metadata uppercase border-b border-outline-variant">
              <th className="py-4 px-6 font-bold">Unidade</th>
              <th className="py-4 px-6 font-bold hidden md:table-cell">Tipo</th>
              <th className="py-4 px-6 font-bold hidden lg:table-cell">Endereço</th>
              <th className="py-4 px-6 font-bold hidden md:table-cell">Gerente</th>
              <th className="py-4 px-6 font-bold w-32 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {branches.map(branch => (
              <tr key={branch.id} className="hover:bg-surface-container-lowest transition-colors">
                <td className="py-4 px-6">
                  <div className="font-bold text-on-surface flex items-center gap-2">
                    <Store className="w-4 h-4 text-primary" />
                    {branch.name}
                  </div>
                  {branch.document && <div className="text-xs text-on-surface-variant mt-1">CNPJ: {branch.document}</div>}
                </td>
                <td className="py-4 px-6 hidden md:table-cell">
                  <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold uppercase">
                    {branch.type || 'RESTAURANTE'}
                  </span>
                </td>
                <td className="py-4 px-6 hidden lg:table-cell">
                  {branch.city ? (
                    <div className="flex items-center gap-1 text-sm text-on-surface-variant">
                      <MapPin className="w-4 h-4" /> {branch.city} - {branch.state}
                    </div>
                  ) : '-'}
                </td>
                <td className="py-4 px-6 hidden md:table-cell text-sm text-on-surface">
                  {branch.managerName || '-'}
                </td>
                <td className="py-4 px-6 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => handleOpenModal(branch)}
                      className="text-primary hover:bg-primary-container p-2 rounded-full transition-colors"
                      title="Editar Unidade"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(branch.id)}
                      className="text-error hover:bg-error-container p-2 rounded-full transition-colors"
                      title="Remover Unidade"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {branches.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-on-surface-variant">
                  Nenhuma unidade cadastrada. Adicione sua primeira filial acima.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <Store className="w-6 h-6 text-primary" />
                {editingBranch ? 'Editar Unidade' : 'Nova Unidade'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-on-surface-variant hover:text-on-surface font-bold text-xl">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="branch-form" onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-metadata font-bold text-on-surface mb-1">Nome da Unidade *</label>
                  <input required type="text" name="name" value={formData.name || ''} onChange={handleChange} className="w-full border-outline-variant rounded-md py-2 px-3 border bg-surface text-on-surface focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-metadata font-bold text-on-surface mb-1">Tipo</label>
                  <select name="type" value={formData.type || 'RESTAURANTE'} onChange={handleChange} className="w-full border-outline-variant rounded-md py-2 px-3 border bg-surface text-on-surface focus:ring-2 focus:ring-primary">
                    <option value="RESTAURANTE">Restaurante</option>
                    <option value="COZINHA_CENTRAL">Cozinha Central</option>
                    <option value="CENTRO_DISTRIBUICAO">Centro de Distribuição</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-metadata font-bold text-on-surface mb-1">CNPJ</label>
                  <input type="text" name="document" value={formData.document || ''} onChange={handleChange} className="w-full border-outline-variant rounded-md py-2 px-3 border bg-surface text-on-surface focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-metadata font-bold text-on-surface mb-1">Telefone</label>
                  <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full border-outline-variant rounded-md py-2 px-3 border bg-surface text-on-surface focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-metadata font-bold text-on-surface mb-1">E-mail</label>
                  <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="w-full border-outline-variant rounded-md py-2 px-3 border bg-surface text-on-surface focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-metadata font-bold text-on-surface mb-1">Nome do Gerente</label>
                  <input type="text" name="managerName" value={formData.managerName || ''} onChange={handleChange} className="w-full border-outline-variant rounded-md py-2 px-3 border bg-surface text-on-surface focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-metadata font-bold text-on-surface mb-1">Cidade</label>
                  <input type="text" name="city" value={formData.city || ''} onChange={handleChange} className="w-full border-outline-variant rounded-md py-2 px-3 border bg-surface text-on-surface focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-metadata font-bold text-on-surface mb-1">Estado</label>
                  <input type="text" name="state" value={formData.state || ''} onChange={handleChange} className="w-full border-outline-variant rounded-md py-2 px-3 border bg-surface text-on-surface focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-metadata font-bold text-on-surface mb-1">CEP</label>
                  <input type="text" name="zipCode" value={formData.zipCode || ''} onChange={handleChange} className="w-full border-outline-variant rounded-md py-2 px-3 border bg-surface text-on-surface focus:ring-2 focus:ring-primary" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-metadata font-bold text-on-surface mb-1">Endereço Completo</label>
                  <input type="text" name="address" value={formData.address || ''} onChange={handleChange} className="w-full border-outline-variant rounded-md py-2 px-3 border bg-surface text-on-surface focus:ring-2 focus:ring-primary" />
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-outline-variant flex justify-end gap-3 bg-surface-container-lowest">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-bold text-on-surface-variant hover:bg-surface-variant rounded-md transition-colors">
                Cancelar
              </button>
              <button type="submit" form="branch-form" className="px-6 py-2 bg-primary text-on-primary font-bold rounded-md hover:bg-primary/90 transition-colors">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
