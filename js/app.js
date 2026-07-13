// =====================================
// VARIABLES GLOBALES
// =====================================

let ingresos = [];
let gastos = [];

let movimientoEditando = null;

const STORAGE_KEY = "controlFinanciero";

// =====================================
// ELEMENTOS
// =====================================

const tablaIngresos = document.getElementById("tablaIngresos");
const tablaGastos = document.getElementById("tablaGastos");

const totalIngresos = document.getElementById("totalIngresos");
const totalGastos = document.getElementById("totalGastos");
const balance = document.getElementById("balance");
const cantidadMovimientos = document.getElementById("cantidadMovimientos");

const notas = document.getElementById("notas");

const mes = document.getElementById("mes");
const anio = document.getElementById("anio");

const buscar = document.getElementById("buscar");

//=====================================
// INICIO
//=====================================

document.addEventListener("DOMContentLoaded", () => {

    cargarAnios();

    cargarStorage();

    renderizarTodo();

    eventos();

});

//=====================================
// EVENTOS
//=====================================

function eventos(){

    document
        .getElementById("guardarIngreso")
        .addEventListener("click", agregarIngreso);

    document
        .getElementById("guardarGasto")
        .addEventListener("click", agregarGasto);

    document
        .getElementById("actualizarMovimiento")
        .addEventListener("click", actualizarMovimiento);

    buscar.addEventListener("input", renderizarTodo);

    notas.addEventListener("input", guardarStorage);

    mes.addEventListener("change", cambiarPeriodo);

    anio.addEventListener("change", cambiarPeriodo);

    document
        .getElementById("modoOscuro")
        .addEventListener("click", cambiarTema);

}//=====================================
// AÑOS
//=====================================

function cargarAnios(){

    const actual = new Date().getFullYear();

    for(let i=actual-5;i<=actual+5;i++){

        const option=document.createElement("option");

        option.value=i;

        option.textContent=i;

        anio.appendChild(option);

    }

    anio.value=actual;

}
//=====================================
// INGRESOS
//=====================================

function agregarIngreso(){

    const fecha=document.getElementById("fechaIngreso").value;

    const concepto=document.getElementById("conceptoIngreso").value.trim();

    const monto=parseFloat(document.getElementById("montoIngreso").value);

    if(!fecha || !concepto || isNaN(monto) || monto<=0){

        alert("Complete todos los campos.");

        return;

    }

    ingresos.push({

        id:Date.now(),

        fecha,

        concepto,

        monto

    });

    guardarStorage();

    renderizarTodo();

    bootstrap.Modal.getInstance(
        document.getElementById("modalIngreso")
    ).hide();

    limpiarIngreso();

}
function limpiarIngreso(){

    document.getElementById("fechaIngreso").value="";

    document.getElementById("conceptoIngreso").value="";

    document.getElementById("montoIngreso").value="";

}
//=====================================
// GASTOS
//=====================================

function agregarGasto(){

    const fecha=document.getElementById("fechaGasto").value;

    const concepto=document.getElementById("conceptoGasto").value.trim();

    const categoria=document.getElementById("categoriaGasto").value;

    const monto=parseFloat(document.getElementById("montoGasto").value);

    if(!fecha || !concepto || isNaN(monto) || monto<=0){

        alert("Complete todos los campos.");

        return;

    }

    gastos.push({

        id:Date.now(),

        fecha,

        concepto,

        categoria,

        monto

    });

    guardarStorage();

    renderizarTodo();

    bootstrap.Modal.getInstance(
        document.getElementById("modalGasto")
    ).hide();

    limpiarGasto();

}
function limpiarGasto(){

    document.getElementById("fechaGasto").value="";

    document.getElementById("conceptoGasto").value="";

    document.getElementById("montoGasto").value="";

}
//=====================================
// RENDER PRINCIPAL
//=====================================

function renderizarTodo(){

    renderIngresos();

    renderGastos();

    actualizarResumen();

    if(typeof actualizarGraficos === "function"){
        actualizarGraficos();
    }

}
//=====================================
// RENDER INGRESOS
//=====================================

function renderIngresos(){

    tablaIngresos.innerHTML="";

    const texto = buscar.value.toLowerCase();

    ingresos
        .filter(i =>
            i.concepto.toLowerCase().includes(texto) ||
            i.fecha.includes(texto)
        )
        .sort((a,b)=> new Date(a.fecha)-new Date(b.fecha))
        .forEach(i=>{

            tablaIngresos.innerHTML += `
            <tr>

                <td>${i.fecha}</td>

                <td>${i.concepto}</td>

                <td>${formatoMoneda(i.monto)}</td>

                <td>

                    <button
                        class="btn btn-sm btn-editar"
                        onclick="editarIngreso(${i.id})">

                        <i class="fa-solid fa-pen"></i>

                    </button>

                    <button
                        class="btn btn-sm btn-eliminar"
                        onclick="eliminarIngreso(${i.id})">

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </td>

            </tr>
            `;

        });

}
//=====================================
// RENDER GASTOS
//=====================================

