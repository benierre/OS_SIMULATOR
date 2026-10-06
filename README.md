# OS_SIMULATOR
# Simulador de procesos, memoria y CPU

Biblioteca en **TypeScript** que simula procesos, memoria contigua y planificación Round Robin. Trabajo individual de la AE2 de Sistemas Operativos y Paradigmas y Lenguajes de Programación II.

- **Autor:** Benicio Escoabr

## Cómo correrlo

Requisitos: [Node.js](https://nodejs.org/) y npm.

```bash
git clone https://github.com/benierre/OS_SIMULATOR
cd ("Completar con la direccion de la carpeta")
npm install
```

Correr los tests:

```bash
npm test
```

Ver la cobertura (el reporte HTML queda en `coverage/index.html`):

```bash
npm run coverage
```

## Restricciones principales

- **Es una biblioteca:** no tiene `main`, consola ni interfaz gráfica. Se demuestra solo con los tests.
- **Tiempo en ticks:** sin esperas reales, temporizadores, hilos ni aleatoriedad.
- **Parámetros configurables:** memoria total y quantum son enteros positivos (referencia: 1024 KB y quantum 2). Una configuración inválida se rechaza sin crear estados parciales.
- **Estado protegido:** las consultas devuelven copias o vistas de solo lectura, nunca las estructuras internas.
- **Cobertura:** líneas estrictamente mayores al 90 % sobre `src/**/*.ts`. El umbral configurado es 91 %.