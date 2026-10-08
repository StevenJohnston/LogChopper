/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: dfco_load_threshold_eval_0x1afb4
 * Address:  0x1AFB4
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void dfco_load_threshold_eval_0x1afb4(undefined4 param_1,undefined4 param_2)

{
  undefined4 uVar1;
  uint uVar2;
  undefined2 uVar3;
  undefined4 uVar4;
  byte bVar5;
  
  bVar5 = (byte)_DAT_00809660;
  if (((_DAT_0080952c & 1) == 0) || ((_DAT_00809530 & 1) == 0)) {
    uVar2 = func_0x0004f044(0x593c8,param_2,param_1);
    uVar3 = (undefined2)param_2;
    uVar2 = uVar2 & 0xff;
    _RAM_Boost_Error = (undefined2)param_1;
    func_0x0004e410(0x61d2c);
    _RAM_Boost_Error = uVar3;
    func_0x0004e410(0x61c7a);
    uVar1 = func_0x0004e1a8(0x594e0);
    uVar1 = func_0x0004e0d4(uVar2,uVar1,_DAT_008095b8);
  }
  else {
    _RAM_Boost_Error = (undefined2)param_1;
    func_0x0004e410(0x61d2c);
    _RAM_Boost_Error = (undefined2)param_2;
    func_0x0004e410(0x61c7a);
    uVar1 = func_0x0004e1a8(0x592ae);
  }
  uVar3 = func_0x0004e1a8(&Discovered_2D_Unknown_RAM_0xC5E2_0x60EEE);
  if (((bVar5 & 8) == 0) && ((bVar5 & 4) == 0)) {
    func_0x0004e410(0x63472);
    func_0x0004e410(0x6348a);
    uVar4 = func_0x0004e1a8(0x60f02);
  }
  else {
    uVar4 = 0;
  }
  uVar4 = func_0x0004dcf4(uVar4,uVar3,300);
  func_0x0004e500(uVar1,uVar4);
  return;
}


