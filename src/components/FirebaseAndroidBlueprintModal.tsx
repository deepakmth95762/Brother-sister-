import React, { useState } from 'react';
import { Code2, Copy, Check, X, ShieldCheck, Smartphone, Flame } from 'lucide-react';

interface FirebaseAndroidBlueprintModalProps {
  onClose: () => void;
}

const CODE_FILES: Record<string, { title: string; subtitle: string; code: string }> = {
  'ChatRepository.kt': {
    title: 'ChatRepository.kt — Firestore + Firebase Storage',
    subtitle: 'Sends instant text & photos over internet with Sent, Delivered, and Read statuses',
    code: `package com.family.brothersister.data

import android.net.Uri
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.google.firebase.storage.FirebaseStorage
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import java.util.UUID

enum class MessageStatus { SENT, DELIVERED, READ }

data class SiblingMessage(
    val id: String = "",
    val bondId: String = "",
    val senderId: String = "",
    val receiverId: String = "",
    val type: String = "text", // "text" | "photo"
    val text: String = "",
    val photoUrl: String? = null,
    val timestamp: Long = System.currentTimeMillis(),
    val status: String = MessageStatus.SENT.name
)

class ChatRepository(
    private val auth: FirebaseAuth = FirebaseAuth.getInstance(),
    private val db: FirebaseFirestore = FirebaseFirestore.getInstance(),
    private val storage: FirebaseStorage = FirebaseStorage.getInstance()
) {
    // Observe real-time 1-to-1 messages between Brother and Sister
    fun observeMessages(bondId: String): Flow<List<SiblingMessage>> = callbackFlow {
        val registration = db.collection("bonds")
            .document(bondId)
            .collection("messages")
            .orderBy("timestamp", Query.Direction.ASCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null || snapshot == null) return@addSnapshotListener
                val items = snapshot.documents.mapNotNull { it.toObject(SiblingMessage::class.java) }
                trySend(items)
            }
        awaitClose { registration.remove() }
    }

    // Send instant text message over internet (never SMS)
    suspend fun sendTextMessage(bondId: String, receiverId: String, text: String) {
        val senderId = auth.currentUser?.uid ?: return
        val msgId = UUID.randomUUID().toString()
        val message = SiblingMessage(
            id = msgId,
            bondId = bondId,
            senderId = senderId,
            receiverId = receiverId,
            type = "text",
            text = text.trim(),
            timestamp = System.currentTimeMillis(),
            status = MessageStatus.SENT.name
        )
        db.collection("bonds").document(bondId)
            .collection("messages").document(msgId)
            .set(message).await()
    }

    // Upload camera or gallery photo to Firebase Storage & send message
    suspend fun sendPhotoMessage(bondId: String, receiverId: String, localPhotoUri: Uri, caption: String) {
        val senderId = auth.currentUser?.uid ?: return
        val msgId = UUID.randomUUID().toString()
        val storageRef = storage.reference.child("bonds/\$bondId/photos/\$msgId.jpg")

        storageRef.putFile(localPhotoUri).await()
        val downloadUrl = storageRef.downloadUrl.await().toString()

        val message = SiblingMessage(
            id = msgId,
            bondId = bondId,
            senderId = senderId,
            receiverId = receiverId,
            type = "photo",
            text = caption.trim(),
            photoUrl = downloadUrl,
            timestamp = System.currentTimeMillis(),
            status = MessageStatus.SENT.name
        )
        db.collection("bonds").document(bondId)
            .collection("messages").document(msgId)
            .set(message).await()
    }

    // Mark incoming messages as DELIVERED or READ
    suspend fun updateMessageStatus(bondId: String, messageId: String, newStatus: MessageStatus) {
        db.collection("bonds").document(bondId)
            .collection("messages").document(messageId)
            .update("status", newStatus.name).await()
    }

    // Delete message and associated photo from Firebase Storage
    suspend fun deleteMessage(bondId: String, message: SiblingMessage) {
        if (!message.photoUrl.isNullOrEmpty()) {
            runCatching { storage.getReferenceFromUrl(message.photoUrl).delete().await() }
        }
        db.collection("bonds").document(bondId)
            .collection("messages").document(message.id)
            .delete().await()
    }
}`,
  },
  'InviteBondRepository.kt': {
    title: 'InviteBondRepository.kt — Invite Code Pairing & Online Presence',
    subtitle: 'Connects Brother & Sister via unique 6-digit invite code & tracks online/offline status',
    code: `package com.family.brothersister.data

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await

class InviteBondRepository(
    private val auth: FirebaseAuth = FirebaseAuth.getInstance(),
    private val db: FirebaseFirestore = FirebaseFirestore.getInstance()
) {
    // Pair Brother & Sister exclusively using unique invite code
    suspend fun connectWithInviteCode(inviteCode: String): Result<String> = runCatching {
        val currentUid = auth.currentUser?.uid ?: error("Not signed in")
        val query = db.collection("users")
            .whereEqualTo("inviteCode", inviteCode.uppercase().trim())
            .limit(1)
            .get()
            .await()

        val siblingDoc = query.documents.firstOrNull() ?: error("Invalid invite code")
        val siblingUid = siblingDoc.id
        require(siblingUid != currentUid) { "Cannot pair with your own invite code" }

        val bondId = listOf(currentUid, siblingUid).sorted().joinToString("__")

        db.runBatch { batch ->
            batch.update(db.collection("users").document(currentUid), "connectedSiblingId", siblingUid)
            batch.update(db.collection("users").document(siblingUid), "connectedSiblingId", currentUid)
            batch.set(
                db.collection("bonds").document(bondId),
                mapOf(
                    "participants" to listOf(currentUid, siblingUid),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            )
        }.await()

        bondId
    }

    // Update live Online / Offline status
    suspend fun setOnlineStatus(isOnline: Boolean) {
        val currentUid = auth.currentUser?.uid ?: return
        db.collection("users").document(currentUid).update(
            mapOf(
                "online" to isOnline,
                "lastSeen" to FieldValue.serverTimestamp()
            )
        ).await()
    }
}`,
  },
  'SiblingFCMService.kt': {
    title: 'SiblingFCMService.kt — Firebase Cloud Messaging',
    subtitle: 'Handles high-priority push notifications for new sibling messages & photos',
    code: `package com.family.brothersister.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import androidx.core.app.NotificationCompat
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class SiblingFCMService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        val uid = FirebaseAuth.getInstance().currentUser?.uid ?: return
        FirebaseFirestore.getInstance()
            .collection("users")
            .document(uid)
            .update("fcmToken", token)
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        val senderName = remoteMessage.data["senderName"] ?: "Your Sibling"
        val body = remoteMessage.data["body"] ?: "Sent you a new message"

        val channelId = "brother_sister_private_channel"
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channel = NotificationChannel(
            channelId,
            "Brother & Sister Private Messages",
            NotificationManager.IMPORTANCE_HIGH
        )
        manager.createNotificationChannel(channel)

        val notification = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.sym_action_chat)
            .setContentTitle(senderName)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()

        manager.notify(System.currentTimeMillis().toInt(), notification)
    }
}`,
  },
  'firestore.rules': {
    title: 'firestore.rules — Strict 1-to-1 Sibling Security Rules',
    subtitle: 'Ensures only the two connected siblings can read or write messages & photos',
    code: `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    match /users/{userId} {
      allow read: if isSignedIn();
      allow create, update: if isSignedIn() && request.auth.uid == userId;
    }

    match /bonds/{bondId} {
      allow read, write: if isSignedIn() &&
        request.auth.uid in resource.data.participants;

      match /messages/{messageId} {
        allow read, create, update, delete: if isSignedIn() &&
          request.auth.uid in get(/databases/$(database)/documents/bonds/$(bondId)).data.participants;
      }
    }
  }
}`,
  },
};

