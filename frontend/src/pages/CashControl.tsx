import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Plus, User, Clock, ArrowDownToLine, ArrowUpFromLine, Lock, Unlock, Store, ShoppingBasket } from 'lucide-react';
import toast from 'react-hot-toast';
import { EmptyState } from '../components/EmptyState';
import { Link } from 'react-router-dom';

export default function CashControl() {
  const { activeBranch } = useAuth();
  const [registers, setRegisters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRegisterName, setNewRegisterName] = useState('');

  // Estados dos Modais
  const [openModalType, setOpenModalType] = useState<'OPEN' | 'CLOSE' | 'MOVEMENT' | null>(null);
  const [selectedRegisterId, setSelectedRegisterId] = useState<string | null>(null);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [movementType, setMovementType] = useState<'SANGRIA' | 'SUPRIMENTO' | null>(null);
  
  // Valores dos Modais
  const [inputValue, setInputValue] = useState('');
  const [inputDesc, setInputDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (activeBranch) {
      fetchRegisters();
    }
  }, [activeBranch]);

  const fetchRegisters = () => {
    setLoading(true);
    api.get(`/finance/cash-registers?branchId=${activeBranch?.id}`)
       .then(res => setRegisters(res.data))
       .catch(() => toast.error('Erro ao carregar caixas.'))
       .finally(() => setLoading(false));
  };

  const handleCreateRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRegisterName.trim()) return;
    
    if (!activeBranch?.id) {
      toast.error('Selecione uma filial no menu superior para criar um caixa.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/finance/cash-registers', { name: newRegisterName, branchId: activeBranch.id });
      toast.success('Caixa criado com sucesso!');
      setNewRegisterName('');
      fetchRegisters();
    } catch (err) {
      toast.error('Erro ao criar caixa.');
    } finally {
      setSubmitting(false);
    }
  };

  // Funções de Modal
  const startOpenShift = (registerId: string) => {
    setSelectedRegisterId(registerId);
    setInputValue('');
    setOpenModalType('OPEN');
  };

  const startCloseShift = (shiftId: string) => {
    setSelectedShiftId(shiftId);
    setInputValue('');
    setOpenModalType('CLOSE');
  };

  const startMovement = (shiftId: string, type: 'SANGRIA' | 'SUPRIMENTO') => {
    setSelectedShiftId(shiftId);
    setMovementType(type);
    setInputValue('');
    setInputDesc('');
    setOpenModalType('MOVEMENT');
  };

  const closeModal = () => {
    setOpenModalType(null);
    setSelectedRegisterId(null);
    setSelectedShiftId(null);
    setMovementType(null);
  };

  // Submissão dos Modais
  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (openModalType === 'OPEN' && selectedRegisterId) {
        await api.post('/finance/cash-shifts/open', { cashRegisterId: selectedRegisterId, initialBalance: parseFloat(inputValue || '0') });
        toast.success('Caixa aberto com sucesso!');
      } 
      else if (openModalType === 'CLOSE' && selectedShiftId) {
        await api.post(`/finance/cash-shifts/${selectedShiftId}/close`, { finalBalance: parseFloat(inputValue || '0') });
        toast.success('Caixa fechado e auditado!');
      }
      else if (openModalType === 'MOVEMENT' && selectedShiftId && movementType) {
        await api.post('/finance/cash-movements', {
          cashShiftId: selectedShiftId,
          type: movementType,
          amount: parseFloat(inputValue || '0'),
          description: inputDesc
        });
        toast.success(`${movementType} registrada com sucesso!`);
      }
      fetchRegisters();
      closeModal();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao processar operação no caixa.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Controle de Caixa</h1>
          <p className="text-on-surface-variant mt-1">Gerenciamento físico dos caixas e PDVs da unidade.</p>
        </div>
        
        <form onSubmit={handleCreateRegister} className="flex gap-2">
          <input 
            type="text" 
            value={newRegisterName} 
            onChange={e => setNewRegisterName(e.target.value)} 
            placeholder="Nome do Novo Caixa..." 
            className="px-4 py-2 border border-outline-variant bg-surface text-on-surface placeholder:text-on-surface-variant rounded-xl w-64 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            required
          />
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-surface-container-high font-bold rounded-xl hover:bg-surface-container-highest border border-outline-variant transition-colors flex items-center gap-2">
            <Plus size={18} /> Criar Ponto
          </button>
        </form>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : registers.length === 0 ? (
        <EmptyState icon={Store} title="Nenhum Caixa Configurado" message="Crie seu primeiro ponto de caixa para iniciar as operações de venda e recebimento no PDV." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {registers.map(reg => {
            const shift = reg.shifts && reg.shifts.length > 0 ? reg.shifts[0] : null;
            const isOpen = reg.status === 'ABERTO';

            return (
              <div key={reg.id} className={`flex flex-col justify-between p-6 rounded-2xl border shadow-sm transition-all ${isOpen ? 'border-primary/40 bg-primary/5' : 'border-outline-variant bg-surface'}`}>
                
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="font-bold text-xl text-on-surface">{reg.name}</h3>
                      <div className="mt-2">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 w-max ${isOpen ? 'bg-primary text-white shadow-sm' : 'bg-surface-container-high text-on-surface-variant'}`}>
                          {isOpen ? <Unlock size={12} /> : <Lock size={12} />}
                          {reg.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {shift && isOpen ? (
                    <div className="space-y-3 mb-6 bg-surface p-4 rounded-xl border border-outline-variant/30">
                      <p className="flex items-center gap-2 text-sm text-on-surface">
                        <User size={16} className="text-primary" />
                        <span className="font-bold">{shift.openedBy?.name}</span>
                      </p>
                      <p className="flex items-center gap-2 text-sm text-on-surface-variant">
                        <Clock size={16} />
                        <span>Aberto às {new Date(shift.openedAt).toLocaleTimeString('pt-BR')}</span>
                      </p>
                      <div className="pt-2 mt-2 border-t border-outline-variant/30">
                        <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">Fundo de Troco</p>
                        <p className="font-black text-lg text-on-surface">R$ {shift.initialBalance.toFixed(2)}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6 text-on-surface-variant text-sm py-8 text-center bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant">
                      Caixa inativo no momento.
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 mt-auto">
                  {!isOpen ? (
                    <button onClick={() => startOpenShift(reg.id)} className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-2">
                      <Unlock size={18} /> Abrir Caixa
                    </button>
                  ) : (
                    <>
                      <Link to="/pdv" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2 mb-2">
                        <ShoppingBasket size={18} /> Ir para o PDV
                      </Link>
                      <div className="flex gap-2">
                        <button onClick={() => startMovement(shift.id, 'SANGRIA')} className="flex-1 py-2 bg-red-50 text-red-700 font-bold rounded-xl hover:bg-red-100 border border-red-200 transition-colors flex items-center justify-center gap-2 text-sm">
                          <ArrowDownToLine size={16} /> Sangria
                        </button>
                        <button onClick={() => startMovement(shift.id, 'SUPRIMENTO')} className="flex-1 py-2 bg-green-50 text-green-700 font-bold rounded-xl hover:bg-green-100 border border-green-200 transition-colors flex items-center justify-center gap-2 text-sm">
                          <ArrowUpFromLine size={16} /> Suprimento
                        </button>
                      </div>
                      <button onClick={() => startCloseShift(shift.id)} className="w-full mt-2 py-3 bg-black text-white font-bold rounded-xl hover:opacity-80 transition-colors shadow-sm flex items-center justify-center gap-2">
                        <Lock size={18} /> Fechar Caixa
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL GLOBAL PARA OPERAÇÕES */}
      {openModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl w-full max-w-sm shadow-xl animate-in zoom-in-95 duration-200 overflow-hidden">
            
            <div className={`p-4 border-b border-outline-variant font-bold text-lg text-white ${
              openModalType === 'OPEN' ? 'bg-primary' : 
              openModalType === 'CLOSE' ? 'bg-black' : 
              movementType === 'SANGRIA' ? 'bg-red-600' : 'bg-green-600'
            }`}>
              {openModalType === 'OPEN' && 'Abrir Caixa'}
              {openModalType === 'CLOSE' && 'Fechar Caixa'}
              {openModalType === 'MOVEMENT' && `Registrar ${movementType}`}
            </div>

            <form onSubmit={handleSubmitModal} className="p-5 space-y-4">
              
              {openModalType === 'OPEN' && (
                <div>
                  <label className="block text-sm font-semibold mb-1 text-on-surface">Fundo de Troco (Dinheiro Inicial)</label>
                  <input type="number" step="0.01" value={inputValue} onChange={e => setInputValue(e.target.value)} className="w-full px-4 py-2 border border-outline-variant rounded-xl bg-surface text-on-surface focus:ring-2 focus:ring-primary/20 outline-none" required placeholder="0.00" autoFocus />
                </div>
              )}

              {openModalType === 'CLOSE' && (
                <div>
                  <label className="block text-sm font-semibold mb-1 text-on-surface">Saldo Final em Dinheiro (Gaveta)</label>
                  <p className="text-xs text-on-surface-variant mb-2">Conte o dinheiro físico e informe abaixo. O sistema calculará sobras ou quebras de caixa automaticamente.</p>
                  <input type="number" step="0.01" value={inputValue} onChange={e => setInputValue(e.target.value)} className="w-full px-4 py-3 text-xl font-bold border border-red-300 rounded-xl bg-red-50 text-red-900 focus:ring-2 focus:ring-red-500/20 outline-none" required placeholder="0.00" autoFocus />
                </div>
              )}

              {openModalType === 'MOVEMENT' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-on-surface">Valor da {movementType}</label>
                    <input type="number" step="0.01" value={inputValue} onChange={e => setInputValue(e.target.value)} className="w-full px-4 py-2 border border-outline-variant rounded-xl bg-surface text-on-surface outline-none focus:ring-2 focus:ring-primary/20" required placeholder="0.00" autoFocus />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-on-surface">Motivo / Descrição</label>
                    <input type="text" value={inputDesc} onChange={e => setInputDesc(e.target.value)} className="w-full px-4 py-2 border border-outline-variant rounded-xl bg-surface text-on-surface outline-none focus:ring-2 focus:ring-primary/20" required placeholder="Ex: Pagamento Fornecedor X" />
                  </div>
                </>
              )}

              <div className="flex gap-2 justify-end pt-4">
                <button type="button" onClick={closeModal} disabled={submitting} className="px-4 py-2 font-bold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className={`px-4 py-2 font-bold text-white rounded-xl transition-colors ${
                  openModalType === 'OPEN' ? 'bg-primary hover:bg-primary/90' : 
                  openModalType === 'CLOSE' ? 'bg-black hover:opacity-80' : 
                  movementType === 'SANGRIA' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                }`}>
                  {submitting ? 'Processando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
