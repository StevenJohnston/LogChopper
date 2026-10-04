/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: throttle_tps_transient_0x29d94
 * Address:  0x29D94
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void throttle_tps_transient_0x29d94(void)

{
  ushort uVar1;
  uint uVar2;
  
  uVar1 = _DAT_0080a496 & 0x3800;
  uVar2 = 0;
  if ((_DAT_00808848 & 5) == 0) {
    if ((((_DAT_00808848 & 2) != 0) && (uVar1 != 0x1000)) && (uVar1 != 0x2000)) goto LAB_00029df0;
  }
  else if ((uVar1 != 0x1000) && (uVar1 != 0x1800)) goto LAB_00029df0;
  uVar2 = 1;
LAB_00029df0:
  uVar1 = func_0x0004e1a8(&Discovered_2D_Throttle_Position_TPS_Vehicle_Speed_0x5AA9C);
  if ((((_DAT_00808646 & 0x80) == 0) || (_DAT_0080800c < uMem0005410a)) ||
     (((uVar2 & 0xffff) != 1 || (uVar1 < _DAT_0080879e)))) {
    _DAT_008082ec = 0;
    _DAT_0080888e = _DAT_0080888e & 0xfffd;
  }
  else {
    if (((_DAT_0080888e & 2) == 0) && ((_DAT_00808b16 & 0x10) == 0)) {
      _DAT_008082ec = sMem00054108;
    }
    _DAT_0080888e = _DAT_0080888e | 2;
  }
  if (_DAT_008082ec == 0) {
    _DAT_0080888e = _DAT_0080888e & 0xfffe;
  }
  else {
    _DAT_0080888e = _DAT_0080888e | 1;
  }
  return;
}


