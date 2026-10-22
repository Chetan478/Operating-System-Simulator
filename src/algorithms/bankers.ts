/**
 * Banker's Algorithm for Deadlock Avoidance
 * Operating System Concept: Developed by Edsger Dijkstra, tests for safe state
 * by simulating maximum possible allocation for all processes before allowing requests.
 * In RAILOS: Manages critical concurrent booking resources:
 * - Resource 0: Seat Quota (SQ)
 * - Resource 1: Payment Gateway channels (PG)
 * - Resource 2: Database Row Locks (DB)
 * - Resource 3: SMS Notification Workers (SMS)
 */

import {
  BankersState,
  SafetyResult,
  SafetyStepTrace,
  ResourceRequestResult,
} from '../types';

/**
 * Calculates Need matrix: Need[i][j] = Max[i][j] - Allocation[i][j]
 */
export function calculateNeedMatrix(max: number[][], allocation: number[][]): number[][] {
  return max.map((row, i) =>
    row.map((val, j) => {
      const allocated = allocation[i] && allocation[i][j] !== undefined ? allocation[i][j] : 0;
      return Math.max(0, val - allocated);
    })
  );
}

/**
 * Safety Algorithm to determine if the system is in a Safe State
 */
export function checkSystemSafety(state: BankersState): SafetyResult {
  const numProcesses = state.processIds.length;
  const numResources = state.resourceNames.length;

  const work = [...state.available];
  const finish = new Array(numProcesses).fill(false);
  const safeSequence: string[] = [];
  const steps: SafetyStepTrace[] = [];

  const need = calculateNeedMatrix(state.max, state.allocation);

  let stepCounter = 1;
  let progressMade = true;

  while (progressMade) {
    progressMade = false;

    for (let i = 0; i < numProcesses; i++) {
      if (!finish[i]) {
        const pid = state.processIds[i];
        const processNeed = need[i];
        const processAlloc = state.allocation[i];

        // Check if Need_i <= Work for all resources
        let canExecute = true;
        for (let j = 0; j < numResources; j++) {
          if (processNeed[j] > work[j]) {
            canExecute = false;
            break;
          }
        }

        if (canExecute) {
          const workBefore = [...work];

          // Simulate process execution and resource release
          for (let j = 0; j < numResources; j++) {
            work[j] += processAlloc[j];
          }

          finish[i] = true;
          safeSequence.push(pid);
          progressMade = true;

          steps.push({
            step: stepCounter++,
            pid,
            workBefore,
            need: [...processNeed],
            allocation: [...processAlloc],
            canAllocate: true,
            workAfter: [...work],
          });
        }
      }
    }
  }

  // If all processes finished, system is in safe state
  const isSafe = finish.every((f) => f === true);

  return {
    isSafe,
    safeSequence: isSafe ? safeSequence : [],
    steps,
    message: isSafe
      ? `System is in a SAFE STATE. Safe Execution Sequence: < ${safeSequence.join(' -> ')} >`
      : 'DEADLOCK HAZARD: System is in an UNSAFE STATE! No complete safe sequence exists.',
  };
}

/**
 * Resource-Request Algorithm: Evaluates if an immediate resource request can be granted safely
 */
export function requestResources(
  state: BankersState,
  processIndex: number,
  requestVector: number[]
): ResourceRequestResult {
  const numResources = state.resourceNames.length;
  const pid = state.processIds[processIndex];
  const need = calculateNeedMatrix(state.max, state.allocation);

  // Condition 1: Request <= Need
  for (let j = 0; j < numResources; j++) {
    if (requestVector[j] > need[processIndex][j]) {
      return {
        granted: false,
        message: `Error: Process ${pid} requested ${requestVector[j]} of ${state.resourceNames[j]}, exceeding its declared maximum claim of ${need[processIndex][j]}.`,
      };
    }
  }

  // Condition 2: Request <= Available
  for (let j = 0; j < numResources; j++) {
    if (requestVector[j] > state.available[j]) {
      return {
        granted: false,
        message: `Process ${pid} must WAIT: requested ${requestVector[j]} of ${state.resourceNames[j]}, but only ${state.available[j]} are currently available.`,
      };
    }
  }

  // Tentative allocation
  const newAvailable = [...state.available];
  const newAllocation = state.allocation.map((row) => [...row]);
  const newMax = state.max.map((row) => [...row]);

  for (let j = 0; j < numResources; j++) {
    newAvailable[j] -= requestVector[j];
    newAllocation[processIndex][j] += requestVector[j];
  }

  const tentativeState: BankersState = {
    ...state,
    available: newAvailable,
    allocation: newAllocation,
    max: newMax,
    need: calculateNeedMatrix(newMax, newAllocation),
  };

  // Run safety check on tentative state
  const safety = checkSystemSafety(tentativeState);

  if (safety.isSafe) {
    return {
      granted: true,
      message: `Request GRANTED for ${pid}! System remains in a SAFE state with sequence < ${safety.safeSequence.join(' -> ')} >.`,
      newState: tentativeState,
      safeSequence: safety.safeSequence,
      steps: safety.steps,
    };
  } else {
    return {
      granted: false,
      message: `Request DENIED for ${pid}! Granting this request would lead to an UNSAFE state (potential deadlock). Process must wait.`,
    };
  }
}

/**
 * Standard Educational Presets for Demonstration
 */
export const SAFE_PRESET: BankersState = {
  resourceNames: ['Seat Quota (SQ)', 'Payment Gateway (PG)', 'DB Lock (DB)', 'SMS Server (SMS)'],
  totalResources: [10, 5, 7, 8],
  available: [3, 3, 2, 2],
  processIds: ['P0 (Mumbai Exp)', 'P1 (Rajdhani)', 'P2 (Vande Bharat)', 'P3 (Tejas Exp)', 'P4 (Garib Rath)'],
  allocation: [
    [0, 1, 0, 0], // P0
    [2, 0, 0, 1], // P1
    [3, 0, 2, 1], // P2
    [2, 1, 1, 1], // P3
    [0, 0, 2, 2], // P4
  ],
  max: [
    [7, 5, 3, 2], // P0
    [3, 2, 2, 2], // P1
    [9, 0, 2, 2], // P2
    [2, 2, 2, 2], // P3
    [4, 3, 3, 2], // P4
  ],
  need: [
    [7, 4, 3, 2],
    [1, 2, 2, 1],
    [6, 0, 0, 1],
    [0, 1, 1, 1],
    [4, 3, 1, 0],
  ],
};

export const UNSAFE_PRESET: BankersState = {
  resourceNames: ['Seat Quota (SQ)', 'Payment Gateway (PG)', 'DB Lock (DB)', 'SMS Server (SMS)'],
  totalResources: [10, 5, 7, 8],
  available: [0, 0, 0, 1], // Insufficient available resources to satisfy any process
  processIds: ['P0 (Mumbai Exp)', 'P1 (Rajdhani)', 'P2 (Vande Bharat)', 'P3 (Tejas Exp)'],
  allocation: [
    [3, 2, 2, 1],
    [3, 1, 2, 2],
    [2, 1, 1, 2],
    [2, 1, 2, 2],
  ],
  max: [
    [6, 4, 4, 3],
    [5, 4, 4, 4],
    [4, 3, 3, 3],
    [4, 3, 4, 4],
  ],
  need: [
    [3, 2, 2, 2],
    [2, 3, 2, 2],
    [2, 2, 2, 1],
    [2, 2, 2, 2],
  ],
};
