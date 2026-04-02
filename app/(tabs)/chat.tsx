import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  auth,
  firestore,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
} from '../../firebase';

type Conversation = {
  id: string;
  participantIds: string[];
  participantNames: string[];
  participantAvatars: string[];
  lastMessage: string;
  lastMessageTime: string;
  lastMessageSenderId: string;
  unreadCount: number;
};

export default function ChatScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchUsername, setSearchUsername] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const currentUser = auth.currentUser;

  const normalizeUsername = (text: string) =>
    text.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '').replace(/\s+/g, '');

  const findUserByUsername = async (username: string) => {
    const normalized = normalizeUsername(username);
    if (!normalized) return null;

    const q = query(collection(firestore, 'users'), where('username', '==', normalized));
    const snap = await getDocs(q);
    if (snap.empty) return null;

    const docSnap = snap.docs[0];
    return { id: docSnap.id, ...(docSnap.data() as any) };
  };

  const ensureConversation = async (otherUser: any) => {
    if (!currentUser || !otherUser || otherUser.id === currentUser.uid) {
      return null;
    }

    const pairId = [currentUser.uid, otherUser.id].sort().join('_');
    const convoQuery = query(collection(firestore, 'conversations'), where('pairId', '==', pairId));
    const convoSnap = await getDocs(convoQuery);

    if (!convoSnap.empty) {
      return convoSnap.docs[0].id;
    }

    const conversationDoc = doc(collection(firestore, 'conversations'));
    await setDoc(conversationDoc, {
      pairId,
      participantIds: [currentUser.uid, otherUser.id],
      participantNames: [currentUser.displayName || currentUser.email?.split('@')[0] || '', otherUser.name || otherUser.username || otherUser.email],
      participantAvatars: [currentUser?.photoURL || '', otherUser.avatar || ''],
      lastMessage: '',
      lastMessageTime: serverTimestamp(),
      lastMessageSenderId: '',
      unreadCount: {
        [currentUser.uid]: 0,
        [otherUser.id]: 0,
      },
      createdAt: serverTimestamp(),
    });

    return conversationDoc.id;
  };

  const handleStartDM = async () => {
    if (!searchUsername.trim() || !currentUser) {
      setSearchError('Voer een geldige gebruikersnaam in.');
      return;
    }

    setSearching(true);
    setSearchError('');

    try {
      const otherUser = await findUserByUsername(searchUsername);
      if (!otherUser) {
        setSearchError('Gebruiker niet gevonden.');
        return;
      }

      if (otherUser.id === currentUser.uid) {
        setSearchError('Je kunt niet met jezelf chatten.');
        return;
      }

      const convId = await ensureConversation(otherUser);
      if (!convId) {
        setSearchError('Kan gesprek niet starten.');
        return;
      }

      router.push({ pathname: '/(screens)/chatDetail', params: { conversationId: convId } });
      setSearchUsername('');
    } catch (error) {
      console.error(error);
      setSearchError('Er is een fout opgetreden tijdens zoeken.');
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    // Query conversations where current user is a participant
    const q = query(
      collection(firestore, 'conversations'),
      where('participantIds', 'array-contains', currentUser.uid),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedConversations: Conversation[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            participantIds: data.participantIds || [],
            participantNames: data.participantNames || [],
            participantAvatars: data.participantAvatars || [],
            lastMessage: data.lastMessage || 'No messages yet',
            lastMessageTime: data.lastMessageTime || new Date().toISOString(),
            lastMessageSenderId: data.lastMessageSenderId || '',
            unreadCount: data.unreadCount?.[currentUser.uid] || 0,
          };
        });
        setConversations(fetchedConversations);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching conversations:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const getOtherParticipant = (conversation: Conversation) => {
    const otherIndex = conversation.participantIds.findIndex((id) => id !== currentUser?.uid);
    if (otherIndex < 0) return { name: 'Unknown', avatar: '' };
    return {
      name: conversation.participantNames[otherIndex] || 'Unknown',
      avatar: conversation.participantAvatars[otherIndex] || '',
    };
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Berichten</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Start DM met gebruikersnaam"
          value={searchUsername}
          onChangeText={setSearchUsername}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!searching}
        />
        <TouchableOpacity
          style={[styles.searchButton, searching && styles.searchButtonDisabled]}
          onPress={handleStartDM}
          disabled={searching}
        >
          {searching ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {searchError ? <Text style={styles.searchError}>{searchError}</Text> : null}

      {conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>Geen gesprekken</Text>
          <Text style={styles.emptySubtext}>Je berichten verschijnen hier</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {conversations.map((conversation, index) => {
            const otherParticipant = getOtherParticipant(conversation);
            const hasUnread = conversation.unreadCount > 0;

            return (
              <TouchableOpacity
                key={conversation.id}
                style={[styles.conversationItem, hasUnread && styles.conversationItemUnread]}
                onPress={() =>
                  router.push({
                    pathname: '/(screens)/chatDetail',
                    params: { conversationId: conversation.id },
                  })
                }
                activeOpacity={0.7}
              >
                <View style={styles.conversationLeft}>
                  {otherParticipant.avatar ? (
                    <Image source={{ uri: otherParticipant.avatar }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitial}>
                        {otherParticipant.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <View style={styles.conversationInfo}>
                    <Text style={[styles.participantName, hasUnread && styles.participantNameUnread]}>
                      {otherParticipant.name}
                    </Text>
                    <Text
                      style={[styles.lastMessage, hasUnread && styles.lastMessageUnread]}
                      numberOfLines={1}
                    >
                      {conversation.lastMessageSenderId === currentUser?.uid ? 'You: ' : ''}
                      {conversation.lastMessage}
                    </Text>
                  </View>
                </View>

                <View style={styles.conversationRight}>
                  <Text style={styles.timeText}>{formatTime(conversation.lastMessageTime)}</Text>
                  {hasUnread && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{conversation.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#333',
  },
  centerLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  conversationItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationItemUnread: {
    backgroundColor: '#f5fff9',
  },
  conversationLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00A86B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  conversationInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  participantNameUnread: {
    fontWeight: '700',
  },
  lastMessage: {
    fontSize: 12,
    color: '#999',
  },
  lastMessageUnread: {
    color: '#666',
    fontWeight: '500',
  },
  conversationRight: {
    marginLeft: 12,
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00A86B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#333',
    marginRight: 8,
  },
  searchButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#00A86B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#ccc',
  },
  searchError: {
    color: '#e53935',
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 4,
    fontSize: 12,
  },
});
