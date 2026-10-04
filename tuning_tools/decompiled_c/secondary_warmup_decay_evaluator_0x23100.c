/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: secondary_warmup_decay_evaluator_0x23100
 * Address:  0x23100
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

uint secondary_warmup_decay_evaluator_0x23100(void)

{
  undefined2 uVar2;
  uint uVar1;
  ushort uVar3;
  uint uVar4;
  
  uVar4 = 1;
  uVar2 = _DAT_00808946;
  if ((_DAT_0080a72a & 0x40) != 0) {
    uVar2 = func_0x0004dc84(_DAT_00808946,uMem00054522,0x40);
  }
  func_0x0004e410(0x63096);
  uVar1 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5BFC2);
  uVar3 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5BFFA);
  if ((uVar1 & 0xffff) < (uint)_DAT_00808942) {
    uVar4 = (uint)uMem000543d2;
    uVar2 = _DAT_0080a544;
  }
  else if (uVar3 < _DAT_00808942) {
    uVar4 = (uint)uMem000543d8;
    uVar2 = _DAT_0080a546;
  }
  _DAT_0080a6d2 = uVar2;
  return uVar4;
}


