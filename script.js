// METAS FIJAS DE REFERENCIA PARA COMPARACIÓN EN ARREGLO SOS
const METAS_SOS = { conversion: 23.0, accesorizacion: 29.4, ticket: 280 };

// ===================================================================
// TABLAS DE INCENTIVOS (Fuente: Control_de_seguros_e_incentivos.xlsx)
// ===================================================================

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

// ESTRUCTURA DE CONTROL CENTRALIZADA
function nuevoAsesor(nombre) {
    return {
        nombre: nombre,
        meta: 0,
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
    inicio: { conversion: 0, accesorizacion: 0, ticket: 0, trafico: 0, comentarios: "", oportunidades: "" },
    bitacoras: [],
    asesores: {
        asesor0: nuevoAsesor("Kendall V."),
        asesor1: nuevoAsesor("Fabián Q."),
        asesor2: nuevoAsesor("Asesor Eventual")
    }
};

// MIGRACIÓN: si hay datos guardados de una versión anterior (sin ventasGarex/ventasInsurama), los completa
Object.keys(appData.asesores).forEach(key => {
    const a = appData.asesores[key];
    if (!a.ventasGarex) a.ventasGarex = [];
    if (!a.ventasInsurama) a.ventasInsurama = [];
    // Migrar registros antiguos que no tengan montoVenta (precio al cliente)
    a.ventasGarex.forEach(v => { if (v.montoVenta === undefined) v.montoVenta = 0; });
    a.ventasInsurama.forEach(v => { if (v.montoVenta === undefined) v.montoVenta = 0; });
});

// LÍNEAS PENDIENTES DE AGREGAR (estado temporal en memoria, no se guarda hasta presionar "Actualizar Asesor")
let lineasGarexPendientes = [];
let lineasInsuramaPendientes = [];

document.addEventListener("DOMContentLoaded", function () {
    configurarNavegacionPestañas();
    configurarSelectsProteccion();
    actualizarRelojYFecha();
    setInterval(actualizarRelojYFecha, 1000);
    
    // Cargar datos en inputs de Inicio si ya existen
    document.getElementById("inputConversion").value = appData.inicio.conversion || "";
    document.getElementById("inputAccesorizacion").value = appData.inicio.accesorizacion || "";
    document.getElementById("inputTicket").value = appData.inicio.ticket || "";
    document.getElementById("inputTrafico").value = appData.inicio.trafico || "";
    document.getElementById("inputComentarios").value = appData.inicio.comentarios || "";
    document.getElementById("inputOportunidades").value = appData.inicio.oportunidades || "";

    // Mostrar el cumplimiento del asesor seleccionado por defecto al cargar
    document.getElementById("inputMetaAsesor").value = appData.asesores[document.getElementById("selectAsesor").value].meta || 0;
    actualizarCumplimientoAsesorVisual();
    actualizarUnidadesAcumuladasVisual();
    renderListaPendiente("garex");
    renderListaPendiente("insurama");

    renderTodo();
});

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

    // Actualizar el recuadro de cumplimiento al cambiar de asesor seleccionado
    const selectAsesor = document.getElementById("selectAsesor");
    if (selectAsesor) {
        selectAsesor.addEventListener("change", function () {
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
            document.getElementById("inputMetaAsesor").value = appData.asesores[key].meta || 0;
            actualizarCumplimientoAsesorVisual();
            actualizarUnidadesAcumuladasVisual();
        });
    }

    // Previsualizar cumplimiento mientras se edita la meta mensual (antes de guardar)
    const inputMeta = document.getElementById("inputMetaAsesor");
    if (inputMeta) {
        inputMeta.addEventListener("input", function () {
            const key = document.getElementById("selectAsesor").value;
            const metaPrevia = parseFloat(this.value) || 0;
            const ventaActual = appData.asesores[key].ventaSemanal;
            const contenedor = document.getElementById("cumplimientoAsesorBox");
            const cumplimiento = metaPrevia > 0 ? ((ventaActual / metaPrevia) * 100).toFixed(1) : 0;
            contenedor.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <span style="font-size:13px; font-weight:600; color:#1D1D1F;">Cumplimiento de meta mensual</span>
                    <span style="font-size:18px; font-weight:700; color:#0071E3;">${cumplimiento}%</span>
                </div>
                <div class="barra-progreso"><div class="progreso-relleno" style="width:${Math.min(cumplimiento, 100)}%;"></div></div>
                <p style="font-size:12px; margin-top:8px; color:#6E6E73;">
                    Venta acumulada: $${ventaActual.toLocaleString()} | Meta mensual: $${metaPrevia.toLocaleString()}
                </p>`;
        });
    }
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
        selectGarexDispositivo.addEventListener("change", poblarDuracionesGarex);
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
        selectInsuramaDispositivo.addEventListener("change", poblarCoberturasInsurama);
        selectInsuramaCobertura.addEventListener("change", poblarDuracionesInsurama);
        poblarCoberturasInsurama();
    }
}

function actualizarRelojYFecha() {
    const ahora = new Date();
    const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById("fecha").textContent = ahora.toLocaleDateString('es-ES', opcionesFecha);
    document.getElementById("hora").textContent = ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// GUARDAR INICIO
function guardarDatosReunion() {
    appData.inicio.conversion = parseFloat(document.getElementById("inputConversion").value) || 0;
    appData.inicio.accesorizacion = parseFloat(document.getElementById("inputAccesorizacion").value) || 0;
    appData.inicio.ticket = parseFloat(document.getElementById("inputTicket").value) || 0;
    appData.inicio.trafico = parseInt(document.getElementById("inputTrafico").value) || 0;
    appData.inicio.comentarios = document.getElementById("inputComentarios").value;
    appData.inicio.oportunidades = document.getElementById("inputOportunidades").value;

    sincronizarYRenderizar();
    alert("Datos de pestaña Inicio guardados correctamente.");
}

// AGREGAR UNA LÍNEA DE GAREX A LA LISTA PENDIENTE (no se guarda en appData todavía)
function agregarLineaGarex() {
    const dispositivo = document.getElementById("selectGarexDispositivo").value;
    const duracion = document.getElementById("selectGarexDuracion").value;
    const cantidad = parseInt(document.getElementById("inputGarexCantidad").value) || 0;
    const precioUnitario = parseFloat(document.getElementById("inputGarexPrecio").value) || 0;

    if (cantidad <= 0) {
        alert("Ingresa una cantidad mayor a 0 para agregar el Garex a la lista.");
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
    document.getElementById("inputGarexPrecio").value = 0;
    renderListaPendiente("garex");
}

// AGREGAR UNA LÍNEA DE INSURAMA A LA LISTA PENDIENTE (no se guarda en appData todavía)
function agregarLineaInsurama() {
    const dispositivo = document.getElementById("selectInsuramaDispositivo").value;
    const cobertura = document.getElementById("selectInsuramaCobertura").value;
    const duracion = document.getElementById("selectInsuramaDuracion").value;
    const cantidad = parseInt(document.getElementById("inputInsuramaCantidad").value) || 0;
    const precioUnitario = parseFloat(document.getElementById("inputInsuramaPrecio").value) || 0;

    if (cantidad <= 0) {
        alert("Ingresa una cantidad mayor a 0 para agregar el Insurama a la lista.");
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
    document.getElementById("inputInsuramaPrecio").value = 0;
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
            <div style="display:flex; justify-content:space-between; align-items:center; background:#FFFFFF; border-radius:8px; padding:8px 10px; margin-bottom:6px; font-size:12px;">
                <span>
                    <strong>${v.dispositivo}</strong>${v.cobertura ? " · " + v.cobertura : ""} · ${v.duracion} · x${v.cantidad}
                    <br><span style="color:#86868B;">Incentivo: $${v.incentivoTotal.toFixed(2)} | Venta: $${v.montoVenta.toFixed(2)}</span>
                </span>
                <button type="button" onclick="quitarLineaPendiente('${tipo}', ${i})" style="background:none; border:none; color:#FF3B30; font-size:16px; cursor:pointer; padding:0 4px;">✕</button>
            </div>`;
    });
    contenedor.innerHTML = html;
}

// GUARDAR ASESORES
function guardarDatosAsesor() {
    const key = document.getElementById("selectAsesor").value;

    appData.asesores[key].meta = parseFloat(document.getElementById("inputMetaAsesor").value) || 0;
    appData.asesores[key].ventaSemanal += parseFloat(document.getElementById("inputVentaSemanal").value) || 0;
    appData.asesores[key].qr += parseInt(document.getElementById("inputQR").value) || 0;
    appData.asesores[key].tradeIn += parseInt(document.getElementById("inputTradeIn").value) || 0;

    // Volcar todas las líneas pendientes de Garex con su fecha de registro
    const fechaHoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    lineasGarexPendientes.forEach(linea => {
        appData.asesores[key].ventasGarex.push({ ...linea, fecha: fechaHoy });
    });

    // Volcar todas las líneas pendientes de Insurama con su fecha de registro
    lineasInsuramaPendientes.forEach(linea => {
        appData.asesores[key].ventasInsurama.push({ ...linea, fecha: fechaHoy });
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

    // Resetear valores transaccionales del formulario
    document.getElementById("inputVentaSemanal").value = 0;
    document.getElementById("inputQR").value = 0;
    document.getElementById("inputTradeIn").value = 0;
    document.querySelectorAll(".grid-2-col input").forEach(i => i.value = 0);

    sincronizarYRenderizar();
    actualizarCumplimientoAsesorVisual();
    actualizarUnidadesAcumuladasVisual();
    alert("Expediente comercial cargado y acumulado con éxito.");
}

// MOSTRAR UNIDADES ACUMULADAS POR CATEGORÍA DEL ASESOR SELECCIONADO (EN VIVO)
function actualizarUnidadesAcumuladasVisual() {
    const key = document.getElementById("selectAsesor").value;
    const asor = appData.asesores[key];
    const contenedor = document.getElementById("unidadesAcumuladasBox");
    if (!asor || !contenedor) return;

    const u = asor.unidades;
    const totalUnidades = u.mac + u.ipad + u.iphone + u.watch + u.airpods + u.audio;

    contenedor.innerHTML = `
        <div style="font-size:13px; font-weight:600; color:#1D1D1F; margin-bottom:8px;">Unidades acumuladas (${asor.nombre})</div>
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px; font-size:12px; color:#515154;">
            <div>Mac: <strong>${u.mac}</strong></div>
            <div>iPad: <strong>${u.ipad}</strong></div>
            <div>iPhone: <strong>${u.iphone}</strong></div>
            <div>Watch: <strong>${u.watch}</strong></div>
            <div>AirPods: <strong>${u.airpods}</strong></div>
            <div>Audio: <strong>${u.audio}</strong></div>
        </div>
        <div style="margin-top:8px; font-size:12px; font-weight:600; color:#0071E3;">Total: ${totalUnidades} unidades</div>`;
}

// MOSTRAR % DE CUMPLIMIENTO DE META MENSUAL DEL ASESOR SELECCIONADO (EN VIVO)
function actualizarCumplimientoAsesorVisual() {
    const key = document.getElementById("selectAsesor").value;
    const asor = appData.asesores[key];
    const contenedor = document.getElementById("cumplimientoAsesorBox");
    if (!asor || !contenedor) return;

    const cumplimiento = asor.meta > 0 ? ((asor.ventaSemanal / asor.meta) * 100).toFixed(1) : 0;

    contenedor.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="font-size:13px; font-weight:600; color:#1D1D1F;">Cumplimiento de meta mensual</span>
            <span style="font-size:18px; font-weight:700; color:#0071E3;">${cumplimiento}%</span>
        </div>
        <div class="barra-progreso"><div class="progreso-relleno" style="width:${Math.min(cumplimiento, 100)}%;"></div></div>
        <p style="font-size:12px; margin-top:8px; color:#6E6E73;">
            Venta acumulada: $${asor.ventaSemanal.toLocaleString()} | Meta mensual: $${asor.meta.toLocaleString()}
        </p>`;
}

// AGREGAR NOTA BITÁCORA
function agregarNotaBitacora() {
    const nota = document.getElementById("inputNotaBitacora").value;
    if (!nota.trim()) return alert("Por favor, escribe una anotación.");
    
    const nuevaNota = {
        texto: nota,
        fecha: new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
    };
    appData.bitacoras.unshift(nuevaNota);
    document.getElementById("inputNotaBitacora").value = "";
    sincronizarYRenderizar();
}

// RENDERS MÚLTIPLES
function renderTodo() {
    let acumuladoTotalVentas = 0;
    let metaTotalTienda = 0;
    let totalGarex = 0;
    let totalSeguros = 0;
    let totalQR = 0;
    let totalTradeIn = 0;

    // Procesar Datos Globales de Asesores
    let htmlResumenAsesores = "";
    Object.keys(appData.asesores).forEach(key => {
        const asor = appData.asesores[key];
        acumuladoTotalVentas += asor.ventaSemanal;
        metaTotalTienda += asor.meta;
        totalGarex += sumarCantidad(asor.ventasGarex);
        totalSeguros += sumarCantidad(asor.ventasInsurama);
        totalQR += asor.qr;
        totalTradeIn += asor.tradeIn;

        const cumplimiento = asor.meta > 0 ? ((asor.ventaSemanal / asor.meta) * 100).toFixed(1) : 0;

        htmlResumenAsesores += `
            <div style="padding:15px; background:#F5F5F7; border-radius:12px; margin-bottom:15px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <strong>${asor.nombre}</strong>
                    <span style="color:#0071E3; font-weight:600;">${cumplimiento}% de cumplimiento</span>
                </div>
                <div class="barra-progreso"><div class="progreso-relleno" style="width:${Math.min(cumplimiento,100)}%;"></div></div>
                <p style="font-size:12px; margin-top:8px; color:#6E6E73;">
                    Venta: $${asor.ventaSemanal.toLocaleString()} | Meta: $${asor.meta.toLocaleString()}<br>
                    QR Colocados: ${asor.qr} | Trade-In: ${asor.tradeIn}
                </p>
            </div>`;
    });
    document.getElementById("resumenAsesoresVisual").innerHTML = htmlResumenAsesores;

    // Render Pestaña Ventas
    document.getElementById("ventasAcumuladas").textContent = `$${acumuladoTotalVentas.toLocaleString()}`;
    const porcMetaTienda = metaTotalTienda > 0 ? ((acumuladoTotalVentas / metaTotalTienda) * 100).toFixed(1) : 0;
    document.getElementById("cumplimientoMetaTotal").textContent = `${porcMetaTienda}%`;

    // KPIs Plan SOS
    document.getElementById("conversionReal").textContent = `${appData.inicio.conversion.toFixed(1)}%`;
    document.getElementById("accesorizacionReal").textContent = `${appData.inicio.accesorizacion.toFixed(1)}%`;
    document.getElementById("ticketReal").textContent = `$${appData.inicio.ticket.toLocaleString()}`;

    evaluarSemaforoApple("cardConversion", appData.inicio.conversion, METAS_SOS.conversion);
    evaluarSemaforoApple("cardAccesorizacion", appData.inicio.accesorizacion, METAS_SOS.accesorizacion);
    evaluarSemaforoApple("cardTicket", appData.inicio.ticket, METAS_SOS.ticket);

    document.getElementById("v_total_garex").textContent = `${totalGarex} U.`;
    document.getElementById("v_total_seguros").textContent = `${totalSeguros} U.`;
    document.getElementById("v_total_qr").textContent = `${totalQR} U.`;
    document.getElementById("v_total_tradein").textContent = `${totalTradeIn} U.`;

    document.getElementById("txtDashboardComentarios").textContent = appData.inicio.comentarios || "Sin comentarios registrados en la semana.";
    document.getElementById("txtDashboardOportunidades").textContent = appData.inicio.oportunidades || "Sin oportunidades de mejora detectadas.";

    // Render Pestaña Garex e Insurama (incentivos reales según tabla del Excel)
    renderTablaGarex("tablaGarexContenedor");
    renderTablaInsurama("tablaInsuramaContenedor");

    // Render Historial Bitácoras
    document.getElementById("contenedorBitacoras").innerHTML = appData.bitacoras.map(b => `
        <div style="padding:12px; background:#F5F5F7; border-radius:8px; margin-bottom:10px; border-left:3px solid #0071E3;">
            <p style="font-size:13px; line-height:1.4; color:#1D1D1F;">${b.texto}</p>
            <span style="font-size:11px; color:#86868B; display:block; margin-top:4px;">${b.fecha}</span>
        </div>
    `).join("") || `<p style="color:#86868B; font-style:italic;">No hay comentarios registrados en la bitácora.</p>`;
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

// TABLA GAREX: desglose por asesor y dispositivo, con incentivo real ganado
function renderTablaGarex(idContenedor) {
    const dispositivos = Object.keys(TABLA_GAREX); // Mac, iPad, iPhone, Watch, AirPods, Audio

    let html = `
        <table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px;">
            <thead>
                <tr style="background:#F5F5F7; color:#86868B;">
                    <th style="padding:10px;">Asesor</th>
                    ${dispositivos.map(d => `<th style="padding:10px; text-align:center;">${d}</th>`).join("")}
                    <th style="padding:10px; text-align:center;">Total U.</th>
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

    html += `</tbody></table>
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
        <table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px;">
            <thead>
                <tr style="background:#F5F5F7; color:#86868B;">
                    <th style="padding:10px;">Asesor</th>
                    ${dispositivos.map(d => `<th style="padding:10px; text-align:center;">${d}</th>`).join("")}
                    <th style="padding:10px; text-align:center;">Total U.</th>
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

    html += `</tbody></table>
    <div style="margin-top:15px; text-align:right; font-weight:600; font-size:14px;">
        Total Unidades: ${granTotalUnidades} &nbsp;|&nbsp; Total Vendido: $${granTotalMonto.toFixed(2)} &nbsp;|&nbsp; Total Incentivo Tienda: <span style="color:#34C759;">$${granTotalIncentivo.toFixed(2)}</span>
    </div>`;

    document.getElementById(idContenedor).innerHTML = html;
    renderDetalleVentas("Insurama", idContenedor);
}

// Muestra el detalle línea por línea (cobertura/duración/cantidad/incentivo) de cada venta, agrupado por asesor
function renderDetalleVentas(tipo, idContenedorTabla) {
    const esGarex = tipo === "Garex";
    let html = `<h3 style="font-size:14px; margin:25px 0 10px;">Detalle de Ventas — ${tipo}</h3>`;
    let hayDatos = false;

    Object.keys(appData.asesores).forEach(key => {
        const asor = appData.asesores[key];
        const lista = esGarex ? asor.ventasGarex : asor.ventasInsurama;
        if (lista.length === 0) return;
        hayDatos = true;

        html += `<p style="font-size:13px; font-weight:600; margin:14px 0 6px;">${asor.nombre}</p>
        <table style="width:100%; border-collapse:collapse; text-align:left; font-size:12px; margin-bottom:10px;">
            <thead>
                <tr style="background:#F5F5F7; color:#86868B;">
                    <th style="padding:8px;">Dispositivo</th>
                    ${esGarex ? "" : '<th style="padding:8px;">Cobertura</th>'}
                    <th style="padding:8px; text-align:center;">Duración</th>
                    <th style="padding:8px; text-align:center;">Cant.</th>
                    <th style="padding:8px; text-align:right;">Monto Vendido</th>
                    <th style="padding:8px; text-align:right;">Incentivo</th>
                    <th style="padding:8px; text-align:right;">Fecha</th>
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
                </tr>`;
        });

        html += `</tbody></table>`;
    });

    if (!hayDatos) {
        html += `<p style="color:#86868B; font-style:italic; font-size:13px;">No hay ventas de ${tipo} registradas todavía.</p>`;
    }

    document.getElementById(idContenedorTabla).insertAdjacentHTML("beforeend", html);
}

function evaluarSemaforoApple(idElemento, valorReal, valorMeta) {
    const tarjeta = document.getElementById(idElemento);
    if (!tarjeta) return;
    tarjeta.classList.remove("verde", "amarillo", "rojo");
    if (valorReal >= valorMeta) tarjeta.classList.add("verde");
    else if (valorReal >= (valorMeta * 0.85)) tarjeta.classList.add("amarillo");
    else tarjeta.classList.add("rojo");
}

function sincronizarYRenderizar() {
    localStorage.setItem("controlVentasData", JSON.stringify(appData));
    renderTodo();
}

// FORMATEAR MODULO A 0 TOTAL
function reiniciarTodoCero() {
    if (confirm("⚠️ ¿Estás completamente seguro de restaurar el ecosistema comercial? Se eliminarán todos los acumulados.")) {
        localStorage.removeItem("controlVentasData");
        appData = {
            inicio: { conversion: 0, accesorizacion: 0, ticket: 0, trafico: 0, comentarios: "", oportunidades: "" },
            bitacoras: [],
            asesores: {
                asesor0: nuevoAsesor("Kendall V."),
                asesor1: nuevoAsesor("Fabián Q."),
                asesor2: nuevoAsesor("Asesor Eventual")
            }
        };
        document.querySelectorAll("input, textarea").forEach(el => el.value = "");
        lineasGarexPendientes = [];
        lineasInsuramaPendientes = [];
        renderListaPendiente("garex");
        renderListaPendiente("insurama");
        sincronizarYRenderizar();
        actualizarCumplimientoAsesorVisual();
        actualizarUnidadesAcumuladasVisual();
        alert("Ciclo comercial formateado a cero.");
    }
}