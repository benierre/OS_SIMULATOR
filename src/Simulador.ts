import { Config } from "./Config"
import { MemoryBlock } from "./Memory/MemoryBlock"
import { MemoryManager } from "./Memory/AdminMemoria"
import { ContiguousMemoryManager } from "./Memory/AdministradorMemoriaContigua"

export class Simulator {
    private tick = 0
    private cambiosDeContexto = 0
    private enCpu: string | undefined = undefined
    private readonly listos: string[] = []
    private readonly esperando: string[] = []
    private readonly bloqueados: string[] = []
    private readonly terminados: string[] = []

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
}