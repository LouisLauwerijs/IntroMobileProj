import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';

const DAYS = [
  { label: 'Mon', date: '3', active: false },
  { label: 'Tue', date: '4', active: true },
  { label: 'Wed', date: '5', active: false },
  { label: 'Thu', date: '6', active: false },
  { label: 'Fri', date: '7', active: false },
  { label: 'Sat', date: '8', active: false },
  { label: 'Sun', date: '9', active: false },
];

const COURTS = ['Court 1', 'Court 2', 'Court 3', 'Court 4', 'Court 5', 'Court 6'];

const TIME_SLOTS = [
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

export default function SlotPickerScreen() {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedCourt, setSelectedCourt] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>City Padel Club</Text>
          <Text style={styles.subtitle}>Antwerpen Centrum</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Day Picker */}
        <Text style={styles.sectionLabel}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysRow}>
          {DAYS.map((day, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.dayChip, selectedDay === i && styles.dayChipActive]}
              onPress={() => setSelectedDay(i)}
            >
              <Text style={[styles.dayLabel, selectedDay === i && styles.dayTextActive]}>{day.label}</Text>
              <Text style={[styles.dayDate, selectedDay === i && styles.dayTextActive]}>{day.date}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Court Picker */}
        <Text style={styles.sectionLabel}>Select Court</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.courtsRow}>
          {COURTS.map((court, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.courtChip, selectedCourt === i && styles.courtChipActive]}
              onPress={() => setSelectedCourt(i)}
            >
              <Text style={[styles.courtChipText, selectedCourt === i && styles.courtChipTextActive]}>
                {court}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#00D68F' }]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#2A2A2A' }]} />
            <Text style={styles.legendText}>Booked</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FFD600' }]} />
            <Text style={styles.legendText}>Selected</Text>
          </View>
        </View>

        {/* Time Slots Grid */}
        <Text style={styles.sectionLabel}>Select Time</Text>
        <View style={styles.slotsGrid}>
          {TIME_SLOTS.map((slot, i) => {
            const isSelected = selectedSlot === slot.time;
            return (
              <TouchableOpacity
                key={i}
                disabled={!slot.available}
                onPress={() => setSelectedSlot(slot.time)}
                style={[
                  styles.slot,
                  !slot.available && styles.slotBooked,
                  isSelected && styles.slotSelected,
                ]}
              >
                <Text style={[
                  styles.slotText,
                  !slot.available && styles.slotTextBooked,
                  isSelected && styles.slotTextSelected,
                ]}>
                  {slot.time}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Duration */}
        <Text style={styles.sectionLabel}>Duration</Text>
        <View style={styles.durationRow}>
          {['60 min', '90 min', '120 min'].map(d => (
            <TouchableOpacity key={d} style={[styles.durationChip, d === '90 min' && styles.durationChipActive]}>
              <Text style={[styles.durationText, d === '90 min' && styles.durationTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom CTA */}
      {selectedSlot && (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.bottomSlot}>{DAYS[selectedDay].label}, Mar {DAYS[selectedDay].date} · {selectedSlot}</Text>
            <Text style={styles.bottomPrice}>€27 · 90 min</Text>
          </View>
          <TouchableOpacity style={styles.confirmBtn} onPress={() => router.push('/')}>
            <Text style={styles.confirmBtnText}>Confirm Booking</Text>
          </TouchableOpacity>
        </View>
      )}
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
  headerCenter: { alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 12, color: '#666', marginTop: 1 },

  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#666', marginHorizontal: 16, marginTop: 20, marginBottom: 10, letterSpacing: 0.5 },

  daysRow: { paddingHorizontal: 16, gap: 8 },
  dayChip: {
    width: 52, height: 64, borderRadius: 12, backgroundColor: '#1A1A1A',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2A',
  },
  dayChipActive: { backgroundColor: '#00D68F', borderColor: '#00D68F' },
  dayLabel: { fontSize: 12, color: '#666', fontWeight: '600' },
  dayDate: { fontSize: 18, color: '#fff', fontWeight: '800', marginTop: 2 },
  dayTextActive: { color: '#0D0D0D' },

  courtsRow: { paddingHorizontal: 16, gap: 8 },
  courtChip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10,
    backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A',
  },
  courtChipActive: { backgroundColor: '#00D68F', borderColor: '#00D68F' },
  courtChipText: { fontSize: 13, fontWeight: '700', color: '#666' },
  courtChipTextActive: { color: '#0D0D0D' },

  legend: { flexDirection: 'row', gap: 16, paddingHorizontal: 16, marginTop: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#666' },

  slotsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8,
  },
  slot: {
    width: '22%', paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#1E2D24', alignItems: 'center', borderWidth: 1, borderColor: '#00D68F22',
  },
  slotBooked: { backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' },
  slotSelected: { backgroundColor: '#FFD600', borderColor: '#FFD600' },
  slotText: { fontSize: 13, fontWeight: '700', color: '#00D68F' },
  slotTextBooked: { color: '#333' },
  slotTextSelected: { color: '#0D0D0D' },

  durationRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  durationChip: {
    flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#1A1A1A',
    alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2A',
  },
  durationChipActive: { backgroundColor: '#00D68F', borderColor: '#00D68F' },
  durationText: { fontSize: 14, fontWeight: '700', color: '#555' },
  durationTextActive: { color: '#0D0D0D' },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#1A1A1A', borderTopColor: '#2A2A2A', borderTopWidth: 1,
    padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  bottomSlot: { fontSize: 13, color: '#aaa', marginBottom: 2 },
  bottomPrice: { fontSize: 18, fontWeight: '900', color: '#fff' },
  confirmBtn: {
    backgroundColor: '#00D68F', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 14,
  },
  confirmBtnText: { fontSize: 14, fontWeight: '800', color: '#0D0D0D' },
});
