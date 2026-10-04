import { it, describe, expect } from "vitest"
import { Simulator } from "../src/Simulador"
import { Config } from "../src/Config"
import { ContiguousMemoryManager } from "../src/Memory/AdministradorMemoriaContigua"
import { ConfigInvalidaError } from "../src/Errores"

describe("RF01 - estado inicial del Simulator", () => {
    it("arranca en tick 0, sin proceso en CPU, con colas vacias y contadores en cero", () => {
        const sim = new Simulator(Config.referencia())
        expect(sim.getTick()).toBe(0)
        expect(sim.getPidEnCpu()).toBeUndefined()
        expect(sim.getListos()).toEqual([])
        expect(sim.getEsperando()).toEqual([])
        expect(sim.getBloqueados()).toEqual([])
        expect(sim.getTerminados()).toEqual([])
        expect(sim.getCambiosDeContexto()).toBe(0)
    })

    it("la memoria inicia como un unico bloque libre que abarca toda la memoria", () => {
        const sim = new Simulator(new Config(512, 3))
        const mapa = sim.getMapaMemoria()
        expect(mapa).toHaveLength(1)
        expect(mapa[0].getInicio()).toBe(0)
        expect(mapa[0].getTamanio()).toBe(512)
        expect(mapa[0].estaLibre()).toBe(true)
    })

    it("respeta la memoria y el quantum configurados", () => {
        const sim = new Simulator(new Config(2048, 5))
        expect(sim.getConfig().getMemoria()).toBe(2048)
        expect(sim.getConfig().getQuantum()).toBe(5)
        expect(sim.getMapaMemoria()[0].getTamanio()).toBe(2048)
    })

    it.each([[0, 2], [-1, 2], [1024, 0], [1024, -3], [1.5, 2], [1024, 2.5]])(
        "rechaza configuracion invalida (%s, %s) sin crear el simulador",
        (memoria, quantum) => {
            let sim: Simulator | undefined
            expect(() => {
                sim = new Simulator(new Config(memoria, quantum))
            }).toThrow(ConfigInvalidaError)
            expect(sim).toBeUndefined()
        }
    )

    it("dos simuladores no comparten estado", () => {
        const a = new Simulator(Config.referencia())
        const b = new Simulator(new Config(256, 1))
        expect(a.getMapaMemoria()[0].getTamanio()).toBe(1024)
        expect(b.getMapaMemoria()[0].getTamanio()).toBe(256)
    })

    it("el mapa de memoria devuelto es una copia protegida", () => {
        const sim = new Simulator(Config.referencia())
        ;(sim.getMapaMemoria() as unknown[]).pop()
        expect(sim.getMapaMemoria()).toHaveLength(1)
    })

    it("las colas devueltas son copias protegidas", () => {
        const sim = new Simulator(Config.referencia())
        ;(sim.getListos() as string[]).push("P99")
        expect(sim.getListos()).toEqual([])
    })
})

describe("RF01 - ContiguousMemoryManager inicial", () => {
    it("toda la memoria esta libre al iniciar", () => {
        const m = new ContiguousMemoryManager(1024)
        expect(m.getTamanioTotal()).toBe(1024)
        expect(m.getMemoriaLibre()).toBe(1024)
    })
})