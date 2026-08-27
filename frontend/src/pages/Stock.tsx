import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Search, Filter, AlertTriangle, Download, ChevronDown, ChevronRight } from 'lucide-react';

export default function Stock() {
  const { activeBranch } = useAuth();
  
  const [stockBalances, setStockBalances] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [onlyBelowMin, setOnlyBelowMin] = useState(false);
  const [onlyControlled, setOnlyControlled] = useState(false);
  
  const [expandedLocations, setExpandedLocations] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (activeBranch) {
      loadData();
    }
  }, [activeBranch]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stockRes, catRes, locRes] = await Promise.all([
        api.get(`/stock/balances?branchId=${activeBranch?.id}`),
        api.get(`/categories?branchId=${activeBranch?.id}`),
        api.get(`/locations?branchId=${activeBranch?.id}`)
      ]);
      setStockBalances(stockRes.data);
      const cats = catRes.data.data || catRes.data;
      const locs = locRes.data.data || locRes.data;
      
      setCategories(cats);
      setLocations(locs);
      
      const initialExpanded: Record<string, boolean> = {};
      locs.forEach((loc: any) => initialExpanded[loc.id] = true);
      setExpandedLocations(initialExpanded);
      
    } catch (error) {
      console.error('Erro ao carregar estoque', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLocation = (locId: string) => {
    setExpandedLocations(prev => ({ ...prev, [locId]: !prev[locId] }));
  };

  const filteredBalances = useMemo(() => {
    return stockBalances.filter(balance => {
      if (search && !balance.product.name.toLowerCase().includes(search.toLowerCase()) && 
          !balance.product.sku?.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter && balance.product.categoryId !== categoryFilter) return false;
      if (locationFilter && balance.locationId !== locationFilter) return false;
      if (onlyBelowMin && balance.quantity >= balance.product.minStock) return false;
      if (onlyControlled && !balance.product.controlled) return false;
      return true;
    });
  }, [stockBalances, search, categoryFilter, locationFilter, onlyBelowMin, onlyControlled]);

  const groupedBalances = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredBalances.forEach(balance => {
      const locId = balance.locationId;
      if (!groups[locId]) groups[locId] = [];
      groups[locId].push(balance);
    });
    return groups;
  }, [filteredBalances]);

  const totalValue = filteredBalances.reduce((acc, curr) => acc + (curr.quantity * (curr.product.costPrice || 0)), 0);
  const totalItems = filteredBalances.length;
  const criticalItems = filteredBalances.filter(b => b.quantity < b.product.minStock).length;

  const exportCSV = () => {
    const headers = ['Produto,SKU,Local,Categoria,Controlado,Quantidade,Unidade,Min,Max,Custo,ValorTotal'];
    const rows = filteredBalances.map(b => {
      return `"${b.product.name}","${b.product.sku || ''}","${b.location.name}","${b.product.category?.name || ''}",${b.product.controlled ? 'Sim' : 'Não'},${b.quantity},"${b.product.unit}",${b.product.minStock},${b.product.maxStock},${b.product.costPrice || 0},${(b.quantity * (b.product.costPrice || 0)).toFixed(2)}`;
    });
    const csvContent = headers.concat(rows).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Estoque_${activeBranch?.name}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderProgressBar = (current: number, min: number, max: number) => {
    let percentage = 0;
    let colorClass = 'bg-primary';
    
    if (max > 0) {
      percentage = Math.min((current / max) * 100, 100);
    } else if (current > 0) {
      percentage = 100;
    }
    
    if (current < min) {
      colorClass = 'bg-error';
    } else if (current <= min * 1.2 && min > 0) {
      colorClass = 'bg-secondary';
    }

    return (
      <div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden flex" title={`Min: ${min} | Max: ${max}`}>
        <div className={`h-full ${colorClass} transition-all`} style={{ width: `${percentage}%` }}></div>
      </div>
    );
  };

  if (!activeBranch) return <div className="p-8 text-on-surface">Selecione uma filial no topo para continuar.</div>;

  return (
    <div className="space-y-6 pb-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Saldos de Estoque</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Gerencie os itens físicos da filial: {activeBranch.name}</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-5 py-2.5 bg-surface text-on-surface rounded-xl text-sm font-semibold border border-outline-variant hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-[18px]">download</span>
          Exportar CSV
        </button>
      </div>

      {/* KPIs Row */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-surface border border-outline-variant rounded-2xl p-5 flex flex-col gap-1">
          <span className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Valor em Estoque</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-sm text-on-surface-variant font-medium">R$</span>
            <span className="text-kpi font-extrabold text-on-surface tracking-tight">
              {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant rounded-2xl p-5 flex flex-col gap-1">
          <span className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Total de Itens</span>
          <span className="text-kpi font-extrabold text-on-surface tracking-tight mt-1">{totalItems}</span>
        </div>

        <div className={`border p-5 rounded-2xl flex flex-col gap-1 ${criticalItems > 0 ? 'bg-error-container/30 border-error/30' : 'bg-surface border-outline-variant'}`}>
          <span className={`text-xs font-medium uppercase tracking-wider ${criticalItems > 0 ? 'text-error' : 'text-on-surface-variant'}`}>Itens Críticos</span>
          <span className={`text-kpi font-extrabold tracking-tight mt-1 ${criticalItems > 0 ? 'text-error' : 'text-on-surface'}`}>
            {criticalItems}
          </span>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="bg-surface p-5 rounded-2xl border border-outline-variant flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">search</span>
          <input 
            type="text" 
            placeholder="Buscar produto ou SKU..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-4 py-2 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
          <option value="">Todas Categorias</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="px-4 py-2 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
          <option value="">Todos Locais</option>
          {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>

        <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer text-on-surface select-none">
          <input type="checkbox" checked={onlyBelowMin} onChange={e => setOnlyBelowMin(e.target.checked)} className="rounded text-primary focus:ring-primary/20" />
          Abaixo do Mín.
        </label>
        
        <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer text-on-surface select-none">
          <input type="checkbox" checked={onlyControlled} onChange={e => setOnlyControlled(e.target.checked)} className="rounded text-primary focus:ring-primary/20" />
          Controlados
        </label>
      </div>

      {/* Tabela/Lista de Estoque */}
      <div className="bg-surface rounded-2xl border border-outline-variant overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined animate-spin text-primary">sync</span>
              <span className="text-sm">Carregando saldos...</span>
            </div>
          </div>
        ) : filteredBalances.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant text-sm flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">inventory_2</span>
            Nenhum saldo encontrado para os filtros atuais.
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {/* Header da "tabela" (agora usando divs estilo grid) */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-surface-container-low text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              <div className="col-span-5">Produto</div>
              <div className="col-span-3 text-center">Nível</div>
              <div className="col-span-2 text-right">Qtd Atual</div>
              <div className="col-span-2 text-right">Valor Est.</div>
            </div>

            {Object.keys(groupedBalances).map(locId => {
              const loc = locations.find(l => l.id === locId) || { name: 'Desconhecido' };
              const isExpanded = expandedLocations[locId];
              const balances = groupedBalances[locId];
              const locTotalValue = balances.reduce((acc, curr) => acc + (curr.quantity * (curr.product.costPrice || 0)), 0);

              return (
                <div key={locId} className="flex flex-col">
                  {/* Location Header */}
                  <div 
                    className="px-6 py-3.5 bg-surface cursor-pointer hover:bg-surface-container transition-colors flex justify-between items-center border-b border-outline-variant"
                    onClick={() => toggleLocation(locId)}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-[20px] text-on-surface-variant transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                      <span className="font-semibold text-primary">{loc.name}</span>
                      <span className="text-[10px] bg-primary-container text-primary px-2 py-0.5 rounded-full font-bold">{balances.length} itens</span>
                    </div>
                    <span className="text-sm font-semibold text-on-surface-variant">R$ {locTotalValue.toFixed(2)}</span>
                  </div>

                  {/* Items list */}
                  {isExpanded && (
                    <div className="divide-y divide-outline-variant bg-surface">
                      {balances.map(balance => (
                        <div key={balance.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-3 hover:bg-surface-container-low transition-colors items-center">
                          <div className="col-span-1 md:col-span-5 flex flex-col md:pl-10">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm text-on-surface">{balance.product.name}</p>
                              {balance.product.controlled && <span className="text-[10px] bg-secondary-container text-on-secondary-container px-1.5 py-0.5 rounded-full font-bold">Controlado</span>}
                            </div>
                            <p className="text-xs text-on-surface-variant mt-0.5">SKU: {balance.product.sku || '-'} • Cat: {balance.product.category?.name || '-'}</p>
                          </div>
                          
                          <div className="col-span-1 md:col-span-3 flex md:justify-center items-center py-2 md:py-0">
                            {renderProgressBar(balance.quantity, balance.product.minStock, balance.product.maxStock)}
                          </div>
                          
                          <div className="col-span-1 md:col-span-2 flex md:justify-end items-center gap-2">
                            {balance.quantity < balance.product.minStock && <span className="material-symbols-outlined text-[16px] text-error" title="Abaixo do Mínimo">warning</span>}
                            <div className="flex items-baseline gap-1">
                              <span className={`font-bold text-base ${balance.quantity < balance.product.minStock ? 'text-error' : 'text-on-surface'}`}>
                                {balance.quantity}
                              </span>
                              <span className="text-xs text-on-surface-variant w-5 text-left">{balance.product.unit}</span>
                            </div>
                          </div>
                          
                          <div className="col-span-1 md:col-span-2 md:text-right font-medium text-sm text-on-surface-variant">
                            R$ {((balance.product.costPrice || 0) * balance.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
