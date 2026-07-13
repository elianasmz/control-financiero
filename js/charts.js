//=====================================
// VARIABLES
//=====================================

let graficoBarras = null;
let graficoCategorias = null;

//=====================================
// ACTUALIZAR GRAFICOS
//=====================================

function actualizarGraficos(){

    actualizarGraficoBarras();

    actualizarGraficoCategorias();

}
//=====================================
// GRAFICO INGRESOS VS GASTOS
//=====================================

function actualizarGraficoBarras(){

    const canvas = document.getElementById("graficoBarras");

    if(!canvas) return;

    if(graficoBarras){

        graficoBarras.destroy();

    }

    const totalIngresos = ingresos.reduce(

        (total,item)=>total+item.monto,

        0

    );

    const totalGastos = gastos.reduce(

        (total,item)=>total+item.monto,

        0

    );

    graficoBarras = new Chart(canvas,{

        type:"bar",

        data:{

            labels:[

                "Ingresos",

                "Gastos"

            ],

            datasets:[{

                label:"Monto",

                data:[

                    totalIngresos,

                    totalGastos

                ],

                backgroundColor:[

                    "#43A047",

                    "#E53935"

                ],

                borderRadius:12

            }]

        },

        options:{

            responsive:true,

            maintainAspectRatio:false,

            plugins:{

                legend:{

                    display:false

                }

            },

            scales:{

                y:{

                    beginAtZero:true

                }

            }

        }

    });

}
//=====================================
// GRAFICO CATEGORIAS
//=====================================

function actualizarGraficoCategorias(){

    const canvas=document.getElementById("graficoCategorias");

    if(!canvas) return;

    if(graficoCategorias){

        graficoCategorias.destroy();

    }

    const categorias={};

    gastos.forEach(g=>{

        if(!categorias[g.categoria]){

            categorias[g.categoria]=0;

        }

        categorias[g.categoria]+=g.monto;

    });

    graficoCategorias = new Chart(canvas,{

        type:"pie",

        data:{

            labels:Object.keys(categorias),

            datasets:[{

                data:Object.values(categorias),

                backgroundColor:[

                    "#FF7043",

                    "#42A5F5",

                    "#66BB6A",

                    "#EC407A",

                    "#AB47BC",

                    "#26A69A",

                    "#FFA726",

                    "#78909C"

                ]

            }]

        },

        options:{

            responsive:true,

            maintainAspectRatio:false,

            plugins:{

                legend:{

                    position:"bottom"

                }

            }

        }

    });

}
//=====================================
// SIN DATOS
//=====================================

function hayMovimientos(){

    return ingresos.length>0 || gastos.length>0;

}