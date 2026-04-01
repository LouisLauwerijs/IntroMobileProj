// app/(tabs)/matches.tsx
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth'; // Added for listener
import {
  auth,
  firestore,
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  arrayUnion,
} from '../../firebase';

const TABS   = ['Open', 'Privé', 'Mijn Matches'];
const LEVELS = ['Alle niveaus', '1.0–2.0', '2.5–3.0', '3.5–4.0', '4.5+'];

// ─── Types ────────────────────────────────────────────────────────────────────

type Player = {
  id: string | null;
  name: string | null;
  level: string | null;
  avatar: string | null;
  team?: number;
};

type Match = {
  id: string;
  club: string;
  date: string;
  time: string;
  level: string;
  price: number;
  distance: string;
  players: Player[];
  playerIds: string[]; // Toegevoegd om te kunnen checken of je al meedoet
  levelMin?: number;
  levelMax?: number;
  isMixed?: boolean;
  isCompetitive?: boolean;
  isPrivate?: boolean;
  createdBy?: string;
  status?: string;
};

type MyMatch = {
  id: string;
  club: string;
  date: string;
  result: string | null;
  won: boolean | null;
  court: string;
  players: string[];
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MatchesScreen() {
  const router = useRouter();
  const [activeTab,   setActiveTab]   = useState(0);
  const [activeLevel, setActiveLevel] = useState(0);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  // Firestore data
  const [openMatches,    setOpenMatches]    = useState<Match[]>([]);
  const [privateMatches, setPrivateMatches] = useState<Match[]>([]);
  const [myMatches,      setMyMatches]      = useState<MyMatch[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);

  // ── Auth state listener ──────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // ── Real-time listener for open matches ──────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(null);

    // Listen to all matches with status 'open', sorted by creation date
    const q = query(
      collection(firestore, 'matches'),
      where('status', '==', 'open'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id:       docSnap.id,
          club:     d.club     ?? 'Onbekende club',
          date:     d.date     ?? '',
          time:     d.time     ?? '',
          level:    `${d.levelMin?.toFixed(1) ?? '?'}–${d.levelMax?.toFixed(1) ?? '?'}`,
          price:    d.pricePerPlayer ?? 0,
          distance: d.distance ?? '? km',
          players:  (d.players ?? []).map((p: any) => ({
            id:     p.id     ?? null,
            name:   p.name   ?? null,
            level:  p.level  ? String(p.level) : null,
            avatar: p.name   ? (p.name as string)[0].toUpperCase() : null,
            team:   p.team,
          })),
          playerIds:     d.playerIds ?? [], // Belangrijk voor checks
          levelMin:      d.levelMin,
          levelMax:      d.levelMax,
          isMixed:       d.isMixed,
          isCompetitive: d.isCompetitive,
          isPrivate:     d.isPrivate ?? false,
          createdBy:     d.createdBy,
          status:        d.status,
        };
      });
      
      setOpenMatches(fetched.filter(m => !m.isPrivate));
      setPrivateMatches(fetched.filter(m => m.isPrivate));
      setLoading(false);
    }, (err: any) => {
      console.error('Error fetching matches:', err);
      setError('Er is een fout opgetreden bij het laden van de wedstrijden.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ── Real-time listener for MY matches ─────────────────────────────────────
  useEffect(() => {
    if (!currentUser) {
      setMyMatches([]);
      return;
    }

    const q = query(
      collection(firestore, 'matches'),
      where('playerIds', 'array-contains', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: MyMatch[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id:      docSnap.id,
          club:    d.club   ?? '',
          date:    `${d.date ?? ''}, ${d.time ?? ''}`,
          result:  d.result ?? null,
          won:     d.won    ?? null,
          court:   d.court  ?? 'Baan 1',
          players: (d.players ?? [])
            .filter((p: any) => p.name)
            .map((p: any) => p.name as string),
        };
      });
      setMyMatches(fetched);
    }, (err) => {
      console.error('Error fetching my matches:', err);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // ── Filtered matches ──────────────────────────────
  const getFilteredOpenMatches = () => {
    if (activeLevel === 0) return openMatches;

    return openMatches.filter(m => {
      if (!m.levelMin || !m.levelMax) return true;
      const levelLabel = LEVELS[activeLevel];
      if (levelLabel === '4.5+') return m.levelMax >= 4.5;
      const [minStr, maxStr] = levelLabel.split('–');
      return (m.levelMin <= parseFloat(maxStr) && m.levelMax >= parseFloat(minStr));
    });
  };

  const filteredOpenMatches = getFilteredOpenMatches();

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

      {/* Level filter */}
      {activeTab === 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.levelRow} style={styles.levelScroll}>
          {LEVELS.map((l, i) => (
            <TouchableOpacity key={l} style={[styles.levelChip, activeLevel === i && styles.levelChipActive]} onPress={() => setActiveLevel(i)}>
              <Text style={[styles.levelText, activeLevel === i && styles.levelTextActive]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {activeTab === 0 && (
          loading ? (
            <ActivityIndicator size="large" color="#00A86B" style={{ marginTop: 40 }} />
          ) : filteredOpenMatches.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="tennisball-outline" size={48} color="#ccc" />
              <Text style={styles.emptyTitle}>Geen open wedstrijden</Text>
              <Text style={styles.emptySub}>Maak de eerste wedstrijd aan!</Text>
            </View>
          ) : (
            filteredOpenMatches.map((match) => {
              const openSpots = match.players.filter((p) => !p.name).length;
              const isParticipant = currentUser && match.playerIds.includes(currentUser.uid);
              return (
                <TouchableOpacity 
                  key={match.id} 
                  style={styles.card}
                  onPress={() => router.push({ pathname: '/(screens)/matchDetail', params: { id: match.id } })}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardClub}>{match.club}</Text>
                      <View style={styles.metaRow}>
                        <Ionicons name="time-outline" size={12} color="#999" />
                        <Text style={styles.metaText}>{match.date} · {match.time}</Text>
                        <Text style={styles.metaDot}>·</Text>
                        <Ionicons name="location-outline" size={12} color="#999" />
                        <Text style={styles.metaText}>{match.distance}</Text>
                      </View>
                    </View>
                    <View style={styles.levelBadge}>
                      <Text style={styles.levelBadgeText}>{match.level}</Text>
                    </View>
                  </View>

                  <View style={styles.playersGrid}>
                    {match.players.map((p, i) => (
                      <View key={i} style={[styles.playerSlot, !p.name && styles.playerSlotOpen]}>
                        {p.name ? (
                          <>
                            <View style={styles.playerAvatar}>
                              <Text style={styles.playerAvatarText}>{p.avatar}</Text>
                            </View>
                            <Text style={styles.playerName} numberOfLines={1}>{p.name}</Text>
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
                      <View style={[styles.joinBtn, isParticipant && { backgroundColor: '#f0faf6', borderWidth: 1, borderColor: '#00A86B' }]}>
                        <Text style={[styles.joinBtnText, isParticipant && { color: '#00A86B' }]}>
                          {isParticipant ? 'Bekijken' : (openSpots === 0 ? 'Volzet' : 'Inschrijven')}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )
        )}
        
        {/* PRIVÉ TAB — Zelfde navigatie toevoegen */}
        {activeTab === 1 && (
          loading ? (
            <ActivityIndicator size="large" color="#00A86B" style={{ marginTop: 40 }} />
          ) : privateMatches.map((match) => (
            <TouchableOpacity 
              key={match.id} 
              style={styles.card}
              onPress={() => router.push({ pathname: '/(screens)/matchDetail', params: { id: match.id } })}
            >
              {/* ... (inhoud van card header etc) ... */}
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardClub}>{match.club}</Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={12} color="#999" />
                    <Text style={styles.metaText}>{match.date} · {match.time}</Text>
                  </View>
                </View>
                <View style={[styles.levelBadge, { borderColor: '#E53935', backgroundColor: '#fdecea' }]}>
                  <Text style={[styles.levelBadgeText, { color: '#E53935' }]}>PRIVÉ</Text>
                </View>
              </View>

              <View style={styles.playersGrid}>
                {match.players.map((p, i) => (
                  <View key={i} style={[styles.playerSlot, !p.name && styles.playerSlotOpen]}>
                    {p.name ? (
                      <><View style={styles.playerAvatar}><Text style={styles.playerAvatarText}>{p.avatar}</Text></View>
                      <Text style={styles.playerName} numberOfLines={1}>{p.name}</Text></>
                    ) : (
                      <><View style={styles.playerAvatarOpen}><Ionicons name="lock-closed" size={14} color="#ccc" /></View>
                      <Text style={styles.playerOpenText}>Privé</Text></>
                    )}
                  </View>
                ))}
              </View>

              <View style={styles.cardFooter}>
                <View><Text style={styles.cardPrice}>€{match.price}</Text><Text style={styles.cardPriceSub}>/speler</Text></View>
                <View style={[styles.joinBtn, { backgroundColor: '#333' }]}><Text style={styles.joinBtnText}>Bekijken</Text></View>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* MIJN MATCHES TAB — Ook klikbaar maken */}
        {activeTab === 2 && (
          currentUser && myMatches.map((match) => (
            <TouchableOpacity 
              key={match.id} 
              style={styles.card}
              onPress={() => router.push({ pathname: '/(screens)/matchDetail', params: { id: match.id } })}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardClub}>{match.club} · {match.court}</Text>
                  <View style={styles.metaRow}><Ionicons name="time-outline" size={12} color="#999" /><Text style={styles.metaText}>{match.date}</Text></View>
                </View>
                {match.result ? (
                  <View style={[styles.resultBadge, match.won ? styles.resultWin : styles.resultLoss]}>
                    <Text style={[styles.resultLabel, { color: match.won ? '#00A86B' : '#E53935' }]}>{match.won ? 'WIN' : 'LOSS'}</Text>
                    <Text style={styles.resultScore}>{match.result}</Text>
                  </View>
                ) : (
                  <View style={styles.upcomingBadge}><Ionicons name="time-outline" size={12} color="#4F46E5" /><Text style={styles.upcomingText}>Gepland</Text></View>
                )}
              </View>
              <View style={styles.myPlayersRow}>
                {match.players.map((name, i) => (
                  <View key={i} style={styles.myPlayer}>
                    <View style={[styles.myAvatar, i < 2 && styles.myAvatarTeam1]}><Text style={styles.myAvatarText}>{name[0]}</Text></View>
                    <Text style={styles.myPlayerName}>{name}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))
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

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#999' },
  emptySub: { fontSize: 13, color: '#bbb', textAlign: 'center' },
  emptyBtn: {
    marginTop: 8, backgroundColor: '#00A86B', borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  errorBox: { backgroundColor: '#fdecea', padding: 12, marginHorizontal: 16, borderRadius: 10, marginBottom: 12 },
  errorText: { color: '#E53935', fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
