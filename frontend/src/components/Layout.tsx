import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Branch } from '../contexts/AuthContext';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function Layout() {
  const { user, logout, activeBranch, setActiveBranch } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{products: any[], lots: any[], suppliers: any[], receivings: any[]}>({products: [], lots: [], suppliers: [], receivings: []});
  const [showSearch, setShowSearch] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  
  // Change password states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [cpError, setCpError] = useState('');
  const [cpSuccess, setCpSuccess] = useState('');
  const [cpLoading, setCpLoading] = useState(false);

  // Agrupamentos de menu (estilo com chevron)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = (group: string) => setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await api.get('/branches');
        setBranches(response.data);
        if (response.data.length > 0) {
          const storedBranch = localStorage.getItem('@CozinhaPlus:branch');
          if (!storedBranch) {
            setActiveBranch(response.data[0]);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar unidades', err);
      }
    };
    if (user?.role === 'ADMIN' || user?.role === 'GESTOR') {
       fetchBranches();
    }
  }, [user]);

  useEffect(() => {
    if (activeBranch) {
      api.get(`/dashboard/kpis?branchId=${activeBranch.id}`).then(res => setKpis(res.data));
    }
  }, [activeBranch]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length >= 2) {
        api.get(`/search?q=${searchQuery}&branchId=${activeBranch?.id || ''}`)
          .then(res => setSearchResults(res.data));
        setShowSearch(true);
      } else {
        setShowSearch(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeBranch]);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setCpError('A nova senha e a confirmação não conferem.');
      return;
    }
    if (newPassword.length < 6) {
      setCpError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setCpLoading(true);
    setCpError('');
    setCpSuccess('');
    try {
      await api.post('/auth/change-password', { oldPassword, newPassword });
      setCpSuccess('Senha alterada com sucesso!');
      setTimeout(() => {
        setIsChangePasswordOpen(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setCpSuccess('');
      }, 2000);
    } catch (err: any) {
      setCpError(err.response?.data?.error || 'Erro ao alterar a senha.');
    } finally {
      setCpLoading(false);
    }
  };

  // Menu items com agrupamento
  const mainItems = [
    { path: '/dashboard', label: 'Início', icon: 'home', roles: ['ADMIN', 'GESTOR', 'ESTOQUISTA', 'COZINHEIRO', 'VISUALIZACAO'] },
    { path: '/notas-fiscais', label: 'Notas (Consumo)', icon: 'receipt_long', roles: ['ADMIN', 'GESTOR'] },
    { path: '/etiquetas', label: 'Etiquetas', icon: 'label', roles: ['ADMIN', 'GESTOR', 'ESTOQUISTA', 'COZINHEIRO'] },
    { path: '/validades', label: 'Validades', icon: 'event_busy', roles: ['ADMIN', 'GESTOR', 'ESTOQUISTA', 'COZINHEIRO'] },
    { path: '/producao', label: 'Produção', icon: 'skillet', roles: ['ADMIN', 'GESTOR', 'COZINHEIRO'] },
    { path: '/recebimentos', label: 'Recebimento', icon: 'input', roles: ['ADMIN', 'GESTOR', 'ESTOQUISTA'] },
    { path: '/inventario', label: 'Contagem', icon: 'checklist', roles: ['ADMIN', 'GESTOR', 'ESTOQUISTA'] },
    { path: '/estoque', label: 'Controlados', icon: 'inventory_2', roles: ['ADMIN', 'GESTOR', 'ESTOQUISTA', 'COZINHEIRO', 'VISUALIZACAO'] },
    { path: '/relatorios', label: 'Relatórios', icon: 'bar_chart', roles: ['ADMIN', 'GESTOR'] },
  ];

  const cadastrosItems = [
    { path: '/produtos', label: 'Produtos', icon: 'kitchen', roles: ['ADMIN', 'GESTOR', 'ESTOQUISTA', 'COZINHEIRO'] },
    { path: '/categorias', label: 'Categorias', icon: 'category', roles: ['ADMIN', 'GESTOR'] },
    { path: '/locais', label: 'Locais de Estoque', icon: 'shelves', roles: ['ADMIN', 'GESTOR'] },
    { path: '/fornecedores', label: 'Fornecedores', icon: 'local_shipping', roles: ['ADMIN', 'GESTOR'] },
    { path: '/fichas', label: 'Fichas Técnicas', icon: 'menu_book', roles: ['ADMIN', 'GESTOR'] },
    { path: '/transferencias', label: 'Transferências', icon: 'move_up', roles: ['ADMIN', 'GESTOR', 'ESTOQUISTA'] },
    { path: '/perdas', label: 'Perdas', icon: 'delete', roles: ['ADMIN', 'GESTOR', 'ESTOQUISTA', 'COZINHEIRO'] },
    { path: '/compras', label: 'Sugestão de Compras', icon: 'shopping_cart', roles: ['ADMIN', 'GESTOR'] },
    { path: '/pdv', label: 'PDV (Frente de Caixa)', icon: 'point_of_sale', roles: ['ADMIN', 'GESTOR', 'ESTOQUISTA', 'COZINHEIRO'] },
  ];

  const configItems = [
    { path: '/usuarios', label: 'Equipe e Acessos', icon: 'group', roles: ['ADMIN', 'GESTOR'] },
    { path: '/unidades', label: 'Unidades', icon: 'store', roles: ['ADMIN'] },
    { path: '/auditoria', label: 'Auditoria', icon: 'security', roles: ['ADMIN', 'GESTOR'] },
    { path: '/financeiro-config', label: 'Params. Financeiro', icon: 'account_balance', roles: ['ADMIN', 'GESTOR'] },
    { path: '/configuracoes', label: 'Configurações', icon: 'settings', roles: ['ADMIN'] },
  ];

  // Classe compartilhada para TODOS os itens do menu quando colapsado
  const collapsedItemClass = 'flex items-center justify-center w-10 h-10 rounded-xl mx-auto';
  const expandedItemClass = 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] mx-2';

  const renderMenuItem = (item: typeof mainItems[0]) => {
    if (!item.roles.includes(user?.role || '')) return null;
    const isActive = location.pathname === item.path;
    const activeClass = isActive
      ? 'bg-primary-container text-primary font-semibold'
      : 'text-on-surface-variant hover:bg-surface-container';

    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => setSidebarOpen(false)}
        title={isSidebarCollapsed ? item.label : undefined}
        className={`${isSidebarCollapsed ? collapsedItemClass : expandedItemClass} ${activeClass} transition-all duration-150`}
      >
        <span
          className="material-symbols-outlined notranslate text-[20px] shrink-0"
          style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
        >
          {item.icon}
        </span>
        {!isSidebarCollapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  const renderGroup = (label: string, items: typeof mainItems, groupKey: string) => {
    const visibleItems = items.filter(i => i.roles.includes(user?.role || ''));
    if (visibleItems.length === 0) return null;
    const isOpen = openGroups[groupKey] ?? false;
    const hasActiveChild = visibleItems.some(i => location.pathname === i.path);
    const groupIcon = groupKey === 'cadastros' ? 'folder_open' : 'settings';
    const activeClass = hasActiveChild
      ? 'text-primary font-semibold'
      : 'text-on-surface-variant hover:bg-surface-container';

    return (
      <div key={groupKey}>
        <button
          onClick={() => {
            if (isSidebarCollapsed) {
              setIsSidebarCollapsed(false);
              setOpenGroups(prev => ({ ...prev, [groupKey]: true }));
            } else {
              toggleGroup(groupKey);
            }
          }}
          title={isSidebarCollapsed ? label : undefined}
          className={`${isSidebarCollapsed ? collapsedItemClass : expandedItemClass + ' justify-between w-[calc(100%-16px)]'} ${activeClass} transition-all duration-150`}
        >
          {isSidebarCollapsed ? (
            <span className="material-symbols-outlined notranslate text-[20px] shrink-0" style={{ fontVariationSettings: hasActiveChild ? "'FILL' 1" : "'FILL' 0" }}>
              {groupIcon}
            </span>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined notranslate text-[20px] shrink-0" style={{ fontVariationSettings: hasActiveChild ? "'FILL' 1" : "'FILL' 0" }}>
                  {groupIcon}
                </span>
                <span>{label}</span>
              </div>
              <span className={`material-symbols-outlined notranslate text-[18px] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </>
          )}
        </button>
        {isOpen && !isSidebarCollapsed && (
          <div className="ml-4 pl-3 border-l-2 border-outline-variant space-y-0.5 mt-1">
            {visibleItems.map(renderMenuItem)}
          </div>
        )}
      </div>
    );
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className={`px-5 pt-6 pb-4 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isSidebarCollapsed && <h1 className="text-xl font-extrabold text-primary tracking-tight">cozinha+</h1>}
        <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant hidden md:block">
          <span className="material-symbols-outlined notranslate">{isSidebarCollapsed ? 'menu' : 'menu_open'}</span>
        </button>
      </div>
      
      {/* Menu Principal */}
      <div className="flex-1 overflow-y-auto space-y-1 pb-4">
        <div className="space-y-0.5">
          {mainItems.map(renderMenuItem)}
        </div>
        <div className="space-y-0.5">
          {renderGroup('Cadastros', cadastrosItems, 'cadastros')}
        </div>
        <div className="space-y-0.5">
          {renderGroup('Configurações', configItems, 'config')}
        </div>
      </div>

      {/* Footer: Logout */}
      <div className={`py-4 mt-auto ${isSidebarCollapsed ? 'flex flex-col items-center px-2' : 'px-4'}`}>
        <div className={`flex ${isSidebarCollapsed ? 'flex-col items-center' : 'flex-col w-full'}`}>
          <button 
            onClick={logout}
            title={isSidebarCollapsed ? "Sair" : undefined}
            className={`${isSidebarCollapsed ? collapsedItemClass : 'flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold'} bg-surface-container border border-outline-variant text-on-surface hover:bg-error-container hover:text-error hover:border-error-container transition-colors`}
          >
            <span className="material-symbols-outlined notranslate text-[18px]">logout</span>
            {!isSidebarCollapsed && "Sair do Sistema"}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background font-body text-on-background">
      
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar Desktop */}
      <nav className={`hidden md:flex flex-col h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] bg-surface border-r border-outline-variant fixed left-0 top-0 z-20 transition-all duration-300 ${isSidebarCollapsed ? 'w-[80px]' : 'w-[260px]'}`}>
        {SidebarContent()}
      </nav>

      {/* Sidebar Mobile */}
      <nav className={`md:hidden fixed left-0 top-0 h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] w-[260px] bg-surface border-r border-outline-variant z-40 flex flex-col transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {SidebarContent()}
      </nav>

      {/* Main Content Area */}
      <main className={`flex-1 ml-0 flex flex-col min-h-[100dvh] pb-[env(safe-area-inset-bottom)] relative overflow-y-auto bg-surface-container-low transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-[80px]' : 'md:ml-[260px]'}`}>
        
        {/* Topbar */}
        <header className="flex justify-between items-center w-full px-5 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] bg-surface border-b border-outline-variant sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {/* Hamburger Mobile */}
            <button className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-surface-container" onClick={() => setSidebarOpen(true)}>
              <span className="material-symbols-outlined notranslate text-on-surface">menu</span>
            </button>

            {/* Restaurante + Badge Unidade */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-on-surface">{user?.company || 'COZINHA+'}</span>
              {user?.role === 'ADMIN' && branches.length > 0 ? (
                <select 
                  value={activeBranch?.id || ''}
                  onChange={e => {
                    if (e.target.value === '') {
                      setActiveBranch({ id: '', name: 'Todas as Filiais' });
                    } else {
                      const branch = branches.find(b => b.id === e.target.value);
                      if (branch) setActiveBranch(branch);
                    }
                  }}
                  className="text-xs bg-primary-container text-primary font-semibold px-2.5 py-1 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer appearance-none"
                >
                  <option value="">Todas</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              ) : (
                <span className="text-xs bg-primary-container text-primary font-semibold px-2.5 py-1 rounded-full">Unidade</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Busca */}
            <div className="relative hidden lg:block w-56">
              <span className="material-symbols-outlined notranslate absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                onFocus={() => {if(searchQuery.length > 1) setShowSearch(true);}}
                className="w-full pl-9 pr-3 py-2 bg-surface-container border-0 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/20" 
                placeholder="Buscar..." type="text" 
              />
              
              {showSearch && (
                <div className="absolute top-full mt-2 w-80 bg-surface border border-outline-variant rounded-xl shadow-lg overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
                  {searchResults.products?.length > 0 && (
                    <div className="p-2 border-b border-outline-variant">
                      <p className="text-xs font-semibold text-on-surface-variant mb-1 uppercase px-2">Produtos</p>
                      {searchResults.products.map(p => (
                        <div key={p.id} className="p-2 hover:bg-surface-container rounded-lg cursor-pointer" onClick={() => navigate('/produtos')}>
                          <p className="font-semibold text-sm text-on-surface">{p.name}</p>
                          <p className="text-xs text-on-surface-variant">SKU: {p.sku || '-'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchResults.lots?.length > 0 && (
                    <div className="p-2 border-b border-outline-variant">
                      <p className="text-xs font-semibold text-on-surface-variant mb-1 uppercase px-2">Lotes</p>
                      {searchResults.lots.map(l => (
                        <div key={l.id} className="p-2 hover:bg-surface-container rounded-lg cursor-pointer" onClick={() => navigate('/validades')}>
                          <p className="font-semibold text-sm text-on-surface">{l.product.name}</p>
                          <p className="text-xs text-on-surface-variant">Lote: {l.number}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchResults.suppliers?.length > 0 && (
                    <div className="p-2 border-b border-outline-variant">
                      <p className="text-xs font-semibold text-on-surface-variant mb-1 uppercase px-2">Fornecedores</p>
                      {searchResults.suppliers.map(s => (
                        <div key={s.id} className="p-2 hover:bg-surface-container rounded-lg cursor-pointer" onClick={() => navigate('/fornecedores')}>
                          <p className="font-semibold text-sm text-on-surface">{s.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchResults.receivings?.length > 0 && (
                    <div className="p-2">
                      <p className="text-xs font-semibold text-on-surface-variant mb-1 uppercase px-2">Recebimentos</p>
                      {searchResults.receivings.map(r => (
                        <div key={r.id} className="p-2 hover:bg-surface-container rounded-lg cursor-pointer" onClick={() => navigate('/recebimentos')}>
                          <p className="font-semibold text-sm text-on-surface">NF: {r.invoice || 'S/N'}</p>
                          <p className="text-xs text-on-surface-variant">{r.supplier.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {!searchResults.products?.length && !searchResults.lots?.length && !searchResults.suppliers?.length && !searchResults.receivings?.length && (
                    <div className="p-4 text-center text-sm text-on-surface-variant">Nenhum resultado.</div>
                  )}
                </div>
              )}
            </div>

            {/* Dark mode */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors"
              title="Alternar tema"
            >
              <span className="material-symbols-outlined notranslate text-[20px]">
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {/* Notificações */}
            <div className="relative group">
              <button className="relative p-2 text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">
                <span className="material-symbols-outlined notranslate text-[20px]">notifications</span>
                {(kpis?.expiredLots > 0 || kpis?.belowMinCount > 0) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full"></span>
                )}
              </button>
              
              <div className="absolute right-0 top-full mt-1 w-64 bg-surface border border-outline-variant rounded-xl shadow-lg overflow-hidden hidden group-hover:block z-50">
                <div className="p-3 border-b border-outline-variant">
                  <p className="font-semibold text-sm">Alertas</p>
                </div>
                {kpis?.expiredLots > 0 && (
                  <Link to="/validades" className="p-3 border-b border-outline-variant flex gap-2 items-center text-error hover:bg-surface-container transition-colors text-sm">
                    <span className="material-symbols-outlined notranslate text-[18px]">warning</span>
                    {kpis.expiredLots} lote(s) vencido(s)
                  </Link>
                )}
                {kpis?.belowMinCount > 0 && (
                  <Link to="/estoque" className="p-3 border-b border-outline-variant flex gap-2 items-center text-primary hover:bg-surface-container transition-colors text-sm">
                    <span className="material-symbols-outlined notranslate text-[18px]">info</span>
                    {kpis.belowMinCount} abaixo do mínimo
                  </Link>
                )}
                {(!kpis || (kpis.expiredLots === 0 && kpis.belowMinCount === 0)) && (
                  <div className="p-4 text-center text-sm text-on-surface-variant">Nenhum alerta.</div>
                )}
              </div>
            </div>

            {/* User Avatar (header) */}
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-outline-variant ml-1">
              <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center font-bold text-xs">
                {user?.name?.charAt(0)}
              </div>
              <div className="hidden xl:block">
                <p className="text-xs font-semibold text-on-surface leading-tight">{user?.name}</p>
                <p className="text-[11px] text-on-surface-variant leading-tight">{user?.role}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-5 lg:p-8 space-y-6 max-w-[1400px] mx-auto w-full">
          <Outlet />
        </div>
      </main>

      {/* Modal Alterar Senha */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-surface w-full max-w-sm rounded-2xl shadow-xl flex flex-col animate-in zoom-in-95 overflow-hidden border border-outline-variant">
            <div className="p-5 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined notranslate text-primary">key</span>
                Alterar Senha
              </h2>
              <button onClick={() => setIsChangePasswordOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined notranslate text-[20px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleChangePassword} className="p-5 space-y-4">
              {cpError && (
                <div className="bg-error-container border-l-4 border-error p-3 rounded text-sm text-on-error-container">
                  {cpError}
                </div>
              )}
              {cpSuccess && (
                <div className="bg-[#E6F4EA] border-l-4 border-[#34A853] p-3 rounded text-sm text-[#137333]">
                  {cpSuccess}
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-sm font-semibold text-on-surface">Senha Atual</label>
                <input 
                  type="password" required
                  value={oldPassword} onChange={e => setOldPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-on-surface">Nova Senha</label>
                <input 
                  type="password" required minLength={6}
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-on-surface">Confirmar Nova Senha</label>
                <input 
                  type="password" required minLength={6}
                  value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              <div className="pt-2">
                <button type="submit" disabled={cpLoading} className="w-full py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow-sm hover:bg-primary-hover transition-colors disabled:opacity-50">
                  {cpLoading ? 'Salvando...' : 'Atualizar Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
