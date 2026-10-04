/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: func_4de7c
 * Address:  0x4DE7C
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


int func_4de7c(uint param_1,uint param_2)

{
  uint uVar1;
  uint uVar2;
  uint uVar3;
  
  uVar2 = (param_1 & 0xffff) * (param_2 & 0xffff);
  uVar1 = (param_1 >> 0x10) * (param_2 & 0xffff) + (uVar2 >> 0x10);
  if (uVar1 >> 0x18 == 0) {
    uVar1 = uVar1 * 0x100;
    uVar3 = (uVar2 & 0xffff) + 0x80 >> 8;
    uVar2 = uVar1 + uVar3;
    if (!CARRY4(uVar1,uVar3) && !CARRY4(uVar2,uVar2)) {
      return uVar1 + uVar3 + (uint)(CARRY4(uVar1,uVar3) || CARRY4(uVar2,uVar2));
    }
  }
  return -1;
}


