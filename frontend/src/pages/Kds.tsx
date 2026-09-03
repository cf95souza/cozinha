import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

export default function Kds() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchKds = async () => {
    try {
      const res = await api.get('/kds');
      setTickets(res.data);
    } catch (error) {
      console.error('Erro ao buscar fila do KDS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKds();
    const interval = setInterval(fetchKds, 10000); // Polling a cada 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timeInterval);
  }, []);

  const updateItemStatus = async (itemId: string, status: string) => {
    try {
      // Optimistic Update
      setTickets(prev => prev.map(ticket => ({
        ...ticket,
        items: ticket.items.map((i: any) => i.id === itemId ? { ...i, status } : i)
      })));

      await api.patch(`/kds/${itemId}/status`, { status });
      fetchKds(); // Refresh garantido
    } catch (error) {
      toast.error('Erro ao atualizar status');
      fetchKds(); // Rollback
    }
  };

  const getElapsedTime = (createdAt: string) => {
    const diff = Math.floor((currentTime.getTime() - new Date(createdAt).getTime()) / 60000);
    return diff; // in minutes
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="h-[calc(100vh-6rem)] flex items-center justify-center bg-gray-900 rounded-xl">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E8461C] border-t-transparent"></div>
      </div>
    );
  }

  // Filtrar apenas tickets que possuem itens Pendentes ou Preparando
  const visibleTickets = tickets.filter(t => t.items.some((i: any) => ['PEDIDO', 'PREPARANDO'].includes(i.status)));

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-800">
      
      {/* Header do KDS */}
      <div className="flex justify-between items-center p-4 bg-gray-950 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <span className="material-icons text-[#E8461C] text-3xl">soup_kitchen</span>
          <div>
            <h1 className="text-2xl font-bold text-white uppercase tracking-wider">KDS - Cozinha</h1>
            <p className="text-gray-400 text-sm">Visualização de Produção</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-green-500 font-bold text-sm uppercase">Online</span>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-mono text-white">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </h2>
          </div>
        </div>
      </div>

      {/* Grid de Tickets */}
      <div className="flex-1 p-4 overflow-x-auto flex gap-4 bg-gray-900">
        {visibleTickets.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
            <span className="material-icons text-6xl mb-4 opacity-50">task_alt</span>
            <p className="text-xl">Nenhum pedido na fila.</p>
          </div>
        ) : (
          visibleTickets.map(ticket => {
            const elapsed = getElapsedTime(ticket.createdAt);
            const isUrgent = elapsed > 20; // 20 min = Urgente
            const isWarning = elapsed > 10; // 10 min = Atenção

            return (
              <div 
                key={ticket.id} 
                className={`flex-shrink-0 w-80 max-w-full flex flex-col bg-gray-800 rounded-xl overflow-hidden border-2 transition-colors ${
                  isUrgent ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 
                  isWarning ? 'border-orange-500' : 'border-gray-700'
                }`}
              >
                {/* Cabeçalho do Ticket */}
                <div className={`p-3 flex justify-between items-center text-white ${
                  isUrgent ? 'bg-red-600' : 
                  isWarning ? 'bg-orange-600' : 'bg-gray-700'
                }`}>
                  <div>
                    <h3 className="font-bold text-lg leading-tight flex items-center gap-1.5">
                      {ticket.type === 'DELIVERY' && <span className="material-icons text-[18px]">delivery_dining</span>}
                      {ticket.type === 'MESA' ? `Mesa ${ticket.tableNumber}` : ticket.type === 'DELIVERY' ? `Delivery: ${ticket.customerName}` : 'Balcão / Viagem'}
                    </h3>
                    <p className="text-sm opacity-80">{ticket.user?.name || 'Operador'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold font-mono">{elapsed}'</span>
                    <p className="text-xs opacity-80 uppercase">T. Decorrido</p>
                  </div>
                </div>

                {/* Itens do Ticket */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {ticket.items.map((item: any) => {
                    if (['ENTREGUE', 'CANCELADO'].includes(item.status)) return null;

                    const isPreparing = item.status === 'PREPARANDO';

                    return (
                      <div 
                        key={item.id} 
                        className={`p-3 rounded-lg flex items-center justify-between border ${
                          isPreparing 
                            ? 'bg-blue-900/30 border-blue-700' 
                            : 'bg-gray-700/50 border-gray-600'
                        }`}
                      >
                        <div className="flex-1 mr-2">
                          <p className="text-white font-medium text-lg leading-tight">
                            <span className="font-bold text-[#E8461C] mr-2">{item.quantity}x</span> 
                            {item.product.name}
                          </p>
                          {isPreparing && (
                            <span className="inline-block mt-1 text-xs bg-blue-600 text-white px-2 py-0.5 rounded uppercase font-bold">
                              Em Preparo
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          {!isPreparing && (
                            <button 
                              onClick={() => updateItemStatus(item.id, 'PREPARANDO')}
                              className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded shadow flex items-center justify-center transition-colors"
                              title="Iniciar Preparo"
                            >
                              <span className="material-icons">play_arrow</span>
                            </button>
                          )}
                          <button 
                            onClick={() => updateItemStatus(item.id, 'ENTREGUE')}
                            className="bg-green-600 hover:bg-green-500 text-white p-2 rounded shadow flex items-center justify-center transition-colors"
                            title="Marcar como Pronto"
                          >
                            <span className="material-icons">check</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
