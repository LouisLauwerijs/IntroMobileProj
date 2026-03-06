import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Image, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';

const clubs = [
  {
    id: '1',
    name: 'City Padel Club',
    location: 'Antwerpen Centrum',
    distance: '0.5 km',
    pricePerHour: 18,
    rating: 4.8,
    reviews: 124,
    availableSlots: 3,
    image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=80',
    tags: ['Indoor', 'Parking', 'Bar'],
    courts: 6,
  },
  {
    id: '2',
    name: 'Riverside Padel',
    location: 'Linkeroever',
    distance: '1.2 km',
    pricePerHour: 14,
    rating: 4.5,
    reviews: 89,
    availableSlots: 1,
    image: 'https://images.unsplash.com/photo-1680181864755-8f6f5537b92c?w=600&q=80',
    tags: ['Outdoor', 'Lights'],
    courts: 4,
  },
  {
    id: '3',
    name: 'Central Sports Hub',
    location: 'Berchem',
    distance: '2.0 km',
    pricePerHour: 12,
    rating: 4.3,
    reviews: 56,
    availableSlots: 5,
    image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=600&q=80',
    tags: ['Indoor', 'Showers', 'Bar'],
    courts: 8,
  },
  {
    id: '4',
    name: 'Sportpark Noord',
    location: 'Merksem',
    distance: '3.1 km',
    pricePerHour: 16,
    rating: 4.6,
    reviews: 201,
    availableSlots: 2,
    image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=80',
    tags: ['Outdoor', 'Lights', 'Pro Shop'],
    courts: 10,
  },
];

const FILTERS = ['All', 'Indoor', 'Outdoor', 'Near me'];

export default function CourtsScreen() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const router = useRouter();

  const filtered = clubs.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Book a Court</Text>
        <TouchableOpacity style={styles.backBtn}>
          <Ionicons name="options-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={17} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Club name or location..."
          placeholderTextColor="#555"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={17} color="#555" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => setActiveFilter(f)}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.resultCount}>{filtered.length} clubs found</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {filtered.map(club => (
          <TouchableOpacity key={club.id} style={styles.card} onPress={() => router.push('/book/slot-picker')}>
            <View style={styles.imgWrapper}>
              <Image source={{ uri: club.image }} style={styles.img} />
              <View style={[styles.availBadge, club.availableSlots <= 1 && styles.availBadgeWarn]}>
                <Text style={styles.availText}>{club.availableSlots} slots free</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.clubName}>{club.name}</Text>
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={12} color="#666" />
                    <Text style={styles.locationText}>{club.location} · {club.distance}</Text>
                  </View>
                </View>
                <View style={styles.priceCol}>
                  <Text style={styles.price}>€{club.pricePerHour}</Text>
                  <Text style={styles.priceUnit}>/hour</Text>
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={12} color="#F5A623" />
                  <Text style={styles.rating}>{club.rating}</Text>
                  <Text style={styles.reviews}>({club.reviews})</Text>
                </View>
                <View style={styles.tagsRow}>
                  {club.tags.slice(0, 2).map(t => (
                    <View key={t} style={styles.tag}>
                      <Text style={styles.tagText}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <TouchableOpacity style={styles.bookBtn} onPress={() => router.push('/book/slot-picker')}>
                <Text style={styles.bookBtnText}>Choose time slot</Text>
                <Ionicons name="arrow-forward" size={16} color="#0D0D0D" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#fff' },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A',
    marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    gap: 8, marginBottom: 12, borderWidth: 1, borderColor: '#2A2A2A',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#fff' },

  filterScroll: { maxHeight: 44, marginBottom: 4 },
  filterRow: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A',
  },
  filterChipActive: { backgroundColor: '#00D68F', borderColor: '#00D68F' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#666' },
  filterTextActive: { color: '#0D0D0D' },

  resultCount: { fontSize: 12, color: '#555', marginHorizontal: 16, marginTop: 10, marginBottom: 8, fontWeight: '500' },

  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 14 },

  card: {
    backgroundColor: '#1A1A1A', borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  imgWrapper: { height: 170, position: 'relative' },
  img: { width: '100%', height: '100%' },
  availBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: '#00D68F', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  availBadgeWarn: { backgroundColor: '#F5A623' },
  availText: { color: '#0D0D0D', fontSize: 11, fontWeight: '800' },

  cardBody: { padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  clubName: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 3 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locationText: { fontSize: 12, color: '#666' },
  priceCol: { alignItems: 'flex-end' },
  price: { fontSize: 22, fontWeight: '900', color: '#00D68F' },
  priceUnit: { fontSize: 11, color: '#555' },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { fontSize: 13, fontWeight: '700', color: '#fff' },
  reviews: { fontSize: 12, color: '#555' },
  tagsRow: { flexDirection: 'row', gap: 6 },
  tag: { backgroundColor: '#252525', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 11, color: '#00D68F', fontWeight: '600' },

  bookBtn: {
    backgroundColor: '#00D68F', borderRadius: 12, paddingVertical: 12,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  bookBtnText: { color: '#0D0D0D', fontWeight: '800', fontSize: 14 },
});
