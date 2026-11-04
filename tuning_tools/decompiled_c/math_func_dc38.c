/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: math_func_dc38
 * Address:  0x4DC38
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


ushort math_func_dc38(ushort param_1,ushort param_2,ushort param_3)

{
  ushort uVar1;
  
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


