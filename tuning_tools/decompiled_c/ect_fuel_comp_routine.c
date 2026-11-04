/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: ect_fuel_comp_routine
 * Address:  0x14BAC
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void ect_fuel_comp_routine(void)

{
  func_0x0004e410(0x9904);
  _DAT_008086a4 = func_0x0004e1a8(0x9874);
  _DAT_008086a2 = _DAT_008086a4;
  if ((_DAT_00808854 & 2) != 0) {
    _DAT_008086a2 = _IAT_to_switch_Load_from_Baro_Temp_to_Baro;
  }
  func_0x0004e410(0x9cae);
  _DAT_008086a8 = func_0x0004e1a8(0x9c20);
  _DAT_008086aa = _DAT_008086a8;
  if ((DAT_00808856 & 2) != 0) {
    _DAT_008086a8 = _IAT_to_switch_Load_from_Baro_Temp_to_Baro;
  }
  return;
}


