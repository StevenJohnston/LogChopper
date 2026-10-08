/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: decel_fuel_cut_evaluator
 * Address:  0x1BB3C
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 decel_fuel_cut_evaluator(void)

{
  int iVar1;
  uint uVar2;
  short sVar3;
  ushort uVar4;
  uint uVar5;
  uint uVar6;
  int iVar7;
  
  if ((_DAT_008088da & 0x10) == 0) {
    if (uMem00053194 < _DAT_008087b4) {
      _DAT_008088da = _DAT_008088da | 0x10;
    }
  }
  else if (_DAT_008087b4 <= uMem00053196) {
    _DAT_008088da = _DAT_008088da & 0xffef;
  }
  iVar1 = func_0x0004e1a8(0x55588);
  uVar6 = 2;
  if (cMem00050352 == '\x02') {
    if ((_DAT_00808846 & 0x10) == 0) {
      if ((_DAT_00808646 & 0x20) == 0) {
        uVar5 = (uint)bMem00057175;
        iVar7 = iVar1 + uVar5;
        uVar2 = (uint)bMem00057174;
      }
      else if ((_DAT_00808886 & 4) == 0) {
        uVar5 = (uint)bMem00057171;
        iVar7 = iVar1 + uVar5;
        uVar2 = (uint)bMem00057170;
      }
      else {
        uVar5 = (uint)bMem00057173;
        iVar7 = iVar1 + uVar5;
        uVar2 = (uint)bMem00057172;
      }
    }
    else if ((_DAT_00808646 & 0x20) == 0) {
      iVar7 = iVar1 + (uint)bMem00057175;
      uVar2 = (uint)bMem00057174;
      uVar5 = 2;
    }
    else if ((_DAT_00808886 & 4) == 0) {
      uVar5 = (uint)bMem00057171;
      iVar7 = iVar1 + uVar5;
      uVar2 = (uint)bMem00057170;
    }
    else {
      uVar5 = (uint)bMem00057173;
      iVar7 = iVar1 + uVar5;
      uVar2 = (uint)bMem00057172;
    }
  }
  else if ((_DAT_00808846 & 0x10) == 0) {
    uVar5 = (uint)_DAT_008088c2;
    if (uMem00054560 < uVar5) {
      uVar6 = (uint)bMem0005dd54;
      iVar7 = iVar1 + uVar6;
      uVar2 = (uint)bMem0005dd52;
    }
    else {
      uVar5 = (uint)bMem0005559c;
      iVar7 = iVar1 + uVar5;
      uVar2 = (uint)bMem0005559a;
    }
  }
  else {
    uVar5 = (uint)uMem00054560;
    uVar6 = (uint)_DAT_008088c2;
    if (uVar5 < uVar6) {
      iVar7 = iVar1 + (uint)bMem0005dd54;
      uVar2 = (uint)bMem0005dd52;
    }
    else {
      uVar5 = (uint)bMem0005559c;
      iVar7 = iVar1 + uVar5;
      uVar2 = (uint)bMem0005559a;
    }
  }
  iVar1 = iVar1 + uVar2;
  sVar3 = func_0x0001bd64(uVar2,uVar5,uVar6);
  if (sVar3 != 0) {
    iVar1 = iVar1 + (uint)uMem00053054;
    iVar7 = iVar7 + (uint)uMem00053054;
  }
  if ((_DAT_00808848 & 3) != 0) {
    iVar1 = iVar1 + (uint)_DAT_00809622;
    iVar7 = iVar7 + (uint)_DAT_00809622;
  }
  uVar6 = func_0x0004dc14(iVar1);
  uVar4 = func_0x0004dc14(iVar7);
  if ((((cMem00050352 == '\x02') || ((_DAT_00808646 & 0xb0) != 0x80)) &&
      ((cMem00050352 != '\x02' || ((_DAT_00808646 & 0x90) != 0x80)))) || (_DAT_0080879e <= uVar4)) {
    _DAT_008088da = _DAT_008088da & 0xffdf;
  }
  else {
    if ((_DAT_00808648 & 0x80) == 0) {
      _DAT_008088da = _DAT_008088da | 0x20;
    }
    if (((((_DAT_008088da & 0x10) == 0) && ((uint)uMem00053198 * 0x14 <= (uint)_DAT_0080800c)) &&
        ((uint)_DAT_0080879e <= (uVar6 & 0xffff))) && ((_DAT_008088da & 0x20) != 0)) {
      return 1;
    }
  }
  return 0;
}


