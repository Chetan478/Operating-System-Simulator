/**
 * Priority Scheduling (Non-Preemptive) CPU Algorithm
 * Operating System Concept: Each process is assigned a priority integer.
 * CRITICAL MSBTE CONVENTION: Lower numerical value = HIGHER priority (e.g., Priority 1 > Priority 2).
 * In RAILOS: Tatkal booking requests are assigned Priority 1 (highest urgency),
 * while standard General bookings are assigned Priority 3 to 5.
 */

import { PCB, GanttSlice, SchedulingResult } from '../types';

export function runPriority(inputProcesses: PCB[]): SchedulingResult {
  const processes: PCB[] = inputProcesses.map((p) => ({ ...p }));
  const n = processes.length;
  if (n === 0) {
    return {
      algorithm: 'PRIORITY',
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
    const available = processes.filter(
      (p) => p.arrivalTime <= currentTime && !completed.has(p.pid)
    );

    if (available.length === 0) {
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

    // Pick process with highest priority (LOWER numerical value)
    available.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority; // e.g. 1 comes before 3
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
      label: `${chosen.pid} [Prio ${chosen.priority}${chosen.quota === 'Tatkal' ? ' - Tatkal' : ''}]`,
      startTime: startTime,
      endTime: completionTime,
      color: chosen.color || '#f59e0b',
    });

    currentTime = completionTime;
    completed.add(chosen.pid);
  }

  const totalTime = currentTime === 0 ? 1 : currentTime;
  const totalWT = processes.reduce((acc, p) => acc + (p.waitingTime || 0), 0);
  const totalTAT = processes.reduce((acc, p) => acc + (p.turnaroundTime || 0), 0);
  const totalRT = processes.reduce((acc, p) => acc + (p.responseTime || 0), 0);

  return {
    algorithm: 'PRIORITY',
    processes,
    ganttChart,
    avgWaitingTime: Number((totalWT / n).toFixed(2)),
    avgTurnaroundTime: Number((totalTAT / n).toFixed(2)),
    avgResponseTime: Number((totalRT / n).toFixed(2)),
    cpuUtilization: Number(((totalBusyTime / totalTime) * 100).toFixed(2)),
    throughput: Number((n / totalTime).toFixed(3)),
  };
}
