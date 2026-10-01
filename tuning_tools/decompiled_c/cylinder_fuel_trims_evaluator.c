/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: cylinder_fuel_trims_evaluator
 * Address:  0x22B80
 * Description: Individual Per-Cylinder Fuel Trims Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void cylinder_fuel_trims_evaluator(void)

{
  func_0x0004e410();
  _DAT_0080a31e = table_interpolate_2d_and_3d(0x57e02);
  _DAT_0080a320 = table_interpolate_2d_and_3d(0x57fec);
  _DAT_0080a322 = table_interpolate_2d_and_3d(0x581d6);
  _DAT_0080a324 = table_interpolate_2d_and_3d(0x583c0);
  return;
}


