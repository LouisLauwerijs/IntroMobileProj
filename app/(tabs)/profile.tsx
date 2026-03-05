import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';

//Test data

const USER = {
  name: 'Alex Martens',
  email: 'alex.martens@email.com',
  location: 'Antwerpen, BE',
  avatar: 'https://i.pravatar.cc/300?img=11',
  level: 3.5,
  memberSince: 'March 2023',
  stats: {
    matches: 48,
    wins: 31,
    courts: 12,
    winRate: 65,
  },
};

const RECENT_MATCHES = [
  {
    id: '1',
    result: 'Win',
    score: '6-4, 6-3',
    opponent: 'Team Rivera',
    date: '28 Feb',
    court: 'City Padel Club',
  },
  {
    id: '2',
    result: 'Loss',
    score: '4-6, 5-7',
    opponent: 'Team Dupont',
    date: '24 Feb',
    court: 'Riverside Padel',
  },
  {
    id: '3',
    result: 'Win',
    score: '6-2, 7-5',
    opponent: 'Team Santos',
    date: '19 Feb',
    court: 'Central Sports Hub',
  },
];

type SettingItem = {
  icon: string;
  label: string;
  value?: string;
  chevron?: boolean;
  toggle?: boolean;
};

type SettingSection = {
  title: string;
  items: SettingItem[];
};

const SETTINGS_SECTIONS: SettingSection[] = [
  {
    title: 'Account',
    items: [
      { icon: 'person-outline', label: 'Edit Profile', chevron: true },
      { icon: 'card-outline', label: 'Payment Methods', chevron: true },
      { icon: 'notifications-outline', label: 'Notifications', toggle: true },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: 'language-outline', label: 'Language', value: 'Nederlands', chevron: true },
      { icon: 'location-outline', label: 'Default Location', value: 'Antwerpen', chevron: true },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: 'help-circle-outline', label: 'Help & FAQ', chevron: true },
      { icon: 'document-text-outline', label: 'Terms & Privacy', chevron: true },
    ],
  },
];

function LevelBar({ level }: { level: number }) {
  const pct = ((level - 0.5) / 6.5) * 100;
  return (
    <View style={styles.levelBarWrap}>
      <View style={styles.levelBarBg}>
        <View style={[styles.levelBarFill, { width: `${pct}%` as any }]} />
      </View>
      <View style={styles.levelBarLabels}>
        <Text style={styles.levelBarTick}>0.5</Text>
        <Text style={styles.levelBarTick}>3.5</Text>
        <Text style={styles.levelBarTick}>7.0</Text>
      </View>
    </View>
  );
}

//Main screen

