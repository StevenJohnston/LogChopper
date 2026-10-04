/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: func_f578
 * Address:  0xF578
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void func_f578(short param_1,int param_2)

{
  func_0x00000310();
  if (_DAT_00808004 < 0x27) {
    if (_DAT_0080a402 < 2) {
      _DAT_00808dfc = _DAT_00808df8;
      _DAT_00808df4 = _DAT_00808dec;
    }
    else {
      _DAT_00808dfc = -(_DAT_00808e00 - param_1);
      _DAT_00808df4 = (uint)-(_DAT_0080afe0 - param_2) >> 1;
    }
  }
  else {
    _DAT_00808df4 = 0xffffffff;
    _DAT_00808dfc = -1;
  }
  _DAT_00808004 = 0;
  _DAT_00808e00 = param_1;
  _DAT_0080afe0 = param_2;
  func_0x00000328();
  func_0x0002fae4();
  return;
}


