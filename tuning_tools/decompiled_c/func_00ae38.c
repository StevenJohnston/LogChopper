/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: func_00ae38
 * Address:  0xAE38
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


void func_00ae38(uint *param_1,uint param_2)

{
  *param_1 = param_2 << 0x10 | ~(param_2 & 0xffff) & 0xffff;
  return;
}


