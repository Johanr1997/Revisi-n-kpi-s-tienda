// ═══════════════════════════════════════════════════════════════
// SINCRONIZACIÓN CON FIREBASE (Auth + Firestore)
// ═══════════════════════════════════════════════════════════════
// Cada gerente inicia sesión con su correo y contraseña (creados por
// el administrador en Firebase Authentication). Todos sus datos
// (metas, asesores, bitácoras, recordatorios, calendario, etc.) se
// guardan en un documento propio dentro de Firestore:
//     usuarios/{uid}
// así que cada gerente ve y edita únicamente su propia información,
// y la puede seguir usando desde cualquier computadora iniciando
// sesión con el mismo correo.
// ═══════════════════════════════════════════════════════════════

const auth = firebase.auth();
const db = firebase.firestore();

let usuarioActualUID = null;
let cargaInicialCompleta = false; // evita guardar en la nube antes de haber cargado los datos del usuario
let timeoutGuardadoNube = null;

// ── DOMINIO OBLIGATORIO ────────────────────────────────────────
// Solo se permite iniciar sesión con un correo que termine en @ishopgroup.com
const DOMINIO_PERMITIDO = "@ishopgroup.com";

// ── LOGIN ──────────────────────────────────────────────────────
function iniciarSesionFirebase() {
    const email = document.getElementById("loginEmail").value.trim();
    const pass = document.getElementById("loginPassword").value;
    const errorEl = document.getElementById("loginError");
    const btn = document.getElementById("btnLoginSubmit");

    errorEl.style.display = "none";
    if (!email || !pass) {
        errorEl.textContent = "Ingresa tu correo y contraseña.";
        errorEl.style.display = "block";
        return;
    }
    if (!email.toLowerCase().endsWith(DOMINIO_PERMITIDO)) {
        errorEl.textContent = `Solo se permite iniciar sesión con un correo ${DOMINIO_PERMITIDO}`;
        errorEl.style.display = "block";
        return;
    }

    btn.disabled = true;
    btn.textContent = "Iniciando sesión...";

    auth.signInWithEmailAndPassword(email, pass)
        .catch(err => {
            const mensajes = {
                "auth/invalid-email": "El correo no es válido.",
                "auth/user-disabled": "Esta cuenta fue deshabilitada.",
                "auth/user-not-found": "No existe una cuenta con ese correo.",
                "auth/wrong-password": "Contraseña incorrecta.",
                "auth/invalid-credential": "Correo o contraseña incorrectos.",
                "auth/too-many-requests": "Demasiados intentos. Espera unos minutos e intenta de nuevo."
            };
            errorEl.textContent = mensajes[err.code] || "No se pudo iniciar sesión. Intenta de nuevo.";
            errorEl.style.display = "block";
        })
        .finally(() => {
            btn.disabled = false;
            btn.textContent = "Iniciar sesión";
        });
}

// Enlaza el botón de login por addEventListener (respaldo por si el onclick en línea
// del HTML no se ejecuta por algún motivo) y permite iniciar sesión con Enter.
document.addEventListener("DOMContentLoaded", () => {
    const btnLogin = document.getElementById("btnLoginSubmit");
    if (btnLogin) btnLogin.addEventListener("click", iniciarSesionFirebase);

    ["loginEmail", "loginPassword"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("keydown", e => { if (e.key === "Enter") iniciarSesionFirebase(); });
    });
});

// ── LOGOUT ─────────────────────────────────────────────────────
function cerrarSesionFirebase() {
    if (!confirm("¿Cerrar sesión?")) return;
    cargaInicialCompleta = false;
    auth.signOut();
}

