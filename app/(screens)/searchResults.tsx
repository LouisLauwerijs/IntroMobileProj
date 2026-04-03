import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Avatar } from '../../components/Avatar';
import {
  auth,
  firestore,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from '../../firebase';

// ─── Types ───────────────────────────────────────────────────────────────────

type ResultCourt = {
  kind: 'court';
  id: string;
  name: string;
  location: string;
  distance: string;
  pricePerHour: number;
  rating: number;
  available: number;
  image: string;
  tags: string[];
};

type ResultPlayer = {
  kind: 'player';
  id: string;
  name: string;
  avatar: string;
  level: number;
  location: string;
  wins: number;
  matches: number;
};

type ResultMatch = {
  kind: 'match';
  id: string;
  club: string;
  location: string;
  date: string;
  time: string;
  levelMin: number;
  levelMax: number;
  spots: number;
  pricePerPlayer: number;
};

type SearchResult = ResultCourt | ResultPlayer | ResultMatch;

const RECENT_SEARCHES = ['City Padel', 'Lars Wouters', 'Berchem', 'Indoor'];

// App data from Firestore
const DEFAULT_COURTS: ResultCourt[] = [];
const DEFAULT_PLAYERS: ResultPlayer[] = [];
const DEFAULT_MATCHES: ResultMatch[] = [];

// ─── Result components ────────────────────────────────────────────────────────

function CourtResult({ item }: { item: ResultCourt }) {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.resultCard} activeOpacity={0.88} onPress={() => router.push('/book')}>
      <Image source={{ uri: item.image }} style={styles.courtThumb} resizeMode="cover" />
      <View style={styles.resultBody}>
        <Text style={styles.resultTitle}>{item.name}</Text>
        <View style={styles.resultMeta}>
          <Ionicons name="location-outline" size={12} color="#999" />
          <Text style={styles.resultMetaText}>{item.location} · {item.distance}</Text>
        </View>
        <View style={styles.resultFooter}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color="#F5A623" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
          <Text style={styles.priceTag}>€{item.pricePerHour}/u</Text>
        </View>
      </View>
      <View style={[styles.availBadge, item.available === 1 && styles.availBadgeWarn]}>
        <Text style={styles.availBadgeText}>{item.available} vrij</Text>
      </View>
    </TouchableOpacity>
  );
}

function PlayerResult({ item }: { item: ResultPlayer }) {
  const winRate = Math.round((item.wins / item.matches) * 100);
  return (
    <TouchableOpacity style={styles.resultCard} activeOpacity={0.88}>
      <Avatar uri={item.avatar} size={50} />
      <View style={styles.resultBody}>
        <Text style={styles.resultTitle}>{item.name}</Text>
        <View style={styles.resultMeta}>
          <Ionicons name="location-outline" size={12} color="#999" />
          <Text style={styles.resultMetaText}>{item.location}</Text>
        </View>
        <View style={styles.resultFooter}>
          <Text style={styles.statsText}>{item.wins}W / {item.matches - item.wins}V · {winRate}%</Text>
        </View>
      </View>
      <View style={styles.levelBadge}>
        <Text style={styles.levelBadgeText}>{item.level.toFixed(1)}</Text>
      </View>
    </TouchableOpacity>
  );
}

