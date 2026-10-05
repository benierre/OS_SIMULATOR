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

        const bloque = this.bloques[indice]
        return bloque === undefined ? false : this.asignarEnIndice(indice, bloque, pid, tamanio)
    }

    private asignarEnIndice(indice: number, bloque: MemoryBlock, pid: string, tamanio: number): boolean {
        const tamanioRestante = bloque.getTamanio() - tamanio

        const bloquesNuevos: MemoryBlock[] = [
            new MemoryBlock(
                bloque.getInicio(),
                tamanio,
                pid
            )
        ]

        tamanioRestante > 0 && bloquesNuevos.push(
                new MemoryBlock(
                    bloque.getInicio() + tamanio,
                    tamanioRestante
                )
            )

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

        const bloque = this.bloques[indice]
        return bloque === undefined ? false : this.liberarEnIndice(indice, bloque)
    }

    private liberarEnIndice(indice: number, bloque: MemoryBlock): boolean {
        this.bloques.splice(
            indice,
            1,
            new MemoryBlock(
                bloque.getInicio(),
                bloque.getTamanio()
            )
        )

        this.fusionarLibres()

        return true
    }

    private fusionarLibres(): void {
        const fusionados: MemoryBlock[] = []

        this.bloques.forEach((bloque) => {
            const anterior = fusionados[fusionados.length - 1]

            anterior?.estaLibre() && bloque.estaLibre()
                ? fusionados[fusionados.length - 1] = new MemoryBlock(
                    anterior.getInicio(),
                    anterior.getTamanio() + bloque.getTamanio()
                )
                : fusionados.push(bloque)
        })

        this.bloques.splice(
            0,
            this.bloques.length,
            ...fusionados
        )
    }
}
