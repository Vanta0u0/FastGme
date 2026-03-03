/**
 * REACTION TRAINER - BLINK EDITION
 * Versión Final Unificada
 */

// --- CONFIGURACIÓN Y CONSTANTES ---
const MOBILE_BREAKPOINT = 768;
const PC_INACTIVITY_MS = 1000;
const MOBILE_INACTIVITY_MS = 750;
const CIRCLE_SIZE_PC = '80px';
const CIRCLE_SIZE_MOBILE = '55px';

// --- ESTADO DEL JUEGO ---
let aciertos = 0;
let fallos = 0;
let movementTimerId = null; 
let countdownTimerId = null; 
let tiempoRestante = 60; 
let juegoActivo = false; 
const RETRASO_INICIO = 1000;

let currentInactivityTime = PC_INACTIVITY_MS; 
let tiempoMovimiento = 0;
let sumaTiemposReaccion = 0;

const COLOR_ACENTO = '#00FFC0';
const COLOR_VERDE_MOVIMIENTO = '#00CC00'; 
const COLOR_AZUL_CELEBRACION_FLASH = 'rgba(0, 191, 255, 0.5)';
const COLOR_FONDO_FALLO = 'rgba(255, 0, 0, 0.5)';
const COLOR_FONDO_BASE = '#121212'; 
const SHADOW_ACENTO = '0 0 15px ' + COLOR_ACENTO;
const SHADOW_VERDE = '0 0 15px ' + COLOR_VERDE_MOVIMIENTO;

// --- MOTOR DE AUDIO (Blink Edition) ---
let audioCtx = null;
function sonarBlink(frecuencia, tipo, duracion) {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = tipo;
        osc.frequency.setValueAtTime(frecuencia, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duracion);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + duracion);
    } catch (e) { console.log("Audio en espera de interacción."); }
}

function calcularTiempoReaccionPromedio() {
    if (aciertos === 0) return "9999.00";
    return (sumaTiemposReaccion / aciertos).toFixed(2);
}

