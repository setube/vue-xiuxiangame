import { assertFiniteNumber, invariant } from '@/utils/assert'

interface HeapEntry<T> { node: T; priority: number }

/** A minimum priority queue used by the map's A* pathfinder. */
export default class MinHeap<T = number[]> {
  private heap: HeapEntry<T>[] = []

  add(node: T, priority: number): void {
    assertFiniteNumber(priority, 'Heap priority')
    this.heap.push({ node, priority })
    this.bubbleUp(this.heap.length - 1)
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2)
      const parent = this.heap[parentIndex]
      const entry = this.heap[index]
      invariant(parent && entry, 'Heap entry must exist')
      if (parent.priority <= entry.priority) break
      this.heap[parentIndex] = entry
      this.heap[index] = parent
      index = parentIndex
    }
  }

  poll(): T {
    const minimum = this.heap[0]
    invariant(minimum, 'Cannot poll an empty heap')
    const end = this.heap.pop()
    if (this.heap.length > 0) {
      invariant(end, 'Heap tail must exist')
      this.heap[0] = end
      this.bubbleDown(0)
    }
    return minimum.node
  }

  private bubbleDown(index: number): void {
    while (true) {
      const entry = this.heap[index]
      invariant(entry, 'Heap entry must exist')
      const leftIndex = 2 * index + 1
      const rightIndex = leftIndex + 1
      const left = this.heap[leftIndex]
      const right = this.heap[rightIndex]
      let swapIndex = index
      let smallest = entry
      if (left && left.priority < smallest.priority) { swapIndex = leftIndex; smallest = left }
      if (right && right.priority < smallest.priority) { swapIndex = rightIndex; smallest = right }
      if (swapIndex === index) break
      this.heap[index] = smallest
      this.heap[swapIndex] = entry
      index = swapIndex
    }
  }

  isEmpty(): boolean { return this.heap.length === 0 }
}
