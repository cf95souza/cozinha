import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { Scanner } from '@yudiel/react-qr-scanner';

export default function Labels() {
  const { activeBranch, user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [generatedLabel, setGeneratedLabel] = useState<any>(null);
  const [readQrCode, setReadQrCode] = useState('');
  const [readLabelInfo, setReadLabelInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [historicalLabels, setHistoricalLabels] = useState<any[]>([]);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (activeBranch) {
      api.get(`/products?branchId=${activeBranch.id}`).then(res => setProducts(res.data.data || res.data));
      fetchHistoricalLabels();
    }
  }, [activeBranch]);

  const fetchHistoricalLabels = async () => {
    try {
      if (activeBranch) {
        const res = await api.get(`/labels?branchId=${activeBranch.id}`);
        setHistoricalLabels(res.data.data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar histórico de etiquetas', err);
    }
  };

  const generateLabel = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    try {
      const res = await api.post('/labels', {
        productId: selectedProduct,
        userId: user?.id,
      });
      // Mocking additional info for the visual label
      const labelData = res.data;
      const productInfo = products.find(p => p.id === selectedProduct);
      
      setGeneratedLabel({
        ...labelData,
        product: productInfo,
        companyName: user?.company || 'COZINHA+ RESTAURANTE',
        cnpj: '00.000.000/0001-00',
        cep: '00000-000',
        address: 'Rua Exemplo, 123',
        city: 'São Paulo - SP',
        userName: user?.name || 'Responsável',
        sif: productInfo?.sif || 'N/A',
        brand: productInfo?.brand || 'Própria',
        preservation: 'Resfriado',
        weight: '1kg',
        originalVal: '10/12/2026',
        manipulationDate: new Date().toLocaleString('pt-BR'),
        expirationDate: new Date(new Date().setDate(new Date().getDate() + 3)).toLocaleString('pt-BR'),
      });
      fetchHistoricalLabels();
    } catch (err) {
      alert('Erro ao gerar etiqueta');
    } finally {
      setLoading(false);
    }
  };

  const readLabel = async () => {
    if (!readQrCode) return;
    setLoading(true);
    try {
      const res = await api.get(`/labels/${readQrCode}`);
      setReadLabelInfo(res.data);
    } catch (err) {
      alert('Etiqueta não encontrada');
      setReadLabelInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const printLabel = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Gestão de Etiquetas</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Gere etiquetas de validade profissionais para os produtos.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 print:hidden">
        
        {/* GERAR ETIQUETA */}
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-outline-variant h-fit">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-on-surface text-sm flex items-center gap-2">
              <span className="material-symbols-outlined notranslate text-[18px] text-primary">label</span>
              Gerar Nova Etiqueta
            </h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-on-surface">Produto</label>
              <select 
                value={selectedProduct} 
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="">Selecione um produto...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={generateLabel}
              disabled={loading || !selectedProduct}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:hover:bg-primary"
            >
              {loading ? 'Gerando...' : 'Gerar Etiqueta'}
            </button>
          </div>
        </div>

        {/* LER ETIQUETA */}
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-outline-variant h-fit">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-on-surface text-sm flex items-center gap-2">
              <span className="material-symbols-outlined notranslate text-[18px] text-secondary">qr_code_scanner</span>
              Ler Etiqueta
            </h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-on-surface">Código QR / ID</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={readQrCode}
                  onChange={(e) => setReadQrCode(e.target.value)}
                  placeholder="Escaneie ou digite..."
                  className="flex-1 px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button 
                  onClick={readLabel}
                  disabled={loading || !readQrCode}
                  className="bg-surface border border-outline-variant text-on-surface px-5 rounded-xl font-bold hover:bg-surface-container transition-colors disabled:opacity-50"
                >
                  Buscar
                </button>
              </div>
              <button
                onClick={() => setShowScanner(!showScanner)}
                className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 bg-surface-container-high text-on-surface rounded-xl hover:bg-surface-container-highest transition-colors font-semibold border border-outline-variant text-sm"
              >
                <span className="material-symbols-outlined notranslate text-[18px]">
                  {showScanner ? 'videocam_off' : 'photo_camera'}
                </span>
                {showScanner ? 'Desligar Câmera' : 'Ligar Câmera para Escanear'}
              </button>
              
              {showScanner && (
                <div className="mt-4 rounded-xl overflow-hidden border border-outline-variant">
                  <Scanner 
                    onScan={(result) => {
                      if (result && result.length > 0) {
                        setReadQrCode(result[0].rawValue);
                        setShowScanner(false);
                        // Chama readLabel() mas passando o valor lido diretamente
                        const scannedCode = result[0].rawValue;
                        setLoading(true);
                        api.get(`/labels/${scannedCode}`).then(res => {
                          setReadLabelInfo(res.data);
                        }).catch(() => {
                          alert('Etiqueta não encontrada');
                          setReadLabelInfo(null);
                        }).finally(() => setLoading(false));
                      }
                    }} 
                  />
                </div>
              )}
            </div>

            {readLabelInfo && (
              <div className="mt-4 p-4 bg-surface-container-low border border-outline-variant rounded-xl">
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-outline-variant">
                  <span className="material-symbols-outlined notranslate text-secondary text-2xl">check_circle</span>
                  <div>
                    <h3 className="font-bold text-sm text-on-surface">{readLabelInfo.product.name}</h3>
                    <p className="text-xs text-on-surface-variant">Lido com sucesso</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-on-surface">
                  <div className="flex justify-between"><span className="text-on-surface-variant">QR Code:</span> <span className="font-semibold">{readLabelInfo.qrCode}</span></div>
                  <div className="flex justify-between"><span className="text-on-surface-variant">Categoria:</span> <span className="font-semibold">{readLabelInfo.product.category?.name || '-'}</span></div>
                  <div className="flex justify-between"><span className="text-on-surface-variant">Gerado por:</span> <span className="font-semibold">{readLabelInfo.user.name}</span></div>
                  <div className="flex justify-between"><span className="text-on-surface-variant">Data:</span> <span className="font-semibold">{new Date(readLabelInfo.generatedAt).toLocaleString('pt-BR')}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HISTÓRICO DE ETIQUETAS */}
      <div className="mt-8 bg-surface p-6 rounded-2xl shadow-sm border border-outline-variant print:hidden">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-on-surface text-lg flex items-center gap-2">
            <span className="material-symbols-outlined notranslate text-primary">history</span>
            Últimas Etiquetas Geradas
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-outline-variant text-on-surface-variant font-medium">
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-4">Código QR</th>
                <th className="py-3 px-4">Data / Hora</th>
                <th className="py-3 px-4">Responsável</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {historicalLabels.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-on-surface-variant">Nenhuma etiqueta gerada recentemente.</td>
                </tr>
              ) : (
                historicalLabels.map((label) => (
                  <tr key={label.id} className="border-b border-outline-variant/50 hover:bg-surface-container-lowest transition-colors">
                    <td className="py-3 px-4 font-semibold text-on-surface">{label.product?.name}</td>
                    <td className="py-3 px-4 font-mono text-xs">{label.qrCode}</td>
                    <td className="py-3 px-4">{new Date(label.generatedAt).toLocaleString('pt-BR')}</td>
                    <td className="py-3 px-4 text-on-surface-variant">{label.user?.name}</td>
                    <td className="py-3 px-4 text-right">
                      <button 
                        onClick={() => {
                          const productInfo = label.product;
                          setGeneratedLabel({
                            ...label,
                            product: productInfo,
                            companyName: user?.company || 'COZINHA+ RESTAURANTE',
                            cnpj: '00.000.000/0001-00',
                            cep: '00000-000',
                            address: 'Rua Exemplo, 123',
                            city: 'São Paulo - SP',
                            userName: label.user?.name || 'Responsável',
                            sif: productInfo?.sif || 'N/A',
                            brand: productInfo?.brand || 'Própria',
                            preservation: 'Resfriado',
                            weight: '1kg',
                            originalVal: '10/12/2026',
                            manipulationDate: new Date(label.generatedAt).toLocaleString('pt-BR'),
                            expirationDate: new Date(new Date(label.generatedAt).setDate(new Date(label.generatedAt).getDate() + 3)).toLocaleString('pt-BR'),
                          });
                          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                        }}
                        className="text-primary hover:text-primary-hover font-semibold px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                      >
                        Reimprimir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PREVIEW E ÁREA DE IMPRESSÃO DA ETIQUETA */}
      {generatedLabel && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4 print:hidden">
            <h3 className="font-bold text-on-surface">Pré-visualização (Padrão COZINHA+)</h3>
            <button 
              onClick={printLabel}
              className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-on-secondary rounded-xl text-sm font-semibold hover:opacity-90 transition-colors"
            >
              <span className="material-symbols-outlined notranslate text-[18px]">print</span>
              Imprimir
            </button>
          </div>

          {/* Container de impressão: aparece na tela como preview, mas domina a página no @media print */}
          <div className="flex justify-center print:block">
            <div className="print:w-full print:h-full print:absolute print:top-0 print:left-0 print:m-0 print:p-0 bg-white border border-gray-300 print:border-none rounded-xl p-4 w-[400px] text-black font-sans shadow-lg print:shadow-none">
              
              {/* Etiqueta Visual */}
              <div className="border-2 border-black p-3 space-y-2 text-[11px] leading-tight font-bold">
                
                {/* Produto + Infos base */}
                <div className="mb-2">
                  <h1 className="text-base uppercase tracking-tight mb-1">{generatedLabel.product?.name}</h1>
                  <div className="flex justify-between font-medium">
                    <span>{generatedLabel.preservation}</span>
                    <span>{generatedLabel.weight}</span>
                  </div>
                </div>

                <div className="border-t-2 border-black pt-2">
                  <div className="flex justify-between"><span>VAL. ORIGINAL:</span> <span>{generatedLabel.originalVal}</span></div>
                  <div className="flex justify-between"><span>MANIPULAÇÃO:</span> <span>{generatedLabel.manipulationDate}</span></div>
                  <div className="flex justify-between font-extrabold text-[12px] mt-1"><span>VALIDADE:</span> <span>{generatedLabel.expirationDate}</span></div>
                </div>

                <div className="border-t-2 border-black pt-2">
                  <div className="flex justify-between"><span>MARCA / FORN.:</span> <span>{generatedLabel.brand}</span></div>
                  <div className="flex justify-between"><span>SIF:</span> <span>{generatedLabel.sif}</span></div>
                </div>

                <div className="border-t-2 border-black pt-2 flex justify-between items-end">
                  <div className="font-medium text-[10px] space-y-0.5">
                    <p className="font-bold text-[11px]">RESP.: {generatedLabel.userName}</p>
                    <p className="font-bold mt-1 uppercase">{generatedLabel.companyName}</p>
                    <p>CNPJ: {generatedLabel.cnpj}</p>
                    <p>CEP: {generatedLabel.cep}</p>
                    <p>{generatedLabel.address}</p>
                    <p>{generatedLabel.city}</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-white flex items-center justify-center p-0.5 border border-black">
                      <QRCodeSVG value={generatedLabel.qrCode || 'COZINHA+'} size={60} />
                    </div>
                    <span className="mt-1 text-[10px]">#{generatedLabel.qrCode}</span>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
