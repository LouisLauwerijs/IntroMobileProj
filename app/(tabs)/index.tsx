import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, SafeAreaView, ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const upcomingMatches = [
  {
    id: '1',
    club: 'City Padel Club',
    date: 'Today',
    time: '18:00',
    court: 'Court 3',
    players: [
      { name: 'Alex', level: '3.5' },
      { name: 'Sarah', level: '3.0' },
      { name: 'Open', level: null },
      { name: 'Open', level: null },
    ],
    type: 'Public',
  },
  {
    id: '2',
    club: 'Sportpark Noord',
    date: 'Tomorrow',
    time: '10:00',
    court: 'Court 1',
    players: [
      { name: 'Alex', level: '3.5' },
      { name: 'Tom', level: '3.5' },
      { name: 'Marc', level: '4.0' },
      { name: 'Open', level: null },
    ],
    type: 'Private',
  },
];

const nearbyClubs = [
  { id: '1', name: 'City Padel Club', distance: '0.5 km', courts: 6, image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&q=80' },
  { id: '2', name: 'Riverside Padel', distance: '1.2 km', courts: 4, image: 'https://images.unsplash.com/photo-1680181864755-8f6f5537b92c?w=400&q=80' },
  { id: '3', name: 'Sportpark Noord', distance: '3.1 km', courts: 8, image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=400&q=80' },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.username}>Alex 👋</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="search-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              <View style={styles.notifDot} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatar}>
              <Text style={styles.avatarText}>A</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Level Badge */}
        <View style={styles.levelCard}>
          <View style={styles.levelLeft}>
            <Text style={styles.levelLabel}>YOUR LEVEL</Text>
            <Text style={styles.levelValue}>3.5</Text>
            <Text style={styles.levelSub}>Intermediate · 24 matches played</Text>
          </View>
          <View style={styles.levelRight}>
            <View style={styles.winRate}>
              <Text style={styles.winRateNum}>62%</Text>
              <Text style={styles.winRateLabel}>Win rate</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.winRate}>
              <Text style={styles.winRateNum}>18</Text>
              <Text style={styles.winRateLabel}>Wins</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionPrimary} onPress={() => router.push('/book/courts')}>
            <Ionicons name="calendar" size={20} color="#0D0D0D" />
            <Text style={styles.actionPrimaryText}>Book a Court</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionSecondary} onPress={() => router.push('/matches')}>
            <Ionicons name="people-outline" size={20} color="#00D68F" />
            <Text style={styles.actionSecondaryText}>Find Match</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming Matches */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Matches</Text>
          <TouchableOpacity onPress={() => router.push('/matches')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {upcomingMatches.map((match) => (
          <TouchableOpacity key={match.id} style={styles.matchCard}>
            <View style={styles.matchTop}>
              <View style={styles.matchDateBlock}>
                <Text style={styles.matchDate}>{match.date}</Text>
                <Text style={styles.matchTime}>{match.time}</Text>
              </View>
              <View style={[styles.matchTypeBadge, match.type === 'Public' && styles.badgePublic]}>
                <Text style={styles.matchTypeText}>{match.type}</Text>
              </View>
            </View>
            <Text style={styles.matchClub}>{match.club} · {match.court}</Text>
            <View style={styles.playersRow}>
              {match.players.map((p, i) => (
                <View key={i} style={[styles.playerChip, !p.level && styles.playerChipOpen]}>
                  <Text style={[styles.playerName, !p.level && styles.playerNameOpen]}>
                    {p.name}
                  </Text>
                  {p.level && <Text style={styles.playerLevel}>{p.level}</Text>}
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}

        {/* Nearby Clubs */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Clubs Near You</Text>
          <TouchableOpacity onPress={() => router.push('/book/courts')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.clubsScroll}>
          {nearbyClubs.map((club) => (
            <TouchableOpacity key={club.id} style={styles.clubCard} onPress={() => router.push('/book/courts')}>
              <ImageBackground
                source={{ uri: club.image }}
                style={styles.clubImage}
                imageStyle={{ borderRadius: 14 }}
              >
                <View style={styles.clubOverlay}>
                  <Text style={styles.clubName}>{club.name}</Text>
                  <Text style={styles.clubMeta}>{club.distance} · {club.courts} courts</Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          ))}
        </ScrollView>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  scroll: { paddingBottom: 32 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
  },
  greeting: { fontSize: 13, color: '#888' },
  username: { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { padding: 8, position: 'relative' },
  notifDot: {
    position: 'absolute', top: 6, right: 6,
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#00D68F',
  },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#00D68F', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '800', color: '#0D0D0D' },

  levelCard: {
    marginHorizontal: 20, backgroundColor: '#1A1A1A', borderRadius: 16,
    padding: 18, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  levelLeft: {},
  levelLabel: { fontSize: 11, color: '#00D68F', fontWeight: '700', letterSpacing: 1 },
  levelValue: { fontSize: 44, fontWeight: '900', color: '#fff', lineHeight: 50 },
  levelSub: { fontSize: 12, color: '#666', marginTop: 2 },
  levelRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  winRate: { alignItems: 'center' },
  winRateNum: { fontSize: 22, fontWeight: '800', color: '#fff' },
  winRateLabel: { fontSize: 11, color: '#666', marginTop: 2 },
  divider: { width: 1, height: 36, backgroundColor: '#2A2A2A' },

  quickActions: { flexDirection: 'row', gap: 10, marginHorizontal: 20, marginBottom: 28 },
  actionPrimary: {
    flex: 1, backgroundColor: '#00D68F', borderRadius: 12,
    paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  actionPrimaryText: { fontSize: 15, fontWeight: '800', color: '#0D0D0D' },
  actionSecondary: {
    flex: 1, backgroundColor: '#1A1A1A', borderRadius: 12,
    paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#00D68F',
  },
  actionSecondaryText: { fontSize: 15, fontWeight: '800', color: '#00D68F' },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  seeAll: { fontSize: 13, color: '#00D68F', fontWeight: '600' },

  matchCard: {
    backgroundColor: '#1A1A1A', marginHorizontal: 20, borderRadius: 14,
    padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#2A2A2A',
  },
  matchTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  matchDateBlock: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  matchDate: { fontSize: 13, fontWeight: '700', color: '#fff' },
  matchTime: { fontSize: 13, color: '#888' },
  matchTypeBadge: {
    backgroundColor: '#1E2D24', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  badgePublic: { backgroundColor: '#1E2D24' },
  matchTypeText: { fontSize: 11, color: '#00D68F', fontWeight: '700' },
  matchClub: { fontSize: 14, color: '#AAA', marginBottom: 12 },
  playersRow: { flexDirection: 'row', gap: 8 },
  playerChip: {
    flex: 1, backgroundColor: '#252525', borderRadius: 8,
    padding: 8, alignItems: 'center',
  },
  playerChipOpen: { borderWidth: 1, borderColor: '#333', borderStyle: 'dashed', backgroundColor: 'transparent' },
  playerName: { fontSize: 12, fontWeight: '700', color: '#fff' },
  playerNameOpen: { color: '#555' },
  playerLevel: { fontSize: 11, color: '#00D68F', marginTop: 2 },

  clubsScroll: { paddingLeft: 20 },
  clubCard: { marginRight: 12, width: 180 },
  clubImage: { width: 180, height: 120, justifyContent: 'flex-end' },
  clubOverlay: {
    padding: 10, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  clubName: { fontSize: 13, fontWeight: '700', color: '#fff' },
  clubMeta: { fontSize: 11, color: '#ccc', marginTop: 2 },
});
