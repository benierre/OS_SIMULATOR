import { Config } from "./Config"
import { MemoryBlock } from "./Memory/MemoryBlock"
import { MemoryManager } from "./Memory/AdminMemoria"
import { ContiguousMemoryManager } from "./Memory/AdministradorMemoriaContigua"
import { EstadoProceso, Process } from "./Proceso"
import type { ProcesoVista } from "./Proceso"
import { PidDuplicadoError, ProcesoExcedeMemoriaError, ProcesoInvalidoError, ProcesoNoEncontradoError } from "./Errores"

const exigir = (condicion: boolean, error: Error): void =>
    condicion || (() => { throw error })()

export interface MetricasSimulador {
    readonly ocupacionMemoria: number
    readonly utilizacionCpu: number
    readonly cambiosDeContexto: number
    readonly memoriaLibre: number
    readonly mayorHueco: number
    readonly fragmentacionExterna: number
}

export class Simulator {
    private tick = 0
    private cambiosDeContexto = 0
    private cambioContabilizado = false
    private ticksConCpu = 0
    private metricas: MetricasSimulador
    private enCpu: string | undefined = undefined
    private readonly listos: string[] = []
    private readonly esperando: string[] = []
    private readonly bloqueados: string[] = []
    private readonly terminados: string[] = []
    private readonly procesos = new Map<string, Process>()
    private readonly bloqueosProgramados = new Map<string, { cadaNTicks: number; duracion: number }>()

    constructor(
        private readonly config: Config,
        private readonly memoria: MemoryManager = new ContiguousMemoryManager(
            config.getMemoria()
        )
    ) {
        this.metricas = Object.freeze({
            ocupacionMemoria: 0,
            utilizacionCpu: 0,
            cambiosDeContexto: 0,
            memoriaLibre: config.getMemoria(),
            mayorHueco: config.getMemoria(),
            fragmentacionExterna: 0,
        })
    }

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

    getMetricas(): MetricasSimulador {
        return this.metricas
    }

    programarBloqueo(pid: string, cadaNTicks: number, duracion: number): void {
        const proceso = this.procesos.get(pid)
        exigir(proceso !== undefined, new ProcesoNoEncontradoError(`No existe el proceso ${pid}`))
        const cpuTotal = proceso?.getCpuTotal() ?? 0
        exigir(Number.isInteger(cadaNTicks) && cadaNTicks > 0 && cadaNTicks <= cpuTotal, new ProcesoInvalidoError("N debe ser un entero positivo no mayor que el CPU total del proceso"))
        exigir(Number.isInteger(duracion) && duracion > 0, new ProcesoInvalidoError("La duración del bloqueo debe ser un entero positivo"))
        exigir(!this.bloqueosProgramados.has(pid), new ProcesoInvalidoError(`El proceso ${pid} ya tiene un bloqueo programado`))
        this.bloqueosProgramados.set(pid, { cadaNTicks, duracion })
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
        proceso?.reiniciarQuantum()
        proceso && (this.enCpu = pid)
        proceso && !this.cambioContabilizado && this.cambiosDeContexto++
        proceso && (this.cambioContabilizado = false)
    }

    tickSimulador(): void {
        this.tick++
        this.admitirEsperando()
        this.avanzarBloqueos()
        this.enCpu === undefined && this.ejecutarProceso()

        const proceso = this.enCpu === undefined
            ? undefined
            : this.procesos.get(this.enCpu)
        proceso?.ejecutarTick()
        this.ticksConCpu += Number(proceso !== undefined)
        const finalizo = proceso !== undefined && proceso.getCpuRestante() === 0
        finalizo && proceso && this.finalizarProceso(proceso)
        const debeBloquear = !finalizo && proceso !== undefined && this.debeBloquear(proceso)
        debeBloquear && proceso && this.bloquearProceso(proceso)
        !finalizo && !debeBloquear && proceso && this.revisarQuantum(proceso)
        this.recalcularMetricas()
    }

    private finalizarProceso(proceso: Process): void {
        proceso.transicionarA(EstadoProceso.Terminado)
        this.memoria.liberar(proceso.getPid())
        this.terminados.push(proceso.getPid())
        this.enCpu = undefined
    }

    private revisarQuantum(proceso: Process): void {
        const vencio = proceso.getQuantumConsumido() >= this.config.getQuantum()
        const rota = vencio && this.listos.length > 0
        rota && proceso.transicionarA(EstadoProceso.Listo)
        rota && this.listos.push(proceso.getPid())
        rota && (this.enCpu = undefined, this.cambiosDeContexto++, this.cambioContabilizado = true)
        vencio && !rota && proceso.reiniciarQuantum()
    }

    private debeBloquear(proceso: Process): boolean {
        const evento = this.bloqueosProgramados.get(proceso.getPid())
        const ejecutados = proceso.getCpuTotal() - proceso.getCpuRestante()
        return evento !== undefined && ejecutados % evento.cadaNTicks === 0
    }

    private bloquearProceso(proceso: Process): void {
        const evento = this.bloqueosProgramados.get(proceso.getPid())
        evento && proceso.bloquear(evento.duracion)
        this.bloqueados.push(proceso.getPid())
        this.enCpu = undefined
        this.cambiosDeContexto++
        this.cambioContabilizado = true
    }

    private avanzarBloqueos(): void {
        [...this.bloqueados].forEach((pid) => {
            const proceso = this.procesos.get(pid)
            const desbloqueado = proceso?.avanzarBloqueo() ?? false
            desbloqueado && proceso && proceso.transicionarA(EstadoProceso.Listo)
            desbloqueado && (this.bloqueados.splice(this.bloqueados.indexOf(pid), 1), this.listos.push(pid))
        })
    }

    private recalcularMetricas(): void {
        const total = this.memoria.getTamanioTotal()
        const memoriaLibre = this.memoria.getMemoriaLibre()
        const mayorHueco = this.memoria.getBloques()
            .filter((bloque) => bloque.estaLibre())
            .reduce((mayor, bloque) => Math.max(mayor, bloque.getTamanio()), 0)
        this.metricas = Object.freeze({
            ocupacionMemoria: ((total - memoriaLibre) / total) * 100,
            utilizacionCpu: (this.ticksConCpu / this.tick) * 100,
            cambiosDeContexto: this.cambiosDeContexto,
            memoriaLibre,
            mayorHueco,
            fragmentacionExterna: memoriaLibre === 0 ? 0 : (1 - mayorHueco / memoriaLibre) * 100,
        })
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
