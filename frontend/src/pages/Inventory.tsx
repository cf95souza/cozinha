import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';

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
      setInventories(invRes.data);
      setProducts(prodRes.data.data || prodRes.data);
      setStockBalances(stockRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  const startInventory = async () => {
    try {
      const res = await api.post('/inventories', {
        branchId: activeBranch?.id,
        userId: user?.id
      });
      setCurrentInventoryId(res.data.id);
      setIsCounting(true);
      
      setCountItems(products.map(p => {
        const balance = stockBalances.find(b => b.productId === p.id);
        return { productId: p.id, physicalQuantity: '', theoreticalQuantity: balance ? balance.quantity : 0 };
      }));
    } catch (err) {
      alert('Erro ao iniciar inventário');
    }
  };

  const handleQuantityChange = (productId: string, value: string) => {
    setCountItems(prev => prev.map(item => 
      item.productId === productId ? { ...item, physicalQuantity: value } : item
    ));
  };

  const autofillAll = () => {
    if (window.confirm("Preencher todos os itens vazios com o Saldo Teórico?")) {
      setCountItems(prev => prev.map(item => ({
        ...item,
        physicalQuantity: item.physicalQuantity === '' ? String(item.theoreticalQuantity) : item.physicalQuantity
      })));
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
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-on-surface">Inventário Ativo</h1>
              <p className="text-sm font-semibold text-on-surface-variant mt-0.5">Sessão #{currentInventoryId?.substring(0,8)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsScannerOpen(!isScannerOpen)} 
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-colors ${isScannerOpen ? 'bg-error text-on-error hover:bg-error/90' : 'bg-surface border border-outline-variant text-on-surface hover:bg-surface-container'}`}
            >
              <span className="material-symbols-outlined text-[18px]">{isScannerOpen ? 'close' : 'qr_code_scanner'}</span>
              {isScannerOpen ? 'Fechar Leitor' : 'Ler Código (Fast Count)'}
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
              <span className="material-symbols-outlined text-[20px]">task_alt</span>
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
          <h1 className="text-2xl font-bold text-on-surface">Inventários</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Conferência física de saldos do estoque.</p>
        </div>
        <button 
          onClick={startInventory}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:bg-primary-hover transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">rule</span>
          Iniciar Inventário
        </button>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
        <div className="divide-y divide-outline-variant">
          
          <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-surface-container-low text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            <div className="col-span-3">Sessão</div>
            <div className="col-span-3">Data</div>
            <div className="col-span-4">Responsável</div>
            <div className="col-span-2 text-right">Status</div>
          </div>

          {inventories.map(inv => (
            <div key={inv.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 hover:bg-surface-container-low transition-colors items-center">
              <div className="col-span-1 md:col-span-3 flex flex-col">
                <span className="font-semibold text-sm text-on-surface">#{inv.id.substring(0, 8)}</span>
                <span className="text-[10px] bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full font-bold w-fit mt-1">
                  {inv.items.length} itens conferidos
                </span>
              </div>
              
              <div className="col-span-1 md:col-span-3">
                <span className="text-sm text-on-surface">{new Date(inv.date).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              
              <div className="col-span-1 md:col-span-4">
                <span className="text-sm font-medium text-on-surface-variant">{inv.user.name}</span>
              </div>
              
              <div className="col-span-1 md:col-span-2 flex md:justify-end">
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                  inv.status === 'APROVADO' ? 'bg-primary-container text-primary' : 'bg-surface-container text-on-surface-variant'
                }`}>
                  {inv.status}
                </span>
              </div>
            </div>
          ))}
          
          {inventories.length === 0 && (
            <div className="px-6 py-12 text-center text-on-surface-variant text-sm flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant">rule</span>
              Nenhum inventário registrado na filial.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
