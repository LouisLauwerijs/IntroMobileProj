import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { 
  auth, 
  firestore, 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion,
  arrayRemove
} from '../../firebase';

// ─── Types ───────────────────────────────────────────────────────────────────

type Player = {
  id: string | null;
  name: string | null;
  level: number | string | null;
  team: 1 | 2;
  avatar?: string;
};

type Match = {
  id: string;
  club: string;
  date: string;
  time: string;
  levelMin: number;
  levelMax: number;
  pricePerPlayer: number;
  players: Player[];
  playerIds: string[];
  createdBy: string;
  status: string;
  isMixed: boolean;
  isCompetitive: boolean;
};

// ─── Player Tile ──────────────────────────────────────────────────────────────

function PlayerTile({ player }: { player: Player }) {
  const isEmpty = !player.id;
  const currentUserId = auth.currentUser?.uid;
  const isYou = player.id === currentUserId;

  return (
    <View style={[styles.playerTile, isEmpty && styles.playerTileEmpty]}>
      {isEmpty ? (
        <View style={styles.emptyAvatar}>
          <Ionicons name="person-add-outline" size={22} color="#ccc" />
        </View>
      ) : player.avatar ? (
        <Image 
          source={{ uri: player.avatar }} 
          style={styles.playerAvatar} 
        />
      ) : (
        <View style={[styles.playerAvatar, { backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' }]}>
          <Ionicons name="person" size={24} color="#ccc" />
        </View>
      )}
      <Text style={[styles.playerName, isEmpty && { color: '#bbb' }]} numberOfLines={1}>
        {isEmpty ? 'Open plek' : player.name}{isYou ? ' (jij)' : ''}
      </Text>
      {!isEmpty && (
        <View style={styles.levelChip}>
          <Text style={styles.levelChipText}>
            {typeof player.level === 'number' ? player.level.toFixed(1) : player.level || '?'}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MatchDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    fetchMatch();
  }, [id]);

  const fetchMatch = async () => {
    if (!id) return;
    try {
      const docRef = doc(firestore, 'matches', id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setMatch({ id: docSnap.id, ...docSnap.data() } as Match);
      } else {
        Alert.alert('Fout', 'Wedstrijd niet gevonden.');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching match:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Fout', 'Je moet ingelogd zijn om je in te schrijven.');
      return;
    }

    if (!match) return;

    if (match.playerIds.includes(user.uid)) {
      Alert.alert('Info', 'Je zit al in deze wedstrijd!');
      return;
    }

    const emptyIndex = match.players.findIndex(p => !p.id);
    if (emptyIndex === -1) {
      Alert.alert('Fout', 'Deze wedstrijd is al vol.');
      return;
    }

    setJoining(true);
    try {
      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : null;
      
      const newPlayer: Player = {
        id: user.uid,
        name: userData?.username || userData?.name || user.displayName || 'Speler',
        level: userData?.level || '?',
        team: match.players[emptyIndex].team,
        avatar: userData?.avatar || ''
      };

      const updatedPlayers = [...match.players];
      updatedPlayers[emptyIndex] = newPlayer;

      const matchRef = doc(firestore, 'matches', match.id);
      const isNowFull = updatedPlayers.filter(p => !p.id).length === 0;

      await updateDoc(matchRef, {
        players: updatedPlayers,
        playerIds: arrayUnion(user.uid),
        status: isNowFull ? 'full' : 'open'
      });

      // Update all-time match history for the user
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
        allTimeMatchIds: arrayUnion(match.id)
      }).catch(err => console.error('Error updating join history:', err));

      Alert.alert('Succes', 'Je bent ingeschreven!');
      fetchMatch();

    } catch (error) {
      console.error('Error joining match:', error);
      Alert.alert('Fout', 'Kon niet inschrijven. Probeer het later opnieuw.');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    const user = auth.currentUser;
    if (!user || !match) return;

    const performLeave = async () => {
      setLeaving(true);
      try {
        const updatedPlayers = [...match.players];
        const userIndex = updatedPlayers.findIndex(p => p.id === user.uid);

        if (userIndex !== -1) {
          updatedPlayers[userIndex] = {
            id: null,
            name: null,
            level: null,
            team: updatedPlayers[userIndex].team
          };

          const matchRef = doc(firestore, 'matches', match.id);
          await updateDoc(matchRef, {
            players: updatedPlayers,
            playerIds: arrayRemove(user.uid),
            status: 'open'
          });

          if (Platform.OS !== 'web') Alert.alert('Succes', 'Je bent uitgeschreven.');
          fetchMatch();
        }
      } catch (error) {
        console.error('Error leaving match:', error);
        Alert.alert('Fout', 'Kon niet uitschrijven. Probeer het later opnieuw.');
      } finally {
        setLeaving(false);
      }
    };

    const confirmMsg = 'Weet je zeker dat je je wilt uitschrijven voor deze wedstrijd?';
    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) {
        await performLeave();
      }
    } else {
      Alert.alert('Uitschrijven', confirmMsg, [
        { text: 'Annuleren', style: 'cancel' },
        { text: 'Uitschrijven', style: 'destructive', onPress: performLeave }
      ]);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00A86B" />
      </View>
    );
  }

  if (!match) return null;

  const team1 = match.players.filter((p) => p.team === 1);
  const team2 = match.players.filter((p) => p.team === 2);
  const spotsLeft = match.players.filter((p) => !p.id).length;
  const isParticipant = auth.currentUser ? match.playerIds.includes(auth.currentUser.uid) : false;

  return (
    <SafeAreaView style={styles.container}>
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
        <View style={styles.titleBlock}>
          <View style={{ flex: 1 }}>
            <Text style={styles.courtName}>{match.club}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color="#999" />
              <Text style={styles.locationText}>{match.club} · Antwerpen</Text>
            </View>
          </View>
          <View style={styles.priceBox}>
            <Text style={styles.priceValue}>€{match.pricePerPlayer || 10}</Text>
            <Text style={styles.priceUnit}>/pers</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          {[
            { icon: 'calendar-outline', label: match.date },
            { icon: 'time-outline',     label: match.time },
            { icon: 'trophy-outline',    label: match.isCompetitive ? 'Competitief' : 'Vriendschappelijk' },
            { icon: 'tennisball-outline', label: 'Padel' },
          ].map((chip, idx) => (
            <View key={idx} style={styles.infoChip}>
              <Ionicons name={chip.icon as any} size={15} color="#00A86B" />
              <Text style={styles.infoChipText}>{chip.label}</Text>
            </View>
          ))}
        </View>

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
            <View style={styles.teamCol}>
              <Text style={styles.teamLabel}>Team 1</Text>
              {team1.map((p, idx) => <PlayerTile key={idx} player={p} />)}
            </View>
            <View style={styles.vsCol}>
              <View style={styles.vsCircle}>
                <Text style={styles.vsText}>VS</Text>
              </View>
            </View>
            <View style={styles.teamCol}>
              <Text style={styles.teamLabel}>Team 2</Text>
              {team2.map((p, idx) => <PlayerTile key={idx} player={p} />)}
            </View>
          </View>

          <View style={styles.dotsRow}>
            {match.players.map((p, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  !p.id ? styles.dotEmpty : styles.dotFilled,
                ]}
              />
            ))}
            <Text style={styles.dotsLabel}>
              {match.players.filter((p) => p.id).length}/4 spelers
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="trending-up-outline" size={18} color="#00A86B" />
            <Text style={styles.cardTitle}>Vereist Niveau</Text>
          </View>
          <Text style={styles.levelText}>
            Deze wedstrijd is voor spelers met een niveau tussen {match.levelMin.toFixed(1)} en {match.levelMax.toFixed(1)}.
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.cta}>
        <TouchableOpacity 
          style={styles.cancelBtn} 
          onPress={() => router.back()}
        >
          <Text style={styles.cancelBtnText}>Terug</Text>
        </TouchableOpacity>
        
        {isParticipant ? (
          <TouchableOpacity 
            style={[styles.confirmBtn, { backgroundColor: '#FDECEA', borderWidth: 1, borderColor: '#E53935' }]} 
            onPress={handleLeave}
            disabled={leaving}
          >
            {leaving ? (
              <ActivityIndicator color="#E53935" size="small" />
            ) : (
              <>
                <Text style={[styles.confirmBtnText, { color: '#E53935' }]}>Uitschrijven</Text>
                <Ionicons name="exit-outline" size={18} color="#E53935" />
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.confirmBtn, (spotsLeft === 0 || joining) && styles.disabledBtn]} 
            onPress={handleJoin}
            disabled={spotsLeft === 0 || joining}
          >
            {joining ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.confirmBtnText}>Inschrijven</Text>
                <Ionicons name="person-add-outline" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  backBtn: { backgroundColor: '#fff', padding: 8, borderRadius: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  shareBtn: { backgroundColor: '#fff', padding: 8, borderRadius: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  scroll: { paddingBottom: 20 },
  titleBlock: { flexDirection: 'row', alignItems: 'flex-start', marginHorizontal: 16, marginBottom: 12, marginTop: 10 },
  courtName: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 13, color: '#999' },
  priceBox: { alignItems: 'flex-end', marginLeft: 12 },
  priceValue: { fontSize: 26, fontWeight: '900', color: '#00A86B' },
  priceUnit: { fontSize: 12, color: '#999', marginTop: -2 },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 16, marginBottom: 14 },
  infoChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  infoChipText: { fontSize: 13, fontWeight: '600', color: '#444' },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', flex: 1 },
  spotsChip: { backgroundColor: '#f0faf6', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#c3e6d8' },
  spotsChipText: { fontSize: 11, color: '#00A86B', fontWeight: '700' },
  teamsWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 14 },
  teamCol: { flex: 1, gap: 10 },
  teamLabel: { fontSize: 11, fontWeight: '700', color: '#bbb', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4, textAlign: 'center' },
  vsCol: { alignItems: 'center', justifyContent: 'center', paddingTop: 30 },
  vsCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  vsText: { fontSize: 13, fontWeight: '900', color: '#bbb' },
  playerTile: { alignItems: 'center', backgroundColor: '#f8f8f8', borderRadius: 12, padding: 10, gap: 6 },
  playerTileEmpty: { borderWidth: 2, borderColor: '#eee', borderStyle: 'dashed', backgroundColor: '#fafafa' },
  playerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#eee' },
  emptyAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  playerName: { fontSize: 11, fontWeight: '700', color: '#333', textAlign: 'center' },
  levelChip: { backgroundColor: '#e8f8f2', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  levelChipText: { fontSize: 11, color: '#00A86B', fontWeight: '800' },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotFilled: { backgroundColor: '#00A86B' },
  dotEmpty: { backgroundColor: '#e0e0e0' },
  dotsLabel: { fontSize: 12, color: '#999', marginLeft: 4, fontWeight: '500' },
  levelText: { fontSize: 14, color: '#666', lineHeight: 20 },
  cta: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 28, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#999' },
  confirmBtn: { flex: 2, backgroundColor: '#00A86B', borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  disabledBtn: { backgroundColor: '#b2dfce' },
});
