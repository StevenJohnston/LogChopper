/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: linear_blend_engine
 * Address:  0x4E0D4
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


uint linear_blend_engine(uint param_1,uint param_2,uint param_3)

{
  uint uVar1;
  
  param_3 = param_3 & 0xffff;
  if (0xfe < param_3) {
    param_3 = 0xff;
  }
  uVar1 = ((param_1 & 0xffff) * param_3 + (param_2 & 0xffff) * (0xff - param_3)) / 0xff;
  if (0xffff < uVar1) {
    uVar1 = 0xffff;
  }
  return uVar1;
}


