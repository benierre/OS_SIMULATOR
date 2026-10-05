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
export class ProcesoInvalidoError extends Error {
    constructor(mensaje: string) {
        super(mensaje)
        this.name = "ProcesoInvalidoError"
    }
}

export class PidDuplicadoError extends Error {
    constructor(mensaje: string) {
        super(mensaje)
        this.name = "PidDuplicadoError"
    }
}

export class ProcesoExcedeMemoriaError extends Error {
    constructor(mensaje: string) {
        super(mensaje)
        this.name = "ProcesoExcedeMemoriaError"
    }
}
export class TransicionInvalidaError extends Error {
    constructor(mensaje: string) {
        super(mensaje)
        this.name = "TransicionInvalidaError"
    }
}

export class ProcesoNoEncontradoError extends Error {
    constructor(mensaje: string) {
        super(mensaje)
        this.name = "ProcesoNoEncontradoError"
    }
}
