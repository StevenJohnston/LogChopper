/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: map_tables_evaluator_3d
 * Address:  0x1A7D8
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void map_tables_evaluator_3d(void)

{
  undefined2 uVar1;
  undefined2 uVar2;
  undefined2 uVar3;
  
  _DAT_0080a8ea = _DAT_00808768;
  _DAT_0080a8ec = _RAM_Manifold_Absolute_Pressure_MAP;
  func_0x0004e410(0x63418);
  func_0x0004e410(0x63444);
  uVar1 = func_0x0004e278(_DAT_00805058);
  uVar2 = func_0x0004e278(0x605a2);
  uVar3 = func_0x0004e278(0x602a0);
  func_0x00000310();
  _DAT_0080a8fc = uVar3;
  _DAT_0080a8fe = uVar2;
  _DAT_0080a900 = uVar1;
  func_0x00000328();
  func_0x00000310();
  if (((((_DAT_0080879e < uMem000546d4) ||
        (_DAT_0080875c < _Load_multiplier_end_when_TPS_decreased_by_hysteresis)) ||
       (_DAT_00808734 < uMem000546d8)) || ((_DAT_00808854 & 0x448) != 0)) ||
     ((((_DAT_00808848 & 2) != 0 && (uMem00054b36 <= _DAT_0080aace)) &&
      ((_DAT_008096e8 & 0xa000) == 0xa000)))) {
    _DAT_0080a8f4 = _DAT_0080a8f4 & 0xfffd;
  }
  else {
    _DAT_0080a8f4 = _DAT_0080a8f4 | 2;
    _DAT_0080a8fa = sMem000546dc;
  }
  if ((_DAT_00808758 < uMem000546da) && (((_DAT_0080a8f4 & 2) != 0 || (_DAT_0080a8fa != 0)))) {
    if ((_DAT_0080a8f4 & 2) != 0) {
      _DAT_0080a8f4 = _DAT_0080a8f4 | 1;
    }
  }
  else {
    _DAT_0080a8f4 = _DAT_0080a8f4 & 0xfffe;
  }
  func_0x00000328();
  return;
}


