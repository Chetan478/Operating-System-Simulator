import { useMemo, useState } from 'react';
import { Activity, TrainFront, LayoutDashboard, Users, Gauge, ShieldCheck, MemoryStick, Files, Search, Plus, Play, Trash2, CircleHelp } from 'lucide-react';
import type { PCB, SchedulingAlgorithm, BankersState, DiskBlock, PNRFileRecord } from './types';
import { runFCFS } from './algorithms/fcfs';
import { runSJF } from './algorithms/sjf';
import { runPriority } from './algorithms/priority';
import { runRoundRobin } from './algorithms/roundRobin';
import { checkSystemSafety, calculateNeedMatrix, SAFE_PRESET, UNSAFE_PRESET } from './algorithms/bankers';
import { runFIFO, runLRU } from './algorithms/pageReplacement';
import { allocateLinkedFile, initializeDisk, deleteLinkedFile } from './algorithms/linkedAllocation';

type Tab = 'Dashboard' | 'Booking Sessions' | 'CPU Scheduling' | "Banker's Algorithm" | 'Memory Paging' | 'PNR File System';
const tabs: { name: Tab; icon: typeof LayoutDashboard; subtitle: string }[] = [
  { name: 'Dashboard', icon: LayoutDashboard, subtitle: 'System overview' },
  { name: 'Booking Sessions', icon: Users, subtitle: 'Process manager & IPC' },
  { name: 'CPU Scheduling', icon: Gauge, subtitle: 'Scheduling algorithms' },
  { name: "Banker's Algorithm", icon: ShieldCheck, subtitle: 'Deadlock avoidance' },
  { name: 'Memory Paging', icon: MemoryStick, subtitle: 'FIFO & LRU pages' },
  { name: 'PNR File System', icon: Files, subtitle: 'Linked file allocation' },
];
const colors = ['#38bdf8', '#a78bfa', '#34d399', '#fb923c', '#f472b6', '#facc15'];
function makePCB(pid: string, name: string, burst: number, arrival: number, priority: number, quota: 'General' | 'Tatkal' = 'General'): PCB {
  return { pid, pnr: `${Math.floor(1000000000 + Math.random() * 8999999999)}`, passengerName: name, trainNo: '12951', trainName: 'Mumbai Rajdhani Express', quota, priority, state: 'READY', arrivalTime: arrival, burstTime: burst, remainingTime: burst, memoryAllocated: 64, allocatedBlocks: [], color: colors[(Number(pid.replace(/\D/g, '')) || 1) % colors.length], stepLogs: ['Booking session created', 'Added to ready queue'] };
}
const initialSessions = [makePCB('P1', 'Aarav Sharma', 5, 0, 3), makePCB('P2', 'Meera Patel', 3, 1, 1, 'Tatkal'), makePCB('P3', 'Rohan Singh', 4, 2, 4)];
const fmt = (n: number) => Number(n.toFixed(2));

