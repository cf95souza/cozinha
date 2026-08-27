import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Pagination } from '../components/Pagination';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

interface Supplier {
  id: string;
  name: string;
  tradeName: string | null;
  document: string | null;
  contact: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  website: string | null;
  paymentTerms: string | null;
  deliveryDays: number | null;
  minimumOrder: number | null;
  notes: string | null;
  rating: number | null;
  status: string;
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const initialFormState = { 
    name: '', tradeName: '', document: '', contact: '', phone: '', email: '',
    address: '', city: '', state: '', zipCode: '', website: '',
    paymentTerms: '', deliveryDays: '', minimumOrder: '', notes: '', rating: '', status: 'ATIVO' 
  };
  const [formData, setFormData] = useState<any>(initialFormState);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const { activeBranch } = useAuth();
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = async () => {
    if (!activeBranch) return;
    try {
      setLoading(true);
      const res = await api.get(`/suppliers?branchId=${activeBranch.id}&page=${page}&limit=10`);
      setSuppliers(res.data.data);
      setTotalPages(res.data.meta.totalPages);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar fornecedores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeBranch, page]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let val: any = value;
    if (type === 'number') val = value ? Number(value) : undefined;
    setFormData((prev: any) => ({ ...prev, [name]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData, branchId: activeBranch?.id };
      
      if (editingId) {
        await api.put(`/suppliers/${editingId}`, payload);
        toast.success('Fornecedor atualizado com sucesso');
      } else {
        await api.post('/suppliers', payload);
        toast.success('Fornecedor criado com sucesso');
      }
      setIsModalOpen(false);
      setFormData(initialFormState);
      setEditingId(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar fornecedor');
    }
  };

  const handleEdit = (sup: Supplier) => {
    setEditingId(sup.id);
    setFormData({
      name: sup.name, tradeName: sup.tradeName || '', document: sup.document || '', contact: sup.contact || '',
      phone: sup.phone || '', email: sup.email || '', address: sup.address || '', city: sup.city || '',
      state: sup.state || '', zipCode: sup.zipCode || '', website: sup.website || '',
      paymentTerms: sup.paymentTerms || '', deliveryDays: sup.deliveryDays || '',
      minimumOrder: sup.minimumOrder || '', notes: sup.notes || '', rating: sup.rating || '',
      status: sup.status || 'ATIVO'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este fornecedor?')) return;
    try {
      await api.delete(`/suppliers/${id}`);
      toast.success('Fornecedor removido com sucesso');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao remover fornecedor');
    }
  };

  if (loading && activeBranch) return <div className="p-8 text-on-surface">Carregando fornecedores...</div>;
  if (!activeBranch) return <div className="p-8 text-on-surface">Selecione uma filial no topo para continuar.</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Fornecedores</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Gerencie os fornecedores da filial: {activeBranch.name}</p>
        </div>
        
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData(initialFormState);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:bg-primary-hover transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Novo Fornecedor
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
        ) : suppliers.length === 0 ? (
          <div className="px-6 py-12 text-center text-on-surface-variant text-sm flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-4xl text-outline mb-2">local_shipping</span>
            Nenhum fornecedor cadastrado.
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="divide-y divide-outline-variant">
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-surface-container-low text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                <div className="col-span-4">Fornecedor</div>
                <div className="col-span-3">Contato</div>
                <div className="col-span-3">Condições / Avaliação</div>
                <div className="col-span-2 text-right">Ações</div>
              </div>

              {suppliers.map(sup => (
                <div key={sup.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 hover:bg-surface-container-low transition-colors items-center">
                  <div className="col-span-1 md:col-span-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0">
                      <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-on-surface">{sup.name}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">CNPJ: {sup.document || '-'}</p>
                    </div>
                  </div>
                  
                  <div className="col-span-1 md:col-span-3">
                    <p className="font-semibold text-sm text-on-surface">{sup.contact || '-'}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{sup.phone || sup.email || '-'}</p>
                  </div>
                  
                  <div className="col-span-1 md:col-span-3">
                    {sup.paymentTerms && <p className="text-xs text-on-surface-variant mb-1.5 font-medium">Pgto: {sup.paymentTerms}</p>}
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(star => (
                        <span key={star} className={`material-symbols-outlined text-[16px] ${star <= (sup.rating || 0) ? 'text-[#eab308]' : 'text-outline-variant'}`} style={{ fontVariationSettings: star <= (sup.rating || 0) ? "'FILL' 1" : "'FILL' 0" }}>
                          star
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="col-span-1 md:col-span-2 flex justify-end gap-1">
                    <button 
                      onClick={() => handleEdit(sup)}
                      className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-container rounded-full transition-colors"
                      title="Editar"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(sup.id)}
                      className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full transition-colors"
                      title="Remover"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
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
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">{editingId ? 'edit_square' : 'add_box'}</span>
                {editingId ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-on-surface-variant hover:bg-surface-container p-1 rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="overflow-y-auto p-6">
              <form id="supplierForm" onSubmit={handleSave} className="space-y-6">
                
                {/* Dados Cadastrais */}
                <div>
                  <h4 className="text-sm font-bold text-primary mb-4 border-b border-outline-variant pb-2 uppercase tracking-wider">Dados Cadastrais</h4>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-on-surface mb-1">Razão Social *</label>
                      <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-on-surface mb-1">Nome Fantasia</label>
                      <input type="text" name="tradeName" value={formData.tradeName} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-on-surface mb-1">CNPJ/CPF</label>
                      <input type="text" name="document" value={formData.document} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                  </div>
                </div>

                {/* Contato & Endereço */}
                <div>
                  <h4 className="text-sm font-bold text-primary mb-4 border-b border-outline-variant pb-2 uppercase tracking-wider">Contato & Endereço</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-on-surface mb-1">Pessoa de Contato</label>
                      <input type="text" name="contact" value={formData.contact} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-on-surface mb-1">Telefone</label>
                      <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-on-surface mb-1">E-mail</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div className="col-span-2 md:col-span-3">
                      <label className="block text-sm font-semibold text-on-surface mb-1">Endereço Completo</label>
                      <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-on-surface mb-1">Cidade</label>
                      <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-on-surface mb-1">Estado</label>
                      <input type="text" name="state" value={formData.state} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                  </div>
                </div>

                {/* Condições Comerciais */}
                <div>
                  <h4 className="text-sm font-bold text-primary mb-4 border-b border-outline-variant pb-2 uppercase tracking-wider">Condições Comerciais</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-on-surface mb-1">Condições de Pagamento</label>
                      <input type="text" name="paymentTerms" value={formData.paymentTerms} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Ex: Boleto 30/60 dias" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-on-surface mb-1">Prazo Entrega (Dias)</label>
                      <input type="number" name="deliveryDays" value={formData.deliveryDays} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-on-surface mb-1">Pedido Mínimo (R$)</label>
                      <input type="number" step="0.01" name="minimumOrder" value={formData.minimumOrder} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div className="col-span-2 md:col-span-4 flex items-center gap-4 p-4 bg-surface-container-low border border-outline-variant rounded-xl mt-2">
                      <label className="block text-sm font-semibold text-on-surface mb-1 mb-0 whitespace-nowrap">Avaliação Interna (1-5)</label>
                      <input type="range" name="rating" min="1" max="5" value={formData.rating || 5} onChange={handleChange} className="flex-1 accent-primary" />
                      <span className="font-bold text-primary text-lg px-2">{formData.rating || 5} / 5</span>
                    </div>
                    <div className="col-span-2 md:col-span-4">
                      <label className="block text-sm font-semibold text-on-surface mb-1">Observações</label>
                      <textarea name="notes" rows={2} value={formData.notes} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"></textarea>
                    </div>
                  </div>
                </div>

              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-lowest flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">
                Cancelar
              </button>
              <button type="submit" form="supplierForm" className="px-6 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:bg-primary-hover transition-colors shadow-sm">
                Salvar Fornecedor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
