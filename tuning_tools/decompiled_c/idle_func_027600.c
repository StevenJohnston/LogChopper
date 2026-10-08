/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: idle_func_027600
 * Address:  0x27600
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 idle_func_027600(void)

{
  undefined4 uVar1;
  
  if ((((uMem00053342 < _DAT_008045a4) || (uMem00053342 < _DAT_008045a8)) ||
      (uMem00053342 < _DAT_008045ac)) ||
     (((_DAT_008045a4 < uMem00053344 || (_DAT_008045a8 < uMem00053344)) ||
      (_DAT_008045ac < uMem00053344)))) {
    uVar1 = 1;
  }
  else {
    uVar1 = 0;
  }
  return uVar1;
}


