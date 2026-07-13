// =====================================
// VARIABLES GLOBALES
// =====================================

let ingresos = [];
let gastos = [];
let gastosFijos = [];
let ingresosFijos = [];
let presupuestos = {};
let fijosAplicados = false;
let movimientoEditando = null;

// =====================================
// ELEMENTOS DOM
// =====================================

const tablaIngresos = document.getElementById("tablaIngresos");
const tablaGastos = document.getElementById("tablaGastos");
const tablaGastosFijos = document.getElementById("tablaGastosFijos");
const tablaIngresosFijos = document.getElementById("tablaIngresosFijos");

const totalIngresosEl = document.getElementById("totalIngresos");
const totalGastosEl = document.getElementById("totalGastos");
const balanceEl = document.getElementById("balance");
const cantidadMovimientosEl = document.getElementById("cantidadMovimientos");

const notas = document.getElementById("notas");
const mes = document.getElementById("mes");
const anio = document.getElementById("anio");
const buscar = document.getElementById("buscar");

// =====================================
// INICIO
// =====================================

document.addEventListener("DOMContentLoaded", () => {
    cargarSelects();
    cargarAnios();
    cargarTema();
    initConfirmar();

    cargarGastosFijos();
    cargarIngresosFijos();
    cargarPresupuestos();
    cargarConfiguracion();
    cargarStorage();

    renderizarTodo();
    eventos();
    verificarFijosPendientes();
    mostrarGuiaInicial();
    intentarAutoAplicarFijos();
});

// =====================================
// SELECTS DINÁMICOS
// =====================================

function cargarSelects() {
    mes.innerHTML = MESES.map(m =>
        `<option value="${m}">${m}</option>`
    ).join("");
    mes.value = obtenerMesActual();

    const selectsCategoria = [
        "categoriaGasto", "categoriaGastoFijo", "editarCategoria"
    ];
    selectsCategoria.forEach(id => {
        const sel = document.getElementById(id);
        if (sel) {
            sel.innerHTML = CATEGORIAS.map(c =>
                `<option value="${c}">${c}</option>`
            ).join("");
        }
    });
}

function cargarAnios() {
    const actual = obtenerAnioActual();
    anio.innerHTML = "";
    for (let i = actual - 5; i <= actual + 5; i++) {
        const option = document.createElement("option");
        option.value = i;
        option.textContent = i;
        anio.appendChild(option);
    }
    anio.value = actual;
}

// =====================================
// EVENTOS
// =====================================

function eventos() {
    document.getElementById("guardarIngreso").addEventListener("click", agregarIngreso);
    document.getElementById("guardarGasto").addEventListener("click", agregarGasto);
    document.getElementById("guardarGastoFijo").addEventListener("click", guardarGastoFijo);
    document.getElementById("guardarIngresoFijo").addEventListener("click", guardarIngresoFijo);
    document.getElementById("actualizarMovimiento").addEventListener("click", actualizarMovimiento);
    document.getElementById("guardarPresupuestos").addEventListener("click", guardarPresupuestosModal);
    document.getElementById("guardarConfiguracion").addEventListener("click", guardarConfiguracionModal);
    document.getElementById("btnAplicarFijos").addEventListener("click", aplicarFijosAlMes);
    document.getElementById("btnCerrarGuia").addEventListener("click", cerrarGuiaInicial);

    buscar.addEventListener("input", renderizarTodo);
    notas.addEventListener("input", guardarStorage);
    mes.addEventListener("change", cambiarPeriodo);
    anio.addEventListener("change", cambiarPeriodo);
    document.getElementById("modoOscuro").addEventListener("click", cambiarTema);

    document.getElementById("modalPresupuesto").addEventListener("show.bs.modal", renderFormPresupuestos);
    document.getElementById("modalGastoFijo").addEventListener("hidden.bs.modal", limpiarFormGastoFijo);
    document.getElementById("modalIngresoFijo").addEventListener("hidden.bs.modal", limpiarFormIngresoFijo);
    document.getElementById("modalConfiguracion").addEventListener("show.bs.modal", () => {
        document.getElementById("autoAplicarFijos").checked = configuracion.autoAplicarFijos !== false;
        document.getElementById("metaAhorro").value = configuracion.metaAhorro || "";
    });

    establecerFechaHoy("fechaIngreso");
    establecerFechaHoy("fechaGasto");
}

function establecerFechaHoy(id) {
    const input = document.getElementById(id);
    if (input) {
        input.value = new Date().toISOString().split("T")[0];
    }
}

function cerrarModal(id) {
    const modal = bootstrap.Modal.getInstance(document.getElementById(id));
    if (modal) modal.hide();
}

