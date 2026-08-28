import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Filter, Receipt, Calendar, Building2, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Invoices() {
  const { activeBranch } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Params
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [origins, setOrigins] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  // Filters
  const [filterCostCenter, setFilterCostCenter] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  // Supplier Search
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  const filteredSuppliers = suppliers.filter(s => {
    if (!supplierSearch) return true;
    const searchLower = supplierSearch.toLowerCase();
    return (s.name && s.name.toLowerCase().includes(searchLower)) || 
           (s.document && s.document.includes(searchLower));
  });

  // New Invoice Form
  const [formData, setFormData] = useState({
    supplierId: '',
    invoiceNumber: '',
    invoiceKey: '',
    issueDate: '',
    dueDate: '',
    totalAmount: 0,
    interestAmount: 0,
    freightAmount: 0,
    discountAmount: 0,
    costCenterId: '',
    invoiceTypeId: '',
    invoiceOriginId: ''
  });

  // New Supplier Form
  const [supplierData, setSupplierData] = useState({
    document: '',
    name: '',
    address: '',
    contact: '',
    phone: '',
    email: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (activeBranch?.id) query.append('branchId', activeBranch.id);
      if (filterCostCenter) query.append('costCenterId', filterCostCenter);
      if (filterDateStart && filterDateEnd) {
        query.append('startDate', filterDateStart);
        query.append('endDate', filterDateEnd);
      }

      const [resInv, resCC, resTypes, resOrigins, resSuppliers] = await Promise.all([
        api.get(`/finance/invoices?${query.toString()}`),
        api.get('/finance/cost-centers'),
        api.get('/finance/invoice-types'),
        api.get('/finance/invoice-origins'),
        api.get('/suppliers')
      ]);

      setInvoices(resInv.data);
      setCostCenters(resCC.data);
      setTypes(resTypes.data);
      setOrigins(resOrigins.data);
      setSuppliers(resSuppliers.data.data || resSuppliers.data);
    } catch (err) {
      toast.error('Erro ao buscar notas fiscais');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeBranch, filterCostCenter, filterDateStart, filterDateEnd]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/finance/invoices', formData, {
        headers: { 'x-branch-id': activeBranch?.id }
      });
      toast.success('Nota lançada com sucesso!');
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao lançar nota');
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/suppliers', supplierData);
      setSuppliers([...suppliers, res.data]);
      setFormData({ ...formData, supplierId: res.data.id });
      toast.success('Fornecedor cadastrado!');
      setIsSupplierModalOpen(false);
    } catch (err) {
      toast.error('Erro ao cadastrar fornecedor');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-display-sm font-section-title text-on-surface">Notas Fiscais (Consumo)</h1>
          <p className="text-body text-on-surface-variant mt-1">Lançamento de despesas e notas de consumo por centro de custo.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Lançar Nota
        </button>
      </div>

      <div className="bg-surface p-4 rounded-xl shadow-sm border border-outline-variant flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-on-surface uppercase mb-1">Centro de Custo</label>
          <select 
            value={filterCostCenter}
            onChange={e => setFilterCostCenter(e.target.value)}
            className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="">Todos</option>
            {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-on-surface uppercase mb-1">Data Inicial (Emissão)</label>
          <input 
            type="date"
            value={filterDateStart}
            onChange={e => setFilterDateStart(e.target.value)}
            className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-on-surface uppercase mb-1">Data Final (Emissão)</label>
          <input 
            type="date"
            value={filterDateEnd}
            onChange={e => setFilterDateEnd(e.target.value)}
            className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-outline-variant overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-on-surface-variant">Carregando notas...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-surface-container-lowest text-on-surface-variant uppercase text-xs font-bold border-b border-outline-variant">
                <tr>
                  <th className="px-6 py-4">Data Emissão</th>
                  <th className="px-6 py-4">Fornecedor</th>
                  <th className="px-6 py-4">Nº da Nota</th>
                  <th className="px-6 py-4">Centro de Custo</th>
                  <th className="px-6 py-4 text-right">Valor Final</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant">Nenhuma nota encontrada.</td></tr>
                ) : (
                  invoices.map(inv => (
                    <tr key={inv.id} className="border-b border-outline-variant last:border-0 hover:bg-surface-container-lowest transition-colors">
                      <td className="px-6 py-4 font-medium text-on-surface">
                        {new Date(inv.issueDate).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-on-surface">
                        {inv.supplier.name}
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-primary-container text-on-primary-container text-xs px-2 py-1 rounded-md font-semibold">
                          {inv.costCenter.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-primary">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inv.finalAmount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-3xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center sticky top-0 bg-surface z-10">
              <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <Receipt className="w-6 h-6 text-primary" /> Lançar Nota de Consumo
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-on-surface-variant hover:bg-surface-container p-2 rounded-full">
                X
              </button>
            </div>
            
            <form onSubmit={handleCreateInvoice} className="p-6 space-y-6">
              
              <div className="space-y-4 bg-surface-container-lowest p-5 rounded-xl border border-outline-variant">
                <h3 className="text-sm font-bold uppercase text-primary">Cabeçalho da Nota</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 flex gap-2">
                    <div className="flex-1 relative">
                      <label className="block text-xs font-bold text-on-surface uppercase mb-1">Fornecedor (CNPJ ou Nome)</label>
                      {formData.supplierId ? (
                        <div className="flex items-center justify-between w-full px-4 py-2.5 border border-outline-variant rounded-lg bg-surface-container-lowest">
                          <span className="font-semibold text-sm text-on-surface">
                            {suppliers.find(s => s.id === formData.supplierId)?.name}
                            {suppliers.find(s => s.id === formData.supplierId)?.document && ` (${suppliers.find(s => s.id === formData.supplierId)?.document})`}
                          </span>
                          <button type="button" onClick={() => { setFormData({...formData, supplierId: ''}); setSupplierSearch(''); }} className="text-on-surface-variant hover:text-error px-2">
                            X
                          </button>
                        </div>
                      ) : (
                        <>
                          <input
                            type="text"
                            value={supplierSearch}
                            onChange={e => {
                              setSupplierSearch(e.target.value);
                              setShowSupplierDropdown(true);
                            }}
                            onFocus={() => setShowSupplierDropdown(true)}
                            onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 200)}
                            placeholder="Digite CNPJ ou nome..."
                            className="w-full px-4 py-2.5 border border-outline-variant rounded-lg bg-surface outline-none focus:ring-2 focus:ring-primary"
                          />
                          {showSupplierDropdown && supplierSearch && (
                            <div className="absolute z-20 w-full mt-1 bg-surface border border-outline-variant rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {filteredSuppliers.length > 0 ? (
                                filteredSuppliers.map(s => (
                                  <button
                                    key={s.id}
                                    type="button"
                                    className="w-full text-left px-4 py-2 hover:bg-surface-container focus:bg-surface-container border-b border-outline-variant last:border-0"
                                    onClick={() => {
                                      setFormData({...formData, supplierId: s.id});
                                      setSupplierSearch('');
                                      setShowSupplierDropdown(false);
                                    }}
                                  >
                                    <div className="font-bold text-sm text-on-surface">{s.name}</div>
                                    <div className="text-xs text-on-surface-variant">{s.document || 'Sem CNPJ'}</div>
                                  </button>
                                ))
                              ) : (
                                <div className="px-4 py-3 text-sm text-on-surface-variant">
                                  Nenhum fornecedor encontrado.
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {!formData.supplierId && supplierSearch.length > 0 && filteredSuppliers.length === 0 && (
                      <div className="flex items-end">
                        <button type="button" onClick={() => {
                          setSupplierData({...supplierData, document: supplierSearch.replace(/\D/g, ''), name: ''});
                          setIsSupplierModalOpen(true);
                        }} className="h-[42px] px-4 bg-secondary text-on-secondary rounded-lg font-bold flex items-center gap-1 hover:bg-secondary/90 shrink-0">
                          <Plus className="w-4 h-4" /> Novo
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-on-surface uppercase mb-1">Número da Nota</label>
                    <input required type="text" value={formData.invoiceNumber} onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} className="w-full px-4 py-2.5 border border-outline-variant rounded-lg bg-surface outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface uppercase mb-1">Chave de Acesso (Opcional)</label>
                    <input type="text" value={formData.invoiceKey} onChange={e => setFormData({...formData, invoiceKey: e.target.value})} className="w-full px-4 py-2.5 border border-outline-variant rounded-lg bg-surface outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface uppercase mb-1">Data Emissão</label>
                    <input required type="date" value={formData.issueDate} onChange={e => setFormData({...formData, issueDate: e.target.value})} className="w-full px-4 py-2.5 border border-outline-variant rounded-lg bg-surface outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface uppercase mb-1">Data Vencimento</label>
                    <input required type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full px-4 py-2.5 border border-outline-variant rounded-lg bg-surface outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-surface-container-lowest p-5 rounded-xl border border-outline-variant">
                <h3 className="text-sm font-bold uppercase text-primary">Classificação</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface uppercase mb-1">Centro de Custo</label>
                    <select required value={formData.costCenterId} onChange={e => setFormData({...formData, costCenterId: e.target.value})} className="w-full px-4 py-2.5 border border-outline-variant rounded-lg bg-surface outline-none focus:ring-2 focus:ring-primary">
                      <option value="">Selecione...</option>
                      {costCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface uppercase mb-1">Tipo da Nota</label>
                    <select required value={formData.invoiceTypeId} onChange={e => setFormData({...formData, invoiceTypeId: e.target.value})} className="w-full px-4 py-2.5 border border-outline-variant rounded-lg bg-surface outline-none focus:ring-2 focus:ring-primary">
                      <option value="">Selecione...</option>
                      {types.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface uppercase mb-1">Origem</label>
                    <select required value={formData.invoiceOriginId} onChange={e => setFormData({...formData, invoiceOriginId: e.target.value})} className="w-full px-4 py-2.5 border border-outline-variant rounded-lg bg-surface outline-none focus:ring-2 focus:ring-primary">
                      <option value="">Selecione...</option>
                      {origins.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-surface-container-lowest p-5 rounded-xl border border-outline-variant">
                <h3 className="text-sm font-bold uppercase text-primary">Valores</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface uppercase mb-1">Valor Subtotal</label>
                    <input required type="number" step="0.01" min="0" value={formData.totalAmount} onChange={e => setFormData({...formData, totalAmount: Number(e.target.value)})} className="w-full px-4 py-2.5 border border-outline-variant rounded-lg bg-surface outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface uppercase mb-1">Juros (R$)</label>
                    <input type="number" step="0.01" min="0" value={formData.interestAmount} onChange={e => setFormData({...formData, interestAmount: Number(e.target.value)})} className="w-full px-4 py-2.5 border border-outline-variant rounded-lg bg-surface outline-none focus:ring-2 focus:ring-primary text-error" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface uppercase mb-1">Frete (R$)</label>
                    <input type="number" step="0.01" min="0" value={formData.freightAmount} onChange={e => setFormData({...formData, freightAmount: Number(e.target.value)})} className="w-full px-4 py-2.5 border border-outline-variant rounded-lg bg-surface outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface uppercase mb-1">Desconto (R$)</label>
                    <input type="number" step="0.01" min="0" value={formData.discountAmount} onChange={e => setFormData({...formData, discountAmount: Number(e.target.value)})} className="w-full px-4 py-2.5 border border-outline-variant rounded-lg bg-surface outline-none focus:ring-2 focus:ring-primary text-success" />
                  </div>
                </div>
                <div className="pt-4 border-t border-outline-variant flex justify-end items-center gap-4">
                  <span className="text-sm font-bold text-on-surface-variant uppercase">Valor Final:</span>
                  <span className="text-2xl font-black text-primary">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      (formData.totalAmount || 0) + (formData.interestAmount || 0) + (formData.freightAmount || 0) - (formData.discountAmount || 0)
                    )}
                  </span>
                </div>
              </div>

              <div className="pt-6 border-t border-outline-variant flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-on-surface-variant font-bold hover:bg-surface-container rounded-xl">Cancelar</button>
                <button type="submit" className="bg-primary text-on-primary px-8 py-2.5 rounded-xl font-bold hover:bg-primary/90">Salvar Nota</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isSupplierModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-md rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-bold text-on-surface mb-4">Cadastro Rápido de Fornecedor</h3>
            <form onSubmit={handleCreateSupplier} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase mb-1">CNPJ/CPF</label>
                <input required type="text" value={supplierData.document} onChange={e => setSupplierData({...supplierData, document: e.target.value})} className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase mb-1">Razão Social / Nome</label>
                <input required type="text" value={supplierData.name} onChange={e => setSupplierData({...supplierData, name: e.target.value})} className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase mb-1">Endereço</label>
                <input type="text" value={supplierData.address} onChange={e => setSupplierData({...supplierData, address: e.target.value})} className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase mb-1">Contato (Pessoa)</label>
                <input type="text" value={supplierData.contact} onChange={e => setSupplierData({...supplierData, contact: e.target.value})} className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary" placeholder="Nome de quem atende..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase mb-1">Telefone</label>
                  <input type="text" value={supplierData.phone} onChange={e => setSupplierData({...supplierData, phone: e.target.value})} className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase mb-1">E-mail</label>
                  <input type="email" value={supplierData.email} onChange={e => setSupplierData({...supplierData, email: e.target.value})} className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-surface focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsSupplierModalOpen(false)} className="px-4 py-2 text-on-surface-variant font-bold hover:bg-surface-container rounded-lg">Cancelar</button>
                <button type="submit" className="bg-secondary text-on-secondary px-6 py-2 rounded-lg font-bold hover:bg-secondary/90">Salvar Fornecedor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
