/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: func_crank_angle_0x36974
 * Address:  0x36974
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void func_crank_angle_0x36974(void)

{
  short sVar1;
  short *psVar2;
  short *psVar3;
  ushort uVar4;
  
  psVar2 = (short *)0x809974;
  psVar3 = (short *)0x809980;
  for (uVar4 = 0; uVar4 < 6; uVar4 = uVar4 + 1) {
    sVar1 = *psVar2;
    if ((sVar1 != -1) && (sVar1 != 0)) {
      *psVar2 = sVar1 + -1;
    }
    sVar1 = *psVar3;
    if ((sVar1 != -1) && (sVar1 != 0)) {
      *psVar3 = sVar1 + -1;
    }
    psVar2 = psVar2 + 1;
    psVar3 = psVar3 + 1;
  }
  psVar2 = (short *)0x80998c;
  for (uVar4 = 0; uVar4 < 6; uVar4 = uVar4 + 1) {
    sVar1 = *psVar2;
    if ((sVar1 != -1) && (sVar1 != 0)) {
      *psVar2 = sVar1 + -1;
    }
    psVar2 = psVar2 + 1;
  }
  if ((_DAT_00809998 != -1) && (_DAT_00809998 != 0)) {
    _DAT_00809998 = _DAT_00809998 + -1;
  }
  if ((_DAT_0080999a != -1) && (_DAT_0080999a != 0)) {
    _DAT_0080999a = _DAT_0080999a + -1;
  }
  return;
}


