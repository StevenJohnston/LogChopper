/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: idle_func_0276c0
 * Address:  0x276C0
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void idle_func_0276c0(char param_1)

{
  if (param_1 == '\0') {
    _DAT_008045bc = _DAT_008045bc & 0xfffd;
    _DAT_008045bc = _DAT_008045bc | 1;
  }
  else {
    _DAT_00808b4c = 0;
    _DAT_00808b4e = 0;
    func_0x00027750(uMem00053306);
  }
  if ((_DAT_008045bc & 1) != 0) {
    if ((_DAT_008045c0 & 0xff) == uMem0005336c) {
      func_0x00000310();
      _DAT_008045c0 = func_0x0004df34(0);
      func_0x00000328();
      _DAT_008045bc = _DAT_008045bc & 0xffdc;
    }
    else {
      _DAT_00808b4c = uMem0005336c;
      _DAT_00808b4e = uMem0005336c;
      func_0x00027750(uMem00053306);
    }
  }
  return;
}


