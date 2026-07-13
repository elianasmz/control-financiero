// =====================================
// STORAGE
// =====================================

const STORAGE_KEY = "controlFinanciero";
const KEY_GASTOS_FIJOS = "controlFinanciero_gastosFijos";
const KEY_INGRESOS_FIJOS = "controlFinanciero_ingresosFijos";
const KEY_PRESUPUESTOS = "controlFinanciero_presupuestos";
const KEY_CONFIGURACION = "controlFinanciero_config";

function obtenerClave() {
    const mes = document.getElementById("mes");
    const anio = document.getElementById("anio");
    return `${STORAGE_KEY}_${mes.value}_${anio.value}`;
}

function guardarStorage() {
    const notas = document.getElementById("notas");
    const datos = {
        ingresos,
        gastos,
        notas: notas.value,
        fijosAplicados: typeof fijosAplicados !== "undefined" ? fijosAplicados : false
    };
    localStorage.setItem(obtenerClave(), JSON.stringify(datos));
}

function cargarStorage() {
    const notas = document.getElementById("notas");
    const datos = JSON.parse(localStorage.getItem(obtenerClave()));

    if (datos) {
        ingresos = datos.ingresos || [];
        gastos = datos.gastos || [];
        notas.value = datos.notas || "";
        fijosAplicados = datos.fijosAplicados || false;
    } else {
        ingresos = [];
        gastos = [];
        notas.value = "";
        fijosAplicados = false;
    }
}

function cargarGastosFijos() {
    const datos = JSON.parse(localStorage.getItem(KEY_GASTOS_FIJOS));
    gastosFijos = datos || [];
}

function guardarGastosFijos() {
    localStorage.setItem(KEY_GASTOS_FIJOS, JSON.stringify(gastosFijos));
}

function cargarIngresosFijos() {
    const datos = JSON.parse(localStorage.getItem(KEY_INGRESOS_FIJOS));
    ingresosFijos = datos || [];
}

function guardarIngresosFijos() {
    localStorage.setItem(KEY_INGRESOS_FIJOS, JSON.stringify(ingresosFijos));
}

function cargarPresupuestos() {
    const datos = JSON.parse(localStorage.getItem(KEY_PRESUPUESTOS));
    presupuestos = datos || {};
}

function guardarPresupuestos() {
    localStorage.setItem(KEY_PRESUPUESTOS, JSON.stringify(presupuestos));
}

let configuracion = {
    autoAplicarFijos: true,
    metaAhorro: 0,
    guiaVista: false
};

function cargarConfiguracion() {
    const datos = JSON.parse(localStorage.getItem(KEY_CONFIGURACION));
    if (datos) configuracion = { ...configuracion, ...datos };
}

function guardarConfiguracion() {
    localStorage.setItem(KEY_CONFIGURACION, JSON.stringify(configuracion));
}

function exportarTodosLosDatos() {
    const respaldo = {
        version: 1,
        fecha: new Date().toISOString(),
        gastosFijos,
        ingresosFijos,
        presupuestos,
        configuracion,
        periodos: {}
    };

    for (let i = 0; i < localStorage.length; i++) {
        const clave = localStorage.key(i);
        if (clave.startsWith(STORAGE_KEY + "_") &&
            !clave.includes("gastosFijos") &&
            !clave.includes("ingresosFijos") &&
            !clave.includes("presupuestos")) {
            respaldo.periodos[clave] = JSON.parse(localStorage.getItem(clave));
        }
    }

    return respaldo;
}

function importarTodosLosDatos(datos) {
    if (datos.gastosFijos) {
        gastosFijos = datos.gastosFijos;
        guardarGastosFijos();
    }
    if (datos.ingresosFijos) {
        ingresosFijos = datos.ingresosFijos;
        guardarIngresosFijos();
    }
    if (datos.presupuestos) {
        presupuestos = datos.presupuestos;
        guardarPresupuestos();
    }
    if (datos.configuracion) {
        configuracion = { ...configuracion, ...datos.configuracion };
        guardarConfiguracion();
    }

    if (datos.periodos) {
        Object.entries(datos.periodos).forEach(([clave, valor]) => {
            localStorage.setItem(clave, JSON.stringify(valor));
        });
    } else if (datos.ingresos || datos.gastos) {
        ingresos = datos.ingresos || [];
        gastos = datos.gastos || [];
        document.getElementById("notas").value = datos.notas || "";
        guardarStorage();
    }

    cargarStorage();
}
