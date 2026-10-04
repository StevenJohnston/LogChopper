/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: vss_gear_hysteresis_0x1fdf0
 * Address:  0x1FDF0
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void vss_gear_hysteresis_0x1fdf0(void)

{
  _DAT_00808ab6 = uMem00053258;
  if ((DAT_00808aa0 & 8) == 0) {
    if (uMem00053254 < _DAT_0080879e) {
      DAT_00808aa0 = DAT_00808aa0 | 8;
    }
  }
  else if (_DAT_0080879e <= uMem00053256) {
    DAT_00808aa0 = DAT_00808aa0 & 0xf7;
  }
  func_0x0004e410(0x62f30);
  _DAT_00808ab8 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5A05C);
  if ((_DAT_0080879e < uMem00053260) || (uMem0005325e < _DAT_0080879e)) {
    DAT_00808aa0 = DAT_00808aa0 & 0xfd;
  }
  else {
    DAT_00808aa0 = DAT_00808aa0 | 2;
  }
  return;
}


