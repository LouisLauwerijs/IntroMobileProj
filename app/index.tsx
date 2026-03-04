import { Redirect } from 'expo-router';

export default function Index() {
  const isLoggedIn = false;

  return isLoggedIn ? <Redirect href="/(tabs)/home" /> : <Redirect href="/login" />;
}