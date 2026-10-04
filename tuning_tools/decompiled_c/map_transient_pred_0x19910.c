/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: map_transient_pred_0x19910
 * Address:  0x19910
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

ushort map_transient_pred_0x19910(void)

{
  undefined2 uVar1;
  undefined *puVar2;
  undefined4 uVar3;
  ushort uVar4;
  uint uVar5;
  uint uVar6;
  uint uVar7;
  ushort uStack_8;
  
  uVar1 = _DAT_0080a678;
  uVar5 = _DAT_0080a496 & 0x3800;
  func_0x00000310();
  uVar7 = (uint)_DAT_0080a688;
  uVar6 = (uint)_DAT_00809690;
  func_0x00000328();
  uVar7 = func_0x0004e500(uVar6,uVar7);
  if ((cMem00050385 == '\0') || ((_DAT_00808848 & 1) == 0)) {
    uStack_8 = _DAT_008096b6;
  }
  else {
    uStack_8 = _DAT_0080a562;
  }
  if ((cMem00050385 == '\0') || (uVar4 = uStack_8, (_DAT_00808848 & 1) == 0)) {
    uVar4 = _DAT_008096ac;
  }
  func_0x0001afb4(uVar4 >> 2,_DAT_00808796);
  _DAT_0080a678 = func_0x0004e490(3);
  if ((_DAT_0080a66e & 1) == 0) {
    if ((uVar5 & 0xffff) == 0x1000) {
      _DAT_0080a66e = _DAT_0080a66e | 2;
    }
    else {
      _DAT_0080a66e = _DAT_0080a66e & 0xfffd;
    }
  }
  if (((((_DAT_00808646 & 0x20) == 0) && ((_DAT_00808c2e & 4) == 0)) &&
      (uMem000545a4 < _DAT_00808838)) && ((uint)uMem000544a4 <= (uVar7 & 0xffff))) {
    _DAT_0080a66e = _DAT_0080a66e | 1;
  }
  func_0x0004e410(0x62ccc);
  if ((_DAT_0080a66e & 2) == 0) {
    puVar2 = &Discovered_2D_Engine_RPM_0x5D25E;
  }
  else {
    puVar2 = &Discovered_2D_Engine_RPM_0x5D26A;
  }
  uVar3 = func_0x0004e1a8(puVar2);
  func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5D252);
  _DAT_0080a672 = func_0x0004db80(uVar3);
  if ((_DAT_0080a672 <= _DAT_0080a670) ||
     (((uint)uMem0005459e <= (uVar7 & 0xffff) && ((uint)uMem000545a0 <= (uVar6 & 0xffff))))) {
    _DAT_0080a66e = _DAT_0080a66e & 0xfffe;
  }
  if ((_DAT_0080a66e & 1) == 0) {
    if ((_DAT_00808870 & 8) == 0) {
      _DAT_0080a670 = uMem000544a6;
      uVar4 = _DAT_0080a670;
    }
    else {
      _DAT_0080a670 = 0;
      uVar4 = _DAT_0080a670;
    }
  }
  else {
    uVar4 = _DAT_0080a670;
    if (((_DAT_00808868 & 1) != 0) && (uVar4 = _DAT_0080a670 + 1, _DAT_0080a670 == 0xffff)) {
      uVar4 = _DAT_0080a670;
    }
  }
  _DAT_0080a670 = uVar4;
  func_0x0004e410(0x62ccc);
  if ((_DAT_0080a66e & 2) == 0) {
    puVar2 = &Discovered_2D_Engine_RPM_0x5D2E6;
  }
  else {
    puVar2 = &Discovered_2D_Engine_RPM_0x5D2F2;
  }
  func_0x0004e1a8(puVar2);
  _DAT_0080a680 = func_0x0004e490(3);
  _RAM_Boost_Error = _DAT_0080883a;
  func_0x0004e410(0x62ccc);
  func_0x0004e410(0x62ce2);
  if ((_DAT_0080a66e & 2) == 0) {
    uVar3 = 0x5d276;
  }
  else {
    uVar3 = 0x5d2ae;
  }
  _DAT_0080a67e = func_0x0004e1a8(uVar3);
  if ((_DAT_0080a66e & 1) == 0) {
    _DAT_0080a67c = func_0x0004db80(_DAT_008094e4,_DAT_0080a680);
    _DAT_0080a67a = _DAT_0080a678;
    _DAT_0080a676 = 0xffff;
  }
  else {
    uVar4 = func_0x0004db80(_DAT_008094e4,_DAT_0080a680);
    if (uVar4 < _DAT_0080a67c) {
      _DAT_0080a67c = uVar4;
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
  uVar4 = func_0x0002a398(_DAT_0080a676,_DAT_00808796);
  _DAT_0080a674 = uVar4;
  if (uStack_8 < uVar4) {
    uVar4 = uStack_8;
  }
  return uVar4;
}


