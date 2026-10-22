/**
 * Round Robin (RR) CPU Scheduling Algorithm
 * Operating System Concept: Preemptive scheduling designed specifically for time-sharing systems.
 * Each ready process is assigned the CPU for a fixed time slice (time quantum).
 * If the process does not finish within its quantum, it is preempted and returned to the back of the ready queue.
 * In RAILOS: Ensures fair multi-user access so no single massive booking blocks other passengers.
 */

import { PCB, GanttSlice, SchedulingResult } from '../types';

export function runRoundRobin(inputProcesses: PCB[], quantum: number): SchedulingResult {
  const q = Math.max(1, quantum);
  const processes: PCB[] = inputProcesses.map((p) => ({
    ...p,
    remainingTime: p.burstTime,
  }));
  const n = processes.length;

  if (n === 0) {
    return {
      algorithm: 'ROUND_ROBIN',
      processes: [],
      ganttChart: [],
      avgWaitingTime: 0,
      avgTurnaroundTime: 0,
      avgResponseTime: 0,
      cpuUtilization: 0,
      throughput: 0,
      timeQuantum: q,
    };
  }

  // Sort initially by arrival time, tie-breaker PID
  const sortedArrivals = [...processes].sort((a, b) => {
    if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
    return a.pid.localeCompare(b.pid);
  });

  const readyQueue: PCB[] = [];
  const enqueuedPids = new Set<string>();
  const firstScheduled = new Map<string, number>();
  const ganttChart: GanttSlice[] = [];

  let currentTime = 0;
  let totalBusyTime = 0;
  let completedCount = 0;

  // Enqueue processes arriving at t=0
  for (const p of sortedArrivals) {
    if (p.arrivalTime <= currentTime && !enqueuedPids.has(p.pid)) {
      readyQueue.push(p);
      enqueuedPids.add(p.pid);
    }
  }

  while (completedCount < n) {
    if (readyQueue.length === 0) {
      // Find next earliest arriving process that is not yet completed
      const remainingUnarrived = sortedArrivals.filter(
        (p) => !enqueuedPids.has(p.pid) && p.remainingTime > 0
      );

      if (remainingUnarrived.length === 0) {
        break; // All processes accounted for
      }

      const nextArrival = Math.min(...remainingUnarrived.map((p) => p.arrivalTime));

      ganttChart.push({
        pid: 'IDLE',
        label: 'CPU Idle',
        startTime: currentTime,
        endTime: nextArrival,
        color: '#334155',
        isIdle: true,
      });

      currentTime = nextArrival;

      // Enqueue all processes arriving at this new timestamp
      for (const p of sortedArrivals) {
        if (p.arrivalTime <= currentTime && !enqueuedPids.has(p.pid) && p.remainingTime > 0) {
          readyQueue.push(p);
          enqueuedPids.add(p.pid);
        }
      }
      continue;
    }

    const currentProcess = readyQueue.shift()!;

    // Track first response time
    if (!firstScheduled.has(currentProcess.pid)) {
      firstScheduled.set(currentProcess.pid, currentTime);
      currentProcess.responseTime = currentTime - currentProcess.arrivalTime;
    }

    const execTime = Math.min(currentProcess.remainingTime, q);
    const startTime = currentTime;
    const endTime = startTime + execTime;

    ganttChart.push({
      pid: currentProcess.pid,
      label: `${currentProcess.pid} (${currentProcess.passengerName})`,
      startTime,
      endTime,
      color: currentProcess.color || '#ec4899',
    });

    currentTime = endTime;
    totalBusyTime += execTime;
    currentProcess.remainingTime -= execTime;

    // Check for newly arrived processes during this time slice
    // (Standard rule: newly arrived processes enter queue before preempted process)
    for (const p of sortedArrivals) {
      if (
        p.arrivalTime <= currentTime &&
        !enqueuedPids.has(p.pid) &&
        p.pid !== currentProcess.pid &&
        p.remainingTime > 0
      ) {
        readyQueue.push(p);
        enqueuedPids.add(p.pid);
      }
    }

    if (currentProcess.remainingTime > 0) {
      readyQueue.push(currentProcess);
    } else {
      // Process has completed execution
      completedCount++;
      currentProcess.completionTime = currentTime;
      currentProcess.turnaroundTime = currentProcess.completionTime - currentProcess.arrivalTime;
      currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime;
    }
  }

  const totalTime = currentTime === 0 ? 1 : currentTime;
  const totalWT = processes.reduce((acc, p) => acc + (p.waitingTime || 0), 0);
  const totalTAT = processes.reduce((acc, p) => acc + (p.turnaroundTime || 0), 0);
  const totalRT = processes.reduce((acc, p) => acc + (p.responseTime || 0), 0);

  return {
    algorithm: 'ROUND_ROBIN',
    processes,
    ganttChart,
    avgWaitingTime: Number((totalWT / n).toFixed(2)),
    avgTurnaroundTime: Number((totalTAT / n).toFixed(2)),
    avgResponseTime: Number((totalRT / n).toFixed(2)),
    cpuUtilization: Number(((totalBusyTime / totalTime) * 100).toFixed(2)),
    throughput: Number((n / totalTime).toFixed(3)),
    timeQuantum: q,
  };
}
