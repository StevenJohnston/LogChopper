/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: decel_fuel_cut_calc
 * Address:  0x487B0
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void decel_fuel_cut_calc(void)

{
  bool bVar1;
  uint uVar2;
  uint uVar3;
  short sVar4;
  uint uVar5;
  byte in_PSW;
  short in_stack_00000012;
  
  uVar3 = (uint)_DAT_008093a6 * 0x10000;
  uVar2 = (uint)_DAT_008093a6 * 0x20000;
  bVar1 = CARRY4(uVar2,uVar2 + (in_PSW & 1));
  if (CARRY4(uVar3,uVar3) || bVar1) {
    uVar5 = (uint)_DAT_008093a6 * 0x400000;
    uVar2 = (uint)_DAT_008093a6 * 0x800000;
    if (CARRY4(uVar5,uVar5) || CARRY4(uVar2,uVar2 + (CARRY4(uVar3,uVar3) || bVar1))) {
      _DAT_008048d0 = _DAT_00809182;
      _DAT_008048d4 = func_0x0004e500(_DAT_00809194,1);
      DAT_00804a15 = DAT_00804a15 | 4;
      DAT_008048b8 = DAT_008048b8 | 2;
    }
    else {
      func_0x0009d77c(1,2,0);
      DAT_00809010 = DAT_00809010 & 0xf7;
      func_0x0009ea4c(1,2);
      DAT_00809434 = DAT_00809434 | 1;
      _DAT_008048d6 = _DAT_00809182;
      _DAT_008048d8 = func_0x0004e500(_DAT_00809192,1);
      DAT_00804a15 = DAT_00804a15 | 8;
    }
  }
  if (cMem0005034a == '\0') {
    _DAT_00809178 = _DAT_00809178 | 0x1000;
  }
  _DAT_008045e2 = _DAT_008045e2 & 0xfcff;
  if ((_DAT_008093a6 & 0x80) == 0) {
    _DAT_00809178 = _DAT_00809178 & 0xff44;
  }
  if ((((in_stack_00000012 != 0) && ((_DAT_00809178 & 0xbb) == 0)) &&
      (sVar4 = func_0x00048cfc(), sVar4 != 0)) && (_DAT_008093aa < _DAT_0080918c)) {
    _DAT_008045e2 = _DAT_008045e2 & 0xfcff;
  }
  if (((_DAT_00809178 & 0x3a) == 0) && ((_DAT_0080847e == 0 || ((_DAT_00808870 & 0x10) != 0)))) {
    DAT_0080939f = DAT_0080939f & 0xbf;
  }
  else {
    DAT_0080939f = DAT_0080939f | 0x40;
  }
  if ((_DAT_00809178 & 0x33) == 0) {
    DAT_0080939f = DAT_0080939f & 0xef;
  }
  else {
    DAT_0080939f = DAT_0080939f | 0x10;
  }
  if ((_DAT_00809178 & 8) == 0) {
    DAT_0080939f = DAT_0080939f & 0xdf;
  }
  else {
    DAT_0080939f = DAT_0080939f | 0x20;
  }
  if ((_DAT_00809178 & 0x38) != 0) {
    _DAT_00808464 = sMem0005394a;
  }
  if ((_DAT_00808464 == 0) || ((_DAT_00809178 & 0x38) != 0)) {
    _DAT_008093a6 = _DAT_008093a6 & 0xfffd;
  }
  else {
    _DAT_008093a6 = _DAT_008093a6 | 2;
  }
  if (((_DAT_0080917a & 8) == 0) && ((_DAT_00809178 & 8) != 0)) {
    _DAT_0080939a = _DAT_00809396;
  }
  if ((_DAT_00809178 & 0x3b) != 0) {
    DAT_008092d7 = DAT_008092d7 | 0x20;
  }
  if ((_DAT_00809178 & 0x3a) != 0) {
    DAT_008092db = DAT_008092db | 0x20;
  }
  if ((((_DAT_00804bfe & 0x10) == 0) &&
      ((((DAT_00809010 & 8) != 0 && ((DAT_00809434 & 2) != 0)) || ((DAT_00809434 & 1) != 0)))) &&
     ((DAT_00809434 & 0x40) == 0)) {
    sVar4 = _DAT_00804b86 + 1;
    if (_DAT_00804b86 == -1) {
      sVar4 = _DAT_00804b86;
    }
    _DAT_00804b86 = sVar4;
    _DAT_00804bfe = _DAT_00804bfe | 0x10;
  }
  if ((((_DAT_00804c02 & 0x20) == 0) && ((_DAT_00804c02 & 0x600) != 0)) &&
     (((DAT_00809434 & 1) == 0 &&
      (((_DAT_00804c02 & 0x800) == 0 &&
       (uVar3 = (uint)_DAT_00804c00 * 0x80000, uVar2 = (uint)_DAT_00804c00 * 0x100000,
       !CARRY4(uVar3,uVar3) && !CARRY4(uVar2,uVar2))))))) {
    sVar4 = _DAT_00804b9a + 1;
    if (_DAT_00804b9a == -1) {
      sVar4 = _DAT_00804b9a;
    }
    _DAT_00804b9a = sVar4;
    _DAT_00804c02 = _DAT_00804c02 | 0x20;
  }
  if ((((_DAT_00804c02 & 0x40) == 0) && ((_DAT_00804c02 & 0x8800) != 0)) &&
     (uVar3 = (uint)_DAT_00804c00 * 0x80000, uVar2 = (uint)_DAT_00804c00 * 0x100000,
     !CARRY4(uVar3,uVar3) && !CARRY4(uVar2,uVar2))) {
    sVar4 = _DAT_00804b9c + 1;
    if (_DAT_00804b9c == -1) {
      sVar4 = _DAT_00804b9c;
    }
    _DAT_00804b9c = sVar4;
    _DAT_00804c02 = _DAT_00804c02 | 0x40;
  }
  return;
}


