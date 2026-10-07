import { it, describe, expect } from "vitest"
import { Config } from "../src/Config"
import { ConfigInvalidaError } from "../src/Errores"

describe("RF01 - Config", () => {
    it("guarda memoria y quantum validos", () => {
        const config = new Config(512, 3)
        expect(config.getMemoria()).toBe(512)
        expect(config.getQuantum()).toBe(3)
    })

    it("la configuracion de referencia es 1024 KB y quantum 2", () => {
        const config = Config.referencia()
        expect(config.getMemoria()).toBe(1024)
        expect(config.getQuantum()).toBe(3)
    })

    it.each([0, -1, 1.5, NaN, Infinity])("rechaza memoria ", (valor) => {
        expect(() => new Config(valor, 3)).toThrow(ConfigInvalidaError)
    })

    it.each([0, -1, 1.5, NaN, Infinity])("rechaza quantum ", (valor) => {
        expect(() => new Config(1024, valor)).toThrow(ConfigInvalidaError)
    })

    it("acepta el limite inferior (1, 1)", () => {
        const config = new Config(1, 1)
        expect(config.getMemoria()).toBe(1)
        expect(config.getQuantum()).toBe(1)
    })
})