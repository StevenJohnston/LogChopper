/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: crank_fuel_injector_calc_0x21f1c
 * Address:  0x21F1C
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

uint crank_fuel_injector_calc_0x21f1c(uint param_1)

{
  bool bVar1;
  ushort uVar6;
  uint uVar2;
  int iVar3;
  uint uVar4;
  undefined4 uVar5;
  undefined1 uVar7;
  undefined2 uVar8;
  
  if ((_DAT_00808870 & 0x11) == 0) {
    uVar6 = func_0x0004ef7c(0x61518,_DAT_0080868c);
    bVar1 = (ushort)((uVar6 & 0xff) << 2) < _DAT_0080800c;
    if ((bVar1) && ((uVar6 & 0xff) != 0)) {
      _DAT_0080a316 = _DAT_0080a316 | 0x2000;
    }
    else {
      _DAT_0080a316 = _DAT_0080a316 & 0xdfff;
    }
    uVar2 = (uint)_DAT_0080a316 * 0x40000;
    uVar4 = (uint)_DAT_0080a316 * 0x80000;
    if (CARRY4(uVar2,uVar2) || CARRY4(uVar4,uVar4 + bVar1)) {
      if (_DAT_0080833c == 0) {
        _DAT_0080833c = sMem00054c06 << 1;
        if (_DAT_0080ab00 < uMem00054c08) {
          iVar3 = (uint)_DAT_0080ab00 + (uint)uMem00054c0a;
        }
        else {
          iVar3 = (uint)_DAT_0080ab00 + (uint)uMem00054c0c;
        }
        _DAT_0080ab00 = func_0x0004dc14(iVar3);
      }
    }
    else {
      _DAT_0080833c = sMem00054c06 << 1;
    }
    uVar6 = func_0x0004ef7c(0x614e8,_DAT_00808686);
    if ((((_DAT_0080a316 & 0x200) == 0) || ((_DAT_0080a316 & 0x40) == 0)) ||
       (_DAT_0080800c <= (ushort)((uVar6 & 0xff) << 2))) {
      _DAT_0080a316 = _DAT_0080a316 & 0xfeff;
    }
    else {
      _DAT_0080a316 = _DAT_0080a316 | 0x100;
    }
    if ((_DAT_0080a316 & 0x100) == 0) {
      if (((_DAT_0080a316 & 0x200) == 0) && (_DAT_008082f4 = sMem00054330 << 1, _DAT_008082f6 == 0))
      {
        _DAT_008082f6 = sMem00054338 << 1;
        if (_DAT_0080a274 < uMem0005433a) {
          uVar8 = uMem00054342;
          if ((_DAT_00808646 & 0x80) != 0) {
            uVar8 = uMem00054340;
          }
        }
        else {
          uVar8 = uMem0005433e;
          if ((_DAT_00808646 & 0x80) != 0) {
            uVar8 = uMem0005433c;
          }
        }
        _DAT_0080a274 = func_0x0004e500(_DAT_0080a274,uVar8);
      }
    }
    else {
      _DAT_008082f6 = sMem00054338 << 1;
      if (_DAT_008082f4 == 0) {
        _DAT_008082f4 = sMem00054330 << 1;
        if (_DAT_0080ab00 == 0) {
          if (_DAT_0080a274 < uMem00054332) {
            iVar3 = (uint)_DAT_0080a274 + (uint)uMem00054334;
          }
          else {
            iVar3 = (uint)_DAT_0080a274 + (uint)uMem00054336;
          }
        }
        else if (_DAT_0080a274 < uMem00054c00) {
          iVar3 = (uint)_DAT_0080a274 + (uint)uMem00054c02;
        }
        else {
          iVar3 = (uint)_DAT_0080a274 + (uint)uMem00054c04;
        }
        _DAT_0080a274 = func_0x0004dc14(iVar3);
      }
    }
    uVar2 = func_0x0004ef7c(0x614f8,_DAT_0080868c);
    uVar2 = uVar2 & 0xff;
    uVar4 = func_0x0004ef7c(0x61508,_DAT_0080868c);
    uVar4 = uVar4 & 0xff;
    if (_DAT_0080ab00 != 0) {
      if (uVar4 < (uVar2 & 0xffff)) {
        iVar3 = -(uVar4 - uVar2);
      }
      else {
        iVar3 = uVar4 - uVar2;
      }
      uVar5 = func_0x0004dcf4(iVar3,_DAT_0080ab00,0xff);
      if (uVar4 < (uVar2 & 0xffff)) {
        uVar2 = func_0x0004e500(uVar2 & 0xffff,uVar5);
      }
      else {
        uVar2 = func_0x0004db80(uVar2,uVar5);
      }
    }
    _DAT_0080aaf8 = func_0x0004dc14(uVar2);
    uVar7 = func_0x0004ef7c(0x5bb30,_DAT_00808686);
    func_0x0004dcf4(uVar7,_DAT_0080a274,0xff);
    _DAT_0080a272 = func_0x0004dcf4(_DAT_0080aaf8,0xff);
    func_0x0004e410(0x617fc);
    _RAM_Boost_Error = func_0x00020b88();
    func_0x0004e410(0x61830);
    _DAT_0080a276 = func_0x0004e1a8(0x5bb4a);
    if (((_DAT_0080a316 & 1) != 0) || (_DAT_0080a272 != 0)) {
      uVar4 = func_0x0004e0d4(_DAT_0080a276,param_1,_DAT_0080a272);
      _RAM_Boost_Error = _DAT_00808686;
      func_0x0004e410(0x6197c);
      param_1 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5BB3E);
      if ((uVar4 & 0xffff) < (param_1 & 0xffff)) {
        param_1 = uVar4 & 0xffff;
      }
    }
  }
  else {
    _DAT_0080a272 = 0;
    _DAT_0080a274 = 0;
    _DAT_008082f4 = sMem00054330 << 1;
    _DAT_008082f6 = sMem00054338 << 1;
    _DAT_0080ab00 = 0;
    _DAT_0080833c = sMem00054c06 << 1;
  }
  return param_1;
}