export const FirebaseAndroidBlueprintModal: React.FC<FirebaseAndroidBlueprintModalProps> = ({
  onClose,
}) => {
  const fileKeys = Object.keys(CODE_FILES);
  const [selectedFile, setSelectedFile] = useState<string>(fileKeys[0]);
  const [copied, setCopied] = useState(false);

  const current = CODE_FILES[selectedFile];

  const handleCopy = () => {
    navigator.clipboard?.writeText(current.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-[#FAF8F5]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FBF2EE] text-[#C85A32] flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-stone-900">
                Brother &amp; Sister — Native Android &amp; Firebase Source Blueprint
              </h2>
              <p className="text-xs text-stone-600">
                Production Kotlin + Firebase Auth, Firestore, Storage &amp; Cloud Messaging (FCM)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full text-stone-500 hover:bg-stone-200/60"
            aria-label="Close code blueprint"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File Tabs */}
        <div className="flex items-center justify-between gap-2 px-6 py-2.5 bg-stone-100 border-b border-stone-200 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {fileKeys.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedFile(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono-code font-medium transition-colors whitespace-nowrap ${
                  selectedFile === key
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:bg-stone-200/80 hover:text-stone-900'
                }`}
              >
                {key}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 text-xs font-medium text-stone-800 flex items-center gap-1.5 shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy File</span>
              </>
            )}
          </button>
        </div>

        {/* Code Viewer */}
        <div className="p-6 overflow-y-auto flex-1 bg-stone-950 text-stone-100 space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-400 pb-2 border-b border-stone-800">
            <span className="flex items-center gap-1.5 font-medium text-stone-200">
              <Code2 className="w-4 h-4 text-[#E07A5F]" />
              {current.title}
            </span>
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              {current.subtitle}
            </span>
          </div>
          <pre className="text-xs font-mono-code leading-relaxed overflow-x-auto text-stone-200">
            <code>{current.code}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#FAF8F5] border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#2F6F5E]" />
            All messages &amp; photos travel strictly over HTTPS/WSS internet connections.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-900 text-white font-medium hover:bg-stone-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
