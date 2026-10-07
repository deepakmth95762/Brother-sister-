import {
  AppState,
  ChatMessage,
  MessageStatus,
  PushNotificationEvent,
  SiblingProfile,
  SiblingRole,
} from '../types';

export const BROTHER_AVATAR = '/src/assets/images/brother_avatar_1791344686030.jpg';
export const SISTER_AVATAR = '/src/assets/images/sister_avatar_1791344697448.jpg';
export const COFFEE_PHOTO = '/src/assets/images/shared_photo_coffee_1791344708871.jpg';
export const HIKE_PHOTO = '/src/assets/images/shared_photo_hike_1791344730822.jpg';

const STORAGE_KEY = 'brother_and_sister_app_state_v1';
const SYNC_CHANNEL_NAME = 'brother_and_sister_sync_channel';

const now = Date.now();
const minsAgo = (m: number) => new Date(now - m * 60 * 1000).toISOString();

function getBondId(u1: string, u2: string): string {
  return [u1, u2].sort().join('__');
}

export function generateInviteCode(role: SiblingRole): string {
  const prefix = role === 'brother' ? 'BRO' : 'SIS';
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${digits}`;
}

const DEFAULT_STATE: AppState = {
  users: {
    user_brother: {
      id: 'user_brother',
      name: 'Aarav Verma',
      role: 'brother',
      authMethod: 'phone',
      contactValue: '+1 (555) 234-8910',
      avatarUrl: BROTHER_AVATAR,
      inviteCode: 'BRO-8492',
      connectedSiblingId: 'user_sister',
      online: true,
      lastSeen: new Date().toISOString(),
      statusNote: 'Always a message away for my sister',
      privacy: {
        readReceipts: true,
        onlineStatusVisible: true,
        pushNotifications: true,
        notificationSound: true,
        appLockEnabled: false,
        appLockPin: '1234',
      },
    },
    user_sister: {
      id: 'user_sister',
      name: 'Meera Verma',
      role: 'sister',
      authMethod: 'email',
      contactValue: 'meera.verma@family.org',
      avatarUrl: SISTER_AVATAR,
      inviteCode: 'SIS-3910',
      connectedSiblingId: 'user_brother',
      online: true,
      lastSeen: new Date().toISOString(),
      statusNote: 'Saving recipes & weekend trail photos',
      privacy: {
        readReceipts: true,
        onlineStatusVisible: true,
        pushNotifications: true,
        notificationSound: true,
        appLockEnabled: false,
        appLockPin: '2580',
      },
    },
  },
  messages: [
    {
      id: 'msg_1',
      bondId: getBondId('user_brother', 'user_sister'),
      senderId: 'user_sister',
      receiverId: 'user_brother',
      type: 'text',
      text: 'Morning Bhai! Glad we set up Brother & Sister so we have our own quiet space away from noisy group chats.',
      timestamp: minsAgo(48),
      status: 'read',
    },
    {
      id: 'msg_2',
      bondId: getBondId('user_brother', 'user_sister'),
      senderId: 'user_brother',
      receiverId: 'user_sister',
      type: 'text',
      text: 'Good morning Meera! Totally agree—no ads, no public feeds, just direct messages and photos between us.',
      timestamp: minsAgo(45),
      status: 'read',
    },
    {
      id: 'msg_3',
      bondId: getBondId('user_brother', 'user_sister'),
      senderId: 'user_sister',
      receiverId: 'user_brother',
      type: 'photo',
      text: 'Saved a cinnamon roll and brewed fresh coffee for when you stop by Mom’s house at noon!',
      photoUrl: COFFEE_PHOTO,
      timestamp: minsAgo(24),
      status: 'read',
    },
    {
      id: 'msg_4',
      bondId: getBondId('user_brother', 'user_sister'),
      senderId: 'user_brother',
      receiverId: 'user_sister',
      type: 'photo',
      text: 'Just finished the ridge walk—bringing fresh apples from the orchard on my way over now.',
      photoUrl: HIKE_PHOTO,
      timestamp: minsAgo(9),
      status: 'read',
    },
    {
      id: 'msg_5',
      bondId: getBondId('user_brother', 'user_sister'),
      senderId: 'user_sister',
      receiverId: 'user_brother',
      type: 'text',
      text: 'That view looks incredible! Text me when you park outside.',
      timestamp: minsAgo(3),
      status: 'delivered',
    },
  ],
  typingByUserId: {
    user_brother: false,
    user_sister: false,
  },
};

class SiblingSyncService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(state: AppState) => void> = new Set();
  private notificationListeners: Set<(notif: PushNotificationEvent) => void> = new Set();
  private state: AppState;

  constructor() {
    this.state = this.loadInitial();

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        if (event.data?.type === 'state_sync') {
          this.state = event.data.payload;
          this.notify();
        } else if (event.data?.type === 'notification_push') {
          this.notifyPush(event.data.payload);
        }
      };
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            this.state = JSON.parse(e.newValue);
            this.notify();
          } catch {
            // Ignore
          }
        }
      });
    }
  }

  private loadInitial(): AppState {
    if (typeof window === 'undefined') return DEFAULT_STATE;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.users && parsed.messages) {
          return parsed;
        }
      }
    } catch {
      // Ignore
    }
    return DEFAULT_STATE;
  }

  private persistAndBroadcast(pushEvent?: PushNotificationEvent) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch {
        // Handle storage quota if large images are added
      }
    }
    if (this.channel) {
      this.channel.postMessage({ type: 'state_sync', payload: this.state });
      if (pushEvent) {
        this.channel.postMessage({ type: 'notification_push', payload: pushEvent });
      }
    }
    this.notify();
    if (pushEvent) {
      this.notifyPush(pushEvent);
    }
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.state));
  }

  private notifyPush(notif: PushNotificationEvent) {
    this.notificationListeners.forEach((fn) => fn(notif));
  }

  public subscribe(fn: (state: AppState) => void): () => void {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }

  public subscribeNotification(fn: (notif: PushNotificationEvent) => void): () => void {
    this.notificationListeners.add(fn);
    return () => this.notificationListeners.delete(fn);
  }

  public getState(): AppState {
    return this.state;
  }

  public sendMessage(
    senderId: string,
    receiverId: string,
    type: 'text' | 'photo',
    text: string,
    photoUrl?: string
  ) {
    const sender = this.state.users[senderId];
    const receiver = this.state.users[receiverId];
    if (!sender || !receiver) return;

    const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const bondId = getBondId(senderId, receiverId);
    const initialStatus: MessageStatus = receiver.online ? 'delivered' : 'sent';

    const newMsg: ChatMessage = {
      id,
      bondId,
      senderId,
      receiverId,
      type,
      text: text.trim(),
      photoUrl,
      timestamp: new Date().toISOString(),
      status: initialStatus,
    };

    this.state = {
      ...this.state,
      messages: [...this.state.messages, newMsg],
      typingByUserId: {
        ...this.state.typingByUserId,
        [senderId]: false,
      },
    };

    let pushEvent: PushNotificationEvent | undefined;
    if (receiver.privacy.pushNotifications) {
      pushEvent = {
        id: `push_${Date.now()}`,
        targetUserId: receiver.id,
        senderId: sender.id,
        senderName: sender.name,
        senderRole: sender.role,
        senderAvatar: sender.avatarUrl,
        title: `${sender.name} (${sender.role === 'brother' ? 'Brother' : 'Sister'})`,
        body:
          newMsg.type === 'photo'
            ? newMsg.text
              ? `📷 Photo: ${newMsg.text}`
              : '📷 Sent you a private photo'
            : newMsg.text,
        photoUrl: newMsg.photoUrl,
        timestamp: newMsg.timestamp,
      };
    }

    this.persistAndBroadcast(pushEvent);
  }

  public markMessagesRead(readerId: string, senderId: string) {
    const reader = this.state.users[readerId];
    let changed = false;
    const targetStatus: MessageStatus = reader && !reader.privacy.readReceipts ? 'delivered' : 'read';

    const nextMessages = this.state.messages.map((m) => {
      if (m.receiverId === readerId && m.senderId === senderId && m.status !== targetStatus) {
        changed = true;
        return { ...m, status: targetStatus };
      }
      return m;
    });

    if (changed) {
      this.state = { ...this.state, messages: nextMessages };
      this.persistAndBroadcast();
    }
  }

  public cycleMessageStatus(messageId: string, status: MessageStatus) {
    const nextMessages = this.state.messages.map((m) =>
      m.id === messageId ? { ...m, status } : m
    );
    this.state = { ...this.state, messages: nextMessages };
    this.persistAndBroadcast();
  }

  public deleteMessage(messageId: string) {
    const nextMessages = this.state.messages.filter((m) => m.id !== messageId);
    this.state = { ...this.state, messages: nextMessages };
    this.persistAndBroadcast();
  }

  public updateUser(userId: string, patch: Partial<SiblingProfile>) {
    const user = this.state.users[userId];
    if (!user) return;
    const updated = {
      ...user,
      ...patch,
      privacy: patch.privacy ? { ...user.privacy, ...patch.privacy } : user.privacy,
    };

    let nextMessages = this.state.messages;
    if (patch.online === true) {
      // Mark pending 'sent' messages to delivered
      nextMessages = this.state.messages.map((m) => {
        if (m.receiverId === userId && m.status === 'sent') {
          return { ...m, status: 'delivered' };
        }
        return m;
      });
    }

    this.state = {
      ...this.state,
      users: { ...this.state.users, [userId]: updated },
      messages: nextMessages,
    };
    this.persistAndBroadcast();
  }

  public setTyping(userId: string, isTyping: boolean) {
    this.state = {
      ...this.state,
      typingByUserId: {
        ...this.state.typingByUserId,
        [userId]: isTyping,
      },
    };
    this.persistAndBroadcast();
  }

  public connectBond(userId: string, inviteCode: string): { ok: boolean; error?: string } {
    const currentUser = this.state.users[userId];
    if (!currentUser) return { ok: false, error: 'User not found.' };

    const normalizedCode = inviteCode.trim().toUpperCase();
    const targetSibling = Object.values(this.state.users).find(
      (u) => u.inviteCode.toUpperCase() === normalizedCode && u.id !== userId
    );

    if (!targetSibling) {
      return {
        ok: false,
        error: 'No Brother or Sister found with that invite code. Try BRO-8492 or SIS-3910.',
      };
    }

    const updatedUsers = { ...this.state.users };
    if (currentUser.connectedSiblingId && updatedUsers[currentUser.connectedSiblingId]) {
      updatedUsers[currentUser.connectedSiblingId] = {
        ...updatedUsers[currentUser.connectedSiblingId],
        connectedSiblingId: null,
      };
    }
    if (targetSibling.connectedSiblingId && updatedUsers[targetSibling.connectedSiblingId]) {
      updatedUsers[targetSibling.connectedSiblingId] = {
        ...updatedUsers[targetSibling.connectedSiblingId],
        connectedSiblingId: null,
      };
    }

    updatedUsers[currentUser.id] = {
      ...currentUser,
      connectedSiblingId: targetSibling.id,
    };
    updatedUsers[targetSibling.id] = {
      ...targetSibling,
      connectedSiblingId: currentUser.id,
    };

    const bondId = getBondId(currentUser.id, targetSibling.id);
    let messages = this.state.messages;
    const hasMessages = messages.some((m) => m.bondId === bondId);
    if (!hasMessages) {
      const welcomeMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        bondId,
        senderId: currentUser.id,
        receiverId: targetSibling.id,
        type: 'text',
        text: `Hi ${targetSibling.name}! Connected with your invite code (${targetSibling.inviteCode}).`,
        timestamp: new Date().toISOString(),
        status: targetSibling.online ? 'delivered' : 'sent',
      };
      messages = [...messages, welcomeMsg];
    }

    this.state = { ...this.state, users: updatedUsers, messages };
    this.persistAndBroadcast();
    return { ok: true };
  }

  public disconnectBond(userId: string) {
    const currentUser = this.state.users[userId];
    if (!currentUser) return;
    const siblingId = currentUser.connectedSiblingId;

    const updatedUsers = { ...this.state.users };
    updatedUsers[userId] = { ...currentUser, connectedSiblingId: null };
    if (siblingId && updatedUsers[siblingId]) {
      updatedUsers[siblingId] = { ...updatedUsers[siblingId], connectedSiblingId: null };
    }

    this.state = { ...this.state, users: updatedUsers };
    this.persistAndBroadcast();
  }

  public regenerateInviteCode(userId: string) {
    const user = this.state.users[userId];
    if (!user) return;
    const updated = { ...user, inviteCode: generateInviteCode(user.role) };
    this.state = {
      ...this.state,
      users: { ...this.state.users, [userId]: updated },
    };
    this.persistAndBroadcast();
  }

  public loginOrRegister(payload: {
    mode: 'login' | 'register';
    authMethod: 'phone' | 'email';
    contactValue: string;
    name?: string;
    role?: SiblingRole;
  }): { user: SiblingProfile } {
    const normalized = payload.contactValue.trim().toLowerCase();
    const existing = Object.values(this.state.users).find(
      (u) => u.contactValue.toLowerCase() === normalized
    );

    if (existing) {
      const updated = {
        ...existing,
        online: true,
        lastSeen: new Date().toISOString(),
        name: payload.name && payload.mode === 'register' ? payload.name.trim() : existing.name,
      };
      this.state = {
        ...this.state,
        users: { ...this.state.users, [existing.id]: updated },
      };
      this.persistAndBroadcast();
      return { user: updated };
    }

    const chosenRole: SiblingRole = payload.role === 'sister' ? 'sister' : 'brother';
    const id = `user_${Date.now()}`;
    const newUser: SiblingProfile = {
      id,
      name: (payload.name || (chosenRole === 'brother' ? 'Brother' : 'Sister')).trim(),
      role: chosenRole,
      authMethod: payload.authMethod || 'phone',
      contactValue: payload.contactValue.trim(),
      avatarUrl: chosenRole === 'brother' ? BROTHER_AVATAR : SISTER_AVATAR,
      inviteCode: generateInviteCode(chosenRole),
      connectedSiblingId: null,
      online: true,
      lastSeen: new Date().toISOString(),
      statusNote: 'Connected on Brother & Sister',
      privacy: {
        readReceipts: true,
        onlineStatusVisible: true,
        pushNotifications: true,
        notificationSound: true,
        appLockEnabled: false,
        appLockPin: '1234',
      },
    };

    this.state = {
      ...this.state,
      users: { ...this.state.users, [id]: newUser },
    };
    this.persistAndBroadcast();
    return { user: newUser };
  }
}

export const siblingSync = new SiblingSyncService();
