/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: open_loop_load_switch_calc
 * Address:  0x1D170
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void open_loop_load_switch_calc(void)

{
  undefined4 uVar1;
  uint uVar2;
  uint uVar3;
  uint uVar4;
  uint uVar5;
  ushort uStack_6;
  
  uVar5 = (uint)_DAT_008087b4;
  if (((_DAT_00808842 & 1) == 0) && (uMem0005308e <= _DAT_00808734)) {
    uVar5 = (uint)_DAT_008087ba;
  }
  func_0x0004e410(0x6161c);
  uVar1 = func_0x0004e1a8(0x555be);
  func_0x0004e1a8(0x574ec);
  uVar2 = func_0x0004e0d4(uVar1,_DAT_008045a0);
  uVar4 = uVar2;
  uVar3 = func_0x0004e500(uVar2,uMem00053090);
  uStack_6 = (ushort)uVar3;
  if ((_DAT_0080887e & 0x200) == 0) {
    if ((uVar4 & 0xffff) < (uVar5 & 0xffff)) {
      _DAT_0080887e = _DAT_0080887e | 0x200;
    }
  }
  else if ((uVar5 & 0xffff) <= (uVar3 & 0xffff)) {
    _DAT_0080887e = _DAT_0080887e & 0xfdff;
  }
  if ((_DAT_0080887e & 1) != 0) {
    uVar2 = uVar3 & 0xffff;
  }
  if ((uVar2 & 0xffff) < (uVar5 & 0xffff)) {
    if (((cMem00050394 != '\0') || ((DAT_00808854 & 2) == 0)) &&
       ((cMem00050394 == '\0' || ((DAT_00808854 & 0x80) == 0)))) {
      _DAT_0080850e = sMem00053094;
      if (((_DAT_00808868 & 8) != 0) && (_DAT_008088be != 0)) {
        _DAT_008088be = _DAT_008088be - 1;
      }
      if (_DAT_008088be == 0) goto LAB_0001d304;
      uVar1 = func_0x0004e1a8(0x555d6);
      func_0x0004e1a8(0x57504);
      uVar4 = func_0x0004e0d4(uVar1,_DAT_008045a0);
    }
    uStack_6 = func_0x0004e500(uVar4,uMem00053090);
  }
  else if (_DAT_0080850e == 0) {
    if ((_DAT_008088be < uMem00053096) && (sMem00053094 != 0)) {
      _DAT_008088be = _DAT_008088be + 1;
    }
    else {
      _DAT_008088be = uMem00053096;
    }
    _DAT_0080850e = sMem00053094;
  }
LAB_0001d304:
  if ((_DAT_0080887e & 1) == 0) {
    if ((uVar4 & 0xffff) < (uVar5 & 0xffff)) {
      _DAT_0080887e = _DAT_0080887e | 1;
    }
  }
  else if ((uVar5 & 0xffff) <= (uint)uStack_6) {
    _DAT_0080887e = _DAT_0080887e & 0xfffe;
  }
  return;
}


