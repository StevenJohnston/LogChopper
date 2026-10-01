/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: lerp_func
 * Address:  0x4E01C
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


uint lerp_func(uint param_1,uint param_2,uint param_3)

{
  uint uVar1;
  
  param_3 = param_3 & 0xffff;
  if (0xff < param_3) {
    param_3 = 0x100;
  }
  uVar1 = (param_1 & 0xffff) * param_3 + (param_2 & 0xffff) * (0x100 - param_3) >> 8;
  if (0xffff < uVar1) {
    uVar1 = 0xffff;
  }
  return uVar1;
}


