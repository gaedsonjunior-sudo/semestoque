// ============================================
// CONFIGURAÇÃO DO FIREBASE
// ============================================

// IMPORTANTE: Substitua estas configurações pelas suas do Firebase Console
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "seu-app-id"
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
