import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export default function TableOrder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [table, setTable] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState<any[]>([]); // Itens a enviar
  const [searchTerm, setSearchTerm] = useState('');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState({ amount: 0, type: 'PIX' });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tableRes, productsRes] = await Promise.all([
        api.get('/tables'), // TODO: Ideally we should have a GET /tables/:id, but we can filter from list
        api.get('/products')
      ]);
      const currentTable = tableRes.data.find((t: any) => t.id === id);
      if (!currentTable) {
        toast.error('Mesa não encontrada');
        navigate('/mesas');
        return;
      }
      setTable(currentTable);
      setProducts(productsRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados da mesa');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: any) => {
    const existing = cart.find(i => i.productId === product.id);
    if (existing) {
      setCart(cart.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { productId: product.id, name: product.name, unitPrice: product.costPrice > 0 ? product.costPrice * 2 : 10, quantity: 1 }]); // Simplification: in real life, product.salePrice
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(i => i.productId !== productId));
  };

  const sendOrder = async () => {
    if (cart.length === 0) return;
    try {
      await api.post(`/tables/${id}/items`, {
        items: cart.map(c => ({
          productId: c.productId,
          quantity: c.quantity,
          unitPrice: c.unitPrice
        }))
      });
      toast.success('Pedido enviado para a cozinha!');
      setCart([]);
      fetchData(); // Reload table
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao enviar pedido');
    }
  };

  const cancelSentItem = async (itemId: string) => {
    if (!window.confirm('Deseja realmente cancelar este item? O estoque será estornado.')) return;
    try {
      await api.delete(`/tables/${id}/items/${itemId}`);
      toast.success('Item cancelado com sucesso');
      fetchData();
    } catch (error) {
      toast.error('Erro ao cancelar item');
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/tables/${id}/checkout`, {
        totalAmount: table.totalAmount,
        paymentMethods: [
          { type: checkoutData.type, amount: table.totalAmount }
        ]
      });
      toast.success('Conta fechada com sucesso!');
      setIsCheckoutModalOpen(false);
      navigate('/mesas');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao fechar conta');
    }
  };

  if (loading || !table) return <LoadingSkeleton />;

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-4">
      {/* Esquerda: Produtos */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/mesas')} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              <span className="material-icons">arrow_back</span>
            </button>
            <h2 className="text-xl font-bold dark:text-white">
              Mesa {table.tableNumber || 'S/N'} {table.customerName ? `- ${table.customerName}` : ''}
            </h2>
          </div>
          <div className="mt-4 relative">
            <span className="material-icons absolute left-3 top-2.5 text-gray-400">search</span>
            <input
              type="text"
              placeholder="Buscar produto para adicionar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-[#E8461C] focus:ring-[#E8461C]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="flex flex-col items-center justify-center p-4 border rounded-xl hover:border-[#E8461C] hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors text-center dark:border-gray-700"
              >
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-2">
                  <span className="material-icons text-gray-500 dark:text-gray-400">restaurant</span>
                </div>
                <span className="font-medium text-sm text-gray-900 dark:text-white mb-1 line-clamp-2">
                  {product.name}
                </span>
                <span className="text-[#E8461C] font-bold text-sm">
                  {/* Fake price if doesn't have sale price */}
                  R$ {((product.costPrice > 0 ? product.costPrice * 2 : 10)).toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Direita: Comanda (Enviados e A Enviar) */}
      <div className="w-full md:w-[400px] flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 bg-gray-900 text-white text-center">
          <h3 className="font-bold text-lg">Resumo da Mesa</h3>
          <p className="text-3xl font-bold text-[#E8461C] mt-2">
            R$ {table.totalAmount.toFixed(2)}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Itens já enviados */}
          {table.items && table.items.length > 0 && (
            <div>
              <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <span className="material-icons text-green-500">check_circle</span>
                Já Pedidos
              </h4>
              <div className="space-y-2">
                {table.items.filter((i: any) => i.status !== 'CANCELADO').map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded border border-gray-100 dark:border-gray-600">
                    <div className="flex-1">
                      <p className="text-sm font-medium dark:text-white">
                        {item.quantity}x {item.product.name}
                      </p>
                      <p className="text-xs text-gray-500">R$ {item.total.toFixed(2)}</p>
                    </div>
                    <button 
                      onClick={() => cancelSentItem(item.id)}
                      title="Cancelar item"
                      className="text-red-500 p-1 hover:bg-red-50 rounded"
                    >
                      <span className="material-icons text-sm">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Carrinho Atual (A Enviar) */}
          {cart.length > 0 && (
            <div>
               <h4 className="font-bold text-orange-600 mb-3 flex items-center gap-2">
                <span className="material-icons">hourglass_empty</span>
                A Enviar
              </h4>
              <div className="space-y-2">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800/50">
                    <div>
                      <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
                        {item.quantity}x {item.name}
                      </p>
                      <p className="text-xs text-orange-700 dark:text-orange-300">R$ {(item.quantity * item.unitPrice).toFixed(2)}</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.productId)}
                      className="text-red-500 p-1 hover:bg-red-100 rounded"
                    >
                      <span className="material-icons text-sm">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button
            onClick={sendOrder}
            disabled={cart.length === 0}
            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
              cart.length > 0 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700'
            }`}
          >
            <span className="material-icons">send</span>
            Enviar Pedido
          </button>

          <button
            onClick={() => setIsCheckoutModalOpen(true)}
            disabled={cart.length > 0 || table.totalAmount === 0}
            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
              cart.length === 0 && table.totalAmount > 0
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700'
            }`}
          >
            <span className="material-icons">payments</span>
            Fechar Conta
          </button>
        </div>
      </div>

      {/* Modal de Fechamento */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Pagamento</h2>
            <form onSubmit={handleCheckout} className="space-y-4">
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total a Pagar</p>
                <p className="text-3xl font-bold text-[#E8461C]">R$ {table.totalAmount.toFixed(2)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Forma de Pagamento
                </label>
                <select
                  value={checkoutData.type}
                  onChange={(e) => setCheckoutData({ ...checkoutData, type: e.target.value })}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="PIX">PIX</option>
                  <option value="DEBITO">Cartão de Débito</option>
                  <option value="CREDITO">Cartão de Crédito</option>
                  <option value="DINHEIRO">Dinheiro</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Confirmar Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
