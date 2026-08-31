import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, CheckCircle2, ChevronRight, PackageCheck, AlertTriangle, ListTodo } from 'lucide-react';

export default function ReceivingFlow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeBranch } = useAuth();
  
  const isNew = id === 'novo';
  const [loading, setLoading] = useState(!isNew);
  const [submitting, setSubmitting] = useState(false);
  
  // Create Flow state
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [form, setForm] = useState({
    invoice: '',
    supplierId: '',
    notes: ''
  });
  
  const [items, setItems] = useState<{productId: string, requestedQty: number, unit: string}[]>([]);
  
  // Conferencia state
  const [receiving, setReceiving] = useState<any>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  
  const [conferencia, setConferencia] = useState<{
    receivedQty?: number | string,
    lotNumber?: string,
    expirationDate?: string,
    temperature?: number | string,
    packageStatus?: string
  }>({});

  useEffect(() => {
    if (!activeBranch) return;
    if (isNew) {
      // Load dependencies for creating new
      api.get(`/suppliers?branchId=${activeBranch.id}`).then(res => setSuppliers(res.data.data || res.data));
      api.get(`/products?branchId=${activeBranch.id}`).then(res => setProducts(res.data.data || res.data));
    } else {
      loadReceiving();
    }
  }, [id, activeBranch]);

  const loadReceiving = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/receivings/${id}`);
      setReceiving(res.data);
      if (res.data.items.length > 0) {
        const firstItem = res.data.items[0];
        setActiveItemId(firstItem.id);
        setConferencia({
          receivedQty: firstItem.receivedQty !== null ? firstItem.receivedQty : '',
          lotNumber: firstItem.lotNumber || '',
          expirationDate: firstItem.expirationDate ? firstItem.expirationDate.split('T')[0] : '',
          temperature: firstItem.temperature !== null ? firstItem.temperature : '',
          packageStatus: firstItem.packageStatus || 'INTACTA'
        });
      }
    } catch (err) {
      alert('Erro ao carregar recebimento');
      navigate('/recebimentos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return alert('Adicione pelo menos um item à nota.');
    
    try {
      setSubmitting(true);
      const payload = {
        ...form,
        branchId: activeBranch?.id,
        items
      };
      const res = await api.post('/receivings', payload);
      navigate(`/recebimento/${res.data.id}`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao criar');
      setSubmitting(false);
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItemId) return;
    
    try {
      setSubmitting(true);
      const itemToUpdate = receiving.items.find((i: any) => i.id === activeItemId);
      const payload = {
        receivedQty: conferencia.receivedQty !== undefined && conferencia.receivedQty !== '' ? Number(conferencia.receivedQty) : itemToUpdate.receivedQty,
        lotNumber: conferencia.lotNumber !== undefined ? conferencia.lotNumber : itemToUpdate.lotNumber,
        expirationDate: conferencia.expirationDate !== undefined ? conferencia.expirationDate : (itemToUpdate.expirationDate ? itemToUpdate.expirationDate.split('T')[0] : ''),
        temperature: conferencia.temperature !== undefined && conferencia.temperature !== '' ? Number(conferencia.temperature) : itemToUpdate.temperature,
        packageStatus: conferencia.packageStatus !== undefined ? conferencia.packageStatus : (itemToUpdate.packageStatus || 'INTACTA')
      };
      await api.put(`/receivings/${id}/items/${activeItemId}`, payload);
      
      // Mover para o proximo item se houver
      const currentIndex = receiving.items.findIndex((i: any) => i.id === activeItemId);
      if (currentIndex < receiving.items.length - 1) {
        const nextItem = receiving.items[currentIndex + 1];
        setActiveItemId(nextItem.id);
        setConferencia({
          receivedQty: nextItem.receivedQty !== null ? nextItem.receivedQty : '',
          lotNumber: nextItem.lotNumber || '',
          expirationDate: nextItem.expirationDate ? nextItem.expirationDate.split('T')[0] : '',
          temperature: nextItem.temperature !== null ? nextItem.temperature : '',
          packageStatus: nextItem.packageStatus || 'INTACTA'
        });
      }
      
      await loadReceiving();
    } catch (err) {
      alert('Erro ao atualizar item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Tem certeza? Isso irá atualizar o estoque de forma definitiva!')) return;
    try {
      setSubmitting(true);
      await api.post(`/receivings/${id}/approve`);
      alert('Nota aprovada com sucesso! O estoque foi atualizado.');
      navigate('/recebimentos');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao aprovar a nota');
    } finally {
      setSubmitting(false);
    }
  };

  if (!activeBranch) return <div className="p-8 text-on-surface">Selecione uma filial...</div>;
  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="text-on-surface-variant flex flex-col items-center gap-3">
        <span className="material-symbols-outlined notranslate animate-spin text-4xl text-primary">sync</span>
        <p className="text-sm">Carregando dados da nota...</p>
      </div>
    </div>
  );

  if (isNew) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/recebimentos')} className="p-2 text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">
            <span className="material-symbols-outlined notranslate text-[24px]">arrow_back</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Iniciar Recebimento</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">Identifique a Nota Fiscal e os itens esperados.</p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="bg-surface rounded-2xl shadow-sm border border-outline-variant p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-on-surface">Fornecedor *</label>
              <select required value={form.supplierId} onChange={e => setForm({...form, supplierId: e.target.value})} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
                <option value="">Selecione...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-on-surface">Número da NF</label>
              <input type="text" value={form.invoice} onChange={e => setForm({...form, invoice: e.target.value})} className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>

          <div className="border-t border-outline-variant pt-6">
            <h3 className="font-semibold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined notranslate text-[18px] text-primary">inventory_2</span>
              Itens Esperados
            </h3>
            
            <div className="divide-y divide-outline-variant bg-surface-container-low rounded-xl border border-outline-variant mb-4 overflow-hidden">
              {items.map((item, index) => {
                const p = products.find(prod => prod.id === item.productId);
                return (
                  <div key={index} className="flex items-center justify-between px-5 py-3">
                    <span className="font-semibold text-sm text-on-surface">{p?.name}</span>
                    <span className="text-sm font-semibold text-on-surface-variant">{item.requestedQty} {item.unit}</span>
                  </div>
                );
              })}
              {items.length === 0 && (
                <div className="px-5 py-6 text-center text-sm text-on-surface-variant">
                  Nenhum item adicionado ainda.
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-end bg-surface-container p-5 rounded-xl border border-outline-variant border-dashed">
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold uppercase mb-1 text-on-surface-variant">Produto</label>
                <select id="newItemProd" className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
                  <option value="">Selecionar...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="w-full sm:w-32">
                <label className="block text-xs font-semibold uppercase mb-1 text-on-surface-variant">Qtd Pedida</label>
                <input id="newItemQty" type="number" step="0.01" className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <button 
                type="button"
                onClick={() => {
                  const pId = (document.getElementById('newItemProd') as HTMLSelectElement).value;
                  const qty = (document.getElementById('newItemQty') as HTMLInputElement).value;
                  if (!pId || !qty) return;
                  const p = products.find(x => x.id === pId);
                  setItems([...items, { productId: pId, requestedQty: Number(qty), unit: p.unit }]);
                  (document.getElementById('newItemProd') as HTMLSelectElement).value = '';
                  (document.getElementById('newItemQty') as HTMLInputElement).value = '';
                }}
                className="flex items-center justify-center gap-1 px-4 py-2 bg-surface text-on-surface font-semibold rounded-xl border border-outline-variant hover:bg-surface-container h-[42px] transition-colors w-full sm:w-auto"
              >
                <span className="material-symbols-outlined notranslate text-[18px]">add</span>
                Incluir
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-outline-variant">
            <button disabled={submitting} type="submit" className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary-hover transition-colors disabled:opacity-50">
              Prosseguir para Conferência
              <span className="material-symbols-outlined notranslate text-[18px]">arrow_forward</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Visualização / Conferência (id != 'novo')
  const activeItem = receiving?.items.find((i: any) => i.id === activeItemId);
  const isApproved = receiving?.status === 'APROVADO' || receiving?.status === 'APROVADO_RESSALVA';

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-4 items-center">
          <button onClick={() => navigate('/recebimentos')} className="p-2 text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">
            <span className="material-symbols-outlined notranslate text-[24px]">arrow_back</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Conferência</h1>
            <p className="text-sm font-semibold text-on-surface-variant mt-0.5">NF {receiving?.invoice || 'S/N'} • {receiving?.supplier?.name}</p>
          </div>
        </div>
        
        {!isApproved && (
          <button 
            disabled={submitting}
            onClick={handleApprove}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-on-secondary rounded-xl font-bold hover:opacity-90 transition-colors shadow-sm disabled:opacity-50"
          >
            <span className="material-symbols-outlined notranslate text-[20px]">task_alt</span>
            Finalizar e Aprovar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6">
        {/* Sidebar com os itens */}
        <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden h-[70vh] flex flex-col">
          <div className="px-5 py-4 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
            <h3 className="font-semibold text-on-surface text-sm flex items-center gap-2">
              <span className="material-symbols-outlined notranslate text-[18px] text-primary">format_list_numbered</span>
              Itens da Nota
            </h3>
            <span className="text-xs bg-primary-container text-primary px-2 py-0.5 rounded-full font-semibold">
              {receiving?.items.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-outline-variant">
            {receiving?.items.map((item: any) => {
              const checked = item.receivedQty !== null;
              const hasDivergence = checked && item.receivedQty !== item.requestedQty;
              const isActive = activeItemId === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveItemId(item.id);
                    setConferencia({
                      receivedQty: item.receivedQty !== null ? item.receivedQty : '',
                      lotNumber: item.lotNumber || '',
                      expirationDate: item.expirationDate ? item.expirationDate.split('T')[0] : '',
                      temperature: item.temperature !== null ? item.temperature : '',
                      packageStatus: item.packageStatus || 'INTACTA'
                    });
                  }}
                  className={`w-full text-left px-5 py-4 transition-colors flex items-center justify-between ${
                    isActive ? 'bg-primary-container border-l-4 border-l-primary pl-4' : 'hover:bg-surface-container-low border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className={`font-semibold text-sm truncate ${isActive ? 'text-primary' : 'text-on-surface'}`}>{item.product.name}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">Ped: {item.requestedQty} {item.unit}</p>
                  </div>
                  {checked && !hasDivergence && <span className="material-symbols-outlined notranslate text-[18px] text-secondary">check_circle</span>}
                  {hasDivergence && <span className="material-symbols-outlined notranslate text-[18px] text-error">warning</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Formulario de conferencia */}
        {activeItem ? (
          <form onSubmit={handleUpdateItem} className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden flex flex-col h-[70vh]">
            <div className="px-6 py-5 border-b border-outline-variant">
              <h2 className="text-xl font-bold text-on-surface">{activeItem.product.name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-xs bg-surface-container text-on-surface-variant px-2.5 py-1 rounded-full font-semibold">
                  Pedido: {activeItem.requestedQty} {activeItem.unit}
                </span>
                {activeItem.product.controlled && (
                  <span className="text-xs bg-error-container text-on-error-container px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined notranslate text-[14px]">warning</span> Controlado
                  </span>
                )}
                {activeItem.product.temperatureControlled && (
                  <span className="text-xs bg-[#e0f2fe] text-[#0284c7] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined notranslate text-[14px]">thermostat</span> 
                    Termolábil ({activeItem.product.minTemperature}° a {activeItem.product.maxTemperature}°)
                  </span>
                )}
              </div>
            </div>

            <div className="p-6 space-y-5 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                
                <div className="col-span-1 sm:col-span-2 md:col-span-1">
                  <label className="block text-sm font-semibold mb-1 text-primary">Qtd Recebida Real *</label>
                  <div className="relative">
                    <input 
                      type="number" step="0.01" required 
                      disabled={isApproved}
                      value={conferencia.receivedQty !== undefined ? conferencia.receivedQty : (activeItem.receivedQty !== null ? activeItem.receivedQty : '')} 
                      onChange={e => setConferencia({...conferencia, receivedQty: e.target.value})}
                      className="w-full pl-4 pr-12 py-3 bg-surface border-2 border-primary/50 rounded-xl text-lg font-bold text-on-surface focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20" 
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-on-surface-variant">{activeItem.unit}</span>
                  </div>
                </div>

                <div className="col-span-1 sm:col-span-2 md:col-span-1">
                  <label className="block text-sm font-semibold mb-1 text-on-surface">Validade *</label>
                  <input 
                    type="date" required 
                    disabled={isApproved}
                    value={conferencia.expirationDate ?? (activeItem.expirationDate ? activeItem.expirationDate.split('T')[0] : '')}
                    onChange={e => setConferencia({...conferencia, expirationDate: e.target.value})}
                    className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" 
                  />
                </div>

                <div className="col-span-1 sm:col-span-2 md:col-span-1">
                  <label className="block text-sm font-semibold mb-1 text-on-surface">Lote (Opcional)</label>
                  <input 
                    type="text" 
                    disabled={isApproved}
                    value={conferencia.lotNumber ?? activeItem.lotNumber ?? ''}
                    onChange={e => setConferencia({...conferencia, lotNumber: e.target.value})}
                    placeholder="Auto-gerado se vazio"
                    className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/20" 
                  />
                </div>

                {activeItem.product.temperatureControlled && (
                  <div className="col-span-1 sm:col-span-2 md:col-span-1">
                    <label className="block text-sm font-semibold mb-1 text-error">Temperatura (°C) *</label>
                    <input 
                      type="number" step="0.1" required 
                      disabled={isApproved}
                      value={conferencia.temperature !== undefined ? conferencia.temperature : (activeItem.temperature !== null ? activeItem.temperature : '')}
                      onChange={e => setConferencia({...conferencia, temperature: e.target.value})}
                      className="w-full px-4 py-3 bg-error-container/20 border border-error/30 rounded-xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-error/20" 
                    />
                  </div>
                )}
                
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-semibold mb-1 text-on-surface">Estado da Embalagem</label>
                  <select 
                    disabled={isApproved}
                    value={conferencia.packageStatus ?? activeItem.packageStatus ?? 'INTACTA'}
                    onChange={e => setConferencia({...conferencia, packageStatus: e.target.value})}
                    className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    <option value="INTACTA">Intacta</option>
                    <option value="AMASSADA">Amassada</option>
                    <option value="VIOLADA">Violada / Furada</option>
                  </select>
                </div>
              </div>
            </div>

            {!isApproved && (
              <div className="px-6 py-4 border-t border-outline-variant flex justify-end">
                <button disabled={submitting} type="submit" className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary-hover transition-colors disabled:opacity-50">
                  Salvar Item e Avançar
                  <span className="material-symbols-outlined notranslate text-[18px]">arrow_forward</span>
                </button>
              </div>
            )}
          </form>
        ) : (
          <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant flex flex-col items-center justify-center p-8 text-on-surface-variant text-sm gap-3 h-[70vh]">
            <span className="material-symbols-outlined notranslate text-4xl">touch_app</span>
            Selecione um item ao lado para conferir
          </div>
        )}
      </div>
    </div>
  );
}
