import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';

// ─── Mock Data ────────────────────────────────────────────────────────────────

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

const MATCHES: MatchRecord[] = [
  { id: '1',  result: 'Win',  score: '6-4, 6-3',   opponent: 'Team Rivera',  partner: 'Lars Wouters',   date: '28 Feb 2025', court: 'Court A', club: 'City Padel Club',    type: 'Competitief',     duration: '75 min',  levelDelta: +0.1 },
  { id: '2',  result: 'Loss', score: '4-6, 5-7',   opponent: 'Team Dupont',  partner: 'Noah Pieters',   date: '24 Feb 2025', court: 'Court 2', club: 'Riverside Padel',    type: 'Competitief',     duration: '82 min',  levelDelta: -0.05 },
  { id: '3',  result: 'Win',  score: '6-2, 7-5',   opponent: 'Team Santos',  partner: 'Lars Wouters',   date: '19 Feb 2025', court: 'Court B', club: 'Central Sports Hub', type: 'Vriendschappelijk', duration: '90 min', levelDelta: 0 },
  { id: '4',  result: 'Win',  score: '7-6, 6-4',   opponent: 'Team Martens', partner: 'Emma Jacobs',    date: '14 Feb 2025', court: 'Court 1', club: 'Sportpark Noord',    type: 'Competitief',     duration: '95 min',  levelDelta: +0.15 },
  { id: '5',  result: 'Loss', score: '3-6, 2-6',   opponent: 'Team Claes',   partner: 'Lars Wouters',   date: '08 Feb 2025', court: 'Court A', club: 'City Padel Club',    type: 'Competitief',     duration: '58 min',  levelDelta: -0.1 },
  { id: '6',  result: 'Win',  score: '6-3, 6-1',   opponent: 'Team Wouters', partner: 'Noah Pieters',   date: '02 Feb 2025', court: 'Court 3', club: 'Riverside Padel',    type: 'Vriendschappelijk', duration: '62 min', levelDelta: 0 },
  { id: '7',  result: 'Draw', score: '6-4, 4-6, 10-7', opponent: 'Team Leclercq', partner: 'Lars Wouters', date: '27 Jan 2025', court: 'Court B', club: 'Central Sports Hub', type: 'Competitief',  duration: '115 min', levelDelta: +0.05 },
  { id: '8',  result: 'Loss', score: '5-7, 3-6',   opponent: 'Team De Wolf', partner: 'Emma Jacobs',    date: '21 Jan 2025', court: 'Court 2', club: 'City Padel Club',    type: 'Competitief',     duration: '78 min',  levelDelta: -0.1 },
  { id: '9',  result: 'Win',  score: '6-0, 6-2',   opponent: 'Team Pieters', partner: 'Lars Wouters',   date: '15 Jan 2025', court: 'Court A', club: 'Sportpark Noord',    type: 'Vriendschappelijk', duration: '50 min', levelDelta: 0 },
  { id: '10', result: 'Win',  score: '7-5, 6-4',   opponent: 'Team Berg',    partner: 'Noah Pieters',   date: '09 Jan 2025', court: 'Court 1', club: 'Riverside Padel',    type: 'Competitief',     duration: '88 min',  levelDelta: +0.1 },
];

const FILTER_TABS = ['Alle', 'Wins', 'Losses', 'Competitief', 'Vriendschappelijk'];

const RESULT_CONFIG = {
  Win:  { label: 'W', bg: '#e8f8f2', text: '#00A86B', border: '#c3e6d8' },
  Loss: { label: 'V', bg: '#fdecea', text: '#E53935', border: '#f5c6c4' },
  Draw: { label: 'G', bg: '#fff8ee', text: '#F5A623', border: '#fce4b0' },
};

// ─── Match Row ────────────────────────────────────────────────────────────────

function MatchRow({ match }: { match: MatchRecord }) {
  const cfg = RESULT_CONFIG[match.result];

  return (
    <TouchableOpacity style={styles.matchRow} activeOpacity={0.82}>
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

  const filtered = MATCHES.filter((m) => {
    if (activeFilter === 'Wins')   return m.result === 'Win';
    if (activeFilter === 'Losses') return m.result === 'Loss';
    if (activeFilter === 'Competitief')     return m.type === 'Competitief';
    if (activeFilter === 'Vriendschappelijk') return m.type === 'Vriendschappelijk';
    return true;
  });

  const wins   = MATCHES.filter((m) => m.result === 'Win').length;
  const losses = MATCHES.filter((m) => m.result === 'Loss').length;
  const draws  = MATCHES.filter((m) => m.result === 'Draw').length;
  const winRate = Math.round((wins / MATCHES.length) * 100);

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
          { label: 'Gespeeld', value: MATCHES.length, color: '#1a1a1a' },
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
        <View style={styles.listCard}>
          {filtered.map((match, idx) => (
            <View key={match.id} style={idx < filtered.length - 1 && styles.separator}>
              <MatchRow match={match} />
            </View>
          ))}
        </View>

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="tennisball-outline" size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>Geen wedstrijden</Text>
            <Text style={styles.emptySub}>Pas de filter aan</Text>
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