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
