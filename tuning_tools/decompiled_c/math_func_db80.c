/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: math_func_db80
 * Address:  0x4DB80
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


uint math_func_db80(uint param_1,uint param_2)

{
  uint uVar1;
  
  uVar1 = (param_1 & 0xffff) + (param_2 & 0xffff);
  if (0xffff < uVar1) {
    uVar1 = 0xffff;
  }
  return uVar1;
}


