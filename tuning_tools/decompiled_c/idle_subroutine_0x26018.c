/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: idle_subroutine_0x26018
 * Address:  0x26018
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void idle_subroutine_0x26018(void)

{
  int iVar1;
  
  if ((_DAT_00808870 & 0x10) != 0) {
    DAT_00808b1f = DAT_00808b1f | 0x20;
    _DAT_00808376 = 0;
  }
  if ((_DAT_00808870 & 1) != 0) {
    if (uMem000533f2 < _DAT_008086a2) {
      DAT_00808b1f = DAT_00808b1f | 0x20;
    }
    else {
      DAT_00808b1f = DAT_00808b1f & 0xdf;
    }
    if (_DAT_00808686 <= uMem000533ec) {
      _DAT_00808376 = 0;
      _DAT_00808b66 = 0;
      return;
    }
    _DAT_00808376 = uMem000533f0 * 0x50;
  }
  if ((_DAT_00808376 != 0) && ((_DAT_00808646 & 0x20) != 0)) {
    iVar1 = 0;
    if ((_DAT_00808646 & 0x10) == 0) {
      iVar1 = func_0x0004dcf4(_DAT_00808376,uMem000533ee,(uint)uMem000533f0 * 0x50);
      iVar1 = iVar1 + (uint)(byte)(&Idle_RPM_3_vs_Coolant_Temp)[*puMem00056244 - 1 & 0xffff];
    }
    else if ((_DAT_00808646 & 1) != 0) {
      iVar1 = func_0x0004dcf4(_DAT_00808376,uMem000533ee,(uint)uMem000533f0 * 0x50);
      iVar1 = (uint)_Target_Idle_4 + iVar1;
    }
    _DAT_00808b66 = func_0x0004dc14(iVar1);
    return;
  }
  _DAT_00808b66 = 0;
  return;
}


