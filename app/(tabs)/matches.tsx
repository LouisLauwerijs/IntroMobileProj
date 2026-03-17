import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { auth } from '../../firebase';

const TABS   = ['Open', 'Privé', 'Mijn Matches'];
const LEVELS = ['Alle niveaus', '1.0–2.0', '2.5–3.0', '3.5–4.0', '4.5+'];

const INITIAL_OPEN_MATCHES = [
  {
    id: '1', club: 'City Padel Club', date: 'Vandaag, 18:00',
    level: '3.0–3.5', price: 18, distance: '0.5 km',
    players: [
      { name: 'Alex',  level: '3.5', avatar: 'A' },
      { name: 'Sarah', level: '3.0', avatar: 'S' },
      { name: null, avatar: null },
      { name: null, avatar: null },
    ],
  },
  {
    id: '2', club: 'Sportpark Noord', date: 'Morgen, 10:00',
    level: '3.5–4.0', price: 16, distance: '3.1 km',
    players: [
      { name: 'Tom',  level: '4.0', avatar: 'T' },
      { name: 'Marc', level: '3.5', avatar: 'M' },
      { name: 'Lisa', level: '3.5', avatar: 'L' },
      { name: null, avatar: null },
    ],
  },
  {
    id: '3', club: 'Riverside Padel', date: 'Wo 06/03, 20:00',
    level: '2.5–3.0', price: 14, distance: '1.2 km',
    players: [
      { name: 'Nina', level: '3.0', avatar: 'N' },
      { name: null, avatar: null },
      { name: null, avatar: null },
      { name: null, avatar: null },
    ],
  },
  {
    id: '4', club: 'Central Sports Hub', date: 'Do 07/03, 19:00',
    level: '4.0–4.5', price: 12, distance: '2.0 km',
    players: [
      { name: 'Roel', level: '4.5', avatar: 'R' },
      { name: 'Kaat', level: '4.0', avatar: 'K' },
      { name: null, avatar: null },
      { name: null, avatar: null },
    ],
  },
];

const INITIAL_MY_MATCHES = [
  {
    id: '1', club: 'City Padel Club', date: 'Vandaag, 18:00',
    result: null, won: null, court: 'Court 3',
    players: ['Alex', 'Sarah', 'Tom', 'Marc'],
  },
  {
    id: '2', club: 'Riverside Padel', date: '28 Feb, 20:00',
    result: '6-3 / 6-4', won: true, court: 'Court 2',
    players: ['Alex', 'Sarah', 'Nina', 'Kaat'],
  },
  {
    id: '3', club: 'Sportpark Noord', date: '25 Feb, 10:00',
    result: '4-6 / 5-6', won: false, court: 'Court 1',
    players: ['Alex', 'Tom', 'Marc', 'Lisa'],
  },
];

