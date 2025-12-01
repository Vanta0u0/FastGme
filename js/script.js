const MOBILE_BREAKPOINT = 768; 

// --- DIFICULTAD BASE (PC/Mouse) ---
const PC_INACTIVITY_MS = 1000; // 1.00 segundo (PC)
const CIRCLE_SIZE_PC = '80px';

// --- DIFICULTAD ESTRICTA (Móvil/Táctil) ---
const MOBILE_INACTIVITY_MS = 750; // 0.75 segundos (Móvil)
const CIRCLE_SIZE_MOBILE = '55px';

// -----------------------------------------------------------------

let aciertos = 0;
let fallos = 0;
let movementTimerId; 
let countdownTimerId; 
let tiempoRestante = 60; 
let juegoActivo = false; 
const RETRASO_INICIO = 1000;

// Variables para el Cálculo del Tiempo de Reacción
let currentInactivityTime; 
let tiempoMovimiento; // Usado para el cálculo de reacción Pura (Móvil)
let sumaTiemposReaccion = 0; 
const UMBRAL_CIERRE_EXTREMO = 90.00;
let tiempoInicioIntentoPC; // Usado para el cálculo de reacción Estándar (PC)

// Constantes de Estilo
const COLOR_ACENTO = '#00FFC0';
const COLOR_VERDE_MOVIMIENTO = '#00CC00'; 
const COLOR_AZUL_CELEBRACION_FLASH = 'rgba(0, 191, 255, 0.5)';
const COLOR_FONDO_FALLO = 'rgba(255, 0, 0, 0.5)';
const COLOR_FONDO_BASE = '#121212'; 
const SHADOW_ACENTO = '0 0 15px ' + COLOR_ACENTO;
const SHADOW_VERDE = '0 0 15px ' + COLOR_VERDE_MOVIMIENTO;

// -----------------------------------------------------
// FUNCIONES DE CÁLCULO DE PUNTUACIÓN
// -----------------------------------------------------

function calcularTiempoReaccionPromedio() {
    if (aciertos === 0) {
        return 9999.00.toFixed(2);
    }
    const promedio = sumaTiemposReaccion / aciertos;
    return promedio.toFixed(2);
}

// -----------------------------------------------------
// LÓGICA DE DIFICULTAD CONDICIONAL
// -----------------------------------------------------

function aplicarAjusteMovil(botonCirculo) {
    const circulo = document.querySelector('#btn-circulo'); 
    
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
        currentInactivityTime = MOBILE_INACTIVITY_MS;
        if(circulo) circulo.style.width = CIRCLE_SIZE_MOBILE;
        if(circulo) circulo.style.height = CIRCLE_SIZE_MOBILE;
    } else {
        currentInactivityTime = PC_INACTIVITY_MS;
        if(circulo) circulo.style.width = CIRCLE_SIZE_PC;
        if(circulo) circulo.style.height = CIRCLE_SIZE_PC;
    }
    if (typeof centrarCirculo === 'function') centrarCirculo();
}

// -----------------------------------------------------

