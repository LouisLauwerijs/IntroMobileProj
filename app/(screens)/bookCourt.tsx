import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';

// ─── Data ─────────────────────────────────────────────────────────────────────

type Court = {
  id: string;
  name: string;
  location: string;
  distance: string;
  pricePerHour: number;
  rating: number;
  reviews: number;
  image: string;
  tags: string[];
  indoor: boolean;
};

const COURTS: Court[] = [
  {
    id: '1',
    name: 'City Padel Club',
    location: 'Antwerpen Centrum',
    distance: '0.5 km',
    pricePerHour: 18,
    rating: 4.8,
    reviews: 124,
    image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=80',
    tags: ['Indoor', 'Verlichting', 'Parking'],
    indoor: true,
  },
  {
    id: '2',
    name: 'Riverside Padel',
    location: 'Linkeroever',
    distance: '1.2 km',
    pricePerHour: 14,
    rating: 4.5,
    reviews: 89,
    image: 'https://images.unsplash.com/photo-1680181864755-8f6f5537b92c?w=600&q=80',
    tags: ['Outdoor', 'Verlichting'],
    indoor: false,
  },
  {
    id: '3',
    name: 'Central Sports Hub',
    location: 'Berchem',
    distance: '2.0 km',
    pricePerHour: 12,
    rating: 4.3,
    reviews: 56,
    image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=600&q=80',
    tags: ['Indoor', 'Douches', 'Bar'],
    indoor: true,
  },
  {
    id: '4',
    name: 'Sportpark Noord',
    location: 'Merksem',
    distance: '3.1 km',
    pricePerHour: 16,
    rating: 4.6,
    reviews: 201,
    image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=80',
    tags: ['Outdoor', 'Verlichting', 'Pro Shop'],
    indoor: false,
  },
];

// Generate dates: today + next 6 days
const getDates = () => {
  const days = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
  const months = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      key: d.toISOString().split('T')[0],
      day: i === 0 ? 'Nu' : days[d.getDay()],
      date: d.getDate(),
      month: months[d.getMonth()],
      isToday: i === 0,
    };
  });
};

const DATES = getDates();

// Time slots with some marked as taken
type Slot = { time: string; available: boolean };
const SLOTS: Slot[] = [
  { time: '08:00', available: true },
  { time: '09:00', available: false },
  { time: '10:00', available: true },
  { time: '11:00', available: true },
  { time: '12:00', available: false },
  { time: '13:00', available: true },
  { time: '14:00', available: true },
  { time: '15:00', available: false },
  { time: '16:00', available: true },
  { time: '17:00', available: true },
  { time: '18:00', available: false },
  { time: '19:00', available: true },
  { time: '20:00', available: true },
  { time: '21:00', available: false },
];

