// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBZ_CMC_dkvpD26fQB02No_83mBaOD2GrA",
  authDomain: "aura-comm.firebaseapp.com",
  databaseURL: "https://aura-comm-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "aura-comm",
  storageBucket: "aura-comm.firebasestorage.app",
  messagingSenderId: "946099391290",
  appId: "1:946099391290:web:01ae9e781f3107dd185e03",
  measurementId: "G-2ZBY53P287"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
export const db = getDatabase(app);