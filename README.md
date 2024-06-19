No idea if little endian works or not

.srf files assume a header of 328 bytes. I have no idea if this is correct for all .srf files

## node boiler

React flow
`app/store/useFlow.ts`
`app/_components/Flow.tsx`
Loadable node
`app/_components/FlowNodes/index.tsx`
Fork
`app/_components/FlowNodes/index.tsx`

## Useful nodes not yet node selector'd

### Log Alter

#### True AFR (CurrentLTFT)

```
{
  func: AFR+AFR*-((CurrentLTFT+STFT)/100)
}
```

### Table Combiner

#### AFR DIFF

```
{
  func: (sourceTable[y][x]/joinTable[y][x]) || 1
}
```

## ROADMAP

### General

Better Table<LogRecord[]> vs Table<string|number> typeguard's - isTableLogRecord, isTableBasic
Webworkers - ArrayBuffers?
Improve xlm, rom, log selection
Improve eval variable naming
Node naming - Allow nodes to have custom names

### LOG

Auto select logs based on ROM
Bug - Loaded groups are missing selected logs on init
Rolling log filter - Allow logs to be filtered based on surrounding logs. eg. Filter out logs with sudden increases of TPS

### TABLE

Cell smoothing - Allow table cells to be smoothed based on surrounding cells
Custom table values
