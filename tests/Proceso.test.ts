import { it, describe, expect } from "vitest"
import { Process, EstadoProceso } from "../src/Proceso"
import { ProcesoInvalidoError } from "../src/Errores"

describe("RF02 - Process", () => {
    it("inicia Nuevo con los contadores en su valor inicial", () => {
        const p = new Process("P1", 200, 4)
        expect(p.getPid()).toBe("P1")
        expect(p.getMemoriaRequerida()).toBe(200)
        expect(p.getCpuTotal()).toBe(4)
        expect(p.getCpuRestante()).toBe(4)
        expect(p.getEstado()).toBe(EstadoProceso.Nuevo)
        expect(p.getQuantumConsumido()).toBe(0)
        expect(p.getBloqueoRestante()).toBe(0)
    })

    it.each(["", "   "])("rechaza pid vacio %j", (pid) => {
        expect(() => new Process(pid, 100, 1)).toThrow(ProcesoInvalidoError)
    })

    it.each([0, -1, 1.5, NaN, Infinity])("rechaza memoria %s", (valor) => {
        expect(() => new Process("P1", valor, 1)).toThrow(ProcesoInvalidoError)
    })

    it.each([0, -1, 1.5, NaN, Infinity])("rechaza cpu total %s", (valor) => {
        expect(() => new Process("P1", 100, valor)).toThrow(ProcesoInvalidoError)
    })

    it("acepta el limite inferior (memoria 1, cpu 1)", () => {
        const p = new Process("P1", 1, 1)
        expect(p.getMemoriaRequerida()).toBe(1)
        expect(p.getCpuRestante()).toBe(1)
    })

    it("aVista devuelve una copia congelada con los datos actuales", () => {
        const vista = new Process("P1", 200, 4).aVista()
        expect(vista).toEqual({
            pid: "P1",
            memoriaRequerida: 200,
            cpuTotal: 4,
            cpuRestante: 4,
            estado: EstadoProceso.Nuevo,
            quantumConsumido: 0,
            bloqueoRestante: 0,
        })
        expect(Object.isFrozen(vista)).toBe(true)
    })
})