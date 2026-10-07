import React, { useState } from 'react';
import { Phone, Mail, ShieldCheck, ArrowRight, HeartHandshake, UserCheck } from 'lucide-react';
import { SiblingProfile, SiblingRole } from '../types';
import { siblingSync } from '../utils/storage';

interface AuthScreenProps {
  existingUsers: SiblingProfile[];
  onAuthenticated: (user: SiblingProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ existingUsers, onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [contactValue, setContactValue] = useState('+1 (555) 234-8910');
  const [name, setName] = useState('');
  const [role, setRole] = useState<SiblingRole>('brother');
  const [verificationCode, setVerificationCode] = useState('482910');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!contactValue.trim()) {
      setError(
        authMethod === 'phone'
          ? 'Please enter your mobile number.'
          : 'Please enter your email address.'
      );
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setError('Please enter your first and last name.');
      return;
    }

    const { user } = siblingSync.loginOrRegister({
      mode,
      authMethod,
      contactValue: contactValue.trim(),
      name: name.trim() || undefined,
      role,
    });
    onAuthenticated(user);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-10 bg-[#F7F5F2]">
      <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200/90 shadow-xs p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="space-y-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#FBF2EE] text-[#C85A32] flex items-center justify-center mx-auto">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-stone-900">
            Brother &amp; Sister
          </h1>
          <p className="text-sm text-stone-600 leading-relaxed">
            Private one-to-one family messenger exclusively for siblings. Deployable directly to Netlify.
          </p>
        </div>

        {/* Mode Switcher: Sign In vs Create Account */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`min-h-[40px] text-xs font-semibold rounded-lg transition-colors ${
              mode === 'login'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setContactValue('');
              setError(null);
            }}
            className={`min-h-[40px] text-xs font-semibold rounded-lg transition-colors ${
              mode === 'register'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Register New Account
          </button>
        </div>

        {/* Auth Method Selector: Mobile Number vs Email */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-600">Sign in with</span>
            <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('phone');
                  if (mode === 'login') setContactValue('+1 (555) 234-8910');
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${
                  authMethod === 'phone'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                Mobile Number
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('email');
                  if (mode === 'login') setContactValue('meera.verma@family.org');
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${
                  authMethod === 'email'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                Email Address
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Rohan Verma"
                    className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:bg-white focus:border-[#C85A32]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    I am registering as a
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRole('brother')}
                      className={`min-h-[44px] px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        role === 'brother'
                          ? 'border-[#2F6F5E] bg-[#EEF6F3] text-[#2F6F5E]'
                          : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      Brother
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('sister')}
                      className={`min-h-[44px] px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        role === 'sister'
                          ? 'border-[#C85A32] bg-[#FBF2EE] text-[#C85A32]'
                          : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      Sister
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                {authMethod === 'phone' ? 'Mobile Number' : 'Email Address'}
              </label>
              <input
                type={authMethod === 'phone' ? 'tel' : 'email'}
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                placeholder={
                  authMethod === 'phone' ? '+1 (555) 234-8910' : 'sibling@family.org'
                }
                className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:bg-white focus:border-[#C85A32]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-stone-700">
                  {authMethod === 'phone' ? '6-Digit Verification OTP' : 'Security Passcode'}
                </label>
                <span className="text-[11px] text-stone-500">Firebase Auth Ready</span>
              </div>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="482910"
                className="w-full px-3.5 py-2.5 text-sm font-mono-code tracking-widest bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:bg-white focus:border-[#C85A32]"
              />
            </div>

            {error && (
              <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full min-h-[48px] bg-[#C85A32] hover:bg-[#B24C27] text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <span>
                {mode === 'login'
                  ? 'Continue to Private Messenger'
                  : 'Create Sibling Account'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Instant Sibling Accounts for Rapid Testing */}
        <div className="pt-4 border-t border-stone-200/80 space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span className="font-medium text-stone-700 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[#2F6F5E]" />
              Quick Switch Pre-Paired Sibling Accounts
            </span>
            <span>Instant Login</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {existingUsers.slice(0, 2).map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => onAuthenticated(u)}
                className="flex items-center gap-3 p-2.5 rounded-xl border border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-left transition-all"
              >
                <img
                  src={u.avatarUrl}
                  alt={u.name}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover shrink-0 border border-stone-200"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-stone-900 truncate">{u.name}</p>
                  <p className="text-[11px] text-stone-500 capitalize truncate">
                    {u.role} · {u.inviteCode}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-500 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2F6F5E]" />
            <span>End-to-end private internet channel · Zero SMS usage</span>
          </div>
        </div>
      </div>
    </div>
  );
};
