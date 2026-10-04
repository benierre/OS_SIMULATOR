import { it, describe, expect } from "vitest"
import { MemoryBlock } from "../src/Memory/MemoryBlock"
import { BloqueInvalidoError } from "../src/Errores"

describe("RF01 - MemoryBlock", () => {
    it("un bloque sin pid esta libre y calcula su fin", () => {
        const b = new MemoryBlock(100, 50)
        expect(b.estaLibre()).toBe(true)
        expect(b.getPid()).toBeUndefined()
        expect(b.getFin()).toBe(150)
    })

    it("un bloque con pid esta ocupado", () => {
        const b = new MemoryBlock(0, 10, "P1")
        expect(b.estaLibre()).toBe(false)
        expect(b.getPid()).toBe("P1")
    })

    it.each([-1, 1.5, NaN])("rechaza inicio %s", (inicio) => {
        expect(() => new MemoryBlock(inicio, 10)).toThrow(BloqueInvalidoError)
    })

    it.each([0, -5, 2.5, NaN])("rechaza tamanio %s (nunca bloques de tamanio cero)", (tamanio) => {
        expect(() => new MemoryBlock(0, tamanio)).toThrow(BloqueInvalidoError)
    })
})