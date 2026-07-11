// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE FIREBASE
// ═══════════════════════════════════════════════════════════════
// Sigue estos pasos para conectar tu propio proyecto de Firebase:
//
// 1. Entra a https://console.firebase.google.com y crea un proyecto
//    (o usa uno que ya tengas).
//
// 2. Dentro del proyecto: ⚙️ Configuración del proyecto > pestaña
//    "General" > baja hasta "Tus apps" > clic en el ícono </> (Web)
//    para registrar una app web. Te va a mostrar un objeto
//    `firebaseConfig` como el de abajo: cópialo y pégalo aquí,
//    reemplazando los valores de ejemplo.
//
// 3. Activa Authentication: menú lateral > Authentication > "Comenzar"
//    > pestaña "Sign-in method" > habilita "Correo electrónico/contraseña".
//    Luego en la pestaña "Users" agrega manualmente el correo y
//    contraseña de cada gerente que vaya a usar la app.
//
// 4. Activa Firestore: menú lateral > Firestore Database > "Crear
//    base de datos" > modo producción > elige la región más cercana.
//    Luego ve a la pestaña "Reglas" y pega las reglas de seguridad
//    que están al final de este archivo (en el comentario), para que
//    cada gerente solo pueda leer/escribir sus propios datos.
//
// 5. Guarda este archivo y sube todos los archivos (index.html,
//    style.css, script.js, firebase-config.js, firebase-sync.js) a
//    donde vayas a alojar la página (por ejemplo Firebase Hosting,
//    GitHub Pages, Netlify, etc.)
// ═══════════════════════════════════════════════════════════════

const firebaseConfig = {
    apiKey: "AIzaSyBW8MbxTJ0-_gTOXazDhdlSGXTL8A7nV7g",
    authDomain: "panel-gerencial.firebaseapp.com",
    projectId: "panel-gerencial",
    storageBucket: "panel-gerencial.firebasestorage.app",
    messagingSenderId: "1081537822575",
    appId: "1:1081537822575:web:2645d769014781da75329a"
};

firebase.initializeApp(firebaseConfig);

// ═══════════════════════════════════════════════════════════════
// NOMBRE DE TIENDA SEGÚN EL CORREO QUE INICIA SESIÓN
// ═══════════════════════════════════════════════════════════════
// Agrega aquí el correo de cada gerente (en minúsculas) y el nombre
// de la tienda que le corresponde. Se muestra automáticamente en la
// parte de arriba de la página al iniciar sesión.
const TIENDAS_POR_CORREO = {
    "jo.rivera@ishopgroup.com":   "El Cafetal",
    "e.innecken@ishopgroup.com":  "Plaza Real",
    "jos.sanchez@ishopgroup.com": "La Ceiba",
    "d.witter@ishopgroup.com":    "Mango Plaza",
    "m.guzman@ishopgroup.com":    "Los Reyes",
    "ej.garcia@ishopgroup.com":   "San Francisco",
    "d.pena@ishopgroup.com":      "Plaza Bratsi",
    "mr.rodriguez@ishopgroup.com":"Monte General",
    "j.valverde@ishopgroup.com":  "Lincoln Plaza"
    // Agrega más líneas así: "correo@ishopgroup.com": "Nombre de la Tienda",
};

// ═══════════════════════════════════════════════════════════════
// REGLAS DE SEGURIDAD DE FIRESTORE (pégalas en la pestaña "Reglas")
// ═══════════════════════════════════════════════════════════════
// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//     match /usuarios/{uid} {
//       allow read, write: if request.auth != null && request.auth.uid == uid;
//     }
//   }
// }
// ═══════════════════════════════════════════════════════════════// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//     match /usuarios/{uid} {
//       allow read, write: if request.auth != null && request.auth.uid == uid;
//     }
//   }
// }
// ═══════════════════════════════════════════════════════════════