export default function App() {
  const [tab, setTab] = useState<Tab>('Dashboard');
  const [sessions, setSessions] = useState<PCB[]>(initialSessions);
  const [passenger, setPassenger] = useState('New Passenger');
  const [quota, setQuota] = useState<'General' | 'Tatkal'>('General');
  const [burst, setBurst] = useState(4);
  const [algorithm, setAlgorithm] = useState<SchedulingAlgorithm>('ROUND_ROBIN');
  const [quantum, setQuantum] = useState(2);
  const [schedResult, setSchedResult] = useState<ReturnType<typeof runFCFS> | null>(null);
  const [bankerPreset, setBankerPreset] = useState<'safe' | 'unsafe'>('safe');
  const [reference, setReference] = useState('1,2,3,1,4,5,2,1,2,3,4,5');
  const [frames, setFrames] = useState(3);
  const [pageAlgo, setPageAlgo] = useState<'FIFO' | 'LRU'>('FIFO');
  const [pageResult, setPageResult] = useState<ReturnType<typeof runFIFO> | null>(null);
  const [disk, setDisk] = useState<DiskBlock[]>(() => initializeDisk());
  const [pnrFiles, setPnrFiles] = useState<PNRFileRecord[]>([]);
  const [pnrSearch, setPnrSearch] = useState('');
  const [notice, setNotice] = useState('Ready. This is an educational simulation; no real railway booking is performed.');

  const active = sessions.filter(s => s.state !== 'TERMINATED').length;
  const bankerState: BankersState = useMemo(() => {
    const preset = bankerPreset === 'safe' ? SAFE_PRESET : UNSAFE_PRESET;
    return { ...preset, allocation: preset.allocation.map(r => [...r]), max: preset.max.map(r => [...r]), available: [...preset.available], totalResources: [...preset.totalResources], resourceNames: [...preset.resourceNames], processIds: [...preset.processIds], need: calculateNeedMatrix(preset.max, preset.allocation) };
  }, [bankerPreset]);
  const safety = useMemo(() => checkSystemSafety(bankerState), [bankerState]);
  const visibleFiles = pnrFiles.filter(f => f.pnr.includes(pnrSearch.trim()) || f.passengerName.toLowerCase().includes(pnrSearch.trim().toLowerCase()));

  function addSession() {
    const next = makePCB(`P${sessions.length + 1}`, passenger.trim() || 'Passenger', Math.max(1, Number(burst)), sessions.length, quota === 'Tatkal' ? 1 : 4, quota);
    setSessions(prev => [...prev, next]);
    setNotice(`${next.pid} created as a ${quota} booking process and added to the ready queue.`);
    setPassenger('');
  }
  function runScheduler() {
    const input = sessions.map(s => ({ ...s, state: 'READY' as const, remainingTime: s.burstTime }));
    if (!input.length) { setNotice('Create at least one booking session first.'); return; }
    let result;
    if (algorithm === 'FCFS') result = runFCFS(input);
    else if (algorithm === 'SJF') result = runSJF(input);
    else if (algorithm === 'PRIORITY') result = runPriority(input);
    else result = runRoundRobin(input, Math.max(1, quantum));
    setSchedResult(result);
    setNotice(`${algorithm.replace('_', ' ')} scheduling completed for ${input.length} booking processes.`);
  }
  function runPaging() {
    const refs = reference.split(/[ ,]+/).map(Number).filter(n => Number.isInteger(n) && n >= 0);
    if (!refs.length) { setNotice('Enter a comma-separated page reference string, for example 1,2,3,1,4.'); return; }
    const result = pageAlgo === 'FIFO' ? runFIFO(refs, Math.max(1, frames)) : runLRU(refs, Math.max(1, frames));
    setPageResult(result); setNotice(`${pageAlgo} paging simulation completed: ${result.totalFaults} page faults.`);
  }
  function createPNR() {
    const pnr = String(Math.floor(1000000000 + Math.random() * 8999999999));
    const result = allocateLinkedFile(disk, { pnr, fileName: `PNR_${pnr}.dat`, passengerName: passenger.trim() || 'Demo Passenger', trainNo: '12951', trainName: 'Mumbai Rajdhani Express', journeyDate: new Date().toISOString().slice(0, 10), seats: 1, color: colors[pnrFiles.length % colors.length] }, 3);
    if (result.success && result.fileRecord) { setDisk(result.updatedBlocks); setPnrFiles(prev => [...prev, result.fileRecord!]); setPnrSearch(pnr); setNotice(result.message); }
    else setNotice(result.message);
  }
  function removePNR(file: PNRFileRecord) {
    const result = deleteLinkedFile(disk, file.pnr); setDisk(result.updatedBlocks); setPnrFiles(prev => prev.filter(f => f.pnr !== file.pnr)); setNotice(result.message);
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon"><TrainFront size={24}/></div><div><strong>RAILOS</strong><span>OS CONCEPT SIMULATOR</span></div></div>
      <div className="side-label">WORKSPACE</div>
      <nav>{tabs.map(item => { const Icon = item.icon; return <button key={item.name} className={`nav-item ${tab === item.name ? 'selected' : ''}`} onClick={() => setTab(item.name)}><Icon size={18}/><span>{item.name}</span>{tab === item.name && <i/>}</button>; })}</nav>
      <div className="sidebar-bottom"><div className="status-dot"/> <span>Simulation environment</span><small>v1.0 · MSBTE 315319</small></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="breadcrumb">OSY / <b>{tab}</b></div><div className="top-actions"><span className="live-pill"><span/> SIMULATION ACTIVE</span><div className="avatar">OS</div></div></header>
      <div className="page-wrap">
        <div className="page-heading"><div><div className="eyebrow">RAILWAY OPERATIONS · OPERATING SYSTEMS</div><h1>{tab}</h1><p>{tabs.find(t => t.name === tab)?.subtitle} for an online railway ticket booking portal.</p></div><div className="date-chip"><Activity size={15}/> DEMO MODE</div></div>
        {notice && <div className="notice"><CircleHelp size={16}/><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss">×</button></div>}
        {tab === 'Dashboard' && <>
          <section className="hero"><div className="hero-content"><div className="hero-tag"><span/> RAILWAY BOOKING BACKEND</div><h2>Manage the journey.<br/><em>Understand the system.</em></h2><p>Explore how operating-system concepts coordinate booking processes, CPU time, memory pages, resource locks and PNR records.</p><button className="primary-btn" onClick={() => setTab('Booking Sessions')}>Explore booking sessions <span>→</span></button></div><div className="hero-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="train-card"><TrainFront size={52}/><span>RAILOS / CORE</span><strong>Booking Engine</strong><small>Process · Memory · Files</small></div><div className="floating-tag tag-a">CPU <b>READY</b></div><div className="floating-tag tag-b">PNR <b>LINKED</b></div></div></section>
          <div className="metric-grid"><Metric label="Active Sessions" value={String(active).padStart(2,'0')} change="Booking processes" icon={<Users/>}/><Metric label="CPU Scheduler" value={schedResult?.algorithm ?? 'RR'} change={schedResult ? `${fmt(schedResult.avgWaitingTime)} avg wait` : 'Ready to simulate'} icon={<Gauge/>}/><Metric label="Page Faults" value={pageResult ? String(pageResult.totalFaults) : '—'} change={pageResult ? `${pageResult.algorithm} algorithm` : 'No paging run yet'} icon={<MemoryStick/>}/><Metric label="PNR Records" value={String(pnrFiles.length).padStart(2,'0')} change={`${disk.filter(b=>!b.isAllocated).length} disk blocks free`} icon={<Files/>}/></div>
          <div className="section-head"><div><h3>OS modules</h3><p>Choose a module to run its interactive simulation.</p></div><span className="muted">5 COURSE OUTCOMES</span></div>
          <div className="module-grid">{tabs.slice(1).map((item, i) => {const Icon = item.icon; return <button className="module-card" key={item.name} onClick={() => setTab(item.name)}><div className={`module-icon color-${i}`}><Icon size={21}/></div><span className="module-number">MODULE 0{i+2}</span><h4>{item.name}</h4><p>{item.subtitle}</p><div className="module-link">Open module <span>↗</span></div></button>;})}</div>
          <div className="bottom-note"><div className="note-icon"><ShieldCheck size={20}/></div><div><strong>Built for learning, not live ticketing</strong><p>All passenger names, seat resources, PNRs and system metrics are simulated locally for educational demonstration.</p></div></div>
        </>}
        {tab === 'Booking Sessions' && <section className="content-grid"><div className="panel"><PanelTitle title="Create booking process" sub="Each reservation request is represented by a Process Control Block (PCB)."/><div className="form-grid"><label>Passenger / session name<input value={passenger} onChange={e=>setPassenger(e.target.value)} placeholder="Enter passenger name"/></label><label>Booking quota<select value={quota} onChange={e=>setQuota(e.target.value as 'General'|'Tatkal')}><option>General</option><option>Tatkal</option></select></label><label>CPU burst time<input type="number" min="1" max="20" value={burst} onChange={e=>setBurst(Number(e.target.value))}/></label></div><button className="primary-btn" onClick={addSession}><Plus size={16}/> Create process</button><div className="table-wrap"><table><thead><tr><th>PID</th><th>Passenger</th><th>Quota</th><th>Priority</th><th>State</th><th>Burst</th><th/></tr></thead><tbody>{sessions.map(s=><tr key={s.pid}><td><b>{s.pid}</b></td><td>{s.passengerName}</td><td><span className={`quota ${s.quota.toLowerCase()}`}>{s.quota}</span></td><td>{s.priority}</td><td><span className="state"><i/>{s.state}</span></td><td>{s.burstTime}</td><td><button className="icon-btn" title="Terminate process" onClick={()=>{setSessions(prev=>prev.map(p=>p.pid===s.pid?{...p,state:'TERMINATED' as const}:p));setNotice(`${s.pid} terminated in the simulation.`)}}><Trash2 size={15}/></button></td></tr>)}</tbody></table></div></div><div className="panel side-panel"><PanelTitle title="Process Control Block" sub="Select a process in the table to understand its metadata."/><div className="pcb-illustration"><div className="pcb-top"><span>PCB</span><b>PROCESS STRUCTURE</b></div>{[['PID','Unique process identifier'],['Process state','READY / RUNNING / WAITING'],['Priority','Tatkal has higher priority'],['Burst time','CPU service time required'],['Memory','Session buffer allocation'],['IPC','Booking worker messages']].map(([a,b])=><div className="pcb-row" key={a}><strong>{a}</strong><span>{b}</span></div>)}</div><div className="info-box"><b>IPC simulation concept</b><p>In a real booking backend, workers exchange seat-lock, payment and confirmation messages. This educational interface models sessions and their states; it does not create real operating-system processes.</p></div></div></section>}
        {tab === 'CPU Scheduling' && <section className="panel"><PanelTitle title="CPU scheduling engine" sub="Compare how booking requests receive CPU time. Smaller priority number means higher priority."/><div className="toolbar"><label>Algorithm<select value={algorithm} onChange={e=>setAlgorithm(e.target.value as SchedulingAlgorithm)}><option value="FCFS">FCFS</option><option value="SJF">Shortest Job First (SJF)</option><option value="PRIORITY">Priority (Tatkal first)</option><option value="ROUND_ROBIN">Round Robin</option></select></label>{algorithm==='ROUND_ROBIN'&&<label>Time quantum<input type="number" min="1" max="10" value={quantum} onChange={e=>setQuantum(Number(e.target.value))}/></label>}<button className="primary-btn" onClick={runScheduler}><Play size={15}/> Run scheduler</button></div>{schedResult&&<><div className="metric-grid compact"><Metric label="Average waiting" value={fmt(schedResult.avgWaitingTime).toString()} change="Time units" icon={<Activity/>}/><Metric label="Average turnaround" value={fmt(schedResult.avgTurnaroundTime).toString()} change="Time units" icon={<Gauge/>}/><Metric label="CPU utilization" value={`${fmt(schedResult.cpuUtilization)}%`} change="Simulated workload" icon={<Activity/>}/><Metric label="Throughput" value={fmt(schedResult.throughput).toString()} change="Processes / time unit" icon={<Users/>}/></div><h3 className="subheading">Gantt chart</h3><div className="gantt">{schedResult.ganttChart.map((g,i)=><div className="gantt-piece" key={`${g.pid}-${i}`} style={{flex:Math.max(.5,g.endTime-g.startTime),background:g.isIdle?'#e2e8f0':g.color}}><b>{g.pid}</b><span>{g.startTime}–{g.endTime}</span></div>)}</div><div className="table-wrap"><table><thead><tr><th>PID</th><th>Passenger</th><th>Arrival</th><th>Burst</th><th>Waiting</th><th>Turnaround</th><th>Response</th></tr></thead><tbody>{schedResult.processes.map(p=><tr key={p.pid}><td>{p.pid}</td><td>{p.passengerName}</td><td>{p.arrivalTime}</td><td>{p.burstTime}</td><td>{p.waitingTime}</td><td>{p.turnaroundTime}</td><td>{p.responseTime}</td></tr>)}</tbody></table></div></>}</section>}
        {tab === "Banker's Algorithm" && <section className="content-grid"><div className="panel"><PanelTitle title="Seat resource safety check" sub="Banker's Algorithm checks whether all booking processes can finish without entering an unsafe state."/><div className="toolbar"><label>Test scenario<select value={bankerPreset} onChange={e=>setBankerPreset(e.target.value as 'safe'|'unsafe')}><option value="safe">Safe state (example)</option><option value="unsafe">Unsafe state (example)</option></select></label><span className={`result-pill ${safety.isSafe?'safe':'unsafe'}`}>{safety.isSafe?'SAFE STATE':'UNSAFE STATE'}</span></div><div className="resource-chips">{bankerState.resourceNames.map((n,i)=><div className="resource-chip" key={n}><span>{n}</span><b>{bankerState.available[i]}</b><small>available</small></div>)}</div><h3 className="subheading">Allocation matrix</h3><Matrix rows={bankerState.allocation} labels={bankerState.processIds} columns={bankerState.resourceNames}/><h3 className="subheading">Need matrix</h3><Matrix rows={calculateNeedMatrix(bankerState.max,bankerState.allocation)} labels={bankerState.processIds} columns={bankerState.resourceNames}/><div className={`info-box ${safety.isSafe?'success-box':'warning-box'}`}><b>{safety.isSafe?'Safe sequence found':'No complete safe sequence found'}</b><p>{safety.isSafe?safety.safeSequence.join(' → '):'The selected allocation cannot guarantee that every process can complete in sequence. A real system should not grant a request that leaves the system unsafe.'}</p></div></div><div className="panel"><PanelTitle title="How to read the result" sub="Resource allocation in a simplified booking backend."/><div className="explain-list"><Explain n="01" title="Available" text="Resources currently free, such as seat quota, payment channels and database locks."/><Explain n="02" title="Allocation" text="Resources already assigned to each booking process."/><Explain n="03" title="Need" text="Maximum demand minus current allocation."/><Explain n="04" title="Safety check" text="The algorithm searches for an order in which every process can finish and release resources."/></div></div></section>}
        {tab === 'Memory Paging' && <section className="panel"><PanelTitle title="Seat-map virtual memory" sub="Coach seat maps are represented as pages. FIFO removes the oldest loaded page; LRU removes the least recently used page."/><div className="toolbar paging-toolbar"><label>Page reference string<input value={reference} onChange={e=>setReference(e.target.value)} placeholder="1,2,3,1,4,5"/></label><label>Memory frames<input type="number" min="1" max="8" value={frames} onChange={e=>setFrames(Number(e.target.value))}/></label><label>Replacement policy<select value={pageAlgo} onChange={e=>setPageAlgo(e.target.value as 'FIFO'|'LRU')}><option>FIFO</option><option>LRU</option></select></label><button className="primary-btn" onClick={runPaging}><Play size={15}/> Run paging</button></div>{pageResult&&<><div className="metric-grid compact"><Metric label="Page faults" value={String(pageResult.totalFaults)} change="Page not in memory" icon={<MemoryStick/>}/><Metric label="Page hits" value={String(pageResult.totalHits)} change="Page already loaded" icon={<Activity/>}/><Metric label="Hit ratio" value={`${(pageResult.hitRatio*100).toFixed(1)}%`} change="Accesses served in memory" icon={<Gauge/>}/><Metric label="Fault ratio" value={`${(pageResult.faultRatio*100).toFixed(1)}%`} change="Accesses requiring load" icon={<Activity/>}/></div><div className="table-wrap"><table><thead><tr><th>Step</th><th>Page</th>{Array.from({length:pageResult.framesCount},(_,i)=><th key={i}>Frame {i+1}</th>)}<th>Result</th><th>Evicted page</th></tr></thead><tbody>{pageResult.steps.map(s=><tr key={s.step}><td>{s.step}</td><td><b>{s.page}</b></td>{s.frames.map((f,i)=><td key={i}><span className={`frame-cell ${f===s.page?'active-frame':''}`}>{f===null?'—':f}</span></td>)}<td><span className={`quota ${s.isHit?'general':'tatkal'}`}>{s.isHit?'HIT':'FAULT'}</span></td><td>{s.victimPage??'—'}</td></tr>)}</tbody></table></div></>}</section>}
        {tab === 'PNR File System' && <section className="content-grid"><div className="panel"><PanelTitle title="PNR linked file allocation" sub="Each simulated ticket record is stored across linked, potentially non-contiguous disk blocks."/><div className="toolbar"><label>Search PNR / passenger<div className="search-input"><Search size={15}/><input value={pnrSearch} onChange={e=>setPnrSearch(e.target.value)} placeholder="Search records"/></div></label><button className="primary-btn" onClick={createPNR}><Plus size={16}/> Create demo PNR</button></div><div className="table-wrap"><table><thead><tr><th>PNR</th><th>Passenger</th><th>Train</th><th>Start block</th><th>Block chain</th><th/></tr></thead><tbody>{visibleFiles.map(f=><tr key={f.pnr}><td><b>{f.pnr}</b></td><td>{f.passengerName}</td><td>{f.trainNo}</td><td>{f.startBlock}</td><td><span className="chain">{f.blockChain.join(' → ')} → NULL</span></td><td><button className="icon-btn" onClick={()=>removePNR(f)} title="Delete PNR"><Trash2 size={15}/></button></td></tr>)}{visibleFiles.length===0&&<tr><td colSpan={6} className="empty">No matching PNR records. Create a demo record to test linked allocation.</td></tr>}</tbody></table></div><div className="info-box"><b>PNR retrieval</b><p>Use the search field to retrieve a stored record by PNR number or passenger name. These are demonstration records, not valid railway tickets.</p></div></div><div className="panel"><PanelTitle title="Virtual disk map" sub="64 blocks in the simulated disk."/><div className="disk-grid">{disk.map(b=><div title={b.isAllocated?`Block ${b.id}: PNR ${b.filePnr}`:`Block ${b.id}: free`} key={b.id} className={`disk-block ${b.isAllocated?'allocated':''}`} style={b.color?{background:b.color,borderColor:b.color}:undefined}>{b.id}</div>)}</div><div className="disk-legend"><span><i className="free-key"/>Free block</span><span><i className="used-key"/>Allocated block</span></div><div className="disk-stats"><div><span>Allocated</span><b>{disk.filter(b=>b.isAllocated).length} / {disk.length}</b></div><div><span>Free</span><b>{disk.filter(b=>!b.isAllocated).length} blocks</b></div></div></div></section>}
        <footer className="footer"><span>RAILOS · Railway Ticket Booking OS Simulator</span><span>Operating System · Subject Code 315319</span></footer>
      </div>
    </main>
  </div>;
}
function Metric({label,value,change,icon}:{label:string;value:string;change:string;icon:React.ReactNode}) {return <div className="metric-card"><div className="metric-top"><span>{label}</span><div className="metric-icon">{icon}</div></div><strong>{value}</strong><small>{change}</small></div>}
function PanelTitle({title,sub}:{title:string;sub:string}) {return <div className="panel-title"><h3>{title}</h3><p>{sub}</p></div>}
function Matrix({rows,labels,columns}:{rows:number[][];labels:string[];columns:string[]}) {return <div className="table-wrap matrix-wrap"><table><thead><tr><th>Process</th>{columns.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={labels[i]}><td>{labels[i]}</td>{r.map((n,j)=><td key={j}>{n}</td>)}</tr>)}</tbody></table></div>}
function Explain({n,title,text}:{n:string;title:string;text:string}) {return <div className="explain-item"><span>{n}</span><div><b>{title}</b><p>{text}</p></div></div>}