const DURATIONS = [
  { label: '1u', hours: 1 },
  { label: '1u30', hours: 1.5 },
  { label: '2u', hours: 2 },
];

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepBar({ step }: { step: number }) {
  const steps = ['Veld', 'Datum', 'Bevestig'];
  return (
    <View style={styles.stepBar}>
      {steps.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <View key={label} style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              done && styles.stepCircleDone,
              active && styles.stepCircleActive,
            ]}>
              {done
                ? <Ionicons name="checkmark" size={14} color="#fff" />
                : <Text style={[styles.stepNum, active && { color: '#fff' }]}>{i + 1}</Text>
              }
            </View>
            <Text style={[styles.stepLabel, active && styles.stepLabelActive, done && styles.stepLabelDone]}>
              {label}
            </Text>
            {i < steps.length - 1 && (
              <View style={[styles.stepLine, done && styles.stepLineDone]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

// ─── Step 0: Pick a court ─────────────────────────────────────────────────────

function PickCourt({ onSelect }: { onSelect: (c: Court) => void }) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepScroll}>
      <Text style={styles.stepHeading}>Kies een veld</Text>
      {COURTS.map((court) => (
        <TouchableOpacity
          key={court.id}
          style={styles.courtCard}
          onPress={() => onSelect(court)}
          activeOpacity={0.88}
        >
          <Image source={{ uri: court.image }} style={styles.courtImage} resizeMode="cover" />
          <View style={styles.courtIndoorBadge}>
            <Ionicons name={court.indoor ? 'home-outline' : 'sunny-outline'} size={12} color="#fff" />
            <Text style={styles.courtIndoorText}>{court.indoor ? 'Indoor' : 'Outdoor'}</Text>
          </View>
          <View style={styles.courtCardBody}>
            <View style={styles.courtCardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.courtName}>{court.name}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={12} color="#999" />
                  <Text style={styles.locationText}>{court.location} · {court.distance}</Text>
                </View>
              </View>
              <View style={styles.priceBox}>
                <Text style={styles.priceValue}>€{court.pricePerHour}</Text>
                <Text style={styles.priceUnit}>/uur</Text>
              </View>
            </View>
            <View style={styles.courtCardMeta}>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color="#F5A623" />
                <Text style={styles.ratingText}>{court.rating}</Text>
                <Text style={styles.reviewsText}>({court.reviews})</Text>
              </View>
              <View style={styles.tagsRow}>
                {court.tags.slice(0, 2).map((t) => (
                  <View key={t} style={styles.tag}>
                    <Text style={styles.tagText}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── Step 1: Pick date + time ─────────────────────────────────────────────────

function PickDateTime({
  court,
  onNext,
}: {
  court: Court;
  onNext: (date: string, time: string, duration: number) => void;
}) {
  const [selectedDate, setSelectedDate] = useState(DATES[0].key);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(1);

  const canContinue = selectedDate && selectedTime;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepScroll}>
      <Text style={styles.stepHeading}>Datum & Tijdstip</Text>

      {/* Selected court recap */}
      <View style={styles.selectedCourtRecap}>
        <Image source={{ uri: court.image }} style={styles.recapImage} resizeMode="cover" />
        <View style={styles.recapInfo}>
          <Text style={styles.recapName}>{court.name}</Text>
          <Text style={styles.recapLocation}>{court.location}</Text>
        </View>
        <Text style={styles.recapPrice}>€{court.pricePerHour}/u</Text>
      </View>

      {/* Date picker */}
      <Text style={styles.subLabel}>Datum</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
        {DATES.map((d) => (
          <TouchableOpacity
            key={d.key}
            style={[styles.dateChip, selectedDate === d.key && styles.dateChipActive]}
            onPress={() => { setSelectedDate(d.key); setSelectedTime(null); }}
          >
            <Text style={[styles.dateChipDay, selectedDate === d.key && styles.dateChipTextActive]}>
              {d.day}
            </Text>
            <Text style={[styles.dateChipNum, selectedDate === d.key && styles.dateChipTextActive]}>
              {d.date}
            </Text>
            <Text style={[styles.dateChipMonth, selectedDate === d.key && styles.dateChipTextActive]}>
              {d.month}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Duration */}
      <Text style={styles.subLabel}>Duur</Text>
      <View style={styles.durationRow}>
        {DURATIONS.map((d) => (
          <TouchableOpacity
            key={d.label}
            style={[styles.durationChip, selectedDuration === d.hours && styles.durationChipActive]}
            onPress={() => setSelectedDuration(d.hours)}
          >
            <Text style={[styles.durationText, selectedDuration === d.hours && styles.durationTextActive]}>
              {d.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Time slots */}
      <Text style={styles.subLabel}>Tijdstip</Text>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#00A86B' }]} />
          <Text style={styles.legendText}>Beschikbaar</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#eee' }]} />
          <Text style={styles.legendText}>Bezet</Text>
        </View>
      </View>
      <View style={styles.slotGrid}>
        {SLOTS.map((slot) => (
          <TouchableOpacity
            key={slot.time}
            disabled={!slot.available}
            style={[
              styles.slot,
              selectedTime === slot.time && styles.slotActive,
              !slot.available && styles.slotTaken,
            ]}
            onPress={() => setSelectedTime(slot.time)}
          >
            <Text style={[
              styles.slotText,
              selectedTime === slot.time && styles.slotTextActive,
              !slot.available && styles.slotTextTaken,
            ]}>
              {slot.time}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.ctaBtn, !canContinue && styles.ctaBtnDisabled]}
        disabled={!canContinue}
        onPress={() => onNext(selectedDate, selectedTime!, selectedDuration)}
      >
        <Text style={styles.ctaBtnText}>Doorgaan</Text>
        <Ionicons name="arrow-forward" size={18} color="#fff" />
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Step 2: Confirm & Pay ────────────────────────────────────────────────────

function ConfirmBooking({
  court,
  date,
  time,
  duration,
  onConfirm,
}: {
  court: Court;
  date: string;
  time: string;
  duration: number;
  onConfirm: () => void;
}) {
  const totalPrice = court.pricePerHour * duration;
  const [payMethod, setPayMethod] = useState<'card' | 'paypal'>('card');

  // Format date for display
  const dateObj = new Date(date);
  const formatted = dateObj.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' });
  const endHour = parseInt(time.split(':')[0]) + duration;
  const endTime = `${String(Math.floor(endHour)).padStart(2, '0')}:${duration % 1 === 0.5 ? '30' : '00'}`;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepScroll}>
      <Text style={styles.stepHeading}>Bevestig Boeking</Text>

      {/* Summary card */}
      <View style={styles.summaryCard}>
        <Image source={{ uri: court.image }} style={styles.summaryImage} resizeMode="cover" />
        <View style={styles.summaryBody}>
          <Text style={styles.summaryClub}>{court.name}</Text>
          <Text style={styles.summaryLocation}>{court.location}</Text>

          <View style={styles.summaryDivider} />

          {[
            { icon: 'calendar-outline', label: 'Datum', value: formatted },
            { icon: 'time-outline',     label: 'Tijdstip', value: `${time} – ${endTime}` },
            { icon: 'hourglass-outline',label: 'Duur', value: `${duration % 1 === 0 ? duration + 'u' : '1u30'}` },
          ].map((row) => (
            <View key={row.label} style={styles.summaryRow}>
              <View style={styles.summaryRowLeft}>
                <Ionicons name={row.icon as any} size={15} color="#00A86B" />
                <Text style={styles.summaryLabel}>{row.label}</Text>
              </View>
              <Text style={styles.summaryValue}>{row.value}</Text>
            </View>
          ))}

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { fontWeight: '800', color: '#1a1a1a' }]}>Totaal</Text>
            <Text style={styles.summaryTotal}>€{totalPrice.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Payment method */}
      <Text style={styles.subLabel}>Betaalmethode</Text>
      <View style={styles.payMethods}>
        {(['card', 'paypal'] as const).map((method) => (
          <TouchableOpacity
            key={method}
            style={[styles.payMethod, payMethod === method && styles.payMethodActive]}
            onPress={() => setPayMethod(method)}
          >
            <Ionicons
              name={method === 'card' ? 'card-outline' : 'logo-paypal'}
              size={22}
              color={payMethod === method ? '#00A86B' : '#999'}
            />
            <Text style={[styles.payMethodText, payMethod === method && styles.payMethodTextActive]}>
              {method === 'card' ? 'Kredietkaart' : 'PayPal'}
            </Text>
            <View style={[styles.payRadio, payMethod === method && styles.payRadioActive]}>
              {payMethod === method && <View style={styles.payRadioDot} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Simulated payment notice */}
      <View style={styles.simNotice}>
        <Ionicons name="shield-checkmark-outline" size={16} color="#00A86B" />
        <Text style={styles.simNoticeText}>
          Betaling is gesimuleerd voor deze demo. Geen echte transactie.
        </Text>
      </View>

      <TouchableOpacity style={styles.ctaBtn} onPress={onConfirm}>
        <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
        <Text style={styles.ctaBtnText}>Betaal €{totalPrice.toFixed(2)} & Bevestig</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Success Screen ───────────────────────────────────────────────────────────

function BookingSuccess({ court, time, onDone }: { court: Court; time: string; onDone: () => void }) {
  return (
    <View style={styles.successWrap}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark" size={48} color="#fff" />
      </View>
      <Text style={styles.successTitle}>Boeking Bevestigd!</Text>
      <Text style={styles.successSub}>
        Je veld bij {court.name} is gereserveerd voor {time}.
      </Text>
      <View style={styles.successCard}>
        <Image source={{ uri: court.image }} style={styles.successImage} resizeMode="cover" />
        <View style={styles.successDetails}>
          <Text style={styles.successCourtName}>{court.name}</Text>
          <Text style={styles.successCourtLocation}>{court.location}</Text>
          <View style={styles.successTimeRow}>
            <Ionicons name="time-outline" size={14} color="#00A86B" />
            <Text style={styles.successTime}>{time}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.ctaBtn} onPress={onDone}>
        <Text style={styles.ctaBtnText}>Terug naar Home</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BookCourtScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [court, setCourt] = useState<Court | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(1);
  const [confirmed, setConfirmed] = useState(false);

  const handleCourtSelect = (c: Court) => { setCourt(c); setStep(1); };
  const handleDateTime = (d: string, t: string, dur: number) => {
    setDate(d); setTime(t); setDuration(dur); setStep(2);
  };
  const handleConfirm = () => setConfirmed(true);

  if (confirmed && court) {
    return (
      <SafeAreaView style={styles.container}>
        <BookingSuccess court={court} time={time} onDone={() => router.replace('/(tabs)/home')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => step === 0 ? router.back() : setStep(step - 1)}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Veld Reserveren</Text>
        <View style={{ width: 38 }} />
      </View>

      <StepBar step={step} />

      {step === 0 && <PickCourt onSelect={handleCourtSelect} />}
      {step === 1 && court && (
        <PickDateTime court={court} onNext={handleDateTime} />
      )}
      {step === 2 && court && (
        <ConfirmBooking
          court={court}
          date={date}
          time={time}
          duration={duration}
          onConfirm={handleConfirm}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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

  // Step bar
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: '#fff',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  stepCircleActive: { backgroundColor: '#00A86B' },
  stepCircleDone: { backgroundColor: '#00A86B' },
  stepNum: { fontSize: 13, fontWeight: '700', color: '#bbb' },
  stepLabel: { fontSize: 12, fontWeight: '600', color: '#bbb', marginRight: 6 },
  stepLabelActive: { color: '#00A86B' },
  stepLabelDone: { color: '#00A86B' },
  stepLine: { width: 28, height: 2, backgroundColor: '#eee', borderRadius: 1, marginHorizontal: 4 },
  stepLineDone: { backgroundColor: '#00A86B' },

  stepScroll: { padding: 16, paddingBottom: 40 },
  stepHeading: { fontSize: 17, fontWeight: '800', color: '#1a1a1a', marginBottom: 16 },

  // Court cards (step 0)
  courtCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  courtImage: { width: '100%', height: 140 },
  courtIndoorBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  courtIndoorText: { fontSize: 11, color: '#fff', fontWeight: '700' },
  courtCardBody: { padding: 14 },
  courtCardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  courtName: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 3 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locationText: { fontSize: 12, color: '#999' },
  priceBox: { alignItems: 'flex-end' },
  priceValue: { fontSize: 20, fontWeight: '900', color: '#00A86B' },
  priceUnit: { fontSize: 11, color: '#999' },
  courtCardMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 13, fontWeight: '700', color: '#333' },
  reviewsText: { fontSize: 12, color: '#999' },
  tagsRow: { flexDirection: 'row', gap: 6 },
  tag: { backgroundColor: '#f0faf6', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 11, color: '#00A86B', fontWeight: '600' },

  // Recap (step 1)
  selectedCourtRecap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  recapImage: { width: 72, height: 72 },
  recapInfo: { flex: 1, padding: 12 },
  recapName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  recapLocation: { fontSize: 12, color: '#999', marginTop: 2 },
  recapPrice: { fontSize: 16, fontWeight: '800', color: '#00A86B', paddingRight: 14 },

  subLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
    marginTop: 16,
  },

  // Date
  dateRow: { gap: 8, paddingBottom: 4 },
  dateChip: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 58,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  dateChipActive: { backgroundColor: '#00A86B' },
  dateChipDay: { fontSize: 11, fontWeight: '700', color: '#999' },
  dateChipNum: { fontSize: 20, fontWeight: '900', color: '#1a1a1a' },
  dateChipMonth: { fontSize: 10, color: '#bbb', fontWeight: '600' },
  dateChipTextActive: { color: '#fff' },

  // Duration
  durationRow: { flexDirection: 'row', gap: 10 },
  durationChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  durationChipActive: { backgroundColor: '#00A86B' },
  durationText: { fontSize: 14, fontWeight: '700', color: '#555' },
  durationTextActive: { color: '#fff' },

  // Slots
  legend: { flexDirection: 'row', gap: 14, marginBottom: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#999' },

  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: {
    width: '22%',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  slotActive: { backgroundColor: '#00A86B' },
  slotTaken: { backgroundColor: '#f0f0f0', shadowOpacity: 0, elevation: 0 },
  slotText: { fontSize: 13, fontWeight: '700', color: '#333' },
  slotTextActive: { color: '#fff' },
  slotTextTaken: { color: '#ccc' },

  // CTA button
  ctaBtn: {
    backgroundColor: '#00A86B',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
  },
  ctaBtnDisabled: { backgroundColor: '#b2dfce' },
  ctaBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  // Summary (step 2)
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryImage: { width: '100%', height: 130 },
  summaryBody: { padding: 16 },
  summaryClub: { fontSize: 17, fontWeight: '800', color: '#1a1a1a' },
  summaryLocation: { fontSize: 12, color: '#999', marginBottom: 12 },
  summaryDivider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  summaryRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryLabel: { fontSize: 14, color: '#555', fontWeight: '600' },
  summaryValue: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  summaryTotal: { fontSize: 20, fontWeight: '900', color: '#00A86B' },

  // Payment
  payMethods: { gap: 10 },
  payMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  payMethodActive: { borderColor: '#00A86B', backgroundColor: '#f0faf6' },
  payMethodText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#555' },
  payMethodTextActive: { color: '#00A86B' },
  payRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payRadioActive: { borderColor: '#00A86B' },
  payRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#00A86B' },

  simNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f0faf6',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  simNoticeText: { flex: 1, fontSize: 12, color: '#555', lineHeight: 17 },

  // Success
  successWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#00A86B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#00A86B',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  successTitle: { fontSize: 26, fontWeight: '900', color: '#1a1a1a', marginBottom: 8 },
  successSub: { fontSize: 14, color: '#999', textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  successCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 28,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  successImage: { width: 90, height: 90 },
  successDetails: { flex: 1, padding: 14 },
  successCourtName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  successCourtLocation: { fontSize: 12, color: '#999', marginTop: 2 },
  successTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  successTime: { fontSize: 13, fontWeight: '700', color: '#00A86B' },
});