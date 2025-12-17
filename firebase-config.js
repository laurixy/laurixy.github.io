// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCxugQpFlWBLE_9VVExDIRVRbH4_aFPxRk",
  authDomain: "laurixy-45813.firebaseapp.com",
  databaseURL: "https://laurixy-45813-default-rtdb.firebaseio.com",
  projectId: "laurixy-45813",
  storageBucket: "laurixy-45813.firebasestorage.app",
  messagingSenderId: "311152588741",
  appId: "1:311152588741:web:9122a3bc203dddbc153dac"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

// Admin credentials (hardcoded for admin access)
const ADMIN_EMAIL = 'admin@laurixy.com';
const ADMIN_PASSWORD = 'admin640';

console.log('🔥 Firebase initialized successfully');
console.log('✅ Firebase Storage initialized');
console.log('📦 Storage bucket:', firebaseConfig.storageBucket);
