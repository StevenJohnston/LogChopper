/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: func_0x31004
 * Address:  0x31004
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void func_0x31004(void)

{
  int iVar1;
  ushort uVar2;
  
  if ((_DAT_008088da & 0x40) == 0) {
    _DAT_008099f2 = 0;
    _DAT_008099f0 = 0;
    _DAT_008099ee = 0;
    _DAT_008099ec = 0;
    _DAT_008099ea = 0;
    _DAT_008099e8 = 0;
    _DAT_008099fa = 0;
    _DAT_008099fc = 0;
    iVar1 = 0;
    for (uVar2 = 0; uVar2 < 6; uVar2 = uVar2 + 1) {
      *(undefined2 *)(iVar1 + 0x80998c) = 0xffff;
      iVar1 = iVar1 + 2;
    }
    _DAT_008099f8 = 0x36;
  }
  else {
    iVar1 = (uint)*(ushort *)((uint)_DAT_00808e08 * 2 + 0x855e) * 2;
    uVar2 = *(ushort *)(iVar1 + 0x95fa);
    *(undefined2 *)(&DAT_008099e8 + iVar1) = 0;
    *(undefined2 *)(iVar1 + 0x80998c) = 0xffff;
    _DAT_008099fa = _DAT_008099fa & ~uVar2;
    _DAT_008099fc = ~uVar2 & _DAT_008099fc;
  }
  return;
}


