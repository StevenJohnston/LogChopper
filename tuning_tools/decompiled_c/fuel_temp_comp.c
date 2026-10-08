/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: fuel_temp_comp
 * Address:  0x25820
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void fuel_temp_comp(void)

{
  if (((DAT_00808854 & 0x20) == 0) && ((DAT_00808856 & 2) == 0)) {
    func_0x0004e410(0x634ba);
    func_0x0004e410(0x634ce);
    _DAT_0080aaae = func_0x0004e1a8(0x60fc6);
  }
  else {
    _DAT_0080aaae = 0x80;
  }
  return;
}


