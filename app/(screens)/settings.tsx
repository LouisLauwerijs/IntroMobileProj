import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Image, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';

const USER = {
  name: 'Alex Martens',
  email: 'alex.martens@email.com',
  avatar: 'https://i.pravatar.cc/300?img=11',
  level: 3.5,
};

type SettingRow = {
  icon: string;
  label: string;
  value?: string;
  route?: string;
  toggle?: boolean;
  toggleKey?: string;
  destructive?: boolean;
  color?: string;
};

type Section = { title: string; rows: SettingRow[] };

export default function SettingsScreen() {
  const router = useRouter();
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    notifications: true,
    matchInvites: true,
    locationServices: false,
    darkMode: false,
  });

  const flip = (key: string) =>
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  const SECTIONS: Section[] = [
    {
      title: 'Account',
      rows: [
        { icon: 'person-outline',        label: 'Profiel bewerken',    route: '/(screens)/editProfile' },
        { icon: 'shield-checkmark-outline', label: 'Privacy & Beveiliging', route: '/(screens)/privacy' },
      ],
    },
    {
      title: 'Meldingen',
      rows: [
        { icon: 'notifications-outline', label: 'Pushmeldingen',       toggle: true, toggleKey: 'notifications' },
        { icon: 'people-outline',        label: 'Match uitnodigingen', toggle: true, toggleKey: 'matchInvites' },
      ],
    },
    {
      title: 'Locatie',
      rows: [
        { icon: 'location-outline',   label: 'Standaard locatie',  value: 'Antwerpen',  route: '/(screens)/defaultLocation' },
        { icon: 'navigate-outline',   label: 'Locatieservices',    toggle: true, toggleKey: 'locationServices' },
      ],
    },
    {
      title: 'Info',
      rows: [
        { icon: 'help-circle-outline',    label: 'Help & FAQ',          route: '/(screens)/faq' },
        { icon: 'document-text-outline',  label: 'Algemene voorwaarden', route: '/(screens)/termsAndConditions' },
        { icon: 'information-circle-outline', label: 'Over PadelMatch', route: '/(screens)/about' },
      ],
    },
    {
      title: 'Sessie',
      rows: [
        { icon: 'log-out-outline', label: 'Uitloggen', destructive: true, color: '#E53935', route: '/login' },
        { icon: 'trash-outline',   label: 'Account verwijderen', destructive: true, color: '#E53935' },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Instellingen</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Identity mini-card */}
        <TouchableOpacity
          style={styles.identityCard}
          onPress={() => router.push('/(screens)/editProfile')}
          activeOpacity={0.85}
        >
          <Image source={{ uri: USER.avatar }} style={styles.avatar} />
          <View style={styles.identityInfo}>
            <Text style={styles.identityName}>{USER.name}</Text>
            <Text style={styles.identityEmail}>{USER.email}</Text>
          </View>
          <View style={styles.levelChip}>
            <Text style={styles.levelChipText}>{USER.level.toFixed(1)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#ccc" />
        </TouchableOpacity>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionLabel}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.rows.map((row, idx) => (
                <TouchableOpacity
                  key={row.label}
                  style={[styles.row, idx < section.rows.length - 1 && styles.rowBorder]}
                  activeOpacity={row.toggle ? 1 : 0.7}
                  onPress={() => {
                    if (row.toggle) return;
                    if (row.route) router.push(row.route as any);
                  }}
                >
                  <View style={[styles.iconWrap, { backgroundColor: row.destructive ? '#fdecea' : '#e8f8f2' }]}>
                    <Ionicons name={row.icon as any} size={18} color={row.color ?? '#00A86B'} />
                  </View>
                  <Text style={[styles.rowLabel, row.destructive && { color: row.color }]}>
                    {row.label}
                  </Text>
                  <View style={styles.rowRight}>
                    {row.value && <Text style={styles.rowValue}>{row.value}</Text>}
                    {row.toggle && row.toggleKey ? (
                      <Switch
                        value={toggles[row.toggleKey]}
                        onValueChange={() => flip(row.toggleKey!)}
                        trackColor={{ false: '#ddd', true: '#00A86B' }}
                        thumbColor="#fff"
                      />
                    ) : (
                      !row.destructive || row.route ? (
                        <Ionicons name="chevron-forward" size={16} color="#ccc" />
                      ) : null
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.version}>PadelMatch v1.0.0 · Made with ❤️ in Antwerpen</Text>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

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
  scroll: { paddingHorizontal: 16, paddingTop: 8 },

  identityCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#eee' },
  identityInfo: { flex: 1 },
  identityName: { fontSize: 16, fontWeight: '800', color: '#1a1a1a' },
  identityEmail: { fontSize: 12, color: '#999', marginTop: 2 },
  levelChip: {
    backgroundColor: '#e8f8f2', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  levelChipText: { fontSize: 14, fontWeight: '900', color: '#00A86B' },

  section: { marginBottom: 18 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#bbb',
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 8, marginLeft: 2,
  },
  sectionCard: {
    backgroundColor: '#fff', borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 13, gap: 12,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  iconWrap: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowValue: { fontSize: 13, color: '#999' },
  version: { textAlign: 'center', fontSize: 12, color: '#ccc', marginTop: 4, marginBottom: 8 },
});