// ── LIMPIEZA COMPLETA DEL ESTADO LOCAL ─────────────────────────
// Se ejecuta cada vez que se cierra sesión (o antes de cargar los datos de
// un usuario que inicia sesión), para asegurar que NINGÚN dato del usuario
// anterior (en memoria o en localStorage) pueda mezclarse ni subirse por
// error a la cuenta del siguiente usuario que inicie sesión en el mismo
// navegador/computadora.
function limpiarEstadoLocalCompleto() {
    localStorage.removeItem("controlVentasData"); // clave del modelo anterior, ya no se usa
    localStorage.removeItem("datosPorMes");
    localStorage.removeItem("mesSeleccionado");
    localStorage.removeItem("bitacorasData");
    localStorage.removeItem("recordatoriosData");
    localStorage.removeItem("clinicasData");
    localStorage.removeItem("ventasCalendario");
    localStorage.removeItem("metasSOS");    // clave del modelo anterior, ya no se usa
    localStorage.removeItem("metasTienda"); // clave del modelo anterior, ya no se usa
    localStorage.removeItem("horarioData");
    localStorage.removeItem("horarioOcultos");

    if (typeof mesISOActual === "function") mesSeleccionado = mesISOActual();
    if (typeof nuevoMesData === "function") {
        datosPorMes = {};
        datosPorMes[mesSeleccionado] = nuevoMesData();
        appData = datosPorMes[mesSeleccionado].appData;
        METAS_SOS = datosPorMes[mesSeleccionado].metasSOS;
        METAS_TIENDA = datosPorMes[mesSeleccionado].metasTienda;
    }
    if (typeof bitacorasData !== "undefined") bitacorasData = [];
    if (typeof recordatoriosData !== "undefined") recordatoriosData = [];
    if (typeof clinicasData !== "undefined") {
        clinicasData = [];
        if (typeof asegurarClinicaInterna === "function") asegurarClinicaInterna();
    }
    if (typeof ventasCalendario !== "undefined") ventasCalendario = [];
    if (typeof horarioData !== "undefined") horarioData = {};
    if (typeof horarioOcultos !== "undefined") horarioOcultos = [];
}

// ── ESTADO DE AUTENTICACIÓN ────────────────────────────────────
auth.onAuthStateChanged(user => {
    const overlay = document.getElementById("loginOverlay");
    const btnCerrarSesion = document.getElementById("btnCerrarSesion");

    if (user) {
        usuarioActualUID = user.uid;
        overlay.classList.remove("visible");
        if (btnCerrarSesion) btnCerrarSesion.style.display = "flex";
        mostrarNombreTienda(user.email);
        // Por seguridad, se limpia cualquier residuo local/en memoria de una sesión
        // anterior ANTES de cargar los datos del usuario que acaba de iniciar sesión,
        // así nunca se sube ni se mezcla información de una cuenta con otra.
        if (typeof limpiarEstadoLocalCompleto === "function") limpiarEstadoLocalCompleto();
        cargarDatosDesdeNube(user.uid);
    } else {
        usuarioActualUID = null;
        cargaInicialCompleta = false;
        if (typeof limpiarEstadoLocalCompleto === "function") limpiarEstadoLocalCompleto();
        overlay.classList.add("visible");
        if (btnCerrarSesion) btnCerrarSesion.style.display = "none";
        const elTienda = document.getElementById("nombreTiendaNav");
        if (elTienda) elTienda.textContent = "";
    }
});

// Muestra el nombre de la tienda junto al título "Control de Ventas" en la navbar,
// según el correo que inició sesión (usa TIENDAS_POR_CORREO de firebase-config.js)
function mostrarNombreTienda(email) {
    const elTienda = document.getElementById("nombreTiendaNav");
    if (!elTienda) return;
    const nombre = (typeof TIENDAS_POR_CORREO !== "undefined") ? TIENDAS_POR_CORREO[(email || "").toLowerCase()] : null;
    elTienda.textContent = nombre || "";
}

