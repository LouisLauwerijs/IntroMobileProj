import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from 'react-native';
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
  orderBy,
  onSnapshot,
  updateDoc,
  arrayUnion
} from '../../firebase';

function LevelBar({ level }: { level: number }) {
  const pct = ((level - 0.5) / 6.5) * 100;
  return (
    <View style={styles.levelBarWrap}>
      <View style={styles.levelBarBg}>
        <View style={[styles.levelBarFill, { width: `${pct}%` as any }]} />
      </View>
      <View style={styles.levelBarLabels}>
        <Text style={styles.levelBarTick}>0.5</Text>
        <Text style={styles.levelBarTick}>3.5</Text>
        <Text style={styles.levelBarTick}>7.0</Text>
      </View>
    </View>
  );
}

type RecentMatch = {
  id: string;
  result: 'Win' | 'Loss' | 'Draw';
  score: string;
  opponent: string;
  date: string;
  court: string;
};

export default function ProfileScreen() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [userData, setUserData] = useState<any>(null);
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);

  // 1. Luister naar Auth status en Gebruikersgegevens
  useEffect(() => {
    let userUnsubscribe: any;
    
    const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Live listener op het gebruikersdocument voor de teller
        userUnsubscribe = onSnapshot(doc(firestore, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            setUserData({
              name: user.displayName || 'Speler',
              email: user.email,
              level: 2.5,
              allTimeMatchIds: [],
              createdAt: { toDate: () => new Date() }
            });
          }
          setLoading(false);
        });
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (userUnsubscribe) userUnsubscribe();
    };
  }, []);

  // 2. Haal actieve matches op en synchroniseer met allTime geschiedenis
  useEffect(() => {
    if (!currentUser) {
      setRecentMatches([]);
      setLoadingMatches(false);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(firestore, 'matches'),
      where('playerIds', 'array-contains', currentUser.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Synchroniseer live inschrijvingen naar de all-time geschiedenis in het gebruikersprofiel
      const currentMatchIds = snapshot.docs.map(d => d.id);
      if (currentMatchIds.length > 0) {
        const userRef = doc(firestore, 'users', currentUser.uid);
        updateDoc(userRef, {
          allTimeMatchIds: arrayUnion(...currentMatchIds)
        }).catch(err => console.error('Error syncing match history:', err));
      }

      // Filter voor de "Recente Wedstrijden" lijst op het scherm (alleen verleden)
      const fetched = snapshot.docs
        .map(docSnap => {
          const d = docSnap.data();
          if ((d.date || '') >= today) return null;

          const players = d.players || [];
          const userPlayer = players.find((p: any) => p.id === currentUser.uid);
          const userTeam = userPlayer?.team || 1;
          const opponents = players
            .filter((p: any) => p.team !== userTeam)
            .map((p: any) => p.name)
            .filter(Boolean);
          
          const opponentText = opponents.length > 0 ? opponents.join(' & ') : 'Tegenstanders';
          
          let result: 'Win' | 'Loss' | 'Draw' = 'Draw';
          if (d.won === true) result = 'Win';
          else if (d.won === false) result = 'Loss';

          return {
            id: docSnap.id,
            result,
            score: d.result || '0-0',
            opponent: opponentText,
            date: d.date || '',
            court: d.club || 'Onbekende club',
          };
        })
        .filter((m): m is RecentMatch => m !== null)
        .slice(0, 3);

      setRecentMatches(fetched);
      setLoadingMatches(false);
    }, (err) => {
      console.error('Error fetching matches:', err);
      setLoadingMatches(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00A86B" />
      </SafeAreaView>
    );
  }

  if (!userData && !currentUser) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Niet ingelogd.</Text>
        <TouchableOpacity onPress={() => router.push('/login')} style={styles.viewAllBtn}>
          <Text style={styles.viewAllText}>Inloggen</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const name = userData?.name || userData?.username || 'Onbekende Gebruiker';
  const location = userData?.location || 'Locatie onbekend';
  const avatar = userData?.avatar;
  const level = userData?.level || 2.5;
  const createdAt = userData?.createdAt?.toDate ? userData.createdAt.toDate() : new Date();
  const memberSince = createdAt.toLocaleDateString('nl-BE', { month: 'long', year: 'numeric' });
  
  // De teller is nu de unieke geschiedenis van alle inschrijvingen ooit
  const totalMatchesCount = userData?.allTimeMatchIds?.length || 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profiel</Text>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push('/(screens)/settings')}
          >
            <Ionicons name="settings-outline" size={22} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Identity Card */}
        <TouchableOpacity
          style={styles.identityCard}
          onPress={() => router.push('/(screens)/editProfile')}
          activeOpacity={0.88}
        >
          <View style={styles.avatarWrapper}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="person" size={40} color="#ccc" />
              </View>
            )}
          </View>
          <View style={styles.identityInfo}>
            <Text style={styles.userName}>{name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color="#999" />
              <Text style={styles.locationText}>{location}</Text>
            </View>
            <Text style={styles.memberSince}>Lid sinds {memberSince}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#ccc" />
        </TouchableOpacity>

        {/* Level Progress */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="trending-up-outline" size={18} color="#00A86B" />
            <Text style={styles.cardTitle}>Speelniveau</Text>
            <View style={styles.levelPill}>
              <Text style={styles.levelPillText}>{level.toFixed(1)}</Text>
            </View>
          </View>
          <LevelBar level={level} />
          <Text style={styles.levelHint}>
            Speel competitieve wedstrijden om je level te verbeteren.
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Wedstrijden', value: totalMatchesCount, icon: 'tennisball-outline' },
            { label: 'Gewonnen',    value: 12,                icon: 'trophy-outline' },
            { label: 'Winratio',    value: '65%',             icon: 'stats-chart-outline' },
          ].map((s) => (
            <View key={s.label} style={styles.statBox}>
              <Ionicons name={s.icon as any} size={20} color="#00A86B" style={{ marginBottom: 6 }} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Recent Matches */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="people-outline" size={18} color="#00A86B" />
            <Text style={styles.cardTitle}>Recente Wedstrijden</Text>
          </View>

          {loadingMatches ? (
            <ActivityIndicator size="small" color="#00A86B" style={{ marginVertical: 20 }} />
          ) : recentMatches.length > 0 ? (
            recentMatches.map((m, idx) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.matchRow, idx < recentMatches.length - 1 && styles.matchRowBorder]}
                onPress={() => router.push({ pathname: '/(screens)/matchDetail', params: { id: m.id } })}
              >
                <View style={[styles.resultBadge, m.result === 'Win' ? styles.winBadge : m.result === 'Loss' ? styles.lossBadge : { backgroundColor: '#fff8ee' }]}>
                  <Text style={[styles.resultBadgeText, { color: m.result === 'Win' ? '#00A86B' : m.result === 'Loss' ? '#E53935' : '#F5A623' }]}>
                    {m.result === 'Win' ? 'W' : m.result === 'Loss' ? 'V' : 'G'}
                  </Text>
                </View>
                <View style={styles.matchInfo}>
                  <Text style={styles.matchOpponent} numberOfLines={1}>{m.opponent}</Text>
                  <Text style={styles.matchMeta}>{m.court} · {m.date}</Text>
                </View>
                <Text style={[styles.matchScore, m.result === 'Win' ? styles.scoreWin : m.result === 'Loss' ? styles.scoreLoss : { color: '#F5A623' }]}>
                  {m.score}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ color: '#bbb', fontSize: 13 }}>Nog geen wedstrijden gespeeld</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => router.push('/(screens)/matchHistory')}
          >
            <Text style={styles.viewAllText}>Alle wedstrijden bekijken</Text>
            <Ionicons name="arrow-forward" size={14} color="#00A86B" />
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>PadelMatch v1.0.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { paddingBottom: 40 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  settingsBtn: {
    backgroundColor: '#fff', padding: 8, borderRadius: 10,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },

  identityCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 8, marginBottom: 12,
    borderRadius: 16, padding: 16, gap: 14,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#eee' },
  identityInfo: { flex: 1 },
  userName: { fontSize: 17, fontWeight: '800', color: '#1a1a1a', marginBottom: 3 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 3 },
  locationText: { fontSize: 12, color: '#999' },
  memberSince: { fontSize: 11, color: '#bbb' },

  card: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', flex: 1 },
  levelPill: {
    backgroundColor: '#e8f8f2', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  levelPillText: { fontSize: 13, fontWeight: '900', color: '#00A86B' },

  levelBarWrap: { marginBottom: 8 },
  levelBarBg: { height: 8, backgroundColor: '#eee', borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  levelBarFill: { height: '100%', backgroundColor: '#00A86B', borderRadius: 4 },
  levelBarLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  levelBarTick: { fontSize: 10, color: '#bbb' },
  levelHint: { fontSize: 12, color: '#aaa', marginTop: 4 },

  statsGrid: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, gap: 10 },
  statBox: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  statLabel: { fontSize: 10, color: '#999', fontWeight: '600', marginTop: 2, textAlign: 'center' },

  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  matchRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  resultBadge: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  winBadge: { backgroundColor: '#e8f8f2' },
  lossBadge: { backgroundColor: '#fdecea' },
  resultBadgeText: { fontSize: 13, fontWeight: '800' },
  matchInfo: { flex: 1 },
  matchOpponent: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  matchMeta: { fontSize: 11, color: '#999', marginTop: 2 },
  matchScore: { fontSize: 13, fontWeight: '700' },
  scoreWin: { color: '#00A86B' },
  scoreLoss: { color: '#E53935' },
  viewAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0',
  },
  viewAllText: { fontSize: 13, color: '#00A86B', fontWeight: '700' },

  versionText: { textAlign: 'center', fontSize: 11, color: '#ccc', marginTop: 4 },
});
