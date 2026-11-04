/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: func_calc_0x24e84
 * Address:  0x24E84
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void func_calc_0x24e84(void)

{
  uint uVar1;
  ushort uVar2;
  
  _DAT_008088c6 = _DAT_008088c6 & 0xfff8;
  if (uMem00053c42 < _DAT_00808686) {
    _DAT_008088c6 = _DAT_008088c6 | 4;
  }
  else if (uMem00053d84 < _DAT_00808686) {
    _DAT_008088c6 = _DAT_008088c6 | 2;
  }
  else {
    _DAT_008088c6 = _DAT_008088c6 | 1;
  }
  func_0x0004e410(0x62824);
  if ((_DAT_00808870 & 0x11) == 0) {
    uVar1 = func_0x0004e278(0x5bdc4);
    uVar2 = func_0x0004dc28((uVar1 & 0xffff) << 2);
    if (uVar2 <= _DAT_0080800c) {
      if ((_DAT_0080a316 & 1) == 0) {
        uVar1 = func_0x0004e278(0x5bddc);
        uVar2 = func_0x0004dc28((uVar1 & 0xffff) * 0x28);
        if (uVar2 <= _DAT_0080800c) {
          _DAT_008099f4 = uMem000543ac;
          return;
        }
        if ((_DAT_008088c6 & 4) != 0) {
          _DAT_008099f4 = uMem000543a6;
          return;
        }
        if ((_DAT_008088c6 & 2) == 0) {
          _DAT_008099f4 = uMem000543aa;
          return;
        }
        _DAT_008099f4 = uMem000543a8;
        return;
      }
      if ((_DAT_008088c6 & 4) != 0) {
        _DAT_008099f4 = uMem000543a0;
        return;
      }
      if ((_DAT_008088c6 & 2) == 0) {
        _DAT_008099f4 = uMem000543a4;
        return;
      }
      _DAT_008099f4 = uMem000543a2;
      return;
    }
  }
  _DAT_008099f4 = uMem00054396;
  if (((_DAT_008088c6 & 4) == 0) && (_DAT_008099f4 = uMem0005439a, (_DAT_008088c6 & 2) != 0)) {
    _DAT_008099f4 = uMem00054398;
  }
  return;
}


