import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Image, TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL = {
  firstName: 'Alex',
  lastName: 'Martens',
  email: 'alex.martens@email.com',
  phone: '+32 470 12 34 56',
  location: 'Antwerpen, BE',
  bio: 'Padel speler sinds 2021. Hou van competitief spelen op weekends.',
  avatar: 'https://i.pravatar.cc/300?img=11',
  gender: 'Man',
  birthYear: '1993',
  hand: 'Rechts',
  position: 'Beide',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const INTERESTS = [
  'Competitief', 'Vriendschappelijk', 'Training', 'Toernooien',
  'Mixed', 'Weekend speler', 'Avond speler', 'Pro coaching',
  'Beginners welkom', 'Gevorderden', 'Jongerenteam', 'Senioren',
];

const GENDERS   = ['Man', 'Vrouw', 'Niet-binair', 'Zeg ik liever niet'];
const HANDS     = ['Rechts', 'Links'];
const POSITIONS = ['Links', 'Rechts', 'Beide'];

const TABS = ['Persoonlijk', 'Voorkeuren', 'Wachtwoord', 'Interesses'];

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

function PersonalTab({ form, setField }: { form: typeof INITIAL; setField: (k: string, v: string) => void }) {
  return (
    <>
      <Field label="Voornaam"    value={form.firstName} onChange={(v) => setField('firstName', v)} />
      <Field label="Achternaam"  value={form.lastName}  onChange={(v) => setField('lastName', v)} />
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

function PreferencesTab({ form, setField }: { form: typeof INITIAL; setField: (k: string, v: string) => void }) {
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

function PasswordTab({ form, setField }: { form: typeof INITIAL; setField: (k: string, v: string) => void }) {
  return (
    <>
      <View style={styles.infoBox}>
        <Ionicons name="lock-closed-outline" size={16} color="#00A86B" />
        <Text style={styles.infoBoxText}>Gebruik minimaal 8 tekens met een combinatie van letters en cijfers.</Text>
      </View>
      <Field label="Huidig wachtwoord" value={form.currentPassword} onChange={(v) => setField('currentPassword', v)} secure placeholder="••••••••" />
      <Field label="Nieuw wachtwoord"  value={form.newPassword}     onChange={(v) => setField('newPassword', v)}     secure placeholder="••••••••" />
      <Field label="Bevestig wachtwoord" value={form.confirmPassword} onChange={(v) => setField('confirmPassword', v)} secure placeholder="••••••••" />

      <TouchableOpacity style={styles.forgotBtn}>
        <Text style={styles.forgotText}>Wachtwoord vergeten?</Text>
      </TouchableOpacity>
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
  const [form, setFormState] = useState(INITIAL);
  const [interests, setInterests] = useState<string[]>(['Competitief', 'Weekend speler', 'Gevorderden']);

  const setField = (key: string, value: string) =>
    setFormState((prev) => ({ ...prev, [key]: value }));

  const toggleInterest = (val: string) =>
    setInterests((prev) =>
      prev.includes(val) ? prev.filter((i) => i !== val) : [...prev, val]
    );

  const handleSave = () => {
    Alert.alert('Opgeslagen', 'Je profiel is bijgewerkt.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profiel bewerken</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>Opslaan</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar section */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarWrap}>
          <Image source={{ uri: form.avatar }} style={styles.avatar} />
          <TouchableOpacity style={styles.avatarEdit}>
            <Ionicons name="camera" size={15} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.changePhotoText}>Foto wijzigen</Text>
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
        {activeTab === 'Wachtwoord' && <PasswordTab    form={form} setField={setField} />}
        {activeTab === 'Interesses' && <InterestsTab   selected={interests} toggle={toggleInterest} />}

        {/* Save button inside scroll */}
        <TouchableOpacity style={styles.saveBlock} onPress={handleSave}>
          <Text style={styles.saveBlockText}>Wijzigingen opslaan</Text>
        </TouchableOpacity>

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

  saveBlock: {
    backgroundColor: '#00A86B', borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', marginTop: 24,
  },
  saveBlockText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});