function MatchResult({ item }: { item: ResultMatch }) {
  return (
    <TouchableOpacity style={styles.resultCard} activeOpacity={0.88}>
      <View style={styles.matchIconBox}>
        <Ionicons name="tennisball-outline" size={22} color="#00A86B" />
      </View>
      <View style={styles.resultBody}>
        <Text style={styles.resultTitle}>{item.club}</Text>
        <View style={styles.resultMeta}>
          <Ionicons name="location-outline" size={12} color="#999" />
          <Text style={styles.resultMetaText}>{item.location}</Text>
        </View>
        <View style={styles.resultFooter}>
          <View style={styles.matchChip}>
            <Ionicons name="calendar-outline" size={11} color="#555" />
            <Text style={styles.matchChipText}>{item.date} {item.time}</Text>
          </View>
          <View style={styles.matchChip}>
            <Ionicons name="trending-up-outline" size={11} color="#555" />
            <Text style={styles.matchChipText}>{item.levelMin.toFixed(1)}–{item.levelMax.toFixed(1)}</Text>
          </View>
        </View>
      </View>
      <View style={styles.spotsBadge}>
        <Text style={styles.spotsBadgeText}>{item.spots} vrij</Text>
        <Text style={styles.spotsPriceText}>€{item.pricePerPlayer}/p</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

const TABS = ['Alles', 'Banen', 'Spelers', 'Wedstrijden'];

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const [searchText, setSearchText] = useState(params.q ?? '');
  const [activeTab, setActiveTab] = useState('Alles');

  const [courts, setCourts] = useState<ResultCourt[]>(DEFAULT_COURTS);
  const [players, setPlayers] = useState<ResultPlayer[]>(DEFAULT_PLAYERS);
  const [matches, setMatches] = useState<ResultMatch[]>(DEFAULT_MATCHES);
  const [loading, setLoading] = useState(true);

  const q = searchText.toLowerCase().trim();

  useEffect(() => {
    let unsubUsers = () => {};
    let unsubMatches = () => {};

    const usersQuery = query(collection(firestore, 'users'), orderBy('name'));
    unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      const fetchedPlayers: ResultPlayer[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data() as any;
        return {
          kind: 'player',
          id: docSnap.id,
          name: d.name || d.username || 'Speler',
          avatar: d.avatar || '',
          level: Number(d.level) || 2.5,
          location: d.location || 'Onbekende locatie',
          wins: Number(d.wins) || 0,
          matches: Number(d.matches) || 0,
        };
      });
      setPlayers(fetchedPlayers);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching players', error);
      setLoading(false);
    });

    const matchesQuery = query(collection(firestore, 'matches'), orderBy('date', 'asc'));
    unsubMatches = onSnapshot(matchesQuery, (snapshot) => {
      const fetchedMatches: ResultMatch[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data() as any;
        return {
          kind: 'match',
          id: docSnap.id,
          club: d.club || d.court || 'Onbekende club',
          location: d.location || d.club || 'Onbekende locatie',
          date: d.date || 'Onbekend',
          time: d.time || 'Onbekend',
          levelMin: Number(d.levelMin) || Number(d.minLevel) || 2.0,
          levelMax: Number(d.levelMax) || Number(d.maxLevel) || 6.0,
          spots: Number(d.spotsLeft || d.spots || 0),
          pricePerPlayer: Number(d.pricePerPlayer || d.price || 0),
        };
      });
      setMatches(fetchedMatches);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching matches', error);
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubMatches();
    };
  }, []);

  const courtResults = courts.filter((item) => {
    if (!q) return true;
    const text = `${item.name} ${item.location} ${item.tags.join(' ')}`.toLowerCase();
    return text.includes(q);
  });

  const playerResults = players.filter((item) => {
    if (!q) return true;
    return item.name.toLowerCase().includes(q) || item.location.toLowerCase().includes(q);
  });

  const matchResults = matches.filter((item) => {
    if (!q) return true;
    return item.club.toLowerCase().includes(q) || item.location.toLowerCase().includes(q);
  });

  const results: SearchResult[] = [
    ...((activeTab === 'Alles' || activeTab === 'Banen') ? courtResults : []),
    ...((activeTab === 'Alles' || activeTab === 'Spelers') ? playerResults : []),
    ...((activeTab === 'Alles' || activeTab === 'Wedstrijden') ? matchResults : []),
  ];


  const showEmpty = q.length > 0 && results.length === 0;
  const showSuggestions = q.length === 0;

  // Counts per tab
  const counts: Record<string, number> = {
    Alles: q ? results.length : courts.length + players.length + matches.length,
    Banen: courtResults.length,
    Spelers: playerResults.length,
    Wedstrijden: matchResults.length,
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with search */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={17} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Zoek banen, spelers..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
            autoFocus
            returnKeyType="search"
          />
          {q.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={17} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs (only show when there's a query) */}
      {q.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
          style={styles.tabsScroll}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
              {counts[tab] > 0 && (
                <View style={[styles.tabCount, activeTab === tab && styles.tabCountActive]}>
                  <Text style={[styles.tabCountText, activeTab === tab && styles.tabCountTextActive]}>
                    {counts[tab]}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Suggestions / recent searches */}
        {showSuggestions && (
          <>
            <Text style={styles.groupLabel}>Recente zoekopdrachten</Text>
            {RECENT_SEARCHES.map((s) => (
              <TouchableOpacity key={s} style={styles.recentRow} onPress={() => setQuery(s)}>
                <Ionicons name="time-outline" size={16} color="#bbb" />
                <Text style={styles.recentText}>{s}</Text>
                <Ionicons name="arrow-back-outline" size={14} color="#ccc" />
              </TouchableOpacity>
            ))}

            <Text style={[styles.groupLabel, { marginTop: 20 }]}>Suggesties</Text>
            {[
              { icon: 'tennisball-outline', label: 'Banen in de buurt', hint: 'Antwerpen' },
              { icon: 'people-outline',     label: 'Spelers op jouw niveau', hint: 'Niveau 3.5' },
              { icon: 'trophy-outline',     label: 'Competitieve wedstrijden', hint: 'Vandaag & morgen' },
            ].map((s) => (
              <TouchableOpacity key={s.label} style={styles.suggestionRow} onPress={() => setQuery(s.label)}>
                <View style={styles.suggestionIcon}>
                  <Ionicons name={s.icon as any} size={18} color="#00A86B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggestionLabel}>{s.label}</Text>
                  <Text style={styles.suggestionHint}>{s.hint}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#ccc" />
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Results */}
        {q.length > 0 && !showEmpty && (
          <>
            <Text style={styles.resultsCount}>{results.length} resultaten voor "{query}"</Text>

            {/* Courts section */}
            {(activeTab === 'Alles' || activeTab === 'Banen') && results.filter((r) => r.kind === 'court').length > 0 && (
              <>
                {activeTab === 'Alles' && <Text style={styles.groupLabel}>Banen</Text>}
                {results.filter((r): r is ResultCourt => r.kind === 'court').map((item) => (
                  <CourtResult key={item.id} item={item} />
                ))}
              </>
            )}

            {/* Players section */}
            {(activeTab === 'Alles' || activeTab === 'Spelers') && results.filter((r) => r.kind === 'player').length > 0 && (
              <>
                {activeTab === 'Alles' && <Text style={styles.groupLabel}>Spelers</Text>}
                {results.filter((r): r is ResultPlayer => r.kind === 'player').map((item) => (
                  <PlayerResult key={item.id} item={item} />
                ))}
              </>
            )}

            {/* Matches section */}
            {(activeTab === 'Alles' || activeTab === 'Wedstrijden') && results.filter((r) => r.kind === 'match').length > 0 && (
              <>
                {activeTab === 'Alles' && <Text style={styles.groupLabel}>Wedstrijden</Text>}
                {results.filter((r): r is ResultMatch => r.kind === 'match').map((item) => (
                  <MatchResult key={item.id} item={item} />
                ))}
              </>
            )}
          </>
        )}

        {/* Empty state */}
        {showEmpty && (
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>Geen resultaten voor "{query}"</Text>
            <Text style={styles.emptySub}>Probeer een andere naam of locatie</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function filterByQuery(item: SearchResult, q: string): boolean {
  if (!q) return true;
  if (item.kind === 'court')  return item.name.toLowerCase().includes(q) || item.location.toLowerCase().includes(q);
  if (item.kind === 'player') return item.name.toLowerCase().includes(q) || item.location.toLowerCase().includes(q);
  if (item.kind === 'match')  return item.club.toLowerCase().includes(q) || item.location.toLowerCase().includes(q);
  return false;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    gap: 10,
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
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#333' },

  // Tabs
  tabsScroll: { backgroundColor: '#fff', maxHeight: 52 },
  tabsRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  tabActive: { backgroundColor: '#00A86B' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#555' },
  tabTextActive: { color: '#fff' },
  tabCount: {
    backgroundColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabCountActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  tabCountText: { fontSize: 11, fontWeight: '700', color: '#666' },
  tabCountTextActive: { color: '#fff' },

  scrollContent: { paddingHorizontal: 16, paddingTop: 10 },

  groupLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#bbb',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },
  resultsCount: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
    marginBottom: 12,
  },

  // Recent searches
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  recentText: { flex: 1, fontSize: 14, color: '#555', fontWeight: '500' },

  // Suggestions
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  suggestionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#e8f8f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionLabel: { fontSize: 14, fontWeight: '600', color: '#333' },
  suggestionHint: { fontSize: 12, color: '#bbb', marginTop: 1 },

  // Result cards
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  resultBody: { flex: 1 },
  resultTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a1a', marginBottom: 3 },
  resultMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6 },
  resultMetaText: { fontSize: 12, color: '#999' },
  resultFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  courtThumb: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#eee' },
  playerThumb: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#eee' },
  matchIconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#e8f8f2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#333' },
  priceTag: { fontSize: 13, fontWeight: '700', color: '#00A86B' },

  availBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#00A86B',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  availBadgeWarn: { backgroundColor: '#F5A623' },
  availBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },

  levelBadge: {
    backgroundColor: '#e8f8f2',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  levelBadgeText: { fontSize: 16, fontWeight: '900', color: '#00A86B' },

  statsText: { fontSize: 12, color: '#999', fontWeight: '500' },

  matchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  matchChipText: { fontSize: 11, color: '#555', fontWeight: '600' },

  spotsBadge: {
    alignItems: 'center',
    gap: 2,
  },
  spotsBadgeText: { fontSize: 12, fontWeight: '700', color: '#00A86B' },
  spotsPriceText: { fontSize: 11, color: '#999' },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 70, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#999' },
  emptySub: { fontSize: 13, color: '#bbb', textAlign: 'center' },
});