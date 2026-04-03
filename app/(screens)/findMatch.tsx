import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { 
  firestore, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from '../../firebase';

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
  levelMin: number;
  levelMax: number;
  players: Player[];
  playerIds: string[];
  isMixed: boolean;
  isCompetitive: boolean;
  isPrivate: boolean;
  pricePerPlayer: number;
  distance: string;
  status: string;
};

const DATE_FILTERS = ['Alle', 'Vandaag', 'Morgen', 'Deze week'];
const LEVEL_FILTERS = ['Alle', '1–2', '2–4', '4–6', '6–7'];

// ─── Match Card ───────────────────────────────────────────────────────────────

function MatchCard({ match }: { match: Match }) {
  const router = useRouter();
  const joinedCount = match.players.filter(p => p.name).length;
  const spots = 4 - joinedCount;
  const spotsColor = spots === 1 ? '#F5A623' : '#00A86B';

  return (
    <TouchableOpacity 
      style={styles.matchCard}
      onPress={() => router.push({ pathname: '/(screens)/matchDetail', params: { id: match.id } })}
    >
      {/* Top row */}
      <View style={styles.matchTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.matchClub}>{match.club}</Text>
          <View style={styles.matchLocationRow}>
            <Ionicons name="location-outline" size={12} color="#999" />
            <Text style={styles.matchLocation}>{match.distance}</Text>
          </View>
        </View>
        <View style={styles.matchPrice}>
          <Text style={styles.matchPriceValue}>€{match.pricePerPlayer}</Text>
          <Text style={styles.matchPriceUnit}>/pers</Text>
        </View>
      </View>

      {/* Info row */}
      <View style={styles.matchMeta}>
        <View style={styles.metaChip}>
          <Ionicons name="calendar-outline" size={13} color="#555" />
          <Text style={styles.metaChipText}>{match.date}</Text>
        </View>
        <View style={styles.metaChip}>
          <Ionicons name="time-outline" size={13} color="#555" />
          <Text style={styles.metaChipText}>{match.time}</Text>
        </View>
        <View style={styles.metaChip}>
          <Ionicons name="trending-up-outline" size={13} color="#555" />
          <Text style={styles.metaChipText}>{match.levelMin.toFixed(1)}–{match.levelMax.toFixed(1)}</Text>
        </View>
      </View>

      {/* Tag row */}
      <View style={styles.matchTags}>
        {match.isMixed && (
          <View style={styles.tag}>
            <Ionicons name="people-outline" size={11} color="#00A86B" />
            <Text style={styles.tagText}>Gemengd</Text>
          </View>
        )}
        {match.isCompetitive && (
          <View style={styles.tag}>
            <Ionicons name="trophy-outline" size={11} color="#00A86B" />
            <Text style={styles.tagText}>Competitief</Text>
          </View>
        )}
        <View style={[styles.tag, { borderColor: spotsColor, backgroundColor: spots === 1 ? '#fff8ee' : '#f0faf6' }]}>
          <Ionicons name="person-add-outline" size={11} color={spotsColor} />
          <Text style={[styles.tagText, { color: spotsColor }]}>
            {spots} {spots === 1 ? 'plek' : 'plekken'} vrij
          </Text>
        </View>
      </View>

      {/* Players dots */}
      <View style={styles.matchBottom}>
        <View style={styles.playerDots}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[styles.dot, i < joinedCount ? styles.dotFilled : styles.dotEmpty]}
            />
          ))}
          <Text style={styles.playerCount}>{joinedCount}/4 spelers</Text>
        </View>
        <View style={styles.joinBtn}>
          <Text style={styles.joinBtnText}>Inschrijven</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function FindMatchScreen() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('Alle');
  const [levelFilter, setLevelFilter] = useState('Alle');
  const [mixedOnly, setMixedOnly] = useState(false);
  const [competitiveOnly, setCompetitiveOnly] = useState(false);
  const [privateOnly, setPrivateOnly] = useState(false);

  useEffect(() => {
    const q = query(
      collection(firestore, 'matches'),
      where('status', '==', 'open'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          club: d.club || 'Onbekende Club',
          date: d.date || '',
          time: d.time || '',
          levelMin: d.levelMin || 0,
          levelMax: d.levelMax || 7,
          players: d.players || [],
          playerIds: d.playerIds || [],
          isMixed: d.isMixed || false,
          isCompetitive: d.isCompetitive || false,
          isPrivate: d.isPrivate || false,
          pricePerPlayer: d.pricePerPlayer || 0,
          distance: d.distance || '?.? km',
          status: d.status || 'open',
        };
      });
      setMatches(fetched);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching matches:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getFilteredMatches = () => {
    return matches.filter((m) => {
      // Date filter logic (simplified for prototype)
      if (dateFilter === 'Vandaag') {
        const todayStr = new Date().toISOString().split('T')[0];
        if (m.date !== todayStr) return false;
      }
      if (dateFilter === 'Morgen') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        if (m.date !== tomorrowStr) return false;
      }

      if (mixedOnly && !m.isMixed) return false;
      if (competitiveOnly && !m.isCompetitive) return false;
      if (privateOnly && !m.isPrivate) return false;
      if (!privateOnly && m.isPrivate) return false;

      if (levelFilter !== 'Alle') {
        const [minStr, maxStr] = levelFilter.split('–');
        const min = parseFloat(minStr);
        const max = parseFloat(maxStr);
        // Overlap check
        if (m.levelMax < min || m.levelMin > max) return false;
      }
      return true;
    });
  };

  const filtered = getFilteredMatches();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wedstrijd Zoeken</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Filters */}
      <View style={styles.filtersWrap}>
        {/* Date filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {DATE_FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, dateFilter === f && styles.filterChipActive]}
              onPress={() => setDateFilter(f)}
            >
              <Text style={[styles.filterChipText, dateFilter === f && styles.filterChipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Level filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {LEVEL_FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, levelFilter === f && styles.filterChipActive]}
              onPress={() => setLevelFilter(f)}
            >
              <Text style={[styles.filterChipText, levelFilter === f && styles.filterChipTextActive]}>
                {f === 'Alle' ? 'Alle niveaus' : `Niveau ${f}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Toggle filters */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleChip, mixedOnly && styles.toggleChipActive]}
            onPress={() => setMixedOnly(!mixedOnly)}
          >
            <Ionicons name="people-outline" size={14} color={mixedOnly ? '#fff' : '#555'} />
            <Text style={[styles.toggleChipText, mixedOnly && styles.toggleChipTextActive]}>Gemengd</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleChip, competitiveOnly && styles.toggleChipActive]}
            onPress={() => setCompetitiveOnly(!competitiveOnly)}
          >
            <Ionicons name="trophy-outline" size={14} color={competitiveOnly ? '#fff' : '#555'} />
            <Text style={[styles.toggleChipText, competitiveOnly && styles.toggleChipTextActive]}>Competitief</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleChip, privateOnly && styles.toggleChipActive]}
            onPress={() => setPrivateOnly(!privateOnly)}
          >
            <Ionicons name="lock-closed-outline" size={14} color={privateOnly ? '#fff' : '#555'} />
            <Text style={[styles.toggleChipText, privateOnly && styles.toggleChipTextActive]}>Privé</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Results count */}
      <Text style={styles.resultsCount}>
        {filtered.length} wedstrijd{filtered.length !== 1 ? 'en' : ''} gevonden
      </Text>

      {/* Match list */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {filtered.map((m) => <MatchCard key={m.id} match={m} />)}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>Geen wedstrijden gevonden</Text>
            <Text style={styles.emptySub}>Pas de filters aan of maak zelf een wedstrijd aan</Text>
          </View>
        )}
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

  filtersWrap: {
    backgroundColor: '#fff',
    paddingTop: 10,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  chipRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 6 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterChipActive: { backgroundColor: '#00A86B' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#555' },
  filterChipTextActive: { color: '#fff' },

  toggleRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 2 },
  toggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  toggleChipActive: { backgroundColor: '#00A86B' },
  toggleChipText: { fontSize: 13, fontWeight: '600', color: '#555' },
  toggleChipTextActive: { color: '#fff' },

  resultsCount: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
  },

  listContent: { paddingHorizontal: 16, paddingBottom: 32, gap: 14 },

  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  matchTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  matchClub: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 3 },
  matchLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  matchLocation: { fontSize: 12, color: '#999' },
  matchPrice: { alignItems: 'flex-end' },
  matchPriceValue: { fontSize: 20, fontWeight: '900', color: '#00A86B' },
  matchPriceUnit: { fontSize: 11, color: '#999', marginTop: -2 },

  matchMeta: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  metaChipText: { fontSize: 12, color: '#555', fontWeight: '600' },

  matchTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#00A86B',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#f0faf6',
  },
  tagText: { fontSize: 11, color: '#00A86B', fontWeight: '600' },

  matchBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playerDots: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotFilled: { backgroundColor: '#00A86B' },
  dotEmpty: { backgroundColor: '#e0e0e0' },
  playerCount: { fontSize: 12, color: '#999', marginLeft: 6, fontWeight: '500' },

  joinBtn: {
    backgroundColor: '#00A86B',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  joinBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#999' },
  emptySub: { fontSize: 13, color: '#bbb', textAlign: 'center' },
});