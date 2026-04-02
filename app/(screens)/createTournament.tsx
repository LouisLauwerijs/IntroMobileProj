import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  auth,
  firestore,
  collection,
  addDoc,
  serverTimestamp,
} from '../../firebase';

const CLUBS = [
  'City Padel Club',
  'Riverside Padel',
  'Central Sports Hub',
  'Sportpark Noord',
];

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

const FORMATS = ['Round Robin', 'Knockout', 'Groups + Knockout'];
const LEVELS = ['2.0–3.0', '3.0–4.0', '4.0–5.0', 'Alle niveaus'];

export default function CreateTournamentScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [format, setFormat] = useState('Round Robin');
  const [level, setLevel] = useState('3.0–4.0');
  const [totalSpots, setTotalSpots] = useState('16');
  const [price, setPrice] = useState('20');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const [showClubs, setShowClubs] = useState(false);
  const [showDates, setShowDates] = useState(false);

  const handleCreate = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('Fout', 'Je moet ingelogd zijn om een toernooi aan te maken.');
      return;
    }

    if (!name.trim() || !selectedClub || !selectedDate || !totalSpots.trim() || !price.trim()) {
      Alert.alert('Fout', 'Vul alle verplichte velden in.');
      return;
    }

    const spotsNum = parseInt(totalSpots, 10);
    const priceNum = parseFloat(price);

    if (isNaN(spotsNum) || spotsNum <= 0) {
      Alert.alert('Fout', 'Plaatsen moeten een positief getal zijn.');
      return;
    }

    if (isNaN(priceNum) || priceNum < 0) {
      Alert.alert('Fout', 'Prijs moet een positief getal zijn.');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(firestore, 'tournaments'), {
        name: name.trim(),
        club: selectedClub,
        date: selectedDate,
        format,
        level,
        totalSpots: spotsNum,
        spots: spotsNum,
        price: priceNum,
        description: description.trim(),
        status: 'open',
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        participantIds: [],
      });

      Alert.alert('Succes', 'Toernooi aangemaakt!', [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)/tournaments'),
        },
      ]);
    } catch (error) {
      Alert.alert('Fout', 'Kon toernooi niet aanmaken.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Nieuw toernooi</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Naam *</Text>
          <TextInput
            style={styles.input}
            placeholder="bijv. Antwerp Open"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        {/* Club */}
        <View style={styles.section}>
          <Text style={styles.label}>Club *</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => {
            setShowClubs(!showClubs);
            setShowDates(false);
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
        </View>

        {/* Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Datum *</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => {
            setShowDates(!showDates);
            setShowClubs(false);
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
            <View style={styles.dropdown}>
              {DATES.map((date) => (
                <TouchableOpacity
                  key={date.key}
                  style={[styles.dropdownItem, selectedDate === date.key && styles.dropdownItemActive]}
                  onPress={() => { setSelectedDate(date.key); setShowDates(false); }}
                >
                  <Text style={[styles.dropdownText, selectedDate === date.key && styles.dropdownTextActive]}>
                    {date.label}
                  </Text>
                  {selectedDate === date.key && <Ionicons name="checkmark" size={16} color="#00A86B" />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Format */}
        <View style={styles.section}>
          <Text style={styles.label}>Format</Text>
          <View style={styles.chipRow}>
            {FORMATS.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.chip, format === f && styles.chipActive]}
                onPress={() => setFormat(f)}
              >
                <Text style={[styles.chipText, format === f && styles.chipTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Level */}
        <View style={styles.section}>
          <Text style={styles.label}>Niveau</Text>
          <View style={styles.chipRow}>
            {LEVELS.map((lv) => (
              <TouchableOpacity
                key={lv}
                style={[styles.chip, level === lv && styles.chipActive]}
                onPress={() => setLevel(lv)}
              >
                <Text style={[styles.chipText, level === lv && styles.chipTextActive]}>{lv}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Total Spots */}
        <View style={styles.section}>
          <Text style={styles.label}>Plaatsen *</Text>
          <TextInput
            style={styles.input}
            placeholder="bijv. 16"
            value={totalSpots}
            onChangeText={setTotalSpots}
            keyboardType="number-pad"
          />
        </View>

        {/* Price */}
        <View style={styles.section}>
          <Text style={styles.label}>Prijs (€) *</Text>
          <TextInput
            style={styles.input}
            placeholder="bijv. 20"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Beschrijving</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Voeg aanvullende informatie toe..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Create Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createBtn, loading && { opacity: 0.5 }]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.createBtnText}>Toernooi aanmaken</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
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
  textArea: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  chipActive: {
    borderColor: '#00A86B',
    backgroundColor: '#00A86B',
  },
  chipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
  createBtn: {
    flexDirection: 'row',
    backgroundColor: '#00A86B',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  createBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
