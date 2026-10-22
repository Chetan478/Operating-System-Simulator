/**
 * Virtual Memory Management: Page Replacement Algorithms (FIFO and LRU)
 * Operating System Concept:
 * When a page fault occurs and physical memory frames are completely full,
 * the OS must choose a victim page to swap out.
 * - FIFO (First-In, First-Out): Replaces the page that has been in memory the longest.
 * - LRU (Least Recently Used): Replaces the page that has not been referenced for the longest time.
 * In RAILOS: Train coach seat reservations are grouped into virtual pages (Coach S1 = Page 1, S2 = Page 2, etc.).
 * Fast RAM cache frames store active coach layout charts; swapping occurs during heavy booking load.
 */

import { PageReplacementResult, PageStep } from '../types';

/**
 * First-In, First-Out (FIFO) Page Replacement
 */
export function runFIFO(referenceString: number[], frameCount: number): PageReplacementResult {
  const frames: (number | null)[] = new Array(frameCount).fill(null);
  const fifoQueue: number[] = []; // Tracks arrival order of pages in frames
  const steps: PageStep[] = [];

  let totalHits = 0;
  let totalFaults = 0;

  for (let stepIdx = 0; stepIdx < referenceString.length; stepIdx++) {
    const page = referenceString[stepIdx];
    const isHit = frames.includes(page);
    let victimPage: number | null = null;

    if (isHit) {
      totalHits++;
    } else {
      totalFaults++;
      // Check if there is an empty frame
      const emptySlotIndex = frames.indexOf(null);
      if (emptySlotIndex !== -1) {
        frames[emptySlotIndex] = page;
        fifoQueue.push(page);
      } else {
        // Frame full: evict oldest page in queue
        victimPage = fifoQueue.shift()!;
        const replaceIndex = frames.indexOf(victimPage);
        frames[replaceIndex] = page;
        fifoQueue.push(page);
      }
    }

    steps.push({
      step: stepIdx + 1,
      page,
      frames: [...frames],
      isHit,
      victimPage,
    });
  }

  const total = referenceString.length;
  return {
    algorithm: 'FIFO',
    referenceString,
    framesCount: frameCount,
    steps,
    totalHits,
    totalFaults,
    hitRatio: total > 0 ? Number((totalHits / total).toFixed(4)) : 0,
    faultRatio: total > 0 ? Number((totalFaults / total).toFixed(4)) : 0,
  };
}

/**
 * Least Recently Used (LRU) Page Replacement
 */
export function runLRU(referenceString: number[], frameCount: number): PageReplacementResult {
  const frames: (number | null)[] = new Array(frameCount).fill(null);
  // Map page -> last referenced step index
  const lastUsedTime = new Map<number, number>();
  const steps: PageStep[] = [];

  let totalHits = 0;
  let totalFaults = 0;

  for (let stepIdx = 0; stepIdx < referenceString.length; stepIdx++) {
    const page = referenceString[stepIdx];
    const isHit = frames.includes(page);
    let victimPage: number | null = null;

    if (isHit) {
      totalHits++;
      lastUsedTime.set(page, stepIdx);
    } else {
      totalFaults++;
      const emptySlotIndex = frames.indexOf(null);
      if (emptySlotIndex !== -1) {
        frames[emptySlotIndex] = page;
        lastUsedTime.set(page, stepIdx);
      } else {
        // Find page in frames with smallest lastUsedTime
        let leastRecentlyUsedPage = frames[0]!;
        let minTime = Infinity;

        for (const residentPage of frames) {
          if (residentPage !== null) {
            const time = lastUsedTime.get(residentPage) ?? -1;
            if (time < minTime) {
              minTime = time;
              leastRecentlyUsedPage = residentPage;
            }
          }
        }

        victimPage = leastRecentlyUsedPage;
        const replaceIndex = frames.indexOf(victimPage);
        frames[replaceIndex] = page;
        lastUsedTime.set(page, stepIdx);
      }
    }

    steps.push({
      step: stepIdx + 1,
      page,
      frames: [...frames],
      isHit,
      victimPage,
    });
  }

  const total = referenceString.length;
  return {
    algorithm: 'LRU',
    referenceString,
    framesCount: frameCount,
    steps,
    totalHits,
    totalFaults,
    hitRatio: total > 0 ? Number((totalHits / total).toFixed(4)) : 0,
    faultRatio: total > 0 ? Number((totalFaults / total).toFixed(4)) : 0,
  };
}

/**
 * Belady's Anomaly Demonstration
 * Demonstrates that for FIFO, increasing the number of page frames can paradoxically INCREASE page faults.
 * Standard textbook reference string: [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5]
 * Frame 3: 9 Page Faults
 * Frame 4: 10 Page Faults (Anomaly!)
 */
export function testBeladysAnomaly(): {
  referenceString: number[];
  fifo3Frames: PageReplacementResult;
  fifo4Frames: PageReplacementResult;
  anomalyDetected: boolean;
  explanation: string;
} {
  const refString = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];
  const fifo3 = runFIFO(refString, 3);
  const fifo4 = runFIFO(refString, 4);

  return {
    referenceString: refString,
    fifo3Frames: fifo3,
    fifo4Frames: fifo4,
    anomalyDetected: fifo4.totalFaults > fifo3.totalFaults,
    explanation: `Bélády's Anomaly Proven: With 3 frames, FIFO produced ${fifo3.totalFaults} faults. Increasing to 4 frames resulted in ${fifo4.totalFaults} faults! (More memory led to more page faults). Note: LRU is a stack algorithm and NEVER experiences Bélády's anomaly.`,
  };
}
