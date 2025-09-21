// Install Firebase first if not done already
// npm install firebase

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";

// Replace with your own Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyCzi1jSefZENE8HS3iUSQegmsOHS1zVtQI",
  authDomain: "codevita-bfca3.firebaseapp.com",
  projectId: "codevita-bfca3",
  storageBucket: "codevita-bfca3.firebasestorage.app",
  messagingSenderId: "399821513168",
  appId: "1:399821513168:web:f2abe851c881a53c5d99d5",
  measurementId: "G-F2FZE8WE7M"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth and providers
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();
