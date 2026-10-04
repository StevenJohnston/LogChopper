/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: math_func_dd84
 * Address:  0x4DD84
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


int math_func_dd84(uint param_1,uint param_2)

{
  int iVar1;
  uint uVar2;
  uint uVar3;
  
  uVar3 = (param_1 & 0xffff) * (param_2 & 0xffff);
  uVar2 = (param_1 >> 0x10) * (param_2 & 0xffff) + (uVar3 >> 0x10);
  if (uVar2 >> 0x17 == 0) {
    iVar1 = uVar2 * 0x200 + ((uVar3 & 0xffff) >> 7);
  }
  else {
    iVar1 = -1;
  }
  return iVar1;
}


