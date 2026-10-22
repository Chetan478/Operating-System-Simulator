/**
 * Memory Management: Contiguous Variable Partition Allocation
 * Operating System Concept: Dynamic storage-allocation algorithms.
 * - First Fit: Allocates the first hole that is big enough.
 * - Best Fit: Allocates the smallest hole that is big enough (leaves smallest leftover).
 * - Worst Fit: Allocates the largest hole (leaves largest leftover hole).
 * Fragmentation:
 * - Internal Fragmentation: Memory internal to a partition that is wasted when allocated memory is slightly larger than requested.
 * - External Fragmentation: Total free memory space is enough to satisfy a request, but it is not contiguous (scattered in small holes).
 */

import { MemoryPartition, FitAlgorithm, FitResult } from '../types';

export function allocateMemory(
  partitionsInput: MemoryPartition[],
  requestedSize: number,
  algorithm: FitAlgorithm,
  processId: string,
  processName: string
): FitResult {
  // Deep clone partitions
  const partitions: MemoryPartition[] = partitionsInput.map((p) => ({ ...p }));

  let chosenIndex = -1;

  if (algorithm === 'FIRST_FIT') {
    // Find the first unallocated block with sufficient size
    for (let i = 0; i < partitions.length; i++) {
      if (!partitions[i].isAllocated && partitions[i].size >= requestedSize) {
        chosenIndex = i;
        break;
      }
    }
  } else if (algorithm === 'BEST_FIT') {
    // Find unallocated block with the SMALLEST size >= requestedSize
    let minDiff = Infinity;
    for (let i = 0; i < partitions.length; i++) {
      if (!partitions[i].isAllocated && partitions[i].size >= requestedSize) {
        const diff = partitions[i].size - requestedSize;
        if (diff < minDiff) {
          minDiff = diff;
          chosenIndex = i;
        }
      }
    }
  } else if (algorithm === 'WORST_FIT') {
    // Find unallocated block with the LARGEST size >= requestedSize
    let maxDiff = -1;
    for (let i = 0; i < partitions.length; i++) {
      if (!partitions[i].isAllocated && partitions[i].size >= requestedSize) {
        const diff = partitions[i].size - requestedSize;
        if (diff > maxDiff) {
          maxDiff = diff;
          chosenIndex = i;
        }
      }
    }
  }

  // Calculate total free memory for external fragmentation analysis
  const totalFreeMemory = partitions
    .filter((p) => !p.isAllocated)
    .reduce((sum, p) => sum + p.size, 0);

  if (chosenIndex === -1) {
    // Allocation failed
    const externalFrag = totalFreeMemory >= requestedSize ? totalFreeMemory : 0;
    return {
      partitions,
      allocatedPartitionId: null,
      internalFragmentation: 0,
      externalFragmentation: externalFrag,
      success: false,
      message:
        externalFrag > 0
          ? `Allocation Failed! Total free memory is ${totalFreeMemory} KB, but no single contiguous partition is >= ${requestedSize} KB. This is External Fragmentation!`
          : `Allocation Failed! Insufficient total memory (Only ${totalFreeMemory} KB free, requested ${requestedSize} KB).`,
    };
  }

  // Allocate partition
  const target = partitions[chosenIndex];
  const internalFrag = target.size - requestedSize;

  target.isAllocated = true;
  target.processId = processId;
  target.processName = processName;
  target.internalFragmentation = internalFrag;

  return {
    partitions,
    allocatedPartitionId: target.id,
    internalFragmentation: internalFrag,
    externalFragmentation: 0,
    success: true,
    message: `Allocated ${requestedSize} KB in Partition #${target.id} (Capacity: ${target.size} KB) using ${algorithm.replace('_', ' ')}. Internal Fragmentation = ${internalFrag} KB.`,
  };
}

/**
 * Default Railway Server Memory Partitions (e.g., Passenger Session Buffers)
 */
export const INITIAL_PARTITIONS: MemoryPartition[] = [
  { id: 1, startAddress: 0, size: 100, isAllocated: false, internalFragmentation: 0 },
  { id: 2, startAddress: 100, size: 500, isAllocated: false, internalFragmentation: 0 },
  { id: 3, startAddress: 600, size: 200, isAllocated: false, internalFragmentation: 0 },
  { id: 4, startAddress: 800, size: 300, isAllocated: false, internalFragmentation: 0 },
  { id: 5, startAddress: 1100, size: 600, isAllocated: false, internalFragmentation: 0 },
];
