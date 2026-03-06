import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const APP_VERSION = '1.0.0';
const BUILD = '2025.03.01';

const TEAM = [
  { name: 'Kobe Delbaere',  role: 'Developer'},
  { name: 'Louis Lauwerijs',   role: 'Product & Design'},
];

const LINKS = [
  { icon: 'logo-instagram',     label: 'Instagram',      url: 'https://instagram.com/kobedelbaere' },
  { icon: 'mail-outline',       label: 'Contact',        url: 'mailto:hello@padelmatch.be' },
];

const STATS = [
  { value: '2,400+', label: 'Spelers' },
  { value: '38',     label: 'Clubs' },
  { value: '12,000+', label: 'Wedstrijden' },
  { value: '4.8 ★',  label: 'App rating' },
];

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Over PadelMatch</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Logo hero */}
        <View style={styles.hero}>
          <View style={styles.logoBox}>
            <Ionicons name="tennisball" size={48} color="#00A86B" />
          </View>
          <Text style={styles.appName}>PadelMatch</Text>
          <Text style={styles.appTagline}>Verbindt padellers. Overal.</Text>
          <View style={styles.versionRow}>
            <View style={styles.versionChip}>
              <Text style={styles.versionChipText}>v{APP_VERSION}</Text>
            </View>
            <View style={styles.versionChip}>
              <Text style={styles.versionChipText}>Build {BUILD}</Text>
            </View>
          </View>
        </View>

        {/* Mission */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="heart-outline" size={18} color="#00A86B" />
            <Text style={styles.cardTitle}>Onze missie</Text>
          </View>
          <Text style={styles.bodyText}>
            PadelMatch is geboren uit een simpele frustratie: een padelbaan boeken of een tegenstander vinden was veel te omslachtig.
          </Text>
          <Text style={[styles.bodyText, { marginTop: 10 }]}>
            Wij geloven dat padel toegankelijk moet zijn voor iedereen — van beginner tot competitiespeler. Daarom bouwen we een platform dat spelers, clubs en wedstrijden naadloos met elkaar verbindt.
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {STATS.map((s) => (
            <View key={s.label} style={styles.statBox}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Team */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="people-outline" size={18} color="#00A86B" />
            <Text style={styles.cardTitle}>Het team</Text>
          </View>
          {TEAM.map((member, idx) => (
            <View
              key={member.name}
              style={[styles.teamRow, idx < TEAM.length - 1 && styles.teamRowBorder]}
            >
              <View>
                <Text style={styles.teamName}>{member.name}</Text>
                <Text style={styles.teamRole}>{member.role}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Links */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="link-outline" size={18} color="#00A86B" />
            <Text style={styles.cardTitle}>Volg ons</Text>
          </View>
          {LINKS.map((link, idx) => (
            <TouchableOpacity
              key={link.label}
              style={[styles.linkRow, idx < LINKS.length - 1 && styles.linkRowBorder]}
              onPress={() => Linking.openURL(link.url)}
              activeOpacity={0.75}
            >
              <View style={styles.linkIcon}>
                <Ionicons name={link.icon as any} size={18} color="#00A86B" />
              </View>
              <Text style={styles.linkLabel}>{link.label}</Text>
              <Ionicons name="open-outline" size={15} color="#ccc" />
            </TouchableOpacity>
          ))}
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

  scroll: { paddingHorizontal: 16 },

  hero: { alignItems: 'center', paddingVertical: 28, gap: 6 },
  logoBox: {
    width: 88, height: 88, borderRadius: 24,
    backgroundColor: '#e8f8f2', alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#00A86B', shadowOpacity: 0.2, shadowRadius: 12, elevation: 4,
  },
  appName: { fontSize: 28, fontWeight: '900', color: '#1a1a1a' },
  appTagline: { fontSize: 14, color: '#999', fontWeight: '500' },
  versionRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  versionChip: {
    backgroundColor: '#f0f0f0', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  versionChipText: { fontSize: 11, color: '#888', fontWeight: '600' },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  bodyText: { fontSize: 14, color: '#555', lineHeight: 21 },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12,
  },
  statBox: {
    flex: 1, minWidth: '44%', backgroundColor: '#fff', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: '900', color: '#00A86B' },
  statLabel: { fontSize: 11, color: '#999', fontWeight: '600', marginTop: 3, textTransform: 'uppercase' },

  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  teamRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  teamAvatar: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#e8f8f2', alignItems: 'center', justifyContent: 'center',
  },
  teamAvatarEmoji: { fontSize: 22 },
  teamName: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  teamRole: { fontSize: 12, color: '#999', marginTop: 2 },

  linkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13,
  },
  linkRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  linkIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#e8f8f2', alignItems: 'center', justifyContent: 'center',
  },
  linkLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#333' },

  madeIn: { alignItems: 'center', paddingVertical: 16, gap: 4 },
  madeInText: { fontSize: 13, color: '#999' },
  copyright: { fontSize: 11, color: '#ccc' },
});