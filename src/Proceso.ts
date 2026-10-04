import { ProcesoInvalidoError } from "./Errores"

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
        if (typeof pid !== "string" || pid.trim() === "") {
            throw new ProcesoInvalidoError("pid debe ser un texto no vacio")
        }
        Process.exigirEnteroPositivo("memoriaRequerida", memoriaRequerida)
        Process.exigirEnteroPositivo("cpuTotal", cpuTotal)
        this.pid = pid
        this.memoriaRequerida = memoriaRequerida
        this.cpuTotal = cpuTotal
        this.cpuRestante = cpuTotal
    }

    getPid(): string { return this.pid }
    getMemoriaRequerida(): number { return this.memoriaRequerida }
    getCpuTotal(): number { return this.cpuTotal }
    getCpuRestante(): number { return this.cpuRestante }
    getEstado(): EstadoProceso { return this.estado }
    getQuantumConsumido(): number { return this.quantumConsumido }
    getBloqueoRestante(): number { return this.bloqueoRestante }

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
        if (!Number.isInteger(valor) || valor <= 0) {
            throw new ProcesoInvalidoError(
                `${nombre} debe ser un entero positivo (recibido: ${valor})`
            )
        }
    }
}