// --- LÓGICA PRINCIPAL ---
document.addEventListener('DOMContentLoaded', function() {
    // Referencias al DOM
    const modalInicio = document.getElementById('modal-inicio-juego');
    const btnIniciar = document.getElementById('btn-iniciar');
    const conteoAciertos = document.getElementById('conteo-aciertos');
    const conteoFallosExt = document.getElementById('conteo-fallos-exterior');
    const conteoFallosInt = document.getElementById('conteo-fallos');
    const temporizadorDisplay = document.getElementById('temporizador');
    const botonCirculo = document.getElementById('btn-circulo'); 
    const mainContainer = document.getElementById('main-container'); 
    const modalFin = document.getElementById('modal-fin-juego');
    const modalContenidoFin = document.querySelector('#modal-fin-juego .modal-contenido'); 
    const finalAciertos = document.getElementById('final-aciertos');
    const finalFallos = document.getElementById('final-fallos');
    const btnReiniciar = document.getElementById('btn-reiniciar');
    const tiempoReaccionDisplay = document.getElementById('tiempo-reaccion-estimado');

    function aplicarAjusteMovil() {
        if (window.innerWidth <= MOBILE_BREAKPOINT) {
            currentInactivityTime = MOBILE_INACTIVITY_MS;
            botonCirculo.style.width = CIRCLE_SIZE_MOBILE;
            botonCirculo.style.height = CIRCLE_SIZE_MOBILE;
        } else {
            currentInactivityTime = PC_INACTIVITY_MS;
            botonCirculo.style.width = CIRCLE_SIZE_PC;
            botonCirculo.style.height = CIRCLE_SIZE_PC;
        }
    }

    function actualizarTemporizadorDisplay() {
        const min = Math.floor(tiempoRestante / 60);
        const seg = tiempoRestante % 60;
        temporizadorDisplay.textContent = `${min}:${seg < 10 ? '0'+seg : seg}`;
        
        // Efecto visual de urgencia
        if (tiempoRestante <= 10) {
            temporizadorDisplay.style.color = '#FF4136';
            temporizadorDisplay.style.borderColor = '#FF4136';
        } else {
            temporizadorDisplay.style.color = '#FFFFFF';
            temporizadorDisplay.style.borderColor = '#FFFFFF';
        }
    }

    function moverCirculo() {
        if (!juegoActivo) return;
        const xMax = window.innerWidth - (botonCirculo.offsetWidth || 80);
        const yMax = window.innerHeight - (botonCirculo.offsetHeight || 80);
        
        botonCirculo.style.left = Math.floor(Math.random() * Math.max(0, xMax)) + "px";
        botonCirculo.style.top = Math.floor(Math.random() * Math.max(0, yMax)) + "px";
        
        // Efecto Blink y Sonido de Movimiento
        sonarBlink(600, 'sine', 0.1);
        botonCirculo.classList.remove('blink-active');
        void botonCirculo.offsetWidth; 
        botonCirculo.classList.add('blink-active');
        
        // Marcamos el tiempo exacto del nuevo movimiento
        tiempoMovimiento = performance.now();
    }

    function resetMovementTimer() {
        clearTimeout(movementTimerId);
        movementTimerId = setTimeout(() => {
            if (juegoActivo) {
                moverCirculo();
                resetMovementTimer();
            }
        }, currentInactivityTime);
    }

    function finalizarJuego() {
        juegoActivo = false;
        clearInterval(countdownTimerId);
        clearTimeout(movementTimerId);
        botonCirculo.classList.add('oculto');
        
        const trFinal = calcularTiempoReaccionPromedio();
        const trNum = parseFloat(trFinal);

        // Lógica de puntuación extrema
        if (trNum <= 90.00 && aciertos > 0) {
            modalContenidoFin.innerHTML = `
                <div class="tr-extrema-container">
                    <h2>¡TIEMPO EXTREMO!</h2>
                    <p style="font-size: 2.5em; font-weight: bold; margin: 10px 0;">${trFinal} ms</p>
                    <p>Reflejos detectados: Nivel Sobrehumano.</p>
                    <p style="font-size: 0.8em; margin-top: 20px;">Recarga la página para volver a intentar.</p>
                </div>`;
            modalFin.style.pointerEvents = 'none';
        } else {
            finalAciertos.textContent = aciertos;
            finalFallos.textContent = fallos;
            tiempoReaccionDisplay.textContent = `${trFinal} ms`;
        }
        modalFin.classList.remove('oculto');
    }

    function iniciarJuego() {
        aciertos = 0;
        fallos = 0;
        tiempoRestante = 60;
        sumaTiemposReaccion = 0;
        
        modalInicio.classList.add('oculto');
        
        // Mostrar elementos ocultos
        [mainContainer, botonCirculo, conteoAciertos, conteoFallosExt, temporizadorDisplay].forEach(el => {
            if(el) el.classList.remove('oculto');
        });

        actualizarTemporizadorDisplay();

        countdownTimerId = setInterval(() => {
            if (tiempoRestante > 0) {
                tiempoRestante--;
                actualizarTemporizadorDisplay();
            } else {
                finalizarJuego();
            }
        }, 1000);

        setTimeout(() => {
            juegoActivo = true;
            moverCirculo();
            resetMovementTimer();
        }, RETRASO_INICIO);
    }

    // --- MANEJO DE EVENTOS ---
    btnIniciar.onclick = () => {
        sonarBlink(440, 'sine', 0.1);
        iniciarJuego();
    };

    botonCirculo.onclick = (e) => {
        if (!juegoActivo) return;
        e.stopPropagation(); // BLOQUEA el burbujeo para que no cuente como fallo
        
        // Cálculo de tiempo de reacción
        sumaTiemposReaccion += (performance.now() - tiempoMovimiento);
        aciertos++;
        conteoAciertos.textContent = `Aciertos: ${aciertos}`;
        
        sonarBlink(880, 'sine', 0.1);
        
        // Feedback visual
        botonCirculo.style.backgroundColor = COLOR_VERDE_MOVIMIENTO;
        botonCirculo.style.boxShadow = SHADOW_VERDE;
        
        if (aciertos % 25 === 0) {
            document.body.style.backgroundColor = COLOR_AZUL_CELEBRACION_FLASH;
        }
        
        setTimeout(() => {
            botonCirculo.style.backgroundColor = COLOR_ACENTO;
            botonCirculo.style.boxShadow = SHADOW_ACENTO;
            document.body.style.backgroundColor = COLOR_FONDO_BASE;
        }, 100);

        moverCirculo();
        resetMovementTimer();
    };

    document.body.onclick = (e) => {
        // Ignorar si el juego no está activo o si el clic fue en elementos de UI
        if (!juegoActivo || e.target.id === 'btn-circulo' || e.target.closest('#grid-inicio')) return;
        
        fallos++;
        conteoFallosExt.textContent = `Fallos Totales: ${fallos}`;
        conteoFallosInt.textContent = `Fallos: ${fallos}`;
        
        // Feedback de error
        sonarBlink(200, 'square', 0.15);
        document.body.style.backgroundColor = COLOR_FONDO_FALLO;
        
        setTimeout(() => {
            document.body.style.backgroundColor = COLOR_FONDO_BASE;
        }, 150);
        
        // NUEVA REGLA: Mover círculo al fallar
        moverCirculo();
        resetMovementTimer();
    };

    if (btnReiniciar) {
        btnReiniciar.onclick = () => location.reload();
    }

    // Inicialización
    aplicarAjusteMovil();
    window.addEventListener('resize', aplicarAjusteMovil);
});
