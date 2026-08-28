import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Lock, Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      login(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao conectar no servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccessMsg('Se o e-mail existir em nossa base, as instruções de recuperação foram enviadas (verifique o console do backend no ambiente de desenvolvimento).');
    } catch (err: any) {
      setError('Erro ao solicitar recuperação de senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest flex font-body text-on-background">
      {/* Left Panel - Branding/Welcome (hidden on small screens) */}
      <div className="hidden lg:flex lg:w-[55%] bg-primary relative overflow-hidden flex-col justify-center px-16">
        
        {/* Abstract background shapes matching the mockup style but with our identity */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <svg className="absolute w-[200%] h-[200%] top-[-50%] left-[-50%] animate-[spin_120s_linear_infinite]" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,50 Q25,25 50,50 T100,50" stroke="white" strokeWidth="0.2" fill="none" opacity="0.5"/>
            <path d="M0,60 Q30,10 60,60 T100,60" stroke="white" strokeWidth="0.1" fill="none" opacity="0.3"/>
            <circle cx="20" cy="20" r="1" stroke="white" strokeWidth="0.5" fill="none" />
            <circle cx="80" cy="80" r="2" stroke="white" strokeWidth="0.2" fill="none" />
            {/* Topography lines simulation */}
            <path d="M -20,20 Q 30,80 80,10" stroke="white" strokeWidth="0.15" fill="none" />
            <path d="M -20,25 Q 30,85 80,15" stroke="white" strokeWidth="0.15" fill="none" />
            <path d="M -20,30 Q 30,90 80,20" stroke="white" strokeWidth="0.15" fill="none" />
            <path d="M 40,110 Q 80,60 120,100" stroke="white" strokeWidth="0.15" fill="none" />
            <path d="M 45,115 Q 85,65 125,105" stroke="white" strokeWidth="0.15" fill="none" />
          </svg>
          
          {/* Plus signs and dots */}
          <div className="absolute top-1/4 left-1/4 text-white text-2xl font-light opacity-50">+</div>
          <div className="absolute bottom-1/4 left-1/3 text-white text-2xl font-light opacity-50">+</div>
          <div className="absolute top-12 right-12 flex gap-1 flex-wrap w-8 opacity-40">
             {[...Array(20)].map((_, i) => (
               <div key={i} className="w-1 h-1 bg-white rounded-full m-[1px]"></div>
             ))}
          </div>
        </div>

        {/* Diagonal cut separator on the right side */}
        <div className="absolute top-0 right-[-5%] w-[10%] h-full bg-surface-container-lowest skew-x-[-5deg]"></div>
        
        <div className="relative z-10 text-on-primary max-w-lg mb-12">
          <h1 className="text-display-lg font-section-title mb-4 leading-tight">
            Bem-vindo ao COZINHA+
          </h1>
          <p className="text-body opacity-90 text-lg">
            Sua operação centralizada. Acesse sua conta para rastrear lotes, gerenciar validades e auditar seu estoque com precisão absoluta.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center px-6 sm:px-12 lg:px-20 relative bg-surface-container-lowest">
        
        <div className="absolute top-8 right-8 flex gap-4 opacity-50">
          <div className="text-[10px] font-metadata uppercase border border-dashed border-outline-variant p-2 text-on-surface-variant rounded flex items-center gap-2">
            <span className="material-symbols-outlined notranslate text-sm">image</span>
            Logo Restaurante
          </div>
          <div className="text-[10px] font-metadata uppercase border border-dashed border-outline-variant p-2 text-on-surface-variant rounded flex items-center gap-2">
            <span className="material-symbols-outlined notranslate text-sm">image</span>
            Logo Sistema
          </div>
        </div>

        <div className="w-full max-w-sm mx-auto lg:mx-0 pt-16">
          <img src="/logo.png" alt="COZINHA+ Logo" className="h-12 w-auto object-contain mb-8 lg:hidden" />
          
          {!isForgotPassword ? (
            <>
              <h2 className="text-display-lg font-section-title text-primary mb-2">Entrar</h2>
              <p className="text-body text-on-surface-variant mb-10">Insira suas credenciais para acessar a plataforma.</p>

              <form className="space-y-stack-md" onSubmit={handleLogin}>
                {error && (
                  <div className="bg-error-container border-l-4 border-error p-4 mb-4 rounded-r-md">
                    <p className="text-sm font-medium text-on-error-container">{error}</p>
                  </div>
                )}
                
                <div>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-outline" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3.5 text-body border-outline-variant rounded-full focus:ring-2 focus:ring-secondary focus:border-secondary border bg-surface-container-lowest text-on-surface transition-all placeholder:text-outline"
                      placeholder="Nome de usuário ou e-mail"
                    />
                  </div>
                </div>

                <div>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-outline" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3.5 text-body border-outline-variant rounded-full focus:ring-2 focus:ring-secondary focus:border-secondary border bg-surface-container-lowest text-on-surface transition-all placeholder:text-outline"
                      placeholder="Sua senha secreta"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between pb-4">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-secondary focus:ring-secondary border-outline-variant rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-on-surface-variant">
                      Lembrar-me
                    </label>
                  </div>
                  
                  <div className="text-sm">
                    <button 
                      type="button" 
                      onClick={() => { setIsForgotPassword(true); setError(''); setSuccessMsg(''); }}
                      className="font-medium text-on-surface-variant hover:text-secondary transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-full shadow-sm text-body font-bold text-on-secondary bg-secondary hover:bg-on-secondary-fixed-variant focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:opacity-50 transition-all hover:shadow-md"
                  >
                    {loading ? 'Autenticando...' : 'Entrar no Sistema'}
                  </button>
                </div>
                
                <div className="mt-6 text-center text-sm">
                   <span className="text-on-surface-variant">Novo por aqui? </span>
                   <a href="#" className="font-medium text-secondary hover:text-on-secondary-fixed-variant transition-colors">Solicite uma conta</a>
                </div>
              </form>
            </>
          ) : (
            <>
              <button 
                type="button" 
                onClick={() => { setIsForgotPassword(false); setError(''); setSuccessMsg(''); }}
                className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface mb-6 transition-colors font-semibold"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar ao Login
              </button>
              
              <h2 className="text-display-lg font-section-title text-primary mb-2">Recuperar Senha</h2>
              <p className="text-body text-on-surface-variant mb-10">Informe seu e-mail abaixo. Se você tiver uma conta, enviaremos as instruções.</p>

              <form className="space-y-stack-md" onSubmit={handleForgotPassword}>
                {error && (
                  <div className="bg-error-container border-l-4 border-error p-4 mb-4 rounded-r-md">
                    <p className="text-sm font-medium text-on-error-container">{error}</p>
                  </div>
                )}
                {successMsg && (
                  <div className="bg-[#E6F4EA] border-l-4 border-[#34A853] p-4 mb-4 rounded-r-md">
                    <p className="text-sm font-medium text-[#137333]">{successMsg}</p>
                  </div>
                )}
                
                <div>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-outline" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3.5 text-body border-outline-variant rounded-full focus:ring-2 focus:ring-secondary focus:border-secondary border bg-surface-container-lowest text-on-surface transition-all placeholder:text-outline"
                      placeholder="Seu e-mail de cadastro"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading || !!successMsg}
                    className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-full shadow-sm text-body font-bold text-on-secondary bg-secondary hover:bg-on-secondary-fixed-variant focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:opacity-50 transition-all hover:shadow-md"
                  >
                    {loading ? 'Enviando...' : 'Solicitar Recuperação'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
