// ============================================
// CONFIGURAÇÃO DO FIREBASE
// ============================================

// IMPORTANTE: Substitua estas configurações pelas suas do Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBwu6xJDPPX33_Qs-ULFo2hFZ2wDgJ6ywg",
  authDomain: "semestoque-f3a2a.firebaseapp.com",
  projectId: "semestoque-f3a2a",
  storageBucket: "semestoque-f3a2a.firebasestorage.app",
  messagingSenderId: "12189603066",
  appId: "1:12189603066:web:13e1cfce4d02363d342543",
  measurementId: "G-QJE8EWZ9NB"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Referências globais
const db = firebase.firestore();
const storage = firebase.storage();

// Configurações do app
const CONFIG = {
  SENHA_ADMIN: "admin123", // Altere esta senha!
  EMAIL_NOTIFICACAO: "edson.junior@grupoamigao.com" // Seu e-mail para notificações
};

console.log("Firebase inicializado com sucesso!");
