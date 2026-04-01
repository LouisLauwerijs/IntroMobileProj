import { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  auth, 
  firestore, 
  createUserWithEmailAndPassword, 
  doc, 
  setDoc, 
  serverTimestamp 
} from '../firebase';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Fout', 'Vul alle velden in.');
      return;
    }

    setLoading(true);
    try {
      // 1. Maak de gebruiker aan in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Maak een gebruikersdocument aan in Firestore met de UID als ID
      await setDoc(doc(firestore, 'users', user.uid), {
        uid: user.uid,
        email: email,
        createdAt: serverTimestamp(),
      });

      console.log('Gebruiker succesvol geregistreerd in Auth & Firestore!');
      Alert.alert('Succes', 'Account aangemaakt! Je kunt nu inloggen.', [
        { text: 'OK', onPress: () => router.push('/login') }
      ]);

    } catch (error: any) {
      console.error('Fout bij registratie:', error.message);
      setError(error.message);
      Alert.alert('Fout', error.message);
    } finally {
      setLoading(false);
    }
  };

  const [error, setError] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Register" onPress={handleRegister} />
      
      {/* Knop om handmatig naar de loginpagina te navigeren */}
      <View style={{ marginTop: 20 }}>
        <Button title="Back to Login" onPress={() => router.push('/login')} color="#6b7280" />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 32, textAlign: 'center' },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    padding: 12, marginBottom: 16, fontSize: 16,
  },
  error: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
});