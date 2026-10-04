/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: dfco_vss_rpm_hysteresis_0x1b56c
 * Address:  0x1B56C
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void dfco_vss_rpm_hysteresis_0x1b56c(void)

{
  _DAT_00808870 = 0x10;
  _DAT_0080889a = 0xffff;
  _DAT_008080fc = uMem0005428c;
  _DAT_008080fe = uMem00054302;
  _DAT_00808368 = uMem000547de;
  if (sMem00054988 == 0) {
    _DAT_00808106 = 1;
  }
  else {
    _DAT_00808106 = sMem00054988;
  }
  _DAT_008083b4 = uMem00054992;
  _DAT_008083b6 = uMem00054992;
  if ((_DAT_00808848 & 2) != 0) {
    func_0x0004e410(0x6283c);
    _DAT_0080a950 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5F736);
  }
  if ((_DAT_00808848 & 2) != 0) {
    _DAT_008080da = uMem00053ff6;
    _DAT_0080a7d4 = 0;
    _DAT_0080a7d6 = 0;
    _DAT_0080a7d8 = 0x8000;
  }
  _DAT_00808108 = uMem00054952;
  _DAT_0080aa6a = 0x3ff;
  _DAT_0080810a = func_0x0004e490(uMem00054aaa,2);
  _DAT_0080810c = func_0x0004e490(uMem00054ab0,2);
  _DAT_0080810e = func_0x0004e490(uMem00054ab2,2);
  _DAT_00808110 = func_0x0004e490(uMem00054ab4,2);
  _DAT_00808112 = uMem00054ab8;
  _DAT_0080808c = uMem00054b3e;
  _DAT_008083b8 = uMem00054be8;
  return;
}


