import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="book/courts" options={{ presentation: 'card' }} />
      <Stack.Screen name="book/slot-picker" options={{ presentation: 'card' }} />
    </Stack>
  );
}
