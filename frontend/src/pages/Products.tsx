import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Pagination } from '../components/Pagination';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  description: string | null;
  unit: string;
  brand: string | null;
  minStock: number;
  maxStock: number;
  controlled: boolean;
  temperatureControlled: boolean;
  minTemperature: number | null;
  maxTemperature: number | null;
  categoryId: string;
  category?: { name: string };
  locationId: string | null;
  location?: { name: string };
  supplierId: string | null;
  supplier?: { name: string };
  defaultExpirationDays: number | null;
  conservationMethod: string | null;
  sifCode: string | null;
  ncmCode: string | null;
  sellPrice: number | null;
  costPrice: number | null;
  marginPercentage: number | null;
  weight: number | null;
  packageWeight: number | null;
  notes: string | null;
  abcClass: string | null;
  isComposite: boolean;
  yieldPercentage: number | null;
}

interface Category { id: string; name: string; }
interface Location { id: string; name: string; }
interface Supplier { id: string; name: string; }

export default function Products() {
  const { activeBranch } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'commercial' | 'specs' | 'stock' | 'rules'>('basic');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const initialFormState = {
    name: '', sku: '', barcode: '', description: '', unit: 'Unidade', brand: '', abcClass: '', isComposite: false, photoUrl: '',
    categoryId: '', supplierId: '', locationId: '',
    sellPrice: '', costPrice: '', marginPercentage: '', sifCode: '', ncmCode: '',
    weight: '', packageWeight: '', yieldPercentage: '', notes: '',
    minStock: 0, maxStock: 0,
    controlled: false, temperatureControlled: false,
    minTemperature: '', maxTemperature: '', defaultExpirationDays: '', conservationMethod: ''
  };

  const [formData, setFormData] = useState<any>(initialFormState);

  const loadData = async () => {
    if (!activeBranch) return;
    try {
      setLoading(true);
      const [prodRes, catRes, locRes, supRes] = await Promise.all([
        api.get(`/products?branchId=${activeBranch.id}&page=${page}&limit=10`),
        api.get(`/categories?branchId=${activeBranch.id}&limit=100`),
        api.get(`/locations?branchId=${activeBranch.id}&limit=100`),
        api.get(`/suppliers?branchId=${activeBranch.id}&limit=100`)
      ]);
      setProducts(prodRes.data.data);
      setTotalPages(prodRes.data.meta.totalPages);
      setCategories(catRes.data.data || catRes.data);
      setLocations(locRes.data.data || locRes.data);
      setSuppliers(supRes.data.data || supRes.data);
    } catch (err) {
      console.error('Erro ao carregar dados', err);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeBranch, page]);

  const resetForm = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setActiveTab('basic');
  };

  const openNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setFormData({
      ...initialFormState,
      name: p.name, sku: p.sku || '', barcode: p.barcode || '', description: p.description || '',
      unit: p.unit, brand: p.brand || '', abcClass: p.abcClass || '', isComposite: p.isComposite,
      categoryId: p.categoryId, supplierId: p.supplierId || '', locationId: p.locationId || '',
      sellPrice: p.sellPrice?.toString() || '', costPrice: p.costPrice?.toString() || '',
      marginPercentage: p.marginPercentage?.toString() || '', sifCode: p.sifCode || '', ncmCode: p.ncmCode || '',
      weight: p.weight?.toString() || '', packageWeight: p.packageWeight?.toString() || '',
      yieldPercentage: p.yieldPercentage?.toString() || '', notes: p.notes || '',
      minStock: p.minStock, maxStock: p.maxStock,
      controlled: p.controlled, temperatureControlled: p.temperatureControlled,
      minTemperature: p.minTemperature?.toString() || '', maxTemperature: p.maxTemperature?.toString() || '',
      defaultExpirationDays: p.defaultExpirationDays?.toString() || '', conservationMethod: p.conservationMethod || ''
    });
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este produto?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Produto excluído com sucesso');
      loadData();
    } catch (err) {
      toast.error('Erro ao excluir produto');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    if (type === 'checkbox') finalValue = (e.target as HTMLInputElement).checked;
    setFormData((prev: any) => ({ ...prev, [name]: finalValue }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { ...formData, branchId: activeBranch?.id };
      
      // Convert numbers
      ['minTemperature', 'maxTemperature', 'sellPrice', 'costPrice', 'marginPercentage', 'weight', 'packageWeight', 'yieldPercentage', 'defaultExpirationDays'].forEach(field => {
        payload[field] = formData[field] === '' ? null : Number(formData[field]);
      });
      payload.minStock = formData.minStock === '' ? 0 : Number(formData.minStock);
      payload.maxStock = formData.maxStock === '' ? 0 : Number(formData.maxStock);
      payload.supplierId = formData.supplierId || null;
      payload.locationId = formData.locationId || null;

      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        toast.success('Produto atualizado com sucesso');
      } else {
        await api.post('/products', payload);
        toast.success('Produto criado com sucesso');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar produto');
    }
  };

  if (!activeBranch) return <div className="p-8 text-on-surface">Selecione uma filial no topo para continuar.</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Produtos</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Catálogo de produtos da filial: {activeBranch.name}</p>
        </div>
        
        <button 
          onClick={openNew}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:bg-primary-hover transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined notranslate text-[18px]">add</span>
          Novo Produto
        </button>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton />
          </div>
        ) : products.length === 0 ? (
          <div className="px-6 py-12 text-center text-on-surface-variant text-sm flex flex-col items-center gap-2">
            <span className="material-symbols-outlined notranslate text-4xl text-outline mb-2">inventory_2</span>
            Nenhum produto cadastrado no catálogo.
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="divide-y divide-outline-variant">
              {/* Header */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-surface-container-low text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                <div className="col-span-5">Produto</div>
                <div className="col-span-3">Categoria</div>
                <div className="col-span-2">Unidade</div>
                <div className="col-span-2 text-right">Ações</div>
              </div>

              {/* Itens */}
              {products.map(p => (
                <div key={p.id} className="flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-4 px-6 py-4 hover:bg-surface-container-low transition-colors items-start md:items-center text-sm border-b border-outline-variant md:border-0 last:border-0">
                  
                  {/* Header Mobile & Desktop */}
                  <div className="w-full md:col-span-5 flex items-center justify-between gap-4 border-b border-outline-variant pb-3 md:pb-0 md:border-0">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0">
                        <span className="material-symbols-outlined notranslate text-[20px]">category</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-on-surface">{p.name}</p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5 font-mono">
                          {p.sku && `SKU: ${p.sku}`} {p.barcode && `• EAN: ${p.barcode}`}
                        </p>
                      </div>
                    </div>
                    {/* Botões Ação (Mobile) */}
                    <div className="md:hidden flex justify-end gap-1">
                      <button onClick={() => openEdit(p)} className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-container rounded-full transition-colors">
                        <span className="material-symbols-outlined notranslate text-[20px]">edit</span>
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full transition-colors">
                        <span className="material-symbols-outlined notranslate text-[20px]">delete</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Categoria */}
                  <div className="md:col-span-3 w-full flex justify-between md:block items-center">
                    <span className="md:hidden text-[11px] text-on-surface-variant font-semibold uppercase">Categoria</span>
                    <span className="text-sm font-semibold text-on-surface-variant">{p.category?.name || 'Sem Categoria'}</span>
                  </div>
                  
                  {/* Unidade */}
                  <div className="md:col-span-2 w-full flex justify-between md:block items-center">
                    <span className="md:hidden text-[11px] text-on-surface-variant font-semibold uppercase">Unidade de Medida</span>
                    <span className="text-xs font-semibold bg-surface-container text-on-surface-variant px-2.5 py-1 rounded-full">{p.unit}</span>
                  </div>
                  
                  {/* Botões Ação (Desktop) */}
                  <div className="hidden md:flex md:col-span-2 justify-end gap-1">
                    <button onClick={() => openEdit(p)} className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-container rounded-full transition-colors">
                      <span className="material-symbols-outlined notranslate text-[20px]">edit</span>
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full transition-colors">
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
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined notranslate text-primary">{editingId ? 'edit_square' : 'add_box'}</span>
                {editingId ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-on-surface-variant hover:bg-surface-container p-1 rounded-full transition-colors">
                <span className="material-symbols-outlined notranslate">close</span>
              </button>
            </div>
            
            <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
              {/* Sidebar Tabs */}
              <div className="md:w-64 bg-surface-container-lowest border-b md:border-b-0 md:border-r border-outline-variant p-4 space-y-2 overflow-y-auto flex md:block shrink-0">
                <button type="button" onClick={() => setActiveTab('basic')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors text-sm font-semibold ${activeTab === 'basic' ? 'bg-primary-container text-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}>
                  <span className="material-symbols-outlined notranslate text-[18px]">info</span> <span className="hidden md:inline">Dados Básicos</span>
                </button>
                <button type="button" onClick={() => setActiveTab('commercial')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors text-sm font-semibold ${activeTab === 'commercial' ? 'bg-primary-container text-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}>
                  <span className="material-symbols-outlined notranslate text-[18px]">payments</span> <span className="hidden md:inline">Comercial & Fiscal</span>
                </button>
                <button type="button" onClick={() => setActiveTab('specs')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors text-sm font-semibold ${activeTab === 'specs' ? 'bg-primary-container text-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}>
                  <span className="material-symbols-outlined notranslate text-[18px]">description</span> <span className="hidden md:inline">Especificações Técnicas</span>
                </button>
                <button type="button" onClick={() => setActiveTab('stock')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors text-sm font-semibold ${activeTab === 'stock' ? 'bg-primary-container text-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}>
                  <span className="material-symbols-outlined notranslate text-[18px]">inventory_2</span> <span className="hidden md:inline">Estoque</span>
                </button>
                <button type="button" onClick={() => setActiveTab('rules')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors text-sm font-semibold ${activeTab === 'rules' ? 'bg-primary-container text-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}>
                  <span className="material-symbols-outlined notranslate text-[18px]">gpp_maybe</span> <span className="hidden md:inline">Regras</span>
                </button>
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-surface">
                <form id="productForm" onSubmit={handleSave} className="space-y-6 max-w-3xl">
                  
                  {activeTab === 'basic' && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                      <h4 className="text-lg font-bold text-on-surface mb-2 border-b border-outline-variant pb-3">Identificação Básica</h4>
                      <div className="grid grid-cols-2 gap-5">
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-on-surface mb-1">Nome *</label>
                          <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Ex: Filé Mignon" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-on-surface mb-1">Descrição Curta</label>
                          <input type="text" name="description" value={formData.description} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-on-surface mb-1">Categoria *</label>
                          <select name="categoryId" required value={formData.categoryId} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
                            <option value="">Selecione...</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-on-surface mb-1">Unidade *</label>
                          <input type="text" name="unit" required value={formData.unit} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Ex: Kg, L, Cx" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-on-surface mb-1">Marca</label>
                          <input type="text" name="brand" value={formData.brand} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-on-surface mb-1">Curva ABC</label>
                          <select name="abcClass" value={formData.abcClass} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
                            <option value="">Nenhuma</option>
                            <option value="A">Curva A (Alto Valor/Giro)</option>
                            <option value="B">Curva B (Médio)</option>
                            <option value="C">Curva C (Baixo)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-on-surface mb-1">Código (SKU)</label>
                          <input type="text" name="sku" value={formData.sku} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-on-surface mb-1">Código de Barras (EAN)</label>
                          <input type="text" name="barcode" value={formData.barcode} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div className="col-span-2 pt-4 border-t border-outline-variant mt-2">
                           <label className="flex items-center gap-3 cursor-pointer p-4 bg-surface-container-lowest border border-outline-variant rounded-xl hover:bg-surface-container-low transition-colors">
                              <input type="checkbox" name="isComposite" checked={formData.isComposite} onChange={handleChange} className="w-5 h-5 accent-primary rounded cursor-pointer" />
                              <div className="text-sm font-semibold text-on-surface">É um produto composto (Receita / Kit)?</div>
                           </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'commercial' && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                      <h4 className="text-lg font-bold text-on-surface mb-2 border-b border-outline-variant pb-3">Informações Comerciais e Fiscais</h4>
                      <div className="grid grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-semibold text-on-surface mb-1">Preço de Custo (R$)</label>
                          <input type="number" step="0.01" name="costPrice" value={formData.costPrice} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-on-surface mb-1">Preço de Venda (R$)</label>
                          <input type="number" step="0.01" name="sellPrice" value={formData.sellPrice} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-on-surface mb-1">Margem de Lucro (%)</label>
                          <input type="number" step="0.01" name="marginPercentage" value={formData.marginPercentage} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-on-surface mb-1">Fornecedor Padrão</label>
                          <select name="supplierId" value={formData.supplierId} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
                            <option value="">Nenhum fornecedor</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                        <div className="col-span-2 mt-4 pt-4 border-t border-outline-variant">
                          <h5 className="font-bold text-on-surface-variant mb-4 uppercase text-xs tracking-wider">Dados Fiscais</h5>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-on-surface mb-1">NCM</label>
                          <input type="text" name="ncmCode" value={formData.ncmCode} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-on-surface mb-1">SIF (Origem Animal)</label>
                          <input type="text" name="sifCode" value={formData.sifCode} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'specs' && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                      <h4 className="text-lg font-bold text-on-surface mb-2 border-b border-outline-variant pb-3">Especificações Técnicas</h4>
                      <div className="grid grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-semibold text-on-surface mb-1">Peso Unitário (Kg)</label>
                          <input type="number" step="0.001" name="weight" value={formData.weight} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-on-surface mb-1">Peso da Embalagem (Kg)</label>
                          <input type="number" step="0.001" name="packageWeight" value={formData.packageWeight} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-on-surface mb-1">Fator de Rendimento (%)</label>
                          <input type="number" step="0.01" name="yieldPercentage" value={formData.yieldPercentage} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="100%" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-on-surface mb-1">Anotações / Descrição Técnica</label>
                          <textarea name="notes" rows={3} value={formData.notes} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"></textarea>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'stock' && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                      <h4 className="text-lg font-bold text-on-surface mb-2 border-b border-outline-variant pb-3">Parâmetros de Estoque</h4>
                      <div className="grid grid-cols-2 gap-5">
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-on-surface mb-1">Local de Armazenamento Padrão</label>
                          <select name="locationId" value={formData.locationId} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
                            <option value="">Não definido</option>
                            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-on-surface mb-1">Estoque Mínimo</label>
                          <input type="number" step="0.01" name="minStock" value={formData.minStock} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-on-surface mb-1">Estoque Máximo</label>
                          <input type="number" step="0.01" name="maxStock" value={formData.maxStock} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'rules' && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                      <h4 className="text-lg font-bold text-on-surface mb-2 border-b border-outline-variant pb-3">Qualidade e Armazenamento</h4>
                      
                      <label className="flex items-center gap-3 p-4 border border-outline-variant rounded-xl bg-surface-container-lowest cursor-pointer hover:bg-surface-container-low transition-colors">
                        <input type="checkbox" name="controlled" checked={formData.controlled} onChange={handleChange} className="w-5 h-5 accent-primary rounded cursor-pointer" />
                        <div>
                          <p className="font-semibold text-sm text-on-surface">Produto Controlado (Lote Obrigatório)</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">Exige anotação de lote e validade em todas as movimentações.</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-4 border border-outline-variant rounded-xl bg-surface-container-lowest cursor-pointer hover:bg-surface-container-low transition-colors">
                        <input type="checkbox" name="temperatureControlled" checked={formData.temperatureControlled} onChange={handleChange} className="w-5 h-5 accent-primary rounded cursor-pointer" />
                        <div>
                          <p className="font-semibold text-sm text-on-surface">Controle de Temperatura Rigoroso</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">Exige medição de temperatura no recebimento e armazenamento.</p>
                        </div>
                      </label>

                      {formData.temperatureControlled && (
                        <div className="grid grid-cols-2 gap-4 p-5 bg-primary-container/10 rounded-xl border border-primary/20 mt-4 animate-in fade-in zoom-in-95">
                          <div>
                            <label className="block text-sm font-semibold text-on-surface mb-1">Temp. Mínima (°C)</label>
                            <input type="number" step="0.1" name="minTemperature" value={formData.minTemperature} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-primary/20 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-on-surface mb-1">Temp. Máxima (°C)</label>
                            <input type="number" step="0.1" name="maxTemperature" value={formData.maxTemperature} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-primary/20 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30" />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-5 pt-4 mt-4 border-t border-outline-variant">
                        <div>
                          <label className="block text-sm font-semibold text-on-surface mb-1">Validade Padrão (Dias)</label>
                          <input type="number" name="defaultExpirationDays" value={formData.defaultExpirationDays} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Ex: 365" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-on-surface mb-1">Método de Conservação</label>
                          <select name="conservationMethod" value={formData.conservationMethod} onChange={handleChange} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
                            <option value="">Selecione...</option>
                            <option value="CONGELADO">Congelado</option>
                            <option value="RESFRIADO">Resfriado</option>
                            <option value="AMBIENTE">Ambiente Seco</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                </form>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-lowest flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">
                Cancelar
              </button>
              
              {activeTab !== 'rules' ? (
                 <button type="button" onClick={() => {
                   const tabs = ['basic', 'commercial', 'specs', 'stock', 'rules'];
                   setActiveTab(tabs[tabs.indexOf(activeTab) + 1] as any);
                 }} className="px-6 py-2.5 bg-surface border border-outline-variant text-on-surface rounded-xl text-sm font-bold hover:bg-surface-container-low transition-colors flex items-center gap-2">
                   Avançar <span className="material-symbols-outlined notranslate text-[18px]">chevron_right</span>
                 </button>
              ) : (
                 <button type="submit" form="productForm" className="px-8 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:bg-primary-hover transition-colors shadow-sm">
                   Salvar Produto
                 </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
