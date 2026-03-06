import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

const TABS = ['Rankings', 'Tournaments', 'Leagues'];

const rankings = [
  { rank: 1, name: 'Roel Maes',      level: '4.5', wins: 32, matches: 40, winRate: 80, change: 'up',   avatar: 'R', points: 1840 },
  { rank: 2, name: 'Kaat De Smedt', level: '4.5', wins: 28, matches: 36, winRate: 78, change: 'up',   avatar: 'K', points: 1780 },
  { rank: 3, name: 'Marc Peeters',  level: '4.0', wins: 25, matches: 34, winRate: 74, change: 'same', avatar: 'M', points: 1720 },
  { rank: 4, name: 'Alex Janssen',  level: '3.5', wins: 18, matches: 24, winRate: 75, change: 'up',   avatar: 'A', points: 1520, isMe: true },
  { rank: 5, name: 'Tom Vervloet',  level: '3.5', wins: 17, matches: 25, winRate: 68, change: 'down', avatar: 'T', points: 1490 },
  { rank: 6, name: 'Lisa Bogaert',  level: '3.5', wins: 16, matches: 24, winRate: 67, change: 'down', avatar: 'L', points: 1460 },
  { rank: 7, name: 'Nina Claeys',   level: '3.0', wins: 14, matches: 22, winRate: 64, change: 'up',   avatar: 'N', points: 1380 },
  { rank: 8, name: 'Sarah Willems', level: '3.0', wins: 12, matches: 20, winRate: 60, change: 'same', avatar: 'S', points: 1310 },
];

const tournaments = [
  {
    id: '1', name: 'Antwerp Open',
    date: 'Mar 15–16', club: 'City Padel Club',
    format: 'Americano', level: '3.0–4.0',
    spots: 4, totalSpots: 32, price: 25, status: 'open',
  },
  {
    id: '2', name: 'Spring League Round 3',
    date: 'Mar 22', club: 'Sportpark Noord',
    format: 'Round Robin', level: '3.5–4.5',
    spots: 8, totalSpots: 16, price: 15, status: 'open',
  },
  {
    id: '3', name: 'Winter Championship',
    date: 'Feb 28', club: 'Riverside Padel',
    format: 'Knockout', level: 'Alle',
    spots: 0, totalSpots: 24, price: 20, status: 'finished',
  },
];

