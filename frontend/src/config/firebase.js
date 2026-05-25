import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCOif788QFEU4gnoGVrm-HLj07hSETdewE",
  authDomain: "recruit-ai-212.firebaseapp.com",
  projectId: "recruit-ai-212",
  storageBucket: "recruit-ai-212.firebasestorage.app",
  messagingSenderId: "194179963212",
  appId: "1:194179963212:web:3f1df4de29361c783397e9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
