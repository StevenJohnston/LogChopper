/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: decel_fuel_cut_rpm_thresholds
 * Address:  0x1BB04
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void decel_fuel_cut_rpm_thresholds(void)

{
  short sVar1;
  
  if ((cMem00050352 == '\0') || (sVar1 = func_0x0001bb3c(), sVar1 == 0)) {
    DAT_008088db = DAT_008088db & 0xbf;
  }
  else {
    DAT_008088db = DAT_008088db | 0x40;
    _DAT_008080ee = uMem0005319a;
  }
  return;
}


