import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle2, AlertCircle, Clock, Plus, Trash2, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';

export default function Payables() {
  const { activeBranch } = useAuth();
  
  // Data State
  const [payables, setPayables] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  
  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [installments, setInstallments] = useState('1');
  
  // Payment Modal State
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('PIX');

  useEffect(() => {
    if (activeBranch) {
      fetchData();
    }
  }, [activeBranch]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payRes, catRes, supRes] = await Promise.all([
        api.get(`/finance/payables?branchId=${activeBranch?.id}`),
        api.get('/finance/categories?type=DESPESA'),
        api.get('/suppliers')
      ]);
      setPayables(payRes.data);
      setCategories(catRes.data);
      setSuppliers(supRes.data.data || supRes.data);
    } catch (err) {
      toast.error('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const numInstallments = parseInt(installments) || 1;
      const baseDate = new Date(dueDate);
      
      // Criar as parcelas
      for (let i = 0; i < numInstallments; i++) {
        const currentDueDate = new Date(baseDate);
        currentDueDate.setMonth(currentDueDate.getMonth() + i);
        
        const installmentDesc = numInstallments > 1 
          ? `${description} (${i + 1}/${numInstallments})` 
          : description;
          
        await api.post('/finance/payables', {
          description: installmentDesc,
          amount,
          dueDate: currentDueDate.toISOString().split('T')[0],
          categoryId,
          supplierId: supplierId || undefined
        });
      }
      
      toast.success(numInstallments > 1 ? 'Contas parceladas criadas com sucesso!' : 'Conta a pagar criada!');
      fetchData();
      
      // Reset form
      setDescription(''); setAmount(''); setDueDate(''); setCategoryId(''); setSupplierId(''); setInstallments('1');
    } catch (err) {
      toast.error('Erro ao criar conta a pagar');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingId) return;
    
    try {
      await api.post(`/finance/payables/${payingId}/pay`, { paymentMethod });
      toast.success('Conta baixada com sucesso!');
      setPayingId(null);
      fetchData();
    } catch (err) {
      toast.error('Erro ao pagar conta');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta conta?')) return;
    try {
      await api.delete(`/finance/payables/${id}`);
      toast.success('Conta excluída com sucesso!');
      fetchData();
    } catch (err) {
      toast.error('Erro ao excluir conta');
    }
  };

  // KPIs
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalPendente = payables
    .filter(p => p.status === 'PENDENTE')
    .reduce((acc, p) => acc + p.amount, 0);

  const totalAtrasado = payables
    .filter(p => p.status === 'PENDENTE' && new Date(p.dueDate) < today)
    .reduce((acc, p) => acc + p.amount, 0);
    
  const totalPago = payables
    .filter(p => p.status === 'PAGO')
    .reduce((acc, p) => acc + p.amount, 0);

  // Filters
  const filteredPayables = payables.filter(p => {
    if (filterStatus === 'TODOS') return true;
    if (filterStatus === 'VENCIDO') return p.status === 'PENDENTE' && new Date(p.dueDate) < today;
    return p.status === filterStatus;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Contas a Pagar</h1>
          <p className="text-on-surface-variant mt-1">Gestão de despesas, boletos e obrigações da unidade.</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-orange-100 text-primary rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-on-surface-variant font-medium">A Vencer (Pendente)</p>
            <p className="text-2xl font-bold text-on-surface">R$ {totalPendente.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-red-100 text-error rounded-xl">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-on-surface-variant font-medium">Atrasados</p>
            <p className="text-2xl font-bold text-error">R$ {totalAtrasado.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-xl">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm text-on-surface-variant font-medium">Total Pago</p>
            <p className="text-2xl font-bold text-on-surface">R$ {totalPago.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Form de Criação */}
      <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Plus size={20} className="text-primary" /> Nova Conta a Pagar
        </h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-1 text-on-surface">Descrição *</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all" required placeholder="Ex: Aluguel, Boleto Fornecedor..." />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-on-surface">Valor (R$) *</label>
            <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all" required placeholder="0.00" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-on-surface">Vencimento (1ª) *</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all" required />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-on-surface">Categoria *</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full px-4 py-2 border rounded-xl bg-surface focus:ring-2 focus:ring-primary/20 outline-none transition-all" required>
              <option value="">Selecione...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-on-surface">Fornecedor</label>
            <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="w-full px-4 py-2 border rounded-xl bg-surface focus:ring-2 focus:ring-primary/20 outline-none transition-all">
              <option value="">Nenhum (Opcional)</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} - {s.document}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-on-surface">Qtd Parcelas (Meses)</label>
            <input type="number" min="1" max="60" value={installments} onChange={e => setInstallments(e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all" required />
          </div>
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? 'Salvando...' : 'Lançar Conta'}
          </button>
        </form>
      </div>

      {/* Listagem */}
      <div className="bg-surface border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low/30">
          <h3 className="font-bold text-lg flex items-center gap-2"><Filter size={18} /> Lançamentos</h3>
          <div className="flex gap-2">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-1.5 text-sm border rounded-lg bg-surface focus:ring-2 focus:ring-primary/20 outline-none">
              <option value="TODOS">Todos os Status</option>
              <option value="PENDENTE">Pendentes</option>
              <option value="PAGO">Pagos</option>
              <option value="VENCIDO">Vencidos</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-6"><LoadingSkeleton /></div>
        ) : filteredPayables.length === 0 ? (
          <div className="p-12"><EmptyState icon={CheckCircle2} title="Nenhuma conta" message="Não há contas a pagar neste filtro." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-surface-container-low text-on-surface-variant">
                <tr>
                  <th className="p-4 font-semibold">Vencimento</th>
                  <th className="p-4 font-semibold">Descrição</th>
                  <th className="p-4 font-semibold">Fornecedor</th>
                  <th className="p-4 font-semibold">Categoria</th>
                  <th className="p-4 font-semibold text-right">Valor (R$)</th>
                  <th className="p-4 font-semibold text-center">Status</th>
                  <th className="p-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filteredPayables.map(p => {
                  const isLate = p.status === 'PENDENTE' && new Date(p.dueDate) < today;
                  return (
                    <tr key={p.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="p-4 text-on-surface">
                        <span className={isLate ? 'text-error font-bold' : ''}>
                          {new Date(p.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-on-surface">{p.description}</td>
                      <td className="p-4 text-on-surface-variant truncate max-w-[150px]">{p.supplier?.name || '-'}</td>
                      <td className="p-4 text-on-surface-variant">
                        <span className="bg-surface-container px-2 py-1 rounded text-xs">{p.category?.name}</span>
                      </td>
                      <td className="p-4 font-bold text-right text-on-surface">
                        {p.amount.toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        {p.status === 'PAGO' ? (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">PAGO</span>
                        ) : isLate ? (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">VENCIDO</span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">PENDENTE</span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {p.status === 'PENDENTE' && (
                          <button onClick={() => setPayingId(p.id)} className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 transition-colors">
                            Baixar
                          </button>
                        )}
                        <button onClick={() => handleDelete(p.id)} className="p-1 text-on-surface-variant hover:text-error transition-colors rounded hover:bg-red-50" title="Excluir">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Pagamento */}
      {payingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface rounded-2xl w-full max-w-sm shadow-xl animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-outline-variant font-bold text-lg">
              Confirmar Pagamento
            </div>
            <form onSubmit={handlePay} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-on-surface">Forma de Pagamento</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full px-4 py-2 border rounded-xl bg-surface focus:ring-2 focus:ring-primary/20 outline-none" required>
                  <option value="PIX">PIX</option>
                  <option value="BOLETO">Boleto</option>
                  <option value="DINHEIRO">Dinheiro</option>
                  <option value="CARTAO">Cartão</option>
                  <option value="TRANSFERENCIA">Transferência Bancária</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setPayingId(null)} className="px-4 py-2 font-bold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors">
                  Confirmar Baixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
