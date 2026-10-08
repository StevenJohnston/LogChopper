/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: func_04dcf4
 * Address:  0x4DCF4
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


uint func_04dcf4(uint param_1,uint param_2,uint param_3)

{
  param_3 = param_3 & 0xffff;
  if ((param_3 == 0) ||
     (param_3 = ((param_1 & 0xffff) * (param_2 & 0xffff) + (param_3 >> 1)) / param_3,
     0xfffe < param_3)) {
    param_3 = 0xffff;
  }
  return param_3;
}


