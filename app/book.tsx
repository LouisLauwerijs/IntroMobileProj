import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';

const courts = [
  {
    id: '1',
    name: 'City Padel Club',
    location: 'Antwerpen Centrum',
    distance: '0.5 km',
    pricePerHour: 18,
    rating: 4.8,
    reviews: 124,
    available: 3,
    image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=80',
    tags: ['Indoor', 'Lights', 'Parking'],
  },
  {
    id: '2',
    name: 'Riverside Padel',
    location: 'Linkeroever',
    distance: '1.2 km',
    pricePerHour: 14,
    rating: 4.5,
    reviews: 89,
    available: 1,
    image: 'https://images.unsplash.com/photo-1680181864755-8f6f5537b92c?w=600&q=80',
    tags: ['Outdoor', 'Lights'],
  },
  {
    id: '3',
    name: 'Central Sports Hub',
    location: 'Berchem',
    distance: '2.0 km',
    pricePerHour: 12,
    rating: 4.3,
    reviews: 56,
    available: 5,
    image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=600&q=80',
    tags: ['Indoor', 'Showers', 'Bar'],
  },
  {
    id: '4',
    name: 'Sportpark Noord',
    location: 'Merksem',
    distance: '3.1 km',
    pricePerHour: 16,
    rating: 4.6,
    reviews: 201,
    available: 2,
    image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=80',
    tags: ['Outdoor', 'Lights', 'Pro Shop'],
  },
];

export default function BookScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const filtered = courts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Padelbanen</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Zoek op naam of locatie..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#ccc" />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.resultsCount}>
        {filtered.length} baan{filtered.length !== 1 ? 'en' : ''} beschikbaar
      </Text>

      {/* Court Cards */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {filtered.map((court) => (
          <TouchableOpacity key={court.id} style={styles.card} activeOpacity={0.92}>
            <View style={styles.imageWrapper}>
              <Image source={{ uri: court.image }} style={styles.image} resizeMode="cover" />
              <View style={[styles.badge, court.available === 1 && styles.badgeWarning]}>
                <Text style={styles.badgeText}>
                  {court.available === 1 ? '1 baan vrij' : `${court.available} banen vrij`}
                </Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.courtName}>{court.name}</Text>
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={13} color="#999" />
                    <Text style={styles.locationText}>
                      {court.location} · {court.distance}
                    </Text>
                  </View>
                </View>
                <View style={styles.priceBox}>
                  <Text style={styles.price}>€{court.pricePerHour}</Text>
                  <Text style={styles.priceUnit}>/uur</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={13} color="#F5A623" />
                  <Text style={styles.ratingText}>{court.rating}</Text>
                  <Text style={styles.reviewsText}>({court.reviews})</Text>
                </View>
                <View style={styles.tagsRow}>
                  {court.tags.slice(0, 2).map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <TouchableOpacity style={styles.bookBtn}>
                <Text style={styles.bookBtnText}>Reserveer</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="tennisball-outline" size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>Geen banen gevonden</Text>
            <Text style={styles.emptySubtitle}>Probeer een andere zoekterm</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

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

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#333' },

  resultsCount: {
    fontSize: 13,
    color: '#999',
    marginHorizontal: 16,
    marginBottom: 8,
    fontWeight: '500',
  },

  listContent: { paddingHorizontal: 16, paddingBottom: 32, gap: 16 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  imageWrapper: { width: '100%', height: 180, position: 'relative' },
  image: { width: '100%', height: '100%' },

  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#00A86B',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeWarning: { backgroundColor: '#F5A623' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  cardBody: { padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  courtName: { fontSize: 17, fontWeight: '700', color: '#1a1a1a', marginBottom: 3 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locationText: { fontSize: 12, color: '#999' },

  priceBox: { alignItems: 'flex-end', marginLeft: 8 },
  price: { fontSize: 22, fontWeight: '800', color: '#00A86B' },
  priceUnit: { fontSize: 11, color: '#999', marginTop: -2 },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 13, fontWeight: '700', color: '#333' },
  reviewsText: { fontSize: 12, color: '#999' },
  tagsRow: { flexDirection: 'row', gap: 6 },
  tag: {
    backgroundColor: '#f0faf6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: { fontSize: 11, color: '#00A86B', fontWeight: '600' },

  bookBtn: {
    backgroundColor: '#00A86B',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#999' },
  emptySubtitle: { fontSize: 14, color: '#bbb' },
});
