import { MemoryBlock } from "./MemoryBlock"

export interface MemoryManager {
    getTamanioTotal(): number
    getMemoriaLibre(): number
    getBloques(): readonly MemoryBlock[]
}