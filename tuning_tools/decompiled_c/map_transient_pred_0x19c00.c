/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: map_transient_pred_0x19c00
 * Address:  0x19C00
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

uint map_transient_pred_0x19c00(void)

{
  ushort uVar1;
  ushort uVar2;
  undefined4 uVar3;
  ushort uVar5;
  uint uVar4;
  uint uVar6;
  uint uVar7;
  uint uVar8;
  
  uVar1 = _DAT_0080a678;
  uVar7 = (uint)_DAT_0080a676;
  uVar6 = 0;
  func_0x00000310();
  uVar5 = _DAT_00809690;
  uVar8 = (uint)_DAT_0080a688;
  func_0x00000328();
  uVar8 = func_0x0004e500(uVar5,uVar8);
  if ((_DAT_0080865e & 1) != 0) {
    _DAT_008080e0 = sMem00054968;
  }
  if (((_DAT_0080a66e & 1) == 0) && ((_DAT_0080a66e & 4) == 0)) {
    _DAT_0080a89e = _DAT_008088c2;
    _DAT_0080a7e4 = _DAT_0080a7d8;
  }
  if ((((uMem000545a4 < _DAT_00808838) && ((_DAT_0080a66e & 4) == 0)) &&
      ((((_DAT_00808848 & 2) != 0 || ((((byte)_DAT_008046b2 | (byte)_DAT_008046d6) & 4) != 0)) ||
       (((_DAT_0080865e & 1) == 0 && (_DAT_008080e0 == 0)))))) &&
     ((uint)uMem000544a4 <= (uVar8 & 0xffff))) {
    _DAT_0080a66e = _DAT_0080a66e | 1;
  }
  func_0x0004e410(0x63080);
  uVar3 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5F750);
  func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5F744);
  _DAT_0080a672 = func_0x0004db80(uVar3);
  if (((_DAT_0080a672 <= _DAT_0080a670) ||
      (((uint)uMem0005459e <= (uVar8 & 0xffff) && (uMem000545a0 <= uVar5)))) ||
     (((_DAT_00808848 & 2) == 0 &&
      (((((byte)_DAT_008046b2 | (byte)_DAT_008046d6) & 4) == 0 && ((_DAT_0080865e & 1) != 0)))))) {
    _DAT_0080a66e = _DAT_0080a66e & 0xfffe;
  }
  if ((_DAT_0080a66e & 1) == 0) {
    if ((_DAT_00808870 & 8) == 0) {
      _DAT_0080a670 = uMem000544a6;
      uVar2 = _DAT_0080a670;
    }
    else {
      _DAT_0080a670 = 0;
      uVar2 = _DAT_0080a670;
    }
  }
  else {
    uVar2 = _DAT_0080a670;
    if (((_DAT_00808868 & 1) != 0) && (uVar2 = _DAT_0080a670 + 1, _DAT_0080a670 == 0xffff)) {
      uVar2 = _DAT_0080a670;
    }
  }
  _DAT_0080a670 = uVar2;
  func_0x0004e410(0x63080);
  _DAT_0080a680 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5F83C);
  uVar8 = (uint)_DAT_008096b6;
  func_0x0001afb4(_DAT_008096b6 >> 2,_DAT_00808796);
  _DAT_0080a678 = func_0x0004e490(3);
  _RAM_Boost_Error = _DAT_0080883a;
  func_0x0004e410(0x63080);
  func_0x0004e410(0x62ce2);
  if ((_DAT_00808848 & 2) == 0) {
    uVar3 = 0x5f75c;
  }
  else if ((_DAT_0080a7e4 & 0x4400) == 0) {
    if ((_DAT_0080a7e4 & 0x2200) == 0) {
      uVar3 = 0x5f804;
    }
    else {
      uVar3 = 0x5f7cc;
    }
  }
  else {
    uVar3 = 0x5f794;
  }
  _DAT_0080a67e = func_0x0004e1a8(uVar3);
  if ((uVar7 & 0xffff) < (uint)uVar1) {
    _DAT_0080a66e = _DAT_0080a66e | 4;
  }
  else {
    _DAT_0080a66e = _DAT_0080a66e & 0xfffb;
  }
  if ((_DAT_0080a66e & 1) == 0) {
    _DAT_0080a67c = func_0x0004db80(_DAT_008094e4,_DAT_0080a680);
    _DAT_0080a67a = _DAT_0080a678;
    if ((_DAT_0080a66e & 4) != 0) {
      if (((_DAT_00808868 & 1) != 0) &&
         (uVar6 = func_0x0004e58c(0x5d378,uVar5), (uVar6 & 0xffff) == 0)) {
        uVar6 = 1;
      }
      uVar4 = func_0x0004db80(uVar7,uVar6);
      if ((uVar4 & 0xffff) < 0x10000) {
        _DAT_0080a676 = func_0x0004db80(uVar7,uVar6);
        goto LAB_00019f38;
      }
    }
    _DAT_0080a676 = 0xffff;
  }
  else {
    uVar5 = func_0x0004db80(_DAT_008094e4,_DAT_0080a680);
    if (uVar5 < _DAT_0080a67c) {
      _DAT_0080a67c = uVar5;
    }
    func_0x0004e500(_DAT_0080a678,uVar1);
    uVar3 = func_0x0004dcf4(_DAT_0080a67e,0xff);
    _DAT_0080a67a = func_0x0004db80(_DAT_0080a67a,uVar3);
    _DAT_0080a676 = _DAT_0080a67c;
    if (_DAT_0080a67c <= _DAT_0080a67a) {
      _DAT_0080a676 = _DAT_0080a67a;
    }
    if (_DAT_0080a678 < _DAT_0080a676) {
      _DAT_0080a676 = _DAT_0080a678;
    }
  }
LAB_00019f38:
  _DAT_0080a674 = func_0x0002a398(_DAT_0080a676,_DAT_00808796);
  uVar8 = uVar8 & 0xffff;
  if (_DAT_0080a674 <= uVar8) {
    uVar8 = (uint)_DAT_0080a674;
  }
  return uVar8;
}


