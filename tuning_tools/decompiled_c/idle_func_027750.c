/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: idle_func_027750
 * Address:  0x27750
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void idle_func_027750(void)

{
  func_0x00026c50();
  DAT_00808b1f = DAT_00808b1f | 1;
  uMem00808b16 = uMem00808b16 & 0xff4a;
  _DAT_00808b60 = 0;
  _DAT_00808b8e = 0;
  func_0x00025bf8();
  return;
}


