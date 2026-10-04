import {it, describe, expect} from "vitest";
import{ Config } from "../src/Config";

describe("RF01 - Inicio & Configuracion", () => {
    it("Guarda la configuracion correctamente", () => {
        const config = new Config(1024,2);
        expect(config.getMemoria()).toBe(1024);
        expect(config.getQuantum()).toBe(2);

    })
    it("rechaza memoria en 0", () => {
    expect(() => new Config(0, 2)).toThrow();
});
})