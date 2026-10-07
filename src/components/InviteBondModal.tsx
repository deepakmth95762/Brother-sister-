import React, { useState } from 'react';
import { Copy, Check, RefreshCw, Link2, Unlink, ShieldCheck, X, UserPlus } from 'lucide-react';
import { SiblingProfile } from '../types';
import { siblingSync } from '../utils/storage';

interface InviteBondModalProps {
  currentUser: SiblingProfile;
  connectedSibling: SiblingProfile | null;
  allUsers: SiblingProfile[];
  onClose?: () => void;
  onUpdatedUser: (user: SiblingProfile) => void;
}

export const InviteBondModal: React.FC<InviteBondModalProps> = ({
  currentUser,
  connectedSibling,
  allUsers,
  onClose,
  onUpdatedUser,
}) => {
  const [enteredCode, setEnteredCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const otherAvailableSiblings = allUsers.filter((u) => u.id !== currentUser.id);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(currentUser.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateCode = () => {
    setError(null);
    siblingSync.regenerateInviteCode(currentUser.id);
    const updated = siblingSync.getState().users[currentUser.id];
    if (updated) {
      onUpdatedUser(updated);
      setStatusMessage(`New invite code generated: ${updated.inviteCode}`);
    }
  };

  const handleConnectCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);
    if (!enteredCode.trim()) {
      setError('Please enter your Brother or Sister’s unique invite code.');
      return;
    }

    const res = siblingSync.connectBond(currentUser.id, enteredCode.trim());
    if (!res.ok) {
      setError(res.error || 'Invalid invite code.');
    } else {
      const updated = siblingSync.getState().users[currentUser.id];
      if (updated) onUpdatedUser(updated);
      setEnteredCode('');
      setStatusMessage('Connected privately with your sibling!');
    }
  };

  const handleDisconnect = () => {
    setError(null);
    setStatusMessage(null);
    siblingSync.disconnectBond(currentUser.id);
    const updated = siblingSync.getState().users[currentUser.id];
    if (updated) {
      onUpdatedUser(updated);
      setStatusMessage('Sibling connection unlinked. You can reconnect using an invite code.');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-stone-900">
            Sibling Invite Code Pairing
          </h2>
          <p className="text-xs text-stone-600 mt-1">
            Brother &amp; Sister connects strictly one Brother and Sister at a time using a private invite code.
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full text-stone-500 hover:bg-stone-100"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Your Unique Invite Code */}
      <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 space-y-3">
        <div className="flex items-center justify-between text-xs text-stone-600">
          <span className="font-medium">Your Unique Sibling Invite Code</span>
          <span className="capitalize">{currentUser.role} Profile</span>
        </div>

        <div className="flex items-center justify-between gap-2 bg-white px-4 py-3 rounded-xl border border-stone-200">
          <span className="font-mono-code text-xl font-semibold tracking-wider text-stone-900">
            {currentUser.inviteCode}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyCode}
              className="min-h-[38px] px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-medium text-stone-800 flex items-center gap-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleRegenerateCode}
              className="min-h-[38px] px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
              title="Generate a new invite code"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <p className="text-[11px] text-stone-500">
          Share this code privately with your Brother or Sister so they can link directly with you.
        </p>
      </div>

      {/* Current Bond Status */}
      {connectedSibling ? (
        <div className="p-4 rounded-2xl bg-[#EEF6F3] border border-[#2F6F5E]/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#2F6F5E] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Active One-to-One Sibling Bond
            </span>
            <span className="text-xs text-stone-600 font-mono-code">
              {connectedSibling.inviteCode}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={connectedSibling.avatarUrl}
                alt={connectedSibling.name}
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-full object-cover border border-white shadow-xs"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-900 truncate">
                  {connectedSibling.name}
                </p>
                <p className="text-xs text-stone-600 capitalize">
                  Connected {connectedSibling.role} · {connectedSibling.contactValue}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDisconnect}
              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white hover:bg-red-50 text-xs font-medium text-red-700 border border-stone-200 flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>Unlink</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900">
          You are not currently linked to a Brother or Sister. Enter their invite code below to start your private chat.
        </div>
      )}

      {/* Connect Form */}
      <form onSubmit={handleConnectCode} className="space-y-3">
        <label className="block text-xs font-medium text-stone-700">
          Connect Brother or Sister by Invite Code
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={enteredCode}
            onChange={(e) => setEnteredCode(e.target.value.toUpperCase())}
            placeholder="e.g., SIS-3910 or BRO-8492"
            className="flex-1 px-4 py-2.5 text-sm font-mono-code uppercase bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:bg-white focus:border-[#C85A32]"
          />
          <button
            type="submit"
            className="min-h-[44px] px-4 py-2.5 bg-[#C85A32] hover:bg-[#B24C27] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Link2 className="w-4 h-4" />
            <span>Connect Sibling</span>
          </button>
        </div>

        {/* Quick fill available sibling code */}
        {otherAvailableSiblings.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] text-stone-500 flex items-center gap-1">
              <UserPlus className="w-3 h-3" />
              Available Sibling Codes:
            </span>
            {otherAvailableSiblings.map((sib) => (
              <button
                key={sib.id}
                type="button"
                onClick={() => setEnteredCode(sib.inviteCode)}
                className="text-[11px] font-mono-code text-[#C85A32] hover:underline"
              >
                {sib.inviteCode} ({sib.name})
              </button>
            ))}
          </div>
        )}
      </form>

      {statusMessage && (
        <p className="text-xs font-medium text-[#2F6F5E] bg-[#EEF6F3] px-3.5 py-2.5 rounded-xl">
          {statusMessage}
        </p>
      )}
      {error && (
        <p className="text-xs font-medium text-red-600 bg-red-50 px-3.5 py-2.5 rounded-xl">
          {error}
        </p>
      )}
    </div>
  );
};
