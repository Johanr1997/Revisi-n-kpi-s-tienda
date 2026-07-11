// METAS SOS — cargadas desde localStorage (editables en Configuración)
// ═══════════════════════════════════════════════════════════════
// TOGGLE 13% (IVA) SOBRE MONTOS DE VENTA
// ═══════════════════════════════════════════════════════════════
// Cuando está activo, suma 13% a los montos que se MUESTRAN en pantalla:
// venta total (del formulario), venta acumulada (tienda y por asesor) y
// dispositivos/accesorios. Garex e Insurama NUNCA se ven afectados, ya
// que sus precios/incentivos vienen de tablas fijas aparte.
// Es una preferencia visual guardada en este navegador (no se sube a la
// nube), y NO modifica los datos guardados, solo lo que se despliega.
let iva13Activo = localStorage.getItem("iva13Activo") === "1";

// Aplica el 13% a un monto si el toggle está activo; si no, lo deja igual.
function conIVA(monto) {
    const n = monto || 0;
    return iva13Activo ? n * 1.13 : n;
}

// Se llama desde el checkbox en la pantalla de Ventas
function toggleIVA13() {
    const chk = document.getElementById("checkIVA13");
    iva13Activo = !!(chk && chk.checked);
    localStorage.setItem("iva13Activo", iva13Activo ? "1" : "0");
    // Refresca todos los montos visibles con/sin el 13%
    if (typeof recalcularMontoVentaTotal === "function") recalcularMontoVentaTotal();
    if (typeof renderTodo === "function") renderTodo();
    if (typeof actualizarCumplimientoAsesorVisual === "function") actualizarCumplimientoAsesorVisual();
}

// Sincroniza el estado visual del checkbox con el valor guardado (al cargar la página)
document.addEventListener("DOMContentLoaded", () => {
    const chk = document.getElementById("checkIVA13");
    if (chk) chk.checked = iva13Activo;
});

const METAS_SOS_DEFAULT = { conversion: 0, accesorizacion: 0, ticket: 0, qr: 0 };
let METAS_SOS = JSON.parse(localStorage.getItem("metasSOS")) || { ...METAS_SOS_DEFAULT };
if (METAS_SOS.qr === undefined) METAS_SOS.qr = 0; // Compatibilidad con datos guardados antes de este campo

function guardarMetasSOS() {
    const conv  = parseFloat(document.getElementById("cfgMetaConversion").value);
    const acc   = parseFloat(document.getElementById("cfgMetaAccesorizacion").value);
    const tick  = parseFloat(document.getElementById("cfgMetaTicket").value);
    const qr    = parseFloat(document.getElementById("cfgMetaQR").value);

    if (isNaN(conv) || isNaN(acc) || isNaN(tick) || isNaN(qr) || conv <= 0 || acc <= 0 || tick <= 0 || qr < 0) {
        mostrarAlerta("Por favor ingresa valores válidos para las metas (la meta de QR puede ser 0).", "warning");
        return;
    }

    METAS_SOS = { conversion: conv, accesorizacion: acc, ticket: tick, qr: qr };
    localStorage.setItem("metasSOS", JSON.stringify(METAS_SOS));
    if (typeof programarGuardadoNube === "function") programarGuardadoNube();

    // Actualizar los badges de meta en la pestaña Ventas
    document.getElementById("metaVisualConv").textContent  = `${conv.toFixed(1)}%`;
    document.getElementById("metaVisualAcc").textContent   = `${acc.toFixed(1)}%`;
    document.getElementById("metaVisualTick").textContent  = `$${tick.toLocaleString()}`;
    document.getElementById("metaVisualQR").textContent    = `${qr}`;

    sincronizarYRenderizar();
    mostrarAlerta("Metas del Plan SOS actualizadas correctamente.", "success");
}

// META MENSUAL DE LA TIENDA — cargada desde localStorage (editable en Configuración)
// Independiente de la meta individual de cada asesor. Se usa como referencia de la meta
// total de la tienda, desglosada por categoría de venta, unidades, Office y servicio técnico.
const METAS_TIENDA_DEFAULT = {
    ventas: { mac: 0, ipad: 0, iphone: 0, watch: 0, airpods: 0, acc_apple: 0, acc_terceros: 0, audio: 0, demos: 0, garex: 0 },
    unidades: { mac: 0, ipad: 0, iphone: 0, watch: 0, airpods: 0 },
    office: { personal365: 0, homeStudent: 0 },
    servicioTecnico: { activo: false, meta: 0 }
};

function clonarMetasTiendaDefault() {
    return JSON.parse(JSON.stringify(METAS_TIENDA_DEFAULT));
}

let METAS_TIENDA = JSON.parse(localStorage.getItem("metasTienda")) || clonarMetasTiendaDefault();
// Compatibilidad: completa cualquier campo faltante de datos guardados en una versión anterior
(function migrarMetasTienda() {
    const base = clonarMetasTiendaDefault();
    METAS_TIENDA.ventas = { ...base.ventas, ...(METAS_TIENDA.ventas || {}) };
    METAS_TIENDA.unidades = { ...base.unidades, ...(METAS_TIENDA.unidades || {}) };
    METAS_TIENDA.office = { ...base.office, ...(METAS_TIENDA.office || {}) };
    METAS_TIENDA.servicioTecnico = { ...base.servicioTecnico, ...(METAS_TIENDA.servicioTecnico || {}) };
})();

// Carga los valores guardados de METAS_TIENDA en los inputs del panel de Configuración
function cargarMetaTiendaEnInputs() {
    document.getElementById("cfgMetaTiendaVenta_mac").value          = METAS_TIENDA.ventas.mac;
    document.getElementById("cfgMetaTiendaVenta_ipad").value         = METAS_TIENDA.ventas.ipad;
    document.getElementById("cfgMetaTiendaVenta_iphone").value       = METAS_TIENDA.ventas.iphone;
    document.getElementById("cfgMetaTiendaVenta_watch").value        = METAS_TIENDA.ventas.watch;
    document.getElementById("cfgMetaTiendaVenta_airpods").value      = METAS_TIENDA.ventas.airpods;
    document.getElementById("cfgMetaTiendaVenta_acc_apple").value    = METAS_TIENDA.ventas.acc_apple;
    document.getElementById("cfgMetaTiendaVenta_acc_terceros").value = METAS_TIENDA.ventas.acc_terceros;
    document.getElementById("cfgMetaTiendaVenta_audio").value        = METAS_TIENDA.ventas.audio;
    document.getElementById("cfgMetaTiendaVenta_demos").value        = METAS_TIENDA.ventas.demos;
    document.getElementById("cfgMetaTiendaVenta_garex").value        = METAS_TIENDA.ventas.garex;

    document.getElementById("cfgMetaTiendaUnidad_mac").value     = METAS_TIENDA.unidades.mac;
    document.getElementById("cfgMetaTiendaUnidad_ipad").value    = METAS_TIENDA.unidades.ipad;
    document.getElementById("cfgMetaTiendaUnidad_iphone").value  = METAS_TIENDA.unidades.iphone;
    document.getElementById("cfgMetaTiendaUnidad_watch").value   = METAS_TIENDA.unidades.watch;
    document.getElementById("cfgMetaTiendaUnidad_airpods").value = METAS_TIENDA.unidades.airpods;

    document.getElementById("cfgMetaTiendaOfficePersonal365").value  = METAS_TIENDA.office.personal365;
    document.getElementById("cfgMetaTiendaOfficeHomeStudent").value  = METAS_TIENDA.office.homeStudent;

    document.getElementById("chkServicioTecnicoTienda").checked = METAS_TIENDA.servicioTecnico.activo;
    document.getElementById("cfgMetaTiendaServicioTecnico").value    = METAS_TIENDA.servicioTecnico.meta;
    document.getElementById("cfgMetaTiendaServicioTecnico").disabled = !METAS_TIENDA.servicioTecnico.activo;
}

// Habilita o deshabilita el campo de meta de servicio técnico según el checkbox
function toggleServicioTecnicoTienda() {
    const activo = document.getElementById("chkServicioTecnicoTienda").checked;
    const input = document.getElementById("cfgMetaTiendaServicioTecnico");
    input.disabled = !activo;
    if (!activo) input.value = 0;
}

// Lee todos los inputs del panel, valida y guarda la Meta Mensual de la Tienda
function guardarMetaTienda() {
    const idsVenta = ["mac", "ipad", "iphone", "watch", "airpods", "acc_apple", "acc_terceros", "audio", "demos", "garex"];
    const idsUnidad = ["mac", "ipad", "iphone", "watch", "airpods"];

    const nuevasVentas = {};
    for (const cat of idsVenta) {
        const val = parseFloat(document.getElementById(`cfgMetaTiendaVenta_${cat}`).value);
        if (isNaN(val) || val < 0) {
            mostrarAlerta("Por favor ingresa valores válidos (0 o mayores) en las metas de venta por categoría.", "warning");
            return;
        }
        nuevasVentas[cat] = val;
    }

    const nuevasUnidades = {};
    for (const cat of idsUnidad) {
        const val = parseFloat(document.getElementById(`cfgMetaTiendaUnidad_${cat}`).value);
        if (isNaN(val) || val < 0) {
            mostrarAlerta("Por favor ingresa valores válidos (0 o mayores) en las metas de unidades.", "warning");
            return;
        }
        nuevasUnidades[cat] = val;
    }

    const personal365 = parseFloat(document.getElementById("cfgMetaTiendaOfficePersonal365").value);
    const homeStudent = parseFloat(document.getElementById("cfgMetaTiendaOfficeHomeStudent").value);
    if (isNaN(personal365) || personal365 < 0 || isNaN(homeStudent) || homeStudent < 0) {
        mostrarAlerta("Por favor ingresa valores válidos (0 o mayores) en las metas de Microsoft Office.", "warning");
        return;
    }

    const servicioActivo = document.getElementById("chkServicioTecnicoTienda").checked;
    const servicioMeta = parseFloat(document.getElementById("cfgMetaTiendaServicioTecnico").value) || 0;
    if (servicioActivo && (isNaN(servicioMeta) || servicioMeta < 0)) {
        mostrarAlerta("Por favor ingresa un valor válido (0 o mayor) en la meta de Servicio Técnico.", "warning");
        return;
    }

    METAS_TIENDA = {
        ventas: nuevasVentas,
        unidades: nuevasUnidades,
        office: { personal365: personal365, homeStudent: homeStudent },
        servicioTecnico: { activo: servicioActivo, meta: servicioActivo ? servicioMeta : 0 }
    };
    localStorage.setItem("metasTienda", JSON.stringify(METAS_TIENDA));
    if (typeof programarGuardadoNube === "function") programarGuardadoNube();

    // La meta ($) de cada asesor se calcula a partir de su % sobre esta meta de tienda: hay que refrescar todo
    renderTodo();
    actualizarCumplimientoAsesorVisual();

    mostrarAlerta("Meta Mensual de la Tienda actualizada correctamente.", "success");
}



// GAREX (Garantía Extendida): Mac/iPad/Watch/AirPods/Audio a 36 Meses; iPhone a 12 y 24 Meses
const TABLA_GAREX = {
    "Mac":     { "36 Meses": 2.5 },
    "iPad":    { "36 Meses": 2.5 },
    "iPhone":  { "12 Meses": 2.5, "24 Meses": 2.5 },
    "Watch":   { "36 Meses": 2 },
    "AirPods": { "36 Meses": 1 },
    "Audio":   { "36 Meses": 1 }
};

// INSURAMA (Seguros): Mac/iPad/iPhone/Watch a 12/18/24 Meses, según cobertura disponible por dispositivo
const TABLA_INSURAMA = {
    "Mac": {
        "Daño Accidental":                  { "12 Meses": 2.5, "18 Meses": 4,   "24 Meses": 4 },
        "Robo & Hurto + Daño Accidental":   { "12 Meses": 4.5, "18 Meses": 7,   "24 Meses": 7 }
    },
    "iPad": {
        "Robo & Hurto":                     { "12 Meses": 2.5, "18 Meses": 4,   "24 Meses": 4 },
        "Robo & Hurto + Daño Accidental":   { "12 Meses": 4.5, "18 Meses": 7,   "24 Meses": 7 }
    },
    "iPhone": {
        "Robo & Hurto":                     { "12 Meses": 3.5, "18 Meses": 5.5, "24 Meses": 5.5 },
        "Robo & Hurto + Daño Accidental":   { "12 Meses": 7,   "18 Meses": 11,  "24 Meses": 11 }
    },
    "Watch": {
        "Robo & Hurto":                     { "12 Meses": 1,   "18 Meses": 1,   "24 Meses": 1 },
        "Robo & Hurto + Daño Accidental":   { "12 Meses": 2,   "18 Meses": 3,   "24 Meses": 3 }
    }
};

// Devuelve el incentivo unitario ($) para una combinación dada, o 0 si no existe
function obtenerIncentivoGarex(dispositivo, duracion) {
    return (TABLA_GAREX[dispositivo] && TABLA_GAREX[dispositivo][duracion]) || 0;
}
function obtenerIncentivoInsurama(dispositivo, cobertura, duracion) {
    return (TABLA_INSURAMA[dispositivo] && TABLA_INSURAMA[dispositivo][cobertura] && TABLA_INSURAMA[dispositivo][cobertura][duracion]) || 0;
}

// ===================================================================
// PRECIOS AL CLIENTE POR RANGO DE VALOR DEL DISPOSITIVO (Garex/Insurama)
// Cada par es [limiteSuperiorDelRango, montoACobrar]. Se busca el primer
// rango cuyo limite sea >= al precio del dispositivo ingresado.
// ===================================================================

// GAREX: "general" aplica para Mac, iPad, Watch, AirPods y Audio (36 Meses)
//        "iPhone" aplica solo para iPhone (12 y 24 Meses)
const PRECIOS_GAREX_CLIENTE = {
    general: { "36 Meses": [[50, 6], [100, 10], [250, 20], [500, 40], [1000, 50], [1500, 60], [2000, 70], [2500, 75], [3000, 85], [5000, 110]] },
    iPhone: { "12 Meses": [[250, 13.33], [500, 26.67], [1000, 33.33], [1500, 40], [2000, 46.67], [2500, 50]], "24 Meses": [[250, 20], [500, 40], [1000, 50], [1500, 60], [2000, 70], [2500, 75]] }
};

