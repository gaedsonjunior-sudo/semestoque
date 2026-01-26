// ============================================
// CONFIGURAÇÃO DO FIREBASE
// ============================================

// IMPORTANTE: Substitua estas configurações pelas suas do Firebase Console
// Veja o arquivo GUIA_FIREBASE_PASSO_A_PASSO.md para instruções detalhadas
const firebaseConfig = {
  apiKey: "AIzaSyBwu6xJDPPX33_Qs-ULFo2hFZ2wDgJ6ywg",
  authDomain: "semestoque-f3a2a.firebaseapp.com",
  projectId: "semestoque-f3a2a",
  storageBucket: "semestoque-f3a2a.firebasestorage.app",
  messagingSenderId: "12189603066",
  appId: "1:12189603066:web:13e1cfce4d02363d342543",
  measurementId: "G-QJE8EWZ9NB"
};

// Verifica se o Firebase está disponível
if (typeof firebase === 'undefined') {
  console.error('❌ Firebase não carregado! Verifique se os scripts estão no HTML.');
} else {
  // Inicializa o Firebase
  try {
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase inicializado com sucesso!');
    
    // Referências globais
    window.db = firebase.firestore();
    window.storage = firebase.storage();
    
    console.log('✅ Firestore conectado!');
    console.log('✅ Storage conectado!');
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase:', error);
    alert('Erro ao conectar com Firebase. Verifique as credenciais em firebase-config.js');
  }
}

// Configurações do app
const CONFIG = {
  SENHA_ADMIN: "admin123", // ⚠️ ALTERE ESTA SENHA!
  EMAIL_NOTIFICACAO: "edson.junior@grupoamigao.com" // ⚠️ Altere para seu e-mail
};

console.log('📋 Configurações carregadas.');
