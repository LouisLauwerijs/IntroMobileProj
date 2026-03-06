import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, TextInput, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── FAQ Data ─────────────────────────────────────────────────────────────────

type FAQ = { q: string; a: string };
type FAQCategory = { title: string; icon: string; items: FAQ[] };

const FAQ_CATEGORIES: FAQCategory[] = [
  {
    title: 'Account & Profiel',
    icon: 'person-circle-outline',
    items: [
      { q: 'Hoe wijzig ik mijn profielafbeelding?', a: 'Ga naar Profiel → Profiel bewerken en tik op de camera-knop boven je huidige foto. Je kunt een foto kiezen uit je fotobibliotheek of een nieuwe foto nemen.' },
      { q: 'Hoe verander ik mijn wachtwoord?', a: 'Ga naar Profiel → Profiel bewerken → tabblad Wachtwoord. Vul je huidig wachtwoord in en daarna je nieuwe wachtwoord tweemaal.' },
      { q: 'Kan ik mijn account verwijderen?', a: 'Ja, ga naar Instellingen → Account verwijderen. Let op: dit verwijdert permanent al je wedstrijdgeschiedenis, reserveringen en profielgegevens.' },
    ],
  },
  {
    title: 'Wedstrijden & Matches',
    icon: 'tennisball-outline',
    items: [
      { q: 'Hoe boek ik een baan?', a: 'Tik op "Book Court" op het startscherm of ga naar het tabblad Boeken. Kies een club, selecteer een datum en tijdslot en bevestig je reservering.' },
      { q: 'Hoe sluit ik me aan bij een wedstrijd?', a: 'Ga naar "Find Match" en gebruik de filters om een geschikte wedstrijd te vinden. Tik op "Inschrijven" om mee te doen. Je krijgt een bevestigingsmelding.' },
      { q: 'Hoe maak ik een nieuwe wedstrijd aan?', a: 'Tik op "New Match" op het startscherm. Vul de gewenste datum, tijdslot, locatie en niveaurange in. De wedstrijd verschijnt daarna in de "Find Match" lijst.' },
      { q: 'Kan ik een reservering annuleren?', a: 'Ja, open de wedstrijd via "Upcoming Matches" op je startscherm en tik op "Annuleren". Let op de annuleringsdeadline van de club (meestal 24u van tevoren).' },
    ],
  },
  {
    title: 'Niveau & Rankings',
    icon: 'trophy-outline',
    items: [
      { q: 'Hoe wordt mijn speelniveau berekend?', a: 'Jouw niveau (0.5 t/m 7.0) wordt berekend op basis van je wedstrijdresultaten, het niveau van je tegenstanders en je algemene winratio. Het wordt na elke competitieve wedstrijd bijgewerkt.' },
      { q: 'Hoe kom ik in de rankings?', a: 'Je verschijnt automatisch in de rankings nadat je minstens 5 competitieve wedstrijden hebt gespeeld. Rankings worden wekelijks bijgewerkt.' },
      { q: 'Wat is het verschil tussen competitief en vriendschappelijk?', a: 'Competitieve wedstrijden tellen mee voor je niveau en de rankings. Vriendschappelijke wedstrijden worden geregistreerd in je geschiedenis maar beïnvloeden je niveau niet.' },
    ],
  },
  {
    title: 'Betalingen',
    icon: 'card-outline',
    items: [
      { q: 'Welke betaalmethoden worden aanvaard?', a: 'We accepteren Visa, Mastercard, Bancontact en PayPal. Je kunt je betaalmethoden beheren via Instellingen → Betaalmethoden.' },
      { q: 'Wanneer word ik gefactureerd voor een reservering?', a: 'Je wordt gefactureerd op het moment van reservering. Bij annulering binnen de deadline ontvang je een volledige terugbetaling binnen 3-5 werkdagen.' },
      { q: 'Hoe vraag ik een terugbetaling aan?', a: 'Terugbetalingen worden automatisch verwerkt bij annulering. Als je een probleem hebt, contacteer ons via de "Neem contact op" knop hieronder.' },
    ],
  },
];

