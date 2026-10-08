/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: load_secondary_filter_0x2a7f8
 * Address:  0x2A7F8
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void load_secondary_filter_0x2a7f8(void)

{
  ushort uVar1;
  undefined4 uVar2;
  uint uVar3;
  undefined2 uVar5;
  undefined4 uVar4;
  uint uVar6;
  short sStack_6;
  
  uVar1 = _DAT_0080a7ea;
  uVar6 = (uint)_DAT_00808796;
  if (_DAT_0080a7ea < uVar6) {
    sStack_6 = -(_DAT_0080a7ea - _DAT_00808796);
  }
  else {
    sStack_6 = _DAT_0080a7ea - _DAT_00808796;
  }
  _RAM_Boost_Error = sStack_6;
  func_0x0004e410(0x5d604);
  func_0x0004e410(0x5d61c);
  if ((uVar6 & 0xffff) < (uint)uVar1) {
    uVar2 = 0x50b6e;
  }
  else {
    uVar2 = 0x50c1a;
  }
  uVar3 = func_0x0004e278(uVar2);
  uVar2 = func_0x0004e1a8(&Discovered_2D_Unknown_RAM_0xC5E2_0x50CC6);
  if ((uVar3 & 0xffff) < 0x800) {
    uVar2 = func_0x0004dd6c(0x800 - uVar3,uVar2);
    uVar2 = func_0x0004e500(0x800,uVar2);
  }
  else {
    uVar2 = func_0x0004dd6c(uVar3 - 0x800,uVar2);
    uVar2 = func_0x0004db80(0x800,uVar2);
  }
  _DAT_00809ca0 = (undefined2)uVar2;
  func_0x0004db80(_DAT_00809ca8,uVar2);
  uVar2 = func_0x0004e500(0x800);
  if ((_DAT_008096e8 & 0x80) == 0) {
    uVar4 = 0x800000;
  }
  else if ((uint)uVar1 < (uVar6 & 0xffff)) {
    uVar4 = _DAT_00809ca4;
    uVar5 = func_0x0004e490(sStack_6,uMem000503da);
    uVar4 = func_0x0004e518(uVar4,uVar5);
  }
  else {
    uVar4 = _DAT_00809ca4;
    uVar5 = func_0x0004e490(sStack_6,uMem000503da);
    uVar4 = func_0x0004dba0(uVar4,uVar5);
  }
  _DAT_00809ca4 = func_0x0004dc64(uVar4,0x900000,0x700000);
  _DAT_00809ca2 = (undefined2)(_DAT_00809ca4 >> 8);
  uVar6 = _DAT_00809ca4 >> 8 & 0xffff;
  if (uVar6 < 0x8000) {
    uVar4 = func_0x0004e500(0x8000,_DAT_00809ca4 >> 8);
    uVar2 = func_0x0004e500(uVar2,uVar4);
  }
  else {
    uVar4 = func_0x0004e500(uVar6,0x8000);
    uVar2 = func_0x0004db80(uVar2,uVar4);
  }
  _DAT_008096ce = func_0x0004dc38(uVar2,uMem000503d6,uMem000503d8);
  return;
}