// =====================================
// INGRESOS
// =====================================

function agregarIngreso() {
    const fecha = document.getElementById("fechaIngreso").value;
    const concepto = document.getElementById("conceptoIngreso").value.trim();
    const monto = parseFloat(document.getElementById("montoIngreso").value);

    if (!fecha || !concepto || isNaN(monto) || monto <= 0) {
        mostrarToast("Complete todos los campos correctamente.", "warning");
        return;
    }

    ingresos.push({ id: Date.now(), fecha, concepto, monto, fijo: false });
    guardarStorage();
    renderizarTodo();
    cerrarModal("modalIngreso");
    limpiarIngreso();
    mostrarToast("Ingreso registrado correctamente.");
}

function limpiarIngreso() {
    document.getElementById("conceptoIngreso").value = "";
    document.getElementById("montoIngreso").value = "";
    establecerFechaHoy("fechaIngreso");
}

// =====================================
// GASTOS
// =====================================

function agregarGasto() {
    const fecha = document.getElementById("fechaGasto").value;
    const concepto = document.getElementById("conceptoGasto").value.trim();
    const categoria = document.getElementById("categoriaGasto").value;
    const monto = parseFloat(document.getElementById("montoGasto").value);

    if (!fecha || !concepto || isNaN(monto) || monto <= 0) {
        mostrarToast("Complete todos los campos correctamente.", "warning");
        return;
    }

    gastos.push({ id: Date.now(), fecha, concepto, categoria, monto, fijo: false });
    guardarStorage();
    renderizarTodo();
    cerrarModal("modalGasto");
    limpiarGasto();
    mostrarToast("Gasto registrado correctamente.");
}

function limpiarGasto() {
    document.getElementById("conceptoGasto").value = "";
    document.getElementById("montoGasto").value = "";
    establecerFechaHoy("fechaGasto");
}

// =====================================
// GASTOS FIJOS
// =====================================

function guardarGastoFijo() {
    const id = document.getElementById("gastoFijoId").value;
    const concepto = document.getElementById("conceptoGastoFijo").value.trim();
    const categoria = document.getElementById("categoriaGastoFijo").value;
    const dia = parseInt(document.getElementById("diaGastoFijo").value);
    const monto = parseFloat(document.getElementById("montoGastoFijo").value);

    if (!concepto || isNaN(monto) || monto <= 0 || isNaN(dia) || dia < 1 || dia > 31) {
        mostrarToast("Complete todos los campos correctamente.", "warning");
        return;
    }

    if (id) {
        const item = gastosFijos.find(g => g.id === parseInt(id));
        if (item) {
            item.concepto = concepto;
            item.categoria = categoria;
            item.dia = dia;
            item.monto = monto;
            sincronizarFijoAplicado("gasto", item);
        }
        mostrarToast("Gasto fijo actualizado.");
    } else {
        gastosFijos.push({
            id: Date.now(),
            concepto,
            categoria,
            dia,
            monto,
            activo: true
        });
        mostrarToast("Gasto fijo registrado.");
    }

    guardarGastosFijos();
    renderizarTodo();
    cerrarModal("modalGastoFijo");
    verificarFijosPendientes();
}

function editarGastoFijo(id) {
    const item = gastosFijos.find(g => g.id === id);
    if (!item) return;

    document.getElementById("gastoFijoId").value = item.id;
    document.getElementById("conceptoGastoFijo").value = item.concepto;
    document.getElementById("categoriaGastoFijo").value = item.categoria;
    document.getElementById("diaGastoFijo").value = item.dia;
    document.getElementById("montoGastoFijo").value = item.monto;

    new bootstrap.Modal(document.getElementById("modalGastoFijo")).show();
}

function eliminarGastoFijo(id) {
    confirmarAccion("¿Eliminar este gasto fijo? También se quitará del mes actual si estaba aplicado.", () => {
        gastosFijos = gastosFijos.filter(g => g.id !== id);
        gastos = gastos.filter(g => g.fijoId !== id);
        fijosAplicados = false;
        guardarGastosFijos();
        guardarStorage();
        renderizarTodo();
        verificarFijosPendientes();
        mostrarToast("Gasto fijo eliminado.", "info");
    });
}

function limpiarFormGastoFijo() {
    document.getElementById("gastoFijoId").value = "";
    document.getElementById("conceptoGastoFijo").value = "";
    document.getElementById("categoriaGastoFijo").value = CATEGORIAS[0];
    document.getElementById("diaGastoFijo").value = "1";
    document.getElementById("montoGastoFijo").value = "";
}