// INSURAMA: por dispositivo, cobertura y duracion
const PRECIOS_INSURAMA_CLIENTE = {
    "Mac": {
        "Daño Accidental": {
            "12 Meses": [[800, 45], [1000, 60], [1500, 75], [2000, 130], [2500, 155], [4250, 195], [5000, 280], [6250, 340]],
            "18 Meses": [[800, 65], [1000, 85], [1500, 110], [2000, 180], [2500, 215], [4250, 275], [5000, 390], [6250, 475]],
            "24 Meses": [[800, 70], [1000, 100], [1500, 125], [2000, 210], [2500, 245], [4250, 310], [5000, 445], [6250, 540]]
        },
        "Robo & Hurto + Daño Accidental": {
            "12 Meses": [[800, 70], [1000, 95], [1500, 130], [2000, 215], [2500, 280], [4250, 355], [5000, 510], [6250, 615]],
            "18 Meses": [[800, 95], [1000, 130], [1500, 180], [2000, 305], [2500, 390], [4250, 500], [5000, 710], [6250, 865]],
            "24 Meses": [[800, 110], [1000, 150], [1500, 210], [2000, 345], [2500, 450], [4250, 570], [5000, 810], [6250, 985]]
        }
    },
    "iPad": {
        "Robo & Hurto": {
            "12 Meses": [[450, 25], [650, 40], [900, 55], [1250, 65], [1625, 85], [2000, 105], [2375, 125], [2625, 145], [2875, 160], [3125, 175], [3500, 190], [3875, 210], [5000, 285]],
            "18 Meses": [[450, 35], [650, 55], [900, 75], [1250, 90], [1625, 116], [2000, 145], [2375, 175], [2625, 200], [2875, 220], [3125, 240], [3500, 265], [3875, 295], [5000, 400]],
            "24 Meses": [[450, 40], [650, 60], [900, 85], [1250, 100], [1625, 135], [2000, 170], [2375, 200], [2625, 230], [2875, 255], [3125, 275], [3500, 305], [3875, 340], [5000, 455]]
        },
        "Robo & Hurto + Daño Accidental": {
            "12 Meses": [[450, 50], [650, 80], [900, 110], [1250, 130], [1625, 170], [2000, 210], [2375, 260], [2625, 295], [2875, 325], [3125, 350], [3500, 390], [3875, 435], [5000, 570]],
            "18 Meses": [[450, 70], [650, 110], [900, 155], [1250, 185], [1625, 235], [2000, 300], [2375, 360], [2625, 410], [2875, 450], [3125, 495], [3500, 545], [3875, 605], [5000, 800]],
            "24 Meses": [[450, 80], [650, 125], [900, 175], [1250, 210], [1625, 270], [2000, 340], [2375, 410], [2625, 470], [2875, 515], [3125, 565], [3500, 620], [3875, 690], [5000, 915]]
        }
    },
    "iPhone": {
        "Robo & Hurto": {
            "12 Meses": [[450, 40], [650, 64], [900, 90], [1250, 95], [1625, 140], [2000, 175], [2375, 210], [3000, 255]],
            "18 Meses": [[450, 55], [650, 90], [900, 125], [1250, 135], [1625, 195], [2000, 245], [2375, 295], [3000, 360]],
            "24 Meses": [[450, 65], [650, 105], [900, 140], [1250, 150], [1625, 220], [2000, 280], [2375, 340], [3000, 410]]
        },
        "Robo & Hurto + Daño Accidental": {
            "12 Meses": [[450, 80], [650, 130], [900, 185], [1250, 195], [1625, 280], [2000, 355], [2375, 430], [3000, 520]],
            "18 Meses": [[450, 115], [650, 180], [900, 255], [1250, 275], [1625, 395], [2000, 495], [2375, 600], [3000, 730]],
            "24 Meses": [[450, 130], [650, 205], [900, 290], [1250, 310], [1625, 450], [2000, 565], [2375, 690], [3000, 835]]
        }
    },
    "Watch": {
        "Robo & Hurto": {
            "12 Meses": [[450, 15], [650, 25], [900, 35], [1150, 45], [1400, 55]],
            "18 Meses": [[450, 20], [650, 30], [900, 45], [1150, 60], [1400, 75]],
            "24 Meses": [[450, 25], [650, 40], [900, 50], [1150, 70], [1400, 85]]
        },
        "Robo & Hurto + Daño Accidental": {
            "12 Meses": [[450, 45], [650, 70], [900, 95], [1150, 110], [1400, 130]],
            "18 Meses": [[450, 60], [650, 95], [900, 135], [1150, 155], [1400, 185]],
            "24 Meses": [[450, 70], [650, 110], [900, 155], [1150, 175], [1400, 210]]
        }
    }
};

// Busca en una lista de [limiteRango, monto] (ordenada ascendente) el primer
// rango cuyo limite sea >= al precio del dispositivo. Si el precio excede
// el rango más alto disponible, se usa el monto del rango más alto (tope).
function buscarPrecioPorRango(precioDispositivo, listaRangos) {
    if (!listaRangos || listaRangos.length === 0 || isNaN(precioDispositivo)) return 0;
    for (const [limite, monto] of listaRangos) {
        if (precioDispositivo <= limite) return monto;
    }
    return listaRangos[listaRangos.length - 1][1]; // Tope: precio mayor a todos los rangos
}

// Devuelve el precio a cobrar al cliente por un Garex, según dispositivo, duración y precio del equipo
function calcularPrecioGarexCliente(dispositivo, duracion, precioDispositivo) {
    const tabla = dispositivo === "iPhone" ? PRECIOS_GAREX_CLIENTE.iPhone : PRECIOS_GAREX_CLIENTE.general;
    return buscarPrecioPorRango(precioDispositivo, tabla[duracion]);
}

// Devuelve el precio a cobrar al cliente por un Insurama, según dispositivo, cobertura, duración y precio del equipo
function calcularPrecioInsuramaCliente(dispositivo, cobertura, duracion, precioDispositivo) {
    const tabla = PRECIOS_INSURAMA_CLIENTE[dispositivo] && PRECIOS_INSURAMA_CLIENTE[dispositivo][cobertura];
    return buscarPrecioPorRango(precioDispositivo, tabla ? tabla[duracion] : null);
}

// ESTRUCTURA DE CONTROL CENTRALIZADA
function nuevoAsesor(nombre) {
    return {
        nombre: nombre,
        porcentajeMeta: 0, // % de la Meta Mensual de la Tienda asignado a este asesor (la meta en $ se calcula automáticamente)
        ventaSemanal: 0,
        qr: 0,
        tradeIn: 0,
        montos: { mac:0, ipad:0, iphone:0, watch:0, airpods:0, audio:0, acc_apple:0, acc_terceros:0 },
        unidades: { mac:0, ipad:0, iphone:0, watch:0, airpods:0, audio:0 },
        ventasGarex: [],     // [{ dispositivo, duracion, cantidad, incentivoUnitario, incentivoTotal }]
        ventasInsurama: []   // [{ dispositivo, cobertura, duracion, cantidad, incentivoUnitario, incentivoTotal }]
    };
}

let appData = JSON.parse(localStorage.getItem("controlVentasData")) || {
    inicio: { conversion: 0, accesorizacion: 0, accesorizacionManual: false, accesorizacionManualValor: null, ticket: 0, trafico: 0, comentarios: "", oportunidades: "" },
    bitacoras: [],
    asesores: {
        asesor0: nuevoAsesor("Asesor 1"),
        asesor1: nuevoAsesor("Asesor 2"),
        asesor2: nuevoAsesor("Asesor 3")
    }
};

// MIGRACIÓN: si hay datos guardados de una versión anterior (sin ventasGarex/ventasInsurama), los completa
let _migracionContadorId = 0;
Object.keys(appData.asesores).forEach(key => {
    const a = appData.asesores[key];
    if (!a.ventasGarex) a.ventasGarex = [];
    if (!a.ventasInsurama) a.ventasInsurama = [];
    // Migrar registros antiguos que no tengan montoVenta (precio al cliente)
    a.ventasGarex.forEach(v => { if (v.montoVenta === undefined) v.montoVenta = 0; if (v.id === undefined) v.id = "migrado_" + (_migracionContadorId++); });
    a.ventasInsurama.forEach(v => { if (v.montoVenta === undefined) v.montoVenta = 0; if (v.id === undefined) v.id = "migrado_" + (_migracionContadorId++); });
    // Migrar la meta fija en $ (versión anterior) al nuevo modelo por porcentaje de la Meta de la Tienda
    if (a.porcentajeMeta === undefined) a.porcentajeMeta = 0;
});

// Suma las 10 categorías de "Meta de Venta por Categoría" más la meta de Servicio Técnico
// (si está activo) para obtener la Meta Total de la Tienda ($)
function calcularMetaTotalTienda() {
    const v = METAS_TIENDA.ventas;
    const st = METAS_TIENDA.servicioTecnico;
    const totalVentas = (v.mac || 0) + (v.ipad || 0) + (v.iphone || 0) + (v.watch || 0) + (v.airpods || 0) +
           (v.acc_apple || 0) + (v.acc_terceros || 0) + (v.audio || 0) + (v.demos || 0) + (v.garex || 0);
    const totalServicioTecnico = (st && st.activo) ? (st.meta || 0) : 0;
    return totalVentas + totalServicioTecnico;
}

// Calcula la meta mensual ($) de un asesor según el % de la Meta de la Tienda que se le asignó
function calcularMetaAsesor(asor) {
    const porcentaje = asor.porcentajeMeta || 0;
    return (porcentaje / 100) * calcularMetaTotalTienda();
}

// LÍNEAS PENDIENTES DE AGREGAR (estado temporal en memoria, no se guarda hasta presionar "Actualizar Asesor")
let lineasGarexPendientes = [];
let lineasInsuramaPendientes = [];

// ═══════════════════════════════════════════
// MODO OSCURO
// ═══════════════════════════════════════════
const mediaModoOscuroSistema = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

function aplicarModoOscuro(activar) {
    document.body.classList.toggle("dark-mode", activar);

    const btnNav = document.getElementById("btnThemeToggle");
    if (btnNav) {
        btnNav.textContent = activar ? "☀" : "☾";
        btnNav.title = activar ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
    }
    const btnCfg = document.getElementById("btnThemeToggleConfig");
    if (btnCfg) {
        btnCfg.textContent = activar ? "☀ Activar modo claro" : "☾ Activar modo oscuro";
    }
    const chkAuto = document.getElementById("chkModoOscuroAuto");
    if (chkAuto) chkAuto.checked = localStorage.getItem("modoOscuroAuto") !== "0";
}

// El usuario eligió manualmente un tema: se guarda y deja de seguir al sistema
function toggleModoOscuro() {
    const activar = !document.body.classList.contains("dark-mode");
    localStorage.setItem("modoOscuro", activar ? "1" : "0");
    localStorage.setItem("modoOscuroAuto", "0");
    aplicarModoOscuro(activar);
}

// Activa/desactiva que la app siga automáticamente el modo del sistema operativo
function toggleModoOscuroAuto() {
    const chk = document.getElementById("chkModoOscuroAuto");
    const seguirSistema = chk ? chk.checked : true;
    localStorage.setItem("modoOscuroAuto", seguirSistema ? "1" : "0");
    if (seguirSistema) {
        const prefiereOscuro = mediaModoOscuroSistema ? mediaModoOscuroSistema.matches : false;
        localStorage.setItem("modoOscuro", prefiereOscuro ? "1" : "0");
        aplicarModoOscuro(prefiereOscuro);
        mostrarAlerta("La app ahora seguirá el modo del sistema automáticamente.", "success");
    } else {
        mostrarAlerta("Modo automático desactivado. Puedes elegir el tema manualmente.", "success");
    }
}

function inicializarModoOscuro() {
    const seguirSistema = localStorage.getItem("modoOscuroAuto") !== "0"; // por defecto, sí sigue al sistema
    let activar;
    if (seguirSistema && mediaModoOscuroSistema) {
        activar = mediaModoOscuroSistema.matches;
    } else {
        activar = localStorage.getItem("modoOscuro") === "1";
    }
    aplicarModoOscuro(activar);

    // Si el sistema cambia de tema en vivo y el modo automático sigue activo, la app se actualiza sola
    if (mediaModoOscuroSistema) {
        mediaModoOscuroSistema.addEventListener("change", (e) => {
            if (localStorage.getItem("modoOscuroAuto") !== "0") {
                localStorage.setItem("modoOscuro", e.matches ? "1" : "0");
                aplicarModoOscuro(e.matches);
            }
        });
    }
}

document.addEventListener("DOMContentLoaded", function () {
    inicializarModoOscuro();
    configurarNavegacionPestañas();
    configurarSelectsProteccion();
    actualizarRelojYFecha();
    setInterval(actualizarRelojYFecha, 1000);
    
    // Cargar datos en inputs de Inicio si ya existen
    document.getElementById("inputConversion").value = appData.inicio.conversion || "";
    document.getElementById("inputTicket").value = appData.inicio.ticket || "";
    document.getElementById("inputComentarios").value = appData.inicio.comentarios || "";
    document.getElementById("inputOportunidades").value = appData.inicio.oportunidades || "";
    actualizarLabelTraficoAcumulado();

    // Construir el select de asesores dinámicamente
    renderSelectAsesor(false);
    const selInicial = document.getElementById("selectAsesor");
    if (selInicial) selInicial.addEventListener("change", onSelectAsesorChange);

    // Mostrar el cumplimiento del asesor seleccionado por defecto al cargar
    actualizarCumplimientoAsesorVisual();
    renderListaPendiente("garex");
    renderListaPendiente("insurama");

    renderTodo();

    // Cargar metas SOS en los inputs de Configuración
    document.getElementById("cfgMetaConversion").value    = METAS_SOS.conversion;
    document.getElementById("cfgMetaAccesorizacion").value = METAS_SOS.accesorizacion;
    document.getElementById("cfgMetaTicket").value         = METAS_SOS.ticket;
    document.getElementById("cfgMetaQR").value             = METAS_SOS.qr;

    // Sincronizar badges de Ventas con los valores guardados
    document.getElementById("metaVisualConv").textContent  = `${METAS_SOS.conversion.toFixed(1)}%`;
    document.getElementById("metaVisualAcc").textContent   = `${METAS_SOS.accesorizacion.toFixed(1)}%`;
    document.getElementById("metaVisualTick").textContent  = `$${METAS_SOS.ticket.toLocaleString()}`;
    document.getElementById("metaVisualQR").textContent    = `${METAS_SOS.qr}`;

    // Cargar la Meta Mensual de la Tienda en los inputs de Configuración
    cargarMetaTiendaEnInputs();
});

function onSelectAsesorChange() {
    if (lineasGarexPendientes.length > 0 || lineasInsuramaPendientes.length > 0) {
        const continuar = confirm("Tienes líneas de Garex/Insurama sin guardar. Si cambias de asesor se perderán. ¿Deseas continuar?");
        if (!continuar) {
            this.value = this.dataset.previo || this.value;
            return;
        }
        lineasGarexPendientes = [];
        lineasInsuramaPendientes = [];
        renderListaPendiente("garex");
        renderListaPendiente("insurama");
    }
    const key = this.value;
    this.dataset.previo = key;
    actualizarCumplimientoAsesorVisual();
}

function configurarNavegacionPestañas() {
    const botones = document.querySelectorAll(".tab-btn");
    botones.forEach(btn => {
        btn.addEventListener("click", function () {
            botones.forEach(b => b.classList.remove("active"));
            this.classList.add("active");

            const target = this.getAttribute("data-target");
            document.querySelectorAll(".seccion-dashboard").forEach(sec => sec.classList.remove("active-seccion"));
            
            const seccionActiva = document.getElementById(target);
            if (seccionActiva) seccionActiva.classList.add("active-seccion");
        });
    });

}

