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

    pdf.setFontSize(20);
    pdf.text("Control Financiero", 20, 20);
    pdf.setFontSize(12);
    pdf.text(`Periodo: ${mes.value} ${anio.value}`, 20, 30);

    let y = 45;

    pdf.setFontSize(14);
    pdf.text("INGRESOS", 20, y);
    y += 10;

    if (ingresos.length === 0) {
        pdf.setFontSize(10);
        pdf.text("Sin ingresos registrados", 20, y);
        y += 8;
    } else {
        ingresos.forEach(i => {
            if (y > 270) { pdf.addPage(); y = 20; }
            pdf.setFontSize(10);
            pdf.text(`${i.fecha} - ${i.concepto} - ${formatoMoneda(i.monto)}`, 20, y);
            y += 8;
        });
    }

    y += 10;
    pdf.setFontSize(14);
    pdf.text("GASTOS", 20, y);
    y += 10;

    if (gastos.length === 0) {
        pdf.setFontSize(10);
        pdf.text("Sin gastos registrados", 20, y);
        y += 8;
    } else {
        gastos.forEach(g => {
            if (y > 270) { pdf.addPage(); y = 20; }
            pdf.setFontSize(10);
            pdf.text(`${g.fecha} - ${g.concepto} (${g.categoria}) - ${formatoMoneda(g.monto)}`, 20, y);
            y += 8;
        });
    }

    y += 10;
    pdf.setFontSize(15);
    pdf.text(`Balance: ${balanceEl.textContent}`, 20, y);

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

    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Movimientos");

    if (gastosFijos.length > 0) {
        const hojaFijos = XLSX.utils.json_to_sheet(gastosFijos.map(g => ({
            Concepto: g.concepto,
            Categoria: g.categoria,
            Dia: g.dia,
            Monto: g.monto
        })));
        XLSX.utils.book_append_sheet(libro, hojaFijos, "Gastos Fijos");
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
