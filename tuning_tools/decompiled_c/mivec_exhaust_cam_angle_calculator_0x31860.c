/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: mivec_exhaust_cam_angle_calculator_0x31860
 * Address:  0x31860
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void mivec_exhaust_cam_angle_calculator_0x31860(ushort param_1,ushort param_2)

{
  _DAT_00808a18 = param_2;
  if (param_2 <= param_1) {
    _DAT_00808a18 = param_1;
  }
  _DAT_008089fc = _DAT_008089fa;
  _DAT_008089fa = _DAT_008089f8;
  _DAT_008089f8 = _DAT_008089f6;
  _DAT_008089f6 = _DAT_008089f4;
  _DAT_008089f4 = _DAT_008089f2;
  _DAT_008089f2 = _DAT_008089f0;
  _DAT_008089f0 = func_0x0004e01c(_DAT_00808a18,_DAT_00808a0c,_DAT_008089ec);
  _DAT_00808a0a = _DAT_00808a08;
  _DAT_00808a08 = _DAT_00808a06;
  _DAT_00808a06 = _DAT_00808a04;
  _DAT_00808a04 = _DAT_00808a02;
  _DAT_00808a02 = _DAT_00808a00;
  _DAT_00808a00 = _DAT_008089fe;
  _DAT_008089fe = func_0x0004e01c(_DAT_00808a18,_DAT_00808a0e,_DAT_008089ee);
  return;
}


