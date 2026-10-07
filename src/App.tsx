import React, { useEffect, useState } from 'react';
import {
  Smartphone,
  Columns2,
  Code2,
  ShieldCheck,
  BellRing,
  CheckCheck,
  Wifi,
  Camera,
  KeyRound,
  ArrowLeftRight,
  Globe,
} from 'lucide-react';
import { AppState, MessageStatus, PushNotificationEvent, SiblingProfile } from './types';
import { SiblingPhoneView } from './components/SiblingPhoneView';
import { AuthScreen } from './components/AuthScreen';
import { FirebaseAndroidBlueprintModal } from './components/FirebaseAndroidBlueprintModal';
import { NetlifyDeployModal } from './components/NetlifyDeployModal';
import { playNotificationChime } from './utils/sound';
import { siblingSync } from './utils/storage';

export function App() {
  const [appState, setAppState] = useState<AppState>(() => siblingSync.getState());
  const [activeUserId, setActiveUserId] = useState<string | null>('user_brother');
  const [layoutMode, setLayoutMode] = useState<'single' | 'dual'>('single');
  const [showAuthScreen, setShowAuthScreen] = useState(false);
  const [showBlueprintModal, setShowBlueprintModal] = useState(false);
  const [showNetlifyModal, setShowNetlifyModal] = useState(false);
  const [latestNotification, setLatestNotification] = useState<PushNotificationEvent | null>(null);

  useEffect(() => {
    const unsubState = siblingSync.subscribe((next) => {
      setAppState(next);
    });

    const unsubNotif = siblingSync.subscribeNotification((notif) => {
      setLatestNotification(notif);
      playNotificationChime();

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notif.title, {
          body: notif.body,
        });
      }
    });

    return () => {
      unsubState();
      unsubNotif();
    };
  }, []);

  const allUsersList = Object.values(appState.users);
  const currentUser: SiblingProfile | null = activeUserId
    ? appState.users[activeUserId] || allUsersList[0] || null
    : null;
  const connectedSibling =
    currentUser && currentUser.connectedSiblingId
      ? appState.users[currentUser.connectedSiblingId] || null
      : null;

  const brotherUser =
    allUsersList.find((u) => u.role === 'brother') || allUsersList[0] || null;
  const sisterUser =
    allUsersList.find((u) => u.role === 'sister') || allUsersList[1] || null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5F2] text-stone-900">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 bg-white/95 backdrop-blur-md border-b border-stone-200/90">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setShowAuthScreen(false);
          }}
          className="font-display text-lg font-semibold tracking-tight text-stone-900 whitespace-nowrap"
        >
          Brother &amp; Sister
        </a>

        {/* Zone 2: Clean navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
          <button
            type="button"
            onClick={() => {
              setShowAuthScreen(false);
              setLayoutMode('single');
            }}
            className={`hover:text-stone-900 transition-colors whitespace-nowrap ${
              !showAuthScreen && layoutMode === 'single'
                ? 'text-stone-900 underline underline-offset-8 decoration-[#C85A32] decoration-2'
                : ''
            }`}
          >
            Single Device View
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAuthScreen(false);
              setLayoutMode('dual');
            }}
            className={`hover:text-stone-900 transition-colors whitespace-nowrap ${
              !showAuthScreen && layoutMode === 'dual'
                ? 'text-stone-900 underline underline-offset-8 decoration-[#C85A32] decoration-2'
                : ''
            }`}
          >
            Dual Sibling Split View
          </button>
          <button
            type="button"
            onClick={() => setShowAuthScreen(true)}
            className={`hover:text-stone-900 transition-colors whitespace-nowrap ${
              showAuthScreen
                ? 'text-stone-900 underline underline-offset-8 decoration-[#C85A32] decoration-2'
                : ''
            }`}
          >
            Sign In / Register
          </button>
          <button
            type="button"
            onClick={() => setShowNetlifyModal(true)}
            className="hover:text-stone-900 text-[#008F83] font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Deploy to Netlify</span>
          </button>
        </nav>

        {/* Zone 3: 1-2 Primary Actions */}
        <div className="flex items-center gap-2.5">
          {currentUser && connectedSibling && !showAuthScreen && (
            <button
              type="button"
              onClick={() => {
                setActiveUserId(connectedSibling.id);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap"
              title="Switch active phone between Brother and Sister"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-[#C85A32]" />
              <span>
                Switch to {connectedSibling.role === 'brother' ? 'Brother' : 'Sister'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setLayoutMode((m) => (m === 'single' ? 'dual' : 'single'))}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#C85A32] hover:bg-[#B24C27] rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            {layoutMode === 'single' ? (
              <>
                <Columns2 className="w-3.5 h-3.5" />
                <span>Side-by-Side Test</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5" />
                <span>Single Phone</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Viewport */}
      {showAuthScreen || !currentUser ? (
        <AuthScreen
          existingUsers={allUsersList}
          onAuthenticated={(user) => {
            setActiveUserId(user.id);
            setShowAuthScreen(false);
          }}
        />
      ) : layoutMode === 'dual' && brotherUser && sisterUser ? (
        /* DUAL-SIBLING LIVE SPLIT VIEW */
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl border border-stone-200/80 px-5 py-3.5">
            <div>
              <h1 className="font-display text-base font-semibold text-stone-900">
                Live Brother &amp; Sister Side-by-Side Test Bench
              </h1>
              <p className="text-xs text-stone-600">
                Type a message or photo on Brother’s phone on the left, and watch Sister’s phone on the right receive the push notification and read receipt in real time.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setShowNetlifyModal(true)}
                className="px-3.5 py-2 rounded-xl bg-[#00C7B7]/15 hover:bg-[#00C7B7]/25 text-xs font-semibold text-[#008F83] flex items-center gap-1.5"
              >
                <Globe className="w-4 h-4" />
                <span>Netlify Deploy Ready</span>
              </button>
              <button
                type="button"
                onClick={() => setShowBlueprintModal(true)}
                className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-800 flex items-center gap-1.5"
              >
                <Code2 className="w-4 h-4 text-[#C85A32]" />
                <span>Android Source</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Brother's Device */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-2 text-xs text-stone-600">
                <span className="font-semibold text-[#2F6F5E]">
                  Device 1 · Brother ({brotherUser.name})
                </span>
                <span className="font-mono-code">Invite Code: {brotherUser.inviteCode}</span>
              </div>
              <SiblingPhoneView
                currentUser={brotherUser}
                connectedSibling={
                  brotherUser.connectedSiblingId
                    ? appState.users[brotherUser.connectedSiblingId] || null
                    : null
                }
                allUsers={allUsersList}
                messages={appState.messages}
                siblingIsTyping={
                  brotherUser.connectedSiblingId
                    ? Boolean(appState.typingByUserId[brotherUser.connectedSiblingId])
                    : false
                }
                latestNotification={latestNotification}
                onDismissNotification={() => setLatestNotification(null)}
                onSendMessage={(s, r, t, txt, p) => siblingSync.sendMessage(s, r, t, txt, p)}
                onDeleteMessage={(id) => siblingSync.deleteMessage(id)}
                onCycleMessageStatus={(id, st) => siblingSync.cycleMessageStatus(id, st)}
                onMarkMessagesRead={(r, s) => siblingSync.markMessagesRead(r, s)}
                onUpdateUser={(id, patch) => siblingSync.updateUser(id, patch)}
                onTypingChange={(id, typ) => siblingSync.setTyping(id, typ)}
                onLogout={() => setShowAuthScreen(true)}
                compactMode
              />
            </div>

            {/* Sister's Device */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-2 text-xs text-stone-600">
                <span className="font-semibold text-[#C85A32]">
                  Device 2 · Sister ({sisterUser.name})
                </span>
                <span className="font-mono-code">Invite Code: {sisterUser.inviteCode}</span>
              </div>
              <SiblingPhoneView
                currentUser={sisterUser}
                connectedSibling={
                  sisterUser.connectedSiblingId
                    ? appState.users[sisterUser.connectedSiblingId] || null
                    : null
                }
                allUsers={allUsersList}
                messages={appState.messages}
                siblingIsTyping={
                  sisterUser.connectedSiblingId
                    ? Boolean(appState.typingByUserId[sisterUser.connectedSiblingId])
                    : false
                }
                latestNotification={latestNotification}
                onDismissNotification={() => setLatestNotification(null)}
                onSendMessage={(s, r, t, txt, p) => siblingSync.sendMessage(s, r, t, txt, p)}
                onDeleteMessage={(id) => siblingSync.deleteMessage(id)}
                onCycleMessageStatus={(id, st) => siblingSync.cycleMessageStatus(id, st)}
                onMarkMessagesRead={(r, s) => siblingSync.markMessagesRead(r, s)}
                onUpdateUser={(id, patch) => siblingSync.updateUser(id, patch)}
                onTypingChange={(id, typ) => siblingSync.setTyping(id, typ)}
                onLogout={() => setShowAuthScreen(true)}
                compactMode
              />
            </div>
          </div>
        </main>
      ) : (
        /* SINGLE DEVICE VIEW + DESKTOP SIBLING ARCHITECTURE PANEL */
        <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (5 cols) */}
          <div className="lg:col-span-5 space-y-6 order-2 lg:order-1">
            <div className="bg-white rounded-3xl border border-stone-200/90 p-6 space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#C85A32]">
                    Private One-to-One Family Messenger
                  </p>
                  <span className="text-[11px] font-medium text-[#008F83] bg-[#00C7B7]/10 px-2 py-0.5 rounded-md">
                    Netlify Ready
                  </span>
                </div>
                <h1 className="font-display text-2xl font-semibold text-stone-900 leading-snug">
                  Designed exclusively for Brothers &amp; Sisters.
                </h1>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Send messages and photos directly over the internet without using SMS. No public feeds, no news, no social media noise.
                </p>
              </div>

              {/* Active Perspective Switcher */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs text-stone-600">
                  <span className="font-semibold text-stone-900">Active Phone Perspective</span>
                  <span>Tap to switch</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {allUsersList.slice(0, 2).map((u) => {
                    const isSelected = u.id === currentUser.id;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setActiveUserId(u.id)}
                        className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                          isSelected
                            ? 'bg-white border-[#C85A32] shadow-xs'
                            : 'bg-white/60 border-stone-200 hover:bg-white'
                        }`}
                      >
                        <img
                          src={u.avatarUrl}
                          alt={u.name}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover shrink-0 border border-stone-200"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-stone-900 truncate">
                            {u.name.split(' ')[0]}
                          </p>
                          <p className="text-[11px] text-stone-500 capitalize">
                            {u.role} · {u.inviteCode}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Remote Sibling Simulator */}
              {connectedSibling && (
                <div className="p-4 rounded-2xl bg-[#EEF6F3] border border-[#2F6F5E]/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#2F6F5E] flex items-center gap-1.5">
                      <BellRing className="w-4 h-4" />
                      Simulate Incoming from {connectedSibling.name.split(' ')[0]}
                    </span>
                    <span className="text-[11px] text-stone-600 capitalize">
                      {connectedSibling.online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600">
                    Trigger an instant message or photo from {connectedSibling.name} to test push notifications on {currentUser.name.split(' ')[0]}’s phone:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        siblingSync.sendMessage(
                          connectedSibling.id,
                          currentUser.id,
                          'text',
                          `Hey ${currentUser.name.split(' ')[0]}! Are we still meeting at Mom's place this evening?`
                        )
                      }
                      className="min-h-[40px] px-3 py-2 rounded-xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 text-xs font-semibold transition-colors"
                    >
                      Receive Text + Push
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        siblingSync.sendMessage(
                          connectedSibling.id,
                          currentUser.id,
                          'photo',
                          'Freshly brewed coffee waiting for you!',
                          '/src/assets/images/shared_photo_coffee_1791344708871.jpg'
                        )
                      }
                      className="min-h-[40px] px-3 py-2 rounded-xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 text-xs font-semibold transition-colors"
                    >
                      Receive Photo + Push
                    </button>
                  </div>
                </div>
              )}

              {/* Checklist */}
              <div className="space-y-3 pt-1">
                <h2 className="text-xs font-semibold text-stone-900">
                  Included Features &amp; Specifications
                </h2>
                <div className="grid grid-cols-1 gap-2.5 text-xs text-stone-600">
                  <div className="flex items-center gap-2.5">
                    <KeyRound className="w-4 h-4 text-[#C85A32] shrink-0" />
                    <span>
                      Unique Invite Code pairing (<span className="font-mono-code">BRO-8492</span> &amp;{' '}
                      <span className="font-mono-code">SIS-3910</span>)
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Camera className="w-4 h-4 text-[#C85A32] shrink-0" />
                    <span>
                      Camera capture &amp; Gallery with Photo Preview before sending
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCheck className="w-4 h-4 text-[#2F6F5E] shrink-0" />
                    <span>
                      Real-time Sent, Delivered, and Read receipts + message deletion
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Wifi className="w-4 h-4 text-[#2F6F5E] shrink-0" />
                    <span>
                      Online/Offline presence indicator &amp; Push Notification banners
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#2F6F5E] shrink-0" />
                    <span>
                      Mobile/Email sign-in, Profile note, Privacy &amp; App Lock PIN
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowNetlifyModal(true)}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#008F83] hover:bg-[#007A70] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  <span>How to Deploy to Netlify</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowBlueprintModal(true)}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Code2 className="w-4 h-4" />
                  <span>Android &amp; Firebase Code</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (7 cols): Primary Responsive Android Phone */}
          <div className="lg:col-span-7 order-1 lg:order-2 flex justify-center">
            <div className="w-full max-w-[440px]">
              <SiblingPhoneView
                currentUser={currentUser}
                connectedSibling={connectedSibling}
                allUsers={allUsersList}
                messages={appState.messages}
                siblingIsTyping={
                  connectedSibling
                    ? Boolean(appState.typingByUserId[connectedSibling.id])
                    : false
                }
                latestNotification={latestNotification}
                onDismissNotification={() => setLatestNotification(null)}
                onSendMessage={(s, r, t, txt, p) => siblingSync.sendMessage(s, r, t, txt, p)}
                onDeleteMessage={(id) => siblingSync.deleteMessage(id)}
                onCycleMessageStatus={(id, st) => siblingSync.cycleMessageStatus(id, st)}
                onMarkMessagesRead={(r, s) => siblingSync.markMessagesRead(r, s)}
                onUpdateUser={(id, patch) => siblingSync.updateUser(id, patch)}
                onTypingChange={(id, typ) => siblingSync.setTyping(id, typ)}
                onLogout={() => setShowAuthScreen(true)}
              />
            </div>
          </div>
        </main>
      )}

      {/* Modals */}
      {showBlueprintModal && (
        <FirebaseAndroidBlueprintModal onClose={() => setShowBlueprintModal(false)} />
      )}
      {showNetlifyModal && <NetlifyDeployModal onClose={() => setShowNetlifyModal(false)} />}
    </div>
  );
}

export default App;
