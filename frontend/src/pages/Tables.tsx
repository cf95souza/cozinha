import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useAuth } from '../contexts/AuthContext';
import { Plus, UtensilsCrossed } from 'lucide-react';

export default function Tables() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTable, setNewTable] = useState({ tableNumber: '', customerName: '' });
  const navigate = useNavigate();
  const { activeBranch } = useAuth();

  useEffect(() => {
    fetchTables();
  }, [activeBranch]); // Refetch when active branch changes

  const fetchTables = async () => {
    try {
      setLoading(true);
      const url = activeBranch?.id ? `/tables?branchId=${activeBranch.id}` : '/tables';
      const res = await api.get(url);
      setTables(res.data);
    } catch (error) {
      toast.error('Erro ao buscar mesas');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBranch?.id) {
       toast.error('Selecione uma filial específica no topo da tela para abrir uma mesa.');
       return;
    }
    try {
      const res = await api.post('/tables', { ...newTable, branchId: activeBranch.id });
      toast.success('Mesa aberta com sucesso!');
      setIsModalOpen(false);
      navigate(`/mesas/${res.data.id}`);
    } catch (error) {
      toast.error('Erro ao abrir mesa');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Mesas & Comandas</h1>
          <p className="text-on-surface-variant mt-1">Controle de atendimento no restaurante</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto bg-primary text-on-primary px-5 py-2.5 rounded-xl hover:bg-primary-hover font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Nova Mesa
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {tables.map(table => (
            <div
              key={table.id}
              onClick={() => navigate(`/mesas/${table.id}`)}
              className="bg-surface border-2 border-primary/40 rounded-2xl p-4 cursor-pointer hover:border-primary hover:shadow-md transition-all text-center flex flex-col justify-center min-h-[140px] relative overflow-hidden"
            >
              {/* Indicador sutil de mesa ativa */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-primary opacity-80" />
              
              <div className="flex justify-center mb-2">
                <div className="p-2 bg-primary-container rounded-full text-primary">
                  <UtensilsCrossed size={24} />
                </div>
              </div>
              <h3 className="font-bold text-on-surface text-lg leading-tight">
                Mesa {table.tableNumber || 'S/N'}
              </h3>
              {!activeBranch?.id && table.branch?.name && (
                <p className="text-[10px] font-bold text-primary truncate mt-1">
                  {table.branch.name}
                </p>
              )}
              {table.customerName && (
                <p className="text-xs text-on-surface-variant truncate mt-1 font-medium">{table.customerName}</p>
              )}
              <div className="mt-auto pt-3">
                <p className="font-bold text-primary text-base">
                  R$ {table.totalAmount.toFixed(2)}
                </p>
                <p className="text-[10px] font-mono text-on-surface-variant mt-0.5">
                  Abertura: {new Date(table.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {tables.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-12 bg-surface rounded-2xl border border-outline-variant shadow-sm text-center">
              <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center text-outline mb-4">
                <UtensilsCrossed size={40} />
              </div>
              <h3 className="text-lg font-bold text-on-surface">Nenhuma mesa aberta</h3>
              <p className="text-on-surface-variant text-sm mt-1 max-w-sm">Toque em "Nova Mesa" para iniciar o atendimento a um cliente.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Nova Mesa */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-outline-variant rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <h2 className="text-xl font-bold text-on-surface mb-4">Abrir Nova Mesa</h2>
            <form onSubmit={handleOpenTable} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">
                  Número da Mesa
                </label>
                <input
                  type="text"
                  required
                  value={newTable.tableNumber}
                  onChange={(e) => setNewTable({ ...newTable, tableNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-outline-variant bg-surface text-on-surface rounded-xl focus:ring-2 focus:ring-[#E8461C]/20 outline-none transition-all placeholder:text-on-surface-variant"
                  placeholder="Ex: 12"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">
                  Nome do Cliente (Opcional)
                </label>
                <input
                  type="text"
                  value={newTable.customerName}
                  onChange={(e) => setNewTable({ ...newTable, customerName: e.target.value })}
                  className="w-full px-4 py-2 border border-outline-variant bg-surface text-on-surface rounded-xl focus:ring-2 focus:ring-[#E8461C]/20 outline-none transition-all placeholder:text-on-surface-variant"
                  placeholder="Ex: João da Silva"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-bold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-[#E8461C] text-white rounded-xl hover:bg-[#c93b16] transition-colors"
                >
                  Abrir Mesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
