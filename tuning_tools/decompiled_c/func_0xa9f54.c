/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: func_0xa9f54
 * Address:  0xA9F54
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

uint func_0xa9f54(uint param_1)

{
  if (cMem00050001 == '\x01') {
    param_1 = func_0x0004de60(_DAT_00808db8 + 0x80,param_1);
  }
  else if (cMem00050001 == '\x02') {
    param_1 = (uint)_DAT_00808db8;
  }
  return param_1;
}


