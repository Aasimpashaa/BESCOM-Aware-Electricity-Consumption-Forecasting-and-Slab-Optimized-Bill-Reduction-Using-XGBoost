import { useState } from 'react';
import { Zap, Eye, EyeOff, Mail, Lock, User, ArrowRight, Moon, Sun } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { LanguageToggle } from './LanguageToggle';

interface LoginPageProps {
  onLogin: (email: string, name: string) => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

export function LoginPage({ onLogin, darkMode, onToggleDark }: LoginPageProps) {
  const { t } = useLang();
  const [mode, setMode]               = useState<'login' | 'signup'>('login');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [name, setName]               = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors]           = useState<Record<string, string>>({});
  const [loading, setLoading]         = useState(false);
  const [submitted, setSubmitted]     = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email)    e.email    = t.emailRequired;
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = t.emailInvalid;
    if (!password) e.password = t.passwordRequired;
    else if (password.length < 6) e.password = t.passwordShort;
    if (mode === 'signup') {
      if (!name) e.name = t.nameRequired;
      if (!confirmPass) e.confirmPass = t.confirmRequired;
      else if (confirmPass !== password) e.confirmPass = t.passwordMismatch;
    }
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setTimeout(() => onLogin(email, mode === 'signup' ? name : email.split('@')[0]), 700);
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSubmit(); };

  return (
    <div className="min-h-screen animated-gradient flex flex-col transition-colors duration-500 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{animationDelay:'0s'}} />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl animate-float" style={{animationDelay:'1.5s'}} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-float" style={{animationDelay:'3s'}} />

      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <LanguageToggle />
        <button onClick={onToggleDark} className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur transition-all hover:scale-110 duration-200">
          {darkMode ? <Sun className="w-5 h-5 text-yellow-300" /> : <Moon className="w-5 h-5 text-white" />}
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur rounded-3xl mb-4 shadow-2xl animate-pulse-glow border border-white/30">
              <Zap className="w-10 h-10 text-yellow-300 icon-glow-orange" />
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight" style={{textShadow:'0 2px 20px rgba(0,0,0,0.3)'}}>BESCOM Optimizer</h1>
            <p className="text-blue-100 mt-2 text-sm font-medium">{t.appSubtitle}</p>
          </div>

          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 dark:border-gray-700/50">
            <div className="flex">
              {(['login', 'signup'] as const).map(tab => (
                <button key={tab} onClick={() => { setMode(tab); setErrors({}); }}
                  className={`flex-1 py-4 text-sm font-semibold transition-all duration-300 ${
                    mode === tab
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                      : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-gray-600'
                  }`}>
                  {tab === 'login' ? t.signIn : t.createAccount}
                </button>
              ))}
            </div>

            <div className="p-6 sm:p-8 space-y-4">
              {submitted ? (
                <div className="flex flex-col items-center py-6">
                  <div className="w-14 h-14 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {mode === 'login' ? t.welcomeBack : t.accountCreated}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t.redirecting}</p>
                </div>
              ) : (
                <>
                  {mode === 'signup' && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 tracking-wide">{t.fullName}</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" value={name} onChange={e => setName(e.target.value)} onKeyDown={handleKeyDown}
                          placeholder={t.namePlaceholder}
                          className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm bg-gray-50 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`} />
                      </div>
                      {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 tracking-wide">{t.emailAddress}</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKeyDown}
                        placeholder={t.emailPlaceholder}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm bg-gray-50 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`} />
                    </div>
                    {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 tracking-wide">{t.password}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown}
                        placeholder={t.passwordPlaceholder}
                        className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm bg-gray-50 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`} />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                  </div>

                  {mode === 'signup' && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 tracking-wide">{t.confirmPassword}</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type={showConfirm ? 'text' : 'password'} value={confirmPass} onChange={e => setConfirmPass(e.target.value)} onKeyDown={handleKeyDown}
                          placeholder={t.confirmPlaceholder}
                          className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm bg-gray-50 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.confirmPass ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`} />
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.confirmPass && <p className="text-xs text-red-500">{errors.confirmPass}</p>}
                    </div>
                  )}

                  {mode === 'login' && (
                    <div className="text-right">
                      <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">{t.forgotPassword}</button>
                    </div>
                  )}

                  <button onClick={handleSubmit} disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-400 disabled:to-indigo-400 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all mt-2 shadow-lg hover:shadow-blue-500/40 hover:-translate-y-0.5 ripple-effect">
                    {loading ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {mode === 'login' ? t.signingIn : t.creatingAccount}</>
                    ) : (
                      <>{mode === 'login' ? t.signIn : t.createAccount}<ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>

                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-600" /></div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white dark:bg-gray-800 px-3 text-gray-400">
                        {mode === 'login' ? t.noAccount : t.hasAccount}
                      </span>
                    </div>
                  </div>

                  <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErrors({}); }}
                    className="w-full py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    {mode === 'login' ? t.createNew : t.signInInstead}
                  </button>
                </>
              )}
            </div>
          </div>
          <p className="text-center text-blue-200/80 dark:text-gray-500 text-xs mt-6 animate-fade-in" style={{animationDelay:'0.6s'}}>{t.footer}</p>
        </div>
      </div>
    </div>
  );
}
