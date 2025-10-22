import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBkBUZlk05lOfblOM3SuKQ-LiGvqLZackw",
  authDomain: "distancesinbulk.firebaseapp.com",
  projectId: "distancesinbulk",
  storageBucket: "distancesinbulk.firebasestorage.app",
  messagingSenderId: "1085229640479",
  appId: "1:1085229640479:web:83bd2fb40c684f970b1e2a",
  measurementId: "G-3GGB7GLZ2Y",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup, signOut };
