import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Image, TextInput,
  Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { 
  auth, 
  firestore, 
  storage,
  doc, 
  getDoc, 
  setDoc, 
  collection,
  query,
  where,
  getDocs,
  onAuthStateChanged,
  ref,
  uploadBytes,
  getDownloadURL
} from '../../firebase';

// ─── Default state ────────────────────────────────────────────────────────────

const DEFAULT_FORM = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  phone: '',
  location: '',
  bio: '',
  avatar: '',
  gender: 'Man',
  birthYear: '',
  hand: 'Rechts',
  position: 'Beide'
};

const INTERESTS = [
  'Competitief', 'Vriendschappelijk', 'Training', 'Toernooien',
  'Mixed', 'Weekend speler', 'Avond speler', 'Pro coaching',
  'Beginners welkom', 'Gevorderden', 'Jongerenteam', 'Senioren',
];

const GENDERS   = ['Man', 'Vrouw', 'Niet-binair', 'Zeg ik liever niet'];
const HANDS     = ['Rechts', 'Links'];
const POSITIONS = ['Links', 'Rechts', 'Beide'];

const TABS = ['Persoonlijk', 'Voorkeuren', 'Interesses'];

// ─── Small helpers ────────────────────────────────────────────────────────────

function Field({
  label, value, onChange, placeholder = '', secure = false, keyboardType = 'default' as any,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; secure?: boolean; keyboardType?: any;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#bbb"
        secureTextEntry={secure}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  );
}

