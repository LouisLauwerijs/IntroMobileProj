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
import { Avatar } from '../../components/Avatar';
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
  increment,
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
  const [otherUser, setOtherUser] = useState<{ name: string; avatar: string } | null>(null);
  const flatListRef = useRef(null);
  const currentUser = auth.currentUser;

  const conversationIdStr = Array.isArray(conversationId) ? conversationId[0] : conversationId;

  useEffect(() => {
    if (!conversationIdStr || !currentUser) return;

    // Fetch conversation data
    const conversationRef = doc(firestore, 'conversations', conversationIdStr);
    getDoc(conversationRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as ConversationData;
          setConversationData(data);
          
          // Identify other user and listen to their profile
          const otherId = data.participantIds.find(id => id !== currentUser.uid);
          if (otherId) {
            onSnapshot(doc(firestore, 'users', otherId), (userSnap) => {
              if (userSnap.exists()) {
                const uData = userSnap.data();
                setOtherUser({
                  name: uData.username || uData.name || 'Gebruiker',
                  avatar: uData.avatar || '',
                });
              }
            });
          }
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

          // reset unread counter in conversation
          const conversationRef = doc(firestore, 'conversations', conversationIdStr);
          updateDoc(conversationRef, {
            [`unreadCount.${currentUser.uid}`]: 0,
          }).catch((err) => console.error('Error resetting unread count:', err));
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

      // Update conversation's last message and increment other user's unread counter
      const conversationRef = doc(firestore, 'conversations', conversationIdStr);
      const otherUserId = conversationData?.participantIds?.find((id) => id !== currentUser.uid);
      const unreadUpdate: any = {
        lastMessage: messageText.trim(),
        lastMessageTime: new Date().toISOString(),
        lastMessageSenderId: currentUser.uid,
      };
      if (otherUserId) {
        unreadUpdate[`unreadCount.${otherUserId}`] = increment(1);
      }
      await updateDoc(conversationRef, unreadUpdate);

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
            <Avatar uri={otherUser?.avatar} size={38} style={{ marginRight: 12 }} />
            <Text style={styles.headerTitle}>{otherUser?.name || 'Laden...'}</Text>
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
                  <View style={styles.messageBottomRow}>
                    <Text
                      style={[
                        styles.messageTime,
                        isCurrentUser ? styles.messageTimeOwn : styles.messageTimeOther,
                      ]}
                    >
                      {formatMessageTime(item.timestamp)}
                    </Text>
                    {isCurrentUser && (
                      <Ionicons 
                        name="checkmark-done" 
                        size={14} 
                        color={item.isRead ? '#fff' : 'rgba(255,255,255,0.5)'} 
                        style={{ marginLeft: 4 }}
                      />
                    )}
                  </View>
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
            style={[styles.input, { maxHeight: 100 }]}
            placeholder="Typ een bericht..."
            placeholderTextColor="#999"
            value={messageText}
            onChangeText={setMessageText}
            multiline
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
    backgroundColor: '#f5f5f5',
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
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 12,
  },
  headerAvatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#00A86B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerRightPlaceholder: {
    width: 40,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  messageWrapper: {
    marginVertical: 6,
    flexDirection: 'row',
    width: '100%',
  },
  messageWrapperOwn: {
    justifyContent: 'flex-end',
  },
  messageWrapperOther: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  messageBubbleOwn: {
    backgroundColor: '#00A86B',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextOwn: {
    color: '#fff',
  },
  messageTextOther: {
    color: '#333',
  },
  messageBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 10,
  },
  messageTimeOwn: {
    color: 'rgba(255,255,255,0.7)',
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
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#f0f2f5',
    color: '#1a1a1a',
    fontSize: 15,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00A86B',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
});
