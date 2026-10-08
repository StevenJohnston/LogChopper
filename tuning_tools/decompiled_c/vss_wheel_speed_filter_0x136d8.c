/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: vss_wheel_speed_filter_0x136d8
 * Address:  0x136D8
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void vss_wheel_speed_filter_0x136d8(void)

{
  ushort uVar1;
  
  if ((_DAT_00808646 & 0x40) != 0) {
    _DAT_0080800e = 0;
  }
  if ((_DAT_00808870 & 1) != 0) {
    _DAT_0080800c = 0;
    func_0x00000310();
    func_0x0000ae38(0x80a014,0);
    func_0x00000328();
  }
  if ((_DAT_00808870 & 0x11) != 0) {
    _DAT_00808012 = 0;
    _DAT_0080868c = _DAT_00808686;
    _DAT_008086a6 = _DAT_008086a2;
    uVar1 = func_0x0004e500(_DAT_00808686,_DAT_008086a2);
    if (uVar1 < uMem00054612) {
      _DAT_00808696 = _DAT_0080868c;
      DAT_00808893 = DAT_00808893 & 0xfb;
    }
    else {
      func_0x0004e410(0x61964);
      _DAT_00808696 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5E6B4);
      DAT_00808893 = DAT_00808893 | 4;
    }
  }
  return;
}


