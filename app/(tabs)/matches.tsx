import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';

const TABS = ['Open', 'Private', 'My Matches'];
const LEVELS = ['All levels', '1.0–2.0', '2.5–3.0', '3.5–4.0', '4.5+'];

const openMatches = [
  {
    id: '1',
    club: 'City Padel Club',
    date: 'Today, 18:00',
    level: '3.0–3.5',
    players: [
      { name: 'Alex', level: '3.5', avatar: 'A' },
      { name: 'Sarah', level: '3.0', avatar: 'S' },
      { name: null, avatar: null },
      { name: null, avatar: null },
    ],
    price: 18,
    type: 'Public',
    distance: '0.5 km',
  },
  {
    id: '2',
    club: 'Sportpark Noord',
    date: 'Tomorrow, 10:00',
    level: '3.5–4.0',
    players: [
      { name: 'Tom', level: '4.0', avatar: 'T' },
      { name: 'Marc', level: '3.5', avatar: 'M' },
      { name: 'Lisa', level: '3.5', avatar: 'L' },
      { name: null, avatar: null },
    ],
    price: 16,
    type: 'Public',
    distance: '3.1 km',
  },
  {
    id: '3',
    club: 'Riverside Padel',
    date: 'Wed, Mar 6 · 20:00',
    level: '2.5–3.0',
    players: [
      { name: 'Nina', level: '3.0', avatar: 'N' },
      { name: null, avatar: null },
      { name: null, avatar: null },
      { name: null, avatar: null },
    ],
    price: 14,
    type: 'Public',
    distance: '1.2 km',
  },
  {
    id: '4',
    club: 'Central Sports Hub',
    date: 'Thu, Mar 7 · 19:00',
    level: '4.0–4.5',
    players: [
      { name: 'Roel', level: '4.5', avatar: 'R' },
      { name: 'Kaat', level: '4.0', avatar: 'K' },
      { name: null, avatar: null },
      { name: null, avatar: null },
    ],
    price: 12,
    type: 'Public',
    distance: '2.0 km',
  },
];

const myMatches = [
  {
    id: '1',
    club: 'City Padel Club',
    date: 'Today, 18:00',
    result: null,
    players: ['Alex', 'Sarah', 'Tom', 'Marc'],
    court: 'Court 3',
  },
  {
    id: '2',
    club: 'Riverside Padel',
    date: 'Feb 28, 20:00',
    result: '6-3 / 6-4',
    won: true,
    players: ['Alex', 'Sarah', 'Nina', 'Kaat'],
    court: 'Court 2',
  },
  {
    id: '3',
    club: 'Sportpark Noord',
    date: 'Feb 25, 10:00',
    result: '4-6 / 5-6',
    won: false,
    players: ['Alex', 'Tom', 'Marc', 'Lisa'],
    court: 'Court 1',
  },
];

