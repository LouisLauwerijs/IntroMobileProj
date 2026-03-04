import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const upcomingMatches = [
  { id: '1', court: 'Court A', time: 'Today, 6:00 PM', players: '3/4', sport: 'Padel' },
  { id: '2', court: 'Court B', time: 'Tomorrow, 10:00 AM', players: '2/4', sport: 'Padel' },
];

const nearbyCourts = [
  { id: '1', name: 'City Padel Club', distance: '0.5 km', available: 3 },
  { id: '2', name: 'Riverside Padel', distance: '1.2 km', available: 1 },
  { id: '3', name: 'Central Sports Hub', distance: '2.0 km', available: 5 },
];

export default function HomeScreen() {
  const router = useRouter();

  const quickActions = [
    { icon: 'add-circle-outline', label: 'New Match', onPress: () => {} },
    { icon: 'search-outline', label: 'Find Match', onPress: () => {} },
    { icon: 'calendar-outline', label: 'Book Court', onPress: () => router.push('/book') },
    { icon: 'trophy-outline', label: 'Rankings', onPress: () => {} },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning 👋</Text>
            <Text style={styles.username}>Alex</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={26} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courts, players..."
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.quickActions}>
          {quickActions.map((action) => (
            <TouchableOpacity key={action.label} style={styles.actionButton} onPress={action.onPress}>
              <Ionicons name={action.icon as any} size={26} color="#00A86B" />
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Upcoming Matches</Text>
        {upcomingMatches.map((match) => (
          <TouchableOpacity key={match.id} style={styles.matchCard}>
            <View>
              <Text style={styles.matchCourt}>{match.court}</Text>
              <Text style={styles.matchTime}>{match.time}</Text>
              <Text style={styles.matchSport}>{match.sport}</Text>
            </View>
            <View style={styles.matchRight}>
              <Ionicons name="people-outline" size={16} color="#00A86B" />
              <Text style={styles.matchPlayers}>{match.players}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Courts Near You</Text>
        {nearbyCourts.map((court) => (
          <TouchableOpacity key={court.id} style={styles.courtCard} onPress={() => router.push('/book')}>
            <View style={styles.courtIcon}>
              <Ionicons name="tennisball-outline" size={24} color="#00A86B" />
            </View>
            <View style={styles.courtInfo}>
              <Text style={styles.courtName}>{court.name}</Text>
              <Text style={styles.courtDistance}>{court.distance} away</Text>
            </View>
            <Text style={styles.courtAvailable}>{court.available} free</Text>
          </TouchableOpacity>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10 },
  greeting: { fontSize: 14, color: '#999' },
  username: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 16, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#333' },
  quickActions: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, padding: 16, marginBottom: 8 },
  actionButton: { alignItems: 'center', gap: 6 },
  actionLabel: { fontSize: 11, color: '#555', fontWeight: '500' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#333', marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
  matchCard: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, padding: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  matchCourt: { fontSize: 16, fontWeight: '600', color: '#333' },
  matchTime: { fontSize: 13, color: '#999', marginTop: 2 },
  matchSport: { fontSize: 12, color: '#00A86B', fontWeight: '600', marginTop: 4 },
  matchRight: { alignItems: 'center', gap: 4 },
  matchPlayers: { fontSize: 13, color: '#00A86B', fontWeight: '600' },
  courtCard: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  courtIcon: { backgroundColor: '#e8f8f2', borderRadius: 10, padding: 10 },
  courtInfo: { flex: 1 },
  courtName: { fontSize: 15, fontWeight: '600', color: '#333' },
  courtDistance: { fontSize: 12, color: '#999', marginTop: 2 },
  courtAvailable: { fontSize: 13, color: '#00A86B', fontWeight: '600' },
});
