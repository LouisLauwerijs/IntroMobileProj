// ─── languageSelector.tsx ─────────────────────────────────────────────────────
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';

const LANGUAGES = [
  { code: 'nl', label: 'Nederlands',  native: 'Nederlands',  flag: '🇧🇪' },
  { code: 'fr', label: 'Frans',       native: 'Français',    flag: '🇫🇷' },
  { code: 'en', label: 'Engels',      native: 'English',     flag: '🇬🇧' },
  { code: 'de', label: 'Duits',       native: 'Deutsch',     flag: '🇩🇪' },
  { code: 'es', label: 'Spaans',      native: 'Español',     flag: '🇪🇸' },
  { code: 'it', label: 'Italiaans',   native: 'Italiano',    flag: '🇮🇹' },
  { code: 'pt', label: 'Portugees',   native: 'Português',   flag: '🇵🇹' },
  { code: 'pl', label: 'Pools',       native: 'Polski',      flag: '🇵🇱' },
];

export default function LanguageSelectorScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState('nl');

  const handleSelect = (code: string) => {
    setSelected(code);
    setTimeout(() => router.back(), 320);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Taal</Text>
        <View style={{ width: 38 }} />
      </View>

      <Text style={styles.subtitle}>
        Kies de taal van de app. De wijziging gaat direct in.
      </Text>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.listCard}>
          {LANGUAGES.map((lang, idx) => {
            const active = selected === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langRow, idx < LANGUAGES.length - 1 && styles.langRowBorder]}
                onPress={() => handleSelect(lang.code)}
                activeOpacity={0.75}
              >
                <Text style={styles.flag}>{lang.flag}</Text>
                <View style={styles.langInfo}>
                  <Text style={[styles.langLabel, active && styles.langLabelActive]}>{lang.label}</Text>
                  <Text style={styles.langNative}>{lang.native}</Text>
                </View>
                {active && (
                  <View style={styles.checkCircle}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{ height: 40 }} />
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
  subtitle: {
    fontSize: 13, color: '#999', marginHorizontal: 16, marginBottom: 16, lineHeight: 18,
  },
  scroll: { paddingHorizontal: 16 },
  listCard: {
    backgroundColor: '#fff', borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    overflow: 'hidden',
  },
  langRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 15, gap: 14,
  },
  langRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  flag: { fontSize: 26 },
  langInfo: { flex: 1 },
  langLabel: { fontSize: 15, fontWeight: '600', color: '#333' },
  langLabelActive: { color: '#00A86B', fontWeight: '700' },
  langNative: { fontSize: 12, color: '#bbb', marginTop: 1 },
  checkCircle: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#00A86B',
    alignItems: 'center', justifyContent: 'center',
  },
});