export default function MatchesScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [activeLevel, setActiveLevel] = useState(0);
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Matches</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => {}}>
          <Ionicons name="add" size={18} color="#0D0D0D" />
          <Text style={styles.createBtnText}>Create</Text>
        </TouchableOpacity>
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

      {/* Level filter — only for Open */}
      {activeTab === 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.levelRow}>
          {LEVELS.map((l, i) => (
            <TouchableOpacity
              key={l}
              style={[styles.levelChip, activeLevel === i && styles.levelChipActive]}
              onPress={() => setActiveLevel(i)}
            >
              <Text style={[styles.levelText, activeLevel === i && styles.levelTextActive]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {/* Open Matches */}
        {activeTab === 0 && openMatches.map(match => (
          <TouchableOpacity key={match.id} style={styles.card}>
            {/* Top row */}
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardClub}>{match.club}</Text>
                <View style={styles.dateRow}>
                  <Ionicons name="time-outline" size={12} color="#666" />
                  <Text style={styles.cardDate}>{match.date}</Text>
                  <Text style={styles.dot}>·</Text>
                  <Ionicons name="location-outline" size={12} color="#666" />
                  <Text style={styles.cardDate}>{match.distance}</Text>
                </View>
              </View>
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>{match.level}</Text>
              </View>
            </View>

            {/* Players */}
            <View style={styles.playersGrid}>
              {match.players.map((p, i) => (
                <View key={i} style={[styles.playerSlot, !p.name && styles.playerSlotOpen]}>
                  {p.name ? (
                    <>
                      <View style={styles.playerAvatar}>
                        <Text style={styles.playerAvatarText}>{p.avatar}</Text>
                      </View>
                      <Text style={styles.playerName}>{p.name}</Text>
                      <Text style={styles.playerLevel}>{p.level}</Text>
                    </>
                  ) : (
                    <>
                      <View style={styles.playerAvatarOpen}>
                        <Ionicons name="add" size={18} color="#00D68F" />
                      </View>
                      <Text style={styles.playerOpen}>Open</Text>
                    </>
                  )}
                </View>
              ))}
            </View>

            {/* Footer */}
            <View style={styles.cardFooter}>
              <Text style={styles.cardPrice}>€{match.price} <Text style={styles.cardPriceSub}>/player</Text></Text>
              <TouchableOpacity style={styles.joinBtn}>
                <Text style={styles.joinBtnText}>Join Match</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        {/* My Matches */}
        {activeTab === 2 && myMatches.map(match => (
          <TouchableOpacity key={match.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardClub}>{match.club} · {match.court}</Text>
                <View style={styles.dateRow}>
                  <Ionicons name="time-outline" size={12} color="#666" />
                  <Text style={styles.cardDate}>{match.date}</Text>
                </View>
              </View>
              {match.result ? (
                <View style={[styles.resultBadge, match.won ? styles.resultWin : styles.resultLoss]}>
                  <Text style={[styles.resultText, { color: match.won ? '#00D68F' : '#FF5B5B' }]}>
                    {match.won ? 'WIN' : 'LOSS'}
                  </Text>
                  <Text style={styles.resultScore}>{match.result}</Text>
                </View>
              ) : (
                <View style={styles.upcomingBadge}>
                  <Text style={styles.upcomingText}>Upcoming</Text>
                </View>
              )}
            </View>
            <View style={styles.myPlayersRow}>
              {match.players.map((name, i) => (
                <View key={i} style={styles.myPlayer}>
                  <View style={[styles.myAvatar, i < 2 && styles.myAvatarTeam1]}>
                    <Text style={styles.myAvatarText}>{name[0]}</Text>
                  </View>
                  <Text style={styles.myPlayerName}>{name}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}

        {/* Private tab placeholder */}
        {activeTab === 1 && (
          <View style={styles.emptyState}>
            <Ionicons name="lock-closed-outline" size={48} color="#333" />
            <Text style={styles.emptyTitle}>No private matches</Text>
            <Text style={styles.emptySub}>Create a private match and invite your friends</Text>
            <TouchableOpacity style={styles.createMatchBtn}>
              <Text style={styles.createMatchBtnText}>Create Private Match</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '900', color: '#fff' },
  createBtn: {
    backgroundColor: '#00D68F', borderRadius: 10, flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, gap: 4,
  },
  createBtnText: { fontSize: 13, fontWeight: '800', color: '#0D0D0D' },

  tabsRow: {
    flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#1A1A1A',
    borderRadius: 12, padding: 4, marginBottom: 14,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#00D68F' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#555' },
  tabTextActive: { color: '#0D0D0D' },

  levelRow: { paddingHorizontal: 20, gap: 8, marginBottom: 14 },
  levelChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A',
  },
  levelChipActive: { backgroundColor: '#00D68F22', borderColor: '#00D68F' },
  levelText: { fontSize: 12, fontWeight: '600', color: '#555' },
  levelTextActive: { color: '#00D68F' },

  list: { paddingHorizontal: 20, paddingBottom: 32, gap: 12 },

  card: {
    backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  cardClub: { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 4 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardDate: { fontSize: 12, color: '#666' },
  dot: { color: '#444', fontSize: 12 },
  levelBadge: {
    backgroundColor: '#00D68F22', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#00D68F44',
  },
  levelBadgeText: { fontSize: 11, fontWeight: '700', color: '#00D68F' },

  playersGrid: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  playerSlot: {
    flex: 1, backgroundColor: '#252525', borderRadius: 10,
    padding: 10, alignItems: 'center', gap: 4,
  },
  playerSlotOpen: {
    backgroundColor: 'transparent', borderWidth: 1,
    borderColor: '#2A2A2A', borderStyle: 'dashed',
  },
  playerAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#00D68F22', justifyContent: 'center', alignItems: 'center',
  },
  playerAvatarText: { fontSize: 13, fontWeight: '800', color: '#00D68F' },
  playerAvatarOpen: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#1E2D24', justifyContent: 'center', alignItems: 'center',
  },
  playerName: { fontSize: 11, fontWeight: '700', color: '#fff' },
  playerLevel: { fontSize: 10, color: '#00D68F', fontWeight: '600' },
  playerOpen: { fontSize: 11, color: '#444', fontWeight: '600' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardPrice: { fontSize: 18, fontWeight: '900', color: '#fff' },
  cardPriceSub: { fontSize: 12, color: '#666', fontWeight: '400' },
  joinBtn: {
    backgroundColor: '#00D68F', borderRadius: 10,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  joinBtnText: { fontSize: 13, fontWeight: '800', color: '#0D0D0D' },

  // My Matches
  resultBadge: { alignItems: 'flex-end', borderRadius: 8, padding: 8 },
  resultWin: { backgroundColor: '#1E2D24' },
  resultLoss: { backgroundColor: '#2D1E1E' },
  resultText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  resultScore: { fontSize: 13, fontWeight: '700', color: '#fff', marginTop: 2 },
  upcomingBadge: { backgroundColor: '#1A2535', borderRadius: 8, padding: 8 },
  upcomingText: { fontSize: 11, fontWeight: '700', color: '#5B9BFF' },
  myPlayersRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  myPlayer: { flex: 1, alignItems: 'center', gap: 4 },
  myAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FF5B5B33', justifyContent: 'center', alignItems: 'center',
  },
  myAvatarTeam1: { backgroundColor: '#00D68F22' },
  myAvatarText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  myPlayerName: { fontSize: 11, color: '#aaa', fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#555' },
  emptySub: { fontSize: 13, color: '#444', textAlign: 'center' },
  createMatchBtn: {
    marginTop: 10, backgroundColor: '#00D68F', borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  createMatchBtnText: { fontSize: 14, fontWeight: '800', color: '#0D0D0D' },
});
