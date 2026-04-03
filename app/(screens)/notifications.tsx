import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  auth,
  firestore,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  getDocs,
  deleteDoc,
  addDoc,
  serverTimestamp,
  getDoc,
} from '../../firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

type AlertType = 'match_invite' | 'booking_confirm' | 'match_result' | 'new_player' | 'reminder' | 'join_request';

type AlertItem = {
  id: string;
  type: AlertType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  actionLabel?: string;
  requestId?: string;
  matchId?: string;
  requesterName?: string;
  requesterLevel?: string | number;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INITIAL_ALERTS: AlertItem[] = [];

// ─── Icon config per alert type ───────────────────────────────────────────────

const ALERT_CONFIG: Record<AlertType, { icon: string; bg: string; color: string }> = {
  match_invite:    { icon: 'people-outline',       bg: '#eef2ff', color: '#4F46E5' },
  booking_confirm: { icon: 'calendar-outline',     bg: '#f0faf6', color: '#00A86B' },
  match_result:    { icon: 'trophy-outline',       bg: '#fff8ee', color: '#F5A623' },
  new_player:      { icon: 'person-add-outline',   bg: '#fdf2fb', color: '#9C27B0' },
  reminder:        { icon: 'alarm-outline',        bg: '#fdecea', color: '#E53935' },
  join_request:    { icon: 'person-add-outline',   bg: '#eff6ff', color: '#4F46E5' },
};

// ─── Alert Card ───────────────────────────────────────────────────────────────

function AlertCard({
  item,
  onRead,
  onAccept,
  onReject,
}: {
  item: AlertItem;
  onRead: (id: string) => void;
  onAccept?: (id: string, requestId: string, matchId: string) => void;
  onReject?: (id: string, requestId: string) => void;
}) {
  const cfg = ALERT_CONFIG[item.type];
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAccept = async () => {
    if (onAccept && item.requestId && item.matchId) {
      setIsProcessing(true);
      await onAccept(item.id, item.requestId, item.matchId);
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (onReject && item.requestId) {
      setIsProcessing(true);
      await onReject(item.id, item.requestId);
      setIsProcessing(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.alertCard, !item.read && styles.alertCardUnread]}
      activeOpacity={0.85}
      onPress={() => onRead(item.id)}
    >
      {/* Unread dot */}
      {!item.read && <View style={styles.unreadDot} />}

      <View style={[styles.alertIcon, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
      </View>

      <View style={styles.alertBody}>
        <View style={styles.alertTopRow}>
          <Text style={[styles.alertTitle, !item.read && styles.alertTitleUnread]}>
            {item.title}
          </Text>
          <Text style={styles.alertTime}>{item.time}</Text>
        </View>
        <Text style={styles.alertText} numberOfLines={2}>
          {item.body}
        </Text>
        {item.type === 'join_request' && item.requestId && item.matchId ? (
          <View style={styles.requestButtonsRow}>
            <TouchableOpacity
              style={[styles.requestBtn, styles.acceptBtn]}
              onPress={handleAccept}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                  <Text style={styles.requestBtnText}>Accepteer</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.requestBtn, styles.rejectBtn]}
              onPress={handleReject}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#E53935" />
              ) : (
                <>
                  <Ionicons name="close" size={16} color="#E53935" />
                  <Text style={[styles.requestBtnText, { color: '#E53935' }]}>Weiger</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : item.actionLabel ? (
          <TouchableOpacity style={[styles.actionChip, { borderColor: cfg.color }]}>
            <Text style={[styles.actionChipText, { color: cfg.color }]}>{item.actionLabel}</Text>
            <Ionicons name="arrow-forward" size={12} color={cfg.color} />
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    // Set up real-time listener for notifications
    const q = query(
      collection(firestore, 'notifications'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: AlertItem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate?.() || new Date();
        const timeAgo = getTimeAgo(createdAt);

        items.push({
          id: doc.id,
          type: data.type || 'reminder',
          title: data.title || '',
          body: data.body || '',
          time: timeAgo,
          read: data.status !== 'unread',
          actionLabel: data.type === 'join_request' ? undefined : data.actionLabel,
          requestId: data.requestId,
          matchId: data.matchId,
          requesterName: data.requesterName,
          requesterLevel: data.requesterLevel,
        });
      });

      setAlerts(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const unreadCount = alerts.filter((a) => !a.read).length;

  const markRead = async (id: string) => {
    try {
      await updateDoc(doc(firestore, 'notifications', id), {
        status: 'read',
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllRead = async () => {
    try {
      for (const alert of alerts) {
        if (!alert.read) {
          await updateDoc(doc(firestore, 'notifications', alert.id), {
            status: 'read',
          });
        }
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleAcceptRequest = async (notificationId: string, requestId: string, matchId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Get the join request
      const joinRequestRef = doc(firestore, 'joinRequests', requestId);
      const joinRequestSnap = await getDoc(joinRequestRef);
      
      if (!joinRequestSnap.exists()) {
        Alert.alert('Fout', 'Aanvraag niet gevonden.');
        return;
      }

      const targetRequest = joinRequestSnap.data();

      // Check if request is still pending (prevent duplicate acceptances)
      if (targetRequest.status !== 'pending') {
        Alert.alert('Fout', 'Deze aanvraag is al verwerkt.');
        return;
      }

      // Get match
      const matchRef = doc(firestore, 'matches', matchId);
      const matchSnap = await getDoc(matchRef);
      if (!matchSnap.exists()) {
        Alert.alert('Fout', 'Wedstrijd niet gevonden.');
        return;
      }

      const matchData = matchSnap.data();

      // Check if user is already in the match (prevent duplicate)
      if (matchData.playerIds && matchData.playerIds.includes(targetRequest.userId)) {
        Alert.alert('Fout', 'Deze speler is al toegevoegd aan de wedstrijd.');
        return;
      }

      const emptyIndex = matchData.players.findIndex((p: any) => !p.id);

      if (emptyIndex === -1) {
        Alert.alert('Fout', 'Deze wedstrijd is al vol.');
        return;
      }

      // Add the requesting user to the match
      const updatedPlayers = [...matchData.players];
      updatedPlayers[emptyIndex] = {
        id: targetRequest.userId,
        name: targetRequest.userName,
        level: targetRequest.userLevel,
        team: targetRequest.requestedTeam,
        avatar: targetRequest.userAvatar || '',
      };

      const isNowFull = updatedPlayers.filter((p: any) => !p.id).length === 0;

      await updateDoc(matchRef, {
        players: updatedPlayers,
        playerIds: [...matchData.playerIds, targetRequest.userId],
        status: isNowFull ? 'full' : 'open',
      });

      // Update the join request
      await updateDoc(joinRequestRef, { status: 'accepted' });

      // Update user's match history
      await updateDoc(doc(firestore, 'users', targetRequest.userId), {
        allTimeMatchIds: [...(matchData.playerIds || []), matchId],
      }).catch(() => {});

      // Delete the notification
      await deleteDoc(doc(firestore, 'notifications', notificationId));

      Alert.alert('Succes', `${targetRequest.userName} is toegevoegd aan je wedstrijd!`);
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Fout', 'Kon de aanvraag niet accepteren. Probeer het later opnieuw.');
    }
  };

  const handleRejectRequest = async (notificationId: string, requestId: string) => {
    try {
      // Update the join request
      await updateDoc(doc(firestore, 'joinRequests', requestId), {
        status: 'rejected',
      });

      // Delete the notification
      await deleteDoc(doc(firestore, 'notifications', notificationId));

      Alert.alert('Succes', 'Je hebt het verzoek afgewezen.');
    } catch (error) {
      console.error('Error rejecting request:', error);
      Alert.alert('Fout', 'Kon het verzoek niet afwijzen. Probeer het later opnieuw.');
    }
  };

  const todayAlerts = alerts.filter((a) =>
    ['min geleden', 'uur geleden'].some((k) => a.time.includes(k)) || a.time === 'Vandaag'
  );
  const earlierAlerts = alerts.filter((a) => !todayAlerts.includes(a));

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#00A86B" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Meldingen</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={markAllRead} disabled={unreadCount === 0}>
          <Text style={[styles.markAllText, unreadCount === 0 && { color: '#ccc' }]}>
            Alles gelezen
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>

        {/* Today */}
        {todayAlerts.length > 0 && (
          <>
            <Text style={styles.groupLabel}>Vandaag</Text>
            {todayAlerts.map((item) => (
              <AlertCard 
                key={item.id} 
                item={item} 
                onRead={markRead}
                onAccept={handleAcceptRequest}
                onReject={handleRejectRequest}
              />
            ))}
          </>
        )}

        {/* Earlier */}
        {earlierAlerts.length > 0 && (
          <>
            <Text style={styles.groupLabel}>Eerder</Text>
            {earlierAlerts.map((item) => (
              <AlertCard 
                key={item.id} 
                item={item} 
                onRead={markRead}
                onAccept={handleAcceptRequest}
                onReject={handleRejectRequest}
              />
            ))}
          </>
        )}

        {alerts.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>Geen meldingen</Text>
            <Text style={styles.emptySub}>Je bent helemaal bij!</Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'net';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min geleden`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} uur geleden`;
  if (seconds < 604800) {
    const days = Math.floor(seconds / 86400);
    return days === 1 ? 'gisteren' : `${days} dagen geleden`;
  }
  return 'eerder';
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#f5f5f5',
  },
  backBtn: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  headerBadge: {
    backgroundColor: '#E53935',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  headerBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  markAllText: { fontSize: 13, fontWeight: '600', color: '#00A86B' },

  listContent: { paddingHorizontal: 16, paddingTop: 4 },

  groupLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#bbb',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 8,
  },

  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  alertCardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: '#00A86B',
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00A86B',
  },
  alertIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  alertBody: { flex: 1 },
  alertTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 8,
  },
  alertTitle: { fontSize: 14, fontWeight: '600', color: '#555', flex: 1 },
  alertTitleUnread: { color: '#1a1a1a', fontWeight: '700' },
  alertTime: { fontSize: 11, color: '#bbb', flexShrink: 0 },
  alertText: { fontSize: 13, color: '#777', lineHeight: 18 },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  actionChipText: { fontSize: 12, fontWeight: '700' },

  requestButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  requestBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  acceptBtn: {
    backgroundColor: '#00A86B',
  },
  rejectBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E53935',
  },
  requestBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },

  empty: { alignItems: 'center', paddingVertical: 80, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#999' },
  emptySub: { fontSize: 13, color: '#bbb' },
});