function sincronizarFijoAplicado(tipo, template) {
    const lista = tipo === "gasto" ? gastos : ingresos;
    const aplicado = lista.find(x => x.fijoId === template.id);
    if (!aplicado) return;

    aplicado.concepto = template.concepto;
    aplicado.monto = template.monto;
    aplicado.fecha = obtenerFechaDelMes(template.dia);
    if (tipo === "gasto") aplicado.categoria = template.categoria;
    guardarStorage();
}

function toggleActivoFijo(tipo, id) {
    const lista = tipo === "gasto" ? gastosFijos : ingresosFijos;
    const item = lista.find(x => x.id === id);
    if (!item) return;

    item.activo = item.activo === false;
    if (tipo === "gasto") guardarGastosFijos();
    else guardarIngresosFijos();

    renderizarTodo();
    verificarFijosPendientes();
    mostrarToast(item.activo !== false ? "Reactivado correctamente." : "Desactivado temporalmente.", "info");
}

function aplicarFijoIndividual(tipo, id) {
    const template = tipo === "gasto"
        ? gastosFijos.find(g => g.id === id)
        : ingresosFijos.find(i => i.id === id);

    if (!template || template.activo === false) return;

    const lista = tipo === "gasto" ? gastos : ingresos;
    if (lista.some(x => x.fijoId === id)) {
        mostrarToast("Este movimiento ya está aplicado al mes.", "info");
        return;
    }

    const entrada = {
        id: Date.now() + Math.random(),
        fecha: obtenerFechaDelMes(template.dia),
        concepto: template.concepto,
        monto: template.monto,
        fijo: true,
        fijoId: template.id
    };

    if (tipo === "gasto") {
        entrada.categoria = template.categoria;
        gastos.push(entrada);
    } else {
        ingresos.push(entrada);
    }

    guardarStorage();
    renderizarTodo();
    verificarFijosPendientes();
    mostrarToast(`${template.concepto} aplicado al mes.`);
}

function renderGastosFijos() {
    const texto = buscar.value.toLowerCase();
    const filtrados = gastosFijos.filter(g =>
        g.concepto.toLowerCase().includes(texto) ||
        g.categoria.toLowerCase().includes(texto) ||
        `dia ${g.dia}`.includes(texto)
    );

    const activos = filtrados.filter(g => g.activo !== false);
    document.getElementById("badgeGastosFijos").textContent = activos.length;

    const totalActivos = activos.reduce((t, g) => t + g.monto, 0);
    document.getElementById("totalGastosFijosTabla").textContent =
        activos.length > 0 ? `Total: ${formatoMoneda(totalActivos)}` : "";

    if (filtrados.length === 0) {
        tablaGastosFijos.innerHTML = filaVacia(6, "fa-repeat", gastosFijos.length === 0
            ? "No hay gastos fijos configurados"
            : "Sin resultados en la búsqueda");
        return;
    }

    tablaGastosFijos.innerHTML = filtrados.map(g => {
        const aplicado = estaFijoAplicado("gasto", g.id);
        const inactivo = g.activo === false;
        return `
        <tr class="${inactivo ? "opacity-50" : ""}">
            <td>${escapeHtml(g.concepto)}</td>
            <td><span class="badge ${claseCategoria(g.categoria)}">${escapeHtml(g.categoria)}</span></td>
            <td><span class="vencimiento-dia">Día ${g.dia}</span></td>
            <td class="fw-semibold text-danger">${formatoMoneda(g.monto)}</td>
            <td>${badgeEstadoFijo(aplicado, g.activo)}</td>
            <td class="text-nowrap">${botonesAccionFijo("gasto", g.id, aplicado, g.activo)}</td>
        </tr>
    `}).join("");
}

// =====================================
// INGRESOS FIJOS
// =====================================

function guardarIngresoFijo() {
    const id = document.getElementById("ingresoFijoId").value;
    const concepto = document.getElementById("conceptoIngresoFijo").value.trim();
    const dia = parseInt(document.getElementById("diaIngresoFijo").value);
    const monto = parseFloat(document.getElementById("montoIngresoFijo").value);

    if (!concepto || isNaN(monto) || monto <= 0 || isNaN(dia) || dia < 1 || dia > 31) {
        mostrarToast("Complete todos los campos correctamente.", "warning");
        return;
    }

    if (id) {
        const item = ingresosFijos.find(i => i.id === parseInt(id));
        if (item) {
            item.concepto = concepto;
            item.dia = dia;
            item.monto = monto;
            sincronizarFijoAplicado("ingreso", item);
        }
        mostrarToast("Ingreso fijo actualizado.");
    } else {
        ingresosFijos.push({
            id: Date.now(),
            concepto,
            dia,
            monto,
            activo: true
        });
        mostrarToast("Ingreso fijo registrado.");
    }

    guardarIngresosFijos();
    renderizarTodo();
    cerrarModal("modalIngresoFijo");
    verificarFijosPendientes();
}

