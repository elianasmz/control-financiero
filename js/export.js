//=====================================
// EVENTOS
//=====================================

document.addEventListener("DOMContentLoaded", () => {

    document
        .getElementById("btnPDF")
        .addEventListener("click", exportarPDF);

    document
        .getElementById("btnExcel")
        .addEventListener("click", exportarExcel);

});
//=====================================
// PDF
//=====================================

async function exportarPDF(){

    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF();

    pdf.setFontSize(20);

    pdf.text("Control Financiero",20,20);

    pdf.setFontSize(12);

    pdf.text(
        `Periodo: ${mes.value} ${anio.value}`,
        20,
        30
    );

    let y=45;

    pdf.setFontSize(14);

    pdf.text("INGRESOS",20,y);

    y+=10;

    ingresos.forEach(i=>{

        pdf.text(

            `${i.fecha} - ${i.concepto} - ${formatoMoneda(i.monto)}`,

            20,

            y

        );

        y+=8;

    });

    y+=10;

    pdf.text("GASTOS",20,y);

    y+=10;

    gastos.forEach(g=>{

        pdf.text(

            `${g.fecha} - ${g.concepto} (${g.categoria}) - ${formatoMoneda(g.monto)}`,

            20,

            y

        );

        y+=8;

    });

    y+=10;

    pdf.setFontSize(15);

    pdf.text(

        `Balance: ${balance.textContent}`,

        20,

        y

    );

    pdf.save(

        `Finanzas_${mes.value}_${anio.value}.pdf`

    );

}
//=====================================
// EXCEL
//=====================================

function exportarExcel(){

    const datos=[];

    ingresos.forEach(i=>{

        datos.push({

            Tipo:"Ingreso",

            Fecha:i.fecha,

            Concepto:i.concepto,

            Categoria:"",

            Monto:i.monto

        });

    });

    gastos.forEach(g=>{

        datos.push({

            Tipo:"Gasto",

            Fecha:g.fecha,

            Concepto:g.concepto,

            Categoria:g.categoria,

            Monto:g.monto

        });

    });

    const hoja=XLSX.utils.json_to_sheet(datos);

    const libro=XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(

        libro,

        hoja,

        "Movimientos"

    );

    XLSX.writeFile(

        libro,

        `Finanzas_${mes.value}_${anio.value}.xlsx`

    );

}
//=====================================
// IMPORTAR JSON
//=====================================

document

.getElementById("btnImportar")

.addEventListener(

"click",

importarJSON

);

function importarJSON(){

    const archivo=document

    .getElementById("archivoJSON")

    .files[0];

    if(!archivo){

        alert("Seleccione un archivo.");

        return;

    }

    const lector=new FileReader();

    lector.onload=e=>{
        const datos=
        JSON.parse(e.target.result);
        ingresos=datos.ingresos || [];
        gastos=datos.gastos || [];
        notas.value=datos.notas || "";
        guardarStorage();
        renderizarTodo();
        bootstrap.Modal.getInstance(document.getElementById("modalImportar")).hide();
    };
    lector.readAsText(archivo);
}