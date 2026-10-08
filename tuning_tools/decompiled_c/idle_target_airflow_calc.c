/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: idle_target_airflow_calc
 * Address:  0x27800
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


void idle_target_airflow_calc(undefined2 param_1)

{
  undefined2 *in_R4;
  
  *in_R4 = param_1;
  *(byte *)((int)in_R4 + 1) = *(byte *)((int)in_R4 + 1) | 0x10;
  func_0x00027750(uMem00053306);
  return;
}


