import React, { useState } from 'react';
import { X, Check, Copy, ExternalLink, Globe, ShieldCheck, Terminal, Layers } from 'lucide-react';

interface NetlifyDeployModalProps {
  onClose: () => void;
}

export const NetlifyDeployModal: React.FC<NetlifyDeployModalProps> = ({ onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const netlifyTomlSnippet = `[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200`;

  const cliSnippet = `npm run build
npx netlify deploy --prod --dir=dist`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-[#FAF8F5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00C7B7]/15 text-[#008F83] flex items-center justify-center font-bold">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-stone-900">
                Netlify Deployment Ready
              </h2>
              <p className="text-xs text-stone-600">
                Single-page application configured with <code className="font-mono text-[11px] bg-stone-200/70 px-1 py-0.5 rounded">dist/</code> build and SPA redirects
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full text-stone-500 hover:bg-stone-200/60"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick configuration specs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
              <p className="text-[11px] font-medium text-stone-500">Build Command</p>
              <p className="text-sm font-semibold text-stone-900 font-mono mt-1">npm run build</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
              <p className="text-[11px] font-medium text-stone-500">Publish Directory</p>
              <p className="text-sm font-semibold text-stone-900 font-mono mt-1">dist</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
              <p className="text-[11px] font-medium text-stone-500">SPA Redirects</p>
              <p className="text-sm font-semibold text-emerald-700 font-mono mt-1">/* → 200 OK</p>
            </div>
          </div>

          {/* Deployment Methods */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              3 Ways to Deploy to Netlify
            </h3>

            {/* Option 1: Git continuous deployment */}
            <div className="p-4 rounded-2xl border border-stone-200 hover:border-stone-300 transition-colors space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#C85A32]" />
                  Option 1: Git Repository (Recommended)
                </span>
                <span className="text-xs text-emerald-700 font-medium">Automatic CI/CD</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Push your code to GitHub or GitLab, link the repository in your Netlify dashboard. Netlify will auto-detect Vite, execute <code className="font-mono bg-stone-100 px-1 rounded">npm run build</code>, and publish the <code className="font-mono bg-stone-100 px-1 rounded">dist</code> folder on every push.
              </p>
            </div>

            {/* Option 2: Netlify CLI */}
            <div className="p-4 rounded-2xl border border-stone-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-stone-700" />
                  Option 2: Netlify CLI Deploy
                </span>
                <button
                  type="button"
                  onClick={() => copyText(cliSnippet, 'cli')}
                  className="px-2.5 py-1 text-xs rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 flex items-center gap-1"
                >
                  {copiedSection === 'cli' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Commands</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 bg-stone-950 text-stone-100 text-xs font-mono rounded-xl overflow-x-auto">
                <code>{cliSnippet}</code>
              </pre>
            </div>

            {/* Config file */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-800">
                  Included <code className="font-mono">netlify.toml</code> File
                </span>
                <button
                  type="button"
                  onClick={() => copyText(netlifyTomlSnippet, 'toml')}
                  className="px-2.5 py-1 text-xs rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-800 flex items-center gap-1"
                >
                  {copiedSection === 'toml' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 bg-stone-900 text-stone-200 text-xs font-mono rounded-xl overflow-x-auto">
                <code>{netlifyTomlSnippet}</code>
              </pre>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#EEF6F3] border border-[#2F6F5E]/20 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#2F6F5E] shrink-0 mt-0.5" />
            <div className="text-xs text-stone-700 space-y-1">
              <p className="font-semibold text-stone-900">
                100% Static Jamstack &amp; Real-Time Cross-Tab Sync
              </p>
              <p className="text-stone-600 leading-relaxed">
                This version runs as a pure client-side SPA with <code className="font-mono">BroadcastChannel</code> and <code className="font-mono">localStorage</code> persistence. You can open Brother in one tab/browser and Sister in another, and messages sync instantly without needing an external custom Node.js server!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#FAF8F5] border-t border-stone-200 flex items-center justify-between">
          <a
            href="https://app.netlify.com/drop"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-[#008F83] hover:underline flex items-center gap-1"
          >
            <span>Netlify Drop Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold"
          >
            Got It, Close
          </button>
        </div>
      </div>
    </div>
  );
};
