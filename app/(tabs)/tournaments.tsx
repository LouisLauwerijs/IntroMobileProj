import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

const TABS = ['Rankings', 'Tournaments', 'Leagues'];

const rankings = [
  { rank: 1, name: 'Roel Maes', level: '4.5', wins: 32, matches: 40, winRate: 80, change: 'up', avatar: 'R', points: 1840 },
  { rank: 2, name: 'Kaat De Smedt', level: '4.5', wins: 28, matches: 36, winRate: 78, change: 'up', avatar: 'K', points: 1780 },
  { rank: 3, name: 'Marc Peeters', level: '4.0', wins: 25, matches: 34, winRate: 74, change: 'same', avatar: 'M', points: 1720 },
  { rank: 4, name: 'Alex Janssen', level: '3.5', wins: 18, matches: 24, winRate: 75, change: 'up', avatar: 'A', points: 1520, isMe: true },
  { rank: 5, name: 'Tom Vervloet', level: '3.5', wins: 17, matches: 25, winRate: 68, change: 'down', avatar: 'T', points: 1490 },
  { rank: 6, name: 'Lisa Bogaert', level: '3.5', wins: 16, matches: 24, winRate: 67, change: 'down', avatar: 'L', points: 1460 },
  { rank: 7, name: 'Nina Claeys', level: '3.0', wins: 14, matches: 22, winRate: 64, change: 'up', avatar: 'N', points: 1380 },
  { rank: 8, name: 'Sarah Willems', level: '3.0', wins: 12, matches: 20, winRate: 60, change: 'same', avatar: 'S', points: 1310 },
];

const tournaments = [
  {
    id: '1',
    name: 'Antwerp Open',
    date: 'Mar 15–16',
    club: 'City Padel Club',
    format: 'Americano',
    level: '3.0–4.0',
    spots: 4,
    totalSpots: 32,
    price: 25,
    status: 'open',
  },
  {
    id: '2',
    name: 'Spring League Round 3',
    date: 'Mar 22',
    club: 'Sportpark Noord',
    format: 'Round Robin',
    level: '3.5–4.5',
    spots: 8,
    totalSpots: 16,
    price: 15,
    status: 'open',
  },
  {
    id: '3',
    name: 'Winter Championship',
    date: 'Feb 28',
    club: 'Riverside Padel',
    format: 'Knockout',
    level: 'All',
    spots: 0,
    totalSpots: 24,
    price: 20,
    status: 'finished',
  },
];

function RankChange({ change }: { change: string }) {
  if (change === 'up') return <Ionicons name="caret-up" size={12} color="#00D68F" />;
  if (change === 'down') return <Ionicons name="caret-down" size={12} color="#FF5B5B" />;
  return <Ionicons name="remove" size={12} color="#555" />;
}

