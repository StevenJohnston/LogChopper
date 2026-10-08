/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: math_mul_div
 * Address:  0x4DD1C
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


int math_mul_div(uint param_1,uint param_2,uint param_3)

{
  uint uVar1;
  uint uVar2;
  uint uVar3;
  
  param_3 = param_3 & 0xffff;
  if (param_3 != 0) {
    uVar3 = (param_1 & 0xffff) * (param_2 & 0xffff) + (param_3 >> 1);
    uVar1 = (param_1 >> 0x10) * (param_2 & 0xffff) + (uVar3 >> 0x10);
    uVar2 = uVar1 / param_3;
    if (uVar2 < 0x10000) {
      return uVar2 * 0x10000 + ((uVar3 & 0xffff) + (uVar1 - uVar2 * param_3) * 0x10000) / param_3;
    }
  }
  return -1;
}


