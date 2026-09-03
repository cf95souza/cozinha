import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { ArrowLeft, ScanBarcode, X, CheckCircle2, ClipboardList, Play, Trash2 } from 'lucide-react';

export default function Inventory() {
  const { activeBranch, user } = useAuth();
  const [inventories, setInventories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [stockBalances, setStockBalances] = useState<any[]>([]);
  
  const [isCounting, setIsCounting] = useState(false);
  const [currentInventoryId, setCurrentInventoryId] = useState<string | null>(null);
  
  // countItems now holds the theoretical qty too
  const [countItems, setCountItems] = useState<{productId: string, physicalQuantity: string, theoreticalQuantity: number}[]>([]);
  
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerMessage, setScannerMessage] = useState('');
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (activeBranch) loadData();
  }, [activeBranch]);

  useEffect(() => {
    if (isScannerOpen) {
      // Small delay to ensure div is mounted
      setTimeout(() => {
        scannerRef.current = new Html5QrcodeScanner(
          "qr-reader",
          { fps: 10, qrbox: {width: 250, height: 250}, formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE, Html5QrcodeSupportedFormats.EAN_13] },
          /* verbose= */ false
        );
        scannerRef.current.render(onScanSuccess, onScanFailure);
      }, 100);
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error(e));
        scannerRef.current = null;
      }
    }
    
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error(e));
      }
    };
  }, [isScannerOpen]);

  const onScanSuccess = (decodedText: string) => {
    // Find product by SKU or Barcode (or ID if QR Code has it)
    const matchedProduct = products.find(p => p.barcode === decodedText || p.sku === decodedText || p.id === decodedText);
    
    if (matchedProduct) {
      setScannerMessage(`Produto encontrado: ${matchedProduct.name}`);
      
      // Auto-fill theoretical quantity to make it faster
      const balance = stockBalances.find(b => b.productId === matchedProduct.id);
      const theoQty = balance ? balance.quantity : 0;
      
      setCountItems(prev => prev.map(item => 
        item.productId === matchedProduct.id 
          ? { ...item, physicalQuantity: String(theoQty) } 
          : item
      ));
      
      // Highlight row temporarily (simple implementation: just scroll to it)
      const el = document.getElementById(`product-${matchedProduct.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('bg-primary-container');
        setTimeout(() => el.classList.remove('bg-primary-container'), 2000);
      }
    } else {
      setScannerMessage(`Código não reconhecido: ${decodedText}`);
    }
  };

  const onScanFailure = (error: any) => {
    // ignore
  };

  const loadData = async () => {
    try {
      const [invRes, prodRes, stockRes] = await Promise.all([
        api.get(`/inventories?branchId=${activeBranch?.id}`),
        api.get(`/products?branchId=${activeBranch?.id}`),
        api.get(`/stock/balances?branchId=${activeBranch?.id}`)
      ]);
      setInventories(Array.isArray(invRes.data) ? invRes.data.filter((i: any) => i.user) : []);
      setProducts(prodRes.data.data || prodRes.data);
      setStockBalances(stockRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  const startInventory = async () => {
    if (!activeBranch) {
      alert('Por favor, selecione uma filial primeiro.');
      return;
    }
    try {
      const res = await api.post('/inventories', {
        branchId: activeBranch.id,
        userId: user?.id
      });
      setCurrentInventoryId(res.data.id);
      setIsCounting(true);
      
      const initialItems = products.map(p => {
        const balance = stockBalances.find(b => b.productId === p.id);
        return { productId: p.id, physicalQuantity: '', theoreticalQuantity: balance ? balance.quantity : 0 };
      });
      setCountItems(initialItems);
      localStorage.setItem(`cozinha_inv_${res.data.id}`, JSON.stringify(initialItems));
      loadData();
    } catch (err) {
      alert('Erro ao iniciar inventário');
    }
  };

  const resumeInventory = (id: string) => {
    setCurrentInventoryId(id);
    setIsCounting(true);
    const saved = localStorage.getItem(`cozinha_inv_${id}`);
    if (saved) {
      setCountItems(JSON.parse(saved));
    } else {
      const initialItems = products.map(p => {
        const balance = stockBalances.find(b => b.productId === p.id);
        return { productId: p.id, physicalQuantity: '', theoreticalQuantity: balance ? balance.quantity : 0 };
      });
      setCountItems(initialItems);
    }
  };

  const deleteInventory = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este inventário inacabado?')) return;
    try {
      await api.delete(`/inventories/${id}`);
      localStorage.removeItem(`cozinha_inv_${id}`);
      loadData();
    } catch (err) {
      alert('Erro ao excluir inventário');
    }
  };

  const handleQuantityChange = (productId: string, value: string) => {
    setCountItems(prev => {
      const next = prev.map(item => 
        item.productId === productId ? { ...item, physicalQuantity: value } : item
      );
      if (currentInventoryId) localStorage.setItem(`cozinha_inv_${currentInventoryId}`, JSON.stringify(next));
      return next;
    });
  };

  const autofillAll = () => {
    if (window.confirm("Preencher todos os itens vazios com o Saldo Teórico?")) {
      setCountItems(prev => {
        const next = prev.map(item => ({
          ...item,
          physicalQuantity: item.physicalQuantity === '' ? String(item.theoreticalQuantity) : item.physicalQuantity
        }));
        if (currentInventoryId) localStorage.setItem(`cozinha_inv_${currentInventoryId}`, JSON.stringify(next));
        return next;
      });
    }
  };

  const submitCount = async () => {
    if (!currentInventoryId) return;
    
    const itemsToSubmit = countItems
      .filter(item => item.physicalQuantity !== '')
      .map(item => ({
        productId: item.productId,
        theoreticalQuantity: item.theoreticalQuantity,
        physicalQuantity: Number(item.physicalQuantity),
      }));

    if (itemsToSubmit.length === 0) {
      alert('Preencha pelo menos um item');
      return;
    }

    try {
      await api.post(`/inventories/${currentInventoryId}/items`, { items: itemsToSubmit });
      await api.put(`/inventories/${currentInventoryId}/approve`, { userId: user?.id });
      
      localStorage.removeItem(`cozinha_inv_${currentInventoryId}`);
      setIsCounting(false);
      setCurrentInventoryId(null);
      setIsScannerOpen(false);
      loadData();
    } catch (err) {
      alert('Erro ao finalizar contagem');
    }
  };

  if (isCounting) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsCounting(false)} className="p-2 text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-on-surface">Inventário Ativo</h1>
              <p className="text-sm font-semibold text-on-surface-variant mt-0.5">Sessão #{currentInventoryId?.substring(0,8)}</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={() => setIsScannerOpen(!isScannerOpen)} 
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-colors ${isScannerOpen ? 'bg-error text-on-error hover:bg-error/90' : 'bg-surface border border-outline-variant text-on-surface hover:bg-surface-container'}`}
            >
              {isScannerOpen ? <X size={18} /> : <ScanBarcode size={18} />}
              {isScannerOpen ? 'Fechar Leitor' : 'Ler Código'}
            </button>
          </div>
        </div>
        
        {isScannerOpen && (
          <div className="bg-surface p-5 rounded-2xl shadow-sm border border-outline-variant flex flex-col items-center">
            <div className="text-center mb-3 text-sm font-bold text-on-surface">Posicione o código de barras ou QR Code na câmera</div>
            <div id="qr-reader" className="w-full max-w-md overflow-hidden rounded-xl border-2 border-primary"></div>
            {scannerMessage && (
              <div className="mt-4 px-4 py-2 bg-secondary-container text-on-secondary-container rounded-xl text-sm font-bold text-center">
                {scannerMessage}
              </div>
            )}
          </div>
        )}

        <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden flex flex-col">
          <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-sm text-on-surface-variant font-medium">
              Digite a quantidade física. O modo Fast Count preenche automaticamente.
            </p>
            <button onClick={autofillAll} className="text-sm font-bold text-primary hover:underline">
              Preencher Vazios com Teórico
            </button>
          </div>
          
          <div className="divide-y divide-outline-variant max-h-[60vh] overflow-y-auto">
            {products.map(product => {
              const countItem = countItems.find(i => i.productId === product.id);
              const isFilled = countItem?.physicalQuantity !== '';
              
              return (
                <div 
                  id={`product-${product.id}`}
                  key={product.id} 
                  className={`flex flex-col sm:flex-row justify-between sm:items-center px-6 py-4 transition-colors ${
                    isFilled ? 'bg-primary-container/20' : 'hover:bg-surface-container-low'
                  }`}
                >
                  <div className="mb-3 sm:mb-0">
                    <p className="font-semibold text-sm text-on-surface">{product.name}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      SKU: {product.sku || '-'} • EAN: {product.barcode || '-'} • Teórico: {countItem?.theoreticalQuantity} {product.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" step="0.01"
                      placeholder="Físico"
                      className="w-28 px-4 py-2 bg-surface border border-outline-variant rounded-xl text-sm font-bold text-right text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={countItem?.physicalQuantity || ''}
                      onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                    />
                    <span className="text-sm font-semibold text-on-surface-variant w-8">{product.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-6 py-5 border-t border-outline-variant bg-surface-container-lowest">
            <button 
              onClick={submitCount}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary-hover transition-colors"
            >
              <CheckCircle2 size={20} />
              Finalizar e Ajustar Estoque
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Inventários</h1>
          <p className="text-sm text-on-surface-variant mt-1">Conferência física de saldos do estoque.</p>
        </div>
        <button 
          onClick={startInventory}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary-hover transition-colors shadow-sm"
        >
          <ClipboardList size={20} />
          Iniciar Inventário
        </button>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
        <div className="divide-y divide-outline-variant">
          
          <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-surface-container-low text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            <div className="col-span-3">Sessão / Itens</div>
            <div className="col-span-2">Data</div>
            <div className="col-span-3">Responsável</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-3 text-right">Ações</div>
          </div>

          {inventories.map(inv => (
            <div key={inv.id} className="flex flex-col md:grid md:grid-cols-12 gap-4 px-6 py-4 hover:bg-surface-container-low transition-colors items-start md:items-center">
              
              {/* Info Mobile Header & Desktop Col 1 */}
              <div className="w-full md:col-span-3 flex justify-between md:flex-col items-center md:items-start border-b border-outline-variant md:border-0 pb-3 md:pb-0">
                <span className="font-bold text-base md:text-sm text-on-surface">#{inv.id.substring(0, 8)}</span>
                <span className="text-[10px] bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full font-bold">
                  {inv.status === 'PENDENTE' ? 'Em andamento' : `${inv.items.length} itens conferidos`}
                </span>
              </div>
              
              {/* Data & Responsável */}
              <div className="w-full flex md:contents gap-2 mt-2 md:mt-0 text-sm">
                <div className="w-1/2 md:col-span-2 md:w-auto">
                  <span className="md:hidden text-[10px] font-bold text-on-surface-variant uppercase block mb-0.5">Data</span>
                  <span className="text-on-surface font-medium">{new Date(inv.date).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                
                <div className="w-1/2 md:col-span-3 md:w-auto text-right md:text-left">
                  <span className="md:hidden text-[10px] font-bold text-on-surface-variant uppercase block mb-0.5">Responsável</span>
                  <span className="font-medium text-on-surface-variant">{inv.user.name}</span>
                </div>
              </div>
              
              {/* Status */}
              <div className="hidden md:flex md:col-span-1 justify-center">
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                  inv.status === 'APROVADO' ? 'bg-primary-container text-primary' : 'bg-surface-container text-on-surface-variant'
                }`}>
                  {inv.status}
                </span>
              </div>
              
              {/* Ações (Mobile mostra status no lugar das ações se aprovado) */}
              <div className="w-full md:col-span-3 flex md:justify-end gap-2 items-center mt-3 md:mt-0 pt-3 md:pt-0 border-t border-outline-variant md:border-0">
                {inv.status === 'PENDENTE' ? (
                  <>
                    <button onClick={() => resumeInventory(inv.id)} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary font-bold rounded-lg hover:bg-primary-hover transition-colors text-xs">
                      <Play size={14} /> Continuar
                    </button>
                    <button onClick={() => deleteInventory(inv.id)} className="flex items-center justify-center p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-lg transition-colors" title="Excluir">
                      <Trash2 size={16} />
                    </button>
                  </>
                ) : (
                  <div className="md:hidden w-full text-center">
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-primary-container text-primary">
                      {inv.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {inventories.length === 0 && (
            <div className="px-6 py-12 text-center text-on-surface-variant text-sm flex flex-col items-center gap-3">
              <ClipboardList size={40} className="text-outline" />
              Nenhum inventário registrado na filial.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
