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
import { useRouter, useLocalSearchParams } from 'expo-router';

// ─── Mock Data ────────────────────────────────────────────────────────────────
// In production, fetch by match id from params: const { id } = useLocalSearchParams();

type MatchPlayer = {
  id: string;
  name: string;
  avatar: string;
  level: number;
  isYou?: boolean;
  team: 1 | 2;
};

type MatchDetail = {
  id: string;
  court: string;
  club: string;
  location: string;
  date: string;
  time: string;
  duration: string;
  sport: string;
  type: 'Competitief' | 'Vriendschappelijk';
  pricePerPlayer: number;
  players: MatchPlayer[];
  courtImage: string;
  notes: string;
};

const MATCH: MatchDetail = {
  id: '1',
  court: 'Court A',
  club: 'City Padel Club',
  location: 'Antwerpen Centrum',
  date: 'Vandaag',
  time: '18:00',
  duration: '90 min',
  sport: 'Padel',
  type: 'Competitief',
  pricePerPlayer: 9,
  courtImage: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=80',
  notes: 'Breng je eigen racket mee. Ballen worden voorzien door de club.',
  players: [
    { id: '1', name: 'Alex Martens', avatar: 'https://i.pravatar.cc/100?img=11', level: 3.5, isYou: true, team: 1 },
    { id: '2', name: 'Lars Wouters',  avatar: 'https://i.pravatar.cc/100?img=17', level: 3.5, team: 1 },
    { id: '3', name: 'Noah Pieters',  avatar: 'https://i.pravatar.cc/100?img=15', level: 5.0, team: 2 },
    { id: '4', name: 'Open plek',     avatar: '',                                  level: 0,   team: 2 },
  ],
};

// ─── Player Tile ──────────────────────────────────────────────────────────────