// ── CARGA DE DATOS DEL USUARIO DESDE FIRESTORE ─────────────────
function cargarDatosDesdeNube(uid) {
    db.collection("usuarios").doc(uid).get().then(docSnap => {
        if (docSnap.exists) {
            const d = docSnap.data();
            if (d.datosPorMes) {
                // Modelo nuevo: datos organizados por mes (datosPorMes["YYYY-MM"])
                datosPorMes = d.datosPorMes;
                mesSeleccionado = d.mesSeleccionado || (typeof mesISOActual === "function" ? mesISOActual() : mesSeleccionado);
                if (!datosPorMes[mesSeleccionado] && typeof nuevoMesData === "function") datosPorMes[mesSeleccionado] = nuevoMesData();
                if (typeof normalizarMesData === "function") normalizarMesData(datosPorMes[mesSeleccionado]);
                appData = datosPorMes[mesSeleccionado].appData;
                METAS_SOS = datosPorMes[mesSeleccionado].metasSOS;
                METAS_TIENDA = datosPorMes[mesSeleccionado].metasTienda;
                localStorage.setItem("datosPorMes", JSON.stringify(datosPorMes));
                localStorage.setItem("mesSeleccionado", mesSeleccionado);
            } else if (d.appData || d.metasSOS || d.metasTienda) {
                // Cuenta que había sincronizado con el modelo anterior (un solo mes global,
                // sin datosPorMes): se migra ese documento al mes actualmente seleccionado,
                // igual que se hace con los datos que hubiera guardados en el navegador.
                const mesDestino = mesSeleccionado;
                const base = typeof nuevoMesData === "function" ? nuevoMesData() : null;
                datosPorMes = {};
                datosPorMes[mesDestino] = {
                    appData: {
                        inicio: (d.appData && d.appData.inicio) || (base && base.appData.inicio),
                        asesores: (d.appData && d.appData.asesores) || (base && base.appData.asesores)
                    },
                    metasSOS: d.metasSOS || (typeof METAS_SOS_DEFAULT !== "undefined" ? { ...METAS_SOS_DEFAULT } : {}),
                    metasTienda: d.metasTienda || (typeof clonarMetasTiendaDefault === "function" ? clonarMetasTiendaDefault() : {})
                };
                if (d.appData && d.appData.bitacoras && !d.bitacorasData) {
                    bitacorasData = d.appData.bitacoras;
                }
                if (typeof normalizarMesData === "function") normalizarMesData(datosPorMes[mesDestino]);
                appData = datosPorMes[mesDestino].appData;
                METAS_SOS = datosPorMes[mesDestino].metasSOS;
                METAS_TIENDA = datosPorMes[mesDestino].metasTienda;
                localStorage.setItem("datosPorMes", JSON.stringify(datosPorMes));
                localStorage.setItem("mesSeleccionado", mesSeleccionado);
            }
            if (d.bitacorasData)     { bitacorasData = d.bitacorasData; localStorage.setItem("bitacorasData", JSON.stringify(bitacorasData)); }
            if (d.recordatoriosData) { recordatoriosData = d.recordatoriosData; localStorage.setItem("recordatoriosData", JSON.stringify(recordatoriosData)); }
            if (d.clinicasData)      { clinicasData = d.clinicasData; localStorage.setItem("clinicasData", JSON.stringify(clinicasData)); }
            if (d.ventasCalendario)  { ventasCalendario = d.ventasCalendario; localStorage.setItem("ventasCalendario", JSON.stringify(ventasCalendario)); }
            if (d.horarioData)       { horarioData = d.horarioData; localStorage.setItem("horarioData", JSON.stringify(horarioData)); }
            if (d.horarioOcultos)    { horarioOcultos = d.horarioOcultos; localStorage.setItem("horarioOcultos", JSON.stringify(horarioOcultos)); }

            reRenderizarTodo();
            mostrarAlerta("Datos cargados desde la nube.", "success");
        } else {
            // Usuario nuevo: aún no tiene datos en la nube, se sube lo que haya localmente (o valores vacíos)
            guardarNubeInmediato();
        }
        cargaInicialCompleta = true;
    }).catch(err => {
        console.error("Error cargando datos de Firebase:", err);
        mostrarAlerta("No se pudieron cargar los datos de la nube. Revisa tu conexión.", "warning");
        cargaInicialCompleta = true; // permite seguir trabajando localmente aunque falle la nube
    });
}

