import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Button from '../components/common/Button';
import { KeyIcon, ShieldCheckIcon, LockClosedIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import { showToast } from '../utils/toast';

export default function Login() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passkeyActive, setPasskeyActive] = useState(false);
  const { login, loginWithPasskey, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login({ email, password });
    if (success) {
      showToast(t('Welcome, Procurement Officer'));
      navigate('/dashboard');
    } else {
      showToast(t('Authentication failed. Please verify your credentials.'));
    }
  };

  const handlePasskeyAuth = async () => {
    setPasskeyActive(true);
    showToast(t('Initiating FIDO2 / WebAuthn Hardware Passkey handshake...'));
    
    const result = await loginWithPasskey();
    setPasskeyActive(false);

    if (result.success) {
      showToast(t('Authenticated via NIC FIDO2 Security Key'));
      navigate('/dashboard');
    } else {
      showToast(t('Passkey authentication cancelled or timed out.'));
    }
  };

  const fillDemoOfficer = () => {
    setEmail('officer.verma@cpcl.gov.in');
    setPassword('GovCPCL@2026');
    showToast(t('Demo CPCL Officer credentials loaded'));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-64 bg-navy dark:bg-slate-950 z-0 border-b border-navy-light/40 dark:border-slate-800"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center mb-5">
          <img
            src="/bidkendra-logo.jpg"
            alt="Bidकेन्द्र"
            className="w-20 h-20 rounded-2xl object-cover shadow-2xl border-2 border-emerald-500/40"
          />
        </div>
        <h2 className="mt-1 text-center text-3xl font-bold tracking-tight text-white notranslate" translate="no">
          <span className="font-serif">Bid</span><span style={{ color: '#E07B39' }} className="font-serif">केन्द्र</span>
        </h2>
        <p className="mt-1 text-center text-xs italic text-slate-300">{t('from finding to filing')}</p>
        <p className="mt-1.5 text-center text-xs font-semibold uppercase tracking-wider text-saffron">
          {t('Ministry of Petroleum & Natural Gas / CPCL')}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white dark:bg-slate-800 py-8 px-5 shadow-2xl border border-slate-200 dark:border-slate-700 sm:rounded-2xl sm:px-8 transition-colors">
          
          {/* Official Passkey / FIDO2 Quick Action */}
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <KeyIcon className="w-5 h-5 text-saffron" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                {t('Government Official Passkey')}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              {t('One-touch biometric login via NIC Digital Identity / Hardware Security Key (FIDO2 / WebAuthn).')}
            </p>
            <button
              type="button"
              onClick={handlePasskeyAuth}
              disabled={loading || passkeyActive}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg bg-navy dark:bg-saffron text-white dark:text-slate-950 font-semibold text-xs shadow-md hover:bg-navy-light dark:hover:bg-saffron-dark transition-all disabled:opacity-50"
            >
              <ShieldCheckIcon className="w-4 h-4 text-saffron dark:text-slate-950" />
              <span>{passkeyActive ? t('Verifying Hardware Key...') : t('Sign In with Official Passkey')}</span>
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-800 px-2 text-slate-400 font-medium">{t('Or Password Login')}</span>
            </div>
          </div>

          {/* Standard Password Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('Official Email / Government ID')}
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer.name@cpcl.gov.in"
                className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 py-2 px-3 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 placeholder:text-slate-400 text-xs focus:ring-2 focus:ring-navy dark:focus:ring-saffron focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('Password')}
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 py-2 px-3 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 placeholder:text-slate-400 text-xs focus:ring-2 focus:ring-navy dark:focus:ring-saffron focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={fillDemoOfficer}
                className="text-navy dark:text-saffron font-medium hover:underline flex items-center gap-1"
              >
                <CheckBadgeIcon className="w-3.5 h-3.5" />
                {t('Fill Demo Credentials')}
              </button>

              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); showToast(t('Password reset link dispatched via NIC Mail.')); }}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                {t('Forgot Password?')}
              </a>
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full justify-center text-xs py-2.5" disabled={loading}>
                <LockClosedIcon className="w-4 h-4 mr-1.5" />
                {loading ? t('Authenticating...') : t('Sign In with Password')}
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60 text-center text-[11px] text-slate-400">
            <p>{t('Protected by Government Identity Access Management (GeM & NIC)')}</p>
          </div>
        </div>

        {/* Vendor Suvidha Access Banner */}
        <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 rounded-2xl text-center shadow-md">
          <p className="text-xs text-emerald-800 dark:text-emerald-200 font-semibold">
            {t('Are you a Bidder or MSME Vendor?')}
          </p>
          <button
            type="button"
            onClick={() => navigate('/vendor')}
            className="mt-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline inline-flex items-center gap-1.5 transition-colors"
          >
            <span>{t('Access CPCL Vendor Suvidha Self-Verification Portal')}</span> →
          </button>
        </div>
      </div>
    </div>
  );
}