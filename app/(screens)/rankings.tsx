import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
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
  orderBy,
  onSnapshot,
  onAuthStateChanged,
  where,
} from '../../firebase';

// ─── Types ───────────────────────────────────────────────────────────────────

type Player = {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  level: number;
  wins: number;
  matches: number;
  winRate: number;
  trend: 'up' | 'down' | 'same';
  trendAmt: number;
};

const TABS = ['Ranking', 'Niveau', 'Winratio'];

// ─── Podium ───────────────────────────────────────────────────────────────────

function Podium({ top3 }: { top3: Player[] }) {
  if (top3.length < 3) return null;

  const [second, first, third] = [top3[1], top3[0], top3[2]];

  const podiumItem = (p: Player, height: number, medal: string, medalColor: string) => (
    <View style={styles.podiumItem}>
      <Image source={{ uri: p.avatar }} style={styles.podiumAvatar} />
      <View style={[styles.medalBadge, { backgroundColor: medalColor }]}>
        <Text style={styles.medalText}>{medal}</Text>
      </View>
      <Text style={styles.podiumName} numberOfLines={1}>{p.name.split(' ')[0]}</Text>
      <Text style={styles.podiumLevel}>{p.level.toFixed(1)}</Text>
      <View style={[styles.podiumBar, { height }]}>
        <Text style={styles.podiumRank}>#{p.rank}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.podium}>
      {podiumItem(second, 70, '2', '#C0C0C0')}
      {podiumItem(first,  90, '1', '#FFD700')}
      {podiumItem(third,  55, '3', '#CD7F32')}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RankingsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Ranking');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch players data
  useEffect(() => {
    if (!currentUser) {
      setPlayers([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch all users
    const usersQuery = query(collection(firestore, 'users'), orderBy('level', 'desc'));
    const usersUnsubscribe = onSnapshot(usersQuery, async (usersSnapshot) => {
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // For each user, fetch their matches to calculate stats
      const playersWithStats = await Promise.all(
        usersData.map(async (user) => {
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

          matchesSnapshot.docs.forEach((matchDoc) => {
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

          return {
            id: user.id,
            rank: 0, // Will be calculated after sorting
            name: user.name || 'Onbekende speler',
            avatar: user.avatar || 'https://i.pravatar.cc/100?img=1',
            level: user.level || 2.5,
            wins,
            matches: totalMatches,
            winRate,
            trend: 'same' as const,
            trendAmt: 0,
          };
        })
      );

      // Sort by level for initial ranking and assign ranks
      const sortedByLevel = [...playersWithStats].sort((a, b) => b.level - a.level);
      const playersWithRanks = sortedByLevel.map((player, index) => ({
        ...player,
        rank: index + 1,
      }));

      setPlayers(playersWithRanks);
      setLoading(false);
    });

    return () => usersUnsubscribe();
  }, [currentUser]);

  const sorted = [...players].sort((a, b) => {
    if (activeTab === 'Niveau') return b.level - a.level;
    if (activeTab === 'Winratio') return b.winRate - a.winRate;
    return a.rank - b.rank;
  });

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00A86B" />
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
        <Text style={styles.headerTitle}>Rankings</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Podium */}
        <Podium top3={players.slice(0, 3)} />

        {/* Tabs */}
        <View style={styles.tabs}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* My rank banner */}
        {(() => {
          const me = sorted.find((p) => p.id === currentUser?.uid);
          const myRank = sorted.findIndex((p) => p.id === currentUser?.uid) + 1;
          if (!me || !currentUser) return null;
          return (
            <View style={styles.myRankBanner}>
              <Ionicons name="person-circle-outline" size={18} color="#00A86B" />
              <Text style={styles.myRankText}>
                Jouw positie: <Text style={styles.myRankValue}>#{myRank}</Text>
              </Text>
              <View style={styles.myRankLevel}>
                <Text style={styles.myRankLevelText}>Niveau {me.level.toFixed(1)}</Text>
              </View>
            </View>
          );
        })()}

        {/* Player list */}
        <View style={styles.listWrap}>
          {sorted.map((player, idx) => {
            const isMe = player.id === currentUser?.uid;
            const pos = idx + 1;
            return (
              <View
                key={player.id}
                style={[styles.playerRow, isMe && styles.playerRowMe]}
              >
                {/* Rank */}
                <View style={styles.rankCol}>
                  {pos <= 3 ? (
                    <Text style={[
                      styles.rankTop,
                      pos === 1 && { color: '#FFD700' },
                      pos === 2 && { color: '#C0C0C0' },
                      pos === 3 && { color: '#CD7F32' },
                    ]}>
                      #{pos}
                    </Text>
                  ) : (
                    <Text style={styles.rankNum}>{pos}</Text>
                  )}
                  {player.trend !== 'same' && (
                    <View style={styles.trendWrap}>
                      <Ionicons
                        name={player.trend === 'up' ? 'trending-up' : 'trending-down'}
                        size={12}
                        color={player.trend === 'up' ? '#00A86B' : '#E53935'}
                      />
                      <Text style={[
                        styles.trendText,
                        { color: player.trend === 'up' ? '#00A86B' : '#E53935' }
                      ]}>
                        {player.trendAmt}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Avatar & Info */}
                <Image source={{ uri: player.avatar }} style={styles.playerAvatar} />
                <View style={styles.playerInfo}>
                  <Text style={[styles.playerName, isMe && styles.playerNameMe]} numberOfLines={1}>
                    {player.name}
                  </Text>
                  <Text style={styles.playerLevel}>Niveau {player.level.toFixed(1)}</Text>
                </View>

                {/* Stats */}
                <View style={styles.statsCol}>
                  <Text style={styles.statNum}>{player.wins}</Text>
                  <Text style={styles.statLabel}>Wins</Text>
                </View>
                <View style={styles.statsCol}>
                  <Text style={styles.statNum}>{player.matches}</Text>
                  <Text style={styles.statLabel}>Matches</Text>
                </View>
                <View style={styles.statsCol}>
                  <Text style={styles.statNum}>{player.winRate}%</Text>
                  <Text style={styles.statLabel}>Winrate</Text>
                </View>
              </View>
            );
          })}
        </View>

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
    paddingBottom: 8,
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
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },

  // Podium
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    paddingTop: 24,
    paddingBottom: 0,
    gap: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  podiumItem: { alignItems: 'center', width: 100 },
  podiumAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#f5f5f5',
    marginBottom: 4,
  },
  medalBadge: {
    position: 'absolute',
    top: 44,
    right: 16,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  medalText: { fontSize: 10, fontWeight: '900', color: '#fff' },
  podiumName: { fontSize: 12, fontWeight: '700', color: '#333', marginBottom: 2, maxWidth: 90, textAlign: 'center' },
  podiumLevel: { fontSize: 11, color: '#00A86B', fontWeight: '700', marginBottom: 6 },
  podiumBar: {
    width: '100%',
    backgroundColor: '#00A86B',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumRank: { color: '#fff', fontWeight: '900', fontSize: 16 },

  // Tabs
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#00A86B' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#999' },
  tabTextActive: { color: '#fff' },

  // My rank banner
  myRankBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0faf6',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#c3e6d8',
  },
  myRankText: { flex: 1, fontSize: 13, color: '#555', fontWeight: '600' },
  myRankValue: { fontWeight: '900', color: '#00A86B' },
  myRankLevel: {
    backgroundColor: '#00A86B',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  myRankLevelText: { fontSize: 11, color: '#fff', fontWeight: '700' },

  // Player rows
  listWrap: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  playerRowMe: { backgroundColor: '#f0faf6' },

  rankCol: { width: 32, alignItems: 'center' },
  rankTop: { fontSize: 14, fontWeight: '900' },
  rankNormal: { fontSize: 13, fontWeight: '700', color: '#bbb' },

  rowAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#eee' },

  playerInfo: { flex: 1 },
  playerName: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  playerNameMe: { color: '#00A86B' },
  playerStats: { fontSize: 11, color: '#999', marginTop: 2 },

  playerRight: { alignItems: 'flex-end', gap: 2 },
  playerLevel: { fontSize: 18, fontWeight: '900', color: '#1a1a1a' },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  trendText: { fontSize: 11, fontWeight: '700' },
});