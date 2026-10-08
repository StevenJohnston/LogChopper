/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: func_04e500
 * Address:  0x4E500
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


int func_04e500(uint param_1,uint param_2)

{
  int iVar1;
  
  if ((param_1 & 0xffff) < (param_2 & 0xffff)) {
    iVar1 = 0;
  }
  else {
    iVar1 = (param_1 & 0xffff) - (param_2 & 0xffff);
  }
  return iVar1;
}


