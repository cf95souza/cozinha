import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  sellPrice: number;
  photoUrl: string | null;
  barcode: string | null;
  category: { name: string };
  unit: string;
}

interface CartItem extends Product {
  cartQuantity: number;
}

export default function PDV() {
  const { activeBranch } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentType, setPaymentType] = useState('PIX');

  const barcodeBuffer = useRef('');
  const lastKeystrokeTime = useRef(0);

  useEffect(() => {
    if (activeBranch) {
      fetchProducts();
    }
  }, [activeBranch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = new Date().getTime();
      
      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length > 3) {
          e.preventDefault();
          const scannedCode = barcodeBuffer.current;
          
          const product = products.find(p => p.barcode === scannedCode);
          if (product) {
            setCart(prev => {
              const existing = prev.find(item => item.id === product.id);
              if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item);
              }
              return [...prev, { ...product, cartQuantity: 1 }];
            });
            toast.success(`Adicionado: ${product.name}`);
            setSearchTerm(''); // Limpar busca caso o leitor tenha preenchido
          } else {
            toast.error(`Produto não encontrado para o código: ${scannedCode}`);
          }
        }
        barcodeBuffer.current = '';
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (currentTime - lastKeystrokeTime.current > 50) {
          barcodeBuffer.current = e.key;
        } else {
          barcodeBuffer.current += e.key;
        }
        lastKeystrokeTime.current = currentTime;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Fetches products to be sold. Assuming we bring the ones with a sellPrice.
      const res = await api.get(`/products?branchId=${activeBranch?.id}&limit=100`);
      // For PDV we filter those that can be sold (have sellPrice > 0). If all can be sold, just use res.data.data
      const sellable = (res.data.data || res.data).filter((p: any) => p.sellPrice && p.sellPrice > 0);
      setProducts(sellable);
    } catch (error) {
      toast.error('Erro ao carregar produtos para o PDV');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item);
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => item.id === productId ? { ...item, cartQuantity: quantity } : item));
  };

  const totalAmount = cart.reduce((acc, item) => acc + (item.sellPrice * item.cartQuantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      const payload = {
        paymentType,
        totalAmount,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.cartQuantity,
          unitPrice: item.sellPrice
        }))
      };

      await api.post('/sales', payload);
      toast.success('Venda finalizada com sucesso!');
      setCart([]);
      setShowCheckout(false);
    } catch (error) {
      toast.error('Erro ao finalizar venda');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.barcode && p.barcode.includes(searchTerm))
  );

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] gap-6 animate-in fade-in duration-300">
      
      {/* Esquerda: Produtos */}
      <div className="flex-1 flex flex-col bg-surface border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-surface-container-lowest">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
            <input 
              type="text" 
              placeholder="Buscar produtos por nome ou bipar código..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-primary bg-primary-container/30 px-3 py-2 rounded-lg w-fit border border-primary/20">
            <span className="material-symbols-outlined text-[16px] animate-pulse">barcode_scanner</span>
            Leitor de Código de Barras Ativo (Pronto para Bipar)
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 bg-surface-container-lowest">
          {loading ? (
            <div className="flex justify-center items-center h-full text-on-surface-variant gap-2">
               <span className="material-symbols-outlined animate-spin text-4xl">sync</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-on-surface-variant">
              <span className="material-symbols-outlined text-6xl mb-4 opacity-50">remove_shopping_cart</span>
              <p className="font-semibold text-sm">Nenhum produto vendável encontrado.</p>
              <p className="text-xs mt-2 opacity-80">Dica: O produto precisa ter preço de venda configurado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <div 
                  key={product.id} 
                  onClick={() => addToCart(product)}
                  className="bg-surface border border-outline-variant rounded-2xl p-4 cursor-pointer hover:border-primary hover:shadow-md transition-all flex flex-col gap-3 group"
                >
                  <div className="h-28 bg-surface-container-low rounded-xl flex items-center justify-center overflow-hidden border border-outline-variant/50 group-hover:border-primary/30 transition-colors">
                    {product.photoUrl ? (
                      <img src={product.photoUrl} alt={product.name} className="object-cover w-full h-full" />
                    ) : (
                      <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-30">restaurant</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-on-surface leading-tight line-clamp-2">{product.name}</h3>
                    <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mt-1">{product.category?.name || 'Sem categoria'}</p>
                  </div>
                  <div className="mt-auto pt-2 flex justify-between items-center">
                    <span className="font-black text-primary text-lg">
                      R$ {product.sellPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Direita: Carrinho */}
      <div className="w-full md:w-[400px] flex flex-col bg-surface border border-outline-variant rounded-2xl shadow-sm overflow-hidden shrink-0">
        <div className="p-5 border-b border-outline-variant bg-primary text-on-primary flex items-center gap-3">
          <span className="material-symbols-outlined">shopping_cart</span>
          <h2 className="font-bold text-lg">Frente de Caixa</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-surface-container-lowest">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-on-surface-variant">
              <span className="material-symbols-outlined text-6xl mb-4 opacity-50">shopping_basket</span>
              <p className="text-sm font-semibold">O carrinho está vazio</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex flex-col gap-2 p-4 bg-surface border border-outline-variant rounded-2xl hover:border-primary/30 transition-colors shadow-sm">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-sm line-clamp-2 text-on-surface pr-4">{item.name}</h4>
                  <button onClick={() => removeFromCart(item.id)} className="text-on-surface-variant hover:text-error hover:bg-error-container p-1 rounded-full transition-colors shrink-0">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
                <div className="flex justify-between items-end mt-2">
                  <div className="flex items-center gap-3 bg-surface-container-low border border-outline-variant rounded-xl p-1">
                    <button 
                      onClick={() => updateQuantity(item.id, item.cartQuantity - 1)}
                      className="w-7 h-7 flex items-center justify-center bg-surface rounded-lg shadow-sm text-on-surface-variant hover:text-primary transition-colors border border-outline-variant"
                    >
                      <span className="material-symbols-outlined text-[16px]">remove</span>
                    </button>
                    <span className="font-bold text-sm w-4 text-center">{item.cartQuantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.cartQuantity + 1)}
                      className="w-7 h-7 flex items-center justify-center bg-surface rounded-lg shadow-sm text-on-surface-variant hover:text-primary transition-colors border border-outline-variant"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                    </button>
                  </div>
                  <span className="font-black text-on-surface">
                    R$ {(item.sellPrice * item.cartQuantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Resumo e Pagamento */}
        <div className="p-5 border-t border-outline-variant bg-surface-container-lowest flex flex-col gap-4">
          <div className="flex justify-between items-center bg-surface-container-low p-4 rounded-xl border border-outline-variant">
            <span className="text-on-surface-variant font-bold uppercase text-xs tracking-wider">Total a pagar</span>
            <span className="font-black text-2xl text-primary">
              R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {!showCheckout ? (
            <button 
              onClick={() => setShowCheckout(true)}
              disabled={cart.length === 0}
              className="w-full bg-primary text-on-primary font-bold py-3.5 rounded-xl shadow-sm hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              <span className="material-symbols-outlined">payments</span>
              Cobrar Cliente
            </button>
          ) : (
            <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-4 duration-300">
              <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant pb-2">Forma de Pagamento</span>
              <div className="grid grid-cols-2 gap-2">
                {['PIX', 'CREDITO', 'DEBITO', 'DINHEIRO'].map(method => (
                  <button
                    key={method}
                    onClick={() => setPaymentType(method)}
                    className={`py-2 px-3 rounded-xl font-bold text-sm transition-all ${paymentType === method ? 'bg-primary text-on-primary shadow-sm border border-primary' : 'bg-surface text-on-surface-variant border border-outline-variant hover:bg-surface-container'}`}
                  >
                    {method}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-outline-variant">
                <button 
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 bg-surface text-on-surface-variant border border-outline-variant font-bold py-3 rounded-xl hover:bg-surface-container transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCheckout}
                  className="flex-[2] bg-primary text-on-primary font-bold py-3 rounded-xl shadow-sm hover:bg-primary-hover transition-colors flex justify-center items-center gap-2 text-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  Finalizar Venda
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
