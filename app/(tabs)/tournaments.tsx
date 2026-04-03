import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, Platform, ActivityIndicator,
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
  orderBy,
  arrayUnion,
  arrayRemove,
  getDocs,
} from '../../firebase';

const TABS = ['Rankings', 'Tournaments', 'Leagues'];

const INITIAL_TOURNAMENTS = [
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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [rankings, setRankings] = useState<any[]>([]);
  const [rankingsLoading, setRankingsLoading] = useState(true);
  const currentUser = auth.currentUser;

  // Load tournaments from Firestore
  useEffect(() => {
    const q = query(
      collection(firestore, 'tournaments'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as any[];
        setTournaments(fetched);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Load rankings from users and matches
  useEffect(() => {
    if (!currentUser) {
      setRankings([]);
      setRankingsLoading(false);
      return;
    }

    setRankingsLoading(true);

    // Fetch all users
    const usersQuery = query(collection(firestore, 'users'), orderBy('level', 'desc'));
    const usersUnsubscribe = onSnapshot(usersQuery, async (usersSnapshot) => {
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // For each user, fetch their matches to calculate stats
      const playersWithStats = await Promise.all(
        usersData.map(async (user: any) => {
          const matchesQuery = query(
            collection(firestore, 'matches'),
            where('playerIds', 'array-contains', user.id)
          );

          const matchesSnapshot = await new Promise<any>((resolve) => {
            const unsubscribe = onSnapshot(matchesQuery, (snapshot) => {
              unsubscribe(); // Unsubscribe immediately after first fetch
              resolve(snapshot);
            });
          });

          // Calculate wins, losses, matches
          let wins = 0;
          let totalMatches = 0;

          matchesSnapshot.docs.forEach((matchDoc: any) => {
            const match = matchDoc.data();
            const today = new Date().toISOString().split('T')[0];

            // Only count completed matches (past dates)
            if ((match.date || '') < today) {
              totalMatches++;

              const players = match.players || [];
              const userPlayer = players.find((p: any) => p.id === user.id);
              const userTeam = userPlayer?.team || 1;

              // Check if user's team won
              if (match.won === true && userTeam === 1) wins++;
              else if (match.won === false && userTeam === 2) wins++;
            }
          });

          const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

          // Use chess-style Elo rating as basis (stored in user.rating in Firestore)
          const eloBase = Number(user.rating ?? 1200);

          // Calculate competition score using Elo + performance bonuses
          //  - baseline: eloBase
          //  - bonus from completed match performance
          //  - small modifier uit winratio
          const performanceBonus = Math.round(wins * 12 + winRate * 3);
          const points = Math.round(eloBase + performanceBonus);

          return {
            id: user.id,
            rank: 0, // Will be calculated after sorting
            name: user.name || 'Onbekende speler',
            level: (Number(user.level) || 2.5).toFixed(1),
            wins,
            matches: totalMatches,
            winRate,
            change: 'same' as const,
            avatar: (user.name || 'O')[0].toUpperCase(),
            points,
            isMe: user.id === currentUser.uid,
            elo: eloBase,
          };
        })
      );

      // Sort by points for ranking
      const sortedByPoints = [...playersWithStats].sort((a, b) => b.points - a.points);
      const playersWithRanks = sortedByPoints.map((player, index) => ({
        ...player,
        rank: index + 1,
      }));

      setRankings(playersWithRanks);
      setRankingsLoading(false);
    });

    return () => usersUnsubscribe();
  }, [currentUser]);

  const handleRegister = async (tournament: any) => {
    if (!currentUser) {
      if (Platform.OS === 'web') {
        if (window.confirm('Niet ingelogd\n\nJe moet ingelogd zijn om je in te schrijven. Wil je inloggen?')) {
          router.push('/login');
        }
      } else {
        Alert.alert(
          'Niet ingelogd',
          'Je moet ingelogd zijn om je in te schrijven voor een toernooi.',
          [
            { text: 'Annuleren', style: 'cancel' },
            { text: 'Inloggen', onPress: () => router.push('/login') }
          ]
        );
      }
      return;
    }

    const isJoined = tournament.participantIds?.includes(currentUser.uid);

    if (isJoined) {
      // Handle leaving
      const confirmMsg = `Wil je je uitschrijven uit ${tournament.name}?`;

      if (Platform.OS === 'web') {
        if (window.confirm(`Bevestig uitschrijving\n\n${confirmMsg}`)) {
          processLeave(tournament);
        }
      } else {
        Alert.alert(
          'Bevestig uitschrijving',
          confirmMsg,
          [
            { text: 'Annuleren', style: 'cancel' },
            { text: 'Uitschrijven', style: 'destructive', onPress: () => processLeave(tournament) },
          ]
        );
      }
    } else {
      // Handle joining
      const confirmMsg = `Wil je je inschrijven voor ${tournament.name} bij ${tournament.club}?`;

      if (Platform.OS === 'web') {
        if (window.confirm(`Bevestig inschrijving\n\n${confirmMsg}`)) {
          processJoin(tournament);
        }
      } else {
        Alert.alert(
          'Bevestig inschrijving',
          confirmMsg,
          [
            { text: 'Annuleren', style: 'cancel' },
            { text: 'Inschrijven', onPress: () => processJoin(tournament) },
          ]
        );
      }
    }
  };

  const processJoin = async (tournament: any) => {
    try {
      const tournamentRef = doc(firestore, 'tournaments', tournament.id);
      await updateDoc(tournamentRef, {
        spots: Math.max(0, tournament.spots - 1),
        participantIds: arrayUnion(currentUser!.uid),
      });

      setPopupMessage('Je bent gejoint!');
      setTimeout(() => setPopupMessage(null), 1500);
    } catch (error) {
      Alert.alert('Fout', 'Kon je niet inschrijven. Probeer het later opnieuw.');
    }
  };

  const processLeave = async (tournament: any) => {
    try {
      const tournamentRef = doc(firestore, 'tournaments', tournament.id);
      await updateDoc(tournamentRef, {
        spots: tournament.spots + 1,
        participantIds: arrayRemove(currentUser!.uid),
      });

      setPopupMessage('Je bent uitgeschreven!');
      setTimeout(() => setPopupMessage(null), 1500);
    } catch (error) {
      Alert.alert('Fout', 'Kon je niet uitschrijven. Probeer het later opnieuw.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Competitie</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => router.push('/(screens)/createTournament')}
        >
          <Ionicons name="add" size={20} color="#fff" />
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

      {/* Popup Notification */}
      {popupMessage && (
        <View style={styles.popup}>
          <Text style={styles.popupText}>{popupMessage}</Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── RANKINGS ── */}
        {activeTab === 0 && (
          <>
            {/* My rank banner */}
            {rankingsLoading ? (
              <View style={[styles.myRankCard, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="small" color="#00A86B" />
              </View>
            ) : (
              (() => {
                const me = rankings.find((p) => p.isMe);
                return me ? (
                  <View style={styles.myRankCard}>
                    <View style={styles.myRankLeft}>
                      <Text style={styles.myRankLabel}>JOUW RANKING</Text>
                      <Text style={styles.myRankValue}>#{me.rank}</Text>
                      <Text style={styles.myRankSub}>
                        {me.change === 'up' ? '+' : me.change === 'down' ? '-' : ''}
                        {me.change !== 'same' ? '1 positie deze maand' : 'Geen verandering'}
                      </Text>
                    </View>
                    <View style={styles.myRankRight}>
                      <Text style={styles.myPoints}>{me.points}</Text>
                      <Text style={styles.myPointsLabel}>punten</Text>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.myRankCard, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ color: '#666' }}>Geen ranking data beschikbaar</Text>
                  </View>
                );
              })()
            )}

            {/* Leaderboard */}
            {rankingsLoading ? (
              <View style={[styles.leaderboard, { justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }]}>
                <ActivityIndicator size="small" color="#00A86B" />
              </View>
            ) : (
              <View style={styles.leaderboard}>
                {rankings.map((player, idx) => (
                  <View
                    key={player.id}
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
            )}
          </>
        )}

        {/* ── TOURNAMENTS ── */}
        {activeTab === 1 && (
          <>
            {loading ? (
              <View style={styles.centerLoader}>
                <ActivityIndicator size="large" color="#00A86B" />
              </View>
            ) : tournaments.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="trophy-outline" size={48} color="#ccc" />
                <Text style={styles.emptyTitle}>Geen toernooien beschikbaar</Text>
                <Text style={styles.emptySub}>Er zijn momenteel geen toernooien gepland.</Text>
                <TouchableOpacity
                  style={styles.createNewBtn}
                  onPress={() => router.push('/(screens)/createTournament')}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text style={styles.createNewBtnText}>Maak een toernooi aan</Text>
                </TouchableOpacity>
              </View>
            ) : (
              tournaments.map((t) => (
                <TouchableOpacity key={t.id} style={styles.tournCard} activeOpacity={0.88}>
            {/* Header */}
            <View style={t.status === 'finished' ? [styles.tournHeader, { opacity: 0.6 }] : styles.tournHeader}>
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
            <View style={t.status === 'finished' ? [styles.tournChips, { opacity: 0.6 }] : styles.tournChips}>
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
                <TouchableOpacity 
                  style={[
                    styles.registerBtn, 
                    t.spots === 0 && { backgroundColor: '#ccc' },
                    t.participantIds?.includes(currentUser?.uid) && styles.leaveBtn
                  ]}
                  onPress={() => t.spots > 0 && handleRegister(t)}
                  disabled={t.spots === 0}
                >
                  <Text style={[
                    styles.registerBtnText,
                    t.participantIds?.includes(currentUser?.uid) && styles.leaveBtnText
                  ]}>
                    {t.spots === 0 ? 'Volzet' : 
                     t.participantIds?.includes(currentUser?.uid) ? 'Verlaten' : 'Inschrijven'}
                  </Text>
                  {t.spots > 0 && <Ionicons 
                    name={t.participantIds?.includes(currentUser?.uid) ? "close" : "arrow-forward"} 
                    size={15} 
                    color={t.participantIds?.includes(currentUser?.uid) ? "#fff" : "#fff"} 
                  />}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.resultsBtn}>
                  <Text style={styles.resultsBtnText}>Resultaten</Text>
                </TouchableOpacity>
              )}
            </View>
            </TouchableOpacity>
              ))
            )}
          </>
        )}

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

  header: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, 
    paddingTop: 16, 
    paddingBottom: 8 
  },
  title: { fontSize: 24, fontWeight: '900', color: '#1a1a1a' },
  createBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00A86B',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  createNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00A86B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
    gap: 6,
  },
  createNewBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

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

  // Leave button styles
  leaveBtn: { backgroundColor: '#E53935' },
  leaveBtnText: { color: '#fff' },

  // Popup notification
  popup: {
    position: 'absolute' as any,
    top: 100,
    left: 16,
    right: 16,
    backgroundColor: '#00A86B',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  popupText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});