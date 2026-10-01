/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: imap_calc_evaluator
 * Address:  0x155E0
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void imap_calc_evaluator(void)

{
  undefined2 uVar1;
  undefined4 uVar2;
  uint uVar3;
  ushort uVar8;
  undefined4 uVar4;
  undefined4 uVar5;
  ushort uVar9;
  int iVar6;
  int iVar7;
  undefined2 uVar10;
  undefined2 uVar11;
  
  func_0x0004e410(0x620d4);
  uVar2 = func_0x0004e278(0x5767e);
  uVar1 = uMem00053cae;
  uVar3 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x576E6);
  uVar8 = func_0x0004e500(uMem00053cbe);
  func_0x00000310();
  uVar10 = _RAM_InVVT_Actual;
  uVar11 = _RAM_ExVVT_Actual;
  func_0x00000328();
  _RAM_Boost_Error = _DAT_00808796;
  func_0x0004e410(0x62108);
  _RAM_Boost_Error = uVar10;
  func_0x0004e410(0x6213c);
  uVar4 = func_0x0004e278(0x5e6c2);
  _RAM_Boost_Error = uVar11;
  func_0x0004e410(0x6214c);
  uVar5 = func_0x0004e1a8(0x5e7b2);
  uVar4 = func_0x0004ddbc(uVar4,uVar5);
  if ((_DAT_0080887c & 0x20) == 0) {
    uVar9 = func_0x0004db80(uMem0005375a,uMem0005375c);
    if (uVar9 < _DAT_00808734) {
      _DAT_0080887c = _DAT_0080887c | 0x20;
    }
  }
  else if (_DAT_00808734 <= uMem0005375a) {
    _DAT_0080887c = _DAT_0080887c & 0xffdf;
  }
  func_0x0004e410(0x6215c);
  if ((_DAT_0080887c & 0x20) == 0) {
    uVar5 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x57702);
    iVar6 = func_0x0004e1a8(&Discovered_2D_Unknown_RAM_0xC5FC_0x5500C);
    iVar7 = func_0x0004e1a8(&Discovered_2D_Throttle_Position_TPS_Vehicle_Speed_0x55000);
    func_0x0004dcf4(uVar2,iVar6 * iVar7,0x4000);
    _DAT_00808fee = func_0x0004ddbc(uVar5);
  }
  else {
    iVar6 = func_0x0004e1a8(&Discovered_2D_Unknown_RAM_0xC5FC_0x5500C);
    iVar7 = func_0x0004e1a8(&Discovered_2D_Throttle_Position_TPS_Vehicle_Speed_0x55000);
    _DAT_00808fee = func_0x0004dcf4(uVar2,iVar6 * iVar7,0x4000);
  }
  if ((_DAT_0080887c & 0x40) == 0) {
    if ((uVar3 & 0xffff) < (uint)_DAT_0080874a) {
      _DAT_0080887c = _DAT_0080887c | 0x40;
    }
  }
  else if (_DAT_0080874a <= uVar8) {
    _DAT_0080887c = _DAT_0080887c & 0xffbf;
  }
  func_0x0004e410(0x6215c);
  uVar2 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x57702);
  iVar6 = func_0x0004e1a8(&Discovered_2D_Unknown_RAM_0xC5FC_0x5500C);
  iVar7 = func_0x0004e1a8(&Discovered_2D_Throttle_Position_TPS_Vehicle_Speed_0x55000);
  iVar6 = iVar6 * iVar7;
  func_0x000aa078(uVar4);
  func_0x0004dcf4(iVar6,0x4000);
  _DAT_00808808 = func_0x0004ddbc(uVar2);
  _DAT_00808810 = uVar1;
  uVar2 = func_0x0004e1a8(&Discovered_2D_Throttle_Position_TPS_Vehicle_Speed_0x55000);
  func_0x0004e1a8(&Discovered_2D_Unknown_RAM_0xC5FC_0x5500C);
  uVar2 = func_0x0004ddbc(uVar2);
  uVar4 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x611A2);
  uVar2 = func_0x0004ddbc(uVar2,uVar4);
  _DAT_0080a906 = (undefined2)uVar2;
  func_0x0004e500(0x100,uMem0005494c);
  _DAT_0080a904 = func_0x0004ddbc(uVar2);
  return;
}


