/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: axis_breakpoint_lookup
 * Address:  0x68000
 * Description: Universal 1D Axis Binary Search & Breakpoint Interpolator
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


uint axis_breakpoint_lookup(ushort *param_1,ushort *param_2,uint param_3)

{
  ushort *puVar1;
  ushort in_R3;
  
  if (in_R3 <= *param_1) {
    return (uint)*param_2;
  }
  if (in_R3 < param_1[param_3 & 0xff]) {
    while (puVar1 = param_1 + 1, *puVar1 < in_R3) {
      param_2 = param_2 + 1;
      param_1 = puVar1;
    }
    return ((uint)(ushort)(*puVar1 - in_R3) * (uint)*param_2 +
           (uint)(ushort)-(*param_1 - in_R3) * (uint)param_2[1]) /
           (uint)(ushort)(-(*param_1 - in_R3) + (*puVar1 - in_R3));
  }
  return (uint)param_2[param_3 & 0xff];
}


