import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';

// ─── Mock Data ────────────────────────────────────────────────────────────────

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

const PLAYERS: Player[] = [
  { id: '1',  rank: 1,  name: 'Sophie Van den Berg', avatar: 'https://i.pravatar.cc/100?img=5',  level: 6.5, wins: 41, matches: 48, winRate: 85, trend: 'same', trendAmt: 0 },
  { id: '2',  rank: 2,  name: 'Liam De Smedt',       avatar: 'https://i.pravatar.cc/100?img=12', level: 6.0, wins: 38, matches: 46, winRate: 83, trend: 'up',   trendAmt: 1 },
  { id: '3',  rank: 3,  name: 'Emma Jacobs',          avatar: 'https://i.pravatar.cc/100?img=9',  level: 5.5, wins: 33, matches: 42, winRate: 79, trend: 'up',   trendAmt: 2 },
  { id: '4',  rank: 4,  name: 'Noah Pieters',         avatar: 'https://i.pravatar.cc/100?img=15', level: 5.0, wins: 29, matches: 40, winRate: 73, trend: 'down', trendAmt: 1 },
  { id: '5',  rank: 5,  name: 'Olivia Claes',         avatar: 'https://i.pravatar.cc/100?img=6',  level: 4.5, wins: 26, matches: 38, winRate: 68, trend: 'up',   trendAmt: 3 },
  { id: '6',  rank: 6,  name: 'Alex Martens',         avatar: 'https://i.pravatar.cc/100?img=11', level: 3.5, wins: 31, matches: 48, winRate: 65, trend: 'up',   trendAmt: 1 },
  { id: '7',  rank: 7,  name: 'Lars Wouters',         avatar: 'https://i.pravatar.cc/100?img=17', level: 3.5, wins: 22, matches: 36, winRate: 61, trend: 'down', trendAmt: 2 },
  { id: '8',  rank: 8,  name: 'Ines Martens',         avatar: 'https://i.pravatar.cc/100?img=3',  level: 3.0, wins: 19, matches: 34, winRate: 56, trend: 'same', trendAmt: 0 },
  { id: '9',  rank: 9,  name: 'Finn De Wolf',         avatar: 'https://i.pravatar.cc/100?img=20', level: 2.5, wins: 15, matches: 30, winRate: 50, trend: 'down', trendAmt: 1 },
  { id: '10', rank: 10, name: 'Amelie Leclercq',      avatar: 'https://i.pravatar.cc/100?img=7',  level: 2.0, wins: 10, matches: 25, winRate: 40, trend: 'up',   trendAmt: 1 },
];

const CURRENT_USER_ID = '6'; // Alex Martens

const TABS = ['Ranking', 'Niveau', 'Winratio'];

// ─── Podium ───────────────────────────────────────────────────────────────────

function Podium({ top3 }: { top3: Player[] }) {
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

  const sorted = [...PLAYERS].sort((a, b) => {
    if (activeTab === 'Niveau') return b.level - a.level;
    if (activeTab === 'Winratio') return b.winRate - a.winRate;
    return a.rank - b.rank;
  });

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
        <Podium top3={PLAYERS.slice(0, 3)} />

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
          const me = sorted.find((p) => p.id === CURRENT_USER_ID);
          const myRank = sorted.findIndex((p) => p.id === CURRENT_USER_ID) + 1;
          if (!me) return null;
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
            const isMe = player.id === CURRENT_USER_ID;
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
                    ]}>#{pos}</Text>
                  ) : (
                    <Text style={styles.rankNormal}>#{pos}</Text>
                  )}
                </View>

                {/* Avatar */}
                <Image source={{ uri: player.avatar }} style={styles.rowAvatar} />

                {/* Info */}
                <View style={styles.playerInfo}>
                  <Text style={[styles.playerName, isMe && styles.playerNameMe]}>
                    {player.name}{isMe ? ' (jij)' : ''}
                  </Text>
                  <Text style={styles.playerStats}>
                    {player.wins}W / {player.matches - player.wins}V · {player.winRate}%
                  </Text>
                </View>

                {/* Level + trend */}
                <View style={styles.playerRight}>
                  <Text style={styles.playerLevel}>{player.level.toFixed(1)}</Text>
                  <View style={styles.trendRow}>
                    {player.trend === 'up' && (
                      <>
                        <Ionicons name="arrow-up" size={11} color="#00A86B" />
                        <Text style={[styles.trendText, { color: '#00A86B' }]}>+{player.trendAmt}</Text>
                      </>
                    )}
                    {player.trend === 'down' && (
                      <>
                        <Ionicons name="arrow-down" size={11} color="#E53935" />
                        <Text style={[styles.trendText, { color: '#E53935' }]}>-{player.trendAmt}</Text>
                      </>
                    )}
                    {player.trend === 'same' && (
                      <Text style={[styles.trendText, { color: '#bbb' }]}>—</Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>

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