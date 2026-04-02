import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(screens)/newMatch" />
      <Stack.Screen name="(screens)/findMatch" />
      <Stack.Screen name="(screens)/bookCourt" />
      <Stack.Screen name="(screens)/rankings" />
      <Stack.Screen name="(screens)/matchDetail" />
      <Stack.Screen name="(screens)/matchHistory" />
      <Stack.Screen name="(screens)/searchResults" />
      <Stack.Screen name="(screens)/notifications" />
      <Stack.Screen name="(screens)/settings" />
      <Stack.Screen name="(screens)/editProfile" />
      <Stack.Screen name="(screens)/languageSelector" />
      <Stack.Screen name="(screens)/defaultLocation" />
      <Stack.Screen name="(screens)/about" />
      <Stack.Screen name="(screens)/faq" />
      <Stack.Screen name="(screens)/privacy" />
      <Stack.Screen name="(screens)/termsAndConditions" />
      <Stack.Screen name="(screens)/chatDetail" />
      <Stack.Screen name="(screens)/createTournament" />
      <Stack.Screen name="book" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}