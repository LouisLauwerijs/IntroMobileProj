import { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, firestore, createUserWithEmailAndPassword, addDoc, collection, serverTimestamp } from '../firebase'; // Importeer auth en firestore uit firebase.js

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async () => {
    try {
      // Maak de gebruiker aan met Firebase Authentication (email/wachtwoord registratie)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Voeg de gebruiker toe aan de Firestore database in de collectie 'Users'
      await addDoc(collection(firestore, 'Users'), {
        name: name,
        email: email,
        createdAt: serverTimestamp(), // Voeg de server-side timestamp toe
      });

      console.log('Gebruiker succesvol geregistreerd!');
      router.replace('/login'); // Je kunt hier de gebruiker doorsturen naar de login of homepagina
    } catch (error: any) {
      setError(error.message);
      console.error('Fout bij registratie:', error.message);
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