function editarIngresoFijo(id) {
    const item = ingresosFijos.find(i => i.id === id);
    if (!item) return;

    document.getElementById("ingresoFijoId").value = item.id;
    document.getElementById("conceptoIngresoFijo").value = item.concepto;
    document.getElementById("diaIngresoFijo").value = item.dia;
    document.getElementById("montoIngresoFijo").value = item.monto;

    new bootstrap.Modal(document.getElementById("modalIngresoFijo")).show();
}

function eliminarIngresoFijo(id) {
    confirmarAccion("¿Eliminar este ingreso fijo? También se quitará del mes actual si estaba aplicado.", () => {
        ingresosFijos = ingresosFijos.filter(i => i.id !== id);
        ingresos = ingresos.filter(i => i.fijoId !== id);
        fijosAplicados = false;
        guardarIngresosFijos();
        guardarStorage();
        renderizarTodo();
        verificarFijosPendientes();
        mostrarToast("Ingreso fijo eliminado.", "info");
    });
}

function limpiarFormIngresoFijo() {
    document.getElementById("ingresoFijoId").value = "";
    document.getElementById("conceptoIngresoFijo").value = "";
    document.getElementById("diaIngresoFijo").value = "1";
    document.getElementById("montoIngresoFijo").value = "";
}

function renderIngresosFijos() {
    const texto = buscar.value.toLowerCase();
    const filtrados = ingresosFijos.filter(i =>
        i.concepto.toLowerCase().includes(texto) ||
        `dia ${i.dia}`.includes(texto)
    );

    const activos = filtrados.filter(i => i.activo !== false);
    document.getElementById("badgeIngresosFijos").textContent = activos.length;

    const totalActivos = activos.reduce((t, i) => t + i.monto, 0);
    document.getElementById("totalIngresosFijosTabla").textContent =
        activos.length > 0 ? `Total: ${formatoMoneda(totalActivos)}` : "";

    if (filtrados.length === 0) {
        tablaIngresosFijos.innerHTML = filaVacia(5, "fa-money-bill-trend-up", ingresosFijos.length === 0
            ? "No hay ingresos fijos configurados"
            : "Sin resultados en la búsqueda");
        return;
    }

    tablaIngresosFijos.innerHTML = filtrados.map(i => {
        const aplicado = estaFijoAplicado("ingreso", i.id);
        const inactivo = i.activo === false;
        return `
        <tr class="${inactivo ? "opacity-50" : ""}">
            <td>${escapeHtml(i.concepto)}</td>
            <td><span class="vencimiento-dia">Día ${i.dia}</span></td>
            <td class="fw-semibold text-success">${formatoMoneda(i.monto)}</td>
            <td>${badgeEstadoFijo(aplicado, i.activo)}</td>
            <td class="text-nowrap">${botonesAccionFijo("ingreso", i.id, aplicado, i.activo)}</td>
        </tr>
    `}).join("");
}

// =====================================
// APLICAR FIJOS AL MES
// =====================================

function obtenerFechaDelMes(dia) {
    const indiceMes = MESES.indexOf(mes.value);
    const ultimoDia = new Date(anio.value, indiceMes + 1, 0).getDate();
    const diaReal = Math.min(dia, ultimoDia);
    const mesNum = String(indiceMes + 1).padStart(2, "0");
    const diaStr = String(diaReal).padStart(2, "0");
    return `${anio.value}-${mesNum}-${diaStr}`;
}

function aplicarFijosAlMes(silencioso = false) {
    const gastosActivos = gastosFijos.filter(g => g.activo !== false);
    const ingresosActivos = ingresosFijos.filter(i => i.activo !== false);
    let agregados = 0;

    gastosActivos.forEach(g => {
        const yaExiste = gastos.some(x => x.fijoId === g.id);
        if (!yaExiste) {
            gastos.push({
                id: Date.now() + Math.random(),
                fecha: obtenerFechaDelMes(g.dia),
                concepto: g.concepto,
                categoria: g.categoria,
                monto: g.monto,
                fijo: true,
                fijoId: g.id
            });
            agregados++;
        }
    });

    ingresosActivos.forEach(i => {
        const yaExiste = ingresos.some(x => x.fijoId === i.id);
        if (!yaExiste) {
            ingresos.push({
                id: Date.now() + Math.random(),
                fecha: obtenerFechaDelMes(i.dia),
                concepto: i.concepto,
                monto: i.monto,
                fijo: true,
                fijoId: i.id
            });
            agregados++;
        }
    });

    fijosAplicados = true;
    guardarStorage();
    renderizarTodo();
    verificarFijosPendientes();

    if (agregados > 0) {
        if (!silencioso) {
            mostrarToast(`${agregados} movimiento(s) fijo(s) aplicado(s) al mes.`);
        }
    } else if (!silencioso) {
        mostrarToast("Los movimientos fijos ya estaban aplicados.", "info");
    }
}

