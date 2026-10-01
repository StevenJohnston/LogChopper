/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: map_select_and_interpolate_3d
 * Address:  0x4E330
 * Description: 3D Map Table Pointer Selection and Dispatch
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void map_select_and_interpolate_3d(int param_1)

{
  table_interpolate_2d_and_3d(*(undefined4 *)(param_1 + (_DAT_00808852 & 7) * 4));
  return;
}