// CONFIGURAR SELECTS DEPENDIENTES DE GAREX E INSURAMA (según reglas de negocio)
function configurarSelectsProteccion() {
    // --- GAREX: Dispositivo -> Duración ---
    const selectGarexDispositivo = document.getElementById("selectGarexDispositivo");
    const selectGarexDuracion = document.getElementById("selectGarexDuracion");

    function poblarDuracionesGarex() {
        const dispositivo = selectGarexDispositivo.value;
        const duraciones = Object.keys(TABLA_GAREX[dispositivo] || {});
        selectGarexDuracion.innerHTML = duraciones.map(d => `<option value="${d}">${d}</option>`).join("");
    }

    if (selectGarexDispositivo) {
        selectGarexDispositivo.innerHTML = Object.keys(TABLA_GAREX).map(d => `<option value="${d}">${d}</option>`).join("");
        selectGarexDispositivo.addEventListener("change", () => { poblarDuracionesGarex(); actualizarPrecioGarexCalculado(); });
        poblarDuracionesGarex();
    }

    // --- INSURAMA: Dispositivo -> Cobertura -> Duración ---
    const selectInsuramaDispositivo = document.getElementById("selectInsuramaDispositivo");
    const selectInsuramaCobertura = document.getElementById("selectInsuramaCobertura");
    const selectInsuramaDuracion = document.getElementById("selectInsuramaDuracion");

    function poblarCoberturasInsurama() {
        const dispositivo = selectInsuramaDispositivo.value;
        const coberturas = Object.keys(TABLA_INSURAMA[dispositivo] || {});
        selectInsuramaCobertura.innerHTML = coberturas.map(c => `<option value="${c}">${c}</option>`).join("");
        poblarDuracionesInsurama();
    }

    function poblarDuracionesInsurama() {
        const dispositivo = selectInsuramaDispositivo.value;
        const cobertura = selectInsuramaCobertura.value;
        const duraciones = Object.keys((TABLA_INSURAMA[dispositivo] || {})[cobertura] || {});
        selectInsuramaDuracion.innerHTML = duraciones.map(d => `<option value="${d}">${d}</option>`).join("");
    }

    if (selectInsuramaDispositivo) {
        selectInsuramaDispositivo.innerHTML = Object.keys(TABLA_INSURAMA).map(d => `<option value="${d}">${d}</option>`).join("");
        selectInsuramaDispositivo.addEventListener("change", () => { poblarCoberturasInsurama(); actualizarPrecioInsuramaCalculado(); });
        selectInsuramaCobertura.addEventListener("change", () => { poblarDuracionesInsurama(); actualizarPrecioInsuramaCalculado(); });
        poblarCoberturasInsurama();
    }

    // --- Recalcular precio al cliente cuando cambien duración o precio del dispositivo ---
    const elGarexDuracion = document.getElementById("selectGarexDuracion");
    const elGarexPrecioDisp = document.getElementById("inputGarexPrecioDispositivo");
    if (elGarexDuracion) elGarexDuracion.addEventListener("change", actualizarPrecioGarexCalculado);
    if (elGarexPrecioDisp) elGarexPrecioDisp.addEventListener("input", actualizarPrecioGarexCalculado);

    const elInsuramaDuracion = document.getElementById("selectInsuramaDuracion");
    const elInsuramaPrecioDisp = document.getElementById("inputInsuramaPrecioDispositivo");
    if (elInsuramaDuracion) elInsuramaDuracion.addEventListener("change", actualizarPrecioInsuramaCalculado);
    if (elInsuramaPrecioDisp) elInsuramaPrecioDisp.addEventListener("input", actualizarPrecioInsuramaCalculado);

    actualizarPrecioGarexCalculado();
    actualizarPrecioInsuramaCalculado();
}

// Recalcula y muestra el precio Garex al cliente según dispositivo, duración y precio del equipo
function actualizarPrecioGarexCalculado() {
    const dispositivo = document.getElementById("selectGarexDispositivo")?.value;
    const duracion = document.getElementById("selectGarexDuracion")?.value;
    const precioDispositivo = parseFloat(document.getElementById("inputGarexPrecioDispositivo")?.value) || 0;
    const precio = calcularPrecioGarexCliente(dispositivo, duracion, precioDispositivo);
    const el = document.getElementById("v_garexPrecioCalculado");
    if (el) el.textContent = `$${precio.toLocaleString()}`;
}

// Recalcula y muestra el precio Insurama al cliente según dispositivo, cobertura, duración y precio del equipo
function actualizarPrecioInsuramaCalculado() {
    const dispositivo = document.getElementById("selectInsuramaDispositivo")?.value;
    const cobertura = document.getElementById("selectInsuramaCobertura")?.value;
    const duracion = document.getElementById("selectInsuramaDuracion")?.value;
    const precioDispositivo = parseFloat(document.getElementById("inputInsuramaPrecioDispositivo")?.value) || 0;
    const precio = calcularPrecioInsuramaCliente(dispositivo, cobertura, duracion, precioDispositivo);
    const el = document.getElementById("v_insuramaPrecioCalculado");
    if (el) el.textContent = `$${precio.toLocaleString()}`;
}

function actualizarRelojYFecha() {
    const ahora = new Date();
    const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById("fecha").textContent = ahora.toLocaleDateString('es-ES', opcionesFecha);
    const elHora = document.getElementById("hora");
    if (elHora) elHora.textContent = ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// GUARDAR INICIO
let modoTrafico = 'sumar'; // 'sumar' | 'reemplazar'

function setModoTrafico(modo) {
    modoTrafico = modo;
    document.getElementById("btnTraficoSumar").classList.toggle("active", modo === 'sumar');
    document.getElementById("btnTraficoReemplazar").classList.toggle("active", modo === 'reemplazar');
}

function actualizarLabelTraficoAcumulado() {
    const lbl = document.getElementById("lblTraficoAcumulado");
    if (lbl) lbl.textContent = (appData.inicio.trafico || 0).toLocaleString();
}

// Descarta el valor manual de accesorización y vuelve a que se calcule automáticamente
function restaurarAccesorizacionAutomatica() {
    appData.inicio.accesorizacionManual = false;
    appData.inicio.accesorizacionManualValor = null;
    sincronizarYRenderizar();
    mostrarAlerta("La accesorización volvió a calcularse automáticamente.", "success");
}

function guardarDatosReunion() {
    appData.inicio.conversion = parseFloat(document.getElementById("inputConversion").value) || 0;
    appData.inicio.ticket = parseFloat(document.getElementById("inputTicket").value) || 0;

    // Accesorización: por defecto se calcula automáticamente en renderTodo() a partir de los
    // montos de dispositivos y accesorios. Si el usuario ingresa un valor aquí, se le pregunta
    // si desea reemplazar el porcentaje calculado automáticamente por el valor ingresado.
    const inputAccManualEl = document.getElementById("inputAccesorizacionManual");
    const valorAccManual = inputAccManualEl && inputAccManualEl.value !== "" ? parseFloat(inputAccManualEl.value) : null;
    if (valorAccManual !== null && !isNaN(valorAccManual)) {
        const actual = appData.inicio.accesorizacion || 0;
        const reemplazar = confirm(`Actualmente se muestra ${actual.toFixed(1)}% de accesorización (calculado automáticamente). ¿Deseas reemplazarlo por ${valorAccManual.toFixed(1)}% ingresado manualmente?`);
        if (reemplazar) {
            appData.inicio.accesorizacionManual = true;
            appData.inicio.accesorizacionManualValor = valorAccManual;
        }
        inputAccManualEl.value = "";
    }

    const inputTraficoEl = document.getElementById("inputTrafico");
    if (inputTraficoEl.value !== "") {
        const valorTrafico = parseInt(inputTraficoEl.value) || 0;
        appData.inicio.trafico = modoTrafico === 'sumar'
            ? (appData.inicio.trafico || 0) + valorTrafico
            : valorTrafico;
        inputTraficoEl.value = "";
    }

    appData.inicio.comentarios = document.getElementById("inputComentarios").value;
    appData.inicio.oportunidades = document.getElementById("inputOportunidades").value;

    actualizarLabelTraficoAcumulado();
    sincronizarYRenderizar();
    mostrarAlerta("Datos de pestaña Inicio guardados correctamente.", "success");
}

// AGREGAR UNA LÍNEA DE GAREX A LA LISTA PENDIENTE (no se guarda en appData todavía)
function agregarLineaGarex() {
    const dispositivo = document.getElementById("selectGarexDispositivo").value;
    const duracion = document.getElementById("selectGarexDuracion").value;
    const cantidad = parseInt(document.getElementById("inputGarexCantidad").value) || 0;
    const precioDispositivo = parseFloat(document.getElementById("inputGarexPrecioDispositivo").value) || 0;
    const precioUnitario = calcularPrecioGarexCliente(dispositivo, duracion, precioDispositivo);

    if (cantidad <= 0) {
        mostrarAlerta("Ingresa una cantidad mayor a 0 para agregar el Garex a la lista.", "warning");
        return;
    }
    if (precioDispositivo <= 0) {
        mostrarAlerta("Ingresa el precio del dispositivo para calcular el monto del Garex.", "warning");
        return;
    }

    const incentivoUnitario = obtenerIncentivoGarex(dispositivo, duracion);
    lineasGarexPendientes.push({
        dispositivo, duracion, cantidad,
        incentivoUnitario,
        incentivoTotal: incentivoUnitario * cantidad,
        montoVentaUnitario: precioUnitario,
        montoVenta: precioUnitario * cantidad
    });

    document.getElementById("inputGarexCantidad").value = 0;
    document.getElementById("inputGarexPrecioDispositivo").value = 0;
    actualizarPrecioGarexCalculado();
    renderListaPendiente("garex");
}

// AGREGAR UNA LÍNEA DE INSURAMA A LA LISTA PENDIENTE (no se guarda en appData todavía)
function agregarLineaInsurama() {
    const dispositivo = document.getElementById("selectInsuramaDispositivo").value;
    const cobertura = document.getElementById("selectInsuramaCobertura").value;
    const duracion = document.getElementById("selectInsuramaDuracion").value;
    const cantidad = parseInt(document.getElementById("inputInsuramaCantidad").value) || 0;
    const precioDispositivo = parseFloat(document.getElementById("inputInsuramaPrecioDispositivo").value) || 0;
    const precioUnitario = calcularPrecioInsuramaCliente(dispositivo, cobertura, duracion, precioDispositivo);

    if (cantidad <= 0) {
        mostrarAlerta("Ingresa una cantidad mayor a 0 para agregar el Insurama a la lista.", "warning");
        return;
    }
    if (precioDispositivo <= 0) {
        mostrarAlerta("Ingresa el precio del dispositivo para calcular el monto del Insurama.", "warning");
        return;
    }

    const incentivoUnitario = obtenerIncentivoInsurama(dispositivo, cobertura, duracion);
    lineasInsuramaPendientes.push({
        dispositivo, cobertura, duracion, cantidad,
        incentivoUnitario,
        incentivoTotal: incentivoUnitario * cantidad,
        montoVentaUnitario: precioUnitario,
        montoVenta: precioUnitario * cantidad
    });

    document.getElementById("inputInsuramaCantidad").value = 0;
    document.getElementById("inputInsuramaPrecioDispositivo").value = 0;
    actualizarPrecioInsuramaCalculado();
    renderListaPendiente("insurama");
}

// QUITAR UNA LÍNEA PENDIENTE ANTES DE GUARDAR
function quitarLineaPendiente(tipo, indice) {
    if (tipo === "garex") lineasGarexPendientes.splice(indice, 1);
    else lineasInsuramaPendientes.splice(indice, 1);
    renderListaPendiente(tipo);
}

// RENDERIZAR LA LISTA TEMPORAL (PENDIENTE DE GUARDAR) DE GAREX O INSURAMA
function renderListaPendiente(tipo) {
    const esGarex = tipo === "garex";
    const lista = esGarex ? lineasGarexPendientes : lineasInsuramaPendientes;
    const contenedor = document.getElementById(esGarex ? "listaGarexPendiente" : "listaInsuramaPendiente");
    if (!contenedor) return;

    if (lista.length === 0) {
        contenedor.innerHTML = `<p style="font-size:12px; color:#86868B; font-style:italic;">Aún no has agregado líneas.</p>`;
        return;
    }

    let html = "";
    lista.forEach((v, i) => {
        html += `
            <div class="a-linea-pendiente" style="display:flex; justify-content:space-between; align-items:center; background:#FFFFFF; border-radius:8px; padding:8px 10px; margin-bottom:6px; font-size:12px; color:#1D1D1F !important;">
                <span style="color:#1D1D1F !important;">
                    <strong style="color:#1D1D1F !important;">${v.dispositivo}</strong>${v.cobertura ? " · " + v.cobertura : ""} · ${v.duracion} · x${v.cantidad}
                    <br><span style="color:#86868B !important;">Incentivo: $${v.incentivoTotal.toFixed(2)} | Venta: $${v.montoVenta.toFixed(2)}</span>
                </span>
                <button type="button" onclick="quitarLineaPendiente('${tipo}', ${i})" style="background:none; border:none; color:#FF3B30; font-size:16px; cursor:pointer; padding:0 4px;">✕</button>
            </div>`;
    });
    contenedor.innerHTML = html;
}

// ═══════════════════════════════════════════
// ALERTAS — BURBUJA LIQUID GLASS (reemplaza alert() nativo)
// ═══════════════════════════════════════════
const ICONOS_TOAST = { success: "✓", error: "!", warning: "!", info: "i" };

function mostrarAlerta(mensaje, tipo = "info", duracion = 4200) {
    const cont = document.getElementById("toastContainer");
    if (!cont) { window.alert(mensaje); return; }

    const toast = document.createElement("div");
    toast.className = `toast-bubble toast-${tipo}`;
    toast.innerHTML = `
        <span class="toast-icon">${ICONOS_TOAST[tipo] || ICONOS_TOAST.info}</span>
        <span class="toast-message"></span>
        <button type="button" class="toast-close" aria-label="Cerrar">✕</button>
    `;
    toast.querySelector(".toast-message").textContent = mensaje;

    const cerrar = () => {
        if (!toast.isConnected) return;
        toast.classList.add("toast-out");
        setTimeout(() => toast.remove(), 360);
    };

    toast.querySelector(".toast-close").addEventListener("click", cerrar);
    cont.appendChild(toast);

    setTimeout(cerrar, duracion);
}

// ═══════════════════════════════════════════
// MODAL DE FECHA — BURBUJA LIQUID GLASS (reemplaza prompt() nativo)
// ═══════════════════════════════════════════
function pedirFecha(titulo, fechaDefault) {
    return new Promise((resolve) => {
        const overlay = document.createElement("div");
        overlay.className = "modal-overlay";
        overlay.innerHTML = `
            <div class="modal-glass">
                <h3 class="modal-title"></h3>
                <div class="form-group" style="margin-bottom:20px;">
                    <label for="modalFechaInput">Fecha</label>
                    <input type="date" id="modalFechaInput">
                </div>
                <div class="modal-actions">
                    <button type="button" class="modal-btn modal-btn-cancel">Cancelar</button>
                    <button type="button" class="modal-btn modal-btn-confirm">Confirmar</button>
                </div>
            </div>`;
        overlay.querySelector(".modal-title").textContent = titulo;
        overlay.querySelector("#modalFechaInput").value = fechaDefault || new Date().toISOString().slice(0, 10);

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add("modal-open"));

        const cerrar = (valor) => {
            overlay.classList.remove("modal-open");
            overlay.classList.add("modal-out");
            setTimeout(() => overlay.remove(), 280);
            resolve(valor);
        };

        overlay.querySelector(".modal-btn-cancel").addEventListener("click", () => cerrar(null));
        overlay.querySelector(".modal-btn-confirm").addEventListener("click", () => {
            const valor = overlay.querySelector("#modalFechaInput").value;
            cerrar(valor || null);
        });
        overlay.addEventListener("click", (e) => { if (e.target === overlay) cerrar(null); });
        overlay.querySelector("#modalFechaInput").addEventListener("keydown", (e) => {
            if (e.key === "Enter") overlay.querySelector(".modal-btn-confirm").click();
        });
    });
}