export default function MatchesScreen() {
  const router    = useRouter();
  const [activeTab,   setActiveTab]   = useState(0);
  const [activeLevel, setActiveLevel] = useState(0);
  const [openMatches, setOpenMatches] = useState(INITIAL_OPEN_MATCHES);
  const [myMatches, setMyMatches]     = useState(INITIAL_MY_MATCHES);

  const handleJoinMatch = (match: any) => {
    console.log('handleJoinMatch called for match:', match.id);
    const user = auth.currentUser;
    console.log('Current user:', user?.email);

    if (!user) {
      if (Platform.OS === 'web') {
        if (window.confirm('Niet ingelogd\n\nJe moet ingelogd zijn om je in te schrijven. Wil je inloggen?')) {
          router.push('/login');
        }
      } else {
        Alert.alert(
          'Niet ingelogd',
          'Je moet ingelogd zijn om je in te schrijven voor een wedstrijd.',
          [
            { text: 'Annuleren', style: 'cancel' },
            { text: 'Inloggen', onPress: () => router.push('/login') }
          ]
        );
      }
      return;
    }

    const confirmMsg = `Wil je je inschrijven voor de wedstrijd bij ${match.club} op ${match.date}?`;

    if (Platform.OS === 'web') {
      if (window.confirm(`Bevestig inschrijving\n\n${confirmMsg}`)) {
        processJoin(match, user);
      }
    } else {
      Alert.alert(
        'Bevestig inschrijving',
        confirmMsg,
        [
          { text: 'Annuleren', style: 'cancel' },
          { text: 'Inschrijven', onPress: () => processJoin(match, user) },
        ]
      );
    }
  };

  const processJoin = (match: any, user: any) => {
    // Update local state for immediate feedback
    const updatedMatches = openMatches.map(m => {
      if (m.id === match.id) {
        const firstOpenSlotIndex = m.players.findIndex(p => !p.name);
        if (firstOpenSlotIndex !== -1) {
          const newPlayers = [...m.players];
          newPlayers[firstOpenSlotIndex] = {
            name: user.displayName || user.email?.split('@')[0] || 'Ik',
            level: '?', // Ideally fetch from user profile
            avatar: (user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()
          };
          return { ...m, players: newPlayers };
        }
      }
      return m;
    });
    
    setOpenMatches(updatedMatches);
    
    if (Platform.OS === 'web') {
      window.alert('Succes\n\nJe bent succesvol ingeschreven!');
    } else {
      Alert.alert('Succes', 'Je bent succesvol ingeschreven!');
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Matches</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => router.push('/(screens)/newMatch')}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.createBtnText}>Aanmaken</Text>
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

      {/* Level filter — Open tab only */}
      {activeTab === 0 && (
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.levelRow}
          style={styles.levelScroll}
        >
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

        {/* ── OPEN MATCHES ── */}
        {activeTab === 0 && openMatches.map((match) => {
          const filledSpots = match.players.filter((p) => p.name).length;
          const openSpots   = 4 - filledSpots;
          return (
            <View key={match.id} style={styles.card}>
              {/* Card header */}
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardClub}>{match.club}</Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={12} color="#999" />
                    <Text style={styles.metaText}>{match.date}</Text>
                    <Text style={styles.metaDot}>·</Text>
                    <Ionicons name="location-outline" size={12} color="#999" />
                    <Text style={styles.metaText}>{match.distance}</Text>
                  </View>
                </View>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>{match.level}</Text>
                </View>
              </View>

              {/* Players grid */}
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
                          <Ionicons name="add" size={18} color="#00A86B" />
                        </View>
                        <Text style={styles.playerOpenText}>Vrij</Text>
                      </>
                    )}
                  </View>
                ))}
              </View>

              {/* Footer */}
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.cardPrice}>€{match.price}</Text>
                  <Text style={styles.cardPriceSub}>/speler</Text>
                </View>
                <View style={styles.footerRight}>
                  <View style={[styles.spotsChip, openSpots === 1 && styles.spotsChipWarn]}>
                    <Text style={[styles.spotsChipText, openSpots === 1 && styles.spotsChipTextWarn]}>
                      {openSpots} {openSpots === 1 ? 'plek' : 'plekken'} vrij
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.joinBtn, openSpots === 0 && { backgroundColor: '#ccc' }]}
                    onPress={() => {
                      console.log('Button pressed for match:', match.id);
                      if (openSpots > 0) handleJoinMatch(match);
                    }}
                    disabled={openSpots === 0}
                  >
                    <Text style={styles.joinBtnText}>
                      {openSpots === 0 ? 'Volzet' : 'Inschrijven'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}

        {/* ── PRIVÉ placeholder ── */}
        {activeTab === 1 && (
          <View style={styles.emptyState}>
            <Ionicons name="lock-closed-outline" size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>Geen privéwedstrijden</Text>
            <Text style={styles.emptySub}>Maak een privéwedstrijd aan en nodig je vrienden uit</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/(screens)/newMatch')}
            >
              <Text style={styles.emptyBtnText}>Privéwedstrijd aanmaken</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── MIJN MATCHES ── */}
        {activeTab === 2 && myMatches.map((match) => (
          <TouchableOpacity key={match.id} style={styles.card} activeOpacity={0.88}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardClub}>{match.club} · {match.court}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={12} color="#999" />
                  <Text style={styles.metaText}>{match.date}</Text>
                </View>
              </View>

              {match.result ? (
                <View style={[styles.resultBadge, match.won ? styles.resultWin : styles.resultLoss]}>
                  <Text style={[styles.resultLabel, { color: match.won ? '#00A86B' : '#E53935' }]}>
                    {match.won ? 'WIN' : 'LOSS'}
                  </Text>
                  <Text style={styles.resultScore}>{match.result}</Text>
                </View>
              ) : (
                <View style={styles.upcomingBadge}>
                  <Ionicons name="time-outline" size={12} color="#4F46E5" />
                  <Text style={styles.upcomingText}>Gepland</Text>
                </View>
              )}
            </View>

            {/* Team rows */}
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

            {/* VS divider */}
            <View style={styles.vsDivider}>
              <View style={styles.vsDividerLine} />
              <View style={styles.vsCircle}>
                <Text style={styles.vsText}>VS</Text>
              </View>
              <View style={styles.vsDividerLine} />
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10,
  },
  title: { fontSize: 24, fontWeight: '900', color: '#1a1a1a' },
  createBtn: {
    backgroundColor: '#00A86B', borderRadius: 10,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 9, gap: 5,
  },
  createBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  tabsRow: {
    flexDirection: 'row', marginHorizontal: 16,
    backgroundColor: '#fff', borderRadius: 12, padding: 4, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#00A86B' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#999' },
  tabTextActive: { color: '#fff' },

  levelScroll: { maxHeight: 44 },
  levelRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  levelChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, backgroundColor: '#f0f0f0',
  },
  levelChipActive: { backgroundColor: '#00A86B' },
  levelText: { fontSize: 12, fontWeight: '600', color: '#555' },
  levelTextActive: { color: '#fff' },

  list: { paddingHorizontal: 16, paddingBottom: 20, gap: 12 },

  // ── Match card ──
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  cardClub: { fontSize: 15, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#999' },
  metaDot: { color: '#ddd' },

  levelBadge: {
    backgroundColor: '#f0faf6', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: '#c3e6d8', marginLeft: 8,
  },
  levelBadgeText: { fontSize: 11, fontWeight: '700', color: '#00A86B' },

  // Players grid
  playersGrid: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  playerSlot: {
    flex: 1, backgroundColor: '#f8f8f8', borderRadius: 12,
    padding: 10, alignItems: 'center', gap: 4,
  },
  playerSlotOpen: {
    backgroundColor: 'transparent', borderWidth: 1.5,
    borderColor: '#e0e0e0', borderStyle: 'dashed',
  },
  playerAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#e8f8f2', justifyContent: 'center', alignItems: 'center',
  },
  playerAvatarText: { fontSize: 13, fontWeight: '800', color: '#00A86B' },
  playerAvatarOpen: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#f0faf6', justifyContent: 'center', alignItems: 'center',
  },
  playerName: { fontSize: 11, fontWeight: '700', color: '#333' },
  playerLevel: { fontSize: 10, color: '#00A86B', fontWeight: '600' },
  playerOpenText: { fontSize: 11, color: '#bbb', fontWeight: '600' },

  // Card footer
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardPrice: { fontSize: 22, fontWeight: '900', color: '#00A86B' },
  cardPriceSub: { fontSize: 11, color: '#999', marginTop: -2 },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  spotsChip: {
    backgroundColor: '#f0faf6', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: '#c3e6d8',
  },
  spotsChipWarn: { backgroundColor: '#fff8ee', borderColor: '#fce4b0' },
  spotsChipText: { fontSize: 11, fontWeight: '700', color: '#00A86B' },
  spotsChipTextWarn: { color: '#F5A623' },
  joinBtn: {
    backgroundColor: '#00A86B', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  joinBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // My Matches
  resultBadge: { alignItems: 'flex-end', borderRadius: 10, padding: 8, marginLeft: 10 },
  resultWin: { backgroundColor: '#e8f8f2' },
  resultLoss: { backgroundColor: '#fdecea' },
  resultLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  resultScore: { fontSize: 13, fontWeight: '700', color: '#1a1a1a', marginTop: 2 },
  upcomingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#eef2ff', borderRadius: 10, padding: 8, marginLeft: 10,
  },
  upcomingText: { fontSize: 11, fontWeight: '700', color: '#4F46E5' },

  myPlayersRow: { flexDirection: 'row', gap: 8 },
  myPlayer: { flex: 1, alignItems: 'center', gap: 5 },
  myAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#fdecea', justifyContent: 'center', alignItems: 'center',
  },
  myAvatarTeam1: { backgroundColor: '#e8f8f2' },
  myAvatarText: { fontSize: 14, fontWeight: '800', color: '#1a1a1a' },
  myPlayerName: { fontSize: 11, color: '#999', fontWeight: '600' },

  vsDivider: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12,
  },
  vsDividerLine: { flex: 1, height: 1, backgroundColor: '#f0f0f0' },
  vsCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center',
  },
  vsText: { fontSize: 10, fontWeight: '900', color: '#bbb' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#999' },
  emptySub: { fontSize: 13, color: '#bbb', textAlign: 'center' },
  emptyBtn: {
    marginTop: 8, backgroundColor: '#00A86B', borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});