import React, { useState } from 'react';
import { Shield, Lock, Mail, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('investigator@chaintrace.local');
  const [password, setPassword] = useState('Thupparivalan@2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await api.login({ email, password });
      localStorage.setItem('thupparivalan_token', data.access_token);
      localStorage.setItem('thupparivalan_user', JSON.stringify(data.user));
      onLoginSuccess(data.user, data.access_token);
    } catch (err: any) {
      setError(err.message || 'Invalid investigator credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setEmail('investigator@chaintrace.local');
    setPassword('Thupparivalan@2026');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="p-8 text-center border-b border-slate-100 bg-gradient-to-b from-white to-slate-50/50">
          <div className="w-16 h-16 mx-auto mb-3 p-2 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center">
            <img src="/logo.svg" alt="Thupparivalan" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#004E9B]">
            THUPPARIVALAN
          </h1>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-0.5">
            Criminal Investigation Intelligence Platform
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center space-x-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Investigator Identifier / Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0091B9]"
                placeholder="investigator@chaintrace.local"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Encrypted Access Key / Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0091B9]"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#0091B9] hover:bg-[#007f9f] text-white text-xs font-bold shadow-sm transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
              <span>Authenticate Investigator Session</span>
            </button>
          </div>

          {/* Quick Demo Credentials Shortcut */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-500 mb-2">Demonstration Account Credentials:</p>
            <button
              type="button"
              onClick={handleQuickDemo}
              className="text-xs font-semibold text-[#004E9B] hover:underline bg-[#BAE4F0]/40 px-3 py-1.5 rounded-lg border border-[#BAE4F0] transition-colors"
            >
              Load: investigator@chaintrace.local
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
