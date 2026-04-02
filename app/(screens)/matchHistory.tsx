import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
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
  orderBy, 
  onSnapshot,
  onAuthStateChanged
} from '../../firebase';

// ─── Types ───────────────────────────────────────────────────────────────────

type MatchRecord = {
  id: string;
  result: 'Win' | 'Loss' | 'Draw';
  score: string;
  opponent: string;
  partner: string;
  date: string;
  court: string;
  club: string;
  type: 'Competitief' | 'Vriendschappelijk';
  duration: string;
  levelDelta: number; // level change after match
};

const FILTER_TABS = ['Alle', 'Wins', 'Losses', 'Competitief', 'Vriendschappelijk'];

const RESULT_CONFIG = {
  Win:  { label: 'W', bg: '#e8f8f2', text: '#00A86B', border: '#c3e6d8' },
  Loss: { label: 'V', bg: '#fdecea', text: '#E53935', border: '#f5c6c4' },
  Draw: { label: 'G', bg: '#fff8ee', text: '#F5A623', border: '#fce4b0' },
};

// ─── Match Row ────────────────────────────────────────────────────────────────

function MatchRow({ match, onPress }: { match: MatchRecord; onPress: () => void }) {
  const cfg = RESULT_CONFIG[match.result];

  return (
    <TouchableOpacity style={styles.matchRow} activeOpacity={0.82} onPress={onPress}>
      {/* Result badge */}
      <View style={[styles.resultBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
        <Text style={[styles.resultBadgeText, { color: cfg.text }]}>{cfg.label}</Text>
      </View>

      {/* Main info */}
      <View style={styles.matchInfo}>
        <View style={styles.matchTopRow}>
          <Text style={styles.matchOpponent} numberOfLines={1}>{match.opponent}</Text>
          <Text style={[styles.matchScore, { color: cfg.text }]}>{match.score}</Text>
        </View>
        <View style={styles.matchMetaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="person-outline" size={11} color="#bbb" />
            <Text style={styles.metaText}>{match.partner}</Text>
          </View>
          <View style={styles.metaDot} />
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={11} color="#bbb" />
            <Text style={styles.metaText}>{match.club}</Text>
          </View>
        </View>
        <View style={styles.matchBottomRow}>
          <Text style={styles.matchDate}>{match.date}</Text>
          <View style={[styles.typePill, match.type === 'Competitief' ? styles.typePillComp : styles.typePillFriend]}>
            <Text style={[styles.typePillText, match.type === 'Competitief' ? styles.typePillTextComp : styles.typePillTextFriend]}>
              {match.type}
            </Text>
          </View>
          {match.levelDelta !== 0 && (
            <View style={styles.deltaChip}>
              <Ionicons
                name={match.levelDelta > 0 ? 'arrow-up' : 'arrow-down'}
                size={10}
                color={match.levelDelta > 0 ? '#00A86B' : '#E53935'}
              />
              <Text style={[styles.deltaText, { color: match.levelDelta > 0 ? '#00A86B' : '#E53935' }]}>
                {match.levelDelta > 0 ? '+' : ''}{match.levelDelta.toFixed(2)}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={16} color="#ddd" style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MatchHistoryScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('Alle');
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setMatches([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    const q = query(
      collection(firestore, 'matches'),
      where('playerIds', 'array-contains', currentUser.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: MatchRecord[] = snapshot.docs
        .map((docSnap) => {
          const d = docSnap.data();
          const matchDate = d.date || '';
          
          // Only matches before today
          if (matchDate >= today) return null;

          const players = d.players || [];
          const userPlayer = players.find((p: any) => p.id === currentUser.uid);
          const userTeam = userPlayer?.team || 1;
          
          const partner = players.find((p: any) => p.team === userTeam && p.id !== currentUser.uid)?.name || 'Geen partner';
          const opponents = players
            .filter((p: any) => p.team !== userTeam)
            .map((p: any) => p.name)
            .filter(Boolean);
          
          const opponentText = opponents.length > 0 ? opponents.join(' & ') : 'Tegenstanders';

          let result: 'Win' | 'Loss' | 'Draw' = 'Draw';
          if (d.won === true) result = 'Win';
          else if (d.won === false) result = 'Loss';

          return {
            id: docSnap.id,
            result,
            score: d.result || 'Nog geen score',
            opponent: opponentText,
            partner: partner,
            date: matchDate,
            court: d.court || 'Baan 1',
            club: d.club || 'Onbekende club',
            type: d.isCompetitive ? 'Competitief' : 'Vriendschappelijk',
            duration: d.duration || '-- min',
            levelDelta: d.levelDelta || 0,
          };
        })
        .filter((m): m is MatchRecord => m !== null);

      setMatches(fetched);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching match history:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const filtered = matches.filter((m) => {
    if (activeFilter === 'Wins')   return m.result === 'Win';
    if (activeFilter === 'Losses') return m.result === 'Loss';
    if (activeFilter === 'Competitief')     return m.type === 'Competitief';
    if (activeFilter === 'Vriendschappelijk') return m.type === 'Vriendschappelijk';
    return true;
  });

  const wins   = matches.filter((m) => m.result === 'Win').length;
  const losses = matches.filter((m) => m.result === 'Loss').length;
  const draws  = matches.filter((m) => m.result === 'Draw').length;
  const winRate = matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0;

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
        <Text style={styles.headerTitle}>Wedstrijdgeschiedenis</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Stats summary bar */}
      <View style={styles.statsBar}>
        {[
          { label: 'Gespeeld', value: matches.length, color: '#1a1a1a' },
          { label: 'Gewonnen', value: wins,            color: '#00A86B' },
          { label: 'Verloren', value: losses,          color: '#E53935' },
          { label: 'Gelijk',   value: draws,           color: '#F5A623' },
          { label: 'Winratio', value: `${winRate}%`,   color: '#4F46E5' },
        ].map((s, i, arr) => (
          <View key={s.label} style={[styles.statCell, i < arr.length - 1 && styles.statCellBorder]}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
      >
        {FILTER_TABS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.resultsCount}>
        {filtered.length} wedstrijd{filtered.length !== 1 ? 'en' : ''}
      </Text>

      {/* List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {filtered.length > 0 ? (
          <View style={styles.listCard}>
            {filtered.map((match, idx) => (
              <View key={match.id} style={idx < filtered.length - 1 && styles.separator}>
                <MatchRow 
                  match={match} 
                  onPress={() => router.push({ pathname: '/(screens)/matchDetail', params: { id: match.id } })}
                />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <Ionicons name="tennisball-outline" size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>Geen wedstrijden</Text>
            <Text style={styles.emptySub}>Je hebt nog geen afgelopen wedstrijden die voldoen aan deze filter.</Text>
          </View>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10,
  },
  backBtn: {
    backgroundColor: '#fff', padding: 8, borderRadius: 10,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },

  statsBar: {
    flexDirection: 'row', backgroundColor: '#fff',
    marginHorizontal: 16, marginBottom: 12, borderRadius: 14,
    paddingVertical: 14,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statCellBorder: { borderRightWidth: 1, borderRightColor: '#f0f0f0' },
  statValue: { fontSize: 18, fontWeight: '900' },
  statLabel: { fontSize: 9, color: '#bbb', fontWeight: '600', textTransform: 'uppercase', marginTop: 2 },

  filterScroll: { maxHeight: 46 },
  filterRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: '#f0f0f0' },
  filterChipActive: { backgroundColor: '#00A86B' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#555' },
  filterChipTextActive: { color: '#fff' },

  resultsCount: {
    fontSize: 13, color: '#999', fontWeight: '500',
    marginHorizontal: 16, marginTop: 8, marginBottom: 8,
  },

  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  listCard: {
    backgroundColor: '#fff', borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    overflow: 'hidden',
  },
  separator: { borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },

  matchRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 14, gap: 12,
  },
  resultBadge: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, flexShrink: 0,
  },
  resultBadgeText: { fontSize: 15, fontWeight: '900' },

  matchInfo: { flex: 1 },
  matchTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  matchOpponent: { fontSize: 14, fontWeight: '700', color: '#1a1a1a', flex: 1, marginRight: 8 },
  matchScore: { fontSize: 13, fontWeight: '800' },

  matchMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11, color: '#bbb' },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#ddd' },

  matchBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  matchDate: { fontSize: 11, color: '#bbb', flex: 1 },
  typePill: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  typePillComp: { backgroundColor: '#eef2ff' },
  typePillFriend: { backgroundColor: '#f0faf6' },
  typePillText: { fontSize: 10, fontWeight: '700' },
  typePillTextComp: { color: '#4F46E5' },
  typePillTextFriend: { color: '#00A86B' },
  deltaChip: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  deltaText: { fontSize: 11, fontWeight: '700' },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#999' },
  emptySub: { fontSize: 13, color: '#bbb' },
});