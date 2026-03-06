import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#00A86B',
      tabBarInactiveTintColor: '#999',
      tabBarStyle: { backgroundColor: '#fff' },
      headerShown: false,
    }}>
      <Tabs.Screen name="home"        options={{ title: 'Home',        tabBarIcon: ({ color, size }) => <Ionicons name="home-outline"    size={size} color={color} /> }} />
      <Tabs.Screen name="matches"     options={{ title: 'Matches',     tabBarIcon: ({ color, size }) => <Ionicons name="people-outline"  size={size} color={color} /> }} />
      <Tabs.Screen name="tournaments" options={{ title: 'Competitie',  tabBarIcon: ({ color, size }) => <Ionicons name="trophy-outline"  size={size} color={color} /> }} />
      <Tabs.Screen name="profile"     options={{ title: 'Profiel',     tabBarIcon: ({ color, size }) => <Ionicons name="person-outline"  size={size} color={color} /> }} />
    </Tabs>
  );
}

export function RootLayout() {
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
      <Stack.Screen name="(screens)/helpFAQ" />
      <Stack.Screen name="(screens)/termsPrivacy" />
      <Stack.Screen name="(screens)/algVoorwaarden" />
      <Stack.Screen name="(screens)/about" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}