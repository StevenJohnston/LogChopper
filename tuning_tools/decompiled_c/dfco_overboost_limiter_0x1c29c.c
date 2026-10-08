/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: dfco_overboost_limiter_0x1c29c
 * Address:  0x1C29C
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void dfco_overboost_limiter_0x1c29c(void)

{
  short sVar6;
  undefined4 uVar1;
  undefined4 uVar2;
  undefined4 uVar3;
  uint uVar4;
  uint uVar5;
  ushort uVar7;
  byte bVar8;
  
  uVar7 = 0;
  sVar6 = func_0x0001c554();
  if (sVar6 != 0) {
    uVar7 = 0x248;
  }
  sVar6 = func_0x0001c5a0();
  if (sVar6 != 0) {
    uVar7 = uVar7 | 0x208;
  }
  sVar6 = func_0x0001c740();
  if (sVar6 != 0) {
    uVar7 = uVar7 | 0x108;
  }
  sVar6 = func_0x0000b6f0();
  if (sVar6 == 0) {
    uVar7 = uVar7 | 0x208;
  }
  sVar6 = func_0x0001c768();
  if (sVar6 != 0) {
    uVar7 = uVar7 | 0x208;
  }
  sVar6 = func_0x0001c7d4();
  if (sVar6 != 0) {
    uVar7 = uVar7 | 0x608;
  }
  if (((_DAT_00808854 & 8) != 0) && (uMem00053b46 < _DAT_0080879e)) {
    uVar7 = uVar7 | 0x208;
  }
  if ((_DAT_00808848 & 3) != 0) {
    func_0x0001cdc4();
  }
  if (((_DAT_00808848 & 1) != 0) && (sVar6 = func_0x0001ec10(), sVar6 != 0)) {
    uVar7 = uVar7 | 0x208;
  }
  _DAT_0080897a = func_0x0001c850();
  sVar6 = func_0x0001ca50(_DAT_0080897a);
  if (sVar6 != 0) {
    uVar7 = uVar7 | 0xc;
  }
  sVar6 = func_0x0001cce4(_DAT_0080897a);
  if (sVar6 != 0) {
    uVar7 = uVar7 | 0xc;
  }
  if ((_DAT_00808848 & 2) != 0) {
    func_0x0004e500(_DAT_008087b2,_DAT_008087b0);
    uVar1 = func_0x0004dcf4(0x9c4,_DAT_00808dea);
    uVar2 = func_0x0004e500(_DAT_00809ce8,1);
    uVar3 = func_0x0004db80(_DAT_00809ce8,1);
    _DAT_00809ce8 = func_0x0004dc38(uVar1,uVar3,uVar2);
  }
  if (((_DAT_00808848 & 2) == 0) || ((_DAT_008096e8 & 0x80) == 0)) {
    _DAT_008096e8 = _DAT_008096e8 & 0xffbf;
  }
  else {
    _RAM_Boost_Error = _DAT_00809ce8;
    func_0x0004e410(0x5d634);
    func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5A5E4);
    uVar4 = func_0x0004db80(uMem000503d4);
    if ((((uint)_DAT_0080a7ea + (uVar4 & 0xffff) < (uint)_DAT_00808796) &&
        (_DAT_0080897a < _DAT_0080879e)) && ((_DAT_008096e8 & 0x40) == 0)) {
      uVar7 = uVar7 | 0x208;
    }
    else {
      uVar7 = 0;
      _DAT_008096e8 = _DAT_008096e8 | 0x40;
    }
  }
  if ((_DAT_008045e2 & 0x300) != 0) {
    uVar7 = uVar7 & 0xfcf3;
  }
  if ((DAT_00809630 & 2) != 0) {
    uVar7 = uVar7 | 0x208;
  }
  if ((_DAT_00809d34 & 1) != 0) {
    uVar7 = uVar7 | 0x208;
  }
  if ((_DAT_00808870 & 0x11) != 0) {
    _DAT_0080836c = sMem00054808 * 0x50;
  }
  bVar8 = (byte)_DAT_0080a9e6;
  if ((uVar7 & 4) == 0) {
    _DAT_0080a9e6 = _DAT_0080a9e6 & 0xfffe;
  }
  else {
    _DAT_0080a9e6 = _DAT_0080a9e6 | 1;
  }
  _DAT_00808870 = _DAT_00808870 & 0xb8f3 | uVar7 & 0x470c;
  func_0x0001ce44(0x8df8);
  if ((_DAT_0080a9e6 & 1) == 0) {
    if ((bVar8 & 1) != 0) {
      if (_DAT_0080836c == 0) {
        _DAT_0080a9e6 = _DAT_0080a9e6 | 2;
      }
      else {
        _DAT_0080a9e6 = _DAT_0080a9e6 & 0xfffd;
      }
      if (((cMem000503b3 == '\x01') && ((_DAT_00808844 & 2) != 0)) &&
         ((_DAT_008086de < uMem00054842 ||
          ((uMem0005480a < _DAT_008086de ||
           (uVar5 = (uint)_DAT_0080a9e6 * 0x800000, uVar4 = (uint)_DAT_0080a9e6 * 0x1000000,
           CARRY4(uVar5,uVar5) || CARRY4(uVar4,uVar4))))))) {
        _DAT_0080a9e6 = _DAT_0080a9e6 & 0xfffb;
      }
      else {
        _DAT_0080a9e6 = _DAT_0080a9e6 | 4;
      }
      if ((_DAT_00808646 & 0x80) == 0) {
        _DAT_0080a9e6 = _DAT_0080a9e6 & 0xfff7;
      }
      else {
        _DAT_0080a9e6 = _DAT_0080a9e6 | 8;
      }
      _DAT_0080a9e6 = _DAT_0080a9e6 | 0x10;
    }
  }
  else {
    _DAT_0080a9e6 = _DAT_0080a9e6 & 0xffe1;
  }
  return;
}


