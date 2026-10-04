/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: delta_map_accel_filter_0x1a104
 * Address:  0x1A104
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void delta_map_accel_filter_0x1a104(void)

{
  int iVar1;
  int iVar2;
  undefined2 uVar4;
  undefined4 uVar3;
  undefined2 uVar5;
  byte bVar6;
  short sStack_6;
  
  if (cMem00063b20 == '\0') {
    _DAT_0080a83c = 0xff;
  }
  else {
    _DAT_0080a83c = func_0x0004e1a8(&Discovered_2D_Unknown_RAM_0xC5E2_0x5EF3A);
  }
  func_0x0004e410(0x62ef0);
  _DAT_0080a838 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5EC42);
  _DAT_0080a83a = func_0x0004e1a8(&Discovered_2D_Unknown_RAM_0xC5FC_0x5EC4C);
  func_0x00000310();
  uVar4 = _DAT_00809680;
  uVar5 = _DAT_0080967e;
  func_0x00000328();
  bVar6 = (byte)_DAT_00809660;
  if (((_DAT_0080952c & 1) == 0) || ((_DAT_00809530 & 1) == 0)) {
    func_0x0004e410(0x62e6e);
    _RAM_Boost_Error = uVar4;
    func_0x0004e410(0x62e96);
    iVar1 = func_0x0004e1a8(0x5ed4e);
    iVar1 = iVar1 << 1;
    iVar2 = func_0x0004e1a8(0x5ee44);
    sStack_6 = func_0x0004e0d4(iVar1,iVar2 << 1,_DAT_008095b8);
    func_0x0004e410(0x62eb8);
    func_0x0004e410(0x62ede);
    _DAT_0080a844 = func_0x0004e1a8(0x5ef4e);
    func_0x0004e410(0x62e6e);
    _RAM_Boost_Error = uVar5;
    func_0x0004e410(0x62e96);
    iVar1 = func_0x0004e1a8(0x5ed4e);
    iVar1 = iVar1 << 1;
    iVar2 = func_0x0004e1a8(0x5ee44);
    iVar1 = func_0x0004e0d4(iVar1,iVar2 << 1,_DAT_008095b8);
    func_0x0004e410(0x62eb8);
    func_0x0004e410(0x62ede);
  }
  else {
    func_0x0004e410(0x62e6e);
    _RAM_Boost_Error = uVar4;
    func_0x0004e410(0x62e96);
    sStack_6 = func_0x0004e1a8(0x5ec58);
    sStack_6 = sStack_6 << 1;
    func_0x0004e410(0x62eb8);
    func_0x0004e410(0x62ede);
    _DAT_0080a844 = func_0x0004e1a8(0x5ef4e);
    func_0x0004e410(0x62e6e);
    _RAM_Boost_Error = uVar5;
    func_0x0004e410(0x62e96);
    iVar1 = func_0x0004e1a8(0x5ec58);
    iVar1 = iVar1 << 1;
    func_0x0004e410(0x62eb8);
    func_0x0004e410(0x62ede);
  }
  _DAT_0080a842 = func_0x0004e1a8(0x5ef4e);
  if (((bVar6 & 8) == 0) && ((bVar6 & 4) == 0)) {
    func_0x0004e410(0x63472);
    func_0x0004e410(0x6348a);
    uVar3 = func_0x0004e1a8(0x60f02);
  }
  else {
    uVar3 = 0;
  }
  _DAT_0080a840 = func_0x0004e500(sStack_6,uVar3);
  _DAT_0080a83e = func_0x0004e500(iVar1,uVar3);
  return;
}


