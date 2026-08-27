import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Receiving {
  id: string;
  invoice: string | null;
  date: string;
  status: string;
  supplier: { name: string };
  user: { name: string };
  _count: { items: number };
}

export default function ReceivingList() {
  const { activeBranch } = useAuth();
  const navigate = useNavigate();
  const [receivings, setReceivings] = useState<Receiving[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!activeBranch) return;
    try {
      setLoading(true);
      const res = await api.get(`/receivings?branchId=${activeBranch.id}`);
      setReceivings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeBranch]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AGUARDANDO_CONFERENCIA':
        return <span className="text-xs bg-surface-container text-on-surface-variant px-2.5 py-0.5 rounded-full font-semibold">Aguardando</span>;
      case 'EM_CONFERENCIA':
        return <span className="text-xs bg-primary-container text-primary px-2.5 py-0.5 rounded-full font-semibold">Conferindo</span>;
      case 'APROVADO':
        return <span className="text-xs bg-secondary-container text-on-secondary-container px-2.5 py-0.5 rounded-full font-semibold">Aprovado</span>;
      case 'APROVADO_RESSALVA':
        return <span className="text-xs bg-tertiary-container text-on-tertiary-container px-2.5 py-0.5 rounded-full font-semibold">Aprov. Ressalva</span>;
      default:
        return <span className="text-xs bg-surface-container text-on-surface-variant px-2.5 py-0.5 rounded-full font-semibold">{status}</span>;
    }
  };

  if (!activeBranch) return <div className="p-8 text-on-surface">Selecione uma filial no topo para continuar.</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Recebimentos</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Gerencie a entrada de mercadorias da filial: {activeBranch.name}</p>
        </div>
        
        <button 
          onClick={() => navigate('/recebimento/novo')}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Novo Recebimento
        </button>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined animate-spin text-primary">sync</span>
              <span className="text-sm">Carregando...</span>
            </div>
          </div>
        ) : receivings.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant text-sm flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-3xl text-secondary">check_circle</span>
            Nenhum recebimento cadastrado.
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {/* Header Fake Table */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-surface-container-low text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              <div className="col-span-3">Nota / Data</div>
              <div className="col-span-3">Fornecedor</div>
              <div className="col-span-2 text-center">Itens</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-2 text-right">Ação</div>
            </div>

            {receivings.map(r => (
              <div 
                key={r.id} 
                onClick={() => navigate(`/recebimento/${r.id}`)}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 hover:bg-surface-container-low transition-colors cursor-pointer items-center"
              >
                <div className="col-span-1 md:col-span-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0">
                    <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-on-surface">{r.invoice ? `NF ${r.invoice}` : 'S/N'}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{new Date(r.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-3">
                  <span className="text-sm font-semibold text-on-surface-variant">{r.supplier.name}</span>
                </div>

                <div className="col-span-1 md:col-span-2 flex md:justify-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container rounded-full text-xs font-semibold text-on-surface-variant">
                    <span className="material-symbols-outlined text-[14px]">format_list_numbered</span>
                    {r._count.items}
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2 flex md:justify-center">
                  {getStatusBadge(r.status)}
                </div>

                <div className="col-span-1 md:col-span-2 flex justify-end">
                  <button className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                    {r.status === 'APROVADO' || r.status === 'APROVADO_RESSALVA' ? 'Visualizar' : 'Conferir'}
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
