/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: tipin_accel_enrich_0x29f50
 * Address:  0x29F50
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void tipin_accel_enrich_0x29f50(void)

{
  int iVar1;
  undefined4 uVar2;
  uint uVar3;
  uint uVar4;
  undefined2 uVar5;
  
  if ((_DAT_00808848 & 2) != 0) {
    func_0x0002aa14();
  }
  func_0x0002a130();
  if ((_DAT_00808848 & 1) == 0) {
    if ((_DAT_00808848 & 2) == 0) {
      func_0x0002a558();
    }
    else {
      func_0x0002a590();
    }
  }
  else {
    func_0x0002a4e4();
  }
  uVar3 = (uint)_DAT_0080968a;
  if ((_DAT_00808890 & 0x10) == 0) {
    _DAT_0080a268 = 0;
  }
  else {
    iVar1 = func_0x0004e1a8(&Discovered_2D_Unknown_RAM_0xC5E4_0x5CC68);
    iVar1 = iVar1 << 2;
    _DAT_0080aaa6 = func_0x0004e1a8(&Discovered_2D_Unknown_RAM_0xC5FC_0x60EB4);
    func_0x0004e410(0x62b6e);
    _DAT_0080aaa8 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x60EC0);
    uVar2 = func_0x0004ddbc(_DAT_0080aaa6,_DAT_0080aaa8);
    func_0x0004dcf4(iVar1,0x80,uVar2);
    func_0x0004db80(_DAT_0080aaa4);
    _DAT_0080a268 = func_0x0004e500(0x1000);
    if ((uVar3 & 0xffff) < (uint)_DAT_0080a268) {
      uVar3 = (uint)_DAT_0080a268;
    }
  }
  _DAT_0080a266 = func_0x0004e1a8(&Discovered_2D_Unknown_RAM_0xC5E2_0x5CC54);
  if (((DAT_008088da & 2) != 0) && ((uVar3 & 0xffff) < ((uint)_DAT_0080a266 << 2 & 0xffff))) {
    uVar3 = (uint)_DAT_0080a266 << 2;
  }
  uVar4 = uVar3;
  if ((uVar3 & 0xffff) <= (uint)_DAT_008096cc) {
    uVar4 = (uint)_DAT_008096cc;
  }
  uVar5 = (undefined2)uVar4;
  func_0x0000ae38(0x809e20,uVar3);
  _DAT_008096be = uVar5;
  if ((DAT_00808846 & 0x20) != 0) {
    uVar3 = func_0x0004e500(uVar5,_DAT_00809688);
    uVar4 = func_0x0004e490(uMem00053d3c,4);
    if ((uVar4 & 0xffff) < (uVar3 & 0xffff)) {
      uVar2 = 0xfa;
    }
    else {
      uVar2 = func_0x0004e490(uMem00053d3c,2);
      uVar2 = func_0x0004dcf4(uVar3,0x7d,uVar2);
    }
    _DAT_0080a938 = func_0x0004dc38(uVar2,0,0xfa);
  }
  func_0x00000310();
  _DAT_008096e0 = _DAT_008096de;
  _DAT_008096ea = _DAT_008096e8;
  _DAT_008096ee = _DAT_008096ec;
  _DAT_008096c4 = _DAT_008096c2;
  _DAT_008096ca = _DAT_008096c8;
  _DAT_0080968c = _DAT_0080968a;
  _DAT_008096c0 = _DAT_008096be;
  if ((_DAT_00808848 & 2) != 0) {
    _DAT_008096d0 = _DAT_008096ce;
  }
  func_0x00000328();
  return;
}


