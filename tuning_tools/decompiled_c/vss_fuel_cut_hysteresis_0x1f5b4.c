/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: vss_fuel_cut_hysteresis_0x1f5b4
 * Address:  0x1F5B4
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void vss_fuel_cut_hysteresis_0x1f5b4(void)

{
  if ((_DAT_00808870 & 0x11) == 0) {
    if (((_DAT_00808868 & 0x20) != 0) && (_DAT_0080a950 != 0)) {
      _DAT_0080a950 = _DAT_0080a950 + -1;
    }
  }
  else if ((DAT_00808886 & 4) == 0) {
    func_0x0004e410(0x6283c);
    _DAT_0080a950 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5F736);
  }
  if ((DAT_00808892 & 0x20) == 0) {
    if (uMem00054b38 < _DAT_00808694) {
      DAT_00808892 = DAT_00808892 | 0x20;
    }
  }
  else if (_DAT_00808694 <= uMem00054b3a) {
    DAT_00808892 = DAT_00808892 & 0xdf;
  }
  if (((_DAT_0080a950 == 0) || ((DAT_00808886 & 4) == 0)) && ((DAT_00808892 & 0x20) != 0)) {
    DAT_0080a4a8 = DAT_0080a4a8 & 0xfd;
  }
  else {
    DAT_0080a4a8 = DAT_0080a4a8 | 2;
  }
  return;
}