function renderGastos(){

    tablaGastos.innerHTML="";

    const texto = buscar.value.toLowerCase();

    gastos
        .filter(g=>

            g.concepto.toLowerCase().includes(texto)

            ||

            g.categoria.toLowerCase().includes(texto)

            ||

            g.fecha.includes(texto)

        )

        .sort((a,b)=> new Date(a.fecha)-new Date(b.fecha))

        .forEach(g=>{

            tablaGastos.innerHTML += `

            <tr>

                <td>${g.fecha}</td>

                <td>${g.concepto}</td>

                <td>

                    <span class="badge ${g.categoria.toLowerCase()}">

                        ${g.categoria}

                    </span>

                </td>

                <td>${formatoMoneda(g.monto)}</td>

                <td>

                    <button

                        class="btn btn-sm btn-editar"

                        onclick="editarGasto(${g.id})">

                        <i class="fa-solid fa-pen"></i>

                    </button>

                    <button

                        class="btn btn-sm btn-eliminar"

                        onclick="eliminarGasto(${g.id})">

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </td>

            </tr>

            `;

        });

}
//=====================================
// RESUMEN
//=====================================

function actualizarResumen(){

    const totalI = ingresos.reduce(

        (total,item)=> total + item.monto,

        0

    );

    const totalG = gastos.reduce(

        (total,item)=> total + item.monto,

        0

    );

    const saldo = totalI-totalG;

    totalIngresos.textContent=formatoMoneda(totalI);

    totalGastos.textContent=formatoMoneda(totalG);

    balance.textContent=formatoMoneda(saldo);

    cantidadMovimientos.textContent=

        ingresos.length + gastos.length;

    balance.classList.remove(

        "positivo",

        "negativo"

    );

    balance.classList.add(

        saldo>=0

        ?

        "positivo"

        :

        "negativo"

    );

}
//=====================================
// FORMATO MONEDA
//=====================================

function formatoMoneda(valor){

    return new Intl.NumberFormat(

        "es-PY",

        {

            style:"currency",

            currency:"PYG",

            minimumFractionDigits:0

        }

    ).format(valor);

}
//=====================================
// ELIMINAR INGRESO
//=====================================

function eliminarIngreso(id){

    if(!confirm("¿Desea eliminar este ingreso?")){
        return;
    }

    ingresos = ingresos.filter(i => i.id !== id);

    guardarStorage();

    renderizarTodo();

}

//=====================================
// ELIMINAR GASTO
//=====================================

function eliminarGasto(id){

    if(!confirm("¿Desea eliminar este gasto?")){
        return;
    }

    gastos = gastos.filter(g => g.id !== id);

    guardarStorage();

    renderizarTodo();

}
//=====================================
// EDITAR INGRESO
//=====================================

function editarIngreso(id){

    const ingreso = ingresos.find(i => i.id === id);

    if(!ingreso) return;

    movimientoEditando = {
        tipo:"ingreso",
        id
    };

    document.getElementById("editarFecha").value = ingreso.fecha;

    document.getElementById("editarConcepto").value = ingreso.concepto;

    document.getElementById("editarMonto").value = ingreso.monto;

    document.getElementById("editarCategoria").style.display = "none";

    new bootstrap.Modal(
        document.getElementById("modalEditar")
    ).show();

}
//=====================================
// EDITAR GASTO
//=====================================

function editarGasto(id){

    const gasto = gastos.find(g => g.id === id);

    if(!gasto) return;

    movimientoEditando = {
        tipo:"gasto",
        id
    };

    document.getElementById("editarFecha").value = gasto.fecha;

    document.getElementById("editarConcepto").value = gasto.concepto;

    document.getElementById("editarMonto").value = gasto.monto;

    document.getElementById("editarCategoria").style.display = "block";

    document.getElementById("editarCategoria").value = gasto.categoria;

    new bootstrap.Modal(
        document.getElementById("modalEditar")
    ).show();

}
//=====================================
// ACTUALIZAR MOVIMIENTO
//=====================================

function actualizarMovimiento(){

    if(!movimientoEditando) return;

    const fecha = document.getElementById("editarFecha").value;

    const concepto = document.getElementById("editarConcepto").value;

    const monto = parseFloat(
        document.getElementById("editarMonto").value
    );

    if(!fecha || !concepto || isNaN(monto)){

        alert("Complete todos los campos.");

        return;

    }

    if(movimientoEditando.tipo==="ingreso"){

        const ingreso = ingresos.find(
            i=>i.id===movimientoEditando.id
        );

        ingreso.fecha=fecha;
        ingreso.concepto=concepto;
        ingreso.monto=monto;

    }else{

        const gasto = gastos.find(
            g=>g.id===movimientoEditando.id
        );

        gasto.fecha=fecha;
        gasto.concepto=concepto;
        gasto.monto=monto;
        gasto.categoria=document.getElementById("editarCategoria").value;

    }

    guardarStorage();

    renderizarTodo();

    bootstrap.Modal.getInstance(
        document.getElementById("modalEditar")
    ).hide();

}
//=====================================
// STORAGE
//=====================================

function obtenerClave(){

    return `${STORAGE_KEY}_${mes.value}_${anio.value}`;

}

function guardarStorage(){

    const datos={

        ingresos,

        gastos,

        notas:notas.value

    };

    localStorage.setItem(

        obtenerClave(),

        JSON.stringify(datos)

    );

}
function cargarStorage(){

    const datos=JSON.parse(

        localStorage.getItem(obtenerClave())

    );

    if(datos){

        ingresos=datos.ingresos || [];

        gastos=datos.gastos || [];

        notas.value=datos.notas || "";

    }else{

        ingresos=[];

        gastos=[];

        notas.value="";

    }

}
//=====================================
// CAMBIAR PERIODO
//=====================================

function cambiarPeriodo(){

    cargarStorage();

    renderizarTodo();

}