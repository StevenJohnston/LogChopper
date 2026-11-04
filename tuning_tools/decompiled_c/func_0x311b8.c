/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: func_0x311b8
 * Address:  0x311B8
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void func_0x311b8(uint param_1,uint param_2)

{
  ushort uVar1;
  uint uVar2;
  uint uVar3;
  
  uVar2 = (uint)_DAT_00808cae & param_2 & 0xf;
  if (cMem000503b7 != '\0') {
    uVar2 = uVar2 & _DAT_00808afe;
  }
  if (cMem000503b5 != '\0') {
    uVar2 = uVar2 & _DAT_00808f88;
  }
  uVar3 = 0;
  if ((_DAT_00809630 & 0x20) == 0) {
LAB_0003129c:
    DAT_008088d7 = DAT_008088d7 & 0xbf;
  }
  else {
    if (((DAT_00808652 & 8) == 0) && ((_DAT_00809ab2 & 8) == 0)) {
      if (((_DAT_00809670 & 0x1a6) != 0) && ((_DAT_00809670 & 0x38) == 0)) {
        func_0x0004e500(uMem00053ee4,uMem00054012);
        uVar1 = func_0x0004e490(4);
        if (_DAT_00808740 <= uVar1) goto LAB_00031294;
      }
      if (((((_DAT_00809670 & 0x1a6) == 0) || ((_DAT_00809670 & 0x38) == 0)) &&
          ((DAT_008098d0 & 0x80) == 0)) &&
         (((uint)uMem00053ee4 << 2 <= (uint)_DAT_00808746 || ((_DAT_00809670 & 0x1a6) != 0))))
      goto LAB_0003129c;
    }
LAB_00031294:
    uVar2 = uVar2 & 0xfff6;
    uVar3 = 1;
    DAT_008088d7 = DAT_008088d7 | 0x40;
  }
  if ((uVar3 & 0xffff) == 0) {
    DAT_0080886d = DAT_0080886d & 0xfb;
  }
  else {
    DAT_0080886d = DAT_0080886d | 4;
  }
  if (((param_1 & 0xffff) != 0) && ((uVar2 & 0xffff) != 0)) {
    func_0x0000da8c(param_1 & 0xffff,uVar2 & 0xffff);
  }
  DAT_008089d7 = DAT_008089d7 & 0xdf;
  return;
}


