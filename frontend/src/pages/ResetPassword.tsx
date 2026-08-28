import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { api } from '../lib/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest">
        <div className="bg-surface p-8 rounded-2xl border border-outline-variant shadow-sm max-w-sm w-full text-center">
          <span className="material-symbols-outlined notranslate text-error text-5xl mb-4">error</span>
          <h2 className="text-xl font-bold text-on-surface mb-2">Token ausente</h2>
          <p className="text-on-surface-variant text-sm mb-6">O link de recuperação de senha está inválido ou incompleto.</p>
          <Link to="/login" className="px-5 py-2.5 bg-primary text-on-primary font-bold rounded-xl inline-block hover:bg-primary-hover">
            Voltar ao Login
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao redefinir a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center p-4 font-body">
      <div className="bg-surface p-8 rounded-2xl border border-outline-variant shadow-xl max-w-md w-full">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-container text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined notranslate text-3xl">lock_reset</span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface">Criar Nova Senha</h1>
          <p className="text-sm text-on-surface-variant mt-2">Digite sua nova senha abaixo para restaurar o acesso à sua conta.</p>
        </div>

        {success ? (
          <div className="text-center">
            <div className="bg-[#E6F4EA] border-l-4 border-[#34A853] p-4 mb-6 rounded-xl text-left">
              <p className="text-sm font-medium text-[#137333]">Sua senha foi redefinida com sucesso!</p>
            </div>
            <Link to="/login" className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-full shadow-sm font-bold text-on-primary bg-primary hover:bg-primary-hover transition-colors">
              Fazer Login Agora
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-error-container border-l-4 border-error p-4 rounded-xl">
                <p className="text-sm font-medium text-on-error-container">{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-on-surface">Nova Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-full focus:ring-2 focus:ring-primary/20 outline-none text-on-surface text-sm"
                  placeholder="No mínimo 6 caracteres"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-on-surface">Confirmar Nova Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-full focus:ring-2 focus:ring-primary/20 outline-none text-on-surface text-sm"
                  placeholder="Repita a nova senha"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-full shadow-sm font-bold text-on-primary bg-primary hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar Nova Senha'}
              </button>
            </div>
            
            <div className="text-center mt-4">
              <Link to="/login" className="text-sm font-semibold text-on-surface-variant hover:text-on-surface">
                Cancelar e voltar ao login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
