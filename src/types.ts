export type SiblingRole = 'brother' | 'sister';

export type MessageStatus = 'sent' | 'delivered' | 'read';

export type MessageType = 'text' | 'photo';

export interface PrivacySettings {
  readReceipts: boolean;
  onlineStatusVisible: boolean;
  pushNotifications: boolean;
  notificationSound: boolean;
  appLockEnabled: boolean;
  appLockPin: string;
}

export interface SiblingProfile {
  id: string;
  name: string;
  role: SiblingRole;
  authMethod: 'phone' | 'email';
  contactValue: string;
  avatarUrl: string;
  inviteCode: string;
  connectedSiblingId: string | null;
  online: boolean;
  lastSeen: string;
  statusNote: string;
  privacy: PrivacySettings;
}

export interface ChatMessage {
  id: string;
  bondId: string;
  senderId: string;
  receiverId: string;
  type: MessageType;
  text: string;
  photoUrl?: string;
  timestamp: string;
  status: MessageStatus;
}

export interface PushNotificationEvent {
  id: string;
  targetUserId: string;
  senderId: string;
  senderName: string;
  senderRole: SiblingRole;
  senderAvatar: string;
  title: string;
  body: string;
  photoUrl?: string;
  timestamp: string;
}

export interface AppState {
  users: Record<string, SiblingProfile>;
  messages: ChatMessage[];
  typingByUserId: Record<string, boolean>;
}
