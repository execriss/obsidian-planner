import { useState } from 'react';
import { Calendar, Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function AuthGate() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode]         = useState('login');   // 'login' | 'register'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const handleEmail = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
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
    setError('');
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', width: '100vw',
      background: 'var(--obsidian)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 60% 60% at 30% 40%, rgba(240,165,0,0.06) 0%, transparent 60%),
          radial-gradient(ellipse 50% 50% at 75% 65%, rgba(107,143,212,0.05) 0%, transparent 60%)
        `,
      }} />

      {/* Decorative grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
        opacity: 0.3,
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 80%)',
      }} />

      <div style={{
        width: '100%', maxWidth: '420px',
        padding: '0 24px',
        animation: 'springIn 0.5s var(--ease-spring) both',
        position: 'relative', zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--amber), var(--amber-dim))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 0 40px rgba(240,165,0,0.25)',
            animation: 'float 3.5s ease-in-out infinite',
          }}>
            <Calendar size={24} color="var(--obsidian)" />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700, color: 'var(--cream)', letterSpacing: '-0.02em', lineHeight: 1 }}>
            Obsidian Planner
          </div>
          <div style={{ fontSize: '12px', color: 'var(--cream-muted)', marginTop: '8px', letterSpacing: '0.08em' }}>
            {mode === 'login' ? 'Iniciá sesión para continuar' : 'Creá tu cuenta'}
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--obsidian-2)',
          border: '1px solid var(--border-light)',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
        }}>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            style={{
              width: '100%', padding: '12px',
              borderRadius: '12px',
              border: '1px solid var(--border-light)',
              background: 'var(--obsidian-3)',
              color: 'var(--cream)',
              fontSize: '13px', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              transition: 'all 0.2s var(--ease-spring)',
              marginBottom: '20px',
              opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--obsidian-4)'; e.currentTarget.style.transform = 'scale(1.01)'; e.currentTarget.style.borderColor = 'var(--border-light)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--obsidian-3)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {/* Google icon */}
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ fontSize: '10px', color: 'var(--cream-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>o</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmail} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <Mail size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--cream-muted)', pointerEvents: 'none' }} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
                required
                style={{ ...inputSt, paddingLeft: '36px' }}
                onFocus={e => e.target.style.borderColor = 'var(--amber-dim)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-light)'}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <Lock size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--cream-muted)', pointerEvents: 'none' }} />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Contraseña"
                required
                style={{ ...inputSt, paddingLeft: '36px', paddingRight: '36px' }}
                onFocus={e => e.target.style.borderColor = 'var(--amber-dim)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-light)'}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--cream-muted)', transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--cream)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--cream-muted)'}
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {error && (
              <div style={{
                padding: '10px 12px', borderRadius: '9px',
                background: 'var(--coral-dim)', border: '1px solid var(--coral)44',
                fontSize: '12px', color: 'var(--coral)',
                animation: 'fadeUp 0.2s ease',
              }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{
                padding: '10px 12px', borderRadius: '9px',
                background: 'var(--sage-dim)', border: '1px solid var(--sage)44',
                fontSize: '12px', color: 'var(--sage)',
                animation: 'fadeUp 0.2s ease',
              }}>
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', marginTop: '4px', padding: '12px',
                borderRadius: '12px',
                background: 'var(--amber)',
                color: 'var(--obsidian)',
                fontSize: '13px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.2s var(--ease-spring)',
                opacity: loading ? 0.7 : 1,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(240,165,0,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
            >
              {loading ? 'Cargando...' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              {!loading && <ArrowRight size={14} />}
            </button>
          </form>

          {/* Toggle */}
          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--cream-muted)' }}>
            {mode === 'login' ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}
            {' '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); }}
              style={{
                color: 'var(--amber)', fontWeight: 600, fontSize: '12px',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              {mode === 'login' ? 'Registrate' : 'Iniciá sesión'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center', marginTop: '20px',
          fontSize: '11px', color: 'var(--cream-muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
        }}>
          <Sparkles size={10} color="var(--amber)" />
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
            Tu planner personal, siempre seguro
          </span>
        </div>
      </div>
    </div>
  );
}

const inputSt = {
  width: '100%',
  background: 'var(--obsidian-3)',
  border: '1px solid var(--border-light)',
  borderRadius: '10px',
  padding: '11px 14px',
  fontSize: '13px',
  color: 'var(--cream)',
  outline: 'none',
  transition: 'border-color 0.2s ease',
  display: 'block',
};
