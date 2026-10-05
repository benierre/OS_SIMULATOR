import { ConfigInvalidaError } from "./Errores"

const exigir = (condicion: boolean, error: Error): void => {
    condicion || (() => { throw error })()
}

export class Config {
    private readonly memoria: number
    private readonly quantum: number

    constructor(memoria: number, quantum: number) {
        Config.exigirEnteroPositivo("memoria", memoria)
        Config.exigirEnteroPositivo("quantum", quantum)
        this.memoria = memoria
        this.quantum = quantum
    }

    static referencia(): Config {
        return new Config(1024, 2)
    }

    getMemoria(): number {
        return this.memoria
    }

    getQuantum(): number {
        return this.quantum
    }

    private static exigirEnteroPositivo(nombre: string, valor: number): void {
        exigir(Number.isInteger(valor) && valor > 0, new ConfigInvalidaError(
                `${nombre} debe ser un entero positivo (recibido: ${valor})`
            ))
    }
}
