import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Store, Plus, Trash2, Edit2, MapPin, Receipt, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

interface Branch {
  id: string;
  name: string;
  tradeName?: string;
  document?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  managerName?: string;
  type: string;
  status: string;

  // NFC-e
  nfceEnvironment?: string;
  nfceCscId?: string;
  nfceCscSecret?: string;
  nfceCertPassword?: string;
  nfceCertBase64?: string;
  nfceSeries?: number;
  nfceNextNumber?: number;
}

export default function Branches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<Partial<Branch>>({ type: 'RESTAURANTE', status: 'ATIVO', nfceEnvironment: 'HOMOLOGACAO', nfceSeries: 1, nfceNextNumber: 1 });
  const [activeTab, setActiveTab] = useState<'GERAL' | 'FISCAL'>('GERAL');
  const [certFileName, setCertFileName] = useState('');

  const fetchBranches = async () => {
    try {
      const response = await api.get('/branches');
      setBranches(response.data);
    } catch (err) {
      toast.error('Erro ao carregar unidades.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCertFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        setFormData(prev => ({ ...prev, nfceCertBase64: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenModal = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData(branch);
    } else {
      setEditingBranch(null);
      setFormData({ type: 'RESTAURANTE', status: 'ATIVO', nfceEnvironment: 'HOMOLOGACAO', nfceSeries: 1, nfceNextNumber: 1 });
    }
    setActiveTab('GERAL');
    setCertFileName('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Converte series e numbers para int
    const payload = {
      ...formData,
      nfceSeries: formData.nfceSeries ? parseInt(formData.nfceSeries.toString(), 10) : 1,
      nfceNextNumber: formData.nfceNextNumber ? parseInt(formData.nfceNextNumber.toString(), 10) : 1,
    };

    try {
      if (editingBranch) {
        await api.put(`/branches/${editingBranch.id}`, payload);
        toast.success('Unidade atualizada com sucesso!');
      } else {
        await api.post('/branches', payload);
        toast.success('Unidade criada com sucesso!');
      }
      setIsModalOpen(false);
      fetchBranches();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar unidade.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover esta unidade?')) return;
    try {
      await api.delete(`/branches/${id}`);
      toast.success('Unidade excluída!');
      fetchBranches();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao excluir unidade.');
    }
  };

  if (loading) return <div className="p-8 text-on-surface">Carregando unidades...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Gestão de Filiais e Múltiplos CNPJs</h1>
          <p className="text-sm text-on-surface-variant mt-1">Gerencie as unidades e configure a emissão fiscal independente para cada loja.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary-hover transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" /> Nova Unidade
        </button>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant text-sm font-bold uppercase border-b border-outline-variant">
              <th className="py-4 px-6">Unidade / Empresa</th>
              <th className="py-4 px-6 hidden md:table-cell">Tipo</th>
              <th className="py-4 px-6 hidden lg:table-cell">Endereço</th>
              <th className="py-4 px-6 hidden xl:table-cell">Fiscal</th>
              <th className="py-4 px-6 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {branches.map(branch => (
              <tr key={branch.id} className="hover:bg-surface-container-lowest transition-colors">
                <td className="py-4 px-6">
                  <div className="font-bold text-on-surface flex items-center gap-2 text-base">
                    <Store className="w-4 h-4 text-primary" />
                    {branch.name}
                  </div>
                  <div className="text-xs font-mono text-on-surface-variant mt-1 bg-surface-variant inline-block px-2 py-0.5 rounded">
                    CNPJ: {branch.document || 'Não informado'}
                  </div>
                </td>
                <td className="py-4 px-6 hidden md:table-cell">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase">
                    {branch.type || 'RESTAURANTE'}
                  </span>
                </td>
                <td className="py-4 px-6 hidden lg:table-cell">
                  {branch.city ? (
                    <div className="flex items-center gap-1 text-sm text-on-surface-variant">
                      <MapPin className="w-4 h-4" /> {branch.city} - {branch.state}
                    </div>
                  ) : '-'}
                </td>
                <td className="py-4 px-6 hidden xl:table-cell">
                  {branch.nfceCertBase64 ? (
                     <div className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-md w-max border border-green-200">
                       <ShieldCheck size={14} /> Emissor Ativo
                     </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs font-bold text-orange-700 bg-orange-100 px-2 py-1 rounded-md w-max border border-orange-200">
                      Pendente Config
                    </div>
                  )}
                </td>
                <td className="py-4 px-6 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => handleOpenModal(branch)}
                      className="text-primary hover:bg-primary/10 p-2 rounded-xl transition-colors"
                      title="Editar Unidade e Configuração Fiscal"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(branch.id)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded-xl transition-colors"
                      title="Remover Unidade"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {branches.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-on-surface-variant">
                  Nenhuma unidade cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <Store className="w-6 h-6 text-primary" />
                {editingBranch ? 'Configurar Unidade / Filial' : 'Nova Unidade / Filial'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-on-surface-variant hover:text-on-surface font-bold text-xl">&times;</button>
            </div>

            {/* ABAS */}
            <div className="flex border-b border-outline-variant px-6 bg-surface-container-lowest">
              <button 
                type="button"
                onClick={() => setActiveTab('GERAL')}
                className={`py-3 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'GERAL' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
              >
                Dados Gerais
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('FISCAL')}
                className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'FISCAL' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
              >
                <Receipt size={16} /> Configuração Fiscal (NFC-e)
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="branch-form" onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* ABA GERAL */}
                <div className={activeTab === 'GERAL' ? 'md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4' : 'hidden'}>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-on-surface mb-1">Nome da Unidade (Fantasia) *</label>
                    <input required type="text" name="name" value={formData.name || ''} onChange={handleChange} className="w-full border-outline-variant rounded-xl py-2 px-3 border bg-surface focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-1">Razão Social</label>
                    <input type="text" name="tradeName" value={formData.tradeName || ''} onChange={handleChange} className="w-full border-outline-variant rounded-xl py-2 px-3 border bg-surface focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-1">Tipo de Unidade</label>
                    <select name="type" value={formData.type || 'RESTAURANTE'} onChange={handleChange} className="w-full border-outline-variant rounded-xl py-2 px-3 border bg-surface focus:ring-2 focus:ring-primary outline-none">
                      <option value="RESTAURANTE">Restaurante / PDV</option>
                      <option value="COZINHA_CENTRAL">Cozinha Central</option>
                      <option value="CENTRO_DISTRIBUICAO">Centro de Distribuição</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-1">CNPJ *</label>
                    <input required type="text" name="document" value={formData.document || ''} onChange={handleChange} placeholder="00.000.000/0000-00" className="w-full border-outline-variant rounded-xl py-2 px-3 border bg-surface focus:ring-2 focus:ring-primary outline-none font-mono" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-1">Telefone</label>
                    <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full border-outline-variant rounded-xl py-2 px-3 border bg-surface focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-on-surface mb-1">Endereço Completo (Para emissão de nota)</label>
                    <input type="text" name="address" value={formData.address || ''} onChange={handleChange} placeholder="Rua, Número, Bairro" className="w-full border-outline-variant rounded-xl py-2 px-3 border bg-surface focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-1">Cidade</label>
                    <input type="text" name="city" value={formData.city || ''} onChange={handleChange} className="w-full border-outline-variant rounded-xl py-2 px-3 border bg-surface focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-1">Estado (UF)</label>
                    <input type="text" name="state" value={formData.state || ''} maxLength={2} onChange={handleChange} placeholder="SP" className="w-full border-outline-variant rounded-xl py-2 px-3 border bg-surface focus:ring-2 focus:ring-primary outline-none uppercase" />
                  </div>
                </div>

                {/* ABA FISCAL */}
                <div className={activeTab === 'FISCAL' ? 'md:col-span-2 space-y-6' : 'hidden'}>
                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-start gap-3">
                    <ShieldCheck className="text-primary shrink-0" />
                    <div>
                      <h4 className="font-bold text-primary">Emissão de NFC-e</h4>
                      <p className="text-xs text-on-surface-variant mt-1">Configure os dados abaixo fornecidos pela sua contabilidade. Sem eles, o PDV emitirá apenas controles internos.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-on-surface mb-1">Ambiente da SEFAZ</label>
                      <select name="nfceEnvironment" value={formData.nfceEnvironment || 'HOMOLOGACAO'} onChange={handleChange} className="w-full border-outline-variant rounded-xl py-2 px-3 border bg-surface focus:ring-2 focus:ring-primary outline-none">
                        <option value="HOMOLOGACAO">Homologação (Testes sem valor fiscal)</option>
                        <option value="PRODUCAO">Produção (Com valor fiscal)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-on-surface mb-1">ID do CSC (Token)</label>
                      <input type="text" name="nfceCscId" value={formData.nfceCscId || ''} onChange={handleChange} placeholder="Ex: 000001" className="w-full border-outline-variant rounded-xl py-2 px-3 border bg-surface focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-on-surface mb-1">Código CSC (Alfanumérico)</label>
                      <input type="text" name="nfceCscSecret" value={formData.nfceCscSecret || ''} onChange={handleChange} placeholder="Chave fornecida pela SEFAZ" className="w-full border-outline-variant rounded-xl py-2 px-3 border bg-surface focus:ring-2 focus:ring-primary outline-none" />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-on-surface mb-1">Série da NFC-e</label>
                      <input type="number" name="nfceSeries" value={formData.nfceSeries || 1} onChange={handleChange} className="w-full border-outline-variant rounded-xl py-2 px-3 border bg-surface focus:ring-2 focus:ring-primary outline-none" />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-on-surface mb-1">Próximo Número da Nota</label>
                      <input type="number" name="nfceNextNumber" value={formData.nfceNextNumber || 1} onChange={handleChange} className="w-full border-outline-variant rounded-xl py-2 px-3 border bg-surface focus:ring-2 focus:ring-primary outline-none" />
                    </div>

                    <div className="md:col-span-2 border-t border-outline-variant pt-4 mt-2">
                      <h4 className="font-bold text-on-surface mb-4">Certificado Digital (A1)</h4>
                      
                      <div className="flex flex-col gap-4">
                        <div>
                          <label className="block text-sm font-bold text-on-surface mb-1">Arquivo do Certificado (.pfx / .p12)</label>
                          <div className="flex items-center gap-3">
                            <label className="cursor-pointer bg-surface border border-outline-variant hover:bg-surface-container px-4 py-2 rounded-xl text-sm font-bold text-on-surface-variant transition-colors">
                              Escolher Arquivo
                              <input type="file" accept=".pfx,.p12" className="hidden" onChange={handleFileChange} />
                            </label>
                            <span className="text-sm text-on-surface-variant truncate max-w-[200px]">
                              {certFileName || (formData.nfceCertBase64 ? 'Certificado já carregado' : 'Nenhum arquivo')}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-on-surface mb-1">Senha do Certificado</label>
                          <input type="password" name="nfceCertPassword" value={formData.nfceCertPassword || ''} onChange={handleChange} placeholder="Senha do arquivo A1" className="w-full max-w-sm border-outline-variant rounded-xl py-2 px-3 border bg-surface focus:ring-2 focus:ring-primary outline-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-outline-variant flex justify-end gap-3 bg-surface-container-lowest">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 font-bold text-on-surface-variant hover:bg-surface-variant rounded-xl transition-colors">
                Cancelar
              </button>
              <button type="submit" form="branch-form" className="px-8 py-2.5 bg-primary text-white font-bold rounded-xl shadow-sm hover:bg-primary-hover transition-colors">
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
