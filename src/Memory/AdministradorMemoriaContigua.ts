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

    asignar(pid: string, tamanio: number): boolean {
        const indice = this.bloques.findIndex(
            (bloque) =>
                bloque.estaLibre() &&
                bloque.getTamanio() >= tamanio
        )

        if (indice === -1) {
            return false
        }

        const bloque = this.bloques[indice]
        const tamanioRestante = bloque.getTamanio() - tamanio

        const bloquesNuevos: MemoryBlock[] = [
            new MemoryBlock(
                bloque.getInicio(),
                tamanio,
                pid
            )
        ]

        if (tamanioRestante > 0) {
            bloquesNuevos.push(
                new MemoryBlock(
                    bloque.getInicio() + tamanio,
                    tamanioRestante
                )
            )
        }

        this.bloques.splice(
            indice,
            1,
            ...bloquesNuevos
        )

        return true
    }

    liberar(pid: string): boolean {
        const indice = this.bloques.findIndex(
            (bloque) => bloque.getPid() === pid
        )

        if (indice === -1) {
            return false
        }

        this.bloques.splice(
            indice,
            1,
            new MemoryBlock(
                this.bloques[indice].getInicio(),
                this.bloques[indice].getTamanio()
            )
        )

        this.fusionarLibres()

        return true
    }

    private fusionarLibres(): void {
        const fusionados: MemoryBlock[] = []

        this.bloques.forEach((bloque) => {
            const anterior = fusionados[fusionados.length - 1]

            if (anterior?.estaLibre() && bloque.estaLibre()) {
                fusionados[fusionados.length - 1] = new MemoryBlock(
                    anterior.getInicio(),
                    anterior.getTamanio() + bloque.getTamanio()
                )
            } else {
                fusionados.push(bloque)
            }
        })

        this.bloques.splice(
            0,
            this.bloques.length,
            ...fusionados
        )
    }
}