/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: throttle_actuator_safety_check
 * Address:  0x70950
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void throttle_actuator_safety_check(void)

{
  undefined4 uVar1;
  uint uVar2;
  undefined4 uVar3;
  undefined4 uVar4;
  uint uVar5;
  ushort uVar6;
  undefined4 in_R9;
  undefined4 in_R10;
  ushort uStack00000012;
  
  if ((_DAT_0080450e & 1) == 0) {
    _DAT_00809d4a = _DAT_00809d4a & 0xfffb;
  }
  else {
    _DAT_00809d4a = _DAT_00809d4a | 4;
  }
  uVar1 = func_0x0000ae60(_DAT_00809e1c,uMem00063b4a);
  func_0x0000ae38(&DAT_00809e14,uVar1);
  uStack00000012 = _DAT_00809e14;
  uVar1 = func_0x0000ae4c(_DAT_0080450c,uMem00063ba6);
  func_0x0000ae38(&DAT_00804b44,uVar1);
  func_0x0004e500(uMem00063bf2 + 0x80,_DAT_00804b44);
  uVar1 = func_0x0004dc38(uMem00063bac,uMem00063baa);
  func_0x0000ae38(&DAT_00804b50,uVar1);
  uVar1 = func_0x0000ae4c(_DAT_00804a92,uMem00063ba8);
  func_0x0000ae38(&DAT_00804b48,uVar1);
  func_0x0004e500(uMem00063bf2 + 0x80,_DAT_00804b48);
  uVar1 = func_0x0004dc38(uMem00063bae,uMem00063bb0);
  func_0x0000ae38(&DAT_00804b4c,uVar1);
  if ((_DAT_00809d30 & 0x20) == 0) {
    if ((_DAT_00809d4a & 2) == 0) {
      func_0x0004db80(_DAT_00809f08,_DAT_00804b50);
      uVar5 = func_0x0004e500(0x80);
      func_0x0004db80(_DAT_00809e74,_DAT_00804b4c);
      func_0x0004e500(0x80);
      uVar2 = func_0x0004db80(uMem00063bb4);
      func_0x0004db80(0x8000,_DAT_00804b44);
      uVar1 = func_0x0004e500(_DAT_00804b48);
      func_0x0000ae38(&DAT_00809f84,uVar1);
      if ((uVar2 & 0xffff) < (uVar5 & 0xffff)) {
        func_0x0004db80(_DAT_00809e74,_DAT_00809f84);
        func_0x0004e500(0x8000);
        uVar5 = func_0x0004db80(uMem00063bb4);
      }
      else {
        uVar5 = (uint)_DAT_00809f08;
      }
      uVar5 = func_0x0000ae60(uVar5,0x3ff);
      if ((uint)_DAT_00809e9c + (uint)uMem00063bb6 < (uVar5 & 0xffff)) {
        uVar5 = (uint)_DAT_00809e9c + (uint)uMem00063bb6;
      }
    }
    else {
      uVar5 = (uint)_DAT_00809ea0;
    }
  }
  else {
    uVar5 = (uint)uMem00063bb2;
  }
  func_0x0000ae38(&DAT_00809e9c,uVar5);
  func_0x0004db80(_DAT_00809e9c,_DAT_00804b50);
  uVar1 = func_0x0004e500(0x80);
  func_0x0000ae38(&DAT_00809e78,uVar1);
  uVar6 = _DAT_0080a01c;
  if (_DAT_00809e78 < _DAT_0080a01c) {
    uVar6 = _DAT_00809e78;
  }
  uVar1 = func_0x0000ae60(uVar6,0x3ff);
  func_0x0000ae38(&DAT_00809e7c,uVar1);
  uVar1 = func_0x0004e01c(_DAT_00809e80,_DAT_00809e7c,uMem00063bf0);
  func_0x0000ae38(&DAT_00809e80,uVar1);
  uVar5 = (uint)_DAT_00809e80;
  func_0x0000ae38(0x809e98,_DAT_00809e94);
  func_0x0000ae38(&DAT_00809e94,_DAT_00809e90);
  func_0x0000ae38(&DAT_00809e90,_DAT_00809e8c);
  func_0x0000ae38(&DAT_00809e8c,_DAT_00809e84);
  uVar1 = func_0x0004e500(uVar5,uMem00063bf2);
  uVar3 = func_0x0004db80(in_R9,uMem00063c42);
  uVar3 = func_0x0004dc38(_DAT_0080969a,in_R9,uVar3);
  func_0x0000ae38(&DAT_00809ec8,uVar3);
  func_0x0004e4a4(uVar1,in_R9);
  uVar1 = func_0x0004dfc0(_DAT_00809ec8);
  func_0x0000ae38(&DAT_00809e84,uVar1);
  uVar1 = func_0x0004e500(_DAT_00809ef4,uMem00063bf2);
  func_0x0000ae38(&DAT_00809e88,uVar1);
  uVar1 = func_0x0004e500(in_R10,uStack00000012 >> 2);
  func_0x0004e4a4(_DAT_00809e84,uVar1);
  uVar3 = func_0x0004dfc0(in_R9);
  func_0x0004e410(0x6482a);
  func_0x0000ae38(&DAT_00809f60,_DAT_00809f60);
  uVar4 = func_0x0004e1a8(&Discovered_2D_Unknown_RAM_0xDF60_0x645AC);
  func_0x0000ae38(&DAT_0080a008,uVar4);
  uVar4 = func_0x0000ae60(_DAT_00809ea4,_DAT_0080a008);
  func_0x0000ae38(&DAT_00809ed8,uVar4);
  uVar3 = func_0x0004ddbc(uVar3,_DAT_00809ed8);
  func_0x0004e4a4(_DAT_00809e88,uVar1);
  uVar1 = func_0x0004dfc0(in_R9);
  func_0x0004e410(0x64866);
  func_0x0000ae38(&DAT_00809f60,_DAT_00809f60);
  uVar4 = func_0x0004e1a8(&Discovered_2D_Unknown_RAM_0xDF60_0x645CC);
  func_0x0000ae38(&DAT_0080a00c,uVar4);
  uVar4 = func_0x0000ae60(_DAT_00809ea8,_DAT_0080a00c);
  func_0x0000ae38(&DAT_00809edc,uVar4);
  uVar1 = func_0x0004ddbc(uVar1,_DAT_00809edc);
  func_0x0000ae38(&DAT_00809ee0,uVar1);
  uVar1 = func_0x0000ae4c(uVar3,_DAT_00809ee0);
  func_0x0000ae38(&DAT_00809ee4,uVar1);
  func_0x0000ae38(0x809ed4,_DAT_00809ee4);
  uVar6 = _DAT_00809e7c;
  if (_DAT_00809e7c <= _DAT_00809ef4) {
    uVar6 = _DAT_00809ef4;
  }
  if ((_DAT_00809d4a & 1) == 0) {
    if (uMem00063bce < uVar6) {
      _DAT_00809d4a = _DAT_00809d4a | 1;
    }
  }
  else if (uVar6 <= uMem00063bd0) {
    _DAT_00809d4a = _DAT_00809d4a & 0xfffe;
  }
  DAT_00809d27 = DAT_00809d27 | 1;
  return;
}