function verificarFijosPendientes() {
    const alerta = document.getElementById("alertaFijos");
    const hayFijos = gastosFijos.some(g => g.activo !== false) ||
                     ingresosFijos.some(i => i.activo !== false);

    if (!hayFijos) {
        alerta.classList.add("d-none");
        fijosAplicados = true;
        return;
    }

    const pendientesG = gastosFijos.filter(g =>
        g.activo !== false && !gastos.some(x => x.fijoId === g.id)
    ).length;
    const pendientesI = ingresosFijos.filter(i =>
        i.activo !== false && !ingresos.some(x => x.fijoId === i.id)
    ).length;

    fijosAplicados = pendientesG + pendientesI === 0;

    if (pendientesG + pendientesI > 0) {
        document.getElementById("alertaFijosTexto").textContent =
            `Hay ${pendientesG} gasto(s) fijo(s) y ${pendientesI} ingreso(s) fijo(s) pendientes de aplicar a ${mes.value} ${anio.value}.`;
        alerta.classList.remove("d-none");
    } else {
        alerta.classList.add("d-none");
    }
}

function intentarAutoAplicarFijos() {
    if (!configuracion.autoAplicarFijos) return;

    const pendientesG = gastosFijos.filter(g =>
        g.activo !== false && !gastos.some(x => x.fijoId === g.id)
    ).length;
    const pendientesI = ingresosFijos.filter(i =>
        i.activo !== false && !ingresos.some(x => x.fijoId === i.id)
    ).length;

    if (pendientesG + pendientesI > 0) {
        aplicarFijosAlMes(true);
    }
}

// =====================================
// PRESUPUESTOS
// =====================================

function renderFormPresupuestos() {
    const contenedor = document.getElementById("formPresupuestos");
    contenedor.innerHTML = CATEGORIAS.map(cat => `
        <div class="col-md-6">
            <label class="form-label">
                <span class="badge ${claseCategoria(cat)}">${cat}</span>
            </label>
            <input type="number" class="form-control presupuesto-input"
                data-categoria="${cat}" min="0"
                value="${presupuestos[cat] || ""}"
                placeholder="Sin límite">
        </div>
    `).join("");
}

function guardarPresupuestosModal() {
    document.querySelectorAll(".presupuesto-input").forEach(input => {
        const cat = input.dataset.categoria;
        const valor = parseFloat(input.value);
        if (!isNaN(valor) && valor > 0) {
            presupuestos[cat] = valor;
        } else {
            delete presupuestos[cat];
        }
    });

    guardarPresupuestos();
    renderPresupuestos();
    cerrarModal("modalPresupuesto");
    mostrarToast("Presupuestos guardados.");
}

function renderPresupuestos() {
    const contenedor = document.getElementById("contenedorPresupuestos");
    const categoriasConPresupuesto = CATEGORIAS.filter(c => presupuestos[c] > 0);

    if (categoriasConPresupuesto.length === 0) {
        contenedor.innerHTML = `
            <p class="text-muted text-center py-3 mb-0">
                <i class="fa-solid fa-sliders fa-lg d-block mb-2"></i>
                Configura límites de gasto por categoría para un mejor control.
            </p>`;
        return;
    }

    contenedor.innerHTML = categoriasConPresupuesto.map(cat => {
        const limite = presupuestos[cat];
        const gastado = gastos.filter(g => g.categoria === cat)
            .reduce((t, g) => t + g.monto, 0);
        const porcentaje = Math.min((gastado / limite) * 100, 100);
        const excedido = gastado > limite;
        const colorBarra = excedido ? "bg-danger" : porcentaje > 80 ? "bg-warning" : "bg-success";

        return `
            <div class="presupuesto-item mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="badge ${claseCategoria(cat)}">${cat}</span>
                    <small class="${excedido ? "text-danger fw-bold" : "text-muted"}">
                        ${formatoMoneda(gastado)} / ${formatoMoneda(limite)}
                        ${excedido ? '<i class="fa-solid fa-triangle-exclamation ms-1"></i>' : ""}
                    </small>
                </div>
                <div class="progress presupuesto-barra">
                    <div class="progress-bar ${colorBarra}" style="width: ${porcentaje}%"></div>
                </div>
            </div>
        `;
    }).join("");
}

// =====================================
// RENDER PRINCIPAL
// =====================================

