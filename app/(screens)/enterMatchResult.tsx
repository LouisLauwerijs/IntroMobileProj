import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { 
  auth, 
  firestore, 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  addDoc
} from '../../firebase';

type Player = {
  id: string | null;
  name: string | null;
  level: number | string | null;
  team: 1 | 2;
};

type Match = {
  id: string;
  club: string;
  date: string;
  time: string;
  players: Player[];
  playerIds: string[];
  isCompetitive: boolean;
};

export default function EnterMatchResultScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // State for 3 sets for both teams
  const [t1Sets, setT1Sets] = useState(['', '', '']);
  const [t2Sets, setT2Sets] = useState(['', '', '']);

  useEffect(() => {
    if (id) fetchMatch();
  }, [id]);

  const fetchMatch = async () => {
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

  const calculateWinner = () => {
    let t1Wins = 0;
    let t2Wins = 0;
    
    for (let i = 0; i < 3; i++) {
      const s1 = parseInt(t1Sets[i]);
      const s2 = parseInt(t2Sets[i]);
      if (!isNaN(s1) && !isNaN(s2)) {
        if (s1 > s2) t1Wins++;
        else if (s2 > s1) t2Wins++;
      }
    }
    
    if (t1Wins === 0 && t2Wins === 0) return null;
    return t1Wins > t2Wins ? 1 : 2;
  };

  const formatScoreString = () => {
    const sets: string[] = [];
    for (let i = 0; i < 3; i++) {
      if (t1Sets[i] !== '' && t2Sets[i] !== '') {
        sets.push(`${t1Sets[i]}-${t2Sets[i]}`);
      }
    }
    return sets.join(', ');
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;
    const winnerTeam = calculateWinner();
    const scoreString = formatScoreString();

    if (!user || !match || !winnerTeam || !scoreString) {
      Alert.alert('Fout', 'Voer ten minste 2 geldige sets in om een winnaar te kunnen bepalen.');
      return;
    }

    setSubmitting(true);
    try {
      const matchRef = doc(firestore, 'matches', match.id);
      
      const userInMatch = match.players.find(p => p.id === user.uid);
      const myTeam = userInMatch?.team || 1;
      const opponents = match.players.filter(p => p.id && p.team !== myTeam);

      if (opponents.length === 0) {
        Alert.alert('Fout', 'Er moet minstens één tegenstander in de match zitten om een resultaat te kunnen goedkeuren.');
        setSubmitting(false);
        return;
      }

      await updateDoc(matchRef, {
        tempScore: scoreString,
        tempWinnerTeam: winnerTeam,
        scoreSubmittedBy: user.uid,
        scoreStatus: 'pending_approval',
        scoreUpdatedAt: serverTimestamp(),
      });

      for (const opponent of opponents) {
        if (opponent.id) {
          await addDoc(collection(firestore, 'notifications'), {
            userId: opponent.id,
            type: 'score_approval',
            status: 'unread',
            matchId: match.id,
            matchClub: match.club,
            score: scoreString,
            submittedBy: user.uid,
            createdAt: serverTimestamp(),
            title: 'Resultaat ter goedkeuring',
            body: `Een resultaat (${scoreString}) is ingediend voor je wedstrijd bij ${match.club}. Gelieve dit te bevestigen of te weigeren.`,
          });
        }
      }

      Alert.alert('Succes', 'Het resultaat is ingediend en wacht op goedkeuring.');
      router.back();
    } catch (error) {
      console.error('Error submitting score:', error);
      Alert.alert('Fout', 'Kon het resultaat niet indienen.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateSet = (team: 1 | 2, index: number, value: string) => {
    // Only allow numbers
    const cleanValue = value.replace(/[^0-9]/g, '');
    if (team === 1) {
      const newSets = [...t1Sets];
      newSets[index] = cleanValue;
      setT1Sets(newSets);
    } else {
      const newSets = [...t2Sets];
      newSets[index] = cleanValue;
      setT2Sets(newSets);
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

  const winner = calculateWinner();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resultaat Invoeren</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Wedstrijd Details</Text>
          <Text style={styles.matchInfo}>{match.club}</Text>
          <Text style={styles.matchSubInfo}>{match.date} om {match.time}</Text>
        </View>

        <View style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <View style={styles.teamInfoCol} />
            <Text style={styles.setLabel}>Set 1</Text>
            <Text style={styles.setLabel}>Set 2</Text>
            <Text style={styles.setLabel}>Set 3</Text>
          </View>

          {/* Team 1 Row */}
          <View style={styles.scoreRow}>
            <View style={styles.teamInfoCol}>
              <Text style={styles.teamName} numberOfLines={1}>Team 1</Text>
              <Text style={styles.teamPlayers} numberOfLines={1}>
                {match.players.filter(p => p.team === 1).map(p => p.name || 'Open').join(' & ')}
              </Text>
            </View>
            {[0, 1, 2].map((i) => (
              <TextInput
                key={`t1s${i}`}
                style={[styles.scoreInput, winner === 1 && styles.inputWinner]}
                keyboardType="numeric"
                maxLength={1}
                value={t1Sets[i]}
                onChangeText={(v) => updateSet(1, i, v)}
              />
            ))}
          </View>

          {/* Team 2 Row */}
          <View style={styles.scoreRow}>
            <View style={styles.teamInfoCol}>
              <Text style={styles.teamName} numberOfLines={1}>Team 2</Text>
              <Text style={styles.teamPlayers} numberOfLines={1}>
                {match.players.filter(p => p.team === 2).map(p => p.name || 'Open').join(' & ')}
              </Text>
            </View>
            {[0, 1, 2].map((i) => (
              <TextInput
                key={`t2s${i}`}
                style={[styles.scoreInput, winner === 2 && styles.inputWinner]}
                keyboardType="numeric"
                maxLength={1}
                value={t2Sets[i]}
                onChangeText={(v) => updateSet(2, i, v)}
              />
            ))}
          </View>
        </View>

        {winner && (
          <View style={styles.winnerBadge}>
            <Ionicons name="trophy" size={20} color="#00A86B" />
            <Text style={styles.winnerBadgeText}>
              Gerekende winnaar: Team {winner}
            </Text>
          </View>
        )}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#00A86B" />
          <Text style={styles.infoText}>
            Vul de games per set in. De app bepaalt automatisch het winnende team op basis van de gewonnen sets.
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.submitBtn, (!winner || submitting) && styles.disabledBtn]}
          onPress={handleSubmit}
          disabled={!winner || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.submitBtnText}>Indienen ter goedkeuring</Text>
              <Ionicons name="send" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  backBtn: { backgroundColor: '#fff', padding: 8, borderRadius: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  scroll: { padding: 16, gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 8 },
  matchInfo: { fontSize: 18, fontWeight: '800', color: '#1a1a1a' },
  matchSubInfo: { fontSize: 14, color: '#999', marginTop: 2 },
  
  scoreCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  scoreHeader: { flexDirection: 'row', marginBottom: 10, paddingRight: 5 },
  teamInfoCol: { flex: 1, justifyContent: 'center' },
  setLabel: { width: 45, textAlign: 'center', fontSize: 12, fontWeight: '700', color: '#999' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  teamName: { fontSize: 15, fontWeight: '800', color: '#333' },
  teamPlayers: { fontSize: 10, color: '#999' },
  scoreInput: { width: 45, height: 45, backgroundColor: '#f5f5f5', borderRadius: 10, textAlign: 'center', fontSize: 20, fontWeight: '900', color: '#333', borderWidth: 1, borderColor: '#eee' },
  inputWinner: { backgroundColor: '#e8f8f2', borderColor: '#00A86B', color: '#00A86B' },
  
  winnerBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#e8f8f2', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#00A86B' },
  winnerBadgeText: { fontSize: 14, fontWeight: '800', color: '#00A86B' },
  
  infoBox: { flexDirection: 'row', gap: 10, backgroundColor: '#eef2ff', borderRadius: 12, padding: 14, marginTop: 10 },
  infoText: { flex: 1, fontSize: 13, color: '#4F46E5', lineHeight: 18 },
  submitBtn: { backgroundColor: '#00A86B', borderRadius: 14, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 20 },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  disabledBtn: { backgroundColor: '#b2dfce' },
});
