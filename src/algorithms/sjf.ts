/**
 * Shortest Job First (SJF) - Non-Preemptive CPU Scheduling Algorithm
 * Operating System Concept: Selects the waiting process with the smallest CPU burst time.
 * Non-preemptive means once the CPU is allocated to a process, it holds it until completion.
 * In RAILOS: Favors fast lightweight booking verifications (e.g., single passenger General check)
 * over heavy bulk-seat allocations.
 */

import { PCB, GanttSlice, SchedulingResult } from '../types';

export function runSJF(inputProcesses: PCB[]): SchedulingResult {
  const processes: PCB[] = inputProcesses.map((p) => ({ ...p }));
  const n = processes.length;
  if (n === 0) {
    return {
      algorithm: 'SJF',
      processes: [],
      ganttChart: [],
      avgWaitingTime: 0,
      avgTurnaroundTime: 0,
      avgResponseTime: 0,
      cpuUtilization: 0,
      throughput: 0,
    };
  }

  const completed = new Set<string>();
  const ganttChart: GanttSlice[] = [];
  let currentTime = 0;
  let totalBusyTime = 0;

  while (completed.size < n) {
    // Filter processes that have arrived and are not completed
    const available = processes.filter(
      (p) => p.arrivalTime <= currentTime && !completed.has(p.pid)
    );

    if (available.length === 0) {
      // Find next earliest arriving process
      const uncompleted = processes.filter((p) => !completed.has(p.pid));
      const nextArrival = Math.min(...uncompleted.map((p) => p.arrivalTime));

      ganttChart.push({
        pid: 'IDLE',
        label: 'CPU Idle',
        startTime: currentTime,
        endTime: nextArrival,
        color: '#334155',
        isIdle: true,
      });

      currentTime = nextArrival;
      continue;
    }

    // Pick process with minimum burst time. Tie breaker: arrival time, then PID
    available.sort((a, b) => {
      if (a.burstTime !== b.burstTime) {
        return a.burstTime - b.burstTime;
      }
      if (a.arrivalTime !== b.arrivalTime) {
        return a.arrivalTime - b.arrivalTime;
      }
      return a.pid.localeCompare(b.pid);
    });

    const chosen = available[0];
    const startTime = currentTime;
    const completionTime = startTime + chosen.burstTime;
    const turnaroundTime = completionTime - chosen.arrivalTime;
    const waitingTime = turnaroundTime - chosen.burstTime;
    const responseTime = startTime - chosen.arrivalTime;

    chosen.completionTime = completionTime;
    chosen.turnaroundTime = turnaroundTime;
    chosen.waitingTime = waitingTime;
    chosen.responseTime = responseTime;

    totalBusyTime += chosen.burstTime;

    ganttChart.push({
      pid: chosen.pid,
      label: `${chosen.pid} (${chosen.passengerName})`,
      startTime: startTime,
      endTime: completionTime,
      color: chosen.color || '#10b981',
    });

    currentTime = completionTime;
    completed.add(chosen.pid);
  }

  const totalTime = currentTime === 0 ? 1 : currentTime;
  const totalWT = processes.reduce((acc, p) => acc + (p.waitingTime || 0), 0);
  const totalTAT = processes.reduce((acc, p) => acc + (p.turnaroundTime || 0), 0);
  const totalRT = processes.reduce((acc, p) => acc + (p.responseTime || 0), 0);

  return {
    algorithm: 'SJF',
    processes,
    ganttChart,
    avgWaitingTime: Number((totalWT / n).toFixed(2)),
    avgTurnaroundTime: Number((totalTAT / n).toFixed(2)),
    avgResponseTime: Number((totalRT / n).toFixed(2)),
    cpuUtilization: Number(((totalBusyTime / totalTime) * 100).toFixed(2)),
    throughput: Number((n / totalTime).toFixed(3)),
  };
}
