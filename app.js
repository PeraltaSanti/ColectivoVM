document.addEventListener('DOMContentLoaded', () => {

    // --- 1. CONFIGURACIÓN DEL MAPA ---
    const latInicial = -33.651248;
    const lonInicial = -65.450809;
    const zoomInicial = 13;
    const mapa = L.map('mapa').setView([latInicial, lonInicial], zoomInicial);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapa);

    const kmlLayer = omnivore.kml('recorrido.kml')
        .on('ready', () => {
            mapa.fitBounds(kmlLayer.getBounds());
        })
        .addTo(mapa);

    // --- 2. LÓGICA INTELIGENTE DE HORARIOS ---
    
    const selector = document.getElementById('selector-parada');
    const displayHora = document.getElementById('hora-grande');
    const displayInfo = document.getElementById('info-extra');
    
    let datosHorarios = null;

    // Cargar el JSON
    async function cargarDatos() {
        try {
            const respuesta = await fetch('horarios.json');
            datosHorarios = await respuesta.json();
            
            // Llenar el selector con las paradas (usamos las del primer viaje de lunes)
            const paradas = Object.keys(datosHorarios.lunes_a_viernes[0]);
            llenarSelector(paradas);
            
        } catch (error) {
            console.error('Error cargando horarios:', error);
            displayInfo.textContent = "Error al cargar datos.";
        }
    }

    function llenarSelector(paradas) {
        selector.innerHTML = '<option value="" disabled selected>Selecciona una parada...</option>';
        paradas.forEach(parada => {
            const option = document.createElement('option');
            option.value = parada;
            option.textContent = parada;
            selector.appendChild(option);
        });
    }

    // --- EL CEREBRO DE LA APP ---
    function buscarProximoColectivo() {
        const paradaSeleccionada = selector.value;
        if (!paradaSeleccionada || !datosHorarios) return;

        const ahora = new Date();
        const diaSemana = ahora.getDay(); // 0=Domingo, 1=Lunes, ... 6=Sábado
        const horaActual = ahora.getHours();
        const minutosActuales = ahora.getMinutes();
        
        // Convertir la hora actual a minutos totales (ej: 08:17 = 497 minutos)
        const minutosTotalesAhora = (horaActual * 60) + minutosActuales;

        // Determinar qué lista usar según el día
        let listaViajes = [];
        let nombreDia = "";

        if (diaSemana === 0) {
            listaViajes = datosHorarios.domingos;
            nombreDia = "Domingo";
        } else if (diaSemana === 6) {
            listaViajes = datosHorarios.sabados;
            nombreDia = "Sábado";
        } else {
            listaViajes = datosHorarios.lunes_a_viernes;
            nombreDia = "Lunes a Viernes";
        }

        let proximoHorario = null;

        // Recorrer todos los viajes del día
        for (let viaje of listaViajes) {
            const horarioTexto = viaje[paradaSeleccionada]; // Ej: "08:27" o null

            if (horarioTexto) {
                // Convertir horario del JSON a minutos
                const [h, m] = horarioTexto.split(':').map(Number);
                let minutosViaje = (h * 60) + m;

                // Caso especial: Horarios de madrugada (ej: 00:15)
                // Si el horario es menor a 4:00 AM, asumimos que es del día siguiente (sumamos 24hs)
                if (h < 4) minutosViaje += 24 * 60;

                // Si este colectivo pasa DESPUÉS de la hora actual...
                if (minutosViaje > minutosTotalesAhora) {
                    proximoHorario = horarioTexto;
                    break; // ¡Lo encontramos! Cortamos el bucle.
                }
            }
        }

        // Mostrar resultado
        if (proximoHorario) {
            displayHora.textContent = proximoHorario;
            displayInfo.textContent = `Horario para hoy (${nombreDia})`;
            displayHora.style.color = "#005a9c"; // Azul
        } else {
            displayHora.textContent = "---";
            displayInfo.textContent = `No hay más servicios por hoy (${nombreDia})`;
            displayHora.style.color = "#d32f2f"; // Rojo
        }
    }

    // Evento: Cuando el usuario cambia la parada en el menú
    selector.addEventListener('change', buscarProximoColectivo);

    // Opcional: Actualizar automáticamente cada 30 segundos por si cambia la hora
    setInterval(() => {
        if(selector.value) buscarProximoColectivo();
    }, 30000);

    // Iniciar
    cargarDatos();
});
