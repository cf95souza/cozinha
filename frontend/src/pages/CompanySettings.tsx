import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Building2, Save, MapPin, Settings } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  tradeName?: string;
  document?: string;
  stateRegist?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  currencyCode?: string;
  timezone?: string;
  expirationAlertDays?: number;
  requireReceivingApproval?: boolean;
  defaultExpirationDays?: number;
}

export default function CompanySettings() {
  const [formData, setFormData] = useState<Partial<Company>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'geral' | 'endereco' | 'prefs'>('geral');

  const fetchData = async () => {
    try {
      const { data } = await api.get('/companies');
      setFormData(data);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar dados da empresa.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      finalValue = Number(value);
    }
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const response = await api.put('/companies', formData);
      setFormData(response.data);
      setMessage('Configurações salvas com sucesso!');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-on-surface">Carregando configurações...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-display-sm font-section-title text-on-surface">Configurações da Empresa</h1>
        <p className="text-body text-on-surface-variant mt-1">Gerencie os dados cadastrais e as preferências globais do sistema.</p>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-outline-variant overflow-hidden">
        <div className="flex border-b border-outline-variant bg-surface-container-lowest overflow-x-auto flex-nowrap hide-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('geral')}
            className={`flex-1 shrink-0 whitespace-nowrap py-4 px-6 text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${activeTab === 'geral' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:bg-surface-variant/50'}`}
          >
            <Building2 className="w-5 h-5 shrink-0" /> Dados Cadastrais
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('endereco')}
            className={`flex-1 shrink-0 whitespace-nowrap py-4 px-6 text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${activeTab === 'endereco' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:bg-surface-variant/50'}`}
          >
            <MapPin className="w-5 h-5 shrink-0" /> Endereço
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('prefs')}
            className={`flex-1 shrink-0 whitespace-nowrap py-4 px-6 text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${activeTab === 'prefs' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:bg-surface-variant/50'}`}
          >
            <Settings className="w-5 h-5 shrink-0" /> Preferências
          </button>
        </div>

        <form onSubmit={handleSaveCompany} className="p-6 space-y-6">
          {message && (
            <div className="bg-primary-container text-on-primary-container p-4 rounded-lg font-medium">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-error-container text-on-error-container p-4 rounded-lg font-medium">
              {error}
            </div>
          )}

          {activeTab === 'geral' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              <div className="md:col-span-2">
                <label className="block text-sm font-metadata font-bold text-on-surface uppercase mb-1">Razão Social</label>
                <input required type="text" name="name" value={formData.name || ''} onChange={handleChange} className="w-full border-outline-variant rounded-md py-3 px-4 focus:ring-2 focus:ring-secondary border bg-surface-container-lowest text-on-surface" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-metadata font-bold text-on-surface uppercase mb-1">URL da Logo (Opcional)</label>
                <div className="flex gap-4 items-center">
                  {formData.logoUrl && (
                    <img src={formData.logoUrl} alt="Logo" className="w-12 h-12 rounded-lg object-contain bg-surface-container border border-outline-variant" />
                  )}
                  <input type="text" placeholder="https://exemplo.com/logo.png" name="logoUrl" value={formData.logoUrl || ''} onChange={handleChange} className="flex-1 border-outline-variant rounded-md py-3 px-4 focus:ring-2 focus:ring-secondary border bg-surface-container-lowest text-on-surface" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-metadata font-bold text-on-surface uppercase mb-1">Nome Fantasia</label>
                <input type="text" name="tradeName" value={formData.tradeName || ''} onChange={handleChange} className="w-full border-outline-variant rounded-md py-3 px-4 focus:ring-2 focus:ring-secondary border bg-surface-container-lowest text-on-surface" />
              </div>
              <div>
                <label className="block text-sm font-metadata font-bold text-on-surface uppercase mb-1">CNPJ/CPF</label>
                <input type="text" name="document" value={formData.document || ''} onChange={handleChange} className="w-full border-outline-variant rounded-md py-3 px-4 focus:ring-2 focus:ring-secondary border bg-surface-container-lowest text-on-surface" />
              </div>
              <div>
                <label className="block text-sm font-metadata font-bold text-on-surface uppercase mb-1">Inscrição Estadual</label>
                <input type="text" name="stateRegist" value={formData.stateRegist || ''} onChange={handleChange} className="w-full border-outline-variant rounded-md py-3 px-4 focus:ring-2 focus:ring-secondary border bg-surface-container-lowest text-on-surface" />
              </div>
              <div>
                <label className="block text-sm font-metadata font-bold text-on-surface uppercase mb-1">Telefone</label>
                <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full border-outline-variant rounded-md py-3 px-4 focus:ring-2 focus:ring-secondary border bg-surface-container-lowest text-on-surface" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-metadata font-bold text-on-surface uppercase mb-1">E-mail de Contato</label>
                <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="w-full border-outline-variant rounded-md py-3 px-4 focus:ring-2 focus:ring-secondary border bg-surface-container-lowest text-on-surface" />
              </div>
            </div>
          )}

          {activeTab === 'endereco' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              <div>
                <label className="block text-sm font-metadata font-bold text-on-surface uppercase mb-1">CEP</label>
                <input type="text" name="zipCode" value={formData.zipCode || ''} onChange={handleChange} className="w-full border-outline-variant rounded-md py-3 px-4 focus:ring-2 focus:ring-secondary border bg-surface-container-lowest text-on-surface" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-metadata font-bold text-on-surface uppercase mb-1">Endereço Completo</label>
                <input type="text" name="address" value={formData.address || ''} onChange={handleChange} className="w-full border-outline-variant rounded-md py-3 px-4 focus:ring-2 focus:ring-secondary border bg-surface-container-lowest text-on-surface" />
              </div>
              <div>
                <label className="block text-sm font-metadata font-bold text-on-surface uppercase mb-1">Cidade</label>
                <input type="text" name="city" value={formData.city || ''} onChange={handleChange} className="w-full border-outline-variant rounded-md py-3 px-4 focus:ring-2 focus:ring-secondary border bg-surface-container-lowest text-on-surface" />
              </div>
              <div>
                <label className="block text-sm font-metadata font-bold text-on-surface uppercase mb-1">Estado</label>
                <input type="text" name="state" value={formData.state || ''} onChange={handleChange} className="w-full border-outline-variant rounded-md py-3 px-4 focus:ring-2 focus:ring-secondary border bg-surface-container-lowest text-on-surface" />
              </div>
            </div>
          )}

          {activeTab === 'prefs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              <div>
                <label className="block text-sm font-metadata font-bold text-on-surface uppercase mb-1">Moeda Padrão</label>
                <select name="currencyCode" value={formData.currencyCode || 'BRL'} onChange={handleChange} className="w-full border-outline-variant rounded-md py-3 px-4 focus:ring-2 focus:ring-secondary border bg-surface-container-lowest text-on-surface">
                  <option value="BRL">Real (BRL)</option>
                  <option value="USD">Dólar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-metadata font-bold text-on-surface uppercase mb-1">Fuso Horário</label>
                <select name="timezone" value={formData.timezone || 'America/Sao_Paulo'} onChange={handleChange} className="w-full border-outline-variant rounded-md py-3 px-4 focus:ring-2 focus:ring-secondary border bg-surface-container-lowest text-on-surface">
                  <option value="America/Sao_Paulo">Brasília (BRT)</option>
                  <option value="America/Manaus">Manaus (AMT)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-metadata font-bold text-on-surface uppercase mb-1">Dias Padrão de Validade (Produtos)</label>
                <input type="number" name="defaultExpirationDays" value={formData.defaultExpirationDays || 365} onChange={handleChange} className="w-full border-outline-variant rounded-md py-3 px-4 focus:ring-2 focus:ring-secondary border bg-surface-container-lowest text-on-surface" />
              </div>
              <div>
                <label className="block text-sm font-metadata font-bold text-on-surface uppercase mb-1">Alerta de Vencimento (Dias antes)</label>
                <input type="number" name="expirationAlertDays" value={formData.expirationAlertDays || 7} onChange={handleChange} className="w-full border-outline-variant rounded-md py-3 px-4 focus:ring-2 focus:ring-secondary border bg-surface-container-lowest text-on-surface" />
              </div>
              <div className="md:col-span-2 pt-2">
                <label className="flex items-center gap-3 cursor-pointer p-4 bg-surface-container-lowest border border-outline-variant rounded-lg hover:bg-surface-variant/30 transition-colors">
                  <input type="checkbox" name="requireReceivingApproval" checked={formData.requireReceivingApproval !== false} onChange={handleChange} className="w-5 h-5 text-secondary border-outline-variant rounded focus:ring-secondary" />
                  <div>
                    <div className="font-bold text-on-surface">Exigir conferência no recebimento</div>
                    <div className="text-sm text-on-surface-variant">Notas fiscais recebidas ficarão pendentes até serem validadas manualmente.</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-outline-variant flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-primary text-on-primary px-8 py-3 rounded-md font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 text-lg"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
