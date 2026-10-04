import { it, describe, expect, beforeEach } from "vitest"
import { Simulator } from "../src/Simulador"
import { Config } from "../src/Config"
import { EstadoProceso } from "../src/Proceso"
import {
    PidDuplicadoError,
    ProcesoExcedeMemoriaError,
    ProcesoInvalidoError,
} from "../src/Errores"

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


})