import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { CalendarClock, AlertCircle, AlertTriangle, Clock, CheckCircle2, CalendarOff } from 'lucide-react';

interface Lot {
  id: string;
  number: string;
  product: { name: string; unit: string };
  supplier?: { name: string };
  location: { name: string };
  expirationDate: string;
  currentQty: number;
  computedStatus: string;
  daysToExpiration: number;
}

export default function Expirations() {
  const { activeBranch } = useAuth();
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!activeBranch) return;
    try {
      setLoading(true);
      const res = await api.get(`/lots?branchId=${activeBranch.id}`);
      setLots(Array.isArray(res.data) ? res.data.filter((l: any) => l.product && l.location) : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeBranch]);

  if (!activeBranch) return <div className="p-8 text-on-surface">Selecione uma filial...</div>;

  const getStatusDisplay = (status: string, days: number) => {
    if (status === 'VENCIDO') {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-error-container text-error rounded-full font-bold text-[10px] sm:text-xs w-max tracking-wider uppercase">
          <AlertCircle size={14} /> Vencido há {Math.abs(days)} dia(s)
        </div>
      );
    }
    if (status === 'URGENTE') {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#fff7ed] text-[#ea580c] border border-[#ffedd5] rounded-full font-bold text-[10px] sm:text-xs w-max tracking-wider uppercase">
          <AlertTriangle size={14} /> Vence em {days} dia(s)
        </div>
      );
    }
    if (status === 'ATENCAO') {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#fefce8] text-[#ca8a04] border border-[#fef08a] rounded-full font-bold text-[10px] sm:text-xs w-max tracking-wider uppercase">
          <Clock size={14} /> Vence em {days} dia(s)
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7] rounded-full font-bold text-[10px] sm:text-xs w-max tracking-wider uppercase">
        <CheckCircle2 size={14} /> Normal ({days} dias)
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Central de Validades</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Acompanhamento e rastreabilidade de lotes da filial: {activeBranch.name}</p>
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center gap-3 text-on-surface-variant">
            <span className="material-symbols-outlined notranslate animate-spin text-4xl">sync</span>
            <span className="text-sm font-semibold">Carregando lotes...</span>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="divide-y divide-outline-variant">
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-surface-container-low text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                <div className="col-span-5">Produto & Lote</div>
                <div className="col-span-3">Local Atual</div>
                <div className="col-span-2 text-right">Qtd Disp.</div>
                <div className="col-span-2">Vencimento</div>
              </div>

              {lots.map(l => (
                <div key={l.id} className="flex flex-col md:grid md:grid-cols-12 gap-4 px-6 py-4 hover:bg-surface-container-low transition-colors items-start md:items-center text-sm border-b border-outline-variant md:border-0 last:border-0">
                  <div className="w-full md:col-span-5 flex items-center gap-4 border-b border-outline-variant md:border-0 pb-3 md:pb-0">
                    <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0">
                      <CalendarClock size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-on-surface text-base">{l.product.name}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5 font-medium">Lote: {l.number} {l.supplier ? `• ${l.supplier.name}` : ''}</p>
                    </div>
                  </div>
                  
                  <div className="w-full md:col-span-3 flex justify-between md:block items-center">
                    <span className="md:hidden text-[10px] text-on-surface-variant font-bold uppercase">Local Atual</span>
                    <span className="font-bold text-on-surface-variant">{l.location.name}</span>
                  </div>
                  
                  <div className="w-full md:col-span-2 flex justify-between md:block items-center md:text-right">
                    <span className="md:hidden text-[10px] text-on-surface-variant font-bold uppercase">Qtd Disp.</span>
                    <div>
                      <span className="font-bold text-on-surface text-lg">{l.currentQty}</span>
                      <span className="text-xs font-semibold text-on-surface-variant ml-1">{l.product.unit}</span>
                    </div>
                  </div>
                  
                  <div className="w-full md:col-span-2 flex flex-col gap-1.5 mt-2 md:mt-0 pt-3 md:pt-0 border-t border-outline-variant md:border-0">
                    <span className="font-bold text-on-surface">{new Date(l.expirationDate).toLocaleDateString('pt-BR')}</span>
                    {getStatusDisplay(l.computedStatus, l.daysToExpiration)}
                  </div>
                </div>
              ))}
              
              {lots.length === 0 && (
                <div className="px-6 py-12 text-center text-on-surface-variant text-sm flex flex-col items-center gap-2">
                  <CalendarOff size={40} className="text-outline mb-2" />
                  <span className="font-semibold text-lg">Nenhum lote rastreável em estoque.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
