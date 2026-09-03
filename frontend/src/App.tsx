import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Componente para proteger as rotas privadas
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

import Layout from './components/Layout';
import AuditLog from './pages/AuditLog';
import PDV from './pages/PDV';
import Transfers from './pages/Transfers';
import Users from './pages/Users';
import Branches from './pages/Branches';
import CompanySettings from './pages/CompanySettings';

// Financial (Fase 16)
import FinanceCategories from './pages/FinanceCategories';
import Payables from './pages/Payables';
import Receivables from './pages/Receivables';
import CashControl from './pages/CashControl';
import CashFlow from './pages/CashFlow';
import Dre from './pages/Dre';
import Categories from './pages/Categories';
import Locations from './pages/Locations';
import Suppliers from './pages/Suppliers';
import Products from './pages/Products';
import StockMovement from './pages/StockMovement';
import ReceivingList from './pages/ReceivingList';
import ReceivingFlow from './pages/ReceivingFlow';
import Expirations from './pages/Expirations';
import Labels from './pages/Labels';
import Losses from './pages/Losses';
import Inventory from './pages/Inventory';
import Stock from './pages/Stock';
import Reports from './pages/Reports';
import Recipes from './pages/Recipes';
import Production from './pages/Production';
import ProductDetail from './pages/ProductDetail';
import PurchaseSuggestion from './pages/PurchaseSuggestion';
import Invoices from './pages/Invoices';
import FinanceSettings from './pages/FinanceSettings';
import Tables from './pages/Tables';
import TableOrder from './pages/TableOrder';
import Kds from './pages/Kds';
import Purchasing from './pages/Purchasing';
import Quotations from './pages/Quotations';

import ResetPassword from './pages/ResetPassword';

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      <Route 
        path="/" 
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        } 
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="configuracoes" element={<CompanySettings />} />
        <Route path="produto/:id" element={<ProductDetail />} />
        <Route path="compras" element={<PurchaseSuggestion />} />
        <Route path="usuarios" element={<Users />} />
        <Route path="categorias" element={<Categories />} />
        <Route path="locais" element={<Locations />} />
        <Route path="fornecedores" element={<Suppliers />} />
        <Route path="produtos" element={<Products />} />
        <Route path="recebimentos" element={<ReceivingList />} />
        <Route path="recebimento/:id" element={<ReceivingFlow />} />
        <Route path="validades" element={<Expirations />} />
        <Route path="etiquetas" element={<Labels />} />
        <Route path="perdas" element={<Losses />} />
        <Route path="inventario" element={<Inventory />} />
        <Route path="estoque" element={<Stock />} />
        <Route path="fichas" element={<Recipes />} />
        <Route path="producao" element={<Production />} />
            
        {/* Financeiro */}
        <Route path="finance/categories" element={<FinanceCategories />} />
        <Route path="finance/payables" element={<Payables />} />
        <Route path="finance/receivables" element={<Receivables />} />
        <Route path="finance/cash" element={<CashControl />} />
        <Route path="finance/cashflow" element={<CashFlow />} />
        <Route path="finance/dre" element={<Dre />} />

        <Route path="relatorios" element={<Reports />} />
        <Route path="auditoria" element={<AuditLog />} />
        <Route path="pdv" element={<PDV />} />
        <Route path="transferencias" element={<Transfers />} />
        <Route path="unidades" element={<Branches />} />
        <Route path="notas-fiscais" element={<Invoices />} />
        <Route path="financeiro-config" element={<FinanceSettings />} />
        <Route path="mesas" element={<Tables />} />
        <Route path="mesas/:id" element={<TableOrder />} />
        <Route path="kds" element={<Kds />} />
        <Route path="pedidos-compra" element={<Purchasing />} />
        <Route path="cotacoes" element={<Quotations />} />
      </Route>
      
      {/* Rota padrão */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