document.addEventListener('DOMContentLoaded', function() {
    
    const modalInicioJuego = document.querySelector('#modal-inicio-juego');
    const btnIniciar = document.querySelector('#btn-iniciar');
    const conteoAciertosDisplay = document.querySelector('#conteo-aciertos');
    const conteoFallosDisplayExterno = document.querySelector('#conteo-fallos-exterior');
    const conteoFallosDisplayInterno = document.querySelector('#conteo-fallos');
    const temporizadorDisplay = document.querySelector('#temporizador');
    const botonCirculo = document.querySelector('#btn-circulo'); 
    const cuerpoPagina = document.querySelector('body');
    const mainContainer = document.querySelector('#main-container'); 
    const modalFinJuego = document.querySelector('#modal-fin-juego');
    const modalContenidoFin = document.querySelector('#modal-fin-juego .modal-contenido'); 
    const finalAciertosDisplay = document.querySelector('#final-aciertos');
    const finalFallosDisplay = document.querySelector('#final-fallos');
    const btnReiniciar = document.querySelector('#btn-reiniciar');
    const tiempoReaccionEstimadoDisplay = document.querySelector('#tiempo-reaccion-estimado');
    const principalColumna = document.getElementById('principal-columna');

    const elementosDelJuego = [
        conteoAciertosDisplay, conteoFallosDisplayExterno, temporizadorDisplay, 
        botonCirculo, mainContainer
    ];
    
    const explicacionColumna = document.getElementById('explicacion-columna');
    const novedadesColumna = document.getElementById('novedades-columna');
    const btnCerrarColumnas = document.querySelectorAll('.btn-cerrar-columna');

    function abrirColumna(columna) {
        if (window.innerWidth <= MOBILE_BREAKPOINT) { principalColumna.style.display = 'none'; }
        explicacionColumna.style.display = 'none';
        novedadesColumna.style.display = 'none';
        columna.style.display = 'flex'; 
        columna.style.flexDirection = 'column';
    }

    function cerrarColumna() {
        explicacionColumna.style.display = 'none';
        novedadesColumna.style.display = 'none';
        if (window.innerWidth <= MOBILE_BREAKPOINT) { principalColumna.style.display = 'flex'; principalColumna.style.flexDirection = 'column'; }
    }
    
    function centrarCirculo() {
        botonCirculo.style.position = 'fixed'; 

        const anchoVentana = window.innerWidth;
        const altoVentana = window.innerHeight;
        const anchoCirculo = botonCirculo.clientWidth; 
        const altoCirculo = botonCirculo.clientHeight;

        const nuevoX = (anchoVentana / 2) - (anchoCirculo / 2);
        const nuevoY = (altoVentana / 2) - (altoCirculo / 2);
        
        botonCirculo.style.left = `${nuevoX}px`;
        botonCirculo.style.top = `${nuevoY}px`;
    }

    function moverCirculoAleatoriamente() {
        const anchoMaximo = window.innerWidth - botonCirculo.clientWidth;
        const altoMaximo = window.innerHeight - botonCirculo.clientHeight;

        const nuevoX = Math.floor(Math.random() * anchoMaximo);
        const nuevoY = Math.floor(Math.random() * altoMaximo);
        
        botonCirculo.style.position = 'fixed'; 
        botonCirculo.style.left = `${nuevoX}px`;
        botonCirculo.style.top = `${nuevoY}px`;
        
        if (window.innerWidth <= MOBILE_BREAKPOINT) {
            tiempoMovimiento = performance.now(); 
        } else {
            tiempoInicioIntentoPC = performance.now(); 
        }
    }
    
    function inicializarPantalla() {
        elementosDelJuego.forEach(el => el.classList.add('oculto'));
        
        aplicarAjusteMovil(botonCirculo);
        
        window.addEventListener('resize', () => aplicarAjusteMovil(botonCirculo));
        
        actualizarContadores();
        actualizarTemporizadorDisplay(); 
    }

    function iniciarJuego() {
        elementosDelJuego.forEach(el => el.classList.remove('oculto'));
        modalInicioJuego.style.display = 'none';
        iniciarTemporizadorCountdown(); 
    }

    function actualizarContadores() {
        conteoAciertosDisplay.textContent = `Aciertos: ${aciertos}`;
        conteoFallosDisplayExterno.textContent = `Fallos Totales: ${fallos}`;
        conteoFallosDisplayInterno.textContent = `Fallos: ${fallos}`;
    }

    function actualizarTemporizadorDisplay() {
        const minutos = Math.floor(tiempoRestante / 60);
        const segundos = tiempoRestante % 60;
        const segundosFormateados = segundos < 10 ? `0${segundos}` : segundos;
        temporizadorDisplay.textContent = `${minutos}:${segundosFormateados}`;

        temporizadorDisplay.style.color = tiempoRestante <= 10 && tiempoRestante > 0 ? 'red' : '#FFFFFF';
        temporizadorDisplay.style.borderColor = tiempoRestante <= 10 && tiempoRestante > 0 ? 'red' : '#FFFFFF';
    }

    function iniciarTemporizadorCountdown() {
        countdownTimerId = setInterval(() => {
            if (tiempoRestante > 0) {
                tiempoRestante--;
                actualizarTemporizadorDisplay();
            } else {
                clearInterval(countdownTimerId);
                finalizarJuego();
            }
        }, 1000); 
        
        juegoActivo = false; 
        
        setTimeout(() => {
            juegoActivo = true;
            moverCirculoAleatoriamente(); 
            resetMovementTimer();
        }, RETRASO_INICIO); 
    }

    function finalizarJuego() {
        juegoActivo = false; 
        temporizadorDisplay.textContent = "¡FIN!";
        temporizadorDisplay.style.color = COLOR_ACENTO;
        temporizadorDisplay.style.borderColor = COLOR_ACENTO;
        
        clearTimeout(movementTimerId); 
        botonCirculo.style.display = 'none';

        const tiempoReaccionFinal = calcularTiempoReaccionPromedio(); 
        const tiempoEstimadoNumber = parseFloat(tiempoReaccionFinal); 

        if (tiempoEstimadoNumber <= UMBRAL_CIERRE_EXTREMO) { 
            modalFinJuego.style.display = 'flex';
            modalFinJuego.style.pointerEvents = 'none'; 
            
            modalContenidoFin.innerHTML = `
                <div style="color: #FFD700; border: 2px solid #FFD700; border-radius: 10px; padding: 20px; box-shadow: 0 0 20px #FFD700;">
                    <h2>¡TIEMPO DE REACCIÓN EXTREMO!</h2>
                    <p>Tu tiempo de reacción promedio fue de: <span style="font-size: 1.5em; font-weight: bold;">${tiempoReaccionFinal} ms</span></p>
                    <p>El juego se ha detenido automáticamente por detección de un tiempo de reacción anormal.</p>
                    <p style="font-size: 0.9em; margin-top: 20px;">Para volver a jugar, debes recargar la página.</p>
                </div>
            `;
            
        } else {
            finalAciertosDisplay.textContent = aciertos;
            finalFallosDisplay.textContent = fallos;
            tiempoReaccionEstimadoDisplay.textContent = `${tiempoReaccionFinal} ms`;
            
            modalContenidoFin.innerHTML = `
                <h2>🎉 Juego Terminado 🎉</h2>
                <div class="resultados-finales">
                    <p>Aciertos totales: <span id="final-aciertos">${aciertos}</span></p>
                    <p>Fallos totales: <span id="final-fallos">${fallos}</span></p>
                    <p>Tiempo de Reacción Promedio:</p>
                    <h3 id="tiempo-reaccion-estimado">${tiempoReaccionFinal} ms</h3>
                </div>
                <button id="btn-reiniciar" class="btn-principal" style="display: block;">REINICIAR JUEGO</button>
            `;

            document.getElementById('btn-reiniciar').addEventListener('click', reiniciarJuego);

            modalFinJuego.style.pointerEvents = 'auto'; 
            modalFinJuego.style.display = 'flex';
        }
    }

    function reiniciarJuego() {
        aciertos = 0; fallos = 0; tiempoRestante = 60; sumaTiemposReaccion = 0; 
        clearTimeout(movementTimerId); clearInterval(countdownTimerId); 
        modalFinJuego.style.display = 'none';
        botonCirculo.style.display = 'block';
        
        aplicarAjusteMovil(botonCirculo); 
        centrarCirculo();

        actualizarContadores();
        actualizarTemporizadorDisplay();
        iniciarTemporizadorCountdown(); 
    }

    function resetMovementTimer() {
        clearTimeout(movementTimerId);
        
        movementTimerId = setTimeout(() => {
            moverCirculoAleatoriamente();
            botonCirculo.style.backgroundColor = COLOR_ACENTO; 
            botonCirculo.style.boxShadow = SHADOW_ACENTO;
            resetMovementTimer(); 
        }, currentInactivityTime);
    }
    
    function manejarAcierto() {
        if (tiempoRestante === 0 || !juegoActivo) return;

        let tiempoReaccion;
        
        if (window.innerWidth <= MOBILE_BREAKPOINT) {
            tiempoReaccion = performance.now() - tiempoMovimiento;
        } else {
            tiempoReaccion = performance.now() - tiempoInicioIntentoPC;
        }

        sumaTiemposReaccion += tiempoReaccion; 
        
        aciertos++;
        conteoAciertosDisplay.textContent = `Aciertos: ${aciertos}`;
        conteoAciertosDisplay.style.backgroundColor = '#202020';
        
        botonCirculo.style.backgroundColor = COLOR_VERDE_MOVIMIENTO;
        botonCirculo.style.boxShadow = SHADOW_VERDE;
        
        if (aciertos % 25 === 0) {
            cuerpoPagina.style.backgroundColor = COLOR_AZUL_CELEBRACION_FLASH;
        }
        
        moverCirculoAleatoriamente(); 
        resetMovementTimer(); 
        
        setTimeout(() => {
            cuerpoPagina.style.backgroundColor = COLOR_FONDO_BASE;
            conteoAciertosDisplay.style.backgroundColor = 'transparent';
        }, 150);
        
        setTimeout(() => {
            botonCirculo.style.backgroundColor = COLOR_ACENTO;
            botonCirculo.style.boxShadow = SHADOW_ACENTO; 
        }, 150); 
    }

    function manejarFallo(event) {
        if (tiempoRestante === 0 || !juegoActivo) return;

        if (event.target.id !== 'btn-circulo') {
            fallos++;
            
            conteoFallosDisplayInterno.textContent = `Fallos: ${fallos}`;
            conteoFallosDisplayExterno.textContent = `Fallos Totales: ${fallos}`; 
            
            cuerpoPagina.style.backgroundColor = COLOR_FONDO_FALLO;
            conteoFallosDisplayExterno.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
            
            moverCirculoAleatoriamente(); 
            resetMovementTimer(); 
            
            botonCirculo.style.backgroundColor = COLOR_ACENTO; 
            botonCirculo.style.boxShadow = SHADOW_ACENTO;
            
            setTimeout(() => {
                cuerpoPagina.style.backgroundColor = COLOR_FONDO_BASE;
                conteoFallosDisplayExterno.style.backgroundColor = '#1a1a1a';
            }, 150);
        }
    }

    botonCirculo.addEventListener('click', manejarAcierto);
    cuerpoPagina.addEventListener('click', manejarFallo);
    btnReiniciar.addEventListener('click', reiniciarJuego); 
    btnIniciar.addEventListener('click', iniciarJuego); 
    btnCerrarColumnas.forEach(btn => { btn.addEventListener('click', cerrarColumna); });

    inicializarPantalla();
});
