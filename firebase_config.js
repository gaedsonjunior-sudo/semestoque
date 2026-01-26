// ============================================
// CONFIGURAÇÃO DO FIREBASE
// ============================================

// IMPORTANTE: Substitua estas configurações pelas suas do Firebase Console
// Veja o arquivo GUIA_FIREBASE_PASSO_A_PASSO.md para instruções detalhadas
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "seu-app-id"
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
