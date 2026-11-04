/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: func_0x3116c
 * Address:  0x3116C
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void func_0x3116c(uint param_1)

{
  undefined4 uVar1;
  
  if ((param_1 & 0xffff) < 0x105) {
    uVar1 = func_0x0004df48((&Low_Pulse_Width_IPW_Adder)[(param_1 & 0xffff) >> 2],2);
    param_1 = func_0x0004db80(param_1,uVar1);
  }
  func_0x0004db80(param_1,_DAT_0080897e);
  return;
}