// Vuelve a pintar toda la interfaz después de cargar datos nuevos desde la nube
function reRenderizarTodo() {
    if (typeof cargarMetaTiendaEnInputs === "function") cargarMetaTiendaEnInputs();
    // Vuelve a llenar los inputs de "Plan SOS" y "Metas del Plan SOS" con los datos recién
    // cargados desde la nube. Sin esto, esos campos se quedaban vacíos tras iniciar sesión
    // (aunque sí hubiera datos guardados), con el riesgo de que "Guardar Datos de Inicio"
    // sobrescribiera Conversión y Ticket Promedio con 0 sin que el usuario lo notara.
    if (typeof cargarDatosInicioEnInputs === "function") cargarDatosInicioEnInputs();
    if (typeof cargarMetasSOSEnInputs === "function") cargarMetasSOSEnInputs();
    if (typeof renderTodo === "function") renderTodo();
    if (typeof renderSelectAsesor === "function") renderSelectAsesor();
    if (typeof renderRecordatorios === "function") renderRecordatorios();
    if (typeof renderClinicas === "function") renderClinicas();
    if (typeof renderCalendario === "function") renderCalendario();
    if (typeof renderListaPendiente === "function") { renderListaPendiente("garex"); renderListaPendiente("insurama"); }
    if (typeof actualizarCumplimientoAsesorVisual === "function") actualizarCumplimientoAsesorVisual();
    if (typeof renderHorario === "function") renderHorario();
    // Refleja en el selector de mes del encabezado cuál mes quedó cargado desde la nube
    if (typeof actualizarSelectorMes === "function") actualizarSelectorMes();
}

// ── GUARDADO EN FIRESTORE ──────────────────────────────────────
// Se llama automáticamente cada vez que se guarda algo en localStorage (ver script.js).
// Usa un pequeño debounce para no escribir en Firestore en cada tecla, sino
// agrupar varios cambios seguidos en un solo guardado.
function programarGuardadoNube() {
    if (!usuarioActualUID || !cargaInicialCompleta) return;
    clearTimeout(timeoutGuardadoNube);
    timeoutGuardadoNube = setTimeout(guardarNubeInmediato, 900);
}

function guardarNubeInmediato() {
    if (!usuarioActualUID) return;
    // datosPorMes ya contiene, para el mes seleccionado, exactamente lo mismo que appData/
    // METAS_SOS/METAS_TIENDA (son la misma referencia en memoria), así que basta con subir
    // datosPorMes completo — incluye el histórico de todos los meses, no solo el actual.
    const datos = {
        datosPorMes: typeof datosPorMes !== "undefined" ? datosPorMes : null,
        mesSeleccionado: typeof mesSeleccionado !== "undefined" ? mesSeleccionado : null,
        bitacorasData: typeof bitacorasData !== "undefined" ? bitacorasData : null,
        recordatoriosData: typeof recordatoriosData !== "undefined" ? recordatoriosData : null,
        clinicasData: typeof clinicasData !== "undefined" ? clinicasData : null,
        ventasCalendario: typeof ventasCalendario !== "undefined" ? ventasCalendario : null,
        horarioData: typeof horarioData !== "undefined" ? horarioData : null,
        horarioOcultos: typeof horarioOcultos !== "undefined" ? horarioOcultos : null,
        actualizadoEn: firebase.firestore.FieldValue.serverTimestamp()
    };
    // IMPORTANTE: se guarda SIN "merge" a propósito. Como "datos" ya incluye
    // siempre el estado completo y actual (asesores, metas, recordatorios, etc.),
    // usar merge:true haría que Firestore fusione los objetos anidados (como la
    // lista de asesores) en vez de reemplazarlos, y los asesores eliminados
    // localmente "resucitarían" al recargar la página. Un guardado completo
    // garantiza que la nube siempre refleje exactamente lo que hay en pantalla.
    db.collection("usuarios").doc(usuarioActualUID).set(datos)
        .catch(err => console.error("Error guardando en Firebase:", err));
}
