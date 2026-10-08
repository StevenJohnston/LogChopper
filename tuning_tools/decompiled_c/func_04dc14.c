/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: func_04dc14
 * Address:  0x4DC14
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


ushort func_04dc14(ushort param_1)

{
  if (0xfe < param_1) {
    param_1 = 0xff;
  }
  return param_1;
}


