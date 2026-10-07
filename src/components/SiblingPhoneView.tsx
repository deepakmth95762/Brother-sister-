import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Check,
  CheckCheck,
  Image as ImageIcon,
  Lock,
  LogOut,
  MessageCircleHeart,
  MoreVertical,
  Phone,
  Send,
  ShieldCheck,
  Trash2,
  User,
  Wifi,
  WifiOff,
  KeyRound,
  Bell,
  ArrowLeft,
  Eye,
  Upload,
} from 'lucide-react';
import {
  ChatMessage,
  MessageStatus,
  PushNotificationEvent,
  SiblingProfile,
} from '../types';
import { CameraModal } from './CameraModal';
import { PhotoPreviewModal } from './PhotoPreviewModal';
import { InviteBondModal } from './InviteBondModal';
import { COFFEE_PHOTO, HIKE_PHOTO, BROTHER_AVATAR, SISTER_AVATAR } from '../utils/storage';

const SAMPLE_GALLERY_PHOTOS = [
  {
    id: 'gal_coffee',
    label: 'Morning Coffee & Cinnamon Rolls',
    url: COFFEE_PHOTO,
  },
  {
    id: 'gal_hike',
    label: 'Golden Hour Woodland Trail',
    url: HIKE_PHOTO,
  },
  {
    id: 'gal_brother',
    label: 'Living Room Portrait',
    url: BROTHER_AVATAR,
  },
  {
    id: 'gal_sister',
    label: 'Window Light Portrait',
    url: SISTER_AVATAR,
  },
];

interface SiblingPhoneViewProps {
  currentUser: SiblingProfile;
  connectedSibling: SiblingProfile | null;
  allUsers: SiblingProfile[];
  messages: ChatMessage[];
  siblingIsTyping: boolean;
  latestNotification: PushNotificationEvent | null;
  onDismissNotification: () => void;
  onSendMessage: (
    senderId: string,
    receiverId: string,
    type: 'text' | 'photo',
    text: string,
    photoUrl?: string
  ) => void;
  onDeleteMessage: (messageId: string) => void;
  onCycleMessageStatus: (messageId: string, nextStatus: MessageStatus) => void;
  onMarkMessagesRead: (readerId: string, senderId: string) => void;
  onUpdateUser: (userId: string, patch: Partial<SiblingProfile>) => void;
  onTypingChange: (userId: string, isTyping: boolean) => void;
  onLogout: () => void;
  compactMode?: boolean;
}

