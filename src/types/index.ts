/**
 * RAILOS - Railway Ticket Booking OS Simulator
 * Types Definition
 * Subject: Operating System (315319) - Semester V (Computer Engineering)
 */

export type ProcessState = 'NEW' | 'READY' | 'RUNNING' | 'WAITING' | 'TERMINATED';

export type BookingQuota = 'General' | 'Tatkal';

export interface TrainInfo {
  trainNo: string;
  trainName: string;
  source: string;
  destination: string;
  departureTime: string;
  totalSeats: number;
  availableGeneral: number;
  availableTatkal: number;
  fare: number;
}

/**
 * Process Control Block (PCB) representing an active ticket reservation transaction
 */
export interface PCB {
  pid: string;                     // e.g., "P1", "P2"
  pnr: string;                     // 10-digit PNR, e.g., "8421903412"
  passengerName: string;           // Name of traveler
  trainNo: string;                 // e.g., "12951"
  trainName: string;               // e.g., "Mumbai Rajdhani Express"
  quota: BookingQuota;             // General or Tatkal
  priority: number;                // 1 (Highest / Tatkal) to 5 (Lowest / General)
  state: ProcessState;             // Current state in 5-state process lifecycle
  arrivalTime: number;             // Arrival timestamp (simulation seconds)
  burstTime: number;               // Required CPU processing time
  remainingTime: number;           // Remaining CPU burst time
  completionTime?: number;         // Timestamp when process finishes
  waitingTime?: number;            // Turnaround Time - Burst Time
  turnaroundTime?: number;         // Completion Time - Arrival Time
  responseTime?: number;           // Time from arrival to first CPU dispatch
  memoryAllocated: number;         // Memory in KB (e.g., 64KB for session buffer)
  allocatedBlocks: number[];       // Disk blocks allocated for PNR record
  color: string;                   // Hex color for Gantt and Disk block highlighting
  stepLogs: string[];              // Sequence of OS actions triggered
}

export type SchedulingAlgorithm = 'FCFS' | 'SJF' | 'PRIORITY' | 'ROUND_ROBIN';

export interface GanttSlice {
  pid: string;
  label: string;
  startTime: number;
  endTime: number;
  color: string;
  isIdle?: boolean;
}

export interface SchedulingResult {
  algorithm: SchedulingAlgorithm;
  processes: PCB[];
  ganttChart: GanttSlice[];
  avgWaitingTime: number;
  avgTurnaroundTime: number;
  avgResponseTime: number;
  cpuUtilization: number;
  throughput: number;
  timeQuantum?: number;
}

/**
 * Banker's Algorithm Deadlock Avoidance Structures
 * Resources: 
 * R0: Seat Quota (SQ)
 * R1: Payment Gateway (PG)
 * R2: DB Lock (DB)
 * R3: SMS Server (SMS)
 */
export interface BankersState {
  resourceNames: string[];
  totalResources: number[];        // Total system capacity
  available: number[];             // Currently unallocated vector
  allocation: number[][];          // Current allocation matrix [Process][Resource]
  max: number[][];                 // Maximum demand matrix [Process][Resource]
  need: number[][];                // Need matrix = Max - Allocation
  processIds: string[];            // Names like P1, P2...
}

export interface SafetyStepTrace {
  step: number;
  pid: string;
  workBefore: number[];
  need: number[];
  allocation: number[];
  canAllocate: boolean;
  workAfter: number[];
}

export interface SafetyResult {
  isSafe: boolean;
  safeSequence: string[];
  steps: SafetyStepTrace[];
  message: string;
}

export interface ResourceRequestResult {
  granted: boolean;
  message: string;
  newState?: BankersState;
  safeSequence?: string[];
  steps?: SafetyStepTrace[];
}

/**
 * Memory Partitioning (First Fit, Best Fit, Worst Fit)
 */
export type FitAlgorithm = 'FIRST_FIT' | 'BEST_FIT' | 'WORST_FIT';

export interface MemoryPartition {
  id: number;
  startAddress: number;            // Starting address (e.g. 0 KB, 100 KB)
  size: number;                    // Size in KB
  isAllocated: boolean;
  processId?: string;
  processName?: string;
  internalFragmentation: number;   // Wasted space within partition
}

export interface FitResult {
  partitions: MemoryPartition[];
  allocatedPartitionId: number | null;
  internalFragmentation: number;
  externalFragmentation: number;
  success: boolean;
  message: string;
}

/**
 * Virtual Memory Paging & Page Replacement (FIFO / LRU)
 */
export interface PageStep {
  step: number;
  page: number;                    // Coach Seat Page referenced
  frames: (number | null)[];       // State of memory frames at this step
  isHit: boolean;                  // True if page was already resident
  victimPage: number | null;       // Replaced page if fault and frame was full
}

export interface PageReplacementResult {
  algorithm: 'FIFO' | 'LRU';
  referenceString: number[];
  framesCount: number;
  steps: PageStep[];
  totalHits: number;
  totalFaults: number;
  hitRatio: number;
  faultRatio: number;
}

/**
 * Linked File Allocation for PNR Persistence
 */
export interface DiskBlock {
  id: number;                      // 0 to 63 (64 virtual blocks)
  isAllocated: boolean;
  filePnr: string | null;
  fileName: string | null;
  nextBlock: number | null;        // -1 represents EOF (End of File)
  color: string | null;
}

export interface PNRFileRecord {
  pnr: string;
  fileName: string;
  passengerName: string;
  trainNo: string;
  trainName: string;
  journeyDate: string;
  seats: number;
  sizeInBlocks: number;
  startBlock: number;
  endBlock: number;
  blockChain: number[];            // Ordered chain of block indices
  color: string;
  timestamp: string;
}

/**
 * Inter-Process Communication (IPC) Structures
 */
export interface SharedSeatSlot {
  seatId: string;                  // e.g., "B1-04"
  coach: string;
  seatNumber: number;
  status: 'AVAILABLE' | 'LOCKED' | 'CONFIRMED';
  lockedBySession?: string;        // e.g., "Session-A"
  pnr?: string;
}

export interface IPCMessage {
  id: string;
  timestamp: string;
  sender: string;                  // e.g., "BookingWorker-1"
  receiver: string;                // e.g., "PaymentGatewayService"
  action: string;                  // e.g., "DEBIT_RESERVE"
  payload: string;
  status: 'SENT' | 'PROCESSED' | 'ACKNOWLEDGED';
}

/**
 * System Information and Metrics
 */
export interface SystemMetricSnapshot {
  osName: string;
  version: string;
  kernel: string;
  hostName: string;
  uptimeSeconds: number;
  activeSessions: number;
  cpuUsagePercent: number;
  seatBufferUsagePercent: number;
  architecture: string;
}