// ─── Accordion item ───────────────────────────────────────────────────────────

function AccordionItem({ item, isLast }: { item: FAQ; isLast: boolean }) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };

  return (
    <View style={[styles.accordionItem, !isLast && styles.accordionBorder]}>
      <TouchableOpacity style={styles.accordionHeader} onPress={toggle} activeOpacity={0.75}>
        <Text style={[styles.accordionQ, open && styles.accordionQActive]}>{item.q}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={open ? '#00A86B' : '#ccc'}
        />
      </TouchableOpacity>
      {open && <Text style={styles.accordionA}>{item.a}</Text>}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HelpFAQScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const q = search.toLowerCase().trim();

  const filteredCategories = FAQ_CATEGORIES.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) => !q || item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
    ),
  })).filter((cat) => cat.items.length > 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & FAQ</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="help-buoy-outline" size={32} color="#00A86B" />
        </View>
        <Text style={styles.heroTitle}>Hoe kunnen we helpen?</Text>
        <Text style={styles.heroSub}>Vind snel een antwoord op je vraag</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={17} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Zoek een vraag..."
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {filteredCategories.map((cat) => (
          <View key={cat.title} style={styles.section}>
            <View style={styles.catHeader}>
              <View style={styles.catIcon}>
                <Ionicons name={cat.icon as any} size={16} color="#00A86B" />
              </View>
              <Text style={styles.catTitle}>{cat.title}</Text>
            </View>
            <View style={styles.catCard}>
              {cat.items.map((item, idx) => (
                <AccordionItem key={item.q} item={item} isLast={idx === cat.items.length - 1} />
              ))}
            </View>
          </View>
        ))}

        {filteredCategories.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={40} color="#ccc" />
            <Text style={styles.emptyTitle}>Geen resultaten voor "{search}"</Text>
          </View>
        )}

        {/* Contact block */}
        <View style={styles.contactCard}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="#00A86B" />
          <Text style={styles.contactTitle}>Nog steeds hulp nodig?</Text>
          <Text style={styles.contactSub}>Ons team staat voor je klaar via e-mail of chat.</Text>
          <TouchableOpacity style={styles.contactBtn}>
            <Ionicons name="mail-outline" size={16} color="#fff" />
            <Text style={styles.contactBtnText}>Neem contact op</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
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

  hero: { alignItems: 'center', paddingVertical: 20 },
  heroIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: '#e8f8f2', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a1a' },
  heroSub: { fontSize: 13, color: '#999', marginTop: 4 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#333' },

  scroll: { paddingHorizontal: 16 },

  section: { marginBottom: 16 },
  catHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  catIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#e8f8f2', alignItems: 'center', justifyContent: 'center',
  },
  catTitle: { fontSize: 14, fontWeight: '700', color: '#333' },
  catCard: {
    backgroundColor: '#fff', borderRadius: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
    overflow: 'hidden',
  },

  accordionItem: { paddingHorizontal: 14, paddingVertical: 14 },
  accordionBorder: { borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  accordionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  accordionQ: { flex: 1, fontSize: 14, fontWeight: '600', color: '#333', lineHeight: 20 },
  accordionQActive: { color: '#00A86B' },
  accordionA: { fontSize: 13, color: '#666', lineHeight: 20, marginTop: 10, paddingRight: 24 },

  contactCard: {
    alignItems: 'center', backgroundColor: '#fff', borderRadius: 16,
    padding: 24, marginTop: 8,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    gap: 6,
  },
  contactTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  contactSub: { fontSize: 13, color: '#999', textAlign: 'center' },
  contactBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#00A86B', borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12, marginTop: 8,
  },
  contactBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  empty: { alignItems: 'center', paddingVertical: 50, gap: 10 },
  emptyTitle: { fontSize: 14, color: '#bbb', textAlign: 'center' },
});