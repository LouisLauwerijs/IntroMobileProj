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

// ─── Content ──────────────────────────────────────────────────────────────────

type Section = { title: string; icon: string; content: string };

const SECTIONS: Section[] = [
  {
    title: 'Algemene gebruiksvoorwaarden',
    icon: 'document-text-outline',
    content: `Welkom bij PadelMatch. Door gebruik te maken van onze app, gaat u akkoord met deze gebruiksvoorwaarden.

Je dient minstens 16 jaar oud te zijn om een account aan te maken. Je bent verantwoordelijk voor het geheimhouden van je inloggegevens.

PadelMatch behoudt zich het recht voor om accounts te deactiveren bij misbruik, valse informatie of gedrag dat andere gebruikers schaadt.

Reserveringen zijn onderworpen aan de annuleringsregels van de betreffende club. PadelMatch is niet aansprakelijk voor annuleringen door clubs.

Gebruik van de app voor commerciële doeleinden zonder schriftelijke toestemming is verboden.`,
  },
  {
    title: 'Privacybeleid',
    icon: 'shield-checkmark-outline',
    content: `Jouw privacy is belangrijk voor ons. We verzamelen alleen de gegevens die nodig zijn voor het functioneren van de app.

Welke gegevens we verzamelen:
• Naam, e-mailadres en profielinformatie die je zelf aanlevert
• Locatiegegevens (alleen indien je hier toestemming voor geeft)
• Wedstrijdresultaten en speelgeschiedenis
• Technische gegevens zoals apparaattype en app-versie

We delen jouw gegevens nooit met derde partijen voor marketingdoeleinden. Gegevens worden enkel gedeeld met clubs bij het plaatsen van reserveringen.

Je hebt altijd het recht om je gegevens in te zien, te corrigeren of te laten verwijderen via Instellingen → Account verwijderen of via onze support.`,
  },
  {
    title: 'Gebruik van persoonsgegevens',
    icon: 'person-circle-outline',
    content: `Op basis van de AVG (Algemene Verordening Gegevensbescherming) heb je de volgende rechten:

Recht op inzage: je kunt een overzicht opvragen van alle gegevens die we van jou hebben opgeslagen.

Recht op correctie: onjuiste gegevens kun je zelf aanpassen via je profiel of via onze support.

Recht op verwijdering: je kunt je account en alle bijbehorende gegevens permanent laten verwijderen.

Recht op overdraagbaarheid: je kunt een export aanvragen van je gegevens in een leesbaar formaat.

Voor vragen of verzoeken kun je ons bereiken via privacy@padelmatch.be`,
  },
  {
    title: 'Cookies & Tracking',
    icon: 'eye-outline',
    content: `PadelMatch gebruikt enkel functionele cookies die noodzakelijk zijn voor het werken van de app, zoals het bewaren van je inlogstatus en voorkeuren.

We gebruiken geen tracking cookies voor advertenties. We gebruiken anonieme analytics (zoals schermweergaven en foutmeldingen) uitsluitend om de app te verbeteren.

Je kunt het gebruik van niet-essentiële analytics uitzetten via Instellingen → Privacy & Beveiliging.`,
  },
  {
    title: 'Aansprakelijkheid',
    icon: 'alert-circle-outline',
    content: `PadelMatch is een platform dat gebruikers verbindt met padelbanen en medespelers. We zijn niet verantwoordelijk voor:

• Letsel of schade opgelopen tijdens het spelen
• Onjuiste beschikbaarheidsinformatie van clubs
• Annuleringen of wijzigingen door clubs
• Gedrag van andere gebruikers op of buiten het platform

Wij doen ons best om de app 24/7 beschikbaar te houden, maar kunnen geen uptime garanderen.`,
  },
  {
    title: 'Wijzigingen in voorwaarden',
    icon: 'refresh-outline',
    content: `PadelMatch behoudt zich het recht voor deze voorwaarden op elk moment te wijzigen. Bij significante wijzigingen ontvang je een melding via de app of per e-mail.

Door de app te blijven gebruiken na een wijziging, ga je akkoord met de nieuwe voorwaarden.

Laatste update: 1 maart 2025
Versie: 1.0`,
  },
];

// ─── Accordion ────────────────────────────────────────────────────────────────

function Accordion({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };

  return (
    <View style={styles.accordion}>
      <TouchableOpacity style={styles.accordionHeader} onPress={toggle} activeOpacity={0.75}>
        <View style={styles.accordionIconWrap}>
          <Ionicons name={section.icon as any} size={17} color="#00A86B" />
        </View>
        <Text style={[styles.accordionTitle, open && styles.accordionTitleOpen]}>
          {section.title}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={open ? '#00A86B' : '#ccc'}
        />
      </TouchableOpacity>
      {open && (
        <View style={styles.accordionBody}>
          <Text style={styles.accordionContent}>{section.content}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voorwaarden & Privacy</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Intro card */}
        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <Ionicons name="shield-checkmark" size={28} color="#00A86B" />
          </View>
          <Text style={styles.introTitle}>Jouw privacy & rechten</Text>
          <Text style={styles.introText}>
            We zijn transparant over hoe we jouw gegevens gebruiken. Tik op een sectie voor meer details.
          </Text>
        </View>

        {/* Last updated */}
        <View style={styles.lastUpdatedRow}>
          <Ionicons name="time-outline" size={14} color="#bbb" />
          <Text style={styles.lastUpdatedText}>Laatste update: 1 maart 2025</Text>
        </View>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <Accordion key={section.title} section={section} />
        ))}

        {/* Contact */}
        <View style={styles.contactRow}>
          <Ionicons name="mail-outline" size={15} color="#00A86B" />
          <Text style={styles.contactText}>
            Vragen?{' '}
            <Text style={styles.contactLink}>privacy@padelmatch.be</Text>
          </Text>
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

  scroll: { paddingHorizontal: 16 },

  introCard: {
    alignItems: 'center', backgroundColor: '#f0faf6',
    borderRadius: 16, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#c3e6d8', gap: 6,
  },
  introIcon: {
    width: 58, height: 58, borderRadius: 16,
    backgroundColor: '#e8f8f2', alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  introTitle: { fontSize: 16, fontWeight: '800', color: '#1a1a1a' },
  introText: { fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 18 },

  lastUpdatedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 14, marginLeft: 2,
  },
  lastUpdatedText: { fontSize: 12, color: '#bbb' },

  accordion: {
    backgroundColor: '#fff', borderRadius: 14,
    marginBottom: 10, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  accordionHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 15, gap: 10,
  },
  accordionIconWrap: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: '#e8f8f2', alignItems: 'center', justifyContent: 'center',
  },
  accordionTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#333' },
  accordionTitleOpen: { color: '#00A86B', fontWeight: '700' },
  accordionBody: {
    paddingHorizontal: 14, paddingBottom: 16, paddingTop: 4,
    borderTopWidth: 1, borderTopColor: '#f0f0f0',
  },
  accordionContent: { fontSize: 13, color: '#666', lineHeight: 21 },

  contactRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 8, paddingVertical: 12,
  },
  contactText: { fontSize: 13, color: '#999' },
  contactLink: { color: '#00A86B', fontWeight: '700' },
});