function ChipSelect({
  label, options, value, onChange,
}: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <View style={styles.chipSelectWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map((o) => (
          <TouchableOpacity
            key={o}
            style={[styles.chip, value === o && styles.chipActive]}
            onPress={() => onChange(o)}
          >
            <Text style={[styles.chipText, value === o && styles.chipTextActive]}>{o}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function PersonalTab({ form, setField }: { form: typeof DEFAULT_FORM; setField: (k: string, v: string) => void }) {
  return (
    <>
      <Field label="Voornaam"    value={form.firstName} onChange={(v) => setField('firstName', v)} />
      <Field label="Achternaam"  value={form.lastName}  onChange={(v) => setField('lastName', v)} />
      <Field label="Gebruikersnaam" value={form.username} onChange={(v) => setField('username', v)} placeholder="Unieke gebruikersnaam" />
      <Field label="E-mail"      value={form.email}     onChange={(v) => setField('email', v)} keyboardType="email-address" />
      <Field label="Telefoon"    value={form.phone}     onChange={(v) => setField('phone', v)} keyboardType="phone-pad" />
      <Field label="Locatie"     value={form.location}  onChange={(v) => setField('location', v)} />
      <Field label="Geboortejaar" value={form.birthYear} onChange={(v) => setField('birthYear', v)} keyboardType="numeric" />
      <ChipSelect label="Geslacht" options={GENDERS} value={form.gender} onChange={(v) => setField('gender', v)} />

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Bio</Text>
        <TextInput
          style={[styles.fieldInput, styles.textArea]}
          value={form.bio}
          onChangeText={(v) => setField('bio', v)}
          multiline
          numberOfLines={4}
          placeholder="Vertel iets over jezelf..."
          placeholderTextColor="#bbb"
        />
      </View>
    </>
  );
}

function PreferencesTab({ form, setField }: { form: typeof DEFAULT_FORM; setField: (k: string, v: string) => void }) {
  return (
    <>
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={16} color="#00A86B" />
        <Text style={styles.infoBoxText}>
          Je speelvoorkeuren helpen ons de beste wedstrijden en tegenstanders voor jou te vinden.
        </Text>
      </View>
      <ChipSelect label="Speelhand"  options={HANDS}     value={form.hand}     onChange={(v) => setField('hand', v)} />
      <ChipSelect label="Positie"    options={POSITIONS} value={form.position} onChange={(v) => setField('position', v)} />
    </>
  );
}

function InterestsTab({ selected, toggle }: { selected: string[]; toggle: (v: string) => void }) {
  return (
    <>
      <View style={styles.infoBox}>
        <Ionicons name="heart-outline" size={16} color="#00A86B" />
        <Text style={styles.infoBoxText}>
          Selecteer wat bij jou past. We gebruiken dit om betere aanbevelingen te doen.
        </Text>
      </View>
      <Text style={styles.fieldLabel}>Mijn speelstijl & interesses</Text>
      <View style={styles.interestGrid}>
        {INTERESTS.map((interest) => {
          const active = selected.includes(interest);
          return (
            <TouchableOpacity
              key={interest}
              style={[styles.interestChip, active && styles.interestChipActive]}
              onPress={() => toggle(interest)}
            >
              {active && <Ionicons name="checkmark" size={13} color="#fff" />}
              <Text style={[styles.interestChipText, active && styles.interestChipTextActive]}>
                {interest}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function EditProfileScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Persoonlijk');
  const [form, setFormState] = useState(DEFAULT_FORM);
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            // Split name if it exists as a single field
            let firstName = data.firstName || '';
            let lastName = data.lastName || '';
            if (!firstName && !lastName && data.name) {
              const parts = data.name.split(' ');
              firstName = parts[0];
              lastName = parts.slice(1).join(' ');
            }

            setFormState({
              ...DEFAULT_FORM,
              firstName: firstName,
              lastName: lastName,
              username: data.username || normalizeUsername(`${firstName}${lastName}`),
              email: data.email || user.email || '',
              phone: data.phone || '',
              location: data.location || '',
              bio: data.bio || '',
              avatar: data.avatar || '',
              gender: data.gender || 'Man',
              birthYear: data.birthYear || '',
              hand: data.hand || 'Rechts',
              position: data.position || 'Beide',
            });
            setInterests(data.interests || []);
          } else {
            // New user, pre-fill with auth data
            setFormState({
              ...DEFAULT_FORM,
              email: user.email || '',
              firstName: user.displayName?.split(' ')[0] || '',
              lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          Alert.alert('Fout', 'Kon profielgegevens niet laden.');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, []);

  const normalizeUsername = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_.]/g, '')
      .replace(/\s+/g, '');

  const isUsernameAvailable = async (username: string, currentUid: string) => {
    if (!username) return false;

    const normalized = normalizeUsername(username);
    const userQuery = query(
      collection(firestore, 'users'),
      where('username', '==', normalized)
    );

    const snapshot = await getDocs(userQuery);
    if (snapshot.empty) return true;

    if (snapshot.docs.length === 1 && snapshot.docs[0].id === currentUid) return true;

    return false;
  };

  const setField = (key: string, value: string) =>
    setFormState((prev) => ({ ...prev, [key]: value }));

  const toggleInterest = (val: string) =>
    setInterests((prev) =>
      prev.includes(val) ? prev.filter((i) => i !== val) : [...prev, val]
    );

  const pickImage = async () => {
    const user = auth.currentUser;
    if (!user) return;

    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Fout', 'Sorry, we hebben toestemming nodig om door je foto\'s te bladeren.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      handleImageUpload(result.assets[0].uri);
    }
  };

  const handleImageUpload = async (uri: string) => {
    const user = auth.currentUser;
    if (!user) return;

    setUploading(true);
    try {
      // 1. Fetch data from URI (needed for uploadBytes)
      const response = await fetch(uri);
      const blob = await response.blob();

      // 2. Create Storage reference
      const filename = `avatars/${user.uid}_${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);

      // 3. Upload to Storage
      await uploadBytes(storageRef, blob);

      // 4. Get Download URL
      const downloadURL = await getDownloadURL(storageRef);

      // 5. Update local state & Firestore
      setField('avatar', downloadURL);
      
      const userRef = doc(firestore, 'users', user.uid);
      await setDoc(userRef, { avatar: downloadURL }, { merge: true });

      Alert.alert('Succes', 'Profielfoto is bijgewerkt!');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Fout', 'Kon foto niet uploaden. Probeer het later opnieuw.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Fout', 'Je bent niet ingelogd.');
      return;
    }

    setSaving(true);
    try {
      const userRef = doc(firestore, 'users', user.uid);

      const username = normalizeUsername(form.username || `${form.firstName}${form.lastName}`);
      if (!username) {
        throw new Error('Voer een geldige gebruikersnaam in.');
      }

      const available = await isUsernameAvailable(username, user.uid);
      if (!available) {
        throw new Error('Deze gebruikersnaam is al in gebruik. Kies een andere.');
      }

      await setDoc(userRef, {
        firstName: form.firstName,
        lastName: form.lastName,
        username,
        name: `${form.firstName} ${form.lastName}`.trim(),
        phone: form.phone,
        location: form.location,
        bio: form.bio,
        gender: form.gender,
        birthYear: form.birthYear,
        hand: form.hand,
        position: form.position,
        interests: interests,
        email: form.email,
        updatedAt: new Date(),
      }, { merge: true });

      Alert.alert('Opgeslagen', 'Je profiel is bijgewerkt.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Fout', 'Kon profiel niet bijwerken.');
    } finally {
      setSaving(false);
    }
  };

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
        <Text style={styles.headerTitle}>Profiel bewerken</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Opslaan</Text>}
        </TouchableOpacity>
      </View>

      {/* Avatar section */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarWrap}>
          {uploading ? (
            <View style={[styles.avatar, { backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' }]}>
              <ActivityIndicator color="#00A86B" />
            </View>
          ) : form.avatar ? (
            <Image source={{ uri: form.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="person" size={50} color="#ccc" />
            </View>
          )}
        </View>
        <TouchableOpacity onPress={pickImage} disabled={uploading}>
          <Text style={styles.changePhotoText}>
            {uploading ? 'Bezig met uploaden...' : 'Foto wijzigen'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
        style={styles.tabsScroll}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === 'Persoonlijk' && <PersonalTab   form={form} setField={setField} />}
        {activeTab === 'Voorkeuren' && <PreferencesTab form={form} setField={setField} />}
        {activeTab === 'Interesses' && <InterestsTab   selected={interests} toggle={toggleInterest} />}

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
  saveBtn: {
    backgroundColor: '#00A86B', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  avatarSection: { alignItems: 'center', paddingVertical: 16 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#eee' },
  avatarEdit: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#00A86B', borderRadius: 12, padding: 6,
    borderWidth: 2, borderColor: '#fff',
  },
  changePhotoText: { fontSize: 13, color: '#00A86B', fontWeight: '600', marginTop: 8 },

  tabsScroll: { maxHeight: 46, backgroundColor: '#fff' },
  tabsRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  tab: {
    paddingHorizontal: 18, paddingVertical: 7,
    borderRadius: 20, backgroundColor: '#f0f0f0',
  },
  tabActive: { backgroundColor: '#00A86B' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#555' },
  tabTextActive: { color: '#fff' },

  scroll: { paddingHorizontal: 16, paddingTop: 18 },

  infoBox: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: '#f0faf6', borderRadius: 12,
    padding: 12, marginBottom: 18,
    borderWidth: 1, borderColor: '#c3e6d8',
  },
  infoBoxText: { flex: 1, fontSize: 13, color: '#555', lineHeight: 18 },

  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldInput: {
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: '#1a1a1a',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  textArea: { height: 96, textAlignVertical: 'top', paddingTop: 12 },

  chipSelectWrap: { marginBottom: 18 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#f0f0f0',
  },
  chipActive: { backgroundColor: '#00A86B' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#555' },
  chipTextActive: { color: '#fff' },

  forgotBtn: { alignItems: 'center', marginTop: 8 },
  forgotText: { fontSize: 13, color: '#00A86B', fontWeight: '600' },

  interestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  interestChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 20, backgroundColor: '#f0f0f0',
    borderWidth: 1.5, borderColor: 'transparent',
  },
  interestChipActive: { backgroundColor: '#00A86B', borderColor: '#00A86B' },
  interestChipText: { fontSize: 13, fontWeight: '600', color: '#555' },
  interestChipTextActive: { color: '#fff' },
});