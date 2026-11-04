/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: func_crank_angle_0x373a0
 * Address:  0x373A0
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void func_crank_angle_0x373a0(uint param_1)

{
  ushort uVar1;
  undefined4 uVar2;
  int iVar3;
  uint uVar4;
  uint uVar5;
  undefined2 uVar6;
  undefined2 uVar7;
  int iVar8;
  
  uVar7 = _DAT_00809970;
  iVar8 = 0x9000;
  _DAT_008097ac = (ushort)(param_1 >> 5);
  if ((_DAT_008097b4 & 1) != 0) {
    uVar2 = func_0x0004ddbc(_DAT_00809970,0x90);
    uVar2 = func_0x0004dcf4((uint)_DAT_008097ac - (uint)_DAT_008097aa,uVar2,
                            (uint)_DAT_008097ac - (uint)_DAT_008097ae);
    iVar3 = func_0x0004e490(_DAT_00809796,0x200);
    if (_DAT_00809796 == 0) {
      iVar3 = iVar8;
    }
    uVar4 = func_0x0004e500(iVar3,uVar2);
    uVar6 = (undefined2)uVar4;
    if (_DAT_008097b2 == 1) {
      _DAT_008097a6 = _DAT_008097a4;
      _DAT_008097a4 = uVar6;
      func_0x00037ea4(1);
      func_0x0004db80(_DAT_00809a5e,_DAT_0080a548);
      _DAT_00809a5e = func_0x0004e500(0x1000);
    }
    else {
      _DAT_008097a2 = _DAT_008097a0;
      _DAT_008097a8 = *(ushort *)((uint)_DAT_008097b2 * 2 + 0x85a8);
      uVar5 = (uint)_DAT_008097a8;
      _DAT_008097a0 = uVar6;
      if (uVar5 < (uVar4 & 0xffff)) {
        uVar4 = func_0x0004e500(uVar4,uVar5);
        _DAT_008097b4 = _DAT_008097b4 & 0xfffd;
        if (0x47ff < (uVar4 & 0xffff)) {
          uVar4 = -(uVar4 - iVar8);
          _DAT_008097b4 = _DAT_008097b4 | 2;
        }
      }
      else {
        uVar4 = func_0x0004e500(uVar5,uVar4);
        uVar1 = _DAT_008097b4;
        _DAT_008097b4 = _DAT_008097b4 | 2;
        if (0x47ff < (uVar4 & 0xffff)) {
          uVar4 = -(uVar4 - iVar8);
          DAT_008097b4 = SUB21(uVar1,1);
          _DAT_008097b4 = CONCAT11(DAT_008097b4,DAT_008097b5) & 0xfffd;
        }
      }
      _DAT_0080ab96 = (undefined2)uVar4;
      if ((_DAT_008097b4 & 2) == 0) {
        _DAT_0080ab90 = func_0x0004e500(0x570,uVar4);
      }
      else {
        _DAT_0080ab90 = func_0x0004db80(uVar4,0x570);
      }
      if ((_DAT_008097b4 & 2) == 0) {
        _DAT_00809a5e = func_0x0004db80(uMem000541ba,uVar4);
      }
      else {
        _DAT_00809a5e = func_0x0004e500(uMem000541ba,uVar4);
      }
      func_0x00037ea4(0);
    }
  }
  if ((_DAT_008097b6 & 1) != 0) {
    uVar2 = func_0x0004ddbc(uVar7,0x90);
    uVar2 = func_0x0004dcf4((uint)_DAT_008097ac - (uint)_DAT_00809a1e,uVar2,
                            (uint)_DAT_008097ac - (uint)_DAT_008097ae);
    iVar3 = func_0x0004e490(_DAT_00809796,0x200);
    if (_DAT_00809796 == 0) {
      iVar3 = iVar8;
    }
    uVar4 = func_0x0004e500(iVar3,uVar2);
    uVar7 = (undefined2)uVar4;
    if (_DAT_008097b2 == 0) {
      _DAT_00809a5a = _DAT_00809a58;
      _DAT_00809a58 = uVar7;
      func_0x00037ea4(3);
      func_0x0004db80(_DAT_00809a62,_DAT_0080a54a);
      _DAT_00809a62 = func_0x0004e500(0x1000);
    }
    else {
      _DAT_00809a56 = _DAT_00809a54;
      _DAT_00809a5c = *(ushort *)((uint)_DAT_00809a4e * 2 + 0x85b0);
      uVar5 = (uint)_DAT_00809a5c;
      _DAT_00809a54 = uVar7;
      if (uVar5 < (uVar4 & 0xffff)) {
        uVar4 = func_0x0004e500(uVar4,uVar5);
        _DAT_008097b6 = _DAT_008097b6 & 0xfffd;
        if (0x47ff < (uVar4 & 0xffff)) {
          uVar4 = -(uVar4 - iVar8);
          _DAT_008097b6 = _DAT_008097b6 | 2;
        }
      }
      else {
        uVar4 = func_0x0004e500(uVar5,uVar4);
        uVar1 = _DAT_008097b6;
        _DAT_008097b6 = _DAT_008097b6 | 2;
        if (0x47ff < (uVar4 & 0xffff)) {
          uVar4 = -(uVar4 - iVar8);
          DAT_008097b6 = SUB21(uVar1,1);
          _DAT_008097b6 = CONCAT11(DAT_008097b6,DAT_008097b7) & 0xfffd;
        }
      }
      _DAT_0080ab98 = (undefined2)uVar4;
      if ((_DAT_008097b6 & 2) == 0) {
        _DAT_0080ab94 = func_0x0004db80(0x500,uVar4);
      }
      else {
        _DAT_0080ab94 = func_0x0004e500(0x500,uVar4);
      }
      if ((_DAT_008097b6 & 2) == 0) {
        _DAT_00809a62 = func_0x0004db80(uMem000542fa,uVar4);
      }
      else {
        _DAT_00809a62 = func_0x0004e500(uMem000542fa,uVar4);
      }
      func_0x00037ea4(2);
    }
  }
  _DAT_008097b6 = _DAT_008097b6 & 0xfffe;
  _DAT_008097b4 = _DAT_008097b4 & 0xfefe;
  _DAT_008097ae = _DAT_008097ac;
  return;
}


