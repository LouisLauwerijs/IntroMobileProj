import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';

// ─── Types ────────────────────────────────────────────────────────────────────

type AlertType = 'match_invite' | 'booking_confirm' | 'match_result' | 'new_player' | 'reminder';

type AlertItem = {
  id: string;
  type: AlertType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  actionLabel?: string;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INITIAL_ALERTS: AlertItem[] = [
  {
    id: '1',
    type: 'match_invite',
    title: 'Match uitnodiging',
    body: 'Lars Wouters nodigt je uit voor een wedstrijd op City Padel Club – Vandaag om 20:00.',
    time: '10 min geleden',
    read: false,
    actionLabel: 'Bekijk uitnodiging',
  },
  {
    id: '2',
    type: 'reminder',
    title: 'Wedstrijd herinnering',
    body: 'Je hebt morgen om 10:00 een wedstrijd op Riverside Padel. Vergeet niet op tijd te zijn!',
    time: '1 uur geleden',
    read: false,
    actionLabel: 'Bekijk wedstrijd',
  },
  {
    id: '3',
    type: 'booking_confirm',
    title: 'Reservering bevestigd',
    body: 'Je reservering op Central Sports Hub – Court 2 op vrijdag 07/03 om 18:00 is bevestigd.',
    time: '3 uur geleden',
    read: false,
    actionLabel: 'Bekijk reservering',
  },
  {
    id: '4',
    type: 'match_result',
    title: 'Wedstrijdresultaat verwerkt',
    body: 'Je overwinning tegen Team Rivera (6-4, 6-3) is verwerkt. Je niveau is gestegen naar 3.6!',
    time: 'Gisteren',
    read: true,
  },
  {
    id: '5',
    type: 'new_player',
    title: 'Nieuw speler in jouw buurt',
    body: 'Emma Jacobs (niveau 5.5) is beschikbaar voor een wedstrijd in Berchem deze week.',
    time: 'Gisteren',
    read: true,
    actionLabel: 'Stuur uitnodiging',
  },
  {
    id: '6',
    type: 'match_result',
    title: 'Wedstrijdresultaat verwerkt',
    body: 'Je hebt verloren van Team Dupont (4-6, 5-7). Blijf trainen, je komt er!',
    time: '3 dagen geleden',
    read: true,
  },
  {
    id: '7',
    type: 'booking_confirm',
    title: 'Reservering herinnering',
    body: 'Je hebt morgen een gereserveerde baan op Sportpark Noord om 11:00.',
    time: '4 dagen geleden',
    read: true,
  },
];

// ─── Icon config per alert type ───────────────────────────────────────────────

const ALERT_CONFIG: Record<AlertType, { icon: string; bg: string; color: string }> = {
  match_invite:    { icon: 'people-outline',       bg: '#eef2ff', color: '#4F46E5' },
  booking_confirm: { icon: 'calendar-outline',     bg: '#f0faf6', color: '#00A86B' },
  match_result:    { icon: 'trophy-outline',       bg: '#fff8ee', color: '#F5A623' },
  new_player:      { icon: 'person-add-outline',   bg: '#fdf2fb', color: '#9C27B0' },
  reminder:        { icon: 'alarm-outline',        bg: '#fdecea', color: '#E53935' },
};

// ─── Alert Card ───────────────────────────────────────────────────────────────

function AlertCard({
  item,
  onRead,
}: {
  item: AlertItem;
  onRead: (id: string) => void;
}) {
  const cfg = ALERT_CONFIG[item.type];

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
        {item.actionLabel && (
          <TouchableOpacity style={[styles.actionChip, { borderColor: cfg.color }]}>
            <Text style={[styles.actionChipText, { color: cfg.color }]}>{item.actionLabel}</Text>
            <Ionicons name="arrow-forward" size={12} color={cfg.color} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);

  const unreadCount = alerts.filter((a) => !a.read).length;

  const markRead = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  };

  const markAllRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const todayAlerts = alerts.filter((a) =>
    ['min geleden', 'uur geleden'].some((k) => a.time.includes(k)) || a.time === 'Vandaag'
  );
  const earlierAlerts = alerts.filter((a) => !todayAlerts.includes(a));

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
              <AlertCard key={item.id} item={item} onRead={markRead} />
            ))}
          </>
        )}

        {/* Earlier */}
        {earlierAlerts.length > 0 && (
          <>
            <Text style={styles.groupLabel}>Eerder</Text>
            {earlierAlerts.map((item) => (
              <AlertCard key={item.id} item={item} onRead={markRead} />
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

  empty: { alignItems: 'center', paddingVertical: 80, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#999' },
  emptySub: { fontSize: 13, color: '#bbb' },
});