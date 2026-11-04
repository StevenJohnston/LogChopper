/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: ect_blend_condition
 * Address:  0x15120
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 ect_blend_condition(void)

{
  if (((((_DAT_00808646 & 0x80) != 0) && ((_DAT_00808646 & 0x20) != 0)) &&
      ((_DAT_0080a3ee & 0x20) == 0)) && ((_DAT_00808646 & 4) == 0)) {
    return 1;
  }
  return 0;
}


