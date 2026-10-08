/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: throttle_target_accel_0x294ac
 * Address:  0x294AC
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void throttle_target_accel_0x294ac(void)

{
  uint uVar1;
  uint uVar2;
  undefined2 uVar8;
  uint uVar3;
  uint uVar4;
  undefined4 uVar5;
  undefined *puVar6;
  undefined4 uVar7;
  ushort uVar9;
  ushort uVar10;
  undefined2 uVar11;
  
  uVar10 = 0;
  if (((_DAT_008080b8 != 0) || ((_DAT_00808646 & 4) != 0)) || ((_DAT_00808870 & 0x10) == 0)) {
    uVar10 = 8;
  }
  if (_DAT_008080b8 == 0) {
    uVar9 = _DAT_00809632;
    if ((_DAT_00809632 & 2) == 0) {
      if (((_DAT_00808686 < uMem00053d5c) || (uMem00053d5e <= _DAT_00808686)) ||
         ((_DAT_008087a4 < uMem00053d60 || (uMem00053d62 <= _DAT_008087a4)))) {
        uVar9 = _DAT_00809632 & 0xfffe;
      }
      else {
        uVar9 = _DAT_00809632 | 1;
      }
      uVar9 = uVar9 | 2;
    }
  }
  else {
    uVar9 = 0;
  }
  if ((_DAT_00809630 & 0x80) != 0) {
    uVar10 = uVar10 | 0x40;
  }
  if ((((_DAT_00808634 & 0x80) == 0) || (_DAT_00808274 != 0)) ||
     ((_DAT_008080b8 != 0 && ((_DAT_00808010 <= uMem00053ce6 && (uMem00053ce8 < _DAT_00808010))))))
  {
    uVar10 = uVar10 | 0x10;
  }
  func_0x00000310();
  _DAT_00809652 = _DAT_00809652 & 0xffa7 | uVar10 & 0x58;
  if ((_DAT_00809aba & 0x80) == 0) {
    if (uMem00053eee < _DAT_00808686) {
      _DAT_00809aba = _DAT_00809aba | 0x80;
    }
  }
  else if (_DAT_00808686 <= uMem00053eec) {
    _DAT_00809aba = _DAT_00809aba & 0xff7f;
  }
  _DAT_00809632 = _DAT_00809632 & 0xfffc | uVar9 & 3;
  func_0x00000328();
  _RAM_Boost_Error = func_0x0004dcf4(_DAT_00808b54,4000,uMem0005444a);
  func_0x0004e410(0x62b16);
  uVar1 = func_0x0004e278(0x5cbe2);
  _RAM_Boost_Error = func_0x0004dcf4(_DAT_00808b56,4000,uMem0005444a);
  func_0x0004e410(0x62b16);
  uVar2 = func_0x0004e278(0x5cbe2);
  if (((_DAT_00808868 & 4) != 0) && (_DAT_00809774 != 0)) {
    _DAT_00809774 = _DAT_00809774 + -1;
  }
  if ((_DAT_00808646 & 0x20) == 0) {
    _DAT_00809774 = sMem00053d1a;
  }
  uVar8 = _DAT_008045c2;
  if (((((uMem00053d18 <= _DAT_00808686) && ((_DAT_00808646 & 0x20) != 0)) && (_DAT_00809774 == 0))
      && (((_DAT_00808646 & 0x18) == 0 && ((_DAT_00808b16 & 0x10) != 0)))) &&
     ((_DAT_00808c1a & 3) == 0)) {
    uVar8 = func_0x0004e500(uVar1,(uint)uMem00053d16 << 1);
  }
  uVar3 = (uint)uMem00053e46 << 1;
  if ((uVar3 & 0xffff) <= (uVar1 & 0xffff)) {
    uVar1 = uVar3;
  }
  if ((uVar3 & 0xffff) <= (uVar2 & 0xffff)) {
    uVar2 = uVar3;
  }
  if (((_DAT_00808870 & 0x10) == 0) && ((_DAT_0080af2c & 0x20) != 0)) {
    uVar3 = 0;
  }
  else {
    uVar3 = (uint)uMem00053e48;
  }
  uVar4 = uVar3 << 1;
  if ((uVar1 & 0xffff) < (uVar3 & 0x7fff) << 1) {
    uVar1 = uVar4;
  }
  if ((uVar2 & 0xffff) < (uVar4 & 0xffff)) {
    uVar2 = uVar4;
  }
  uVar11 = (undefined2)uVar2;
  func_0x00000310();
  _DAT_00809688 = (ushort)uVar1;
  func_0x0000ae38(0x809e1c,uVar1);
  _DAT_008045c2 = uVar8;
  _DAT_0080968a = uVar11;
  func_0x00000328();
  func_0x00000310();
  _DAT_008091fc = func_0x0004dc14(_DAT_00809648 >> 4);
  _DAT_0080968e = func_0x0004dc14(_DAT_00809688 >> 4);
  DAT_008096a8 = func_0x0004dc14(_DAT_008096a6 >> 4);
  DAT_008096a4 = func_0x0004dc14(_DAT_008096a2 >> 4);
  _DAT_00808c38 = func_0x0004dc14(_DAT_00808c36 >> 3);
  _DAT_008091fe = func_0x0004dc14(_DAT_00804510 >> 2);
  _DAT_00809200 = func_0x0004dc14(_DAT_00804514 >> 2);
  _DAT_0080969e = _DAT_0080969c;
  func_0x00000328();
  if (_DAT_0080879e < uMem0005468e) {
    _DAT_0080851e = sMem00054692;
    _DAT_0080a836 = _DAT_0080a836 & 0xfffb;
  }
  else {
    _DAT_0080a836 = _DAT_0080a836 | 4;
  }
  if (_DAT_0080879e < uMem00054690) {
    _DAT_00808520 = sMem00054694;
    _DAT_0080a836 = _DAT_0080a836 & 0xfff7;
  }
  else {
    _DAT_0080a836 = _DAT_0080a836 | 8;
  }
  if ((_DAT_00808848 & 3) == 0) {
    uVar10 = _DAT_0080a3ee & 0x20;
    if ((_DAT_00808646 & 4) == 0) {
joined_m0x00029888:
      if (uVar10 == 0) {
joined_m0x0002989a:
        if (uMem00054698 <= _DAT_0080969e) {
          _DAT_0080a836 = _DAT_0080a836 & 0xfffd;
          goto LAB_000298a8;
        }
      }
    }
  }
  else if ((_DAT_00808646 & 0x20) != 0) {
    if (((_DAT_00808848 & 1) != 0) && ((_DAT_00808c2c & 8) == 0)) goto joined_m0x0002989a;
    if ((_DAT_00808848 & 2) != 0) {
      uVar10 = _DAT_00808c2e & 0x40;
      goto joined_m0x00029888;
    }
  }
  _DAT_0080a836 = _DAT_0080a836 | 2;
LAB_000298a8:
  if ((_DAT_0080a836 & 2) == 0) {
    if ((((_DAT_0080a836 & 4) != 0) && (_DAT_0080851e == 0)) ||
       (((_DAT_0080a836 & 8) != 0 && ((_DAT_00808520 == 0 && (uMem00054696 <= _DAT_00808686)))))) {
      _DAT_0080a836 = _DAT_0080a836 | 1;
    }
  }
  else {
    _DAT_0080a836 = _DAT_0080a836 & 0xfffe;
  }
  if ((((_DAT_00808012 < uMem00054112) || ((_DAT_00808646 & 0x80) != 0)) ||
      (_DAT_00808688 < uMem00054116)) ||
     (((_DAT_00808646 & 0x20) != 0 && ((_DAT_00808848 & 3) != 0)))) {
    _DAT_0080a6da = 0xfff;
  }
  else {
    func_0x0004e410(0x625da);
    if ((uint)uMem00054118 << 2 < (uint)_DAT_00809604) {
      uVar5 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5AAE0);
      puVar6 = &Discovered_2D_Engine_RPM_0x5AAB8;
    }
    else {
      uVar5 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5AAF4);
      puVar6 = &Discovered_2D_Engine_RPM_0x5AACC;
    }
    uVar7 = func_0x0004e1a8(puVar6);
    _DAT_0080a6da = func_0x0004e0d4(uVar5,uVar7,_DAT_008045a0);
    _DAT_0080a6da = _DAT_0080a6da << 4;
  }
  return;
}


