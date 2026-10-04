import { MemoryBlock } from "./MemoryBlock"

export interface MemoryManager {
    getTamanioTotal(): number
    getMemoriaLibre(): number
    getBloques(): readonly MemoryBlock[]
}
export interface MemoryManager {
    getTamanioTotal(): number
    getMemoriaLibre(): number
    getBloques(): readonly MemoryBlock[]
    asignar(pid: string, tamanio: number): boolean
    liberar(pid: string): boolean
}