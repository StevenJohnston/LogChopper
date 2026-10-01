/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: load_clamp_or_blend
 * Address:  0x4DC64
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


uint load_clamp_or_blend(uint param_1,uint param_2,uint param_3)

{
  uint uVar1;
  
  uVar1 = param_2;
  if (param_2 <= param_3) {
    uVar1 = param_3;
    param_3 = param_2;
  }
  if ((param_1 < uVar1) && (uVar1 = param_1, param_1 < param_3)) {
    uVar1 = param_3;
  }
  return uVar1;
}


