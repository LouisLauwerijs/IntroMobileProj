import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';

const CITIES = [
  { id: '1', name: 'Antwerpen',  region: 'Antwerpen', courts: 12 },
  { id: '2', name: 'Brussel',    region: 'Brussel',   courts: 9  },
  { id: '3', name: 'Gent',       region: 'Oost-Vlaanderen', courts: 7 },
  { id: '4', name: 'Brugge',     region: 'West-Vlaanderen', courts: 5 },
  { id: '5', name: 'Leuven',     region: 'Vlaams-Brabant',  courts: 6 },
  { id: '6', name: 'Hasselt',    region: 'Limburg',         courts: 4 },
  { id: '7', name: 'Mechelen',   region: 'Antwerpen',       courts: 3 },
  { id: '8', name: 'Aalst',      region: 'Oost-Vlaanderen', courts: 2 },
  { id: '9', name: 'Kortrijk',   region: 'West-Vlaanderen', courts: 3 },
  { id: '10', name: 'Genk',      region: 'Limburg',         courts: 2 },
];

export default function DefaultLocationScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState('1');
  const [search, setSearch] = useState('');

  const filtered = CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.region.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (id: string) => {
    setSelected(id);
    setTimeout(() => router.back(), 320);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Standaard locatie</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Use current location */}
      <TouchableOpacity style={styles.gpsRow} activeOpacity={0.82}>
        <View style={styles.gpsIcon}>
          <Ionicons name="navigate" size={18} color="#00A86B" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.gpsLabel}>Gebruik huidige locatie</Text>
          <Text style={styles.gpsSub}>GPS wordt gebruikt om dichtbijzijnde banen te tonen</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </TouchableOpacity>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={17} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Zoek een stad..."
          placeholderTextColor="#bbb"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={17} color="#ccc" />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.sectionLabel}>Beschikbare steden</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.listCard}>
          {filtered.map((city, idx) => {
            const active = selected === city.id;
            return (
              <TouchableOpacity
                key={city.id}
                style={[styles.cityRow, idx < filtered.length - 1 && styles.cityRowBorder]}
                onPress={() => handleSelect(city.id)}
                activeOpacity={0.75}
              >
                <View style={[styles.cityIcon, active && styles.cityIconActive]}>
                  <Ionicons name="location" size={16} color={active ? '#fff' : '#00A86B'} />
                </View>
                <View style={styles.cityInfo}>
                  <Text style={[styles.cityName, active && styles.cityNameActive]}>{city.name}</Text>
                  <Text style={styles.cityRegion}>{city.region} · {city.courts} banen</Text>
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

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="location-outline" size={40} color="#ccc" />
            <Text style={styles.emptyText}>Geen steden gevonden</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  backBtn: {
    backgroundColor: '#fff', padding: 8, borderRadius: 10,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },

  gpsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#f0faf6', marginHorizontal: 16, marginBottom: 12,
    borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#c3e6d8',
  },
  gpsIcon: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#e8f8f2', alignItems: 'center', justifyContent: 'center',
  },
  gpsLabel: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  gpsSub: { fontSize: 11, color: '#999', marginTop: 2 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#333' },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#bbb',
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginHorizontal: 16, marginBottom: 8,
  },

  scroll: { paddingHorizontal: 16 },
  listCard: {
    backgroundColor: '#fff', borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    overflow: 'hidden',
  },
  cityRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  cityRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  cityIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#e8f8f2', alignItems: 'center', justifyContent: 'center',
  },
  cityIconActive: { backgroundColor: '#00A86B' },
  cityInfo: { flex: 1 },
  cityName: { fontSize: 15, fontWeight: '600', color: '#333' },
  cityNameActive: { color: '#00A86B', fontWeight: '700' },
  cityRegion: { fontSize: 12, color: '#bbb', marginTop: 1 },
  checkCircle: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#00A86B', alignItems: 'center', justifyContent: 'center',
  },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 14, color: '#bbb' },
});