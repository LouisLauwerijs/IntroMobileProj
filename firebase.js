// firebase.js

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'; // Voeg createUser toe voor registratie
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore'; // Voor Firestore, en addDoc om gebruikers toe te voegen

// Je Firebase-configuratie
const firebaseConfig = {
  apiKey: "AIzaSyDFfIQqaQF7rEeYXavHNE41jH4ZRWkFicA",
  authDomain: "intromobileproject-8fef5.firebaseapp.com",
  projectId: "intromobileproject-8fef5",
  storageBucket: "intromobileproject-8fef5.firebasestorage.app",
  messagingSenderId: "726130052167",
  appId: "1:726130052167:web:e318dafbe651dabef4b562",
  measurementId: "G-TS03PNM83V"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

export { auth, firestore, createUserWithEmailAndPassword, signInWithEmailAndPassword, addDoc, collection, serverTimestamp };