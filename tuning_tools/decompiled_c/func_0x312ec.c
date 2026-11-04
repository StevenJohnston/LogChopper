/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: func_0x312ec
 * Address:  0x312EC
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void func_0x312ec(undefined2 param_1,uint param_2)

{
  ushort uVar1;
  int iVar2;
  uint uVar3;
  ushort uStack_6;
  
  uStack_6 = (ushort)param_2 & 0xf & _DAT_00808cae;
  if (cMem000503b7 != '\0') {
    uStack_6 = uStack_6 & _DAT_00808afe;
  }
  if (cMem000503b5 != '\0') {
    uStack_6 = uStack_6 & _DAT_00808f88;
  }
  uVar3 = 0;
  if ((_DAT_00809630 & 0x20) == 0) {
LAB_000313e8:
    DAT_008088d7 = DAT_008088d7 & 0xbf;
  }
  else {
    if (((DAT_00808652 & 8) == 0) && ((_DAT_00809ab2 & 8) == 0)) {
      if (((_DAT_00809670 & 0x1a6) != 0) && ((_DAT_00809670 & 0x38) == 0)) {
        func_0x0004e500(uMem00053ee4,uMem00054012);
        uVar1 = func_0x0004e490(4);
        if (_DAT_00808740 <= uVar1) goto LAB_000313dc;
      }
      if (((((_DAT_00809670 & 0x1a6) == 0) || ((_DAT_00809670 & 0x38) == 0)) &&
          ((DAT_008098d0 & 0x80) == 0)) &&
         (((uint)uMem00053ee4 << 2 <= (uint)_DAT_00808746 || ((_DAT_00809670 & 0x1a6) != 0))))
      goto LAB_000313e8;
    }
LAB_000313dc:
    uStack_6 = uStack_6 & 0xfff6;
    uVar3 = 1;
    DAT_008088d7 = DAT_008088d7 | 0x40;
  }
  if ((uVar3 & 0xffff) == 0) {
    DAT_0080886d = DAT_0080886d & 0xfb;
  }
  else {
    DAT_0080886d = DAT_0080886d | 4;
  }
  uVar3 = 1;
  iVar2 = 0;
  for (uVar1 = 0; uVar1 < 6; uVar1 = uVar1 + 1) {
    if ((uVar3 & param_2 & 0xffff) != 0) {
      *(undefined2 *)(iVar2 + 0x8099e8) = param_1;
    }
    iVar2 = iVar2 + 2;
    uVar3 = uVar3 << 1;
  }
  _DAT_008099fc = uStack_6;
  return;
}


