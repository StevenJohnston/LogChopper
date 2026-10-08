/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: fuel_cut_ect_recovery_0x24fac
 * Address:  0x24FAC
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void fuel_cut_ect_recovery_0x24fac(void)

{
  ushort uVar1;
  short sVar2;
  
  func_0x00000310();
  DAT_008089d7 = DAT_008089d7 & 0xbf | 0x80;
  func_0x00000328();
  if ((_DAT_00808870 & 0x10) == 0) {
    if (((_DAT_00808870 & 1) == 0) && (_DAT_00808a30 <= _DAT_00808012)) {
      _DAT_008088c6 = _DAT_008088c6 & 0xff7f;
    }
  }
  else if (uMem00053182 < _DAT_00808686) {
    _DAT_008088c6 = _DAT_008088c6 & 0xff7f;
    _DAT_00808a30 = 0;
  }
  else {
    uVar1 = _DAT_008088c6 | 0x80;
    sVar2 = func_0x0004e1a8(&Discovered_2D_Fast_Engine_Coolant_Temp_ECT_0x57BC4);
    _DAT_008088c6 = uVar1;
    _DAT_00808a30 = sVar2 * 0x14;
  }
  return;
}


