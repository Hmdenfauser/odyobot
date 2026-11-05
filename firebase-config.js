/* Firebase web yapılandırması.
   Bunlar gizli bilgi DEĞİLDİR: tarayıcının Firebase projesini bulması için gereken herkese açık tanımlayıcılardır.
   Verinin korunması firestore.rules dosyasındaki kurallarla sağlanır (yalnızca admin yazabilir). */
window.ODYOBOT_FIREBASE = {
  apiKey: "AIzaSyAKs-ivOXgbQtY9ee20x9m5peLzvOUKsmY",
  authDomain: "odyobot-c7a30.firebaseapp.com",
  projectId: "odyobot-c7a30",
  storageBucket: "odyobot-c7a30.firebasestorage.app",
  messagingSenderId: "142552598461",
  appId: "1:142552598461:web:28133d419267f3a3a074d4"
};

/* Admin hesabının kimliği (UID). Düzenleme araçları yalnızca bu hesapla giriş yapınca görünür.
   Gerçek koruma firestore.rules içindeki aynı UID'dir; ikisi değişirse birlikte değiştirilmelidir. */
window.ODYOBOT_ADMIN_UID = "gkXwWVHUirZTWZd7gYwRUqXUCUv2";