function actualizarResumenIngreso() {
    const monto = parseFloat(document.getElementById("inputVentaSemanal").value) || 0;
    const fecha = document.getElementById("inputVentaFechaDia").value;
    const resumen = document.getElementById("resumenDia");
    if (monto > 0 && fecha) {
        const [y,m,d] = fecha.split("-");
        document.getElementById("resumenDiaMonto").textContent = `$${monto.toLocaleString()}`;
        document.getElementById("resumenDiaFecha").textContent = `${d}/${m}/${y}`;
        resumen.style.display = "block";
    } else {
        resumen.style.display = "none";
    }
}

function guardarDatosAsesor() {
    const key = document.getElementById("selectAsesor").value;
    const nombreAsesor = appData.asesores[key].nombre;
    const monto = parseFloat(document.getElementById("inputVentaSemanal").value) || 0;

    const fecha = document.getElementById("inputVentaFechaDia").value;
    const reflejarEnCalendario = document.getElementById("chkReflejarCalendario")?.checked ?? true;

    if (monto > 0 && !fecha) {
        mostrarAlerta("Por favor ingresa la fecha de la venta.", "warning");
        return;
    }
    if (monto > 0 && fecha) {
        // Siempre se guarda en el calendario (para poder gestionarla/eliminarla desde ahí),
        // pero si "reflejarEnCalendario" es falso, no se muestra como pastilla en la celda del día.
        ventasCalendario.push({
            id: Date.now(),
            fecha,
            label: `💰 ${nombreAsesor}: $${monto.toLocaleString()}`,
            tipo: "venta",
            monto,
            asesorKey: key,
            visibleEnCalendario: reflejarEnCalendario
        });
        guardarVentasCalendario();
    }

    appData.asesores[key].ventaSemanal += monto;
    appData.asesores[key].qr += parseInt(document.getElementById("inputQR").value) || 0;
    appData.asesores[key].tradeIn += parseInt(document.getElementById("inputTradeIn").value) || 0;

    // Volcar todas las líneas pendientes de Garex con su fecha de registro
    const fechaGarexInput = document.getElementById("inputFechaProteccion")?.value;
    const fechaProteccionISO = fechaGarexInput || new Date().toISOString().slice(0, 10);
    const [fp_y, fp_m, fp_d] = fechaProteccionISO.split("-");
    const fechaProteccionDisplay = `${fp_d}/${fp_m}/${fp_y}`;
    lineasGarexPendientes.forEach((linea, i) => {
        appData.asesores[key].ventasGarex.push({ ...linea, id: Date.now() + i, fecha: fechaProteccionDisplay, fechaISO: fechaProteccionISO });
    });

    // Volcar todas las líneas pendientes de Insurama con su fecha de registro
    lineasInsuramaPendientes.forEach((linea, i) => {
        appData.asesores[key].ventasInsurama.push({ ...linea, id: Date.now() + 1000 + i, fecha: fechaProteccionDisplay, fechaISO: fechaProteccionISO });
    });

    // Limpiar las listas pendientes ya volcadas
    lineasGarexPendientes = [];
    lineasInsuramaPendientes = [];
    renderListaPendiente("garex");
    renderListaPendiente("insurama");

    // Montos
    appData.asesores[key].montos.mac += parseFloat(document.getElementById("m_mac").value) || 0;
    appData.asesores[key].montos.ipad += parseFloat(document.getElementById("m_ipad").value) || 0;
    appData.asesores[key].montos.iphone += parseFloat(document.getElementById("m_iphone").value) || 0;
    appData.asesores[key].montos.watch += parseFloat(document.getElementById("m_watch").value) || 0;
    appData.asesores[key].montos.airpods += parseFloat(document.getElementById("m_airpods").value) || 0;
    appData.asesores[key].montos.audio += parseFloat(document.getElementById("m_audio").value) || 0;
    appData.asesores[key].montos.acc_apple += parseFloat(document.getElementById("m_acc_apple").value) || 0;
    appData.asesores[key].montos.acc_terceros += parseFloat(document.getElementById("m_acc_terceros").value) || 0;

    // Unidades
    appData.asesores[key].unidades.mac += parseInt(document.getElementById("u_mac").value) || 0;
    appData.asesores[key].unidades.ipad += parseInt(document.getElementById("u_ipad").value) || 0;
    appData.asesores[key].unidades.iphone += parseInt(document.getElementById("u_iphone").value) || 0;
    appData.asesores[key].unidades.watch += parseInt(document.getElementById("u_watch").value) || 0;
    appData.asesores[key].unidades.airpods += parseInt(document.getElementById("u_airpods").value) || 0;
    appData.asesores[key].unidades.audio += parseInt(document.getElementById("u_audio").value) || 0;

    // Resetear campos
    ["inputVentaSemanal","inputQR","inputTradeIn",
     "m_mac","m_ipad","m_iphone","m_watch","m_airpods","m_audio","m_acc_apple","m_acc_terceros",
     "u_mac","u_ipad","u_iphone","u_watch","u_airpods","u_audio",
     "inputGarexCantidad","inputGarexPrecioDispositivo","inputInsuramaCantidad","inputInsuramaPrecioDispositivo",
     "inputVentaFechaDia","inputFechaProteccion"
    ].forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
    document.getElementById("resumenDia").style.display = "none";
    const lblTotalReset = document.getElementById("lblMontoVentaTotal");
    if (lblTotalReset) lblTotalReset.textContent = "$0";
    if (document.getElementById("chkReflejarCalendario")) document.getElementById("chkReflejarCalendario").checked = true;
    actualizarPrecioGarexCalculado();
    actualizarPrecioInsuramaCalculado();

    sincronizarYRenderizar();
    actualizarCumplimientoAsesorVisual();
    renderCalendario();
    mostrarAlerta("Expediente comercial cargado y acumulado con éxito.", "success");
}


// Suma los montos por dispositivo y actualiza el campo de Monto de Ventas automáticamente
function recalcularMontoVentaTotal() {
    const ids = ["m_mac","m_ipad","m_iphone","m_watch","m_airpods","m_audio","m_acc_apple","m_acc_terceros"];
    const total = ids.reduce((acc, id) => {
        const el = document.getElementById(id);
        return acc + (parseFloat(el ? el.value : 0) || 0);
    }, 0);
    const inputVenta = document.getElementById("inputVentaSemanal");
    if (inputVenta) {
        inputVenta.value = total > 0 ? total : "";
        actualizarResumenIngreso();
    }
    // El total guardado (arriba) siempre es el monto real, sin 13%. Lo que se
    // MUESTRA aquí sí incluye el 13% si el toggle está activo.
    const lblTotal = document.getElementById("lblMontoVentaTotal");
    if (lblTotal) lblTotal.textContent = `$${conIVA(total).toLocaleString()}`;
}

// MOSTRAR % DE CUMPLIMIENTO DE META MENSUAL DEL ASESOR SELECCIONADO (EN VIVO)
function actualizarCumplimientoAsesorVisual() {
    const key = document.getElementById("selectAsesor").value;
    const asor = appData.asesores[key];
    const contenedor = document.getElementById("cumplimientoAsesorBox");
    if (!asor || !contenedor) return;

    const ventaAcumulada = asor.ventaSemanal || 0;
    const meta = calcularMetaAsesor(asor);
    const cumplimiento = meta > 0 ? ((ventaAcumulada / meta) * 100).toFixed(1) : 0;
    const accesorizacionAsesor = calcularAccesorizacion(asor.montos).toFixed(1);

    contenedor.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="font-size:13px; font-weight:600; color:#1D1D1F;">Cumplimiento de meta mensual</span>
            <span style="font-size:18px; font-weight:700; color:#0071E3;">${cumplimiento}%</span>
        </div>
        <div class="barra-progreso"><div class="progreso-relleno" style="width:${Math.min(cumplimiento, 100)}%;"></div></div>
        <p style="font-size:12px; margin-top:8px; color:#6E6E73;">
            Venta acumulada: $${conIVA(ventaAcumulada).toLocaleString()} | Meta mensual: $${Math.round(meta).toLocaleString()}
        </p>
        <div class="cumplimiento-acc-row">
            <span style="font-size:12px; font-weight:600; color:#1D1D1F;">Accesorización (auto)</span>
            <span style="font-size:15px; font-weight:700; color:#34C759;">${accesorizacionAsesor}%</span>
        </div>`;
}

// AGREGAR NOTA BITÁCORA
function agregarNotaBitacora() {
    const nota = document.getElementById("inputNotaBitacora").value;
    if (!nota.trim()) return mostrarAlerta("Por favor, escribe una anotación.", "warning");

    const fechaInput = document.getElementById("inputBitacoraFecha").value;
    const agregarCal = document.getElementById("checkBitacoraCalendario").checked;

    const fechaISO = fechaInput || new Date().toISOString().slice(0, 10);
    const [y, m, d] = fechaISO.split("-");
    const fechaDisplay = `${d}/${m}/${y} ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;

    const nuevaNota = {
        id: Date.now(),
        texto: nota,
        fecha: fechaDisplay,
        fechaISO: agregarCal ? fechaISO : null
    };
    appData.bitacoras.unshift(nuevaNota);
    document.getElementById("inputNotaBitacora").value = "";
    document.getElementById("inputBitacoraFecha").value = "";
    sincronizarYRenderizar();
    renderCalendario();
}

function eliminarBitacora(id) {
    if (!confirm("¿Eliminar esta anotación de la bitácora?")) return;
    appData.bitacoras = appData.bitacoras.filter((b, i) => (b.id ?? i) !== id);
    sincronizarYRenderizar();
    renderCalendario();
    mostrarAlerta("Anotación eliminada de la bitácora.", "success");
}