export const SiblingPhoneView: React.FC<SiblingPhoneViewProps> = ({
  currentUser,
  connectedSibling,
  allUsers,
  messages,
  siblingIsTyping,
  latestNotification,
  onDismissNotification,
  onSendMessage,
  onDeleteMessage,
  onCycleMessageStatus,
  onMarkMessagesRead,
  onUpdateUser,
  onTypingChange,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'chat' | 'invite' | 'profile'>('chat');
  const [draftText, setDraftText] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [gallerySheetOpen, setGallerySheetOpen] = useState(false);
  const [pendingPreviewPhoto, setPendingPreviewPhoto] = useState<{
    url: string;
    source: string;
  } | null>(null);
  const [expandedImage, setExpandedImage] = useState<ChatMessage | null>(null);

  // Profile editing
  const [editName, setEditName] = useState(currentUser.name);
  const [editStatusNote, setEditStatusNote] = useState(currentUser.statusNote);
  const [editContact, setEditContact] = useState(currentUser.contactValue);
  const [profileSavedToast, setProfileSavedToast] = useState(false);
  const [pinLocked, setPinLocked] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setEditName(currentUser.name);
    setEditStatusNote(currentUser.statusNote);
    setEditContact(currentUser.contactValue);
  }, [currentUser.id, currentUser.name, currentUser.statusNote, currentUser.contactValue]);

  // Filter strictly 1-to-1 messages between currentUser and connectedSibling
  const bondMessages = React.useMemo(() => {
    if (!connectedSibling) return [];
    const expectedBond = [currentUser.id, connectedSibling.id].sort().join('__');
    return messages.filter((m) => m.bondId === expectedBond);
  }, [messages, currentUser.id, connectedSibling]);

  const unreadCount = React.useMemo(() => {
    if (!connectedSibling) return 0;
    return bondMessages.filter(
      (m) => m.receiverId === currentUser.id && m.status !== 'read'
    ).length;
  }, [bondMessages, currentUser.id, connectedSibling]);

  // Mark incoming messages as read when viewing chat tab while online
  useEffect(() => {
    if (
      activeTab === 'chat' &&
      currentUser.online &&
      connectedSibling &&
      unreadCount > 0 &&
      !pinLocked
    ) {
      onMarkMessagesRead(currentUser.id, connectedSibling.id);
    }
  }, [
    activeTab,
    currentUser.id,
    currentUser.online,
    connectedSibling,
    unreadCount,
    pinLocked,
    onMarkMessagesRead,
  ]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [bondMessages.length, activeTab, siblingIsTyping]);

  const handleTextChange = (val: string) => {
    setDraftText(val);
    onTypingChange(currentUser.id, val.trim().length > 0);
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectedSibling || !draftText.trim()) return;
    const textToSend = draftText.trim();
    setDraftText('');
    onTypingChange(currentUser.id, false);
    onSendMessage(currentUser.id, connectedSibling.id, 'text', textToSend);
  };

  const handleGalleryFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setGallerySheetOpen(false);
        setPendingPreviewPhoto({
          url: reader.result,
          source: `Device Gallery (${file.name})`,
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdateUser(currentUser.id, { avatarUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser(currentUser.id, {
      name: editName.trim() || currentUser.name,
      statusNote: editStatusNote.trim(),
      contactValue: editContact.trim() || currentUser.contactValue,
    });
    setProfileSavedToast(true);
    setTimeout(() => setProfileSavedToast(false), 2200);
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const renderStatusIndicator = (msg: ChatMessage) => {
    const nextStatusMap: Record<MessageStatus, MessageStatus> = {
      sent: 'delivered',
      delivered: 'read',
      read: 'sent',
    };
    return (
      <button
        type="button"
        onClick={() => onCycleMessageStatus(msg.id, nextStatusMap[msg.status])}
        title="Tap to test Sent / Delivered / Read receipt state"
        className="inline-flex items-center gap-1 text-[11px] opacity-90 hover:opacity-100 transition-opacity"
      >
        {msg.status === 'sent' && (
          <>
            <Check className="w-3.5 h-3.5 text-stone-200" />
            <span>Sent</span>
          </>
        )}
        {msg.status === 'delivered' && (
          <>
            <CheckCheck className="w-3.5 h-3.5 text-stone-200" />
            <span>Delivered</span>
          </>
        )}
        {msg.status === 'read' && (
          <>
            <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span className="font-medium text-emerald-200">Read</span>
          </>
        )}
      </button>
    );
  };

  // Optional App Lock screen
  if (pinLocked) {
    return (
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden flex flex-col h-[740px] items-center justify-center p-8 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-[#FBF2EE] text-[#C85A32] flex items-center justify-center">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="font-display text-xl font-semibold text-stone-900">
            Private Sibling Lock Active
          </h2>
          <p className="text-xs text-stone-600">
            Enter PIN for {currentUser.name} (Default: {currentUser.privacy.appLockPin || '1234'})
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (enteredPin === (currentUser.privacy.appLockPin || '1234')) {
              setPinLocked(false);
              setEnteredPin('');
              setPinError(false);
            } else {
              setPinError(true);
            }
          }}
          className="w-full max-w-xs space-y-3"
        >
          <input
            type="password"
            maxLength={6}
            value={enteredPin}
            onChange={(e) => setEnteredPin(e.target.value)}
            placeholder="••••"
            className="w-full text-center text-lg font-mono-code tracking-widest px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C85A32]"
            autoFocus
          />
          {pinError && (
            <p className="text-xs text-red-600">Incorrect PIN. Try {currentUser.privacy.appLockPin}</p>
          )}
          <button
            type="submit"
            className="w-full min-h-[44px] bg-[#C85A32] hover:bg-[#B24C27] text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Unlock Private Chat
          </button>
        </form>
      </div>
    );
  }

  const sharedPhotos = bondMessages.filter((m) => m.type === 'photo' && m.photoUrl);

  return (
    <div className="relative bg-[#FAF8F5] rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden flex flex-col h-[740px]">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleGalleryFileSelect}
        className="hidden"
      />
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarFileSelect}
        className="hidden"
      />

      {/* Android Status Bar + Identity Header */}
      <div className="bg-stone-900 text-stone-200 px-4 py-2 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2">
          <span className="font-mono-code font-medium">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span aria-hidden="true">·</span>
          <span className="capitalize font-medium text-white">
            {currentUser.name} ({currentUser.role})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {currentUser.privacy.appLockEnabled && (
            <button
              type="button"
              onClick={() => setPinLocked(true)}
              className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center gap-1"
              title="Lock screen now"
            >
              <Lock className="w-3 h-3" />
              <span>Lock</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onUpdateUser(currentUser.id, { online: !currentUser.online })}
            className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
              currentUser.online
                ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-700/50'
                : 'bg-stone-800 text-stone-400 border border-stone-700'
            }`}
            title="Toggle this device's internet presence (Online / Offline)"
          >
            {currentUser.online ? (
              <>
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span>Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-stone-400" />
                <span>Offline</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Android Heads-Up Push Notification Banner (FCM Notification Preview) */}
      {latestNotification && latestNotification.targetUserId === currentUser.id && (
        <div className="absolute top-11 left-3 right-3 z-40 bg-stone-900/95 text-white backdrop-blur-md rounded-2xl p-3.5 shadow-xl border border-stone-700 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('chat');
              onDismissNotification();
            }}
            className="flex items-center gap-3 text-left min-w-0 flex-1"
          >
            <img
              src={latestNotification.senderAvatar}
              alt={latestNotification.senderName}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover shrink-0 border border-stone-600"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                <Bell className="w-3 h-3" />
                <span>Push Notification · Now</span>
              </div>
              <p className="text-xs font-semibold text-white truncate">
                {latestNotification.title}
              </p>
              <p className="text-xs text-stone-300 truncate">{latestNotification.body}</p>
            </div>
            {latestNotification.photoUrl && (
              <img
                src={latestNotification.photoUrl}
                alt="Notification attachment"
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-lg object-cover shrink-0 border border-stone-700"
              />
            )}
          </button>
          <button
            type="button"
            onClick={onDismissNotification}
            className="text-xs text-stone-400 hover:text-white px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Mobile Top App Bar */}
      <div className="h-14 px-4 bg-white border-b border-stone-200/80 flex items-center justify-between shrink-0">
        {activeTab === 'chat' && connectedSibling ? (
          <>
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setActiveTab('home')}
                className="min-h-[40px] min-w-[36px] flex items-center justify-center rounded-xl text-stone-600 hover:bg-stone-100"
                title="Back to Home"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="relative shrink-0">
                <img
                  src={connectedSibling.avatarUrl}
                  alt={connectedSibling.name}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover border border-stone-200"
                />
                {connectedSibling.privacy.onlineStatusVisible && (
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                      connectedSibling.online ? 'bg-emerald-500' : 'bg-stone-400'
                    }`}
                  />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-semibold text-stone-900 truncate">
                    {connectedSibling.name}
                  </h2>
                  <span className="text-xs text-stone-400">·</span>
                  <span className="text-xs font-medium text-[#C85A32] capitalize">
                    {connectedSibling.role}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 truncate">
                  {siblingIsTyping ? (
                    <span className="text-[#2F6F5E] font-medium">typing a message...</span>
                  ) : !connectedSibling.privacy.onlineStatusVisible ? (
                    'Private status'
                  ) : connectedSibling.online ? (
                    'Online now · Direct Internet Connection'
                  ) : (
                    `Offline · Last seen ${formatTime(connectedSibling.lastSeen)}`
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCameraOpen(true)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors"
                title="Take photo with camera"
              >
                <Camera className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('invite')}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors"
                title="Sibling Bond & Invite Code"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2.5">
              <span className="font-display text-base font-semibold text-stone-900">
                Brother &amp; Sister
              </span>
              <span className="text-xs text-stone-400">·</span>
              <span className="text-xs text-stone-600 capitalize">
                {activeTab === 'home'
                  ? 'Sibling Home'
                  : activeTab === 'invite'
                  ? 'Invite Code'
                  : 'Profile & Privacy'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2 min-h-[40px] px-2.5 rounded-xl hover:bg-stone-100 transition-colors"
            >
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover border border-stone-200"
              />
              <span className="text-xs font-medium text-stone-700 max-w-[90px] truncate">
                {currentUser.name.split(' ')[0]}
              </span>
            </button>
          </>
        )}
      </div>

      {/* Main Content Body */}
      <div className="flex-1 overflow-y-auto">
        {/* TAB 1: HOME SCREEN (Shows ONLY connected Brother/Sister chat) */}
        {activeTab === 'home' && (
          <div className="p-5 space-y-6">
            <div className="space-y-1">
              <p className="text-xs text-stone-500">
                Welcome back, {currentUser.name.split(' ')[0]}
              </p>
              <h1 className="font-display text-xl font-semibold text-stone-900">
                Your Private Sibling Space
              </h1>
            </div>

            {connectedSibling ? (
              <>
                {/* Connected Sibling Card */}
                <div className="bg-white rounded-3xl border border-stone-200/90 p-5 shadow-xs space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={connectedSibling.avatarUrl}
                          alt={connectedSibling.name}
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-2xl object-cover border border-stone-200"
                        />
                        {connectedSibling.privacy.onlineStatusVisible && (
                          <span
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                              connectedSibling.online ? 'bg-emerald-500' : 'bg-stone-400'
                            }`}
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs text-stone-500">
                          <span className="capitalize font-semibold text-[#C85A32]">
                            Connected {connectedSibling.role}
                          </span>
                          <span>·</span>
                          <span>
                            {connectedSibling.online ? 'Online now' : 'Offline'}
                          </span>
                        </div>
                        <h2 className="font-display text-lg font-semibold text-stone-900 truncate mt-0.5">
                          {connectedSibling.name}
                        </h2>
                        <p className="text-xs text-stone-600 truncate mt-0.5">
                          {connectedSibling.statusNote}
                        </p>
                      </div>
                    </div>

                    {unreadCount > 0 && (
                      <span className="text-xs font-semibold text-[#C85A32] tabular-nums shrink-0">
                        {unreadCount} new
                      </span>
                    )}
                  </div>

                  {/* Latest Message Preview */}
                  {bondMessages.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-stone-200/70 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-stone-500">
                          Last message · {formatTime(bondMessages[bondMessages.length - 1].timestamp)}
                        </p>
                        <p className="text-xs font-medium text-stone-800 truncate mt-0.5">
                          {bondMessages[bondMessages.length - 1].type === 'photo'
                            ? `📷 Photo: ${
                                bondMessages[bondMessages.length - 1].text || 'Shared a photo'
                              }`
                            : bondMessages[bondMessages.length - 1].text}
                        </p>
                      </div>
                      <span className="text-xs text-stone-500 capitalize">
                        {bondMessages[bondMessages.length - 1].status}
                      </span>
                    </div>
                  )}

                  {/* Primary Action Buttons */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('chat')}
                      className="min-h-[46px] px-4 py-2.5 bg-[#C85A32] hover:bg-[#B24C27] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                    >
                      <MessageCircleHeart className="w-4 h-4" />
                      <span>Open Private Chat</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('chat');
                        setCameraOpen(true);
                      }}
                      className="min-h-[46px] px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                    >
                      <Camera className="w-4 h-4 text-[#C85A32]" />
                      <span>Snap &amp; Send Photo</span>
                    </button>
                  </div>
                </div>

                {/* Shared Sibling Photo Memories Strip */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-stone-600">
                    <span className="font-semibold text-stone-800">
                      Recent Shared Photos ({sharedPhotos.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('chat')}
                      className="text-[#C85A32] hover:underline font-medium"
                    >
                      View in Chat
                    </button>
                  </div>

                  {sharedPhotos.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-white border border-stone-200/80 text-xs text-stone-500 text-center">
                      No photos shared yet. Send a photo from your camera or gallery!
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2.5">
                      {sharedPhotos.slice(-4).map((photoMsg) => (
                        <button
                          key={photoMsg.id}
                          type="button"
                          onClick={() => setExpandedImage(photoMsg)}
                          className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-stone-200 bg-stone-900 text-left"
                        >
                          <img
                            src={photoMsg.photoUrl}
                            alt={photoMsg.text || 'Shared sibling memory'}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5">
                            <p className="text-[11px] text-white font-medium truncate">
                              {photoMsg.text || 'Shared photo'}
                            </p>
                            <p className="text-[10px] text-white/75 font-mono-code">
                              {formatTime(photoMsg.timestamp)}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Zero-Noise Guarantee */}
                <div className="p-4 rounded-2xl bg-[#EEF6F3] border border-[#2F6F5E]/20 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#2F6F5E] shrink-0 mt-0.5" />
                  <div className="text-xs text-stone-700 space-y-1">
                    <p className="font-semibold text-stone-900">
                      Zero Social Media · Dedicated Sibling Line
                    </p>
                    <p className="text-stone-600 leading-relaxed">
                      Only {currentUser.name} and {connectedSibling.name} are connected in this room. No public feeds, no news, and no SMS carrier charges.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <InviteBondModal
                currentUser={currentUser}
                connectedSibling={null}
                allUsers={allUsers}
                onUpdatedUser={(u) => onUpdateUser(u.id, u)}
              />
            )}
          </div>
        )}

        {/* TAB 2: PRIVATE 1-TO-1 CHAT */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            {!connectedSibling ? (
              <div className="p-5">
                <InviteBondModal
                  currentUser={currentUser}
                  connectedSibling={null}
                  allUsers={allUsers}
                  onUpdatedUser={(u) => onUpdateUser(u.id, u)}
                />
              </div>
            ) : (
              <>
                {/* Scrollable Message Thread */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                  <div className="text-center py-2">
                    <p className="text-[11px] text-stone-500">
                      Private Internet Channel · Paired via Invite Code{' '}
                      <span className="font-mono-code font-medium text-stone-700">
                        {connectedSibling.inviteCode}
                      </span>
                    </p>
                  </div>

                  {bondMessages.map((msg) => {
                    const isMine = msg.senderId === currentUser.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`group relative max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-2xs transition-all ${
                            isMine
                              ? 'bg-[#2F6F5E] text-white rounded-br-xs'
                              : 'bg-white text-stone-900 border border-stone-200/90 rounded-bl-xs'
                          }`}
                        >
                          {/* Photo Attachment */}
                          {msg.type === 'photo' && msg.photoUrl && (
                            <div className="mb-2 -mx-1 -mt-1 rounded-xl overflow-hidden border border-black/10 bg-stone-900">
                              <img
                                src={msg.photoUrl}
                                alt={msg.text || 'Shared sibling photo'}
                                referrerPolicy="no-referrer"
                                onClick={() => setExpandedImage(msg)}
                                className="w-full max-h-56 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                              />
                            </div>
                          )}

                          {/* Message Text */}
                          {msg.text && (
                            <p className="text-sm leading-relaxed break-words">{msg.text}</p>
                          )}

                          {/* Metadata Row: Timestamp + Status + Delete */}
                          <div
                            className={`flex items-center justify-end gap-2 mt-1 text-[11px] ${
                              isMine ? 'text-stone-200' : 'text-stone-400'
                            }`}
                          >
                            <span className="font-mono-code tabular-nums">
                              {formatTime(msg.timestamp)}
                            </span>

                            {isMine && (
                              <>
                                <span aria-hidden="true">·</span>
                                {renderStatusIndicator(msg)}
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => onDeleteMessage(msg.id)}
                              className={`p-1 rounded hover:bg-black/15 transition-colors ${
                                isMine
                                  ? 'text-stone-200 hover:text-white'
                                  : 'text-stone-400 hover:text-red-600'
                              }`}
                              title="Delete message or photo"
                              aria-label="Delete message"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {siblingIsTyping && (
                    <div className="flex items-center gap-2 text-xs text-stone-500 pl-2">
                      <span className="w-2 h-2 rounded-full bg-[#2F6F5E] animate-ping" />
                      <span>{connectedSibling.name.split(' ')[0]} is typing...</span>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Gallery Picker Bottom Sheet inside Phone */}
                {gallerySheetOpen && (
                  <div className="bg-white border-t border-stone-200 p-4 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-stone-900">
                        Select Photo from Gallery (Preview Before Sending)
                      </span>
                      <button
                        type="button"
                        onClick={() => setGallerySheetOpen(false)}
                        className="text-xs text-stone-500 hover:text-stone-900"
                      >
                        Close
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#FBF2EE] text-[#C85A32] hover:bg-[#F5E3DC] text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Browse Device Photos</span>
                      </button>
                      <span className="text-[11px] text-stone-400">or tap a recent album photo:</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {SAMPLE_GALLERY_PHOTOS.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setGallerySheetOpen(false);
                            setPendingPreviewPhoto({
                              url: item.url,
                              source: `Family Gallery (${item.label})`,
                            });
                          }}
                          className="group relative aspect-square rounded-xl overflow-hidden border border-stone-200 hover:border-[#C85A32]"
                        >
                          <img
                            src={item.url}
                            alt={item.label}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chat Composer Bar */}
                <form
                  onSubmit={handleSendText}
                  className="p-3 bg-white border-t border-stone-200/80 flex items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={() => setCameraOpen(true)}
                    className="min-h-[44px] min-w-[44px] rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center shrink-0 transition-colors"
                    title="Take a photo using camera"
                    aria-label="Take a photo using camera"
                  >
                    <Camera className="w-5 h-5 text-[#C85A32]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setGallerySheetOpen((o) => !o)}
                    className={`min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      gallerySheetOpen
                        ? 'bg-[#FBF2EE] text-[#C85A32]'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                    }`}
                    title="Send photo from gallery"
                    aria-label="Send photo from gallery"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>

                  <input
                    type="text"
                    value={draftText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder={`Message ${connectedSibling.name.split(' ')[0]}...`}
                    className="flex-1 min-w-0 px-3.5 py-2.5 text-sm bg-stone-100 border border-transparent rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-[#C85A32]"
                  />

                  <button
                    type="submit"
                    disabled={!draftText.trim()}
                    className="min-h-[44px] min-w-[44px] px-3.5 rounded-xl bg-[#C85A32] hover:bg-[#B24C27] disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-colors"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        {/* TAB 3: INVITE CODE PAIRING */}
        {activeTab === 'invite' && (
          <div className="p-5">
            <InviteBondModal
              currentUser={currentUser}
              connectedSibling={connectedSibling}
              allUsers={allUsers}
              onUpdatedUser={(u) => onUpdateUser(u.id, u)}
            />
          </div>
        )}

        {/* TAB 4: PROFILE, PRIVACY SETTINGS & LOGOUT */}
        {activeTab === 'profile' && (
          <div className="p-5 space-y-6">
            <div className="bg-white rounded-3xl border border-stone-200/90 p-5 space-y-5">
              <div className="flex items-center gap-4">
                <div className="relative group shrink-0">
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-18 h-18 rounded-2xl object-cover border border-stone-200"
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="mt-1.5 w-full text-[11px] font-medium text-[#C85A32] hover:underline text-center block"
                  >
                    Change Photo
                  </button>
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <span className="capitalize font-semibold text-[#C85A32]">
                      {currentUser.role} Account
                    </span>
                    <span>·</span>
                    <span className="font-mono-code">{currentUser.inviteCode}</span>
                  </div>
                  <h2 className="font-display text-lg font-semibold text-stone-900 truncate">
                    {currentUser.name}
                  </h2>
                  <p className="text-xs text-stone-500 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{currentUser.contactValue}</span>
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-3 pt-2 border-t border-stone-100">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:bg-white focus:border-[#C85A32]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Mobile Number or Email
                  </label>
                  <input
                    type="text"
                    value={editContact}
                    onChange={(e) => setEditContact(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:bg-white focus:border-[#C85A32]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Personal Note for Sibling
                  </label>
                  <input
                    type="text"
                    value={editStatusNote}
                    onChange={(e) => setEditStatusNote(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:bg-white focus:border-[#C85A32]"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  {profileSavedToast ? (
                    <span className="text-xs font-medium text-[#2F6F5E]">
                      ✓ Profile saved &amp; synced
                    </span>
                  ) : (
                    <span className="text-[11px] text-stone-500">
                      Synced directly with your connected sibling
                    </span>
                  )}
                  <button
                    type="submit"
                    className="min-h-[40px] px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-colors"
                  >
                    Save Profile
                  </button>
                </div>
              </form>
            </div>

            {/* Privacy & Security Settings */}
            <div className="bg-white rounded-3xl border border-stone-200/90 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2F6F5E]" />
                <h3 className="text-sm font-semibold text-stone-900">
                  Privacy &amp; Notification Settings
                </h3>
              </div>

              <div className="divide-y divide-stone-100">
                <label className="py-3 flex items-center justify-between gap-4 cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-stone-900">Send Read Receipts</p>
                    <p className="text-[11px] text-stone-500">
                      Let your sibling see when you have read their messages
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={currentUser.privacy.readReceipts}
                    onChange={(e) =>
                      onUpdateUser(currentUser.id, {
                        privacy: { ...currentUser.privacy, readReceipts: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-[#C85A32]"
                  />
                </label>

                <label className="py-3 flex items-center justify-between gap-4 cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-stone-900">
                      Show Online / Last Seen Status
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Share your live online indicator with your connected sibling
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={currentUser.privacy.onlineStatusVisible}
                    onChange={(e) =>
                      onUpdateUser(currentUser.id, {
                        privacy: {
                          ...currentUser.privacy,
                          onlineStatusVisible: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 accent-[#C85A32]"
                  />
                </label>

                <label className="py-3 flex items-center justify-between gap-4 cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-stone-900">
                      Push Notifications
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Instant banner alerts when new messages or photos arrive
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={currentUser.privacy.pushNotifications}
                    onChange={(e) =>
                      onUpdateUser(currentUser.id, {
                        privacy: {
                          ...currentUser.privacy,
                          pushNotifications: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 accent-[#C85A32]"
                  />
                </label>

                <label className="py-3 flex items-center justify-between gap-4 cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-stone-900">
                      Passcode App Lock (PIN: {currentUser.privacy.appLockPin})
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Require PIN unlock to view private sibling conversations
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={currentUser.privacy.appLockEnabled}
                    onChange={(e) =>
                      onUpdateUser(currentUser.id, {
                        privacy: {
                          ...currentUser.privacy,
                          appLockEnabled: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 accent-[#C85A32]"
                  />
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out of {currentUser.name}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Tab Bar */}
      <nav className="h-16 bg-white border-t border-stone-200/90 grid grid-cols-4 items-center shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
            activeTab === 'home' ? 'text-[#C85A32]' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Eye className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">Sibling Home</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`relative min-h-[44px] flex flex-col items-center justify-center transition-colors ${
            activeTab === 'chat' ? 'text-[#C85A32]' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <MessageCircleHeart className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">
            Private Chat {unreadCount > 0 ? `(${unreadCount})` : ''}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('invite')}
          className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
            activeTab === 'invite' ? 'text-[#C85A32]' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <KeyRound className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">Invite Code</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
            activeTab === 'profile' ? 'text-[#C85A32]' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">Profile &amp; Privacy</span>
        </button>
      </nav>

      {/* Camera Modal */}
      {cameraOpen && connectedSibling && (
        <CameraModal
          recipientName={connectedSibling.name.split(' ')[0]}
          senderName={currentUser.name.split(' ')[0]}
          onClose={() => setCameraOpen(false)}
          onSendPhoto={(photoUrl, caption) => {
            onSendMessage(currentUser.id, connectedSibling.id, 'photo', caption, photoUrl);
          }}
        />
      )}

      {/* Photo Preview Before Sending Modal */}
      {pendingPreviewPhoto && connectedSibling && (
        <PhotoPreviewModal
          photoUrl={pendingPreviewPhoto.url}
          sourceLabel={pendingPreviewPhoto.source}
          recipientName={connectedSibling.name.split(' ')[0]}
          onCancel={() => setPendingPreviewPhoto(null)}
          onSend={(finalUrl, caption) => {
            onSendMessage(currentUser.id, connectedSibling.id, 'photo', caption, finalUrl);
            setPendingPreviewPhoto(null);
          }}
        />
      )}

      {/* Lightbox */}
      {expandedImage && (
        <div className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-stone-900 rounded-3xl overflow-hidden border border-stone-800">
            <img
              src={expandedImage.photoUrl}
              alt={expandedImage.text || 'Shared photo'}
              referrerPolicy="no-referrer"
              className="w-full max-h-[65vh] object-contain bg-black"
            />
            <div className="p-4 flex items-center justify-between gap-4 text-white">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {expandedImage.text || 'Shared photo'}
                </p>
                <p className="text-xs text-stone-400 font-mono-code">
                  {formatTime(expandedImage.timestamp)} · Status: {expandedImage.status}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    onDeleteMessage(expandedImage.id);
                    setExpandedImage(null);
                  }}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedImage(null)}
                  className="min-h-[40px] px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
