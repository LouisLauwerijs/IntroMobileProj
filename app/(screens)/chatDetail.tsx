import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import {
  auth,
  firestore,
  collection,
  addDoc,
  serverTimestamp,
  doc,
  query,
  orderBy,
  onSnapshot,
  getDoc,
  updateDoc,
} from '../../firebase';

type Message = {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
};

type ConversationData = {
  participantNames: string[];
  participantIds: string[];
  participantAvatars: string[];
};

export default function ChatDetailScreen() {
  const router = useRouter();
  const { conversationId } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationData, setConversationData] = useState<ConversationData | null>(null);
  const flatListRef = useRef(null);
  const currentUser = auth.currentUser;

  const conversationIdStr = Array.isArray(conversationId) ? conversationId[0] : conversationId;

  useEffect(() => {
    if (!conversationIdStr) return;

    // Fetch conversation data
    const conversationRef = doc(firestore, 'conversations', conversationIdStr);
    getDoc(conversationRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as ConversationData;
          setConversationData(data);
        }
      })
      .catch((error) => console.error('Error fetching conversation:', error));

    // Listen to messages
    const q = query(
      collection(firestore, 'conversations', conversationIdStr, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedMessages: Message[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            senderId: data.senderId || '',
            senderName: data.senderName || 'Unknown',
            content: data.content || '',
            timestamp: data.timestamp || new Date().toISOString(),
            isRead: data.isRead || false,
          };
        });
        setMessages(fetchedMessages);
        setLoading(false);

        // Mark messages as read
        if (currentUser) {
          fetchedMessages.forEach((msg) => {
            if (msg.senderId !== currentUser.uid && !msg.isRead) {
              const msgRef = doc(firestore, 'conversations', conversationIdStr, 'messages', msg.id);
              updateDoc(msgRef, { isRead: true }).catch((err) =>
                console.error('Error marking as read:', err)
              );
            }
          });
        }

        // Scroll to bottom
        setTimeout(() => {
          if (flatListRef.current) {
            (flatListRef.current as any).scrollToEnd({ animated: true });
          }
        }, 100);
      },
      (error) => {
        console.error('Error fetching messages:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [conversationIdStr, currentUser]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentUser || !conversationIdStr) return;

    setSending(true);
    try {
      const messagesRef = collection(firestore, 'conversations', conversationIdStr, 'messages');

      await addDoc(messagesRef, {
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email || 'Unknown',
        content: messageText.trim(),
        timestamp: new Date().toISOString(),
        isRead: false,
      });

      // Update conversation's last message
      const conversationRef = doc(firestore, 'conversations', conversationIdStr);
      await updateDoc(conversationRef, {
        lastMessage: messageText.trim(),
        lastMessageTime: new Date().toISOString(),
        lastMessageSenderId: currentUser.uid,
      });

      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getOtherParticipant = () => {
    if (!conversationData || !currentUser) return { name: 'Unknown', avatar: '' };
    const otherIndex = conversationData.participantIds.findIndex((id) => id !== currentUser.uid);
    if (otherIndex < 0) return { name: 'Unknown', avatar: '' };
    return {
      name: conversationData.participantNames[otherIndex] || 'Unknown',
      avatar: conversationData.participantAvatars[otherIndex] || '',
    };
  };

  const otherParticipant = getOtherParticipant();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color="#00A86B" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        style={styles.keyboardAvoid}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            {otherParticipant.avatar ? (
              <Image source={{ uri: otherParticipant.avatar }} style={styles.headerAvatar} />
            ) : (
              <View style={styles.headerAvatarPlaceholder}>
                <Text style={styles.headerAvatarInitial}>
                  {otherParticipant.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.headerTitle}>{otherParticipant.name}</Text>
          </View>

          <View style={styles.headerRightPlaceholder} />
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isCurrentUser = item.senderId === currentUser?.uid;
            return (
              <View
                style={[
                  styles.messageWrapper,
                  isCurrentUser ? styles.messageWrapperOwn : styles.messageWrapperOther,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    isCurrentUser ? styles.messageBubbleOwn : styles.messageBubbleOther,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      isCurrentUser ? styles.messageTextOwn : styles.messageTextOther,
                    ]}
                  >
                    {item.content}
                  </Text>
                  <Text
                    style={[
                      styles.messageTime,
                      isCurrentUser ? styles.messageTimeOwn : styles.messageTimeOther,
                    ]}
                  >
                    {formatMessageTime(item.timestamp)}
                    {isCurrentUser && item.isRead && ' ✓✓'}
                  </Text>
                </View>
              </View>
            );
          }}
          contentContainerStyle={styles.messagesContainer}
          scrollEnabled={true}
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Bericht..."
            placeholderTextColor="#ccc"
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxHeight={100}
            editable={!sending}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!messageText.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  keyboardAvoid: {
    flex: 1,
  },
  centerLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  headerAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00A86B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerAvatarInitial: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  headerRightPlaceholder: {
    width: 40,
  },
  messagesContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  messageWrapper: {
    marginVertical: 4,
    flexDirection: 'row',
  },
  messageWrapperOwn: {
    justifyContent: 'flex-end',
  },
  messageWrapperOther: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  messageBubbleOwn: {
    backgroundColor: '#00A86B',
  },
  messageBubbleOther: {
    backgroundColor: '#e8e8e8',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  messageTextOwn: {
    color: '#fff',
  },
  messageTextOther: {
    color: '#333',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  messageTimeOwn: {
    color: '#d0f0e0',
  },
  messageTimeOther: {
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    color: '#333',
    fontSize: 14,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00A86B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});
