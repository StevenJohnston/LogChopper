/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: dfco_rpm_hysteresis_evaluator_0x1ca50
 * Address:  0x1CA50
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

ushort dfco_rpm_hysteresis_evaluator_0x1ca50(uint param_1)

{
  ushort uVar1;
  uint uVar2;
  ushort uVar3;
  ushort uVar4;
  ushort uVar5;
  ushort uVar6;
  
  func_0x0004e410(0x62338);
  uVar2 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5D644);
  uVar3 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5D656);
  uVar4 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5D668);
  func_0x0004e410(0x62338);
  uVar5 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x57D68);
  uVar6 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x57D7A);
  uVar1 = _DAT_008087ba;
  if ((_DAT_00808878 & 0x80) == 0) {
    if (uVar6 < _DAT_008087ba) {
      _DAT_00808878 = _DAT_00808878 | 0x80;
    }
  }
  else if (_DAT_008087ba <= uVar5) {
    _DAT_00808878 = _DAT_00808878 & 0xff7f;
  }
  if ((_DAT_00808878 & 0x80) == 0) {
    if (_DAT_008083b8 == 0) {
      DAT_00808c18 = DAT_00808c18 & 0xfb;
    }
    else {
      DAT_00808c18 = DAT_00808c18 | 4;
    }
  }
  else {
    _DAT_008083b8 = sMem00054be8;
    DAT_00808c18 = DAT_00808c18 & 0xfb;
  }
  if ((_DAT_00808878 & 0x8000) == 0) {
    if (uMem000530b0 < _DAT_0080879e) {
      _DAT_00808878 = _DAT_00808878 | 0x8000;
    }
  }
  else if (_DAT_0080879e <= uMem000530b2) {
    _DAT_00808878 = _DAT_00808878 & 0x7fff;
  }
  func_0x0004e410(0x62338);
  if ((uVar2 & 0xffff) < (uint)uVar1) {
    _DAT_00808362 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5D67A);
    _DAT_00808362 = _DAT_00808362 << 2;
  }
  if (uMem00054504 < uVar1) {
    _DAT_00808364 = sMem00054506 << 2;
  }
  if ((DAT_008088da & 2) == 0) {
    if ((_DAT_00808868 & 1) != 0) {
      _DAT_0080a6d6 = func_0x0004e500(_DAT_0080a6d6,uMem00054508);
    }
  }
  else {
    _DAT_0080a6d6 = 0x100;
  }
  if (uVar4 <= uVar3) {
    uVar4 = uVar3;
  }
  uVar4 = func_0x0004e01c(uVar4,uVar3,_DAT_0080a6d6);
  if (((((_DAT_00808646 & 4) == 0) || ((_DAT_00808878 & 0x40) != 0)) || ((_DAT_00808854 & 8) != 0))
     || ((_DAT_0080879e <= uMem0005305c ||
         (((((uVar2 & 0xffff) < (uint)uVar1 || (_DAT_00808362 != 0)) &&
           ((uMem00054504 < uVar1 || (_DAT_00808364 != 0)))) || ((_DAT_0080aa0e & 1) != 0)))))) {
    _DAT_0080a6d8 = _DAT_0080a6d8 & 0xfffd;
  }
  else {
    _DAT_0080a6d8 = _DAT_0080a6d8 | 2;
  }
  if (((((_DAT_00808646 & 4) == 0) || ((_DAT_00808878 & 0x40) != 0)) ||
      (((_DAT_00808854 & 8) != 0 ||
       ((((uint)_DAT_0080879e <= (param_1 & 0xffff) || (_DAT_0080879e <= uMem0005305e)) ||
        (uVar4 < uVar1)))))) ||
     (((uVar3 < uVar1 && ((_DAT_00808646 & 0x80) == 0)) && ((_DAT_00808646 & 4) != 0)))) {
    _DAT_0080a6d8 = _DAT_0080a6d8 | 4;
  }
  else {
    _DAT_0080a6d8 = _DAT_0080a6d8 & 0xfffb;
  }
  if ((_DAT_0080a6d8 & 6) == 2) {
    _DAT_0080a6d8 = _DAT_0080a6d8 | 1;
  }
  else if ((_DAT_0080a6d8 & 6) == 4) {
    _DAT_0080a6d8 = _DAT_0080a6d8 & 0xfffe;
  }
  return _DAT_0080a6d8 & 1;
}


