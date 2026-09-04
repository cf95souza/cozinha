import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { printReceiptBrowser } from '../lib/printer';
import { Search, Barcode, ShoppingBasket, X, Minus, Plus, Banknote, CreditCard, Smartphone, CheckCircle, Calculator } from 'lucide-react';

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
  discountType?: 'PERCENT' | 'FIXED';
  discountValue?: number;
}

export default function PDV() {
  const { activeBranch, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  
  // Checkout states
  const [paymentMethods, setPaymentMethods] = useState<{ type: string; amount: number }[]>([{ type: 'PIX', amount: 0 }]);
  const [cashReceived, setCashReceived] = useState(0);
  const [globalDiscountType, setGlobalDiscountType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [globalDiscountValue, setGlobalDiscountValue] = useState(0);

  // Cash Register State
  const [activeRegister, setActiveRegister] = useState<any>(null);

  const barcodeBuffer = useRef('');
  const lastKeystrokeTime = useRef(0);

  const fetchActiveRegister = async () => {
    try {
      const res = await api.get(`/finance/cash-registers?branchId=${activeBranch?.id}`);
      const registers = res.data || [];
      const myRegister = registers.find((reg: any) => 
        reg.shifts && reg.shifts.some((shift: any) => shift.status === 'ABERTO' && shift.openedById === user?.id)
      );
      if (myRegister) {
        setActiveRegister(myRegister);
      }
    } catch (error) {
      console.error('Erro ao buscar caixa ativo', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/products?branchId=${activeBranch?.id}&limit=100`);
      const sellable = (res.data.data || res.data).filter((p: any) => p.sellPrice && p.sellPrice > 0);
      setProducts(sellable);
    } catch (error) {
      toast.error('Erro ao carregar produtos para o PDV');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeBranch) {
      fetchProducts();
      fetchActiveRegister();
    }
  }, [activeBranch, user]);

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
            setSearchTerm('');
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

  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => item.id === productId ? { ...item, cartQuantity: qty } : item));
  };

  const updateItemDiscount = (productId: string, discountType: 'PERCENT' | 'FIXED', discountValue: number) => {
    setCart(prev => prev.map(item => item.id === productId ? { ...item, discountType, discountValue } : item));
  };

  const removeItemDiscount = (productId: string) => {
    setCart(prev => prev.map(item => item.id === productId ? { ...item, discountType: undefined, discountValue: undefined } : item));
  };

  const getItemTotal = (item: CartItem) => {
    const baseTotal = item.sellPrice * item.cartQuantity;
    if (!item.discountValue) return baseTotal;
    if (item.discountType === 'PERCENT') {
      return baseTotal * (1 - item.discountValue / 100);
    }
    return Math.max(0, baseTotal - item.discountValue);
  };

  const getGlobalDiscountAmount = (subtotal: number) => {
    if (!globalDiscountValue) return 0;
    if (globalDiscountType === 'PERCENT') {
      return subtotal * (globalDiscountValue / 100);
    }
    return Math.min(globalDiscountValue, subtotal);
  };

  const subtotal = cart.reduce((acc, item) => acc + getItemTotal(item), 0);
  const globalDiscountAmount = getGlobalDiscountAmount(subtotal);
  const totalAmount = subtotal - globalDiscountAmount;
  
  const totalPaymentAmount = paymentMethods.reduce((sum, p) => sum + p.amount, 0);
  const hasCashPayment = paymentMethods.some(p => p.type === 'DINHEIRO');
  const cashPaymentAmount = paymentMethods.find(p => p.type === 'DINHEIRO')?.amount || 0;
  const change = hasCashPayment ? Math.max(0, cashReceived - cashPaymentAmount) : 0;

  // Initialize checkout amounts when opened
  useEffect(() => {
    if (showCheckout && paymentMethods.length === 1 && paymentMethods[0].amount === 0) {
      setPaymentMethods([{ type: 'PIX', amount: totalAmount }]);
    }
  }, [showCheckout, totalAmount]);

  useEffect(() => {
    if (hasCashPayment && cashPaymentAmount > 0 && cashReceived === 0) {
      setCashReceived(cashPaymentAmount);
    }
  }, [hasCashPayment, cashPaymentAmount]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    if (Math.abs(totalPaymentAmount - totalAmount) > 0.01) {
      toast.error(`Total dos pagamentos (R$ ${totalPaymentAmount.toFixed(2)}) deve ser igual ao total da venda (R$ ${totalAmount.toFixed(2)})`);
      return;
    }

    try {
      const payload = {
        paymentMethods: paymentMethods.filter(p => p.amount > 0),
        totalAmount,
        discountType: globalDiscountType,
        discountValue: globalDiscountValue,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.cartQuantity,
          unitPrice: item.sellPrice,
          discountType: item.discountType,
          discountValue: item.discountValue
        }))
      };

      const response = await api.post('/sales', payload);
      const sale = response.data;
      
      toast.success('Venda finalizada com sucesso!');

      if (sale.nfce) {
        if (sale.nfce.success) {
          toast.success('NFC-e emitida com sucesso!');
        } else {
          toast.error(`Falha na emissão da NFC-e: ${sale.nfce.error}`, { duration: 6000 });
        }
      }
      
      const receiptData = {
        companyName: activeBranch?.name || 'COZINHA+',
        companyDocument: activeBranch?.document || '00.000.000/0000-00',
        companyAddress: activeBranch?.address || 'Endereço não informado',
        branchName: activeBranch?.name || 'Filial Principal',
        saleId: sale.id,
        date: new Date(),
        items: cart.map(item => ({
          name: item.name,
          quantity: item.cartQuantity,
          unitPrice: item.sellPrice,
          total: item.sellPrice * item.cartQuantity,
          discountValue: item.discountValue
        })),
        subtotal,
        discountAmount: globalDiscountAmount,
        totalAmount,
        paymentMethods: paymentMethods.filter(p => p.amount > 0),
        cashReceived: hasCashPayment ? cashReceived : undefined,
        change: hasCashPayment ? change : undefined,
        cashierName: user?.name || 'Operador',
        nfceUrl: sale.nfce?.success ? sale.nfce.url : undefined
      };
      
      printReceiptBrowser(receiptData);
      
      setCart([]);
      setGlobalDiscountValue(0);
      setPaymentMethods([{ type: 'PIX', amount: 0 }]);
      setCashReceived(0);
      setShowCheckout(false);
    } catch (error) {
      toast.error('Erro ao finalizar venda');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.barcode && p.barcode.includes(searchTerm))
  );

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case 'PIX': return <Smartphone className="w-5 h-5" />;
      case 'CREDITO': return <CreditCard className="w-5 h-5 text-blue-500" />;
      case 'DEBITO': return <CreditCard className="w-5 h-5 text-green-500" />;
      case 'DINHEIRO': return <Banknote className="w-5 h-5 text-emerald-600" />;
      default: return <Banknote className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] gap-6 animate-in fade-in duration-300">
      
      {/* Esquerda: Produtos */}
      <div className="flex-1 flex flex-col bg-surface border border-outline-variant rounded-3xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-surface-container-lowest">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
            <input 
              type="text" 
              placeholder="Buscar produtos por nome ou bipar código..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-surface-container-lowest border border-outline-variant rounded-2xl text-base text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2 mt-4 text-xs font-bold text-primary bg-primary/10 px-4 py-2 rounded-xl w-fit border border-primary/20">
            <Barcode className="w-4 h-4 animate-pulse" />
            Leitor de Código de Barras Ativo
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 bg-surface-container-lowest">
          {loading ? (
             <div className="flex justify-center items-center h-full text-on-surface-variant gap-2">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
             </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-on-surface-variant">
              <ShoppingBasket className="w-16 h-16 mb-4 opacity-30" />
              <p className="font-bold text-base">Nenhum produto vendável encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <div 
                  key={product.id} 
                  onClick={() => addToCart(product)}
                  className="bg-surface border border-outline-variant rounded-2xl p-4 cursor-pointer hover:border-primary hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col gap-3 group"
                >
                  <div className="h-32 bg-surface-container-low rounded-xl flex items-center justify-center overflow-hidden border border-outline-variant/30 group-hover:border-primary/30 transition-colors">
                    {product.photoUrl ? (
                      <img src={product.photoUrl} alt={product.name} className="object-cover w-full h-full" />
                    ) : (
                      <ShoppingBasket className="w-10 h-10 text-on-surface-variant opacity-20" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-on-surface leading-tight line-clamp-2">{product.name}</h3>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider mt-1">{product.category?.name || 'Sem categoria'}</p>
                  </div>
                  <div className="mt-auto pt-2 flex justify-between items-center">
                    <span className="font-black text-on-surface text-lg">
                      R$ {product.sellPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Direita: Carrinho e Pagamento */}
      <div className="w-full lg:w-[420px] flex flex-col bg-surface border border-outline-variant rounded-3xl shadow-sm overflow-hidden shrink-0">
        
        {/* Header do Carrinho */}
        <div className="p-5 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${activeRegister ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-500'}`}>
              <ShoppingBasket className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">
                {activeRegister ? activeRegister.name : 'Caixa Fechado'}
              </h2>
              <p className={`text-xs font-bold uppercase tracking-wider ${activeRegister ? 'text-on-surface-variant' : 'text-red-500'}`}>
                {activeRegister ? 'PDV Aberto' : 'Abra o caixa antes de vender'}
              </p>
            </div>
          </div>
          {cart.length > 0 && (
            <div className="bg-primary text-white font-black text-xs px-3 py-1 rounded-full">
              {cart.reduce((acc, i) => acc + i.cartQuantity, 0)} itens
            </div>
          )}
        </div>
        
        {/* Lista de Itens */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-surface-container-lowest">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-on-surface-variant">
              <Calculator className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-sm font-bold">O carrinho está vazio</p>
            </div>
          ) : (
            <>
              {cart.map(item => {
                const itemTotal = getItemTotal(item);
                const hasDiscount = item.discountValue && item.discountValue > 0;
                return (
                  <div key={item.id} className="flex flex-col gap-3 p-4 bg-surface border border-outline-variant rounded-2xl hover:border-primary/50 transition-colors shadow-sm">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sm line-clamp-2 text-on-surface pr-4">{item.name}</h4>
                      <button onClick={() => removeFromCart(item.id)} className="text-on-surface-variant hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-end mt-1">
                      <div className="flex items-center gap-1 bg-surface-container-low border border-outline-variant rounded-xl p-1">
                        <button 
                          onClick={() => updateQuantity(item.id, item.cartQuantity - 1)}
                          className="w-8 h-8 flex items-center justify-center bg-surface rounded-lg shadow-sm text-on-surface-variant hover:text-primary transition-colors border border-outline-variant"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-bold text-sm w-6 text-center">{item.cartQuantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.cartQuantity + 1)}
                          className="w-8 h-8 flex items-center justify-center bg-surface rounded-lg shadow-sm text-on-surface-variant hover:text-primary transition-colors border border-outline-variant"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="font-black text-on-surface text-base">
                        R$ {itemTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Desconto por item */}
                    <div className="flex items-center gap-2 pt-3 border-t border-outline-variant/50">
                      <span className="text-xs font-bold text-on-surface-variant uppercase">Desc:</span>
                      <select
                        value={item.discountType || 'PERCENT'}
                        onChange={e => updateItemDiscount(item.id, e.target.value as 'PERCENT' | 'FIXED', item.discountValue || 0)}
                        className="text-xs px-2 py-1.5 bg-surface-container border border-outline-variant rounded-lg text-on-surface font-bold outline-none"
                      >
                        <option value="PERCENT">%</option>
                        <option value="FIXED">R$</option>
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.discountValue || ''}
                        onChange={e => {
                          const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          if (item.discountType === 'PERCENT' && val > 100) return;
                          updateItemDiscount(item.id, item.discountType || 'PERCENT', val);
                        }}
                        className="text-xs px-2 py-1.5 w-20 bg-surface border border-outline-variant rounded-lg text-on-surface font-bold text-right outline-none"
                        placeholder="0,00"
                      />
                      {hasDiscount && (
                        <button onClick={() => removeItemDiscount(item.id)} className="text-xs text-red-500 font-bold hover:underline ml-auto">
                          Remover
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Desconto Global */}
              {subtotal > 0 && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl mt-2">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm text-primary">Desconto na Venda</span>
                    {globalDiscountAmount > 0 && (
                      <span className="text-sm text-green-600 font-black">- R$ {globalDiscountAmount.toFixed(2)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={globalDiscountType}
                      onChange={e => setGlobalDiscountType(e.target.value as 'PERCENT' | 'FIXED')}
                      className="text-sm font-bold px-3 py-2 bg-surface border border-outline-variant rounded-xl text-on-surface outline-none"
                    >
                      <option value="PERCENT">%</option>
                      <option value="FIXED">R$</option>
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={globalDiscountValue}
                      onChange={e => {
                        const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        if (globalDiscountType === 'PERCENT' && val > 100) return;
                        setGlobalDiscountValue(val);
                      }}
                      className="text-sm font-bold px-3 py-2 w-28 bg-surface border border-outline-variant rounded-xl text-on-surface text-right outline-none"
                      placeholder="0,00"
                    />
                    {globalDiscountAmount > 0 && (
                      <button onClick={() => { setGlobalDiscountValue(0); }} className="text-xs font-bold text-red-500 hover:underline ml-auto">
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Resumo e Checkout */}
        <div className="p-5 border-t border-outline-variant bg-surface-container-lowest flex flex-col gap-4 shadow-[0_-10px_20px_-15px_rgba(0,0,0,0.1)]">
          {!showCheckout ? (
            <>
              <div className="flex justify-between items-center px-2">
                <span className="text-on-surface-variant font-bold uppercase text-xs tracking-wider">Subtotal</span>
                <span className="font-bold text-on-surface">R$ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center bg-primary p-4 rounded-2xl text-white shadow-md">
                <span className="font-bold uppercase text-xs tracking-wider opacity-90">Total a pagar</span>
                <span className="font-black text-3xl">
                  R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <button 
                onClick={() => setShowCheckout(true)}
                disabled={cart.length === 0}
                className="w-full bg-surface text-on-surface border-2 border-outline-variant font-black py-4 rounded-2xl hover:border-primary hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base"
              >
                IR PARA O PAGAMENTO
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-300">
              
              <div className="flex justify-between items-center bg-surface-container-lowest p-3 rounded-xl border border-outline-variant">
                <span className="font-bold text-xs uppercase tracking-wider text-on-surface-variant">Valor Total</span>
                <span className="font-black text-2xl text-primary">R$ {totalAmount.toFixed(2)}</span>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {paymentMethods.map((pm, idx) => (
                  <div key={idx} className="bg-surface border border-outline-variant rounded-2xl p-3 shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm">Forma de Pagamento {idx + 1}</span>
                      {paymentMethods.length > 1 && (
                        <button
                          onClick={() => setPaymentMethods(paymentMethods.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2">
                      {['PIX', 'CREDITO', 'DEBITO', 'DINHEIRO'].map(type => (
                        <button
                          key={type}
                          onClick={() => {
                            const updated = [...paymentMethods];
                            updated[idx].type = type;
                            setPaymentMethods(updated);
                          }}
                          className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border-2 transition-all ${pm.type === type ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary/50'}`}
                        >
                          {getPaymentIcon(type)}
                          <span className="text-[10px] font-bold">{type}</span>
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm font-bold text-on-surface-variant">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={pm.amount || ''}
                        onChange={e => {
                          const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          const updated = [...paymentMethods];
                          updated[idx].amount = val;
                          setPaymentMethods(updated);
                        }}
                        className="w-full font-black text-lg px-3 py-2 bg-surface-container-lowest border-b-2 border-outline-variant focus:border-primary text-on-surface outline-none text-right rounded-t-lg transition-colors"
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setPaymentMethods([...paymentMethods, { type: 'PIX', amount: 0 }])}
                  className="flex-1 py-3 bg-surface-container-low border border-dashed border-outline-variant rounded-xl text-on-surface-variant text-sm font-bold hover:bg-surface-variant transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Adicionar Pagamento
                </button>
              </div>

              {hasCashPayment && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-emerald-900">Dinheiro Recebido</span>
                    <input
                      type="number"
                      step="0.01"
                      min={cashPaymentAmount}
                      value={cashReceived || ''}
                      onChange={e => setCashReceived(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                      className="w-32 px-3 py-2 bg-white border border-emerald-300 rounded-xl font-black text-emerald-900 text-right outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="0,00"
                    />
                  </div>
                  
                  {/* Quick cash buttons */}
                  <div className="flex gap-2">
                    {[10, 20, 50, 100].map(val => (
                       <button
                         key={val}
                         onClick={() => setCashReceived(val)}
                         className="flex-1 py-1.5 bg-white border border-emerald-200 rounded-lg text-emerald-700 font-bold text-xs hover:bg-emerald-100 transition-colors"
                       >
                         R$ {val}
                       </button>
                    ))}
                    <button
                         onClick={() => setCashReceived(cashPaymentAmount)}
                         className="flex-1 py-1.5 bg-emerald-600 border border-emerald-600 rounded-lg text-white font-bold text-xs hover:bg-emerald-700 transition-colors"
                       >
                         Exato
                    </button>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-emerald-200 mt-1">
                    <span className="text-sm font-black text-emerald-900">TROCO</span>
                    <span className="font-black text-2xl text-emerald-700">
                      R$ {change.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center p-3 bg-surface-container rounded-xl">
                <span className="font-bold text-xs uppercase tracking-wider">Total Recebido</span>
                <span className={`font-black text-lg ${totalPaymentAmount >= totalAmount ? 'text-green-600' : 'text-red-500'}`}>
                  R$ {totalPaymentAmount.toFixed(2)}
                </span>
              </div>

              <div className="flex gap-2 mt-2">
                <button 
                  onClick={() => { setShowCheckout(false); setPaymentMethods([{ type: 'PIX', amount: 0 }]); }}
                  className="flex-[1] bg-surface text-on-surface-variant border border-outline-variant font-bold py-4 rounded-2xl hover:bg-surface-variant transition-colors text-sm"
                >
                  Voltar
                </button>
                <button 
                  onClick={handleCheckout}
                  className="flex-[2] bg-primary text-white font-black py-4 rounded-2xl shadow-md hover:bg-primary-hover transition-all flex justify-center items-center gap-2 text-base active:scale-[0.98]"
                >
                  <CheckCircle className="w-5 h-5" />
                  FINALIZAR
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
