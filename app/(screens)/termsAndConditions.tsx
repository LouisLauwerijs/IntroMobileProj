import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Article = { title: string; content: string };

const ARTICLES: Article[] = [
  {
    title: 'Artikel 1 – Toepassingsgebied',
    content: `Deze algemene voorwaarden zijn van toepassing op alle diensten aangeboden door PadelMatch, inclusief de mobiele applicatie, reserveringssysteem en matchmaking-platform.

Door gebruik te maken van de app aanvaardt u uitdrukkelijk deze voorwaarden. Indien u niet akkoord gaat, dient u het gebruik van de app te staken.`,
  },
  {
    title: 'Artikel 2 – Account & Registratie',
    content: `Om gebruik te maken van PadelMatch dient u een account aan te maken. U moet minstens 16 jaar oud zijn.

U bent verantwoordelijk voor de juistheid van de ingevoerde gegevens en voor het geheimhouden van uw inloggegevens. PadelMatch is niet aansprakelijk voor schade als gevolg van misbruik van uw account door derden.

PadelMatch behoudt zich het recht voor accounts te blokkeren of verwijderen bij misbruik of overtreding van deze voorwaarden.`,
  },
  {
    title: 'Artikel 3 – Reserveringen',
    content: `Reserveringen via PadelMatch zijn bindend zodra de betaling is bevestigd. Annulering is mogelijk volgens de annuleringsregels van de betreffende club.

PadelMatch treedt op als tussenpersoon tussen de gebruiker en de club. Wij zijn niet aansprakelijk voor annuleringen, wijzigingen of kwaliteitsproblemen van de club zelf.

Bij annulering buiten de deadline behoudt de club het recht de volledige prijs aan te rekenen.`,
  },
  {
    title: 'Artikel 4 – Betalingen',
    content: `Alle betalingen verlopen via beveiligde betalingsproviders. PadelMatch bewaart geen volledige betaalkaartgegevens.

Prijzen zijn inclusief BTW tenzij anders vermeld. PadelMatch behoudt zich het recht voor prijzen te wijzigen, met dien verstande dat bestaande reserveringen niet worden beïnvloed.

Terugbetalingen worden verwerkt binnen 5 à 10 werkdagen op de originele betaalmethode.`,
  },
  {
    title: 'Artikel 5 – Gedragsregels',
    content: `Gebruikers verbinden zich ertoe de app op een eerlijke en respectvolle manier te gebruiken. Het is verboden:

• Valse of misleidende informatie te verstrekken
• Andere gebruikers lastig te vallen of te beledigen
• De app te gebruiken voor commerciële doeleinden zonder toestemming
• Technische beveiligingsmaatregelen te omzeilen

Overtredingen kunnen leiden tot onmiddellijke blokkering van het account.`,
  },
  {
    title: 'Artikel 6 – Intellectuele eigendom',
    content: `Alle content op het PadelMatch-platform, inclusief logo's, teksten, afbeeldingen en software, is eigendom van PadelMatch of haar licentiegevers.

Het is niet toegestaan content te kopiëren, te verspreiden of commercieel te gebruiken zonder schriftelijke toestemming van PadelMatch.`,
  },
  {
    title: 'Artikel 7 – Aansprakelijkheid',
    content: `PadelMatch is een bemiddelingsplatform en is niet aansprakelijk voor:

• Lichamelijk letsel opgelopen tijdens het spelen
• Schade aan eigendommen op of buiten de terreinen
• Annuleringen of tekortkomingen van clubs
• Technische storingen buiten onze controle

Onze totale aansprakelijkheid is in alle gevallen beperkt tot het bedrag van de betrokken reservering.`,
  },
  {
    title: 'Artikel 8 – Toepasselijk recht',
    content: `Deze voorwaarden worden beheerst door het Belgisch recht. Eventuele geschillen worden voorgelegd aan de bevoegde rechtbanken van het arrondissement Antwerpen.

Bij vragen over deze voorwaarden kunt u ons bereiken via legal@padelmatch.be`,
  },
];

function Accordion({ article, isLast }: { article: Article; isLast: boolean }) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };

  return (
    <View style={[styles.accordion, !isLast && styles.accordionBorder]}>
      <TouchableOpacity style={styles.accordionHeader} onPress={toggle} activeOpacity={0.75}>
        <Text style={[styles.accordionTitle, open && styles.accordionTitleOpen]}>
          {article.title}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={open ? '#00A86B' : '#ccc'}
        />
      </TouchableOpacity>
      {open && (
        <Text style={styles.accordionContent}>{article.content}</Text>
      )}
    </View>
  );
}

export default function TermsAndConditions() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Algemene voorwaarden</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Intro */}
        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <Ionicons name="document-text" size={26} color="#00A86B" />
          </View>
          <Text style={styles.introTitle}>Gebruiksvoorwaarden</Text>
          <Text style={styles.introText}>
            Lees deze voorwaarden zorgvuldig. Door PadelMatch te gebruiken ga je akkoord met onderstaande artikelen.
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Ionicons name="time-outline" size={12} color="#00A86B" />
              <Text style={styles.metaChipText}>Laatste update: 1 maart 2025</Text>
            </View>
            <View style={styles.metaChip}>
              <Ionicons name="location-outline" size={12} color="#00A86B" />
              <Text style={styles.metaChipText}>Belgisch recht</Text>
            </View>
          </View>
        </View>

        {/* Articles */}
        <View style={styles.card}>
          {ARTICLES.map((article, idx) => (
            <Accordion key={article.title} article={article} isLast={idx === ARTICLES.length - 1} />
          ))}
        </View>

        {/* Contact */}
        <View style={styles.contactRow}>
          <Ionicons name="mail-outline" size={14} color="#00A86B" />
          <Text style={styles.contactText}>
            Vragen?{' '}
            <Text style={styles.contactLink}>legal@padelmatch.be</Text>
          </Text>
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

  introCard: {
    alignItems: 'center', backgroundColor: '#f0faf6',
    borderRadius: 16, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#c3e6d8', gap: 6,
  },
  introIcon: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#e8f8f2', alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  introTitle: { fontSize: 16, fontWeight: '800', color: '#1a1a1a' },
  introText: { fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 18 },
  metaRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#e8f8f2', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  metaChipText: { fontSize: 11, color: '#00A86B', fontWeight: '600' },

  card: {
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    overflow: 'hidden',
  },

  accordion: { paddingHorizontal: 16, paddingVertical: 14 },
  accordionBorder: { borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  accordionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  accordionTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#333', lineHeight: 20 },
  accordionTitleOpen: { color: '#00A86B', fontWeight: '700' },
  accordionContent: { fontSize: 13, color: '#666', lineHeight: 21, marginTop: 10, paddingRight: 10 },

  contactRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12,
  },
  contactText: { fontSize: 13, color: '#999' },
  contactLink: { color: '#00A86B', fontWeight: '700' },
});