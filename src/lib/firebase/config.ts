import { initializeApp, getApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // Placeholder
  authDomain: "evolvenet-81c14.firebaseapp.com",
  databaseURL: "https://evolvenet-81c14-default-rtdb.firebaseio.com/",
  projectId: "evolvenet-81c14",
  storageBucket: "evolvenet-81c14.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID", // Placeholder
  appId: "YOUR_APP_ID" // Placeholder
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);

export { app, db };
