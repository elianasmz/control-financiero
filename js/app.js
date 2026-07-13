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
    cargarStorage();

    renderizarTodo();
    eventos();
    verificarFijosPendientes();
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
    document.getElementById("btnAplicarFijos").addEventListener("click", aplicarFijosAlMes);

    buscar.addEventListener("input", renderizarTodo);
    notas.addEventListener("input", guardarStorage);
    mes.addEventListener("change", cambiarPeriodo);
    anio.addEventListener("change", cambiarPeriodo);
    document.getElementById("modoOscuro").addEventListener("click", cambiarTema);

    document.getElementById("modalPresupuesto").addEventListener("show.bs.modal", renderFormPresupuestos);
    document.getElementById("modalGastoFijo").addEventListener("hidden.bs.modal", limpiarFormGastoFijo);
    document.getElementById("modalIngresoFijo").addEventListener("hidden.bs.modal", limpiarFormIngresoFijo);

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
    renderGastosFijos();
    actualizarKPIs();
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
    confirmarAccion("¿Eliminar este gasto fijo?", () => {
        gastosFijos = gastosFijos.filter(g => g.id !== id);
        guardarGastosFijos();
        renderGastosFijos();
        actualizarKPIs();
        verificarFijosPendientes();
        mostrarToast("Gasto fijo eliminado.", "info");
    });
}

function limpiarFormGastoFijo() {
    document.getElementById("gastoFijoId").value = "";
    document.getElementById("conceptoGastoFijo").value = "";
    document.getElementById("diaGastoFijo").value = "1";
    document.getElementById("montoGastoFijo").value = "";
}

function renderGastosFijos() {
    const activos = gastosFijos.filter(g => g.activo !== false);
    document.getElementById("badgeGastosFijos").textContent = activos.length;

    if (activos.length === 0) {
        tablaGastosFijos.innerHTML = filaVacia(5, "fa-repeat", "No hay gastos fijos configurados");
        return;
    }

    tablaGastosFijos.innerHTML = activos.map(g => `
        <tr>
            <td>${escapeHtml(g.concepto)}</td>
            <td><span class="badge ${claseCategoria(g.categoria)}">${escapeHtml(g.categoria)}</span></td>
            <td>Día ${g.dia}</td>
            <td class="fw-semibold">${formatoMoneda(g.monto)}</td>
            <td>
                <button class="btn btn-sm btn-editar" onclick="editarGastoFijo(${g.id})">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn btn-sm btn-eliminar" onclick="eliminarGastoFijo(${g.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join("");
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
    renderIngresosFijos();
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
    confirmarAccion("¿Eliminar este ingreso fijo?", () => {
        ingresosFijos = ingresosFijos.filter(i => i.id !== id);
        guardarIngresosFijos();
        renderIngresosFijos();
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
    const activos = ingresosFijos.filter(i => i.activo !== false);
    document.getElementById("badgeIngresosFijos").textContent = activos.length;

    if (activos.length === 0) {
        tablaIngresosFijos.innerHTML = filaVacia(4, "fa-money-bill-trend-up", "No hay ingresos fijos configurados");
        return;
    }

    tablaIngresosFijos.innerHTML = activos.map(i => `
        <tr>
            <td>${escapeHtml(i.concepto)}</td>
            <td>Día ${i.dia}</td>
            <td class="fw-semibold text-success">${formatoMoneda(i.monto)}</td>
            <td>
                <button class="btn btn-sm btn-editar" onclick="editarIngresoFijo(${i.id})">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn btn-sm btn-eliminar" onclick="eliminarIngresoFijo(${i.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join("");
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

function aplicarFijosAlMes() {
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
        mostrarToast(`${agregados} movimiento(s) fijo(s) aplicado(s) al mes.`);
    } else {
        mostrarToast("Los movimientos fijos ya estaban aplicados.", "info");
    }
}

function verificarFijosPendientes() {
    const alerta = document.getElementById("alertaFijos");
    const hayFijos = gastosFijos.some(g => g.activo !== false) ||
                     ingresosFijos.some(i => i.activo !== false);

    if (!hayFijos || fijosAplicados) {
        alerta.classList.add("d-none");
        return;
    }

    const pendientesG = gastosFijos.filter(g =>
        g.activo !== false && !gastos.some(x => x.fijoId === g.id)
    ).length;
    const pendientesI = ingresosFijos.filter(i =>
        i.activo !== false && !ingresos.some(x => x.fijoId === i.id)
    ).length;

    if (pendientesG + pendientesI > 0) {
        document.getElementById("alertaFijosTexto").textContent =
            `Hay ${pendientesG} gasto(s) fijo(s) y ${pendientesI} ingreso(s) fijo(s) pendientes de aplicar a ${mes.value} ${anio.value}.`;
        alerta.classList.remove("d-none");
    } else {
        alerta.classList.add("d-none");
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
                <button class="btn btn-sm btn-editar" onclick="editarIngreso(${i.id})">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn btn-sm btn-eliminar" onclick="eliminarIngreso(${i.id})">
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
                <button class="btn btn-sm btn-editar" onclick="editarGasto(${g.id})">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn btn-sm btn-eliminar" onclick="eliminarGasto(${g.id})">
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
}

function actualizarKPIs() {
    const totalGastosFijosMes = gastos.filter(g => g.fijo).reduce((t, g) => t + g.monto, 0);
    const totalGastosVariablesMes = gastos.filter(g => !g.fijo).reduce((t, g) => t + g.monto, 0);
    const totalGastosFijosConfig = gastosFijos.filter(g => g.activo !== false)
        .reduce((t, g) => t + g.monto, 0);

    document.getElementById("totalGastosFijos").textContent =
        formatoMoneda(totalGastosFijosMes || totalGastosFijosConfig);
    document.getElementById("totalGastosVariables").textContent =
        formatoMoneda(totalGastosVariablesMes);

    const totalI = ingresos.reduce((t, i) => t + i.monto, 0);
    const totalG = gastos.reduce((t, g) => t + g.monto, 0);
    const ahorro = totalI > 0 ? Math.round(((totalI - totalG) / totalI) * 100) : 0;
    const elAhorro = document.getElementById("porcentajeAhorro");
    elAhorro.textContent = `${ahorro}%`;
    elAhorro.className = `mb-0 ${ahorro >= 0 ? "text-success" : "text-danger"}`;

    const indiceMes = MESES.indexOf(mes.value);
    const diasMes = new Date(anio.value, indiceMes + 1, 0).getDate();
    const promedio = totalG > 0 ? Math.round(totalG / diasMes) : 0;
    document.getElementById("promedioDiario").textContent = formatoMoneda(promedio);
}

// =====================================
// ELIMINAR
// =====================================

function eliminarIngreso(id) {
    confirmarAccion("¿Desea eliminar este ingreso?", () => {
        ingresos = ingresos.filter(i => i.id !== id);
        guardarStorage();
        renderizarTodo();
        verificarFijosPendientes();
        mostrarToast("Ingreso eliminado.", "info");
    });
}

function eliminarGasto(id) {
    confirmarAccion("¿Desea eliminar este gasto?", () => {
        gastos = gastos.filter(g => g.id !== id);
        guardarStorage();
        renderizarTodo();
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
}
