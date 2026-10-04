import { Config } from "./Config"
import { MemoryBlock } from "./Memory/MemoryBlock"
import { MemoryManager } from "./Memory/AdminMemoria"
import { ContiguousMemoryManager } from "./Memory/AdministradorMemoriaContigua"
import { Process } from "./Proceso"
import type { ProcesoVista } from "./Proceso"
import { PidDuplicadoError, ProcesoExcedeMemoriaError } from "./Errores"

export class Simulator {
    private tick = 0
    private cambiosDeContexto = 0
    private enCpu: string | undefined = undefined
    private readonly listos: string[] = []
    private readonly esperando: string[] = []
    private readonly bloqueados: string[] = []
    private readonly terminados: string[] = []
    private readonly procesos = new Map<string, Process>()

    constructor(
        private readonly config: Config,
        private readonly memoria: MemoryManager = new ContiguousMemoryManager(config.getMemoria())
    ) {}

    getConfig(): Config { return this.config }
    getTick(): number { return this.tick }
    getCambiosDeContexto(): number { return this.cambiosDeContexto }
    getPidEnCpu(): string | undefined { return this.enCpu }
    getListos(): readonly string[] { return [...this.listos] }
    getEsperando(): readonly string[] { return [...this.esperando] }
    getBloqueados(): readonly string[] { return [...this.bloqueados] }
    getTerminados(): readonly string[] { return [...this.terminados] }
    getMapaMemoria(): readonly MemoryBlock[] { return this.memoria.getBloques() }
    registrarProceso(pid: string, memoriaRequerida: number, cpuTotal: number): void {
    const proceso = new Process(pid, memoriaRequerida, cpuTotal)
    if (this.procesos.has(pid)) {
        throw new PidDuplicadoError(`Ya existe un proceso con pid ${pid}`)
    }
    if (memoriaRequerida > this.memoria.getTamanioTotal()) {
        throw new ProcesoExcedeMemoriaError(
            `El proceso ${pid} pide ${memoriaRequerida} KB y la memoria total es ${this.memoria.getTamanioTotal()} KB`
        )
    }
    this.procesos.set(pid, proceso)
}

obtenerProceso(pid: string): ProcesoVista | undefined {
    return this.procesos.get(pid)?.aVista()
}

listarProcesos(): readonly ProcesoVista[] {
    return [...this.procesos.values()].map((p) => p.aVista())
}
}