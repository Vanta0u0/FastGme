document.addEventListener('DOMContentLoaded', () => {
    const btnCirculo = document.getElementById('btn-circulo');
    const modalInicio = document.getElementById('modal-inicio-juego');
    const modalFin = document.getElementById('modal-fin-juego');
    const btnIniciar = document.getElementById('btn-iniciar');
    const btnReiniciar = document.getElementById('btn-reiniciar');
    const temporizadorDisplay = document.getElementById('temporizador');
    const aciertosDisplay = document.getElementById('conteo-aciertos');
    const fallosDisplay = document.getElementById('conteo-fallos-exterior');
    const finalAciertosDisplay = document.getElementById('final-aciertos');
    const finalFallosDisplay = document.getElementById('final-fallos');
    const tiempoReaccionEstimadoDisplay = document.getElementById('tiempo-reaccion-estimado');

    // Elementos del nuevo diseño móvil
    const principalColumna = document.getElementById('principal-columna');
    const explicacionColumna = document.getElementById('explicacion-columna');
    const novedadesColumna = document.getElementById('novedades-columna');
    const btnAbrirExplicacion = document.getElementById('btn-abrir-explicacion');
    const btnAbrirNovedades = document.getElementById('btn-abrir-novedades');
    const btnCerrarColumnas = document.querySelectorAll('.btn-cerrar-columna');


    let aciertos = 0;
    let fallos = 0;
    let tiempoInicio = 0;
    let tiempoTotalReaccion = 0;
    let movimientosContados = 0;
    let juegoActivo = false;
    let tiempoRestante = 60; // 60 segundos
    let intervaloJuego;
    let timeoutMovimiento;

    // --- LÓGICA DE JUEGO ---

    function iniciarJuego() {
        aciertos = 0;
        fallos = 0;
        tiempoTotalReaccion = 0;
        movimientosContados = 0;
        tiempoRestante = 60;
        juegoActivo = true;

        modalInicio.style.display = 'none';
        modalFin.style.display = 'none';
        btnCirculo.classList.remove('oculto');
        
        aciertosDisplay.textContent = 'Aciertos: 0';
        fallosDisplay.textContent = 'Fallos Totales: 0';
        temporizadorDisplay.textContent = '1:00';

        iniciarTemporizador();
        moverCirculo();

        document.body.addEventListener('click', manejarFalloGeneral);
    }

    function terminarJuego() {
        juegoActivo = false;
        clearInterval(intervaloJuego);
        clearTimeout(timeoutMovimiento);
        btnCirculo.classList.add('oculto');
        document.body.removeEventListener('click', manejarFalloGeneral);

        // Calcular promedio
        const promedio = movimientosContados > 0 ? (tiempoTotalReaccion / movimientosContados) : 0;
        
        // Mostrar modal de fin de juego
        finalAciertosDisplay.textContent = aciertos;
        finalFallosDisplay.textContent = fallos;
        tiempoReaccionEstimadoDisplay.textContent = `${promedio.toFixed(2)} ms`;
        
        modalFin.style.display = 'flex';
    }

    function iniciarTemporizador() {
        intervaloJuego = setInterval(() => {
            tiempoRestante--;
            const minutos = Math.floor(tiempoRestante / 60);
            const segundos = tiempoRestante % 60;
            temporizadorDisplay.textContent = `${minutos}:${segundos < 10 ? '0' : ''}${segundos}`;

            if (tiempoRestante <= 0) {
                terminarJuego();
            }
        }, 1000);
    }

    function generarPosicion(elemento) {
        const w = window.innerWidth;
        const h = window.innerHeight;

        const size = elemento.offsetWidth;

        // Calculamos posiciones aleatorias asegurando que no se salga de la pantalla
        const x = Math.floor(Math.random() * (w - size - 20)) + 10;
        const y = Math.floor(Math.random() * (h - size - 20)) + 10;

        elemento.style.left = `${x}px`;
        elemento.style.top = `${y}px`;
    }

    function moverCirculo() {
        if (!juegoActivo) return;

        // Mueve el círculo a una nueva posición
        generarPosicion(btnCirculo);
        tiempoInicio = Date.now();
        
        // Vuelve a moverse automáticamente después de 1000ms (1 segundo)
        timeoutMovimiento = setTimeout(moverCirculo, 1000);
    }

    function manejarAcierto() {
        if (!juegoActivo) return;

        // Calcular tiempo de reacción
        const tiempoFin = Date.now();
        const tiempoReaccion = tiempoFin - tiempoInicio;

        tiempoTotalReaccion += tiempoReaccion;
        movimientosContados++;

        aciertos++;
        aciertosDisplay.textContent = `Aciertos: ${aciertos}`;

        // Detener el movimiento automático y moverlo de nuevo inmediatamente
        clearTimeout(timeoutMovimiento);
        moverCirculo();
    }

    function manejarFalloGeneral(e) {
        if (!juegoActivo) return;

        // Si el clic no fue en el botón del círculo, cuenta como fallo
        if (e.target !== btnCirculo) {
            fallos++;
            fallosDisplay.textContent = `Fallos Totales: ${fallos}`;
            
            // Si el fallo es rápido, reiniciamos el movimiento para mantener el flujo
            clearTimeout(timeoutMovimiento);
            moverCirculo();
        }
    }

    // --- LÓGICA DE EVENTOS ---
    btnCirculo.addEventListener('click', manejarAcierto);
    btnIniciar.addEventListener('click', iniciarJuego);
    btnReiniciar.addEventListener('click', iniciarJuego);


    // --- LÓGICA RESPONSIVA MÓVIL (NUEVA) ---

    // Función para abrir una columna específica
    function abrirColumna(columna) {
        // En móvil, ocultar la columna principal temporalmente
        if (window.innerWidth <= 768) {
            principalColumna.style.display = 'none';
        }

        // Ocultar las otras columnas por si acaso
        explicacionColumna.style.display = 'none';
        novedadesColumna.style.display = 'none';

        // Mostrar la columna solicitada
        columna.style.display = 'flex'; 
        columna.style.flexDirection = 'column';
    }

    // Función para cerrar las columnas y volver a la principal
    function cerrarColumna() {
        // Ocultar las columnas laterales
        explicacionColumna.style.display = 'none';
        novedadesColumna.style.display = 'none';
        
        // Mostrar la columna principal (Centro) solo en móvil, en escritorio ya está visible
        if (window.innerWidth <= 768) {
            principalColumna.style.display = 'flex';
            principalColumna.style.flexDirection = 'column';
        }
    }

    // Event listeners para abrir
    btnAbrirExplicacion.addEventListener('click', () => {
        abrirColumna(explicacionColumna);
    });

    btnAbrirNovedades.addEventListener('click', () => {
        abrirColumna(novedadesColumna);
    });

    // Event listeners para cerrar
    btnCerrarColumnas.forEach(btn => {
        btn.addEventListener('click', cerrarColumna);
    });
});
