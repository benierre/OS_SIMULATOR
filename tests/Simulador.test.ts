import { it, describe, expect } from "vitest"
import { Simulator } from "../src/Simulador"
import { Config } from "../src/Config"
import { ContiguousMemoryManager } from "../src/Memory/AdministradorMemoriaContigua"
import {
    ConfigInvalidaError,
    TransicionInvalidaError,
} from "../src/Errores"
import { EstadoProceso, Process } from "../src/Proceso"



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
describe("RF03 - admision de procesos y memoria", () => {
    it("RF03.1 - con memoria suficiente pasa a Listo y queda encolado en Listos", () => {
        const sim = new Simulator(new Config(1000, 3))

        sim.registrarProceso("P1", 200, 4)

        expect(sim.obtenerProceso("P1")?.estado).toBe(EstadoProceso.Listo)
        expect(sim.getListos()).toEqual(["P1"])
        expect(sim.getEsperando()).toEqual([])
    })

    it("RF03.2 - sin bloque suficiente queda Esperando Memoria", () => {
        const sim = new Simulator(new Config(1000, 3))

        sim.registrarProceso("P1", 800, 4)
        sim.registrarProceso("P2", 300, 4)

        expect(sim.obtenerProceso("P1")?.estado).toBe(EstadoProceso.Listo)
        expect(sim.obtenerProceso("P2")?.estado).toBe(
            EstadoProceso.EsperandoMemoria
        )

        expect(sim.getListos()).toEqual(["P1"])
        expect(sim.getEsperando()).toEqual(["P2"])
    })

    it("RF03.5 - un proceso Terminado no vuelve a ninguna cola", () => {
        const proceso = new Process("P1", 200, 4)

        proceso.admitir()
        proceso.transicionarA(EstadoProceso.Ejecutando)
        proceso.transicionarA(EstadoProceso.Terminado)

        expect(proceso.getEstado()).toBe(EstadoProceso.Terminado)
    })

    it("RF03.6 - rechaza la transicion Nuevo a Ejecutando", () => {
        const proceso = new Process("P1", 200, 4)

        expect(() => {
            proceso.transicionarA(EstadoProceso.Ejecutando)
        }).toThrow(TransicionInvalidaError)
    })

    it("RF03.6 - rechaza cualquier transicion desde Terminado", () => {
        const proceso = new Process("P1", 200, 4)

        proceso.admitir()
        proceso.transicionarA(EstadoProceso.Ejecutando)
        proceso.transicionarA(EstadoProceso.Terminado)

        expect(() => {
            proceso.admitir()
        }).toThrow(TransicionInvalidaError)

        expect(() => {
            proceso.transicionarA(EstadoProceso.Listo)
        }).toThrow(TransicionInvalidaError)

        expect(() => {
            proceso.transicionarA(EstadoProceso.Ejecutando)
        }).toThrow(TransicionInvalidaError)
    })
    describe("RF04 - planificacion", () => {
    it("ejecuta el primer proceso de la cola de Listos", () => {
        const sim = new Simulator(new Config(1000, 3))

        sim.registrarProceso("P1", 200, 4)
        sim.registrarProceso("P2", 200, 3)

        sim.ejecutarProceso()

        expect(sim.obtenerProceso("P1")?.estado).toBe(
            EstadoProceso.Ejecutando
        )
        expect(sim.getPidEnCpu()).toBe("P1")
        expect(sim.getListos()).toEqual(["P2"])
    })

    it("incrementa los cambios de contexto al ejecutar un proceso", () => {
        const sim = new Simulator(new Config(1000, 3))

        sim.registrarProceso("P1", 200, 4)

        expect(sim.getCambiosDeContexto()).toBe(0)

        sim.ejecutarProceso()

        expect(sim.getCambiosDeContexto()).toBe(1)
    })

    it("no ejecuta otro proceso si la CPU está ocupada", () => {
        const sim = new Simulator(new Config(1000, 3))

        sim.registrarProceso("P1", 200, 4)
        sim.registrarProceso("P2", 200, 3)

        sim.ejecutarProceso()
        sim.ejecutarProceso()

        expect(sim.getPidEnCpu()).toBe("P1")
        expect(sim.obtenerProceso("P2")?.estado).toBe(
            EstadoProceso.Listo
        )
        expect(sim.getCambiosDeContexto()).toBe(1)
    })
    it("ejecuta un tick del proceso en CPU", () => {
    const sim = new Simulator(new Config(1000, 3))

    sim.registrarProceso("P1", 200, 4)
    sim.ejecutarProceso()

    sim.tickSimulador()

    expect(sim.getTick()).toBe(1)
    expect(sim.obtenerProceso("P1")?.cpuRestante).toBe(3)
    expect(sim.obtenerProceso("P1")?.quantumConsumido).toBe(1)
})

    it("libera CPU y memoria al finalizar; admite el pendiente en el tick siguiente", () => {
        const sim = new Simulator(new Config(100, 2))
        sim.registrarProceso("P1", 100, 1)
        sim.registrarProceso("P2", 100, 1)

        sim.tickSimulador()
        expect(sim.getTick()).toBe(1)
        expect(sim.getTerminados()).toEqual(["P1"])
        expect(sim.getEsperando()).toEqual(["P2"])

        sim.tickSimulador()
        expect(sim.getTick()).toBe(2)
        expect(sim.getTerminados()).toEqual(["P1", "P2"])
        expect(sim.getMapaMemoria()).toHaveLength(1)
        expect(sim.getMapaMemoria()[0].estaLibre()).toBe(true)
    })

    it("al vencer el quantum rota al final de Listos y contabiliza el cambio", () => {
        const sim = new Simulator(new Config(100, 1))
        sim.registrarProceso("P1", 20, 4)
        sim.registrarProceso("P2", 20, 4)
        sim.tickSimulador()
        expect(sim.getPidEnCpu()).toBeUndefined()
        expect(sim.getListos()).toEqual(["P2", "P1"])
        expect(sim.getCambiosDeContexto()).toBe(2)
        sim.tickSimulador()
        expect(sim.getPidEnCpu()).toBeUndefined()
        expect(sim.getListos()).toEqual(["P1", "P2"])
        expect(sim.getCambiosDeContexto()).toBe(3)
    })

    it("un proceso solo renueva su quantum sin cambio de contexto", () => {
        const sim = new Simulator(new Config(100, 1))
        sim.registrarProceso("P1", 20, 4)
        sim.tickSimulador()
        sim.tickSimulador()
        expect(sim.getPidEnCpu()).toBe("P1")
        expect(sim.obtenerProceso("P1")?.quantumConsumido).toBe(0)
        expect(sim.getCambiosDeContexto()).toBe(1)
    })

})})
