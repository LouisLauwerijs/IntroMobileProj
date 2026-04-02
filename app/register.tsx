import { useState } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  auth, 
  firestore, 
  createUserWithEmailAndPassword, 
  doc, 
  setDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from '../firebase';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const normalizeUsername = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_.]/g, '')
      .replace(/\s+/g, '');

  const getUniqueUsername = async (base: string) => {
    let username = normalizeUsername(base);
    if (!username) username = `user${Math.floor(1000 + Math.random() * 9000)}`;

    let candidate = username;
    let suffix = 1;

    while (true) {
      const usernameQ = query(
        collection(firestore, 'users'),
        where('username', '==', candidate)
      );
      const snapshot = await getDocs(usernameQ);

      if (snapshot.empty) {
        return candidate;
      }

      candidate = `${username}${suffix}`;
      suffix += 1;
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Fout', 'Vul alle velden in.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // 1. Maak de gebruiker aan in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create username and display name
      const username = await getUniqueUsername(name);
      const displayName = name.trim();

      // 2. Maak een gebruikersdocument aan in Firestore met de UID als ID
      await setDoc(doc(firestore, 'users', user.uid), {
        uid: user.uid,
        name: displayName,
        username,
        email,
        level: 2.5, // Default start level
        createdAt: serverTimestamp(),
      });

      console.log('Gebruiker succesvol geregistreerd in Auth & Firestore!');
      Alert.alert('Succes', 'Account aangemaakt! Je kunt nu inloggen.', [
        { text: 'OK', onPress: () => router.push('/login') }
      ]);

    } catch (err: any) {
      console.error('Fout bij registratie:', err.message);
      setError(err.message);
      Alert.alert('Fout', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {/* Register button */}
      <TouchableOpacity 
        style={[styles.button, loading && styles.disabledButton]} 
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Register</Text>
        )}
      </TouchableOpacity>
      
      {/* Back to Login button */}
      <TouchableOpacity 
        style={[styles.button, styles.secondaryButton]} 
        onPress={() => router.push('/login')}
      >
        <Text style={styles.buttonText}>Back to Login</Text>
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 24, 
    backgroundColor: '#fff' 
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 32, 
    textAlign: 'center' 
  },
  input: {
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 8,
    padding: 12, 
    marginBottom: 16, 
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4F46E5', 
    borderRadius: 8,
    padding: 14, 
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryButton: {
    backgroundColor: '#6b7280',
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  error: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
});
