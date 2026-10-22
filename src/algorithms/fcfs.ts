/**
 * First-Come, First-Served (FCFS) CPU Scheduling Algorithm
 * Operating System Concept: Non-preemptive scheduling where the process that 
 * requests the CPU first is allocated the CPU first via a FIFO queue.
 * In RAILOS: Simulates the sequential processing of booking requests in the order they hit the server.
 */

import { PCB, GanttSlice, SchedulingResult } from '../types';

export function runFCFS(inputProcesses: PCB[]): SchedulingResult {
  // Deep clone to avoid mutating input state
  const processes: PCB[] = inputProcesses.map((p) => ({ ...p }));

  // Sort by arrival time. If equal, preserve PID ordering
  processes.sort((a, b) => {
    if (a.arrivalTime !== b.arrivalTime) {
      return a.arrivalTime - b.arrivalTime;
    }
    return a.pid.localeCompare(b.pid);
  });

  const ganttChart: GanttSlice[] = [];
  let currentTime = 0;
  let totalBusyTime = 0;

  for (let i = 0; i < processes.length; i++) {
    const p = processes[i];

    // CPU Idle time if process arrives after current time
    if (currentTime < p.arrivalTime) {
      ganttChart.push({
        pid: 'IDLE',
        label: 'CPU Idle',
        startTime: currentTime,
        endTime: p.arrivalTime,
        color: '#334155', // Slate dark
        isIdle: true,
      });
      currentTime = p.arrivalTime;
    }

    const startTime = currentTime;
    const completionTime = startTime + p.burstTime;
    const turnaroundTime = completionTime - p.arrivalTime;
    const waitingTime = turnaroundTime - p.burstTime;
    const responseTime = startTime - p.arrivalTime;

    p.completionTime = completionTime;
    p.turnaroundTime = turnaroundTime;
    p.waitingTime = waitingTime;
    p.responseTime = responseTime;

    totalBusyTime += p.burstTime;

    ganttChart.push({
      pid: p.pid,
      label: `${p.pid} (${p.passengerName})`,
      startTime: startTime,
      endTime: completionTime,
      color: p.color || '#38bdf8',
    });

    currentTime = completionTime;
  }

  const totalTime = currentTime === 0 ? 1 : currentTime;
  const count = processes.length;

  const totalWT = processes.reduce((acc, p) => acc + (p.waitingTime || 0), 0);
  const totalTAT = processes.reduce((acc, p) => acc + (p.turnaroundTime || 0), 0);
  const totalRT = processes.reduce((acc, p) => acc + (p.responseTime || 0), 0);

  return {
    algorithm: 'FCFS',
    processes,
    ganttChart,
    avgWaitingTime: count > 0 ? Number((totalWT / count).toFixed(2)) : 0,
    avgTurnaroundTime: count > 0 ? Number((totalTAT / count).toFixed(2)) : 0,
    avgResponseTime: count > 0 ? Number((totalRT / count).toFixed(2)) : 0,
    cpuUtilization: Number(((totalBusyTime / totalTime) * 100).toFixed(2)),
    throughput: Number((count / totalTime).toFixed(3)),
  };
}