export default function TournamentsScreen() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Compete</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === i && styles.tabActive]}
            onPress={() => setActiveTab(i)}
          >
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* RANKINGS */}
        {activeTab === 0 && (
          <View>
            {/* My position highlight */}
            <View style={styles.myRankCard}>
              <View>
                <Text style={styles.myRankLabel}>YOUR RANKING</Text>
                <Text style={styles.myRankValue}>#4</Text>
                <Text style={styles.myRankSub}>+2 positions this month</Text>
              </View>
              <View style={styles.myRankRight}>
                <Text style={styles.myPoints}>1520</Text>
                <Text style={styles.myPointsLabel}>points</Text>
              </View>
            </View>

            {/* Leaderboard */}
            <View style={styles.leaderboard}>
              {rankings.map((player) => (
                <View key={player.rank} style={[styles.rankRow, player.isMe && styles.rankRowMe]}>
                  <Text style={[styles.rankNum, player.rank <= 3 && styles.rankNumTop]}>
                    {player.rank <= 3 ? ['🥇', '🥈', '🥉'][player.rank - 1] : `#${player.rank}`}
                  </Text>
                  <View style={[styles.rankAvatar, player.isMe && styles.rankAvatarMe]}>
                    <Text style={styles.rankAvatarText}>{player.avatar}</Text>
                  </View>
                  <View style={styles.rankInfo}>
                    <View style={styles.rankNameRow}>
                      <Text style={[styles.rankName, player.isMe && styles.rankNameMe]}>{player.name}</Text>
                      {player.isMe && <Text style={styles.youBadge}>YOU</Text>}
                    </View>
                    <Text style={styles.rankLevel}>Level {player.level} · {player.wins}W / {player.matches}M</Text>
                  </View>
                  <View style={styles.rankRight}>
                    <Text style={styles.rankPoints}>{player.points}</Text>
                    <RankChange change={player.change} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* TOURNAMENTS */}
        {activeTab === 1 && tournaments.map(t => (
          <TouchableOpacity key={t.id} style={styles.tournCard}>
            <View style={styles.tournHeader}>
              <View>
                <Text style={styles.tournName}>{t.name}</Text>
                <View style={styles.tournMeta}>
                  <Ionicons name="calendar-outline" size={12} color="#666" />
                  <Text style={styles.tournMetaText}>{t.date}</Text>
                  <Text style={styles.dot}>·</Text>
                  <Ionicons name="location-outline" size={12} color="#666" />
                  <Text style={styles.tournMetaText}>{t.club}</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, t.status === 'finished' && styles.statusFinished]}>
                <Text style={[styles.statusText, t.status === 'finished' && styles.statusTextFinished]}>
                  {t.status === 'open' ? 'Open' : 'Finished'}
                </Text>
              </View>
            </View>

            <View style={styles.tournDetails}>
              {[
                { icon: 'people-outline', text: t.format },
                { icon: 'stats-chart-outline', text: t.level },
                { icon: 'person-outline', text: `${t.totalSpots - t.spots}/${t.totalSpots} players` },
              ].map(d => (
                <View key={d.text} style={styles.tournDetail}>
                  <Ionicons name={d.icon as any} size={13} color="#666" />
                  <Text style={styles.tournDetailText}>{d.text}</Text>
                </View>
              ))}
            </View>

            {/* Spots bar */}
            {t.status === 'open' && (
              <View style={styles.spotsBarWrapper}>
                <View style={styles.spotsBarBg}>
                  <View style={[styles.spotsBarFill, { width: `${((t.totalSpots - t.spots) / t.totalSpots) * 100}%` }]} />
                </View>
                <Text style={styles.spotsText}>{t.spots} spots left</Text>
              </View>
            )}

            <View style={styles.tournFooter}>
              <Text style={styles.tournPrice}>€{t.price} <Text style={styles.tournPriceSub}>/player</Text></Text>
              {t.status === 'open' ? (
                <TouchableOpacity style={styles.registerBtn}>
                  <Text style={styles.registerBtnText}>Register</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.resultsBtn}>
                  <Text style={styles.resultsBtnText}>View Results</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {/* LEAGUES placeholder */}
        {activeTab === 2 && (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={48} color="#333" />
            <Text style={styles.emptyTitle}>No active leagues</Text>
            <Text style={styles.emptySub}>Leagues are seasonal. Check back soon!</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },

  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '900', color: '#fff' },

  tabsRow: {
    flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#1A1A1A',
    borderRadius: 12, padding: 4, marginBottom: 16,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#00D68F' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#555' },
  tabTextActive: { color: '#0D0D0D' },

  scroll: { paddingHorizontal: 20, paddingBottom: 32, gap: 12 },

  myRankCard: {
    backgroundColor: '#1A1A1A', borderRadius: 16, padding: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16, borderWidth: 1, borderColor: '#00D68F33',
  },
  myRankLabel: { fontSize: 11, color: '#00D68F', fontWeight: '700', letterSpacing: 1 },
  myRankValue: { fontSize: 44, fontWeight: '900', color: '#fff', lineHeight: 50 },
  myRankSub: { fontSize: 12, color: '#00D68F', marginTop: 2 },
  myRankRight: { alignItems: 'flex-end' },
  myPoints: { fontSize: 32, fontWeight: '900', color: '#fff' },
  myPointsLabel: { fontSize: 12, color: '#666' },

  leaderboard: { gap: 4 },
  rankRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#1A1A1A', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  rankRowMe: { borderColor: '#00D68F44', backgroundColor: '#1E2D24' },
  rankNum: { width: 28, fontSize: 13, fontWeight: '700', color: '#555', textAlign: 'center' },
  rankNumTop: { fontSize: 18 },
  rankAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#252525', justifyContent: 'center', alignItems: 'center',
  },
  rankAvatarMe: { backgroundColor: '#00D68F', },
  rankAvatarText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  rankInfo: { flex: 1 },
  rankNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rankName: { fontSize: 14, fontWeight: '700', color: '#fff' },
  rankNameMe: { color: '#00D68F' },
  youBadge: {
    backgroundColor: '#00D68F22', borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
    fontSize: 9, fontWeight: '800', color: '#00D68F',
  },
  rankLevel: { fontSize: 11, color: '#555', marginTop: 2 },
  rankRight: { alignItems: 'flex-end', gap: 2 },
  rankPoints: { fontSize: 14, fontWeight: '800', color: '#fff' },

  // Tournaments
  tournCard: {
    backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  tournHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  tournName: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 4 },
  tournMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tournMetaText: { fontSize: 12, color: '#666' },
  dot: { color: '#444' },
  statusBadge: {
    backgroundColor: '#1E2D24', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  statusFinished: { backgroundColor: '#252525' },
  statusText: { fontSize: 11, fontWeight: '700', color: '#00D68F' },
  statusTextFinished: { color: '#555' },

  tournDetails: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  tournDetail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tournDetailText: { fontSize: 12, color: '#666' },

  spotsBarWrapper: { marginBottom: 12 },
  spotsBarBg: { height: 4, backgroundColor: '#2A2A2A', borderRadius: 2, marginBottom: 4 },
  spotsBarFill: { height: 4, backgroundColor: '#00D68F', borderRadius: 2 },
  spotsText: { fontSize: 11, color: '#666' },

  tournFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tournPrice: { fontSize: 18, fontWeight: '900', color: '#fff' },
  tournPriceSub: { fontSize: 12, color: '#666', fontWeight: '400' },
  registerBtn: {
    backgroundColor: '#00D68F', borderRadius: 10,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  registerBtnText: { fontSize: 13, fontWeight: '800', color: '#0D0D0D' },
  resultsBtn: {
    backgroundColor: '#252525', borderRadius: 10,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  resultsBtnText: { fontSize: 13, fontWeight: '700', color: '#888' },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#555' },
  emptySub: { fontSize: 13, color: '#444', textAlign: 'center' },
});
