// Espera a que todo el contenido HTML esté cargado
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. CONFIGURACIÓN DEL MAPA ---
    
    // Coordenadas iniciales (tomada de la primera parada de Línea A [cite: 1031, 1035])
    const latInicial = -33.651248;
    const lonInicial = -65.450809;
    const zoomInicial = 14;

    // Inicializa el mapa en el div "mapa"
    const mapa = L.map('mapa').setView([latInicial, lonInicial], zoomInicial);

    // Añade la capa base de OpenStreetMap (gratuita)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapa);

    // --- 2. CARGAR RECORRIDO KML ---
    
    // Crea una capa KML. Leaflet-omnivore la leerá.
    // El KML que me diste  incluye la Línea A [cite: 901] y sus paradas[cite: 1030].
    const kmlLayer = omnivore.kml('recorrido.kml')
        .on('ready', () => {
            // Opcional: una vez que carga, ajusta el mapa para que muestre todo
            mapa.fitBounds(kmlLayer.getBounds());
            
            // Opcional: Filtra para mostrar solo la Línea A
            // Si el KML es muy grande, esto puede ser útil.
            // Por ahora, muestra todo.
        })
        .addTo(mapa);

    // --- 3. LÓGICA DE HORARIOS ---
    
    // Referencias a los botones
    const btnLav = document.getElementById('btn-lav');
    const btnSab = document.getElementById('btn-sab');
    const btnDom = document.getElementById('btn-dom');
    
    // Referencia al contenedor de la tabla
    const tabla = document.getElementById('tabla-horarios');
    
    let datosHorarios = null; // Variable para guardar los datos del JSON

    // Función para buscar y cargar los datos del archivo JSON
    async function cargarDatos() {
        try {
            const respuesta = await fetch('horarios.json');
            if (!respuesta.ok) {
                throw new Error(`Error HTTP: ${respuesta.status}`);
            }
            datosHorarios = await respuesta.json();
            
            // Carga los horarios de Lunes a Viernes por defecto
            mostrarHorarios('lunes_a_viernes');
        
        } catch (error) {
            console.error('No se pudieron cargar los horarios:', error);
            tabla.innerHTML = '<tr><td style="text-align:left; padding:20px;">Error al cargar los horarios. Asegúrate de que el archivo <strong>horarios.json</strong> esté en la misma carpeta y no tenga errores.</td></tr>';
        }
    }

    // Función para generar y mostrar la tabla de horarios
    function mostrarHorarios(dia) {
        if (!datosHorarios || !datosHorarios[dia]) {
             tabla.innerHTML = '<tr><td>No hay datos para este día.</td></tr>';
             return; // No hacer nada si los datos no han cargado
        }

        const datosDelDia = datosHorarios[dia];
        
        // Limpia la tabla anterior
        tabla.innerHTML = ''; 

        // --- Crear la cabecera (thead) ---
        const thead = document.createElement('thead');
        const trHead = document.createElement('tr');
        
        // Obtiene los nombres de las columnas (paradas) del primer viaje
        const cabeceras = Object.keys(datosDelDia[0]); 
        
        cabeceras.forEach(nombreParada => {
            const th = document.createElement('th');
            th.textContent = nombreParada;
            trHead.appendChild(th);
        });
        thead.appendChild(trHead);
        tabla.appendChild(thead);

        // --- Crear el cuerpo (tbody) ---
        const tbody = document.createElement('tbody');
        
        // Recorre cada fila (viaje)
        datosDelDia.forEach(viaje => {
            const trBody = document.createElement('tr');
            
            // Recorre cada columna (parada) en esa fila
            cabeceras.forEach(parada => {
                const td = document.createElement('td');
                const hora = viaje[parada];
                
                // Si la hora es null (celda vacía), pone "---"
                td.textContent = hora === null ? '---' : hora;
                trBody.appendChild(td);
            });
            
            tbody.appendChild(trBody);
        });
        tabla.appendChild(tbody);
    }
    
    // --- 4. ASIGNAR EVENTOS A BOTONES ---
    
    btnLav.addEventListener('click', () => {
        mostrarHorarios('lunes_a_viernes');
        btnLav.classList.add('activo');
        btnSab.classList.remove('activo');
        btnDom.classList.remove('activo');
    });
    
    btnSab.addEventListener('click', () => {
        mostrarHorarios('sabados');
        btnLav.classList.remove('activo');
        btnSab.classList.add('activo');
        btnDom.classList.remove('activo');
    });
    
    btnDom.addEventListener('click', () => {
        mostrarHorarios('domingos');
        btnLav.classList.remove('activo');
        btnSab.classList.remove('activo');
        btnDom.classList.add('activo');
    });

    // Inicia la carga de datos
    cargarDatos();

});