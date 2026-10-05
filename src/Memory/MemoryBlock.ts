import { BloqueInvalidoError } from "../Errores"

const exigir = (condicion: boolean, error: Error): void => {
    condicion || (() => { throw error })()
}

export class MemoryBlock {
    private readonly inicio: number
    private readonly tamanio: number
    private readonly pid: string | undefined

    constructor(inicio: number, tamanio: number, pid?: string) {
        exigir(Number.isInteger(inicio) && inicio >= 0, new BloqueInvalidoError(`inicio debe ser un entero >= 0 (recibido: ${inicio})`))
        exigir(Number.isInteger(tamanio) && tamanio > 0, new BloqueInvalidoError(`tamanio debe ser un entero positivo (recibido: ${tamanio})`))
        this.inicio = inicio
        this.tamanio = tamanio
        this.pid = pid
    }

    getInicio(): number { return this.inicio }
    getTamanio(): number { return this.tamanio }
    getFin(): number { return this.inicio + this.tamanio }
    getPid(): string | undefined { return this.pid }
    estaLibre(): boolean { return this.pid === undefined }
}
