/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: sensor_lag_filter_0x1a52c
 * Address:  0x1A52C
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void sensor_lag_filter_0x1a52c(void)

{
  undefined4 uVar1;
  undefined4 uVar2;
  undefined2 uVar5;
  undefined2 uVar6;
  ushort uVar7;
  int iVar3;
  short sVar8;
  uint uVar4;
  ushort uVar9;
  uint uVar10;
  undefined2 uStack_a;
  
  uStack_a = 0;
  func_0x0004e410(0x61c14);
  func_0x0004e410(0x61cfc);
  func_0x0004e1a8(0x59156);
  uVar1 = func_0x0004e490(3);
  _DAT_008094e4 = (undefined2)uVar1;
  if ((_DAT_00808844 & 0x80) != 0) {
    uVar2 = func_0x00016e14();
    _DAT_008094f2 = (undefined2)uVar2;
    uVar1 = func_0x0004e500(uVar1,uVar2);
  }
  _DAT_008094fa = (undefined2)uVar1;
  _DAT_008094ea = func_0x00016e6c();
  _DAT_008094e8 = func_0x00016e94();
  if ((_DAT_00808870 & 8) != 0) {
    uVar1 = 0;
  }
  _DAT_008094f4 = (undefined2)uVar1;
  uVar2 = func_0x00017a6c(_DAT_00809500,0);
  uVar5 = func_0x0004db80(0,uVar2);
  _DAT_008094fe = (undefined2)uVar2;
  if ((_DAT_00808848 & 2) != 0) {
    uStack_a = func_0x00017a6c(_DAT_00809502,0);
  }
  func_0x0004e1a8(&Discovered_2D_Unknown_RAM_0xC5F2_0x59A4C);
  _DAT_00809504 = func_0x0004e490(3);
  func_0x0004db80(uVar5,_DAT_00809504);
  uVar6 = func_0x0004db80(_DAT_008094e8);
  uVar7 = func_0x0004db80(_DAT_00809504,_DAT_008094e8);
  uVar5 = 0;
  iVar3 = func_0x0004e490(uMem000503d0,3);
  sVar8 = func_0x0004e490(uMem000503d2,3);
  uVar10 = iVar3 + 0x50;
  func_0x0004db80(uVar1,0x80);
  uVar4 = func_0x0004e500(uVar6);
  if ((_DAT_0080960c & 0x10) == 0) {
    if ((uVar10 & 0xffff) < (uVar4 & 0xffff)) {
      _DAT_0080960c = _DAT_0080960c | 0x10;
    }
  }
  else if ((uVar4 & 0xffff) <= (uint)(ushort)(sVar8 + 0x50)) {
    _DAT_0080960c = _DAT_0080960c & 0xffef;
  }
  if ((_DAT_00808854 & 0x20) == 0) {
    _RAM_Boost_Error = _DAT_00808c86;
  }
  else if ((_DAT_0080960c & 0x10) == 0) {
    _RAM_Boost_Error = 0xff;
  }
  else {
    _RAM_Boost_Error = 0;
  }
  if ((_DAT_00808848 & 2) != 0) {
    uVar5 = _RAM_Boost_Error;
  }
  func_0x0004e410(0x61de0);
  uVar1 = 0;
  if ((_DAT_00808870 & 0x11) == 0) {
    _RAM_Boost_Error = _DAT_00808796;
    func_0x0004e410(0x61c7a);
    func_0x0004e1a8(0x505a2);
    uVar1 = func_0x0004e490(3);
  }
  _DAT_00809506 = (undefined2)uVar1;
  uVar6 = func_0x0004db80(uVar6,uVar1);
  if ((_DAT_00808848 & 2) != 0) {
    uVar1 = 0;
    if ((_DAT_00808870 & 0x11) == 0) {
      _RAM_Boost_Error = _DAT_0080a7ea;
      func_0x0004e410(0x61c7a);
      _RAM_Boost_Error = uVar5;
      func_0x0004e410(0x61de0);
      func_0x0004e1a8(0x505a2);
      uVar1 = func_0x0004e490(3);
    }
    uStack_a = func_0x0004db80(uStack_a,uVar1);
  }
  func_0x0001afb4(_DAT_0080968a >> 2,_DAT_00808796);
  uVar9 = func_0x0004e490(3);
  _DAT_008094ec = uVar6;
  _DAT_008094f0 = uVar7;
  if (uVar7 <= uVar9) {
    _DAT_008094f0 = uVar9;
  }
  if ((_DAT_00808848 & 2) != 0) {
    _DAT_008094ee = uStack_a;
  }
  return;
}


