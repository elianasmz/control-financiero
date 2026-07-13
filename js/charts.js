// =====================================
// VARIABLES
// =====================================

let graficoBarras = null;
let graficoCategorias = null;

function esModoOscuro() {
    return document.body.classList.contains("dark");
}

function colorTexto() {
    return esModoOscuro() ? "#f2f2f2" : "#333";
}

function colorGrid() {
    return esModoOscuro() ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
}

// =====================================
// ACTUALIZAR GRAFICOS
// =====================================

function actualizarGraficos() {
    actualizarGraficoBarras();
    actualizarGraficoCategorias();
}

// =====================================
// GRAFICO INGRESOS VS GASTOS
// =====================================

function actualizarGraficoBarras() {
    const canvas = document.getElementById("graficoBarras");
    const empty = document.getElementById("emptyBarras");
    if (!canvas) return;

    const totalI = ingresos.reduce((t, i) => t + i.monto, 0);
    const totalG = gastos.reduce((t, g) => t + g.monto, 0);
    const sinDatos = totalI === 0 && totalG === 0;

    canvas.classList.toggle("d-none", sinDatos);
    empty.classList.toggle("d-none", !sinDatos);

    if (sinDatos) {
        if (graficoBarras) { graficoBarras.destroy(); graficoBarras = null; }
        return;
    }

    if (graficoBarras) graficoBarras.destroy();

    graficoBarras = new Chart(canvas, {
        type: "bar",
        data: {
            labels: ["Ingresos", "Gastos"],
            datasets: [{
                label: "Monto",
                data: [totalI, totalG],
                backgroundColor: ["#43A047", "#E53935"],
                borderRadius: 12,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => formatoMoneda(ctx.raw)
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: colorTexto() },
                    grid: { color: colorGrid() }
                },
                x: {
                    ticks: { color: colorTexto() },
                    grid: { display: false }
                }
            }
        }
    });
}

// =====================================
// GRAFICO CATEGORIAS
// =====================================

function actualizarGraficoCategorias() {
    const canvas = document.getElementById("graficoCategorias");
    const empty = document.getElementById("emptyCategorias");
    if (!canvas) return;

    const categorias = {};
    gastos.forEach(g => {
        categorias[g.categoria] = (categorias[g.categoria] || 0) + g.monto;
    });

    const sinDatos = Object.keys(categorias).length === 0;

    canvas.classList.toggle("d-none", sinDatos);
    empty.classList.toggle("d-none", !sinDatos);

    if (sinDatos) {
        if (graficoCategorias) { graficoCategorias.destroy(); graficoCategorias = null; }
        return;
    }

    if (graficoCategorias) graficoCategorias.destroy();

    const labels = Object.keys(categorias);
    const colores = labels.map(l => COLORES_CATEGORIAS[l] || "#78909C");

    graficoCategorias = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels,
            datasets: [{
                data: Object.values(categorias),
                backgroundColor: colores,
                borderWidth: 2,
                borderColor: esModoOscuro() ? "#2c2c2c" : "#fff"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "55%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: { color: colorTexto(), padding: 15 }
                },
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = Math.round((ctx.raw / total) * 100);
                            return `${ctx.label}: ${formatoMoneda(ctx.raw)} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

function hayMovimientos() {
    return ingresos.length > 0 || gastos.length > 0;
}
