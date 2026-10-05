import { Config } from "./Config"
import { MemoryBlock } from "./Memory/MemoryBlock"
import { MemoryManager } from "./Memory/AdminMemoria"
import { ContiguousMemoryManager } from "./Memory/AdministradorMemoriaContigua"
import { EstadoProceso, Process } from "./Proceso"
import type { ProcesoVista } from "./Proceso"
import { PidDuplicadoError, ProcesoExcedeMemoriaError } from "./Errores"

const exigir = (condicion: boolean, error: Error): void =>
    condicion || (() => { throw error })()

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
        private readonly memoria: MemoryManager = new ContiguousMemoryManager(
            config.getMemoria()
        )
    ) {}

    getConfig(): Config {
        return this.config
    }

    getTick(): number {
        return this.tick
    }

    getCambiosDeContexto(): number {
        return this.cambiosDeContexto
    }

    getPidEnCpu(): string | undefined {
        return this.enCpu
    }

    getListos(): readonly string[] {
        return [...this.listos]
    }

    getEsperando(): readonly string[] {
        return [...this.esperando]
    }

    getBloqueados(): readonly string[] {
        return [...this.bloqueados]
    }

    getTerminados(): readonly string[] {
        return [...this.terminados]
    }

    getMapaMemoria(): readonly MemoryBlock[] {
        return this.memoria.getBloques()
    }

    registrarProceso(
        pid: string,
        memoriaRequerida: number,
        cpuTotal: number
    ): void {
        const proceso = new Process(
            pid,
            memoriaRequerida,
            cpuTotal
        )

        exigir(!this.procesos.has(pid), new PidDuplicadoError(
                `Ya existe un proceso con pid ${pid}`
            ))

        exigir(memoriaRequerida <= this.memoria.getTamanioTotal(), new ProcesoExcedeMemoriaError(
                `El proceso ${pid} pide ${memoriaRequerida} KB y la memoria total es ${this.memoria.getTamanioTotal()} KB`
            ))

        this.procesos.set(pid, proceso)
        this.admitirProceso(proceso)
    }

    private admitirProceso(proceso: Process): void {
        const pudoAsignar = this.memoria.asignar(
            proceso.getPid(),
            proceso.getMemoriaRequerida()
        )

        const enCola = pudoAsignar ? this.listos : this.esperando
        ;(pudoAsignar ? proceso.admitir() : proceso.esperarMemoria())
        enCola.push(proceso.getPid())
    }


    private admitirEsperando(): void {
        const pendientes = [...this.esperando]

        this.esperando.length = 0

        pendientes.forEach((pid) => {
            const proceso = this.procesos.get(pid)

            const pudoAsignar =
                proceso !== undefined &&
                this.memoria.asignar(
                    pid,
                    proceso.getMemoriaRequerida()
                )

            const admitido = pudoAsignar && proceso !== undefined
            admitido && proceso.admitir()
            ;(admitido ? this.listos : this.esperando).push(pid)
        })
        
        
    }
    ejecutarProceso(): void {
    const pid = this.enCpu === undefined ? this.listos.shift() : undefined
    const proceso = pid === undefined ? undefined : this.procesos.get(pid)
    proceso?.ejecutar()
    proceso && (this.enCpu = pid, this.cambiosDeContexto++)
}
tickSimulador(): void {
    this.tick++
    this.enCpu !== undefined && this.procesos.get(this.enCpu)?.ejecutarTick()
}
    

    obtenerProceso(pid: string): ProcesoVista | undefined {
        return this.procesos.get(pid)?.aVista()
    }

    listarProcesos(): readonly ProcesoVista[] {
        return [...this.procesos.values()].map(
            (p) => p.aVista()
        )
    }
}
