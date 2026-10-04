import { it, describe, expect, beforeEach } from "vitest"
import { Simulator } from "./Simulador"
import { Config } from "./Config"
import { EstadoProceso } from "./Proceso"
import {
    PidDuplicadoError,
    ProcesoExcedeMemoriaError,
    ProcesoInvalidoError,
} from "./Errores"

describe("RF02 - registrar y consultar procesos", () => {
    let sim: Simulator

    beforeEach(() => {
        sim = new Simulator(Config.referencia())
    })

    it("registra un proceso y lo consulta con sus contadores iniciales", () => {
        sim.registrarProceso("P1", 200, 4)
        expect(sim.obtenerProceso("P1")).toEqual({
            pid: "P1",
            memoriaRequerida: 200,
            cpuTotal: 4,
            cpuRestante: 4,
            estado: EstadoProceso.Nuevo,
            quantumConsumido: 0,
            bloqueoRestante: 0,
        })
    })

    it("lista los procesos en orden de registro", () => {
        sim.registrarProceso("P2", 100, 1)
        sim.registrarProceso("P1", 100, 1)
        sim.registrarProceso("P3", 100, 1)
        expect(sim.listarProcesos().map((p) => p.pid)).toEqual(["P2", "P1", "P3"])
    })

    it("devuelve undefined al consultar un pid inexistente", () => {
        expect(sim.obtenerProceso("P9")).toBeUndefined()
    })
     it("rechaza un pid duplicado sin alterar el proceso original", () => {
        sim.registrarProceso("P1", 200, 4)
        expect(() => sim.registrarProceso("P1", 300, 9)).toThrow(PidDuplicadoError)
        expect(sim.listarProcesos()).toHaveLength(1)
        expect(sim.obtenerProceso("P1")?.memoriaRequerida).toBe(200)
    })

    it("rechaza un proceso mayor que la memoria total sin registrarlo", () => {
        const chico = new Simulator(new Config(100, 2))
        expect(() => chico.registrarProceso("P1", 101, 1)).toThrow(ProcesoExcedeMemoriaError)
        expect(chico.listarProcesos()).toHaveLength(0)
    })

    it("acepta un proceso que pide exactamente la memoria total", () => {
        const chico = new Simulator(new Config(100, 2))
        chico.registrarProceso("P1", 100, 1)
        expect(chico.obtenerProceso("P1")?.memoriaRequerida).toBe(100)
    })

    it.each([
        ["", 100, 1],
        ["P1", 0, 1],
        ["P1", -5, 1],
        ["P1", 1.5, 1],
        ["P1", 100, 0],
        ["P1", 100, -1],
        ["P1", 100, 2.5],
    ])("rechaza datos invalidos (%j, %s, %s) sin dejar estado parcial", (pid, mem, cpu) => {
        expect(() => sim.registrarProceso(pid, mem, cpu)).toThrow(ProcesoInvalidoError)
        expect(sim.listarProcesos()).toHaveLength(0)
    })

    it("modificar la vista devuelta no cambia el estado interno", () => {
        sim.registrarProceso("P1", 200, 4)
        const vista = sim.obtenerProceso("P1")
        expect(Object.isFrozen(vista)).toBe(true)
        try {
            ;(vista as { cpuRestante: number }).cpuRestante = 0
        } catch {
            // la vista esta congelada: en modo estricto asignar lanza TypeError
        }
        expect(sim.obtenerProceso("P1")?.cpuRestante).toBe(4)
    })

    it("la lista devuelta es una copia protegida", () => {
        sim.registrarProceso("P1", 200, 4)
        ;(sim.listarProcesos() as unknown[]).pop()
        expect(sim.listarProcesos()).toHaveLength(1)
    })


})