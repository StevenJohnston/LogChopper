/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: boost_target_rpm_eval_0x16d44
 * Address:  0x16D44
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void boost_target_rpm_eval_0x16d44(void)

{
  uint uVar1;
  
  uVar1 = (uint)_DAT_008094ec;
  if ((cMem00050385 != '\0') && ((_DAT_00808848 & 1) != 0)) {
    _DAT_0080a55c = _DAT_0080a572;
    _RAM_Boost_Error = _DAT_00809c8e;
    func_0x0004e410(0x6288e);
    _DAT_0080a57a = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5C182);
    _DAT_0080a57a = _DAT_0080a57a << 2;
    func_0x0000ad54(&Discovered_2D_Engine_RPM_0x5C19C,0x1e);
    _DAT_0080a57c = func_0x0004db80(0x7e20);
    func_0x0000ad54(&Discovered_2D_Engine_RPM_0x5C1B6,0x1e);
    _DAT_0080a57e = func_0x0004db80(0x7e20);
    _DAT_0080a5a0 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5C2E8);
    _DAT_0080a5a0 = _DAT_0080a5a0 << 2;
  }
  if ((_DAT_00808848 & 2) == 0) {
    func_0x0001a52c();
  }
  func_0x0004db80(_DAT_008094f4,0x80);
  _DAT_008094e6 = func_0x0004e500(uVar1);
  _DAT_00809714 = func_0x000179f4(_DAT_008094e6,0x80,2000);
  func_0x00017ae4();
  func_0x00017e0c();
  func_0x00017e9c();
  return;
}


