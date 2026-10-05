import { describe, expect, it } from "vitest"
import { ProcesoNoEncontradoError } from "../src/Errores"
import { ContiguousMemoryManager } from "../src/Memory/AdministradorMemoriaContigua"

const crearMemoria = (): ContiguousMemoryManager => {
    const memoria = new ContiguousMemoryManager(100)
    memoria.asignar("A", 20)
    memoria.asignar("B", 20)
    memoria.asignar("C", 20)
    return memoria
}

describe("RF05 - liberación y coalescencia de memoria", () => {
    it("fusiona con el bloque libre izquierdo y mantiene direcciones ocupadas", () => {
        const memoria = crearMemoria()
        memoria.liberar("A")
        memoria.liberar("B")
        expect(memoria.getBloques().map((bloque) => [bloque.getInicio(), bloque.getTamanio(), bloque.getPid()])).toEqual([
            [0, 40, undefined], [40, 20, "C"], [60, 40, undefined],
        ])
    })

    it("fusiona con el bloque libre derecho", () => {
        const memoria = crearMemoria()
        memoria.liberar("C")
        memoria.liberar("B")
        expect(memoria.getBloques().map((bloque) => [bloque.getInicio(), bloque.getTamanio()])).toEqual([
            [0, 20], [20, 80],
        ])
    })

    it("fusiona con ambos lados y al liberar todo queda un solo bloque", () => {
        const memoria = crearMemoria()
        memoria.liberar("A")
        memoria.liberar("C")
        memoria.liberar("B")
        expect(memoria.getBloques().map((bloque) => [bloque.getInicio(), bloque.getTamanio(), bloque.estaLibre()])).toEqual([
            [0, 100, true],
        ])
    })

    it("un PID inexistente produce error sin cambiar el mapa", () => {
        const memoria = crearMemoria()
        const antes = memoria.getBloques().map((bloque) => [bloque.getInicio(), bloque.getTamanio(), bloque.getPid()])
        expect(() => memoria.liberar("inexistente")).toThrow(ProcesoNoEncontradoError)
        expect(memoria.getBloques().map((bloque) => [bloque.getInicio(), bloque.getTamanio(), bloque.getPid()])).toEqual(antes)
    })
})

describe("RF04 - asignación Best-Fit", () => {
    it("elige el menor hueco suficiente", () => {
        const memoria = new ContiguousMemoryManager(1100)
        memoria.asignar("A", 100)
        memoria.asignar("B", 500)
        memoria.asignar("C", 200)
        memoria.asignar("D", 300)
        memoria.liberar("B")
        memoria.liberar("D")

        memoria.asignar("P", 250)

        expect(memoria.getBloques().map((bloque) => [bloque.getInicio(), bloque.getTamanio(), bloque.getPid()])).toContainEqual([800, 250, "P"])
    })

    it("desempata eligiendo el hueco de menor dirección", () => {
        const memoria = new ContiguousMemoryManager(1000)
        memoria.asignar("A", 300)
        memoria.asignar("B", 100)
        memoria.asignar("X", 100)
        memoria.asignar("C", 300)
        memoria.asignar("Y", 100)
        memoria.asignar("Z", 100)
        memoria.liberar("A")
        memoria.liberar("C")

        memoria.asignar("P", 250)

        expect(memoria.getBloques().map((bloque) => [bloque.getInicio(), bloque.getTamanio(), bloque.getPid()])).toContainEqual([0, 250, "P"])
    })
})
