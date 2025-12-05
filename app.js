document.addEventListener('DOMContentLoaded', () => {

    // Referencias a los elementos de la pantalla
    const selector = document.getElementById('selector-parada');
    const displayHora = document.getElementById('hora-grande');
    const displayInfo = document.getElementById('info-extra');
    
    let datosHorarios = null;

    // --- 1. CARGAR DATOS ---
    async function cargarDatos() {
        try {
            // Intentamos cargar el archivo
            const respuesta = await fetch('horarios.json');
            
            if (!respuesta.ok) {
                throw new Error("No se pudo encontrar el archivo horarios.json");
            }

            datosHorarios = await respuesta.json();
            
            // Verificamos que existan datos de Lunes a Viernes para sacar los nombres
            if (datosHorarios.lunes_a_viernes && datosHorarios.lunes_a_viernes.length > 0) {
                // Obtenemos los nombres de las columnas (las paradas) del primer viaje
                const paradas = Object.keys(datosHorarios.lunes_a_viernes[0]);
                llenarSelector(paradas);
            } else {
                displayInfo.textContent = "El archivo de horarios parece estar vacío.";
            }
            
        } catch (error) {
            console.error('Error:', error);
            selector.innerHTML = '<option>Error al cargar</option>';
            displayInfo.textContent = "Asegúrate de ejecutar python -m http.server";
        }
    }

    // --- 2. LLENAR LA LISTA DESPLEGABLE ---
    function llenarSelector(paradas) {
        // Limpiamos el "Cargando..."
        selector.innerHTML = '<option value="" disabled selected>Toca aquí para elegir...</option>';
        
        paradas.forEach(parada => {
            const option = document.createElement('option');
            option.value = parada;
            option.textContent = parada;
            selector.appendChild(option);
        });
    }

    // --- 3. CEREBRO: BUSCAR EL HORARIO ---
    function buscarProximoColectivo() {
        const paradaSeleccionada = selector.value;
        
        // Si no hay datos o no eligió parada, no hacemos nada
        if (!paradaSeleccionada || !datosHorarios) return;

        const ahora = new Date();
        const diaSemana = ahora.getDay(); // 0=Domingo, 1=Lunes... 6=Sábado
        const horaActual = ahora.getHours();
        const minutosActuales = ahora.getMinutes();
        
        // Convertimos la hora actual a "minutos totales" para comparar fácil
        // Ejemplo: 01:00 AM = 60 minutos.
        const minutosTotalesAhora = (horaActual * 60) + minutosActuales;

        // Elegimos la lista correcta según el día
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

        // Buscamos en la lista
        for (let viaje of listaViajes) {
            const horarioTexto = viaje[paradaSeleccionada]; // Ej: "08:27" o null

            if (horarioTexto && horarioTexto !== "---") {
                // Separamos hora y minutos (Ej: "08:27" -> h=8, m=27)
                const [hStr, mStr] = horarioTexto.split(':');
                const h = parseInt(hStr);
                const m = parseInt(mStr);

                let minutosViaje = (h * 60) + m;

                // TRUCO PARA LA MADRUGADA:
                // Si el colectivo pasa a las 00:15, eso es numéricamente menor que las 23:00.
                // Si el horario es menor a las 4 AM, le sumamos 24 horas (1440 minutos) 
                // para que la matemática funcione y lo considere "después" de la noche actual.
                if (h < 4) {
                    minutosViaje += 24 * 60;
                }

                // Si este colectivo pasa DESPUÉS de ahora...
                if (minutosViaje > minutosTotalesAhora) {
                    proximoHorario = horarioTexto;
                    break; // ¡Encontrado! Dejamos de buscar.
                }
            }
        }

        // Mostrar resultado en pantalla
        if (proximoHorario) {
            displayHora.textContent = proximoHorario;
            displayInfo.textContent = `Próximo servicio (${nombreDia})`;
            displayHora.style.color = "#005a9c";
        } else {
            displayHora.textContent = "---";
            displayInfo.textContent = `No hay más servicios por hoy (${nombreDia})`;
            displayHora.style.color = "#d32f2f";
        }
    }

    // Escuchar cuando el usuario cambia la opción
    selector.addEventListener('change', buscarProximoColectivo);

    // Actualizar cada 30 segundos por si cambia la hora mientras mira la pantalla
    setInterval(() => {
        if(selector.value) buscarProximoColectivo();
    }, 30000);

    // ¡Arrancar!
    cargarDatos();
});