function PlayerTile({ player }: { player: MatchPlayer }) {
  const isEmpty = player.name === 'Open plek';

  return (
    <View style={[styles.playerTile, isEmpty && styles.playerTileEmpty]}>
      {isEmpty ? (
        <View style={styles.emptyAvatar}>
          <Ionicons name="person-add-outline" size={22} color="#ccc" />
        </View>
      ) : (
        <Image source={{ uri: player.avatar }} style={styles.playerAvatar} />
      )}
      <Text style={[styles.playerName, isEmpty && { color: '#bbb' }]} numberOfLines={1}>
        {player.name}{player.isYou ? ' (jij)' : ''}
      </Text>
      {!isEmpty && (
        <View style={styles.levelChip}>
          <Text style={styles.levelChipText}>{player.level.toFixed(1)}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MatchDetailScreen() {
  const router = useRouter();
  // const { id } = useLocalSearchParams(); // use to fetch real match

  const match = MATCH;
  const team1 = match.players.filter((p) => p.team === 1);
  const team2 = match.players.filter((p) => p.team === 2);
  const spotsLeft = match.players.filter((p) => p.name === 'Open plek').length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wedstrijddetails</Text>
        <TouchableOpacity style={styles.shareBtn}>
          <Ionicons name="share-social-outline" size={20} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Court Hero */}
        <View style={styles.heroWrap}>
          <Image source={{ uri: match.courtImage }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay}>
            <View style={styles.typeBadge}>
              <Ionicons
                name={match.type === 'Competitief' ? 'trophy-outline' : 'people-outline'}
                size={13}
                color="#fff"
              />
              <Text style={styles.typeBadgeText}>{match.type}</Text>
            </View>
          </View>
        </View>

        {/* Title block */}
        <View style={styles.titleBlock}>
          <View style={{ flex: 1 }}>
            <Text style={styles.courtName}>{match.court}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color="#999" />
              <Text style={styles.locationText}>{match.club} · {match.location}</Text>
            </View>
          </View>
          <View style={styles.priceBox}>
            <Text style={styles.priceValue}>€{match.pricePerPlayer}</Text>
            <Text style={styles.priceUnit}>/pers</Text>
          </View>
        </View>

        {/* Info chips */}
        <View style={styles.infoRow}>
          {[
            { icon: 'calendar-outline', label: match.date },
            { icon: 'time-outline',     label: match.time },
            { icon: 'timer-outline',    label: match.duration },
            { icon: 'tennisball-outline', label: match.sport },
          ].map((chip) => (
            <View key={chip.label} style={styles.infoChip}>
              <Ionicons name={chip.icon as any} size={15} color="#00A86B" />
              <Text style={styles.infoChipText}>{chip.label}</Text>
            </View>
          ))}
        </View>

        {/* Teams */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="people-outline" size={18} color="#00A86B" />
            <Text style={styles.cardTitle}>Teams</Text>
            {spotsLeft > 0 && (
              <View style={styles.spotsChip}>
                <Text style={styles.spotsChipText}>{spotsLeft} plek vrij</Text>
              </View>
            )}
          </View>

          <View style={styles.teamsWrap}>
            {/* Team 1 */}
            <View style={styles.teamCol}>
              <Text style={styles.teamLabel}>Team 1</Text>
              {team1.map((p) => <PlayerTile key={p.id} player={p} />)}
            </View>

            {/* VS */}
            <View style={styles.vsCol}>
              <View style={styles.vsCircle}>
                <Text style={styles.vsText}>VS</Text>
              </View>
            </View>

            {/* Team 2 */}
            <View style={styles.teamCol}>
              <Text style={styles.teamLabel}>Team 2</Text>
              {team2.map((p) => <PlayerTile key={p.id} player={p} />)}
            </View>
          </View>

          {/* Player dots progress */}
          <View style={styles.dotsRow}>
            {match.players.map((p, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  p.name === 'Open plek' ? styles.dotEmpty : styles.dotFilled,
                ]}
              />
            ))}
            <Text style={styles.dotsLabel}>
              {match.players.filter((p) => p.name !== 'Open plek').length}/4 spelers
            </Text>
          </View>
        </View>

        {/* Notes */}
        {match.notes ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="information-circle-outline" size={18} color="#00A86B" />
              <Text style={styles.cardTitle}>Notities</Text>
            </View>
            <Text style={styles.notesText}>{match.notes}</Text>
          </View>
        ) : null}

        {/* Location card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="location-outline" size={18} color="#00A86B" />
            <Text style={styles.cardTitle}>Locatie</Text>
          </View>
          <View style={styles.locationCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.locationCardName}>{match.club}</Text>
              <Text style={styles.locationCardAddr}>{match.location}</Text>
            </View>
            <TouchableOpacity style={styles.directionsBtn}>
              <Ionicons name="navigate-outline" size={16} color="#00A86B" />
              <Text style={styles.directionsBtnText}>Route</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.cta}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Annuleren</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.confirmBtn}>
          <Text style={styles.confirmBtnText}>Bevestigen</Text>
          <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
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
  shareBtn: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },

  scroll: { paddingBottom: 20 },

  // Hero
  heroWrap: { marginHorizontal: 16, marginBottom: 12, borderRadius: 16, overflow: 'hidden', height: 180 },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    gap: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  typeBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Title
  titleBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  courtName: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 13, color: '#999' },
  priceBox: { alignItems: 'flex-end', marginLeft: 12 },
  priceValue: { fontSize: 26, fontWeight: '900', color: '#00A86B' },
  priceUnit: { fontSize: 12, color: '#999', marginTop: -2 },

  // Info chips
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 14,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  infoChipText: { fontSize: 13, fontWeight: '600', color: '#444' },

  // Card
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', flex: 1 },
  spotsChip: {
    backgroundColor: '#f0faf6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#c3e6d8',
  },
  spotsChipText: { fontSize: 11, color: '#00A86B', fontWeight: '700' },

  // Teams
  teamsWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 14 },
  teamCol: { flex: 1, gap: 10 },
  teamLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#bbb',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
    textAlign: 'center',
  },
  vsCol: { alignItems: 'center', justifyContent: 'center', paddingTop: 30 },
  vsCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: { fontSize: 13, fontWeight: '900', color: '#bbb' },

  playerTile: {
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  playerTileEmpty: { borderWidth: 2, borderColor: '#eee', borderStyle: 'dashed', backgroundColor: '#fafafa' },
  playerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#eee' },
  emptyAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerName: { fontSize: 11, fontWeight: '700', color: '#333', textAlign: 'center' },
  levelChip: {
    backgroundColor: '#e8f8f2',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  levelChipText: { fontSize: 11, color: '#00A86B', fontWeight: '800' },

  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotFilled: { backgroundColor: '#00A86B' },
  dotEmpty: { backgroundColor: '#e0e0e0' },
  dotsLabel: { fontSize: 12, color: '#999', marginLeft: 4, fontWeight: '500' },

  // Notes
  notesText: { fontSize: 14, color: '#666', lineHeight: 20 },

  // Location
  locationCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  locationCardName: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  locationCardAddr: { fontSize: 12, color: '#999', marginTop: 2 },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#00A86B',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  directionsBtnText: { fontSize: 13, fontWeight: '700', color: '#00A86B' },

  // CTA
  cta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#999' },
  confirmBtn: {
    flex: 2,
    backgroundColor: '#00A86B',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});