function RankChange({ change }: { change: string }) {
  if (change === 'up')   return <Ionicons name="arrow-up"   size={11} color="#00A86B" />;
  if (change === 'down') return <Ionicons name="arrow-down" size={11} color="#E53935" />;
  return <Text style={{ fontSize: 11, color: '#bbb' }}>—</Text>;
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function TournamentsScreen() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Competitie</Text>
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

        {/* ── RANKINGS ── */}
        {activeTab === 0 && (
          <>
            {/* My rank banner */}
            <View style={styles.myRankCard}>
              <View style={styles.myRankLeft}>
                <Text style={styles.myRankLabel}>JOUW RANKING</Text>
                <Text style={styles.myRankValue}>#4</Text>
                <Text style={styles.myRankSub}>+2 posities deze maand</Text>
              </View>
              <View style={styles.myRankRight}>
                <Text style={styles.myPoints}>1520</Text>
                <Text style={styles.myPointsLabel}>punten</Text>
              </View>
            </View>

            {/* Leaderboard */}
            <View style={styles.leaderboard}>
              {rankings.map((player, idx) => (
                <View
                  key={player.rank}
                  style={[
                    styles.rankRow,
                    player.isMe && styles.rankRowMe,
                    idx < rankings.length - 1 && styles.rankRowBorder,
                  ]}
                >
                  {/* Rank */}
                  <View style={styles.rankNumCol}>
                    {player.rank <= 3
                      ? <Text style={styles.medal}>{MEDAL[player.rank]}</Text>
                      : <Text style={styles.rankNum}>#{player.rank}</Text>
                    }
                  </View>

                  {/* Avatar */}
                  <View style={[styles.rankAvatar, player.isMe && styles.rankAvatarMe]}>
                    <Text style={[styles.rankAvatarText, player.isMe && { color: '#fff' }]}>
                      {player.avatar}
                    </Text>
                  </View>

                  {/* Info */}
                  <View style={styles.rankInfo}>
                    <View style={styles.rankNameRow}>
                      <Text style={[styles.rankName, player.isMe && styles.rankNameMe]}>
                        {player.name}
                      </Text>
                      {player.isMe && <View style={styles.youBadge}><Text style={styles.youBadgeText}>JIJ</Text></View>}
                    </View>
                    <Text style={styles.rankMeta}>
                      Niveau {player.level} · {player.wins}W / {player.matches}M
                    </Text>
                  </View>

                  {/* Points + trend */}
                  <View style={styles.rankRight}>
                    <Text style={styles.rankPoints}>{player.points}</Text>
                    <View style={styles.trendRow}>
                      <RankChange change={player.change} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── TOURNAMENTS ── */}
        {activeTab === 1 && tournaments.map((t) => (
          <TouchableOpacity key={t.id} style={styles.tournCard} activeOpacity={0.88}>
            {/* Header */}
            <View style={styles.tournHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.tournName}>{t.name}</Text>
                <View style={styles.tournMetaRow}>
                  <Ionicons name="calendar-outline" size={12} color="#999" />
                  <Text style={styles.tournMetaText}>{t.date}</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Ionicons name="location-outline" size={12} color="#999" />
                  <Text style={styles.tournMetaText}>{t.club}</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, t.status === 'finished' && styles.statusFinished]}>
                <Text style={[styles.statusText, t.status === 'finished' && styles.statusTextFinished]}>
                  {t.status === 'open' ? 'Open' : 'Afgelopen'}
                </Text>
              </View>
            </View>

            {/* Detail chips */}
            <View style={styles.tournChips}>
              {[
                { icon: 'people-outline',      text: t.format },
                { icon: 'trending-up-outline', text: `Niveau ${t.level}` },
                { icon: 'person-outline',      text: `${t.totalSpots - t.spots}/${t.totalSpots} spelers` },
              ].map((d) => (
                <View key={d.text} style={styles.chip}>
                  <Ionicons name={d.icon as any} size={12} color="#555" />
                  <Text style={styles.chipText}>{d.text}</Text>
                </View>
              ))}
            </View>

            {/* Spots progress bar */}
            {t.status === 'open' && (
              <View style={styles.spotsWrap}>
                <View style={styles.spotsBarBg}>
                  <View
                    style={[
                      styles.spotsBarFill,
                      { width: `${((t.totalSpots - t.spots) / t.totalSpots) * 100}%` as any },
                    ]}
                  />
                </View>
                <Text style={styles.spotsText}>{t.spots} plaatsen vrij</Text>
              </View>
            )}

            {/* Footer */}
            <View style={styles.tournFooter}>
              <View>
                <Text style={styles.tournPrice}>€{t.price}</Text>
                <Text style={styles.tournPriceSub}>/speler</Text>
              </View>
              {t.status === 'open' ? (
                <TouchableOpacity style={styles.registerBtn}>
                  <Text style={styles.registerBtnText}>Inschrijven</Text>
                  <Ionicons name="arrow-forward" size={15} color="#fff" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.resultsBtn}>
                  <Text style={styles.resultsBtnText}>Resultaten</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {/* ── LEAGUES placeholder ── */}
        {activeTab === 2 && (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>Geen actieve competities</Text>
            <Text style={styles.emptySub}>Competities zijn seizoensgebonden. Kom binnenkort terug!</Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '900', color: '#1a1a1a' },

  tabsRow: {
    flexDirection: 'row', marginHorizontal: 16,
    backgroundColor: '#fff', borderRadius: 12, padding: 4, marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#00A86B' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#999' },
  tabTextActive: { color: '#fff' },

  scroll: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },

  // ── My rank banner ──
  myRankCard: {
    backgroundColor: '#00A86B', borderRadius: 16, padding: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#00A86B', shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  myRankLeft: { gap: 2 },
  myRankLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '700', letterSpacing: 1 },
  myRankValue: { fontSize: 48, fontWeight: '900', color: '#fff', lineHeight: 54 },
  myRankSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  myRankRight: { alignItems: 'flex-end' },
  myPoints: { fontSize: 34, fontWeight: '900', color: '#fff' },
  myPointsLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },

  // ── Leaderboard ──
  leaderboard: {
    backgroundColor: '#fff', borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    overflow: 'hidden',
  },
  rankRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12, gap: 10,
  },
  rankRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  rankRowMe: { backgroundColor: '#f0faf6' },

  rankNumCol: { width: 30, alignItems: 'center' },
  medal: { fontSize: 18 },
  rankNum: { fontSize: 13, fontWeight: '700', color: '#bbb' },

  rankAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center',
  },
  rankAvatarMe: { backgroundColor: '#00A86B' },
  rankAvatarText: { fontSize: 14, fontWeight: '800', color: '#555' },

  rankInfo: { flex: 1 },
  rankNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rankName: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  rankNameMe: { color: '#00A86B' },
  youBadge: {
    backgroundColor: '#e8f8f2', borderRadius: 5,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  youBadgeText: { fontSize: 9, fontWeight: '800', color: '#00A86B' },
  rankMeta: { fontSize: 11, color: '#bbb', marginTop: 2 },

  rankRight: { alignItems: 'flex-end', gap: 3 },
  rankPoints: { fontSize: 15, fontWeight: '800', color: '#1a1a1a' },
  trendRow: { flexDirection: 'row', alignItems: 'center' },

  // ── Tournament cards ──
  tournCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  tournHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  tournName: { fontSize: 16, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 },
  tournMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tournMetaText: { fontSize: 12, color: '#999' },
  metaDot: { color: '#ddd' },

  statusBadge: {
    backgroundColor: '#f0faf6', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4, marginLeft: 10,
  },
  statusFinished: { backgroundColor: '#f5f5f5' },
  statusText: { fontSize: 11, fontWeight: '700', color: '#00A86B' },
  statusTextFinished: { color: '#bbb' },

  tournChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#f5f5f5', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  chipText: { fontSize: 12, color: '#555', fontWeight: '600' },

  spotsWrap: { marginBottom: 14 },
  spotsBarBg: { height: 6, backgroundColor: '#eee', borderRadius: 3, marginBottom: 5, overflow: 'hidden' },
  spotsBarFill: { height: 6, backgroundColor: '#00A86B', borderRadius: 3 },
  spotsText: { fontSize: 11, color: '#999' },

  tournFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tournPrice: { fontSize: 22, fontWeight: '900', color: '#00A86B' },
  tournPriceSub: { fontSize: 11, color: '#999', marginTop: -2 },
  registerBtn: {
    backgroundColor: '#00A86B', borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 11,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  registerBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  resultsBtn: {
    backgroundColor: '#f5f5f5', borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 11,
  },
  resultsBtnText: { fontSize: 14, fontWeight: '700', color: '#999' },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#999' },
  emptySub: { fontSize: 13, color: '#bbb', textAlign: 'center' },
});