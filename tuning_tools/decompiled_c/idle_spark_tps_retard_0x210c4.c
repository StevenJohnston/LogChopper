/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: idle_spark_tps_retard_0x210c4
 * Address:  0x210C4
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void idle_spark_tps_retard_0x210c4(void)

{
  undefined4 uVar1;
  undefined4 uVar2;
  
  uVar2 = 0;
  if (_DAT_0080879e <= uMem00053c2e) {
    _RAM_Boost_Error = func_0x00020b88();
    func_0x0004e410(0x61eae);
    func_0x0004e410(0x61ec8);
    uVar2 = func_0x0004e1a8(0x572ee);
    uVar1 = func_0x0004e1a8(&Discovered_2D_Throttle_Position_TPS_Vehicle_Speed_0x57350);
    uVar2 = func_0x0004dd6c(uVar2,uVar1);
  }
  uVar1 = func_0x0004e500(0xff,_DAT_0080a272);
  func_0x0004de60(uVar2,uVar1);
  _DAT_00808a48 = func_0x0004db80(0x80);
  return;
}


