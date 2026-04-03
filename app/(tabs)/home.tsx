import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, SafeAreaView, ActivityIndicator,
} from 'react-native';

const nearbyCourts = [
  { id: '1', name: 'City Padel Club', distance: '0.5 km', available: 3 },
  { id: '2', name: 'Riverside Padel', distance: '1.2 km', available: 1 },
  { id: '3', name: 'Central Sports Hub', distance: '2.0 km', available: 5 },
];

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { 
  auth, 
  firestore, 
  doc, 
  getDoc, 
  onAuthStateChanged,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit
} from '../../firebase';

export default function HomeScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('Speler');
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [userMatches, setUserMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  useEffect(() => {
    let unsubscribeNotifs: () => void;
    let unsubscribeMatches: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserName(data.firstName || data.name?.split(' ')[0] || user.displayName?.split(' ')[0] || 'Speler');
          } else {
            setUserName(user.displayName?.split(' ')[0] || 'Speler');
          }
        } catch (error) {
          console.error('Error fetching user name:', error);
        }

        // Set up real-time listener for unread notifications
        const qNotifs = query(
          collection(firestore, 'notifications'),
          where('userId', '==', user.uid),
          where('status', '==', 'unread')
        );

        unsubscribeNotifs = onSnapshot(qNotifs, (snapshot) => {
          setUnreadNotificationCount(snapshot.size);
        });

        // Set up real-time listener for USER matches
        const qMatches = query(
          collection(firestore, 'matches'),
          where('playerIds', 'array-contains', user.uid),
          orderBy('createdAt', 'desc'),
          limit(3)
        );

        unsubscribeMatches = onSnapshot(qMatches, (snapshot) => {
          const fetched = snapshot.docs.map((docSnap) => {
            const d = docSnap.data();
            const players = d.players ?? [];
            const joinedCount = players.filter((p: any) => p.name).length;
            
            return {
              id: docSnap.id,
              court: d.club || d.court || 'Baan',
              time: `${d.date || ''} om ${d.time || ''}`,
              players: `${joinedCount}/${players.length || 4}`,
              sport: 'Padel', // Default sport
            };
          });
          setUserMatches(fetched);
          setLoadingMatches(false);
        }, (err) => {
          console.error('Error fetching user matches:', err);
          setLoadingMatches(false);
        });
      } else {
        setUserName('Speler');
        setUserMatches([]);
        setLoadingMatches(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeNotifs) unsubscribeNotifs();
      if (unsubscribeMatches) unsubscribeMatches();
    };
  }, []);

  const quickActions = [
    { icon: 'add-circle-outline', label: 'Nieuwe match', onPress: () => router.push('/(screens)/newMatch') },
    { icon: 'search-outline', label: 'Zoek match', onPress: () => router.push('/(screens)/findMatch') },
    { icon: 'trophy-outline', label: 'Ranglijsten', onPress: () => router.push('/(screens)/rankings') },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Goede morgen 👋</Text>
            <Text style={styles.username}>{userName}</Text> 
          </View>
          <TouchableOpacity onPress={() => router.push('/(screens)/notifications')}>
            <View>
              <Ionicons name="notifications-outline" size={26} color="#333" />
              {unreadNotificationCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{unreadNotificationCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={1}
          onPress={() => router.push({ pathname: '/(screens)/searchResults', params: { q: '' } })}
        >
          <View style={styles.searchBar} pointerEvents="none">
            <Ionicons name="search-outline" size={18} color="#999" />
            <Text style={styles.searchPlaceholder}>Zoek naar banen, spelers, ...</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.quickActions}>
          {quickActions.map((action) => (
            <TouchableOpacity key={action.label} style={styles.actionButton} onPress={action.onPress}>
              <Ionicons name={action.icon as any} size={26} color="#00A86B" />
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Komende matches</Text>
          <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/matches', params: { tab: '2' } })}>
            <Text style={styles.seeAllText}>Zie alle</Text>
          </TouchableOpacity>
        </View>

        {loadingMatches ? (
          <ActivityIndicator size="small" color="#00A86B" style={{ marginVertical: 20 }} />
        ) : userMatches.length === 0 ? (
          <View style={styles.emptyMatches}>
            <Text style={styles.emptyMatchesText}>Geen komende matches gepland.</Text>
            <TouchableOpacity onPress={() => router.push('/(screens)/findMatch')}>
              <Text style={styles.emptyMatchesLink}>Zoek een match</Text>
            </TouchableOpacity>
          </View>
        ) : (
          userMatches.map((match) => (
            <TouchableOpacity
              key={match.id}
              style={styles.matchCard}
              onPress={() => router.push({ pathname: '/(screens)/matchDetail', params: { id: match.id } })}
            >
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
          ))
        )}

        <Text style={styles.sectionTitle}>Banen bij u in de buurt</Text>
        {nearbyCourts.map((court) => (
          <TouchableOpacity key={court.id} style={styles.courtCard} onPress={() => router.push('/book')}>
            <View style={styles.courtIcon}>
              <Ionicons name="tennisball-outline" size={24} color="#00A86B" />
            </View>
            <View style={styles.courtInfo}>
              <Text style={styles.courtName}>{court.name}</Text>
              <Text style={styles.courtDistance}>{court.distance}</Text>
            </View>
            <Text style={styles.courtAvailable}>{court.available} vrij</Text>
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

  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E53935',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchPlaceholder: { fontSize: 15, color: '#999' },
  searchInput: { flex: 1, fontSize: 15, color: '#333' },

  quickActions: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, padding: 16, marginBottom: 8 },
  actionButton: { alignItems: 'center', gap: 6 },
  actionLabel: { fontSize: 11, color: '#555', fontWeight: '500' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#333' },
  seeAllText: { fontSize: 13, color: '#00A86B', fontWeight: '600' },
  emptyMatches: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, padding: 20, alignItems: 'center', gap: 8 },
  emptyMatchesText: { fontSize: 14, color: '#999' },
  emptyMatchesLink: { fontSize: 14, color: '#00A86B', fontWeight: '700' },
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
