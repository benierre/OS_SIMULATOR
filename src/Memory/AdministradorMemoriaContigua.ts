import { MemoryBlock } from "./MemoryBlock"
import { MemoryManager } from "./AdminMemoria"

export class ContiguousMemoryManager implements MemoryManager {
    private readonly bloques: MemoryBlock[]
    private readonly tamanioTotal: number

    constructor(tamanioTotal: number) {
        this.tamanioTotal = tamanioTotal
        this.bloques = [new MemoryBlock(0, tamanioTotal)]
    }

    getTamanioTotal(): number {
        return this.tamanioTotal
    }

    getMemoriaLibre(): number {
        return this.bloques
            .filter((b) => b.estaLibre())
            .reduce((suma, b) => suma + b.getTamanio(), 0)
    }

    getBloques(): readonly MemoryBlock[] {
        return [...this.bloques]
    }
}