function renderizarTodo() {
    renderIngresos();
    renderGastos();
    renderGastosFijos();
    renderIngresosFijos();
    actualizarResumen();
    actualizarKPIs();
    renderPresupuestos();
    renderVencimientos();
    renderAlertaPresupuesto();
    if (typeof actualizarGraficos === "function") actualizarGraficos();
}

// =====================================
// RENDER INGRESOS
// =====================================

function renderIngresos() {
    const texto = buscar.value.toLowerCase();
    const filtrados = ingresos
        .filter(i =>
            i.concepto.toLowerCase().includes(texto) ||
            i.fecha.includes(texto)
        )
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    if (filtrados.length === 0) {
        tablaIngresos.innerHTML = filaVacia(4, "fa-arrow-trend-up", "No hay ingresos este mes");
        return;
    }

    tablaIngresos.innerHTML = filtrados.map(i => `
        <tr>
            <td>${formatoFecha(i.fecha)}</td>
            <td>
                ${escapeHtml(i.concepto)}
                ${i.fijo ? '<span class="badge bg-secondary ms-1" title="Ingreso fijo"><i class="fa-solid fa-repeat fa-xs"></i></span>' : ""}
            </td>
            <td class="text-success fw-semibold">${formatoMoneda(i.monto)}</td>
            <td>
                <button class="btn btn-sm btn-editar" onclick="editarIngreso(${i.id})" aria-label="Editar ingreso">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn btn-sm btn-eliminar" onclick="eliminarIngreso(${i.id})" aria-label="Eliminar ingreso">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join("");
}

// =====================================
// RENDER GASTOS
// =====================================

function renderGastos() {
    const texto = buscar.value.toLowerCase();
    const filtrados = gastos
        .filter(g =>
            g.concepto.toLowerCase().includes(texto) ||
            g.categoria.toLowerCase().includes(texto) ||
            g.fecha.includes(texto)
        )
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    if (filtrados.length === 0) {
        tablaGastos.innerHTML = filaVacia(5, "fa-arrow-trend-down", "No hay gastos este mes");
        return;
    }

    tablaGastos.innerHTML = filtrados.map(g => `
        <tr>
            <td>${formatoFecha(g.fecha)}</td>
            <td>
                ${escapeHtml(g.concepto)}
                ${g.fijo ? '<span class="badge bg-secondary ms-1" title="Gasto fijo"><i class="fa-solid fa-repeat fa-xs"></i></span>' : ""}
            </td>
            <td><span class="badge ${claseCategoria(g.categoria)}">${escapeHtml(g.categoria)}</span></td>
            <td class="text-danger fw-semibold">${formatoMoneda(g.monto)}</td>
            <td>
                <button class="btn btn-sm btn-editar" onclick="editarGasto(${g.id})" aria-label="Editar gasto">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn btn-sm btn-eliminar" onclick="eliminarGasto(${g.id})" aria-label="Eliminar gasto">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join("");
}

// =====================================
// RESUMEN Y KPIs
// =====================================

function actualizarResumen() {
    const totalI = ingresos.reduce((t, i) => t + i.monto, 0);
    const totalG = gastos.reduce((t, g) => t + g.monto, 0);
    const saldo = totalI - totalG;

    totalIngresosEl.textContent = formatoMoneda(totalI);
    totalGastosEl.textContent = formatoMoneda(totalG);
    balanceEl.textContent = formatoMoneda(saldo);
    cantidadMovimientosEl.textContent = ingresos.length + gastos.length;

    balanceEl.classList.remove("positivo", "negativo");
    balanceEl.classList.add(saldo >= 0 ? "positivo" : "negativo");

    const cardBalance = balanceEl.closest(".resumen");
    if (cardBalance) {
        cardBalance.classList.toggle("balance-positivo", saldo >= 0);
        cardBalance.classList.toggle("balance-negativo", saldo < 0);
    }
}

function actualizarKPIs() {
    const totalGastosFijosMes = gastos.filter(g => g.fijo).reduce((t, g) => t + g.monto, 0);
    const totalGastosVariablesMes = gastos.filter(g => !g.fijo).reduce((t, g) => t + g.monto, 0);
    const totalGastosFijosConfig = gastosFijos.filter(g => g.activo !== false)
        .reduce((t, g) => t + g.monto, 0);
    const totalIngresosFijosConfig = ingresosFijos.filter(i => i.activo !== false)
        .reduce((t, i) => t + i.monto, 0);

    document.getElementById("totalGastosFijos").textContent =
        formatoMoneda(totalGastosFijosMes || totalGastosFijosConfig);
    document.getElementById("totalGastosVariables").textContent =
        formatoMoneda(totalGastosVariablesMes);

    const totalI = ingresos.reduce((t, i) => t + i.monto, 0);
    const totalG = gastos.reduce((t, g) => t + g.monto, 0);
    const ahorro = totalI > 0 ? Math.round(((totalI - totalG) / totalI) * 100) : 0;
    const elAhorro = document.getElementById("porcentajeAhorro");
    elAhorro.textContent = `${ahorro}%`;

    const meta = configuracion.metaAhorro || 0;
    const metaEl = document.getElementById("metaAhorroTexto");
    if (meta > 0) {
        elAhorro.className = `mb-0 ${ahorro >= meta ? "text-success" : "text-danger"}`;
        metaEl.textContent = `Meta: ${meta}%`;
        metaEl.classList.remove("d-none");
    } else {
        elAhorro.className = `mb-0 ${ahorro >= 0 ? "text-success" : "text-danger"}`;
        metaEl.classList.add("d-none");
    }

    const indiceMes = MESES.indexOf(mes.value);
    const diasMes = new Date(anio.value, indiceMes + 1, 0).getDate();
    const promedio = totalG > 0 ? Math.round(totalG / diasMes) : 0;
    document.getElementById("promedioDiario").textContent = formatoMoneda(promedio);

    const ingresosRef = totalI || totalIngresosFijosConfig;
    const compromiso = ingresosRef > 0
        ? Math.round((totalGastosFijosConfig / ingresosRef) * 100)
        : 0;
    const elCompromiso = document.getElementById("compromisoFijo");
    elCompromiso.textContent = `${compromiso}%`;
    elCompromiso.className = `mb-0 ${compromiso > 70 ? "text-danger" : compromiso > 50 ? "text-warning" : "text-info"}`;

    const balanceFijosVal = totalIngresosFijosConfig - totalGastosFijosConfig;
    const elBalanceFijos = document.getElementById("balanceFijos");
    elBalanceFijos.textContent = formatoMoneda(balanceFijosVal);
    elBalanceFijos.className = `mb-0 ${balanceFijosVal >= 0 ? "text-success" : "text-danger"}`;
}

function renderVencimientos() {
    const contenedor = document.getElementById("contenedorVencimientos");
    const periodoEl = document.getElementById("vencimientosPeriodo");
    periodoEl.textContent = `${mes.value} ${anio.value}`;

    const diaHoy = obtenerDiaActual();
    const esMesActual = mes.value === obtenerMesActual() &&
        parseInt(anio.value) === obtenerAnioActual();

    const items = [];

    gastosFijos.filter(g => g.activo !== false).forEach(g => {
        items.push({ tipo: "gasto", concepto: g.concepto, dia: g.dia, monto: g.monto, categoria: g.categoria });
    });
    ingresosFijos.filter(i => i.activo !== false).forEach(i => {
        items.push({ tipo: "ingreso", concepto: i.concepto, dia: i.dia, monto: i.monto });
    });

    items.sort((a, b) => a.dia - b.dia);

    const proximos = esMesActual
        ? items.filter(x => x.dia >= diaHoy)
        : items;

    if (proximos.length === 0) {
        contenedor.innerHTML = `<p class="text-muted text-center py-2 mb-0">
            <i class="fa-solid fa-check-circle text-success me-1"></i>
            ${esMesActual ? "No hay más vencimientos este mes" : "Sin vencimientos en este período"}
        </p>`;
        return;
    }

    contenedor.innerHTML = proximos.slice(0, 6).map(v => `
        <div class="vencimiento-item ${v.tipo}">
            <div class="d-flex align-items-center gap-3">
                <span class="vencimiento-dia">Día ${v.dia}</span>
                <div>
                    <strong>${escapeHtml(v.concepto)}</strong>
                    <small class="d-block text-muted">
                        ${v.tipo === "gasto"
                            ? `<i class="fa-solid fa-arrow-down text-danger"></i> Gasto${v.categoria ? ` · ${escapeHtml(v.categoria)}` : ""}`
                            : `<i class="fa-solid fa-arrow-up text-success"></i> Ingreso`}
                    </small>
                </div>
            </div>
            <span class="fw-semibold ${v.tipo === "gasto" ? "text-danger" : "text-success"}">
                ${formatoMoneda(v.monto)}
            </span>
        </div>
    `).join("");
}

function renderAlertaPresupuesto() {
    const alerta = document.getElementById("alertaPresupuesto");
    const excedidos = CATEGORIAS.filter(cat => {
        const limite = presupuestos[cat];
        if (!limite || limite <= 0) return false;
        const gastado = gastos.filter(g => g.categoria === cat).reduce((t, g) => t + g.monto, 0);
        return gastado > limite;
    });

    if (excedidos.length === 0) {
        alerta.classList.add("d-none");
        return;
    }

    document.getElementById("alertaPresupuestoTexto").textContent =
        excedidos.length === 1
            ? `Has superado el presupuesto en la categoría ${excedidos[0]}.`
            : `Has superado el presupuesto en ${excedidos.length} categorías: ${excedidos.join(", ")}.`;
    alerta.classList.remove("d-none");
}

function guardarConfiguracionModal() {
    configuracion.autoAplicarFijos = document.getElementById("autoAplicarFijos").checked;
    const meta = parseFloat(document.getElementById("metaAhorro").value);
    configuracion.metaAhorro = !isNaN(meta) && meta >= 0 ? meta : 0;
    guardarConfiguracion();
    cerrarModal("modalConfiguracion");
    actualizarKPIs();
    mostrarToast("Configuración guardada.");
}

function mostrarGuiaInicial() {
    const guia = document.getElementById("guiaInicial");
    if (!configuracion.guiaVista && gastosFijos.length === 0 && ingresosFijos.length === 0) {
        guia.classList.remove("d-none");
    }
}

function cerrarGuiaInicial() {
    document.getElementById("guiaInicial").classList.add("d-none");
    configuracion.guiaVista = true;
    guardarConfiguracion();
}

// =====================================
// ELIMINAR
// =====================================

function eliminarIngreso(id) {
    confirmarAccion("¿Desea eliminar este ingreso?", () => {
        const eraFijo = ingresos.find(i => i.id === id)?.fijo;
        ingresos = ingresos.filter(i => i.id !== id);
        if (eraFijo) fijosAplicados = false;
        guardarStorage();
        renderizarTodo();
        verificarFijosPendientes();
        mostrarToast("Ingreso eliminado.", "info");
    });
}

function eliminarGasto(id) {
    confirmarAccion("¿Desea eliminar este gasto?", () => {
        const eraFijo = gastos.find(g => g.id === id)?.fijo;
        gastos = gastos.filter(g => g.id !== id);
        if (eraFijo) fijosAplicados = false;
        guardarStorage();
        renderizarTodo();
        verificarFijosPendientes();
        mostrarToast("Gasto eliminado.", "info");
    });
}

// =====================================
// EDITAR
// =====================================

function editarIngreso(id) {
    const ingreso = ingresos.find(i => i.id === id);
    if (!ingreso) return;

    movimientoEditando = { tipo: "ingreso", id };
    document.getElementById("editarFecha").value = ingreso.fecha;
    document.getElementById("editarConcepto").value = ingreso.concepto;
    document.getElementById("editarMonto").value = ingreso.monto;
    document.getElementById("grupoEditarCategoria").style.display = "none";

    new bootstrap.Modal(document.getElementById("modalEditar")).show();
}

function editarGasto(id) {
    const gasto = gastos.find(g => g.id === id);
    if (!gasto) return;

    movimientoEditando = { tipo: "gasto", id };
    document.getElementById("editarFecha").value = gasto.fecha;
    document.getElementById("editarConcepto").value = gasto.concepto;
    document.getElementById("editarMonto").value = gasto.monto;
    document.getElementById("grupoEditarCategoria").style.display = "block";
    document.getElementById("editarCategoria").value = gasto.categoria;

    new bootstrap.Modal(document.getElementById("modalEditar")).show();
}

function actualizarMovimiento() {
    if (!movimientoEditando) return;

    const fecha = document.getElementById("editarFecha").value;
    const concepto = document.getElementById("editarConcepto").value.trim();
    const monto = parseFloat(document.getElementById("editarMonto").value);

    if (!fecha || !concepto || isNaN(monto) || monto <= 0) {
        mostrarToast("Complete todos los campos correctamente.", "warning");
        return;
    }

    if (movimientoEditando.tipo === "ingreso") {
        const ingreso = ingresos.find(i => i.id === movimientoEditando.id);
        ingreso.fecha = fecha;
        ingreso.concepto = concepto;
        ingreso.monto = monto;
    } else {
        const gasto = gastos.find(g => g.id === movimientoEditando.id);
        gasto.fecha = fecha;
        gasto.concepto = concepto;
        gasto.monto = monto;
        gasto.categoria = document.getElementById("editarCategoria").value;
    }

    guardarStorage();
    renderizarTodo();
    cerrarModal("modalEditar");
    mostrarToast("Movimiento actualizado.");
}

// =====================================
// CAMBIAR PERIODO
// =====================================

function cambiarPeriodo() {
    cargarStorage();
    renderizarTodo();
    verificarFijosPendientes();
    intentarAutoAplicarFijos();
}
