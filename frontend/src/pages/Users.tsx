import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface Branch {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  branch?: { name: string };
  createdAt: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('COZINHEIRO');
  const [branchId, setBranchId] = useState('');
  
  const { user: currentUser } = useAuth();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, branchesRes] = await Promise.all([
        api.get('/users'),
        api.get('/branches')
      ]);
      setUsers(usersRes.data);
      setBranches(branchesRes.data);
      if (branchesRes.data.length > 0) {
        setBranchId(branchesRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users', { name, email, password, role, branchId: role === 'ADMIN' ? null : branchId });
      toast.success('Usuário criado com sucesso');
      setIsModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setRole('COZINHEIRO');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao criar usuário');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este usuário?')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('Usuário removido com sucesso');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao remover usuário');
    }
  };

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-error-container text-on-error-container',
    GESTOR: 'bg-primary-container text-on-primary-container',
    ESTOQUISTA: 'bg-secondary-container text-on-secondary-container',
    COZINHEIRO: 'bg-surface-variant text-on-surface-variant',
    VISUALIZACAO: 'bg-outline-variant text-on-surface-variant',
  };

  if (loading) return <div className="p-8 text-on-surface">Carregando usuários...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Equipe e Acessos</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Gerencie os colaboradores que têm acesso ao sistema.</p>
        </div>
        
        {currentUser?.role === 'ADMIN' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:bg-primary-hover transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Novo Colaborador
          </button>
        )}
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
        {users.length === 0 ? (
          <div className="px-6 py-12 text-center text-on-surface-variant text-sm flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-4xl text-outline mb-2">group</span>
            Nenhum colaborador encontrado.
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="divide-y divide-outline-variant">
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-surface-container-low text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                <div className="col-span-4">Colaborador</div>
                <div className="col-span-3">Perfil</div>
                <div className="col-span-2">Unidade</div>
                <div className="col-span-2">Data de Cadastro</div>
                <div className="col-span-1 text-right">Ações</div>
              </div>

              {users.map(user => (
                <div key={user.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 hover:bg-surface-container-low transition-colors items-center">
                  <div className="col-span-1 md:col-span-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0">
                      <span className="material-symbols-outlined text-[20px]">person</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-on-surface">{user.name}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="col-span-1 md:col-span-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${roleColors[user.role] || roleColors['COZINHEIRO']}`}>
                      {user.role === 'ADMIN' && <span className="material-symbols-outlined text-[14px]">shield</span>}
                      {user.role}
                    </span>
                  </div>

                  <div className="col-span-1 md:col-span-2 text-sm text-on-surface-variant">
                    {user.branch ? (
                      <span className="flex items-center gap-1.5 font-medium"><span className="material-symbols-outlined text-[16px]">storefront</span> {user.branch.name}</span>
                    ) : (
                      <span className="text-outline">Todas as Unidades</span>
                    )}
                  </div>
                  
                  <div className="col-span-1 md:col-span-2 text-sm text-on-surface-variant">
                    {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                  
                  <div className="col-span-1 md:col-span-1 flex justify-end gap-1">
                    {currentUser?.id !== user.id && currentUser?.role === 'ADMIN' && (
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full transition-colors"
                        title="Remover"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person_add</span>
                Novo Colaborador
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-on-surface-variant hover:bg-surface-container p-1 rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">Senha Inicial</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1">Perfil</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    {currentUser?.role === 'ADMIN' && <option value="ADMIN">Admin</option>}
                    <option value="GESTOR">Gestor</option>
                    <option value="ESTOQUISTA">Estoquista</option>
                    <option value="COZINHEIRO">Cozinheiro</option>
                    <option value="VISUALIZACAO">Apenas Ver</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1">Unidade</label>
                  <select
                    value={branchId}
                    onChange={e => setBranchId(e.target.value)}
                    disabled={role === 'ADMIN'}
                    className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer disabled:opacity-50"
                  >
                    {role === 'ADMIN' && <option value="">(Acesso Total)</option>}
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:bg-primary-hover transition-colors shadow-sm"
                >
                  Salvar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
