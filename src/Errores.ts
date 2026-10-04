export class ConfigInvalidaError extends Error {
    constructor(mensaje: string) {
        super(mensaje)
        this.name = "ConfigInvalidaError"
    }
}

export class BloqueInvalidoError extends Error {
    constructor(mensaje: string) {
        super(mensaje)
        this.name = "BloqueInvalidoError"
    }
}