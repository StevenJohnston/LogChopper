/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: tephramod_load_dispatcher
 * Address:  0xFBA70
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

uint tephramod_load_dispatcher(uint param_1)

{
  uint uVar1;
  
  uVar1 = param_1;
  if (((DAT_00805000 & 0x40) != 0) &&
     (uVar1 = (uint)_Max_TPS_when_seeing_High_Knock, param_1 <= _Max_TPS_when_seeing_High_Knock)) {
    uVar1 = param_1;
  }
  return uVar1;
}


