/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: vss_speed_dwell_0x1fc18
 * Address:  0x1FC18
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 vss_speed_dwell_0x1fc18(void)

{
  undefined4 uVar1;
  
  if ((_DAT_00808870 & 0x11) != 0) {
    func_0x0004e410(0x6220e);
    _DAT_0080a46e = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5AD9A);
  }
  if (((((_DAT_00808870 & 0x11) == 0) && ((_DAT_00808a32 & 0x80) == 0)) &&
      (uMem000531fe <= _DAT_0080879e)) &&
     ((((_DAT_0080a316 & 1) == 0 && ((DAT_00808aa0 & 0x40) != 0)) &&
      ((uint)_DAT_0080a46e << 2 <= (uint)_DAT_0080800c)))) {
    uVar1 = 1;
  }
  else {
    uVar1 = 0;
  }
  return uVar1;
}


