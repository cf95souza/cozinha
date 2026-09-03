import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export default function Tables() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTable, setNewTable] = useState({ tableNumber: '', customerName: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tables');
      setTables(res.data);
    } catch (error) {
      toast.error('Erro ao buscar mesas');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/tables', newTable);
      toast.success('Mesa aberta com sucesso!');
      setIsModalOpen(false);
      navigate(`/mesas/${res.data.id}`);
    } catch (error) {
      toast.error('Erro ao abrir mesa');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mesas & Comandas</h1>
          <p className="text-gray-600 dark:text-gray-400">Controle de atendimento no restaurante</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#E8461C] text-white px-4 py-2 rounded-lg hover:bg-[#c93b16] transition-colors flex items-center gap-2"
        >
          <span className="material-icons">add</span>
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
              className="bg-orange-50 dark:bg-orange-900/20 border-2 border-[#E8461C] rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all text-center flex flex-col justify-center min-h-[120px]"
            >
              <span className="material-icons text-[#E8461C] mb-2 text-3xl">table_restaurant</span>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                Mesa {table.tableNumber || 'S/N'}
              </h3>
              {table.customerName && (
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{table.customerName}</p>
              )}
              <p className="font-semibold text-[#E8461C] mt-2">
                R$ {table.totalAmount.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(table.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}

          {tables.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <span className="material-icons text-gray-300 dark:text-gray-600 text-6xl mb-4">table_restaurant</span>
              <p className="text-gray-500 dark:text-gray-400">Nenhuma mesa aberta no momento.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Nova Mesa */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Abrir Nova Mesa</h2>
            <form onSubmit={handleOpenTable} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Número da Mesa
                </label>
                <input
                  type="text"
                  required
                  value={newTable.tableNumber}
                  onChange={(e) => setNewTable({ ...newTable, tableNumber: e.target.value })}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: 12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Cliente (Opcional)
                </label>
                <input
                  type="text"
                  value={newTable.customerName}
                  onChange={(e) => setNewTable({ ...newTable, customerName: e.target.value })}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: João da Silva"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E8461C] text-white rounded-lg hover:bg-[#c93b16]"
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