export default function ProfileScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profiel</Text>
          <TouchableOpacity style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={22} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Identity Card */}
        <View style={styles.identityCard}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: USER.avatar }} style={styles.avatar} />
            <TouchableOpacity style={styles.avatarEdit}>
              <Ionicons name="camera" size={14} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.identityInfo}>
            <Text style={styles.userName}>{USER.name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color="#999" />
              <Text style={styles.locationText}>{USER.location}</Text>
            </View>
            <Text style={styles.memberSince}>Lid sinds {USER.memberSince}</Text>
          </View>
        </View>

        {/* Level Progress */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="trending-up-outline" size={18} color="#00A86B" />
            <Text style={styles.cardTitle}>Speelniveau</Text>
          </View>
          <LevelBar level={USER.level} />
          <Text style={styles.levelHint}>
            Speel competitieve wedstrijden om je level te verbeteren.
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Wedstrijden', value: USER.stats.matches, icon: 'tennisball-outline' },
            { label: 'Gewonnen', value: USER.stats.wins, icon: 'trophy-outline' },
            { label: 'Winratio', value: `${USER.stats.winRate}%`, icon: 'stats-chart-outline' },
            { label: 'Clubs', value: USER.stats.courts, icon: 'business-outline' },
          ].map((s) => (
            <View key={s.label} style={styles.statBox}>
              <Ionicons name={s.icon as any} size={20} color="#00A86B" style={{ marginBottom: 6 }} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Recent Matches */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="people-outline" size={18} color="#00A86B" />
            <Text style={styles.cardTitle}>Recente Wedstrijden</Text>
          </View>

          {RECENT_MATCHES.map((m, idx) => (
            <View
              key={m.id}
              style={[styles.matchRow, idx < RECENT_MATCHES.length - 1 && styles.matchRowBorder]}
            >
              <View style={[styles.resultBadge, m.result === 'Win' ? styles.winBadge : styles.lossBadge]}>
                <Text style={[styles.resultBadgeText, m.result === 'Win' ? { color: '#00A86B' } : { color: '#E53935' }]}>
                  {m.result === 'Win' ? 'W' : 'V'}
                </Text>
              </View>
              <View style={styles.matchInfo}>
                <Text style={styles.matchOpponent}>{m.opponent}</Text>
                <Text style={styles.matchMeta}>{m.court} · {m.date}</Text>
              </View>
              <Text style={[styles.matchScore, m.result === 'Win' ? styles.scoreWin : styles.scoreLoss]}>
                {m.score}
              </Text>
            </View>
          ))}

          <TouchableOpacity style={styles.viewAllBtn}>
            <Text style={styles.viewAllText}>Alle wedstrijden bekijken</Text>
            <Ionicons name="arrow-forward" size={14} color="#00A86B" />
          </TouchableOpacity>
        </View>

        {/* Settings Sections */}
        {SETTINGS_SECTIONS.map((section) => (
          <View key={section.title} style={styles.card}>
            <Text style={styles.sectionLabel}>{section.title}</Text>
            {section.items.map((item, idx) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.settingRow,
                  idx < section.items.length - 1 && styles.settingRowBorder,
                ]}
                activeOpacity={item.toggle ? 1 : 0.7}
              >
                <View style={styles.settingLeft}>
                  <View style={styles.settingIconWrap}>
                    <Ionicons name={item.icon as any} size={18} color="#00A86B" />
                  </View>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                </View>
                <View style={styles.settingRight}>
                  {item.value && <Text style={styles.settingValue}>{item.value}</Text>}
                  {item.toggle ? (
                    <Switch
                      value={notificationsEnabled}
                      onValueChange={setNotificationsEnabled}
                      trackColor={{ false: '#ddd', true: '#00A86B' }}
                      thumbColor="#fff"
                    />
                  ) : (
                    <Ionicons name="chevron-forward" size={16} color="#ccc" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => router.replace('/login')}
        >
          <Ionicons name="log-out-outline" size={18} color="#E53935" />
          <Text style={styles.logoutText}>Uitloggen</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>PadelMatch v1.0.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  settingsBtn: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  // Identity Card
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#eee' },
  avatarEdit: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#00A86B',
    borderRadius: 10,
    padding: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  identityInfo: { flex: 1 },
  userName: { fontSize: 17, fontWeight: '800', color: '#1a1a1a', marginBottom: 3 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 3 },
  locationText: { fontSize: 12, color: '#999' },
  memberSince: { fontSize: 11, color: '#bbb' },

  // Level Badge
  levelBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 58,
  },
  levelNumber: { fontSize: 22, fontWeight: '900' },
  levelLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', marginTop: 1 },

  // Card
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },

  // Level bar
  levelBarWrap: { marginBottom: 8 },
  levelBarBg: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  levelBarFill: { height: '100%', backgroundColor: '#00A86B', borderRadius: 4 },
  levelBarLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  levelBarTick: { fontSize: 10, color: '#bbb' },
  levelHint: { fontSize: 12, color: '#aaa', marginTop: 4 },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  statLabel: { fontSize: 10, color: '#999', fontWeight: '600', marginTop: 2, textAlign: 'center' },

  // Match rows
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  matchRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  resultBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  winBadge: { backgroundColor: '#e8f8f2' },
  lossBadge: { backgroundColor: '#fdecea' },
  resultBadgeText: { fontSize: 13, fontWeight: '800' },
  matchInfo: { flex: 1 },
  matchOpponent: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  matchMeta: { fontSize: 11, color: '#999', marginTop: 2 },
  matchScore: { fontSize: 13, fontWeight: '700' },
  scoreWin: { color: '#00A86B' },
  scoreLoss: { color: '#E53935' },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  viewAllText: { fontSize: 13, color: '#00A86B', fontWeight: '700' },

  // Settings
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#bbb',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#e8f8f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: { fontSize: 14, fontWeight: '600', color: '#333' },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingValue: { fontSize: 13, color: '#999' },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#E53935' },

  versionText: { textAlign: 'center', fontSize: 11, color: '#ccc', marginTop: 4 },
});