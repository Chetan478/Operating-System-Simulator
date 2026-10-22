/**
 * File System: Linked Allocation for Non-Contiguous File Storage
 * Operating System Concept:
 * In Linked Allocation, each file is a linked list of disk blocks.
 * The blocks may be scattered anywhere on the disk.
 * The directory entry contains pointers to the first and last blocks of the file.
 * Each allocated block contains a pointer to the next block in the chain (-1 / NULL indicates EOF).
 * Advantages: No external fragmentation; any free block can satisfy a request; file can grow dynamically.
 * In RAILOS: Each booked PNR passenger dossier is stored as a linked file across 64 virtual disk blocks.
 */

import { DiskBlock, PNRFileRecord } from '../types';

export const TOTAL_DISK_BLOCKS = 64;

/**
 * Initializes a clean virtual disk with 64 unallocated blocks
 */
export function initializeDisk(totalBlocks: number = TOTAL_DISK_BLOCKS): DiskBlock[] {
  const blocks: DiskBlock[] = [];
  for (let i = 0; i < totalBlocks; i++) {
    blocks.push({
      id: i,
      isAllocated: false,
      filePnr: null,
      fileName: null,
      nextBlock: null,
      color: null,
    });
  }
  return blocks;
}

/**
 * Traverses a linked chain from startBlock to EOF (-1)
 */
export function traceBlockChain(blocks: DiskBlock[], startBlock: number): number[] {
  const chain: number[] = [];
  const visited = new Set<number>();
  let current: number | null = startBlock;

  while (current !== null && current !== -1 && !visited.has(current) && current < blocks.length) {
    chain.push(current);
    visited.add(current);
    current = blocks[current].nextBlock;
  }

  return chain;
}

/**
 * Allocates blocks for a PNR record using non-contiguous Linked Allocation
 */
export function allocateLinkedFile(
  currentBlocks: DiskBlock[],
  fileData: {
    pnr: string;
    fileName: string;
    passengerName: string;
    trainNo: string;
    trainName: string;
    journeyDate: string;
    seats: number;
    color: string;
  },
  sizeInBlocks: number
): {
  success: boolean;
  updatedBlocks: DiskBlock[];
  fileRecord: PNRFileRecord | null;
  message: string;
} {
  const blocks: DiskBlock[] = currentBlocks.map((b) => ({ ...b }));

  // Find all currently free blocks
  const freeBlockIds = blocks.filter((b) => !b.isAllocated).map((b) => b.id);

  if (freeBlockIds.length < sizeInBlocks) {
    return {
      success: false,
      updatedBlocks: currentBlocks,
      fileRecord: null,
      message: `Disk Full! Need ${sizeInBlocks} blocks for PNR ${fileData.pnr}, but only ${freeBlockIds.length} free blocks available.`,
    };
  }

  // To simulate realistic scattered disk allocation, pick non-contiguous blocks
  // (scattered distribution across free blocks)
  const chosenBlockIds: number[] = [];
  const step = Math.max(1, Math.floor(freeBlockIds.length / sizeInBlocks));

  for (let i = 0; i < sizeInBlocks; i++) {
    const idx = (i * step) % freeBlockIds.length;
    // ensure uniqueness
    let pick = freeBlockIds[idx];
    if (chosenBlockIds.includes(pick)) {
      pick = freeBlockIds.find((id) => !chosenBlockIds.includes(id))!;
    }
    chosenBlockIds.push(pick);
  }

  // Link the chosen blocks together
  for (let i = 0; i < chosenBlockIds.length; i++) {
    const blockId = chosenBlockIds[i];
    const nextBlockId = i < chosenBlockIds.length - 1 ? chosenBlockIds[i + 1] : -1; // -1 represents NULL / EOF

    blocks[blockId].isAllocated = true;
    blocks[blockId].filePnr = fileData.pnr;
    blocks[blockId].fileName = fileData.fileName;
    blocks[blockId].nextBlock = nextBlockId;
    blocks[blockId].color = fileData.color;
  }

  const startBlock = chosenBlockIds[0];
  const endBlock = chosenBlockIds[chosenBlockIds.length - 1];

  const fileRecord: PNRFileRecord = {
    ...fileData,
    sizeInBlocks,
    startBlock,
    endBlock,
    blockChain: chosenBlockIds,
    timestamp: new Date().toLocaleTimeString(),
  };

  const chainVisual = chosenBlockIds.join(' -> ') + ' -> NULL';

  return {
    success: true,
    updatedBlocks: blocks,
    fileRecord,
    message: `Linked File created successfully for PNR ${fileData.pnr}. Blocks: [ ${chainVisual} ]`,
  };
}

/**
 * Deletes a file by traversing and freeing all blocks in its linked chain
 */
export function deleteLinkedFile(
  currentBlocks: DiskBlock[],
  pnr: string
): {
  success: boolean;
  updatedBlocks: DiskBlock[];
  freedBlockIds: number[];
  message: string;
} {
  const blocks: DiskBlock[] = currentBlocks.map((b) => ({ ...b }));
  const freedBlockIds: number[] = [];

  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].filePnr === pnr) {
      freedBlockIds.push(blocks[i].id);
      blocks[i].isAllocated = false;
      blocks[i].filePnr = null;
      blocks[i].fileName = null;
      blocks[i].nextBlock = null;
      blocks[i].color = null;
    }
  }

  if (freedBlockIds.length === 0) {
    return {
      success: false,
      updatedBlocks: currentBlocks,
      freedBlockIds: [],
      message: `PNR file ${pnr} not found on virtual disk.`,
    };
  }

  return {
    success: true,
    updatedBlocks: blocks,
    freedBlockIds,
    message: `Freed ${freedBlockIds.length} blocks [ ${freedBlockIds.join(', ')} ] occupied by PNR ${pnr}. Returned to free list.`,
  };
}

/**
 * Preloads realistic default PNR files for initial simulator demonstration
 */
export function getInitialDemoFilesAndDisk(): {
  blocks: DiskBlock[];
  files: PNRFileRecord[];
} {
  let blocks = initializeDisk();
  const files: PNRFileRecord[] = [];

  const initialDossiers = [
    {
      pnr: '8421903412',
      fileName: 'PNR_8421903412.dat',
      passengerName: 'Aarav Sharma',
      trainNo: '12951',
      trainName: 'Mumbai Rajdhani',
      journeyDate: '2026-11-05',
      seats: 2,
      color: '#38bdf8', // Sky
      sizeInBlocks: 3,
    },
    {
      pnr: '9204178523',
      fileName: 'PNR_9204178523.dat',
      passengerName: 'Priya Verma',
      trainNo: '22221',
      trainName: 'CSMT Rajdhani',
      journeyDate: '2026-11-06',
      seats: 1,
      color: '#f59e0b', // Amber
      sizeInBlocks: 2,
    },
    {
      pnr: '7156294038',
      fileName: 'PNR_7156294038.dat',
      passengerName: 'Rohan Deshmukh',
      trainNo: '12009',
      trainName: 'Shatabdi Express',
      journeyDate: '2026-11-05',
      seats: 4,
      color: '#10b981', // Emerald
      sizeInBlocks: 4,
    },
  ];

  for (const item of initialDossiers) {
    const res = allocateLinkedFile(blocks, item, item.sizeInBlocks);
    if (res.success && res.fileRecord) {
      blocks = res.updatedBlocks;
      files.push(res.fileRecord);
    }
  }

  return { blocks, files };
}