// RENDERS MÚLTIPLES
function renderTodo() {
    renderSelectAsesor();
    renderListaAsesoresConfig();
    let acumuladoTotalVentas = 0;
    let acumuladoVentaSemanalSolo = 0; // solo venta de dispositivos/accesorios (SÍ lleva 13% si el toggle está activo)
    let acumuladoGarexMontoSolo = 0;   // monto cobrado por Garex (NUNCA lleva 13%)
    // La meta total de la tienda viene directo de lo configurado en "Meta Mensual de la Tienda",
    // no de la suma de los % asignados a cada asesor (que podrían no sumar exactamente 100%).
    const metaTotalTienda = calcularMetaTotalTienda();
    let totalGarex = 0;
    let totalSeguros = 0;
    let totalQR = 0;
    let totalTradeIn = 0;

    // Acumuladores para el attach rate por dispositivo (Garex y Seguros)
    const unidadesPorDispositivo = { mac: 0, ipad: 0, iphone: 0, watch: 0 };
    const garexPorDispositivo = { Mac: 0, iPad: 0, iPhone: 0, Watch: 0 };
    const segurosPorDispositivo = { Mac: 0, iPad: 0, iPhone: 0, Watch: 0 };

    // Acumuladores para la accesorización automática de toda la tienda
    const montosTienda = { mac: 0, ipad: 0, iphone: 0, watch: 0, airpods: 0, audio: 0, acc_apple: 0, acc_terceros: 0 };

    // Procesar Datos Globales de Asesores
    let htmlResumenAsesores = "";
    Object.keys(appData.asesores).forEach(key => {
        const asor = appData.asesores[key];
        const metaAsor = calcularMetaAsesor(asor);
        acumuladoTotalVentas += asor.ventaSemanal;
        acumuladoTotalVentas += sumarMontoVenta(asor.ventasGarex);
        acumuladoVentaSemanalSolo += asor.ventaSemanal;
        acumuladoGarexMontoSolo += sumarMontoVenta(asor.ventasGarex);
        // Insurama (seguros) NO se suma a la meta de ventas: solo se contabiliza para sus propios reportes/incentivos.
        totalGarex += sumarCantidad(asor.ventasGarex);
        totalSeguros += sumarCantidad(asor.ventasInsurama);
        totalQR += asor.qr;
        totalTradeIn += asor.tradeIn;

        // Unidades vendidas por dispositivo (base para el attach rate)
        unidadesPorDispositivo.mac    += asor.unidades.mac;
        unidadesPorDispositivo.ipad   += asor.unidades.ipad;
        unidadesPorDispositivo.iphone += asor.unidades.iphone;
        unidadesPorDispositivo.watch  += asor.unidades.watch;

        // Montos por dispositivo y accesorio (base para la accesorización automática de tienda)
        montosTienda.mac          += asor.montos.mac;
        montosTienda.ipad         += asor.montos.ipad;
        montosTienda.iphone       += asor.montos.iphone;
        montosTienda.watch        += asor.montos.watch;
        montosTienda.airpods      += asor.montos.airpods;
        montosTienda.audio        += asor.montos.audio;
        montosTienda.acc_apple    += asor.montos.acc_apple;
        montosTienda.acc_terceros += asor.montos.acc_terceros;

        // Garex e Insurama colocados por dispositivo
        asor.ventasGarex.forEach(v => {
            if (garexPorDispositivo[v.dispositivo] !== undefined) garexPorDispositivo[v.dispositivo] += v.cantidad;
        });
        asor.ventasInsurama.forEach(v => {
            if (segurosPorDispositivo[v.dispositivo] !== undefined) segurosPorDispositivo[v.dispositivo] += v.cantidad;
        });

        const cumplimiento = metaAsor > 0 ? ((asor.ventaSemanal / metaAsor) * 100).toFixed(1) : 0;
        const u = asor.unidades;
        const m = asor.montos;
        const totalUnidades = u.mac + u.ipad + u.iphone + u.watch + u.airpods + u.audio;

        // Conteo de Garex y Seguros colocados por este asesor, por dispositivo
        const garexAsorPorDispositivo = { Mac: 0, iPad: 0, iPhone: 0, Watch: 0, AirPods: 0, Audio: 0 };
        asor.ventasGarex.forEach(v => {
            if (garexAsorPorDispositivo[v.dispositivo] !== undefined) garexAsorPorDispositivo[v.dispositivo] += v.cantidad;
        });
        const segurosAsorPorDispositivo = { Mac: 0, iPad: 0, iPhone: 0, Watch: 0 };
        asor.ventasInsurama.forEach(v => {
            if (segurosAsorPorDispositivo[v.dispositivo] !== undefined) segurosAsorPorDispositivo[v.dispositivo] += v.cantidad;
        });

        const incentivoGarex   = sumarIncentivo(asor.ventasGarex);
        const incentivoInsurama = sumarIncentivo(asor.ventasInsurama);
        const incentivoTotal    = incentivoGarex + incentivoInsurama;
        const accesorizacionAsor = calcularAccesorizacion(m).toFixed(1);

        // Meta por categoría (dispositivo/accesorio) del asesor: % asignado x meta de esa
        // categoría en la Meta Mensual de la Tienda. "Llevan" es lo realmente vendido (m.*).
        const porcentajeAsor = asor.porcentajeMeta || 0;
        const categoriasMeta = [
            { label: "Mac",              key: "mac" },
            { label: "iPad",             key: "ipad" },
            { label: "iPhone",           key: "iphone" },
            { label: "Watch",            key: "watch" },
            { label: "AirPods",          key: "airpods" },
            { label: "Audio",            key: "audio" },
            { label: "Accesorios Apple", key: "acc_apple" },
            { label: "Acc. Terceros",    key: "acc_terceros" }
        ];
        const filasMetaCategoria = categoriasMeta.map(c => {
            const metaCat = (porcentajeAsor / 100) * (METAS_TIENDA.ventas[c.key] || 0);
            const llevaCat = m[c.key] || 0;
            const pctCat = metaCat > 0 ? Math.min((llevaCat / metaCat) * 100, 100) : 0;
            return `
                <div class="ra-meta-cat-row">
                    <div class="ra-meta-cat-head">
                        <span>${c.label}</span>
                        <span class="ra-muted">$${Math.round(conIVA(llevaCat)).toLocaleString()} / $${Math.round(metaCat).toLocaleString()}</span>
                    </div>
                    <div class="barra-progreso ra-mini-bar"><div class="progreso-relleno" style="width:${pctCat}%;"></div></div>
                </div>`;
        }).join("");

        // Meta de UNIDADES por dispositivo del asesor: % asignado x meta de unidades de tienda,
        // siempre redondeada hacia arriba (ej. 2.1 -> 3 unidades), para no exigir menos de lo justo.
        const categoriasUnidades = [
            { label: "Mac",     key: "mac" },
            { label: "iPad",    key: "ipad" },
            { label: "iPhone",  key: "iphone" },
            { label: "Watch",   key: "watch" },
            { label: "AirPods", key: "airpods" }
        ];
        const filasMetaUnidades = categoriasUnidades.map(c => {
            const metaUnidCat = Math.ceil((porcentajeAsor / 100) * (METAS_TIENDA.unidades[c.key] || 0));
            const llevaUnidCat = u[c.key] || 0;
            const pctUnidCat = metaUnidCat > 0 ? Math.min((llevaUnidCat / metaUnidCat) * 100, 100) : 0;
            return `
                <div class="ra-meta-cat-row">
                    <div class="ra-meta-cat-head">
                        <span>${c.label}</span>
                        <span class="ra-muted">${llevaUnidCat} / ${metaUnidCat} uds</span>
                    </div>
                    <div class="barra-progreso ra-mini-bar"><div class="progreso-relleno" style="width:${pctUnidCat}%;"></div></div>
                </div>`;
        }).join("");

        htmlResumenAsesores += `
            <div class="ra-card">
                <div class="ra-header">
                    <div>
                        <strong>${asor.nombre}</strong>
                        <span class="ra-incentivo">💰 Incentivos: $${incentivoTotal.toFixed(2)}</span>
                        <span class="ra-acc-badge">🔌 Accesorización: ${accesorizacionAsor}%</span>
                    </div>
                    <span class="ra-cumplimiento">${cumplimiento}% de cumplimiento</span>
                </div>
                <div class="barra-progreso"><div class="progreso-relleno" style="width:${Math.min(cumplimiento,100)}%;"></div></div>
                <div class="ra-stat-strip">
                    <div class="ra-stat"><span class="ra-stat-label">Venta</span><span class="ra-stat-value">$${conIVA(asor.ventaSemanal).toLocaleString()}</span></div>
                    <div class="ra-stat"><span class="ra-stat-label">Meta</span><span class="ra-stat-value">$${Math.round(metaAsor).toLocaleString()}</span></div>
                    <div class="ra-stat"><span class="ra-stat-label">QR Colocados</span><span class="ra-stat-value">${asor.qr}</span></div>
                    <div class="ra-stat"><span class="ra-stat-label">Trade-In</span><span class="ra-stat-value">${asor.tradeIn}</span></div>
                </div>

                <div class="ra-tabs" role="tablist">
                    <button type="button" class="ra-tab-btn active" onclick="cambiarTabAsesor('${key}','metas',this)">Metas por Categoría</button>
                    <button type="button" class="ra-tab-btn" onclick="cambiarTabAsesor('${key}','acumulados',this)">Acumulados</button>
                </div>

                <div class="ra-tab-panel active" id="raTab-${key}-metas">
                    <div class="ra-section" style="margin-top:0; padding-top:0; border-top:none;">
                        <p class="ra-section-title">Unidades por Dispositivo — <span class="ra-accent-blue">${porcentajeAsor}% de la meta de tienda</span></p>
                        <div class="ra-meta-cat-grid">
                            ${filasMetaUnidades}
                        </div>
                    </div>
                    <div class="ra-section">
                        <p class="ra-section-title">Dispositivos y Accesorios — <span class="ra-accent-blue">${porcentajeAsor}% de la meta de tienda</span></p>
                        <div class="ra-meta-cat-grid">
                            ${filasMetaCategoria}
                        </div>
                    </div>
                </div>

                <div class="ra-tab-panel" id="raTab-${key}-acumulados">
                    <div class="ra-section" style="margin-top:0; padding-top:0; border-top:none;">
                        <p class="ra-section-title">Unidades acumuladas — <span class="ra-accent-blue">${totalUnidades} total</span></p>
                        <div class="ra-grid ra-grid-3">
                            <div>Mac: <strong>${u.mac}</strong> <span class="ra-muted">($${conIVA(m.mac).toLocaleString()})</span></div>
                            <div>iPad: <strong>${u.ipad}</strong> <span class="ra-muted">($${conIVA(m.ipad).toLocaleString()})</span></div>
                            <div>iPhone: <strong>${u.iphone}</strong> <span class="ra-muted">($${conIVA(m.iphone).toLocaleString()})</span></div>
                            <div>Watch: <strong>${u.watch}</strong> <span class="ra-muted">($${conIVA(m.watch).toLocaleString()})</span></div>
                            <div>AirPods: <strong>${u.airpods}</strong> <span class="ra-muted">($${conIVA(m.airpods).toLocaleString()})</span></div>
                            <div>Audio: <strong>${u.audio}</strong> <span class="ra-muted">($${conIVA(m.audio).toLocaleString()})</span></div>
                        </div>
                    </div>
                    <div class="ra-section">
                        <p class="ra-section-title">Garex colocados — <span class="ra-accent-green">${sumarCantidad(asor.ventasGarex)} total</span></p>
                        <div class="ra-grid ra-grid-3">
                            <div>Mac: <strong>${garexAsorPorDispositivo.Mac}</strong></div>
                            <div>iPad: <strong>${garexAsorPorDispositivo.iPad}</strong></div>
                            <div>iPhone: <strong>${garexAsorPorDispositivo.iPhone}</strong></div>
                            <div>Watch: <strong>${garexAsorPorDispositivo.Watch}</strong></div>
                            <div>AirPods: <strong>${garexAsorPorDispositivo.AirPods}</strong></div>
                            <div>Audio: <strong>${garexAsorPorDispositivo.Audio}</strong></div>
                        </div>
                    </div>
                    <div class="ra-section">
                        <p class="ra-section-title">Seguros colocados — <span class="ra-accent-green">${sumarCantidad(asor.ventasInsurama)} total</span></p>
                        <div class="ra-grid ra-grid-4">
                            <div>Mac: <strong>${segurosAsorPorDispositivo.Mac}</strong></div>
                            <div>iPad: <strong>${segurosAsorPorDispositivo.iPad}</strong></div>
                            <div>iPhone: <strong>${segurosAsorPorDispositivo.iPhone}</strong></div>
                            <div>Watch: <strong>${segurosAsorPorDispositivo.Watch}</strong></div>
                        </div>
                    </div>
                </div>
            </div>`;
    });
    document.getElementById("resumenAsesoresVisual").innerHTML = htmlResumenAsesores;

    // Render Pestaña Ventas
    // Monto mostrado: venta de dispositivos/accesorios con 13% (si aplica) + Garex SIN 13%.
    // El % de cumplimiento de meta usa siempre el monto real (acumuladoTotalVentas), sin 13%.
    const acumuladoTotalVentasMostrado = conIVA(acumuladoVentaSemanalSolo) + acumuladoGarexMontoSolo;
    document.getElementById("ventasAcumuladas").textContent = `$${acumuladoTotalVentasMostrado.toLocaleString()}`;
    document.getElementById("v_metaTotalTienda").textContent = `$${metaTotalTienda.toLocaleString()}`;
    const porcMetaTienda = metaTotalTienda > 0 ? ((acumuladoTotalVentas / metaTotalTienda) * 100).toFixed(1) : 0;
    document.getElementById("cumplimientoMetaTotal").textContent = `${porcMetaTienda}%`;

    // Animar arco SVG de cumplimiento de meta
    const arcCircle = document.getElementById("v_arcCircle");
    if (arcCircle) {
        const circumference = 263.9;
        const pct = Math.min(parseFloat(porcMetaTienda) / 100, 1);
        arcCircle.style.strokeDashoffset = circumference - pct * circumference;
        arcCircle.style.stroke = pct >= 1 ? "#34C759" : pct >= 0.85 ? "#FF9500" : "#FF3B30";
        arcCircle.style.transition = "stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1), stroke 0.4s";
    }

    // Barra de progreso de meta
    const fillProgreso = document.getElementById("v_progresoMetaFill");
    if (fillProgreso) {
        const pctBarra = metaTotalTienda > 0 ? Math.min((acumuladoTotalVentas / metaTotalTienda) * 100, 100) : 0;
        fillProgreso.style.width = `${pctBarra}%`;
        document.getElementById("v_progresoMetaTexto").textContent =
            `$${acumuladoTotalVentasMostrado.toLocaleString()} de $${metaTotalTienda.toLocaleString()}`;
    }

    // Meta diaria: lo que falta por vender repartido entre los días que quedan del mes
    // actual (incluyendo hoy). Se recalcula cada vez que cambian las ventas acumuladas,
    // así que baja automáticamente conforme se va vendiendo, y sube si un día se vende
    // menos de lo necesario.
    const elMetaDiaria = document.getElementById("v_metaDiaria");
    const elMetaDiariaDias = document.getElementById("v_metaDiariaDias");
    const elSub = document.getElementById("v_metaDiariaSub");
    if (elMetaDiaria && elMetaDiariaDias && elSub) {
        const hoy = new Date();
        const diasEnMesActual = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
        const diasRestantes = Math.max(1, diasEnMesActual - hoy.getDate() + 1);
        const faltante = Math.max(0, metaTotalTienda - acumuladoTotalVentas);
        const metaDiaria = faltante / diasRestantes;

        elMetaDiariaDias.textContent = `${diasRestantes} día${diasRestantes === 1 ? "" : "s"} restante${diasRestantes === 1 ? "" : "s"}`;

        if (faltante <= 0) {
            elMetaDiaria.textContent = "$0.00";
            elSub.textContent = "¡Meta del mes alcanzada!";
        } else {
            elMetaDiaria.textContent = `$${metaDiaria.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            elSub.textContent = `Faltan $${faltante.toLocaleString()} para la meta`;
        }
    }

    // KPIs Plan SOS
    document.getElementById("conversionReal").textContent = `${appData.inicio.conversion.toFixed(1)}%`;

    // Accesorización de tienda: por defecto se calcula automáticamente sumando montos de
    // accesorios y dispositivos de todos los asesores. Si el usuario fijó un valor manual,
    // ese valor se muestra en su lugar hasta que decida volver al cálculo automático.
    if (appData.inicio.accesorizacionManual) {
        appData.inicio.accesorizacion = appData.inicio.accesorizacionManualValor || 0;
    } else {
        appData.inicio.accesorizacion = calcularAccesorizacion(montosTienda);
    }
    document.getElementById("accesorizacionReal").textContent = `${appData.inicio.accesorizacion.toFixed(1)}%`;
    document.getElementById("ticketReal").textContent = `$${appData.inicio.ticket.toLocaleString()}`;

    const avisoAccManual = document.getElementById("v_accManualAviso");
    if (avisoAccManual) avisoAccManual.style.display = appData.inicio.accesorizacionManual ? "flex" : "none";

    evaluarSemaforoApple("cardConversion", appData.inicio.conversion, METAS_SOS.conversion);
    evaluarSemaforoApple("cardAccesorizacion", appData.inicio.accesorizacion, METAS_SOS.accesorizacion);
    evaluarSemaforoApple("cardTicket", appData.inicio.ticket, METAS_SOS.ticket);

    // Rellenar barras de progreso SOS
    function setPctBar(fillId, real, meta) {
        const el = document.getElementById(fillId);
        if (!el || !meta) return;
        el.style.width = Math.min((real / meta) * 100, 100) + "%";
    }
    setPctBar("fillConversion", appData.inicio.conversion, METAS_SOS.conversion);
    setPctBar("fillAccesorizacion", appData.inicio.accesorizacion, METAS_SOS.accesorizacion);
    setPctBar("fillTicket", appData.inicio.ticket, METAS_SOS.ticket);

    document.getElementById("v_total_garex").textContent = totalGarex;
    document.getElementById("v_total_seguros").textContent = totalSeguros;
    document.getElementById("v_total_qr").textContent = totalQR;
    document.getElementById("v_total_tradein").textContent = totalTradeIn;
    document.getElementById("v_trafico_acumulado").textContent = appData.inicio.trafico.toLocaleString();
    actualizarLabelTraficoAcumulado();

    // Attach rate por dispositivo: % de unidades vendidas de ese dispositivo que llevaron Garex o Seguro
    function calcularAttach(cantidadProteccion, unidadesDispositivo) {
        return unidadesDispositivo > 0 ? ((cantidadProteccion / unidadesDispositivo) * 100).toFixed(1) : "0.0";
    }
    document.getElementById("v_attach_garex_iphone").textContent = `${calcularAttach(garexPorDispositivo.iPhone, unidadesPorDispositivo.iphone)}%`;
    document.getElementById("v_attach_garex_mac").textContent    = `${calcularAttach(garexPorDispositivo.Mac, unidadesPorDispositivo.mac)}%`;
    document.getElementById("v_attach_garex_ipad").textContent   = `${calcularAttach(garexPorDispositivo.iPad, unidadesPorDispositivo.ipad)}%`;
    document.getElementById("v_attach_garex_watch").textContent  = `${calcularAttach(garexPorDispositivo.Watch, unidadesPorDispositivo.watch)}%`;

    document.getElementById("v_attach_seguros_iphone").textContent = `${calcularAttach(segurosPorDispositivo.iPhone, unidadesPorDispositivo.iphone)}%`;
    document.getElementById("v_attach_seguros_mac").textContent    = `${calcularAttach(segurosPorDispositivo.Mac, unidadesPorDispositivo.mac)}%`;
    document.getElementById("v_attach_seguros_ipad").textContent   = `${calcularAttach(segurosPorDispositivo.iPad, unidadesPorDispositivo.ipad)}%`;
    document.getElementById("v_attach_seguros_watch").textContent  = `${calcularAttach(segurosPorDispositivo.Watch, unidadesPorDispositivo.watch)}%`;

    document.getElementById("txtDashboardComentarios").textContent = appData.inicio.comentarios || "Sin comentarios registrados.";
    document.getElementById("txtDashboardOportunidades").textContent = appData.inicio.oportunidades || "Sin oportunidades de mejora detectadas.";

    // Render Pestaña Garex e Insurama (incentivos reales según tabla del Excel)
    renderTablaGarex("tablaGarexContenedor");
    renderTablaInsurama("tablaInsuramaContenedor");

    // Render Historial Bitácoras
    document.getElementById("contenedorBitacoras").innerHTML = appData.bitacoras.map((b, i) => `
        <div class="bitacora-item">
            <div class="bitacora-item-contenido">
                <p class="bitacora-item-texto">${b.texto}</p>
                <span class="bitacora-item-fecha">${b.fecha}</span>
            </div>
            <button class="r-item-del" onclick="eliminarBitacora(${b.id ?? i})" title="Eliminar">✕</button>
        </div>
    `).join("") || `<p style="color:#86868B; font-style:italic;">No hay comentarios registrados en la bitácora.</p>`;

    renderTopVendedores();
}

// Genera los rankings "Top Ventas", "Top Garex" y "Top Seguros" en la pestaña Ventas
function renderTopVendedores() {
    const asesoresArr = Object.values(appData.asesores);

    function pintarTop(contenedorId, items, formatearValor) {
        const contenedor = document.getElementById(contenedorId);
        if (!contenedor) return;
        const top3 = items.filter(i => i.valor > 0).sort((a, b) => b.valor - a.valor).slice(0, 3);
        if (top3.length === 0) {
            contenedor.innerHTML = `<div class="v-top-empty">Sin datos registrados aún.</div>`;
            return;
        }
        contenedor.innerHTML = top3.map((item, idx) => `
            <div class="v-top-row">
                <span class="v-top-rank">${idx + 1}</span>
                <span class="v-top-name">${item.nombre}</span>
                <span class="v-top-value">${formatearValor(item.valor)}</span>
            </div>
        `).join("");
    }

    // Top Ventas (venta semanal + monto cobrado por Garex, igual que el acumulado de tienda usado en la meta)
    pintarTop("v_top_ventas", asesoresArr.map(a => ({
        nombre: a.nombre,
        valor: a.ventaSemanal + sumarMontoVenta(a.ventasGarex)
    })), v => `$${v.toLocaleString()}`);

    // Top Garex (unidades colocadas)
    pintarTop("v_top_garex", asesoresArr.map(a => ({
        nombre: a.nombre,
        valor: sumarCantidad(a.ventasGarex)
    })), v => `${v} uds.`);

    // Top Seguros (unidades colocadas)
    pintarTop("v_top_seguros", asesoresArr.map(a => ({
        nombre: a.nombre,
        valor: sumarCantidad(a.ventasInsurama)
    })), v => `${v} uds.`);
}

// Suma la cantidad total de unidades en una lista de ventas (Garex o Insurama)
function sumarCantidad(listaVentas) {
    return listaVentas.reduce((acc, v) => acc + v.cantidad, 0);
}
// Suma el incentivo total ganado en una lista de ventas
function sumarIncentivo(listaVentas) {
    return listaVentas.reduce((acc, v) => acc + v.incentivoTotal, 0);
}
// Suma el monto de venta al cliente en una lista de ventas
function sumarMontoVenta(listaVentas) {
    return listaVentas.reduce((acc, v) => acc + (v.montoVenta || 0), 0);
}

// ACCESORIZACIÓN AUTOMÁTICA
// Fórmula: (monto vendido en accesorios) / (monto vendido en dispositivos) × 100
// Dispositivos: Mac, iPad, iPhone, Watch — Accesorios: AirPods, Audio, Acc. Apple, Acc. Terceros
function calcularAccesorizacion(montos) {
    const montoDispositivos = (montos.mac || 0) + (montos.ipad || 0) + (montos.iphone || 0) + (montos.watch || 0);
    const montoAccesorios = (montos.airpods || 0) + (montos.audio || 0) + (montos.acc_apple || 0) + (montos.acc_terceros || 0);
    if (montoDispositivos <= 0) return 0;
    return (montoAccesorios / montoDispositivos) * 100;
}

// TABLA GAREX: desglose por asesor y dispositivo, con incentivo real ganado
function renderTablaGarex(idContenedor) {
    const dispositivos = Object.keys(TABLA_GAREX); // Mac, iPad, iPhone, Watch, AirPods, Audio

    let html = `
        <div class="tabla-scroll"><table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px;">
            <thead>
                <tr class="tabla-header-row">
                    <th style="padding:10px;">Asesor</th>
                    ${dispositivos.map(d => `<th style="padding:10px; text-align:center;">${d}</th>`).join("")}
                    <th style="padding:10px; text-align:center;">Total De Unidades</th>
                    <th style="padding:10px; text-align:right;">Monto Vendido</th>
                    <th style="padding:10px; text-align:right;">Incentivo Ganado</th>
                </tr>
            </thead>
            <tbody>`;

    let granTotalIncentivo = 0;
    let granTotalUnidades = 0;
    let granTotalMonto = 0;

    Object.keys(appData.asesores).forEach(key => {
        const asor = appData.asesores[key];
        const conteoPorDispositivo = {};
        dispositivos.forEach(d => conteoPorDispositivo[d] = 0);

        asor.ventasGarex.forEach(v => { conteoPorDispositivo[v.dispositivo] += v.cantidad; });

        const totalUnid = sumarCantidad(asor.ventasGarex);
        const incentivoAsor = sumarIncentivo(asor.ventasGarex);
        const montoAsor = sumarMontoVenta(asor.ventasGarex);
        granTotalIncentivo += incentivoAsor;
        granTotalUnidades += totalUnid;
        granTotalMonto += montoAsor;

        html += `
            <tr style="border-bottom:1px solid #E5E5EA;">
                <td style="padding:12px; font-weight:500;">${asor.nombre}</td>
                ${dispositivos.map(d => `<td style="padding:12px; text-align:center;">${conteoPorDispositivo[d]}</td>`).join("")}
                <td style="padding:12px; text-align:center; font-weight:600;">${totalUnid}</td>
                <td style="padding:12px; text-align:right;">$${montoAsor.toFixed(2)}</td>
                <td style="padding:12px; text-align:right; color:#34C759; font-weight:600;">$${incentivoAsor.toFixed(2)}</td>
            </tr>`;
    });

    html += `</tbody></table></div>
    <div style="margin-top:15px; text-align:right; font-weight:600; font-size:14px;">
        Total Unidades: ${granTotalUnidades} &nbsp;|&nbsp; Total Vendido: $${granTotalMonto.toFixed(2)} &nbsp;|&nbsp; Total Incentivo Tienda: <span style="color:#34C759;">$${granTotalIncentivo.toFixed(2)}</span>
    </div>`;

    document.getElementById(idContenedor).innerHTML = html;
    renderDetalleVentas("Garex", idContenedor);
}

// TABLA INSURAMA: desglose por asesor y dispositivo, con incentivo real ganado
function renderTablaInsurama(idContenedor) {
    const dispositivos = Object.keys(TABLA_INSURAMA); // Mac, iPad, iPhone, Watch

    let html = `
        <div class="tabla-scroll"><table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px;">
            <thead>
                <tr class="tabla-header-row">
                    <th style="padding:10px;">Asesor</th>
                    ${dispositivos.map(d => `<th style="padding:10px; text-align:center;">${d}</th>`).join("")}
                    <th style="padding:10px; text-align:center;">Total De Unidades</th>
                    <th style="padding:10px; text-align:right;">Monto Vendido</th>
                    <th style="padding:10px; text-align:right;">Incentivo Ganado</th>
                </tr>
            </thead>
            <tbody>`;

    let granTotalIncentivo = 0;
    let granTotalUnidades = 0;
    let granTotalMonto = 0;

    Object.keys(appData.asesores).forEach(key => {
        const asor = appData.asesores[key];
        const conteoPorDispositivo = {};
        dispositivos.forEach(d => conteoPorDispositivo[d] = 0);

        asor.ventasInsurama.forEach(v => { conteoPorDispositivo[v.dispositivo] += v.cantidad; });

        const totalUnid = sumarCantidad(asor.ventasInsurama);
        const incentivoAsor = sumarIncentivo(asor.ventasInsurama);
        const montoAsor = sumarMontoVenta(asor.ventasInsurama);
        granTotalIncentivo += incentivoAsor;
        granTotalUnidades += totalUnid;
        granTotalMonto += montoAsor;

        html += `
            <tr style="border-bottom:1px solid #E5E5EA;">
                <td style="padding:12px; font-weight:500;">${asor.nombre}</td>
                ${dispositivos.map(d => `<td style="padding:12px; text-align:center;">${conteoPorDispositivo[d]}</td>`).join("")}
                <td style="padding:12px; text-align:center; font-weight:600;">${totalUnid}</td>
                <td style="padding:12px; text-align:right;">$${montoAsor.toFixed(2)}</td>
                <td style="padding:12px; text-align:right; color:#34C759; font-weight:600;">$${incentivoAsor.toFixed(2)}</td>
            </tr>`;
    });

    html += `</tbody></table></div>
    <div style="margin-top:15px; text-align:right; font-weight:600; font-size:14px;">
        Total Unidades: ${granTotalUnidades} &nbsp;|&nbsp; Total Vendido: $${granTotalMonto.toFixed(2)} &nbsp;|&nbsp; Total Incentivo Tienda: <span style="color:#34C759;">$${granTotalIncentivo.toFixed(2)}</span>
    </div>`;

    document.getElementById(idContenedor).innerHTML = html;
    renderDetalleVentas("Insurama", idContenedor);
}

// Muestra el detalle línea por línea (cobertura/duración/cantidad/incentivo) de cada venta, agrupado por asesor
// Elimina UNA línea específica de Garex o Insurama (identificada por su id) de un asesor puntual

function eliminarVentaProteccion(tipo, asesorKey, id) {
    const asor = appData.asesores[asesorKey];
    if (!asor) return;
    if (!confirm(`¿Eliminar este registro de ${tipo}? Esta acción no se puede deshacer.`)) return;

    if (tipo === "Garex") {
        asor.ventasGarex = asor.ventasGarex.filter(v => String(v.id) !== String(id));
    } else {
        asor.ventasInsurama = asor.ventasInsurama.filter(v => String(v.id) !== String(id));
    }

    sincronizarYRenderizar();
    actualizarCumplimientoAsesorVisual();
}

function renderDetalleVentas(tipo, idContenedorTabla) {
    const esGarex = tipo === "Garex";
    const detalleId = `detalle_${tipo.toLowerCase()}_${idContenedorTabla}`;

    // Eliminar detalle previo si existe (evita duplicados al re-renderizar)
    const previo = document.getElementById(detalleId);
    if (previo) previo.remove();

    let html = `<div id="${detalleId}"><h3 style="font-size:14px; margin:25px 0 10px;">Detalle de Ventas — ${tipo}</h3>`;
    let hayDatos = false;

    Object.keys(appData.asesores).forEach(key => {
        const asor = appData.asesores[key];
        const lista = esGarex ? asor.ventasGarex : asor.ventasInsurama;
        if (lista.length === 0) return;
        hayDatos = true;

        html += `<p style="font-size:13px; font-weight:600; margin:14px 0 6px; color:#0071E3;">${asor.nombre}</p>
        <div class="tabla-scroll"><table style="width:100%; border-collapse:collapse; text-align:left; font-size:12px; margin-bottom:10px;">
            <thead>
                <tr class="tabla-header-row">
                    <th style="padding:8px;">Dispositivo</th>
                    ${esGarex ? "" : '<th style="padding:8px;">Cobertura</th>'}
                    <th style="padding:8px; text-align:center;">Duración</th>
                    <th style="padding:8px; text-align:center;">Cant.</th>
                    <th style="padding:8px; text-align:right;">Monto Vendido</th>
                    <th style="padding:8px; text-align:right;">Incentivo</th>
                    <th style="padding:8px; text-align:right;">Fecha</th>
                    <th style="padding:8px; text-align:center; width:30px;"></th>
                </tr>
            </thead>
            <tbody>`;

        lista.forEach(v => {
            html += `
                <tr style="border-bottom:1px solid #E5E5EA;">
                    <td style="padding:8px;">${v.dispositivo}</td>
                    ${esGarex ? "" : `<td style="padding:8px;">${v.cobertura}</td>`}
                    <td style="padding:8px; text-align:center;">${v.duracion}</td>
                    <td style="padding:8px; text-align:center;">${v.cantidad}</td>
                    <td style="padding:8px; text-align:right;">$${(v.montoVenta || 0).toFixed(2)}</td>
                    <td style="padding:8px; text-align:right; color:#34C759; font-weight:600;">$${v.incentivoTotal.toFixed(2)}</td>
                    <td style="padding:8px; text-align:right; color:#86868B;">${v.fecha}</td>
                    <td style="padding:8px; text-align:center;">
                        <button type="button" onclick="eliminarVentaProteccion('${tipo}', '${key}', '${v.id}')" title="Eliminar este registro" style="background:none; border:none; color:#FF3B30; font-size:15px; cursor:pointer; padding:0 4px; line-height:1;">✕</button>
                    </td>
                </tr>`;
        });

        html += `</tbody></table></div>`;
    });

    if (!hayDatos) {
        html += `<p style="color:#86868B; font-style:italic; font-size:13px;">No hay ventas de ${tipo} registradas todavía.</p>`;
    }

    html += `</div>`;
    document.getElementById(idContenedorTabla).insertAdjacentHTML("beforeend", html);
}

function evaluarSemaforoApple(idElemento, valorReal, valorMeta) {
    const tarjeta = document.getElementById(idElemento);
    if (!tarjeta) return;
    tarjeta.classList.remove("verde", "amarillo", "rojo");
    let estado;
    if (valorReal >= valorMeta) estado = "verde";
    else if (valorReal >= (valorMeta * 0.85)) estado = "amarillo";
    else estado = "rojo";
    tarjeta.classList.add(estado);

    // Actualizar punto de color (liquid glass dot)
    const dotId = "dot" + idElemento.replace("card", "");
    const dot = document.getElementById(dotId);
    if (dot) {
        dot.classList.remove("verde", "amarillo", "rojo");
        dot.classList.add(estado);
    }
}

// ═══════════════════════════════════════════
// GESTIÓN DE ASESORES (agregar / renombrar)
// ═══════════════════════════════════════════

function renderSelectAsesor(mantenerSeleccion = true) {
    const sel = document.getElementById("selectAsesor");
    if (!sel) return;
    const valorActual = sel.value;
    // Desconectar temporalmente el listener para evitar disparo accidental
    const clonado = sel.cloneNode(false);
    sel.parentNode.replaceChild(clonado, sel);
    Object.keys(appData.asesores).forEach(key => {
        const opt = document.createElement("option");
        opt.value = key;
        opt.textContent = appData.asesores[key].nombre;
        clonado.appendChild(opt);
    });
    if (mantenerSeleccion && appData.asesores[valorActual]) clonado.value = valorActual;
    // Re-adjuntar el listener de cambio de asesor
    clonado.addEventListener("change", onSelectAsesorChange);
}

function renderListaAsesoresConfig() {
    const contenedor = document.getElementById("listaAsesoresConfig");
    if (!contenedor) return;
    const keys = Object.keys(appData.asesores);
    if (keys.length === 0) { contenedor.innerHTML = "<p style='color:#86868B; font-size:13px;'>No hay asesores registrados.</p>"; return; }

    const metaTotalTienda = calcularMetaTotalTienda();

    contenedor.innerHTML = keys.map((key, i) => {
        const asor = appData.asesores[key];
        const porcentaje = asor.porcentajeMeta || 0;
        const metaCalculada = calcularMetaAsesor(asor);
        return `
        <div class="asesor-config-block">
            <div class="asesor-config-row">
                <input type="text" id="cfgNombreAsesor_${key}" value="${asor.nombre}"
                    class="asesor-config-input" placeholder="Nombre">
                <input type="number" id="cfgPorcentajeAsesor_${key}" value="${porcentaje}" min="0" max="100" step="0.1"
                    class="asesor-config-input asesor-config-input-porcentaje" placeholder="%"
                    oninput="previsualizarMetaAsesor('${key}')">
                <button onclick="renombrarAsesor('${key}')" class="asesor-config-save">
                    Guardar
                </button>
                ${keys.length > 1 ? `<button onclick="eliminarAsesor('${key}')" class="asesor-config-del">
                    ✕
                </button>` : `<div></div>`}
            </div>
            <p class="asesor-meta-calculada" id="metaCalculada_${key}">
                Meta calculada: <strong>$${Math.round(metaCalculada).toLocaleString()}</strong>
                (${porcentaje}% de la meta de tienda de $${Math.round(metaTotalTienda).toLocaleString()})
            </p>
        </div>`;
    }).join("");
}

// Previsualiza en vivo la meta ($) calculada mientras el usuario escribe el % (sin guardar todavía)
function previsualizarMetaAsesor(key) {
    const inputPorcentaje = document.getElementById(`cfgPorcentajeAsesor_${key}`);
    const texto = document.getElementById(`metaCalculada_${key}`);
    if (!inputPorcentaje || !texto) return;

    const porcentaje = parseFloat(inputPorcentaje.value) || 0;
    const metaTotalTienda = calcularMetaTotalTienda();
    const metaCalculada = (porcentaje / 100) * metaTotalTienda;

    const sumaOtros = Object.keys(appData.asesores)
        .filter(k => k !== key)
        .reduce((acc, k) => acc + (appData.asesores[k].porcentajeMeta || 0), 0);
    const sumaTotal = sumaOtros + porcentaje;
    const excedeAlerta = sumaTotal > 100
        ? `<br><span style="color:#FF3B30;">⚠ La suma entre asesores sería ${sumaTotal.toFixed(1)}% (supera el 100%). Máximo disponible para este asesor: ${(100 - sumaOtros).toFixed(1)}%.</span>`
        : "";

    texto.innerHTML = `Meta calculada: <strong>$${Math.round(metaCalculada).toLocaleString()}</strong>
        (${porcentaje}% de la meta de tienda de $${Math.round(metaTotalTienda).toLocaleString()})${excedeAlerta}`;
}

function renombrarAsesor(key) {
    const input = document.getElementById(`cfgNombreAsesor_${key}`);
    const inputPorcentaje = document.getElementById(`cfgPorcentajeAsesor_${key}`);
    const nuevoNombre = input ? input.value.trim() : "";
    if (!nuevoNombre) { mostrarAlerta("El nombre no puede estar vacío.", "warning"); return; }

    const porcentaje = inputPorcentaje ? parseFloat(inputPorcentaje.value) : NaN;
    if (inputPorcentaje && (isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100)) {
        mostrarAlerta("El % de meta debe ser un número entre 0 y 100.", "warning");
        return;
    }

    // Verificar que la suma de % de TODOS los asesores (incluyendo este con su nuevo valor)
    // no supere el 100%. Ej: si un asesor tiene 80%, otro no puede tener 21%.
    if (inputPorcentaje) {
        const sumaOtros = Object.keys(appData.asesores)
            .filter(k => k !== key)
            .reduce((acc, k) => acc + (appData.asesores[k].porcentajeMeta || 0), 0);
        const sumaTotal = sumaOtros + porcentaje;
        if (sumaTotal > 100) {
            mostrarAlerta(`La suma de los % de meta entre todos los asesores no puede superar el 100%. Actualmente los demás asesores suman ${sumaOtros}%, por lo que este asesor puede tener como máximo ${(100 - sumaOtros).toFixed(1)}%.`, "warning");
            return;
        }
    }

    const nombreAnterior = appData.asesores[key].nombre;
    const nombreCambio = nombreAnterior !== nuevoNombre;
    appData.asesores[key].nombre = nuevoNombre;
    appData.asesores[key].porcentajeMeta = inputPorcentaje ? porcentaje : appData.asesores[key].porcentajeMeta;

    if (nombreCambio) {
        // Actualizar también las entradas del calendario que tengan el nombre anterior
        ventasCalendario = ventasCalendario.map(v => ({
            ...v,
            label: v.label.replace(`💰 ${nombreAnterior}:`, `💰 ${nuevoNombre}:`)
        }));
        guardarVentasCalendario();

        // Crear clínica de experiencia automática para el asesor con su nombre actualizado
        clinicasData.push({
            id: Date.now(),
            nombre: `Clínica de experiencia — ${nuevoNombre}`,
            fecha: "",
            realizada: false,
            fechaRealizada: null
        });
        guardarClinicas();
        renderClinicas();
    }

    sincronizarYRenderizar();
    renderListaAsesoresConfig();
    renderCalendario();
    actualizarCumplimientoAsesorVisual();
    mostrarAlerta(
        nombreCambio
            ? `Asesor renombrado a "${nuevoNombre}" correctamente. Se creó una clínica de experiencia para él en la pestaña Recordatorios.`
            : `Datos de "${nuevoNombre}" actualizados correctamente.`,
        "success"
    );
}

function agregarNuevoAsesor() {
    const input = document.getElementById("inputNuevoAsesor");
    const nombre = input ? input.value.trim() : "";
    if (!nombre) { mostrarAlerta("Ingresa un nombre para el nuevo asesor.", "warning"); return; }

    // Generar key única
    const keys = Object.keys(appData.asesores);
    const nextNum = keys.length > 0
        ? Math.max(...keys.map(k => parseInt(k.replace("asesor", "")) || 0)) + 1
        : 0;
    const newKey = `asesor${nextNum}`;

    appData.asesores[newKey] = nuevoAsesor(nombre);
    if (input) input.value = "";

    // Crear clínica de experiencia automática para el nuevo asesor
    clinicasData.push({
        id: Date.now(),
        nombre: `Clínica de experiencia — ${nombre}`,
        fecha: "",
        realizada: false,
        fechaRealizada: null
    });
    guardarClinicas();
    renderClinicas();
    renderCalendario();

    sincronizarYRenderizar();
    renderListaAsesoresConfig();
    mostrarAlerta(`Asesor "${nombre}" agregado correctamente. Se creó una clínica de experiencia para él en la pestaña Recordatorios.`, "success");
}

function eliminarAsesor(key) {
    const nombre = appData.asesores[key]?.nombre || key;
    if (!confirm(`¿Eliminar al asesor "${nombre}"? Se borrarán todos sus datos acumulados.`)) return;
    delete appData.asesores[key];
    sincronizarYRenderizar();
    renderListaAsesoresConfig();
    // Si el select apuntaba al eliminado, redirigir al primero
    const sel = document.getElementById("selectAsesor");
    const primerKey = Object.keys(appData.asesores)[0];
    if (sel && primerKey) {
        sel.value = primerKey;
        actualizarCumplimientoAsesorVisual();
    }
}

// Cambia entre las pestañas "Metas por Categoría" / "Acumulados" dentro de la
// tarjeta de resumen de un asesor específico (pestaña Ventas).
function cambiarTabAsesor(key, tab, btnEl) {
    const card = btnEl.closest(".ra-card");
    if (!card) return;
    card.querySelectorAll(".ra-tab-btn").forEach(b => b.classList.remove("active"));
    card.querySelectorAll(".ra-tab-panel").forEach(p => p.classList.remove("active"));
    btnEl.classList.add("active");
    const panel = document.getElementById(`raTab-${key}-${tab}`);
    if (panel) panel.classList.add("active");
}

function sincronizarYRenderizar() {
    localStorage.setItem("controlVentasData", JSON.stringify(appData));
    if (typeof programarGuardadoNube === "function") programarGuardadoNube();
    renderTodo();
}

// FORMATEAR MODULO A 0 TOTAL
function reiniciarTodoCero() {
    if (confirm("⚠️ ¿Estás completamente seguro de restaurar el ecosistema comercial? Se eliminarán todos los acumulados y clínicas. Las bitácoras y los recordatorios mensuales NO se verán afectados.")) {
        localStorage.removeItem("controlVentasData");
        localStorage.removeItem("clinicasData");
        localStorage.removeItem("ventasCalendario");
        // Las metas SOS se conservan intencionalmente; solo se borran datos de ventas.
        // Las bitácoras (appData.bitacoras) se conservan tal cual estaban.
        appData = {
            inicio: { conversion: 0, accesorizacion: 0, accesorizacionManual: false, accesorizacionManualValor: null, ticket: 0, trafico: 0, comentarios: "", oportunidades: "" },
            bitacoras: appData.bitacoras || [],
            asesores: {
                asesor0: nuevoAsesor("Asesor 1"),
                asesor1: nuevoAsesor("Asesor 2"),
                asesor2: nuevoAsesor("Asesor 3")
            }
        };
        // Los recordatorios mensuales (recordatoriosData) NO se tocan.
        // Siempre se recrea una clínica fija "Interna" para Fábrica, sin importar cuántas veces se reinicie
        clinicasData = [];
        asegurarClinicaInterna();
        ventasCalendario = [];
        document.querySelectorAll("input, textarea").forEach(el => el.value = "");
        lineasGarexPendientes = [];
        lineasInsuramaPendientes = [];
        renderListaPendiente("garex");
        renderListaPendiente("insurama");
        renderRecordatorios();
        renderClinicas();
        renderCalendario();
        sincronizarYRenderizar();
        // Guardado inmediato (sin esperar el debounce normal) para que el borrado
        // quede reflejado en la nube incluso si la página se recarga enseguida.
        if (typeof guardarNubeInmediato === "function") guardarNubeInmediato();
        actualizarCumplimientoAsesorVisual();
        mostrarAlerta("Ciclo comercial formateado a cero.", "success");
    }
}

// Borra únicamente los registros de Garex e Insurama (todos los asesores).
// No afecta ventas, montos, unidades, metas, recordatorios, clínicas ni bitácoras.
function borrarGarexSeguros() {
    if (confirm("⚠️ Esto borrará TODOS los registros de Garex y Seguros (Insurama) de todos los asesores. Las ventas, montos y unidades NO se verán afectados. ¿Deseas continuar?")) {
        Object.keys(appData.asesores).forEach(key => {
            appData.asesores[key].ventasGarex = [];
            appData.asesores[key].ventasInsurama = [];
        });

        // Limpiar también líneas pendientes que no se hayan guardado todavía
        lineasGarexPendientes = [];
        lineasInsuramaPendientes = [];
        renderListaPendiente("garex");
        renderListaPendiente("insurama");

        sincronizarYRenderizar();
        if (typeof guardarNubeInmediato === "function") guardarNubeInmediato();
        actualizarCumplimientoAsesorVisual();
        mostrarAlerta("Registros de Garex y Seguros borrados correctamente.", "success");
    }
}

// Borra únicamente los datos de ventas (monto semanal, montos por categoría,
// unidades, QR, Trade-In y el historial del calendario de ventas) de todos los asesores.
// No afecta Garex, Insurama, metas, recordatorios, clínicas ni bitácoras.
function borrarVentas() {
    if (confirm("⚠️ Esto borrará TODAS las ventas acumuladas (monto, montos por categoría, unidades, QR y Trade-In) de todos los asesores, además del historial de ventas en el calendario. Garex y Seguros NO se verán afectados. ¿Deseas continuar?")) {
        Object.keys(appData.asesores).forEach(key => {
            const a = appData.asesores[key];
            a.ventaSemanal = 0;
            a.qr = 0;
            a.tradeIn = 0;
            a.montos = { mac:0, ipad:0, iphone:0, watch:0, airpods:0, audio:0, acc_apple:0, acc_terceros:0 };
            a.unidades = { mac:0, ipad:0, iphone:0, watch:0, airpods:0, audio:0 };
        });

        // Quitar del calendario solo las entradas de tipo "venta" (no toca recordatorios/clínicas)
        ventasCalendario = ventasCalendario.filter(v => v.tipo !== "venta");
        guardarVentasCalendario();
        renderCalendario();

        sincronizarYRenderizar();
        if (typeof guardarNubeInmediato === "function") guardarNubeInmediato();
        actualizarCumplimientoAsesorVisual();
        mostrarAlerta("Ventas borradas correctamente.", "success");
    }
}
// ═══════════════════════════════════════════
// RECORDATORIOS MENSUALES
// ═══════════════════════════════════════════

let recordatoriosData = JSON.parse(localStorage.getItem("recordatoriosData")) || [];
let clinicasData = JSON.parse(localStorage.getItem("clinicasData")) || [];
let ventasCalendario = JSON.parse(localStorage.getItem("ventasCalendario")) || [];

function guardarRecordatorios() {
    localStorage.setItem("recordatoriosData", JSON.stringify(recordatoriosData));
    if (typeof programarGuardadoNube === "function") programarGuardadoNube();
}
function guardarClinicas() {
    localStorage.setItem("clinicasData", JSON.stringify(clinicasData));
    if (typeof programarGuardadoNube === "function") programarGuardadoNube();
}
function guardarVentasCalendario() {
    localStorage.setItem("ventasCalendario", JSON.stringify(ventasCalendario));
    if (typeof programarGuardadoNube === "function") programarGuardadoNube();
}

function agregarRecordatorio() {
    const fecha  = document.getElementById("inputRecordatorioFecha").value;
    const texto  = document.getElementById("inputRecordatorioTexto").value.trim();
    const tipo   = document.getElementById("selectRecordatorioTipo").value;

    if (!fecha || !texto) {
        mostrarAlerta("Por favor ingresa la fecha y la descripción del recordatorio.", "warning");
        return;
    }

    recordatoriosData.push({ id: Date.now(), fecha, texto, tipo });
    recordatoriosData.sort((a, b) => a.fecha.localeCompare(b.fecha));
    guardarRecordatorios();
    renderRecordatorios();
    renderCalendario();

    document.getElementById("inputRecordatorioFecha").value = "";
    document.getElementById("inputRecordatorioTexto").value = "";
    document.getElementById("selectRecordatorioTipo").value = "mantenimiento";
}

function eliminarRecordatorio(id) {
    if (!confirm("¿Eliminar este recordatorio?")) return;
    recordatoriosData = recordatoriosData.filter(r => r.id !== id);
    guardarRecordatorios();
    renderRecordatorios();
    renderCalendario();
}

function renderRecordatorios() {
    const cont = document.getElementById("listaRecordatorios");
    if (!cont) return;

    if (recordatoriosData.length === 0) {
        cont.innerHTML = '<p style="color:rgba(0,0,0,0.35); font-size:13px; text-align:center; padding:10px 0;">No hay recordatorios registrados.</p>';
        return;
    }

    const badgeLabels = { mantenimiento: "Mantenimiento", reunion: "Reunión", tarea: "Tarea", otro: "Otro" };

    cont.innerHTML = recordatoriosData.map(r => {
        const [y, m, d] = r.fecha.split("-");
        const fechaDisplay = `${d}/${m}/${y}`;
        return `
        <div class="r-item">
            <span class="r-item-fecha">${fechaDisplay}</span>
            <span class="r-item-badge r-badge-${r.tipo}">${badgeLabels[r.tipo] || r.tipo}</span>
            <span class="r-item-texto">${r.texto}</span>
            <button class="r-item-del" onclick="eliminarRecordatorio(${r.id})" title="Eliminar">✕</button>
        </div>`;
    }).join("");
}

// ═══════════════════════════════════════════
// CLÍNICAS DE EXPERIENCIA
// ═══════════════════════════════════════════

function agregarClinica() {
    const nombre = document.getElementById("inputClinicaNombre").value.trim();
    const fecha  = document.getElementById("inputClinicaFecha").value;

    if (!nombre) {
        mostrarAlerta("Por favor ingresa el nombre de la clínica.", "warning");
        return;
    }

    clinicasData.push({ id: Date.now(), nombre, fecha, realizada: false, fechaRealizada: null });
    guardarClinicas();
    renderClinicas();
    renderCalendario();

    document.getElementById("inputClinicaNombre").value = "";
    document.getElementById("inputClinicaFecha").value = "";
}

async function toggleClinica(id) {
    const clinica = clinicasData.find(c => c.id === id);
    if (!clinica) return;

    if (!clinica.realizada) {
        // Se está marcando como completada: preguntar en qué fecha se realizó
        const hoy = new Date().toISOString().slice(0, 10);
        const fechaElegida = await pedirFecha(`¿Cuándo se realizó la clínica "${clinica.nombre}"?`, hoy);
        if (!fechaElegida) return; // cancelado por el usuario
        clinica.realizada = true;
        clinica.fechaRealizada = fechaElegida;
    } else {
        // Se está desmarcando: vuelve a pendiente
        clinica.realizada = false;
        clinica.fechaRealizada = null;
    }

    guardarClinicas();
    renderClinicas();
    renderCalendario();
}

function eliminarClinica(id) {
    if (!confirm("¿Eliminar esta clínica?")) return;
    clinicasData = clinicasData.filter(c => c.id !== id);
    guardarClinicas();
    renderClinicas();
    renderCalendario();
}

function renderClinicas() {
    const cont = document.getElementById("listaClinicas");
    if (!cont) return;

    if (clinicasData.length === 0) {
        cont.innerHTML = '<p style="color:rgba(0,0,0,0.35); font-size:13px; text-align:center; padding:10px 0;">No hay clínicas registradas.</p>';
        return;
    }

    cont.innerHTML = clinicasData.map(c => {
        const realizada = c.realizada;
        const fechaDisplay = c.fecha ? (() => { const [y,m,d] = c.fecha.split("-"); return `${d}/${m}/${y}`; })() : "Sin fecha";
        const fechaRealizadaDisplay = c.fechaRealizada ? (() => { const [y,m,d] = c.fechaRealizada.split("-"); return `${d}/${m}/${y}`; })() : "";
        return `
        <div class="c-item">
            <div class="c-item-check ${realizada ? 'realizada' : ''}" onclick="toggleClinica(${c.id})" title="${realizada ? 'Marcar como pendiente' : 'Marcar como realizada'}">
                ${realizada ? '✓' : ''}
            </div>
            <span class="c-item-nombre ${realizada ? 'realizada' : ''}">${c.nombre}</span>
            <span class="c-item-fecha">${realizada ? 'Realizada: ' + fechaRealizadaDisplay : 'Programada: ' + fechaDisplay}</span>
            <span class="c-item-estado ${realizada ? 'c-estado-realizada' : 'c-estado-pendiente'}">${realizada ? '✅ Realizada' : '⏳ Pendiente'}</span>
            <button class="c-item-del" onclick="eliminarClinica(${c.id})" title="Eliminar">✕</button>
        </div>`;
    }).join("");
}

// Garantiza que siempre exista la clínica fija "Fábrica — Interna", sin importar reinicios
function asegurarClinicaInterna() {
    const existe = clinicasData.some(c => c.nombre === "Fábrica — Interna");
    if (!existe) {
        clinicasData.unshift({
            id: Date.now(),
            nombre: "Fábrica — Interna",
            fecha: "",
            realizada: false,
            fechaRealizada: null
        });
        guardarClinicas();
    }
}

// Inicializar las listas al cargar la página
document.addEventListener("DOMContentLoaded", function () {
    asegurarClinicaInterna();
    renderRecordatorios();
    renderClinicas();
    renderCalendario();
});

// ═══════════════════════════════════════════
// CALENDARIO
// ═══════════════════════════════════════════

let calAño  = new Date().getFullYear();
let calMes  = new Date().getMonth(); // 0-11
let calDiaSeleccionado = null;

function calNavegar(delta) {
    calMes += delta;
    if (calMes > 11) { calMes = 0; calAño++; }
    if (calMes < 0)  { calMes = 11; calAño--; }
    renderCalendario();
}

function calIrHoy() {
    const hoy = new Date();
    calAño = hoy.getFullYear();
    calMes = hoy.getMonth();
    calDiaSeleccionado = null;
    renderCalendario();
    document.getElementById("calDetalle").style.display = "none";
}

// Recopila todos los eventos de todas las fuentes y los indexa por "YYYY-MM-DD"
function obtenerEventosPorFecha() {
    const mapa = {}; // { "2026-06-15": [ {tipo, label, color}, ... ] }

    function agregar(fecha, evento) {
        if (!fecha) return;
        if (!mapa[fecha]) mapa[fecha] = [];
        mapa[fecha].push(evento);
    }

    // 1. Recordatorios
    const coloresRec = { mantenimiento:"#0071E3", reunion:"#0071E3", tarea:"#0071E3", otro:"#0071E3" };
    recordatoriosData.forEach(r => {
        agregar(r.fecha, { tipo:"recordatorio", label: r.texto, color:"#0071E3", pillClass:"cal-pill-recordatorio" });
    });

    // 2. Clínicas
    clinicasData.forEach(c => {
        if (c.realizada && c.fechaRealizada) {
            agregar(c.fechaRealizada, { tipo:"clinica-r", label: c.nombre, color:"#34C759", pillClass:"cal-pill-clinica-r" });
        } else if (c.fecha) {
            agregar(c.fecha, { tipo:"clinica-p", label: c.nombre, color:"#FF9500", pillClass:"cal-pill-clinica-p" });
        }
    });

    // 3. Bitácoras (usan fechaISO si está disponible)
    appData.bitacoras.forEach(b => {
        if (b.fechaISO) {
            agregar(b.fechaISO, { tipo:"bitacora", label: b.texto.substring(0, 50) + (b.texto.length > 50 ? "…" : ""), color:"#86868B", pillClass:"cal-pill-bitacora" });
        }
    });

    // 4. Ventas ingresadas desde Asesores
    ventasCalendario.forEach(v => {
        agregar(v.fecha, { tipo:"venta", id: v.id, label: v.label, color:"#34C759", pillClass:"cal-pill-venta", asesorKey: v.asesorKey, monto: v.monto, grupoId: v.grupoId, visibleEnCalendario: v.visibleEnCalendario !== false });
    });

    return mapa;
}

function renderCalendario() {
    const grid   = document.getElementById("calGrid");
    const titulo = document.getElementById("calTitulo");
    if (!grid || !titulo) return;

    const hoy = new Date();
    const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,"0")}-${String(hoy.getDate()).padStart(2,"0")}`;

    // Título
    const nombreMes = new Date(calAño, calMes, 1).toLocaleString("es-ES", { month:"long", year:"numeric" });
    titulo.textContent = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);

    const eventos = obtenerEventosPorFecha();

    // Primer día de la semana (0=Dom) y total de días del mes
    const primerDia = new Date(calAño, calMes, 1).getDay();
    const diasEnMes = new Date(calAño, calMes + 1, 0).getDate();
    const diasMesAnterior = new Date(calAño, calMes, 0).getDate();

    let celdas = "";

    // Días del mes anterior (relleno)
    for (let i = primerDia - 1; i >= 0; i--) {
        const d = diasMesAnterior - i;
        const mesAnterior = calMes === 0 ? 12 : calMes;
        const añoAnterior = calMes === 0 ? calAño - 1 : calAño;
        const fecha = `${añoAnterior}-${String(mesAnterior).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
        celdas += renderCelda(d, fecha, true, hoyStr, eventos, false);
    }

    // Días del mes actual
    for (let d = 1; d <= diasEnMes; d++) {
        const fecha = `${calAño}-${String(calMes+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
        celdas += renderCelda(d, fecha, false, hoyStr, eventos, true);
    }

    // Relleno final (días del mes siguiente)
    const totalCeldas = primerDia + diasEnMes;
    const restantes = totalCeldas % 7 === 0 ? 0 : 7 - (totalCeldas % 7);
    for (let d = 1; d <= restantes; d++) {
        const mesSiguiente = calMes === 11 ? 1 : calMes + 2;
        const añoSiguiente = calMes === 11 ? calAño + 1 : calAño;
        const fecha = `${añoSiguiente}-${String(mesSiguiente).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
        celdas += renderCelda(d, fecha, true, hoyStr, eventos, false);
    }

    grid.innerHTML = celdas;
}

function renderCelda(dia, fecha, otroMes, hoyStr, eventos, esDelMes) {
    const esHoy = fecha === hoyStr;
    const esSeleccionada = fecha === calDiaSeleccionado;
    // En la celda del día solo se muestran los eventos visibles (las ventas marcadas
    // para no reflejarse en el calendario quedan ocultas aquí, pero siguen disponibles
    // en el detalle del día al hacer clic, para poder eliminarlas si es necesario).
    const evs = (eventos[fecha] || []).filter(e => e.tipo !== "venta" || e.visibleEnCalendario !== false);

    let clases = "cal-celda";
    if (otroMes) clases += " otro-mes";
    if (esHoy)   clases += " hoy";
    if (esSeleccionada) clases += " seleccionada";

    const numHTML = `<div class="cal-dia-num">${dia}</div>`;

    // Máximo 3 pills visibles
    const pillsHTML = evs.slice(0, 3).map(e =>
        `<div class="cal-evento-pill ${e.pillClass}">${e.label}</div>`
    ).join("");

    const masHTML = evs.length > 3
        ? `<div style="font-size:10px;color:rgba(0,0,0,0.35);padding-left:4px;">+${evs.length - 3} más</div>`
        : "";

    return `<div class="${clases}" onclick="calClickDia('${fecha}')">${numHTML}<div class="cal-eventos">${pillsHTML}${masHTML}</div></div>`;
}

function calClickDia(fecha) {
    calDiaSeleccionado = fecha;
    renderCalendario();

    const eventos = obtenerEventosPorFecha();
    const evsDia  = eventos[fecha] || [];
    const detalle = document.getElementById("calDetalle");
    const contenido = document.getElementById("calDetalleContenido");
    const tituloEl  = document.getElementById("calDetalleFecha");
    if (!detalle || !contenido || !tituloEl) return;

    // Formatear fecha bonita
    const [y, m, d] = fecha.split("-");
    const nombreDia = new Date(parseInt(y), parseInt(m)-1, parseInt(d))
        .toLocaleDateString("es-ES", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
    tituloEl.textContent = nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1);

    if (evsDia.length === 0) {
        contenido.innerHTML = `<p style="color:rgba(0,0,0,0.35); font-size:13px; padding:8px 0;">No hay eventos este día.</p>`;
    } else {
        contenido.innerHTML = evsDia.map(e => `
            <div class="cal-detalle-item" style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
                <span style="display:flex; align-items:center; gap:8px;">
                    <span class="cal-detalle-dot" style="background:${e.color};"></span>
                    <span>${e.label}${e.tipo === "venta" && e.visibleEnCalendario === false ? ' <span style="color:#86868B; font-size:11px;">(oculta del calendario)</span>' : ""}</span>
                </span>
                ${e.tipo === "venta" ? `<button type="button" onclick="eliminarVentaCalendario(${e.id}, '${fecha}')" title="Eliminar esta venta" style="background:none; border:none; color:#FF3B30; font-size:15px; cursor:pointer; padding:0 4px; line-height:1; flex-shrink:0;">✕</button>` : ""}
            </div>
        `).join("");
    }

    detalle.style.display = "block";
    detalle.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// Elimina una venta puntual del calendario, y resta el monto correspondiente
// del total acumulado del asesor (asor.ventaSemanal) para mantener todo consistente.
// Si la venta pertenece a un rango de días repartido en varios días, pregunta
// si se desea eliminar solo ese día o el rango completo.
function eliminarVentaCalendario(id, fecha) {
    const entrada = ventasCalendario.find(v => v.id === id);
    if (!entrada) return;

    const asor = entrada.asesorKey ? appData.asesores[entrada.asesorKey] : null;

    if (entrada.grupoId) {
        const diasDelGrupo = ventasCalendario.filter(v => v.grupoId === entrada.grupoId);
        const borrarTodo = confirm(
            `Esta venta forma parte de un rango repartido en ${diasDelGrupo.length} día(s) (total $${(entrada.montoTotalGrupo || 0).toLocaleString()}).\n\n` +
            `Presiona "Aceptar" para eliminar TODO el rango, o "Cancelar" para elegir entre eliminar solo este día.`
        );

        if (borrarTodo) {
            if (asor) asor.ventaSemanal = Math.max(0, asor.ventaSemanal - (entrada.montoTotalGrupo || 0));
            ventasCalendario = ventasCalendario.filter(v => v.grupoId !== entrada.grupoId);
        } else {
            const borrarSoloEsteDia = confirm(`¿Eliminar únicamente el registro de este día (${fecha})? Se restará solo su parte proporcional ($${entrada.monto.toFixed(0)}).`);
            if (!borrarSoloEsteDia) return;
            if (asor) asor.ventaSemanal = Math.max(0, asor.ventaSemanal - entrada.monto);
            ventasCalendario = ventasCalendario.filter(v => v.id !== id);
        }
    } else {
        if (!confirm(`¿Eliminar esta venta del ${fecha}? Se restará $${(entrada.monto || 0).toLocaleString()} del total acumulado del asesor. Esta acción no se puede deshacer.`)) return;
        if (asor) asor.ventaSemanal = Math.max(0, asor.ventaSemanal - (entrada.monto || 0));
        ventasCalendario = ventasCalendario.filter(v => v.id !== id);
    }

    guardarVentasCalendario();
    sincronizarYRenderizar();
    renderCalendario();
    calClickDia(fecha);
}
