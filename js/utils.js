// =====================================
// CONSTANTES
// =====================================

const MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const CATEGORIAS = [
    "Comida", "Transporte", "Hogar", "Salud",
    "Servicios", "Educación", "Ocio", "Otros"
];

const COLORES_CATEGORIAS = {
    Comida: "#FF7043",
    Transporte: "#42A5F5",
    Hogar: "#8D6E63",
    Salud: "#EF5350",
    Servicios: "#7E57C2",
    Educación: "#66BB6A",
    Ocio: "#EC407A",
    Otros: "#78909C"
};

// =====================================
// FORMATO
// =====================================

function formatoMoneda(valor) {
    return new Intl.NumberFormat("es-PY", {
        style: "currency",
        currency: "PYG",
        minimumFractionDigits: 0
    }).format(valor);
}

function formatoFecha(fecha) {
    if (!fecha) return "";
    const [anio, mes, dia] = fecha.split("-");
    return `${dia}/${mes}/${anio}`;
}

function escapeHtml(texto) {
    const div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
}

function claseCategoria(categoria) {
    const normalizada = {
        "Educación": "educacion"
    };
    return (normalizada[categoria] || categoria).toLowerCase();
}

function obtenerMesActual() {
    return MESES[new Date().getMonth()];
}

function obtenerAnioActual() {
    return new Date().getFullYear();
}

function obtenerDiaActual() {
    return new Date().getDate();
}

// =====================================
// TOASTS
// =====================================

function mostrarToast(mensaje, tipo = "success") {
    const contenedor = document.getElementById("toastContainer");
    if (!contenedor) return;

    const colores = {
        success: "bg-success",
        danger: "bg-danger",
        warning: "bg-warning text-dark",
        info: "bg-info"
    };

    const iconos = {
        success: "fa-circle-check",
        danger: "fa-circle-xmark",
        warning: "fa-triangle-exclamation",
        info: "fa-circle-info"
    };

    const toast = document.createElement("div");
    toast.className = `toast align-items-center text-white border-0 ${colores[tipo] || colores.success}`;
    toast.setAttribute("role", "alert");
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fa-solid ${iconos[tipo] || iconos.success} me-2"></i>
                ${escapeHtml(mensaje)}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

    contenedor.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast, { delay: 3500 });
    bsToast.show();
    toast.addEventListener("hidden.bs.toast", () => toast.remove());
}

// =====================================
// CONFIRMAR ACCIÓN
// =====================================

let confirmCallback = null;

function confirmarAccion(mensaje, callback) {
    document.getElementById("confirmarMensaje").textContent = mensaje;
    confirmCallback = callback;
    new bootstrap.Modal(document.getElementById("modalConfirmar")).show();
}

function initConfirmar() {
    document.getElementById("btnConfirmarSi").addEventListener("click", () => {
        bootstrap.Modal.getInstance(document.getElementById("modalConfirmar")).hide();
        if (confirmCallback) confirmCallback();
        confirmCallback = null;
    });
}

// =====================================
// TEMA OSCURO
// =====================================

function cambiarTema() {
    document.body.classList.toggle("dark");
    const esOscuro = document.body.classList.contains("dark");
    localStorage.setItem("temaOscuro", esOscuro ? "1" : "0");
    actualizarIconoTema(esOscuro);
    if (typeof actualizarGraficos === "function") {
        setTimeout(actualizarGraficos, 100);
    }
}

function cargarTema() {
    const esOscuro = localStorage.getItem("temaOscuro") === "1";
    if (esOscuro) document.body.classList.add("dark");
    actualizarIconoTema(esOscuro);
}

function actualizarIconoTema(esOscuro) {
    const btn = document.getElementById("modoOscuro");
    if (!btn) return;
    btn.innerHTML = esOscuro
        ? '<i class="fa-solid fa-sun"></i>'
        : '<i class="fa-solid fa-moon"></i>';
}

// =====================================
// ESTADOS VACÍOS
// =====================================

function filaVacia(colspan, icono, mensaje) {
    return `
        <tr class="fila-vacia">
            <td colspan="${colspan}" class="text-center py-5">
                <i class="fa-solid ${icono} fa-2x text-muted mb-2 d-block"></i>
                <span class="text-muted">${escapeHtml(mensaje)}</span>
            </td>
        </tr>
    `;
}
