// =====================================
// EVENTOS EXPORT
// =====================================

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btnPDF").addEventListener("click", exportarPDF);
    document.getElementById("btnExcel").addEventListener("click", exportarExcel);
    document.getElementById("btnRespaldo").addEventListener("click", exportarJSON);
    document.getElementById("btnAbrirImportar").addEventListener("click", () => {
        new bootstrap.Modal(document.getElementById("modalImportar")).show();
    });
    document.getElementById("btnImportar").addEventListener("click", importarJSON);
});

// =====================================
// PDF
// =====================================

async function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const margen = 20;
    let y = 20;

    pdf.setFontSize(20);
    pdf.setTextColor(236, 64, 122);
    pdf.text("Control Financiero", margen, y);
    y += 10;

    pdf.setFontSize(12);
    pdf.setTextColor(80, 80, 80);
    pdf.text(`Periodo: ${mes.value} ${anio.value}`, margen, y);
    y += 14;

    const totalI = ingresos.reduce((t, i) => t + i.monto, 0);
    const totalG = gastos.reduce((t, g) => t + g.monto, 0);
    const saldo = totalI - totalG;

    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Ingresos: ${formatoMoneda(totalI)}`, margen, y);
    y += 7;
    pdf.text(`Gastos: ${formatoMoneda(totalG)}`, margen, y);
    y += 7;
    pdf.setFont(undefined, "bold");
    pdf.text(`Balance: ${formatoMoneda(saldo)}`, margen, y);
    pdf.setFont(undefined, "normal");
    y += 14;

    function seccion(titulo) {
        if (y > 260) { pdf.addPage(); y = 20; }
        pdf.setFontSize(13);
        pdf.setTextColor(236, 64, 122);
        pdf.text(titulo, margen, y);
        y += 8;
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
    }

    seccion("INGRESOS");
    if (ingresos.length === 0) {
        pdf.text("Sin ingresos registrados", margen, y);
        y += 8;
    } else {
        ingresos.forEach(i => {
            if (y > 270) { pdf.addPage(); y = 20; }
            const fijo = i.fijo ? " [Fijo]" : "";
            pdf.text(`${formatoFecha(i.fecha)} - ${i.concepto}${fijo} - ${formatoMoneda(i.monto)}`, margen, y);
            y += 7;
        });
    }
    y += 6;

    seccion("GASTOS");
    if (gastos.length === 0) {
        pdf.text("Sin gastos registrados", margen, y);
        y += 8;
    } else {
        gastos.forEach(g => {
            if (y > 270) { pdf.addPage(); y = 20; }
            const fijo = g.fijo ? " [Fijo]" : "";
            pdf.text(`${formatoFecha(g.fecha)} - ${g.concepto} (${g.categoria})${fijo} - ${formatoMoneda(g.monto)}`, margen, y);
            y += 7;
        });
    }
    y += 6;

    const gastosFijosActivos = gastosFijos.filter(g => g.activo !== false);
    if (gastosFijosActivos.length > 0) {
        seccion("GASTOS FIJOS CONFIGURADOS");
        gastosFijosActivos.forEach(g => {
            if (y > 270) { pdf.addPage(); y = 20; }
            pdf.text(`Día ${g.dia} - ${g.concepto} (${g.categoria}) - ${formatoMoneda(g.monto)}`, margen, y);
            y += 7;
        });
        y += 6;
    }

    const ingresosFijosActivos = ingresosFijos.filter(i => i.activo !== false);
    if (ingresosFijosActivos.length > 0) {
        seccion("INGRESOS FIJOS CONFIGURADOS");
        ingresosFijosActivos.forEach(i => {
            if (y > 270) { pdf.addPage(); y = 20; }
            pdf.text(`Día ${i.dia} - ${i.concepto} - ${formatoMoneda(i.monto)}`, margen, y);
            y += 7;
        });
        y += 6;
    }

    const categoriasConPresupuesto = CATEGORIAS.filter(c => presupuestos[c] > 0);
    if (categoriasConPresupuesto.length > 0) {
        seccion("PRESUPUESTOS");
        categoriasConPresupuesto.forEach(cat => {
            if (y > 270) { pdf.addPage(); y = 20; }
            const gastado = gastos.filter(g => g.categoria === cat).reduce((t, g) => t + g.monto, 0);
            const limite = presupuestos[cat];
            const estado = gastado > limite ? "EXCEDIDO" : "OK";
            pdf.text(`${cat}: ${formatoMoneda(gastado)} / ${formatoMoneda(limite)} [${estado}]`, margen, y);
            y += 7;
        });
        y += 6;
    }

    const notasTexto = document.getElementById("notas").value.trim();
    if (notasTexto) {
        seccion("NOTAS");
        const lineas = pdf.splitTextToSize(notasTexto, 170);
        lineas.forEach(linea => {
            if (y > 270) { pdf.addPage(); y = 20; }
            pdf.text(linea, margen, y);
            y += 7;
        });
    }

    pdf.save(`Finanzas_${mes.value}_${anio.value}.pdf`);
    mostrarToast("PDF exportado correctamente.");
}

// =====================================
// EXCEL
// =====================================

function exportarExcel() {
    const datos = [];

    ingresos.forEach(i => {
        datos.push({
            Tipo: "Ingreso",
            Fecha: i.fecha,
            Concepto: i.concepto,
            Categoria: "",
            Fijo: i.fijo ? "Sí" : "No",
            Monto: i.monto
        });
    });

    gastos.forEach(g => {
        datos.push({
            Tipo: "Gasto",
            Fecha: g.fecha,
            Concepto: g.concepto,
            Categoria: g.categoria,
            Fijo: g.fijo ? "Sí" : "No",
            Monto: g.monto
        });
    });

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(datos), "Movimientos");

    const totalI = ingresos.reduce((t, i) => t + i.monto, 0);
    const totalG = gastos.reduce((t, g) => t + g.monto, 0);
    const resumen = [
        { Concepto: "Total Ingresos", Monto: totalI },
        { Concepto: "Total Gastos", Monto: totalG },
        { Concepto: "Balance", Monto: totalI - totalG },
        { Concepto: "Gastos Fijos (mes)", Monto: gastos.filter(g => g.fijo).reduce((t, g) => t + g.monto, 0) },
        { Concepto: "Gastos Variables (mes)", Monto: gastos.filter(g => !g.fijo).reduce((t, g) => t + g.monto, 0) }
    ];
    XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(resumen), "Resumen");

    if (gastosFijos.length > 0) {
        XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(gastosFijos.map(g => ({
            Concepto: g.concepto,
            Categoria: g.categoria,
            Dia: g.dia,
            Monto: g.monto,
            Activo: g.activo !== false ? "Sí" : "No"
        }))), "Gastos Fijos");
    }

    if (ingresosFijos.length > 0) {
        XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(ingresosFijos.map(i => ({
            Concepto: i.concepto,
            Dia: i.dia,
            Monto: i.monto,
            Activo: i.activo !== false ? "Sí" : "No"
        }))), "Ingresos Fijos");
    }

    const categoriasConPresupuesto = CATEGORIAS.filter(c => presupuestos[c] > 0);
    if (categoriasConPresupuesto.length > 0) {
        XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(
            categoriasConPresupuesto.map(cat => {
                const gastado = gastos.filter(g => g.categoria === cat).reduce((t, g) => t + g.monto, 0);
                return {
                    Categoria: cat,
                    Presupuesto: presupuestos[cat],
                    Gastado: gastado,
                    Restante: presupuestos[cat] - gastado,
                    Excedido: gastado > presupuestos[cat] ? "Sí" : "No"
                };
            })
        ), "Presupuestos");
    }

    XLSX.writeFile(libro, `Finanzas_${mes.value}_${anio.value}.xlsx`);
    mostrarToast("Excel exportado correctamente.");
}

// =====================================
// JSON RESPALDO
// =====================================

function exportarJSON() {
    const respaldo = exportarTodosLosDatos();
    const blob = new Blob([JSON.stringify(respaldo, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Respaldo_Finanzas_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    mostrarToast("Respaldo JSON exportado.");
}

// =====================================
// IMPORTAR JSON
// =====================================

function importarJSON() {
    const archivo = document.getElementById("archivoJSON").files[0];

    if (!archivo) {
        mostrarToast("Seleccione un archivo JSON.", "warning");
        return;
    }

    const lector = new FileReader();
    lector.onload = e => {
        try {
            const datos = JSON.parse(e.target.result);
            importarTodosLosDatos(datos);
            renderizarTodo();
            renderGastosFijos();
            renderIngresosFijos();
            verificarFijosPendientes();
            cerrarModal("modalImportar");
            document.getElementById("archivoJSON").value = "";
            mostrarToast("Respaldo importado correctamente.");
        } catch (err) {
            mostrarToast("Archivo JSON inválido.", "danger");
        }
    };
    lector.readAsText(archivo);
}
