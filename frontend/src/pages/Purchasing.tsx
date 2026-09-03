import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

export default function Purchasing() {
  const [pos, setPos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPOs = async () => {
    try {
      const res = await api.get('/purchasing');
      setPos(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao buscar pedidos de compra');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOs();
  }, []);

  const approvePO = async (id: string) => {
    try {
      await api.post(`/purchasing/${id}/approve`);
      toast.success('Pedido Aprovado com sucesso!');
      fetchPOs();
    } catch (error) {
      toast.error('Erro ao aprovar pedido');
    }
  };

  const cancelPO = async (id: string) => {
    try {
      await api.post(`/purchasing/${id}/cancel`);
      toast.success('Pedido Cancelado!');
      fetchPOs();
    } catch (error) {
      toast.error('Erro ao cancelar pedido');
    }
  };

  if (loading) return (
    <div className="p-12 text-center flex flex-col items-center gap-3 text-on-surface-variant">
      <span className="material-symbols-outlined notranslate animate-spin text-4xl">sync</span>
      <span className="text-sm font-semibold">Carregando pedidos de compra...</span>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Pedidos de Compra (PO)</h1>
          <p className="text-sm text-on-surface-variant">Controle formal de compras e autorizações.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pos.map(po => (
          <div key={po.id} className="bg-surface border border-outline-variant rounded-2xl shadow-sm p-5 flex flex-col gap-4 relative">
            <div className="flex justify-between items-start">
              <div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                  po.status === 'RASCUNHO' ? 'bg-surface-variant text-on-surface-variant' :
                  po.status === 'APROVADO' ? 'bg-primary-container text-on-primary-container' :
                  po.status === 'RECEBIDO' ? 'bg-green-100 text-green-800' :
                  'bg-error-container text-on-error-container'
                }`}>
                  {po.status}
                </span>
                <h3 className="font-bold text-lg text-on-surface mt-2">{po.supplier?.name || 'Sem Fornecedor'}</h3>
                <p className="text-xs text-on-surface-variant">Emissão: {new Date(po.orderDate).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <span className="block text-xl font-bold text-on-surface">R$ {po.totalAmount.toFixed(2)}</span>
                <span className="text-[10px] text-on-surface-variant uppercase">{po.items.length} ITENS</span>
              </div>
            </div>

            <div className="flex-1 bg-surface-container-lowest rounded-xl border border-outline-variant p-3 overflow-y-auto max-h-32">
              <ul className="space-y-2">
                {po.items.map((item: any) => (
                  <li key={item.id} className="flex justify-between text-sm">
                    <span className="text-on-surface line-clamp-1 flex-1 pr-2">{item.product.name}</span>
                    <span className="font-bold text-on-surface-variant shrink-0">{item.quantity} {item.product.unit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {po.status === 'RASCUNHO' && (
              <div className="flex gap-2 pt-2 border-t border-outline-variant">
                <button onClick={() => cancelPO(po.id)} className="flex-1 py-2 text-sm font-bold text-error border border-error-container rounded-lg hover:bg-error-container transition">
                  Cancelar
                </button>
                <button onClick={() => approvePO(po.id)} className="flex-1 py-2 text-sm font-bold bg-primary text-on-primary rounded-lg hover:bg-primary-hover transition">
                  Aprovar PO
                </button>
              </div>
            )}
          </div>
        ))}

        {pos.length === 0 && (
          <div className="col-span-full p-16 text-center text-on-surface-variant bg-surface rounded-2xl shadow-sm border border-outline-variant border-dashed">
            <span className="material-symbols-outlined notranslate text-5xl opacity-50 mb-3">shopping_cart</span>
            <p className="font-bold text-lg text-on-surface">Nenhum Pedido de Compra</p>
            <p className="text-sm mt-1">Gere novos pedidos através do módulo de Cotação ou Sugestão de Compras.</p>
          </div>
        )}
      </div>
    </div>
  );
}
