/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: warmup_enrich_decay_evaluator_0x23030
 * Address:  0x23030
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

uint warmup_enrich_decay_evaluator_0x23030(void)

{
  undefined2 uVar3;
  uint uVar1;
  undefined *puVar2;
  ushort uVar4;
  uint uVar5;
  
  uVar5 = 1;
  uVar3 = _DAT_00808944;
  if ((_DAT_0080a72a & 0x40) != 0) {
    uVar3 = func_0x0004dc84(_DAT_00808944,uMem00054522,0x40);
  }
  func_0x0004e410(0x63096);
  if ((((_DAT_00808892 & 4) == 0) || (_DAT_0080868c < uMem00054392)) ||
     (uMem00054394 <= _DAT_0080868c)) {
    uVar1 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5BFB4);
    puVar2 = &Discovered_2D_Engine_RPM_0x5BFEC;
  }
  else {
    uVar1 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5BFD0);
    puVar2 = &Discovered_2D_Engine_RPM_0x5C008;
  }
  uVar4 = func_0x0004e1a8(puVar2);
  if ((uVar1 & 0xffff) < (uint)_DAT_0080893e) {
    uVar5 = (uint)uMem000543d0;
    uVar3 = _DAT_0080a53e;
  }
  else if (uVar4 < _DAT_0080893e) {
    uVar5 = (uint)uMem000543d6;
    uVar3 = _DAT_0080a540;
  }
  _DAT_0080a6cc = uVar3;
  return uVar5;
}


