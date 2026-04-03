import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#00A86B',
      tabBarInactiveTintColor: '#999',
      tabBarStyle: { backgroundColor: '#fff' },
      headerShown: false,
    }}>
      <Tabs.Screen name="home"        options={{ title: 'Home',       tabBarIcon: ({ color, size }) => <Ionicons name="home-outline"   size={size} color={color} /> }} />
      <Tabs.Screen name="matches"     options={{ title: 'Matches',    tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="chat"        options={{ title: 'Berichten',  tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="tournaments" options={{ title: 'Toernooien', tabBarIcon: ({ color, size }) => <Ionicons name="trophy-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="profile"     options={{ title: 'Profiel',    tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }} />
    </Tabs>
  );
}