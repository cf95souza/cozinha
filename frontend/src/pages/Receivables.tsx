import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle2, AlertCircle, Clock, Plus, Trash2, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';

export default function Receivables() {
  const { activeBranch } = useAuth();
  
  // Data State
  const [receivables, setReceivables] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  
  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [installments, setInstallments] = useState('1');
  
  // Payment Modal State
  const [receivingId, setReceivingId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('PIX');

  useEffect(() => {
    if (activeBranch) {
      fetchData();
    }
  }, [activeBranch]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, catRes] = await Promise.all([
        api.get(`/finance/receivables?branchId=${activeBranch?.id}`),
        api.get('/finance/categories?type=RECEITA')
      ]);
      setReceivables(recRes.data);
      setCategories(catRes.data);
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
          
        await api.post('/finance/receivables', {
          description: installmentDesc,
          amount,
          dueDate: currentDueDate.toISOString().split('T')[0],
          categoryId
        });
      }
      
      toast.success(numInstallments > 1 ? 'Contas parceladas criadas com sucesso!' : 'Conta a receber criada!');
      fetchData();
      
      // Reset form
      setDescription(''); setAmount(''); setDueDate(''); setCategoryId(''); setInstallments('1');
    } catch (err) {
      toast.error('Erro ao criar conta a receber');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingId) return;
    
    try {
      await api.post(`/finance/receivables/${receivingId}/receive`, { paymentMethod });
      toast.success('Conta recebida com sucesso!');
      setReceivingId(null);
      fetchData();
    } catch (err) {
      toast.error('Erro ao receber conta');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta conta?')) return;
    try {
      await api.delete(`/finance/receivables/${id}`);
      toast.success('Conta excluída com sucesso!');
      fetchData();
    } catch (err) {
      toast.error('Erro ao excluir conta');
    }
  };

  // KPIs
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalPendente = receivables
    .filter(r => r.status === 'PENDENTE')
    .reduce((acc, r) => acc + r.amount, 0);

  const totalAtrasado = receivables
    .filter(r => r.status === 'PENDENTE' && new Date(r.dueDate) < today)
    .reduce((acc, r) => acc + r.amount, 0);
    
  const totalRecebido = receivables
    .filter(r => r.status === 'RECEBIDO')
    .reduce((acc, r) => acc + r.amount, 0);

  // Filters
  const filteredReceivables = receivables.filter(r => {
    if (filterStatus === 'TODOS') return true;
    if (filterStatus === 'VENCIDO') return r.status === 'PENDENTE' && new Date(r.dueDate) < today;
    return r.status === filterStatus;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Contas a Receber</h1>
          <p className="text-on-surface-variant mt-1">Controle de recebimentos de clientes, repasses de cartão e outras receitas.</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-on-surface-variant font-medium">A Receber (Pendente)</p>
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
            <p className="text-sm text-on-surface-variant font-medium">Total Recebido</p>
            <p className="text-2xl font-bold text-green-600">R$ {totalRecebido.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Form de Criação */}
      <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Plus size={20} className="text-secondary" /> Novo Recebimento Esperado
        </h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-1 text-on-surface">Descrição *</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-secondary/20 outline-none transition-all" required placeholder="Ex: Fatura Cliente Y, Repasse iFood..." />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-on-surface">Valor (R$) *</label>
            <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-secondary/20 outline-none transition-all" required placeholder="0.00" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-on-surface">Vencimento (1ª) *</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-secondary/20 outline-none transition-all" required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-1 text-on-surface">Categoria *</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full px-4 py-2 border rounded-xl bg-surface focus:ring-2 focus:ring-secondary/20 outline-none transition-all" required>
              <option value="">Selecione...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-on-surface">Qtd Parcelas (Meses)</label>
            <input type="number" min="1" max="60" value={installments} onChange={e => setInstallments(e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-secondary/20 outline-none transition-all" required />
          </div>
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-secondary text-white font-bold rounded-xl hover:opacity-90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? 'Salvando...' : 'Lançar Recebimento'}
          </button>
        </form>
      </div>

      {/* Listagem */}
      <div className="bg-surface border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low/30">
          <h3 className="font-bold text-lg flex items-center gap-2"><Filter size={18} /> Lançamentos a Receber</h3>
          <div className="flex gap-2">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-1.5 text-sm border rounded-lg bg-surface focus:ring-2 focus:ring-secondary/20 outline-none">
              <option value="TODOS">Todos os Status</option>
              <option value="PENDENTE">Pendentes</option>
              <option value="RECEBIDO">Recebidos</option>
              <option value="VENCIDO">Vencidos</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-6"><LoadingSkeleton /></div>
        ) : filteredReceivables.length === 0 ? (
          <div className="p-12"><EmptyState icon={CheckCircle2} title="Nenhum recebimento" message="Não há contas a receber neste filtro." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-surface-container-low text-on-surface-variant">
                <tr>
                  <th className="p-4 font-semibold">Vencimento</th>
                  <th className="p-4 font-semibold">Descrição</th>
                  <th className="p-4 font-semibold">Categoria</th>
                  <th className="p-4 font-semibold text-right">Valor (R$)</th>
                  <th className="p-4 font-semibold text-center">Status</th>
                  <th className="p-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filteredReceivables.map(r => {
                  const isLate = r.status === 'PENDENTE' && new Date(r.dueDate) < today;
                  return (
                    <tr key={r.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="p-4 text-on-surface">
                        <span className={isLate ? 'text-error font-bold' : ''}>
                          {new Date(r.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-on-surface">{r.description}</td>
                      <td className="p-4 text-on-surface-variant">
                        <span className="bg-surface-container px-2 py-1 rounded text-xs">{r.category?.name}</span>
                      </td>
                      <td className="p-4 font-bold text-right text-green-600">
                        {r.amount.toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        {r.status === 'RECEBIDO' ? (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">RECEBIDO</span>
                        ) : isLate ? (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">VENCIDO</span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">PENDENTE</span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {r.status === 'PENDENTE' && (
                          <button onClick={() => setReceivingId(r.id)} className="px-3 py-1 bg-secondary text-white text-xs font-bold rounded hover:opacity-90 transition-colors">
                            Receber
                          </button>
                        )}
                        <button onClick={() => handleDelete(r.id)} className="p-1 text-on-surface-variant hover:text-error transition-colors rounded hover:bg-red-50" title="Excluir">
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
      {receivingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface rounded-2xl w-full max-w-sm shadow-xl animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-outline-variant font-bold text-lg">
              Confirmar Recebimento
            </div>
            <form onSubmit={handleReceive} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-on-surface">Forma de Recebimento</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full px-4 py-2 border rounded-xl bg-surface focus:ring-2 focus:ring-secondary/20 outline-none" required>
                  <option value="PIX">PIX</option>
                  <option value="BOLETO">Boleto</option>
                  <option value="DINHEIRO">Dinheiro</option>
                  <option value="CARTAO">Cartão</option>
                  <option value="TRANSFERENCIA">Transferência Bancária</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setReceivingId(null)} className="px-4 py-2 font-bold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 font-bold text-white bg-secondary hover:opacity-90 rounded-xl transition-colors">
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
