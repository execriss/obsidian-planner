import { useState } from 'react';
import { Calendar, Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import styles from './AuthGate.module.css';

export default function AuthGate() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode]         = useState('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const handleEmail = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await signInWithEmail(email, password);
        if (error) setError(error.message);
      } else {
        const { error } = await signUpWithEmail(email, password);
        if (error) setError(error.message);
        else setSuccess('Cuenta creada. Revisá tu email para confirmar.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(''); setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.ambientGlow} />
      <div className={styles.decorativeGrid} />

      <div className={styles.wrapper}>
        {/* Logo */}
        <div className={styles.logoSection}>
          <div className={styles.logoIcon}>
            <Calendar size={24} color="var(--obsidian)" />
          </div>
          <div className={styles.title}>Obsidian Planner</div>
          <div className={styles.subtitle}>
            {mode === 'login' ? 'Iniciá sesión para continuar' : 'Creá tu cuenta'}
          </div>
        </div>

        {/* Card */}
        <div className={styles.card}>
          {/* Google */}
          <button onClick={handleGoogle} disabled={loading} className={styles.googleBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          {/* Divider */}
          <div className={styles.divider}>
            <div className={styles.dividerLine} />
            <span className={styles.dividerText}>o</span>
            <div className={styles.dividerLine} />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmail} className={styles.form}>
            <div className={styles.inputWrap}>
              <Mail size={14} className={styles.inputIcon} />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Email" required className={styles.inputEmail}
              />
            </div>

            <div className={styles.inputWrap}>
              <Lock size={14} className={styles.inputIcon} />
              <input
                type={showPass ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Contraseña" required className={styles.inputPassword}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className={styles.togglePassBtn}>
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {error   && <div className={styles.alertError}>{error}</div>}
            {success && <div className={styles.alertSuccess}>{success}</div>}

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Cargando...' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              {!loading && <ArrowRight size={14} />}
            </button>
          </form>

          {/* Toggle */}
          <div className={styles.toggleSection}>
            {mode === 'login' ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}
            {' '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); }}
              className={styles.toggleBtn}
            >
              {mode === 'login' ? 'Registrate' : 'Iniciá sesión'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <Sparkles size={10} color="var(--amber)" />
          <span className={styles.footerText}>Tu planner personal, siempre seguro</span>
        </div>
      </div>
    </div>
  );
}
