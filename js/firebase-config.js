// Firebase Configuration & Initialization
// Using Modular SDK via CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBcy9H4jSnGVkPbIxfAjOai5z0n7nrGBL8", 
    authDomain: "schemecheckerv2.firebaseapp.com",
    projectId: "schemecheckerv2",
    storageBucket: "schemecheckerv2.firebasestorage.app",
    messagingSenderId: "700838052203",
    appId: "1:700838052203:web:bf9b87b95d3af9ac804c2e",
    measurementId: "G-LS9P7FXNKW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
