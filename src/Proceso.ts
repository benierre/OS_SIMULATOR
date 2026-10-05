import { ProcesoInvalidoError, TransicionInvalidaError } from "./Errores"

const exigir = (condicion: boolean, error: Error): void => {
    condicion || (() => { throw error })()
}

export enum EstadoProceso {
    Nuevo = "NUEVO",
    EsperandoMemoria = "ESPERANDO_MEMORIA",
    Listo = "LISTO",
    Ejecutando = "EJECUTANDO",
    Bloqueado = "BLOQUEADO",
    Terminado = "TERMINADO",
}

export interface ProcesoVista {
    readonly pid: string
    readonly memoriaRequerida: number
    readonly cpuTotal: number
    readonly cpuRestante: number
    readonly estado: EstadoProceso
    readonly quantumConsumido: number
    readonly bloqueoRestante: number
}

export class Process {
    private readonly pid: string
    private readonly memoriaRequerida: number
    private readonly cpuTotal: number
    private estado: EstadoProceso = EstadoProceso.Nuevo
    private cpuRestante: number
    private quantumConsumido = 0
    private bloqueoRestante = 0

    constructor(pid: string, memoriaRequerida: number, cpuTotal: number) {
        exigir(typeof pid === "string" && pid.trim() !== "", new ProcesoInvalidoError("pid debe ser un texto no vacio"))

        Process.exigirEnteroPositivo("memoriaRequerida", memoriaRequerida)
        Process.exigirEnteroPositivo("cpuTotal", cpuTotal)

        this.pid = pid
        this.memoriaRequerida = memoriaRequerida
        this.cpuTotal = cpuTotal
        this.cpuRestante = cpuTotal
    }

    getPid(): string {
        return this.pid
    }

    getMemoriaRequerida(): number {
        return this.memoriaRequerida
    }

    getCpuTotal(): number {
        return this.cpuTotal
    }

    getCpuRestante(): number {
        return this.cpuRestante
    }

    getEstado(): EstadoProceso {
        return this.estado
    }

    getQuantumConsumido(): number {
        return this.quantumConsumido
    }

    getBloqueoRestante(): number {
        return this.bloqueoRestante
    }

    aVista(): ProcesoVista {
        return Object.freeze({
            pid: this.pid,
            memoriaRequerida: this.memoriaRequerida,
            cpuTotal: this.cpuTotal,
            cpuRestante: this.cpuRestante,
            estado: this.estado,
            quantumConsumido: this.quantumConsumido,
            bloqueoRestante: this.bloqueoRestante,
        })
    }

    private static exigirEnteroPositivo(nombre: string, valor: number): void {
        exigir(Number.isInteger(valor) && valor > 0, new ProcesoInvalidoError(
                `${nombre} debe ser un entero positivo (recibido: ${valor})`
            ))
    }

    admitir(): void {
        this.transicionarA(EstadoProceso.Listo)
    }

    esperarMemoria(): void {
        this.transicionarA(EstadoProceso.EsperandoMemoria)
    }

    ejecutar(): void {
        this.transicionarA(EstadoProceso.Ejecutando)
    }
    ejecutarTick(): void {
    exigir(this.estado === EstadoProceso.Ejecutando, new TransicionInvalidaError(
            `El proceso ${this.pid} no esta ejecutando`
        ))

    this.cpuRestante--
        this.quantumConsumido++
    }

    reiniciarQuantum(): void {
        this.quantumConsumido = 0
    }

    bloquear(duracion: number): void {
        this.transicionarA(EstadoProceso.Bloqueado)
        this.bloqueoRestante = duracion
    }

    avanzarBloqueo(): boolean {
        this.bloqueoRestante = Math.max(0, this.bloqueoRestante - 1)
        return this.bloqueoRestante === 0
    }

    transicionarA(nuevoEstado: EstadoProceso): void {
        const transicionesValidas: Record<EstadoProceso, EstadoProceso[]> = {
            [EstadoProceso.Nuevo]: [
                EstadoProceso.EsperandoMemoria,
                EstadoProceso.Listo,
            ],

            [EstadoProceso.EsperandoMemoria]: [
                EstadoProceso.Listo,
            ],

            [EstadoProceso.Listo]: [
                EstadoProceso.Ejecutando,
            ],

            [EstadoProceso.Ejecutando]: [
                EstadoProceso.Listo,
                EstadoProceso.Bloqueado,
                EstadoProceso.Terminado,
            ],

            [EstadoProceso.Bloqueado]: [
                EstadoProceso.Listo,
            ],

            [EstadoProceso.Terminado]: [],
        }

        exigir(transicionesValidas[this.estado].includes(nuevoEstado), new TransicionInvalidaError(
                `Transicion invalida para ${this.pid}: ${this.estado} -> ${nuevoEstado}`
            ))

        this.estado = nuevoEstado
    }
}
