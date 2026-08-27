import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Search, Filter, ShieldCheck, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Pagination } from '../components/Pagination';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';

export default function AuditLog() {
  const { activeBranch } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    if (activeBranch) {
      loadLogs();
      loadUsers();
    }
  }, [activeBranch, page]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/audit?branchId=${activeBranch?.id}&page=${page}&limit=${ITEMS_PER_PAGE}`);
      setLogs(res.data.data);
      setTotalPages(res.data.meta.totalPages);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar auditoria.');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.get(`/users?companyId=${activeBranch?.companyId}`);
      setUsers(res.data);
    } catch (error) {}
  };

  const translateAction = (method: string) => {
    if (method === 'POST') return { label: 'Criou', color: 'bg-primary-container text-on-primary-container' };
    if (method === 'PUT') return { label: 'Editou', color: 'bg-secondary-container text-on-secondary-container' };
    if (method === 'DELETE') return { label: 'Removeu/Inativou', color: 'bg-error-container text-on-error-container' };
    return { label: method, color: 'bg-surface-variant text-on-surface' };
  };

  const translateEntity = (path: string) => {
    if (!path) return 'Desconhecido';
    if (path.includes('products')) return 'Produto';
    if (path.includes('receivings')) return 'Recebimento';
    if (path.includes('lots')) return 'Lote';
    if (path.includes('movements')) return 'Movimentação';
    if (path.includes('losses')) return 'Perda';
    if (path.includes('suppliers')) return 'Fornecedor';
    if (path.includes('locations')) return 'Local de Estoque';
    if (path.includes('users')) return 'Usuário';
    if (path.includes('auth/login')) return 'Login';
    return path.split('/')[2] || path;
  };

  const formatDetails = (details: any) => {
    if (!details) return '-';
    // Se for objeto, tenta mostrar de forma legível
    if (typeof details === 'object') {
      const keys = Object.keys(details).filter(k => k !== 'id' && k !== 'createdAt' && k !== 'updatedAt' && k !== 'companyId' && k !== 'branchId');
      if (keys.length === 0) return 'Registro manipulado';
      
      const parts = keys.map(k => {
        let val = details[k];
        if (typeof val === 'object') val = '[Objeto]';
        return `${k}: ${val}`;
      });
      return parts.join(' | ');
    }
    return String(details);
  };

  const filteredLogs = useMemo(() => {
    let result = logs;
    
    if (startDate) {
      result = result.filter(log => new Date(log.createdAt) >= new Date(startDate));
    }
    if (endDate) {
      result = result.filter(log => new Date(log.createdAt) <= new Date(endDate + 'T23:59:59'));
    }
    if (userFilter) {
      result = result.filter(log => log.userId === userFilter);
    }
    if (actionFilter) {
      result = result.filter(log => log.action === actionFilter);
    }
    if (entityFilter) {
      result = result.filter(log => translateEntity(log.entity) === entityFilter);
    }
    
    return result;
  }, [logs, startDate, endDate, userFilter, actionFilter, entityFilter]);

  const currentLogs = filteredLogs;

  const availableEntities = Array.from(new Set(logs.map(log => translateEntity(log.entity)))).sort();

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-secondary-container text-on-secondary-container rounded-xl">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-display-sm font-section-title text-on-surface">Log de Auditoria</h1>
          <p className="text-body text-on-surface-variant mt-1">Rastreabilidade completa de ações na filial: {activeBranch?.name}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface p-4 rounded-xl shadow-sm border border-outline-variant flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-on-surface-variant font-bold">
          <Filter className="w-5 h-5" />
          <span>Filtros:</span>
        </div>
        
        <input 
          type="date" 
          value={startDate} 
          onChange={e => setStartDate(e.target.value)}
          className="border border-outline-variant rounded-md py-1.5 px-3 bg-surface-container-lowest text-on-surface text-sm"
          title="Data Inicial"
        />
        <input 
          type="date" 
          value={endDate} 
          onChange={e => setEndDate(e.target.value)}
          className="border border-outline-variant rounded-md py-1.5 px-3 bg-surface-container-lowest text-on-surface text-sm"
          title="Data Final"
        />

        <select value={userFilter} onChange={e => setUserFilter(e.target.value)} className="bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-1.5 text-sm text-on-surface">
          <option value="">Todos os Usuários</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>

        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-1.5 text-sm text-on-surface">
          <option value="">Todas as Ações</option>
          <option value="POST">Criação</option>
          <option value="PUT">Edição</option>
          <option value="DELETE">Exclusão/Inativação</option>
        </select>

        <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)} className="bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-1.5 text-sm text-on-surface">
          <option value="">Todas as Entidades</option>
          {availableEntities.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-outline-variant overflow-hidden">
        {loading ? (
          <LoadingSkeleton />
        ) : currentLogs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhum evento registrado"
            message="Não encontramos eventos de auditoria com os filtros atuais."
          />
        ) : (
          <div className="flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-variant text-on-surface-variant text-sm font-metadata uppercase border-b border-outline-variant">
                  <tr>
                    <th className="py-4 px-6 font-bold w-48">Data / Hora</th>
                    <th className="py-4 px-6 font-bold w-48">Usuário</th>
                    <th className="py-4 px-6 font-bold w-32">Ação</th>
                    <th className="py-4 px-6 font-bold w-40">Entidade</th>
                    <th className="py-4 px-6 font-bold">Detalhes do que mudou</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {currentLogs.map(log => {
                    const action = translateAction(log.action);
                    return (
                      <tr key={log.id} className="hover:bg-surface-container-lowest transition-colors">
                        <td className="py-3 px-6 text-sm text-on-surface-variant">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="py-3 px-6 font-bold text-on-surface">{log.user?.name || log.userId}</td>
                        <td className="py-3 px-6">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${action.color}`}>
                            {action.label}
                          </span>
                        </td>
                        <td className="py-3 px-6 font-bold text-primary">{translateEntity(log.entity)}</td>
                        <td className="py-3 px-6 text-sm text-on-surface-variant truncate max-w-md" title={formatDetails(log.details)}>
                          {formatDetails(log.details)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
