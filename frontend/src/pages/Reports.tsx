import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function Reports() {
  const { user, activeBranch } = useAuth();
  const [activeTab, setActiveTab] = useState('stock');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [allBranches, setAllBranches] = useState(false);
  
  // Para input manual de CMV
  const [manualRevenue, setManualRevenue] = useState<number>(0);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [costCenterId, setCostCenterId] = useState('');
  const [costCenters, setCostCenters] = useState<any[]>([]);

  useEffect(() => {
    api.get('/finance/cost-centers').then(res => setCostCenters(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (activeBranch || allBranches) {
      loadData(activeTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBranch, activeTab, allBranches]);

  const loadData = async (tab: string) => {
    setLoading(true);
    try {
      const url = allBranches ? `/reports/${tab}` : `/reports/${tab}?branchId=${activeBranch?.id}`;
      const res = await api.get(url);
      let fetchedData = res.data;
      
      // Client-side date and custom filtering
      if (startDate || endDate || (tab === 'invoices' && costCenterId)) {
        fetchedData = fetchedData.filter((item: any) => {
          const itemDate = new Date(item.createdAt || item.date || item.startedAt || item.expirationDate || item.issueDate);
          if (startDate && itemDate < new Date(startDate)) return false;
          if (endDate && itemDate > new Date(endDate + 'T23:59:59')) return false;
          
          if (tab === 'invoices' && costCenterId) {
            if (item.costCenterId !== costCenterId) return false;
          }
          return true;
        });
      }
      
      setData(fetchedData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'stock', label: 'Estoque Atual' },
    { id: 'invoices', label: 'Notas / Despesas' },
    { id: 'movements', label: 'Movimentações' },
    { id: 'losses', label: 'Perdas' },
    { id: 'expirations', label: 'Validades' },
    { id: 'receivings', label: 'Recebimentos' },
    { id: 'inventories', label: 'Inventário' },
    { id: 'productions', label: 'Produção' },
    { id: 'cmv', label: 'CMV' },
    { id: 'abc', label: 'Curva ABC' },
  ];

  const handleExportCSV = () => {
    if (data.length === 0) return;
    
    let headers = [];
    let rows = [];

    if (activeTab === 'stock') {
      headers = ['Produto', 'Local', 'Quantidade', 'Custo', 'Valor Total'];
      rows = data.map(item => `"${item.product?.name || 'Desconhecido'}","${item.location?.name || 'Desconhecido'}",${item.quantity},${item.product?.costPrice || 0},${(item.quantity * (item.product?.costPrice || 0))}`);
    } else if (activeTab === 'invoices') {
      headers = ['Data de Emissão', 'Filial', 'Fornecedor', 'Nº da Nota', 'Centro de Custo', 'Tipo', 'Valor Final (R$)'];
      rows = data.map(item => `"${new Date(item.issueDate).toLocaleDateString()}","${item.branch?.name || 'Matriz'}","${item.supplier?.name || 'Desconhecido'}","${item.invoiceNumber || '-'}","${item.costCenter?.name || 'Desconhecido'}","${item.invoiceType?.name || '-'}",${item.finalAmount || 0}`);
    } else if (activeTab === 'movements') {
      headers = ['Data', 'Produto', 'Tipo', 'Origem', 'Destino', 'Quantidade', 'Responsável'];
      rows = data.map(item => `"${new Date(item.createdAt).toLocaleString()}","${item.product?.name || 'Desconhecido'}","${item.type}","${item.originLocation?.name || '-'}","${item.destinationLocation?.name || '-'}",${item.quantity},"${item.user?.name || 'Sistema'}"`);
    } else if (activeTab === 'losses') {
      headers = ['Data', 'Produto', 'Quantidade', 'Motivo', 'Responsável'];
      rows = data.map(item => `"${new Date(item.date).toLocaleString()}","${item.product?.name || 'Desconhecido'}",${item.quantity},"${item.reason}","${item.user?.name || 'Sistema'}"`);
    } else if (activeTab === 'expirations') {
      headers = ['Vencimento', 'Lote', 'Produto', 'Quantidade', 'Status'];
      rows = data.map(item => `"${new Date(item.expirationDate).toLocaleDateString()}","${item.number}","${item.product?.name || 'Desconhecido'}",${item.currentQty},"${item.status}"`);
    } else if (activeTab === 'receivings') {
      headers = ['Data', 'Nota Fiscal', 'Fornecedor', 'Responsável', 'Status'];
      rows = data.map(item => `"${new Date(item.date).toLocaleDateString()}","${item.invoice || '-'}","${item.supplier?.name || '-'}","${item.user?.name || 'Sistema'}","${item.status}"`);
    } else if (activeTab === 'inventories') {
      headers = ['Data', 'Responsável', 'Status', 'Itens Contados'];
      rows = data.map(item => `"${new Date(item.date).toLocaleDateString()}","${item.user?.name || 'Sistema'}","${item.status}",${item.items?.length || 0}`);
    } else if (activeTab === 'productions') {
      headers = ['Data', 'Produto', 'Planejado', 'Produzido', 'Rendimento %', 'Responsável'];
      rows = data.map(item => `"${new Date(item.startedAt || item.finishedAt).toLocaleDateString()}","${item.product?.name || 'Desconhecido'}",${item.plannedQuantity},${item.producedQuantity},${(item.yieldPercentage || 0) * 100},"${item.user?.name || 'Sistema'}"`);
    } else if (activeTab === 'cmv') {
      headers = ['Data', 'Valor Total em Estoque', 'Faturamento', 'CMV %'];
      rows = data.map(item => {
        const cmvPercent = manualRevenue > 0 ? (item.totalValue / manualRevenue) * 100 : 0;
        return `"${new Date(item.date).toLocaleDateString()}",${item.totalValue},${manualRevenue},${cmvPercent}`;
      });
    } else if (activeTab === 'abc') {
      headers = ['Classificação', 'Produto', 'Categoria', 'Quantidade', 'Custo Unitário', 'Valor Total', '% Acumulado'];
      rows = data.map(item => `"${item.classification}","${item.name}","${item.categoryName}",${item.qty},${item.cost},${item.value},${item.accumPercent}`);
    }

    const csvContent = [headers.join(',')].concat(rows).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Relatorio_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Relatórios Avançados</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Extraia dados estratégicos {allBranches ? 'de todas as filiais' : `da filial: ${activeBranch?.name}`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {user?.role === 'ADMIN' && (
            <div className="flex items-center gap-2 bg-surface border border-outline-variant rounded-xl px-2 py-1">
              <button
                onClick={() => setAllBranches(false)}
                className={`px-3 py-1.5 text-sm font-bold rounded-lg transition-colors ${!allBranches ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}
              >
                Filial Atual
              </button>
              <button
                onClick={() => setAllBranches(true)}
                className={`px-3 py-1.5 text-sm font-bold rounded-lg transition-colors ${allBranches ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}
              >
                Todas as Filiais
              </button>
            </div>
          )}
          <button 
            onClick={handleExportCSV}
            disabled={data.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-outline-variant text-on-surface rounded-xl text-sm font-bold hover:bg-surface-container transition-colors shadow-sm disabled:opacity-50"
          >
            <span className="material-symbols-outlined notranslate text-[18px]">download</span> Exportar CSV
          </button>
        </div>
      </div>

      {activeTab === 'cmv' && (
        <div className="bg-primary-container text-on-primary-container p-5 rounded-2xl border border-primary/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold">Cálculo de CMV % (Manual)</h3>
            <p className="text-sm opacity-90">Informe o faturamento do período para calcular a proporção do valor em estoque.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-bold">R$</span>
            <input 
              type="number" 
              value={manualRevenue || ''} 
              onChange={e => setManualRevenue(Number(e.target.value))}
              placeholder="Ex: 50000"
              className="border-none rounded-xl py-2.5 px-4 bg-surface text-on-surface font-bold text-right w-48 focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </div>
      )}

      {/* Date Filters */}
      <div className="bg-surface p-5 rounded-2xl shadow-sm border border-outline-variant flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-2 text-on-surface-variant font-bold">
          <span className="material-symbols-outlined notranslate text-[20px]">filter_list</span>
          <span>Filtros:</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className="text-sm font-semibold text-on-surface shrink-0">Data Inicial:</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => { setStartDate(e.target.value); loadData(activeTab); }}
              className="border-outline-variant rounded-xl py-2 px-3 bg-surface-container-lowest text-on-surface text-sm border w-full sm:w-auto outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className="text-sm font-semibold text-on-surface shrink-0">Data Final:</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => { setEndDate(e.target.value); loadData(activeTab); }}
              className="border-outline-variant rounded-xl py-2 px-3 bg-surface-container-lowest text-on-surface text-sm border w-full sm:w-auto outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {activeTab === 'invoices' && (
            <div className="flex items-center gap-3 w-full sm:w-auto border-l border-outline-variant pl-4">
              <label className="text-sm font-semibold text-on-surface shrink-0">Centro de Custo:</label>
              <select 
                value={costCenterId}
                onChange={e => { setCostCenterId(e.target.value); loadData(activeTab); }}
                className="border-outline-variant rounded-xl py-2 px-3 bg-surface-container-lowest text-on-surface text-sm border w-full sm:w-auto outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Todos</option>
                {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap px-4 py-2 text-sm font-bold rounded-xl transition-colors ${
              activeTab === tab.id 
                ? 'bg-primary-container text-primary' 
                : 'bg-surface text-on-surface-variant hover:bg-surface-container border border-outline-variant'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-on-surface-variant text-sm font-semibold">Gerando relatório...</p>
          </div>
        ) : (
          <div className="flex flex-col overflow-x-auto">
            <div className="min-w-[800px] divide-y divide-outline-variant">
              
              {/* Table Header via Grid */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-surface-container-low text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                {activeTab === 'stock' && (
                  <>
                    <div className="col-span-5">Produto</div>
                    <div className="col-span-3">Local</div>
                    <div className="col-span-2 text-right">Qtd</div>
                    <div className="col-span-2 text-right">Valor Est.</div>
                  </>
                )}
                {activeTab === 'invoices' && (
                  <>
                    <div className="col-span-2">Emissão</div>
                    <div className="col-span-2">Filial</div>
                    <div className="col-span-3">Fornecedor</div>
                    <div className="col-span-1">NF</div>
                    <div className="col-span-2">Centro Custo</div>
                    <div className="col-span-2 text-right">Valor Final</div>
                  </>
                )}
                {activeTab === 'movements' && (
                  <>
                    <div className="col-span-2">Data</div>
                    <div className="col-span-4">Produto</div>
                    <div className="col-span-2">Tipo</div>
                    <div className="col-span-2 text-right">Qtd</div>
                    <div className="col-span-2">Responsável</div>
                  </>
                )}
                {activeTab === 'losses' && (
                  <>
                    <div className="col-span-2">Data</div>
                    <div className="col-span-4">Produto</div>
                    <div className="col-span-2 text-right">Qtd</div>
                    <div className="col-span-2">Motivo</div>
                    <div className="col-span-2">Responsável</div>
                  </>
                )}
                {activeTab === 'expirations' && (
                  <>
                    <div className="col-span-2">Vencimento</div>
                    <div className="col-span-2">Lote</div>
                    <div className="col-span-4">Produto</div>
                    <div className="col-span-2 text-right">Qtd</div>
                    <div className="col-span-2">Fornecedor</div>
                  </>
                )}
                {activeTab === 'receivings' && (
                  <>
                    <div className="col-span-2">Data</div>
                    <div className="col-span-2">NF</div>
                    <div className="col-span-4">Fornecedor</div>
                    <div className="col-span-2">Responsável</div>
                    <div className="col-span-2">Status</div>
                  </>
                )}
                {activeTab === 'inventories' && (
                  <>
                    <div className="col-span-2">Data</div>
                    <div className="col-span-4">Responsável</div>
                    <div className="col-span-4">Status</div>
                    <div className="col-span-2 text-right">Itens Contados</div>
                  </>
                )}
                {activeTab === 'productions' && (
                  <>
                    <div className="col-span-2">Data</div>
                    <div className="col-span-4">Produto Final</div>
                    <div className="col-span-2 text-right">Planejado</div>
                    <div className="col-span-2 text-right">Produzido</div>
                    <div className="col-span-2 text-right">Rendimento</div>
                  </>
                )}
                {activeTab === 'cmv' && (
                  <>
                    <div className="col-span-3">Data do Snapshot</div>
                    <div className="col-span-3 text-right">Valor em Estoque (R$)</div>
                    <div className="col-span-3 text-right">Faturamento Inf. (R$)</div>
                    <div className="col-span-3 text-right">CMV % (Estoque/Fat)</div>
                  </>
                )}
                {activeTab === 'abc' && (
                  <>
                    <div className="col-span-1 text-center">Classe</div>
                    <div className="col-span-3">Produto</div>
                    <div className="col-span-2">Categoria</div>
                    <div className="col-span-2 text-right">Qtd</div>
                    <div className="col-span-2 text-right">Custo Un.</div>
                    <div className="col-span-2 text-right">Valor Total</div>
                  </>
                )}
              </div>

              {/* Table Rows */}
              {data.map(item => (
                <div key={item.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-surface-container-low transition-colors items-center text-sm">
                  {activeTab === 'stock' && (
                    <>
                      <div className="col-span-5 font-bold text-on-surface">{item.product?.name || 'Desconhecido'}</div>
                      <div className="col-span-3 text-on-surface-variant">{item.location?.name || 'Desconhecido'}</div>
                      <div className="col-span-2 text-right font-bold">{item.quantity}</div>
                      <div className="col-span-2 text-right font-bold text-primary">R$ {((item.product?.costPrice || 0) * item.quantity).toFixed(2)}</div>
                    </>
                  )}
                  {activeTab === 'invoices' && (
                    <>
                      <div className="col-span-2">{new Date(item.issueDate).toLocaleDateString()}</div>
                      <div className="col-span-2 font-bold text-xs uppercase text-on-surface-variant">{item.branch?.name || 'Matriz'}</div>
                      <div className="col-span-3 font-bold text-on-surface truncate">{item.supplier?.name || 'Desconhecido'}</div>
                      <div className="col-span-1 text-on-surface-variant">{item.invoiceNumber || '-'}</div>
                      <div className="col-span-2 text-xs font-semibold px-2 py-1 bg-primary-container text-on-primary-container rounded-md truncate w-fit">{item.costCenter?.name || 'Desconhecido'}</div>
                      <div className="col-span-2 text-right font-black text-primary">R$ {(item.finalAmount || 0).toFixed(2)}</div>
                    </>
                  )}
                  {activeTab === 'movements' && (
                    <>
                      <div className="col-span-2">{new Date(item.createdAt).toLocaleString()}</div>
                      <div className="col-span-4 font-bold text-on-surface">{item.product?.name || 'Desconhecido'}</div>
                      <div className="col-span-2 font-bold uppercase text-xs">{item.type?.replace('_', ' ') || '-'}</div>
                      <div className={`col-span-2 text-right font-bold ${item.type?.includes('SAIDA') || item.type?.includes('PERDA') ? 'text-error' : 'text-primary'}`}>
                        {item.quantity}
                      </div>
                      <div className="col-span-2">{item.user?.name || 'Sistema'}</div>
                    </>
                  )}
                  {activeTab === 'losses' && (
                    <>
                      <div className="col-span-2">{new Date(item.date).toLocaleDateString()}</div>
                      <div className="col-span-4 font-bold text-on-surface">{item.product?.name || 'Desconhecido'}</div>
                      <div className="col-span-2 text-right font-bold text-error">{item.quantity}</div>
                      <div className="col-span-2 text-on-surface-variant uppercase text-xs font-bold">{item.reason || '-'}</div>
                      <div className="col-span-2">{item.user?.name || 'Sistema'}</div>
                    </>
                  )}
                  {activeTab === 'expirations' && (
                    <>
                      <div className={`col-span-2 font-bold ${new Date(item.expirationDate) < new Date() ? 'text-error' : 'text-on-surface'}`}>
                        {new Date(item.expirationDate).toLocaleDateString()}
                      </div>
                      <div className="col-span-2 font-mono text-xs text-on-surface-variant">{item.number}</div>
                      <div className="col-span-4 font-bold">{item.product?.name || 'Desconhecido'}</div>
                      <div className="col-span-2 text-right font-bold">{item.currentQty}</div>
                      <div className="col-span-2 text-on-surface-variant">{item.supplier?.name || '-'}</div>
                    </>
                  )}
                  {activeTab === 'receivings' && (
                    <>
                      <div className="col-span-2">{new Date(item.date).toLocaleDateString()}</div>
                      <div className="col-span-2 font-bold text-on-surface">{item.invoice || 'S/N'}</div>
                      <div className="col-span-4">{item.supplier?.name || '-'}</div>
                      <div className="col-span-2">{item.user?.name || 'Sistema'}</div>
                      <div className="col-span-2 text-xs font-bold uppercase">{item.status.replace('_', ' ')}</div>
                    </>
                  )}
                  {activeTab === 'inventories' && (
                    <>
                      <div className="col-span-2">{new Date(item.date).toLocaleDateString()}</div>
                      <div className="col-span-4">{item.user?.name || 'Sistema'}</div>
                      <div className="col-span-4 text-xs font-bold uppercase">{item.status}</div>
                      <div className="col-span-2 text-right font-bold">{item.items?.length || 0}</div>
                    </>
                  )}
                  {activeTab === 'productions' && (
                    <>
                      <div className="col-span-2">{new Date(item.startedAt || item.finishedAt).toLocaleDateString()}</div>
                      <div className="col-span-4 font-bold">{item.product?.name || '-'}</div>
                      <div className="col-span-2 text-right">{item.plannedQuantity}</div>
                      <div className="col-span-2 text-right font-bold text-primary">{item.producedQuantity}</div>
                      <div className="col-span-2 text-right font-bold text-on-surface-variant">
                        {item.yieldPercentage ? `${(item.yieldPercentage * 100).toFixed(1)}%` : '-'}
                      </div>
                    </>
                  )}
                  {activeTab === 'cmv' && (
                    <>
                      <div className="col-span-3">{new Date(item.date).toLocaleDateString()}</div>
                      <div className="col-span-3 text-right font-bold text-primary">R$ {item.totalValue.toFixed(2)}</div>
                      <div className="col-span-3 text-right font-bold text-primary">
                        {manualRevenue > 0 ? `R$ ${manualRevenue.toFixed(2)}` : '-'}
                      </div>
                      <div className="col-span-3 text-right font-bold text-on-surface">
                        {manualRevenue > 0 ? `${((item.totalValue / manualRevenue) * 100).toFixed(2)}%` : '-'}
                      </div>
                    </>
                  )}
                  {activeTab === 'abc' && (
                    <>
                      <div className="col-span-1 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-xs ${
                          item.classification === 'A' ? 'bg-primary text-on-primary shadow-sm' :
                          item.classification === 'B' ? 'bg-primary-container text-primary' :
                          'bg-surface-variant text-on-surface-variant'
                        }`}>
                          {item.classification}
                        </span>
                      </div>
                      <div className="col-span-3">
                        <div className="font-bold">{item.name}</div>
                        <div className="text-[10px] text-on-surface-variant">{item.sku}</div>
                      </div>
                      <div className="col-span-2 text-xs uppercase font-bold tracking-wider text-on-surface-variant">{item.categoryName}</div>
                      <div className="col-span-2 text-right font-bold">{item.qty}</div>
                      <div className="col-span-2 text-right text-sm text-on-surface-variant">R$ {item.cost.toFixed(2)}</div>
                      <div className="col-span-2 text-right font-bold text-primary">R$ {item.value.toFixed(2)}</div>
                    </>
                  )}
                </div>
              ))}
              
              {data.length === 0 && (
                <div className="px-6 py-12 text-center text-on-surface-variant text-sm flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined notranslate text-4xl text-outline mb-2">find_in_page</span>
                  Nenhum dado encontrado para o filtro selecionado.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
