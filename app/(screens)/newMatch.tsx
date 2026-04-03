import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { 
  auth, 
  firestore, 
  collection, 
  addDoc, 
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  arrayUnion
} from '../../firebase';

// ─── Constants ────────────────────────────────────────────────────────────────

const CLUBS = [
  'City Padel Club',
  'Riverside Padel',
  'Central Sports Hub',
  'Sportpark Noord',
];

const TIMES = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00',
];

const LEVEL_STEPS = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0];

// Generate today + next 13 days (no past dates possible)
const DATES = Array.from({ length: 14 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return {
    key: d.toISOString().split('T')[0],
    label: d.toLocaleDateString('nl-BE', { weekday: 'short', day: 'numeric', month: 'short' }),
    isToday: i === 0,
  };
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NewMatchScreen() {
  const router = useRouter();

  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [levelMin, setLevelMin] = useState(2.5);
  const [levelMax, setLevelMax] = useState(4.5);
  const [isMixed, setIsMixed] = useState(false);
  const [isCompetitive, setIsCompetitive] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showClubs, setShowClubs] = useState(false);
  const [showDates, setShowDates] = useState(false);
  const [showTimes, setShowTimes] = useState(false);

  const canCreate = selectedClub && selectedDate && selectedTime && !loading;

  const handleCreate = async () => {
    console.log('handleCreate gestart...');
    const user = auth.currentUser;
    if (!user) {
      console.error('Geen gebruiker gevonden');
      Alert.alert('Fout', 'Je moet ingelogd zijn om een wedstrijd aan te maken.');
      return;
    }

    setLoading(true);
    try {
      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : null;

      // Current user is the first player (Team 1)
      const creatorPlayer = {
        id: user.uid,
        name: userData?.username || user.displayName || user.email?.split('@')[0] || 'Speler',
        level: userData?.level || '?',
        team: 1,
        avatar: userData?.avatar || '',
      };

      // Create 3 empty slots
      const players = [
        creatorPlayer,
        { id: null, name: null, level: null, team: 1 },
        { id: null, name: null, level: null, team: 2 },
        { id: null, name: null, level: null, team: 2 },
      ];

      const matchData = {
        club: selectedClub,
        date: selectedDate,
        time: selectedTime,
        levelMin: levelMin,
        levelMax: levelMax,
        isMixed: isMixed,
        isCompetitive: isCompetitive,
        isPrivate: isPrivate,
        pricePerPlayer: 10, // Hardcoded for prototype
        distance: '2.4 km', // Hardcoded for prototype
        status: 'open',
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        playerIds: [user.uid],
        players: players,
      };

      const docRef = await addDoc(collection(firestore, 'matches'), matchData);
      
      // Update all-time match history for the creator
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
        allTimeMatchIds: arrayUnion(docRef.id)
      }).catch(err => console.error('Error updating creator history:', err));

      Alert.alert('Succes', 'Je wedstrijd is aangemaakt!', [
        { 
          text: 'OK', 
          onPress: () => {
            router.back();
          } 
        }
      ]);

      // Fallback voor web omdat Alert.alert callbacks soms niet vuren
      if (typeof window !== 'undefined') {
        router.back();
      }

    } catch (error) {
      Alert.alert('Fout', 'Er is iets misgegaan bij het aanmaken van de wedstrijd.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nieuwe Wedstrijd</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Club ── */}
        <Text style={styles.sectionLabel}>Club</Text>
        <TouchableOpacity style={styles.pickerBtn} onPress={() => {
          setShowClubs(!showClubs);
          setShowDates(false);
          setShowTimes(false);
        }}>
          <Ionicons name="business-outline" size={18} color="#00A86B" />
          <Text style={[styles.pickerText, !selectedClub && { color: '#bbb' }]}>
            {selectedClub ?? 'Selecteer een club'}
          </Text>
          <Ionicons name={showClubs ? 'chevron-up' : 'chevron-down'} size={18} color="#ccc" />
        </TouchableOpacity>
        {showClubs && (
          <View style={styles.dropdown}>
            {CLUBS.map((club) => (
              <TouchableOpacity
                key={club}
                style={[styles.dropdownItem, selectedClub === club && styles.dropdownItemActive]}
                onPress={() => { setSelectedClub(club); setShowClubs(false); }}
              >
                <Text style={[styles.dropdownText, selectedClub === club && styles.dropdownTextActive]}>
                  {club}
                </Text>
                {selectedClub === club && <Ionicons name="checkmark" size={16} color="#00A86B" />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Datum ── */}
        <Text style={styles.sectionLabel}>Datum</Text>
        <TouchableOpacity style={styles.pickerBtn} onPress={() => {
          setShowDates(!showDates);
          setShowClubs(false);
          setShowTimes(false);
        }}>
          <Ionicons name="calendar-outline" size={18} color="#00A86B" />
          <Text style={[styles.pickerText, !selectedDate && { color: '#bbb' }]}>
            {selectedDate
              ? DATES.find(d => d.key === selectedDate)?.label
              : 'Selecteer een datum'}
          </Text>
          <Ionicons name={showDates ? 'chevron-up' : 'chevron-down'} size={18} color="#ccc" />
        </TouchableOpacity>
        {showDates && (
          <View style={styles.dateGrid}>
            {DATES.map((d) => (
              <TouchableOpacity
                key={d.key}
                style={[styles.dateChip, selectedDate === d.key && styles.dateChipActive]}
                onPress={() => { setSelectedDate(d.key); setShowDates(false); }}
              >
                {d.isToday && (
                  <Text style={[styles.dateTodayLabel, selectedDate === d.key && { color: '#fff' }]}>
                    vandaag
                  </Text>
                )}
                <Text style={[styles.dateChipText, selectedDate === d.key && styles.dateChipTextActive]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Tijdstip ── */}
        <Text style={styles.sectionLabel}>Tijdstip</Text>
        <TouchableOpacity style={styles.pickerBtn} onPress={() => {
          setShowTimes(!showTimes);
          setShowClubs(false);
          setShowDates(false);
        }}>
          <Ionicons name="time-outline" size={18} color="#00A86B" />
          <Text style={[styles.pickerText, !selectedTime && { color: '#bbb' }]}>
            {selectedTime ?? 'Selecteer een uur'}
          </Text>
          <Ionicons name={showTimes ? 'chevron-up' : 'chevron-down'} size={18} color="#ccc" />
        </TouchableOpacity>
        {showTimes && (
          <View style={styles.timeGrid}>
            {TIMES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.timeChip, selectedTime === t && styles.timeChipActive]}
                onPress={() => { setSelectedTime(t); setShowTimes(false); }}
              >
                <Text style={[styles.timeChipText, selectedTime === t && styles.timeChipTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Niveauvork ── */}
        <Text style={styles.sectionLabel}>Niveauvork</Text>
        <View style={styles.card}>
          <View style={styles.levelDisplay}>
            <View style={styles.levelPill}>
              <Text style={styles.levelPillLabel}>Min</Text>
              <Text style={styles.levelPillValue}>{levelMin.toFixed(1)}</Text>
            </View>
            <View style={styles.levelDash} />
            <View style={styles.levelPill}>
              <Text style={styles.levelPillLabel}>Max</Text>
              <Text style={styles.levelPillValue}>{levelMax.toFixed(1)}</Text>
            </View>
          </View>

          <Text style={styles.levelSubLabel}>Minimum niveau</Text>
          <View style={styles.levelSteps}>
            {LEVEL_STEPS.filter((l) => l <= levelMax).map((l) => (
              <TouchableOpacity
                key={l}
                style={[styles.levelStep, levelMin === l && styles.levelStepActive]}
                onPress={() => setLevelMin(l)}
              >
                <Text style={[styles.levelStepText, levelMin === l && styles.levelStepTextActive]}>
                  {l.toFixed(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.levelSubLabel, { marginTop: 14 }]}>Maximum niveau</Text>
          <View style={styles.levelSteps}>
            {LEVEL_STEPS.filter((l) => l >= levelMin).map((l) => (
              <TouchableOpacity
                key={l}
                style={[styles.levelStep, levelMax === l && styles.levelStepActive]}
                onPress={() => setLevelMax(l)}
              >
                <Text style={[styles.levelStepText, levelMax === l && styles.levelStepTextActive]}>
                  {l.toFixed(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Opties ── */}
        <Text style={styles.sectionLabel}>Opties</Text>
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <View style={styles.toggleIcon}>
                <Ionicons name="people-outline" size={18} color="#00A86B" />
              </View>
              <View>
                <Text style={styles.toggleLabel}>Gemengd</Text>
                <Text style={styles.toggleSub}>Mannen en vrouwen samen</Text>
              </View>
            </View>
            <Switch
              value={isMixed}
              onValueChange={setIsMixed}
              trackColor={{ false: '#ddd', true: '#00A86B' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.toggleDivider} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <View style={styles.toggleIcon}>
                <Ionicons name="trophy-outline" size={18} color="#00A86B" />
              </View>
              <View>
                <Text style={styles.toggleLabel}>Competitief</Text>
                <Text style={styles.toggleSub}>Levels worden aangepast na afloop</Text>
              </View>
            </View>
            <Switch
              value={isCompetitive}
              onValueChange={setIsCompetitive}
              trackColor={{ false: '#ddd', true: '#00A86B' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.toggleDivider} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <View style={styles.toggleIcon}>
                <Ionicons name="lock-closed-outline" size={18} color="#00A86B" />
              </View>
              <View>
                <Text style={styles.toggleLabel}>Privé</Text>
                <Text style={styles.toggleSub}>Alleen zichtbaar in het Privé tabblad</Text>
              </View>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: '#ddd', true: '#00A86B' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* ── Info box ── */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={18} color="#00A86B" />
          <Text style={styles.infoText}>
            Na aanmaak kunnen spelers met niveau {levelMin.toFixed(1)}–{levelMax.toFixed(1)} zich inschrijven.
            De wedstrijd start zodra alle 4 plaatsen bezet zijn.
          </Text>
        </View>

        {/* ── Create button ── */}
        <TouchableOpacity
          style={[styles.createBtn, !canCreate && styles.createBtnDisabled]}
          onPress={handleCreate}
          disabled={!canCreate}
        >
          <Text style={styles.createBtnText}>Wedstrijd Aanmaken</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { padding: 16, paddingBottom: 40 },

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

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 20,
  },

  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pickerText: { flex: 1, fontSize: 15, color: '#333' },

  // Club dropdown
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  dropdownItemActive: { backgroundColor: '#f0faf6' },
  dropdownText: { fontSize: 15, color: '#333' },
  dropdownTextActive: { color: '#00A86B', fontWeight: '600' },

  // Date grid
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginTop: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  dateChipActive: { backgroundColor: '#00A86B' },
  dateChipText: { fontSize: 13, fontWeight: '600', color: '#555' },
  dateChipTextActive: { color: '#fff' },
  dateTodayLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#00A86B',
    textTransform: 'uppercase',
    marginBottom: 1,
  },

  // Time grid
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginTop: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  timeChipActive: { backgroundColor: '#00A86B' },
  timeChipText: { fontSize: 13, fontWeight: '600', color: '#555' },
  timeChipTextActive: { color: '#fff' },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // Level
  levelDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 18,
  },
  levelPill: {
    alignItems: 'center',
    backgroundColor: '#f0faf6',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  levelPillLabel: { fontSize: 10, color: '#999', fontWeight: '600', textTransform: 'uppercase' },
  levelPillValue: { fontSize: 26, fontWeight: '900', color: '#00A86B' },
  levelDash: { width: 20, height: 2, backgroundColor: '#ddd', borderRadius: 1 },
  levelSubLabel: { fontSize: 12, color: '#999', fontWeight: '600', marginBottom: 8 },
  levelSteps: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  levelStep: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  levelStepActive: { backgroundColor: '#00A86B' },
  levelStepText: { fontSize: 12, fontWeight: '600', color: '#555' },
  levelStepTextActive: { color: '#fff' },

  // Toggles
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  toggleIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e8f8f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleLabel: { fontSize: 14, fontWeight: '700', color: '#333' },
  toggleSub: { fontSize: 12, color: '#999', marginTop: 1 },
  toggleDivider: { height: 1, backgroundColor: '#f5f5f5', marginVertical: 12 },

  // Info box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#f0faf6',
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
  },
  infoText: { flex: 1, fontSize: 13, color: '#555', lineHeight: 18 },

  // Create button
  createBtn: {
    backgroundColor: '#00A86B',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  createBtnDisabled: { backgroundColor: '#b2dfce' },
  createBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});