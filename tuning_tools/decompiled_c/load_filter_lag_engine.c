/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: load_filter_lag_engine
 * Address:  0x4E050
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


int load_filter_lag_engine(uint param_1,uint param_2,uint param_3)

{
  uint uVar1;
  uint uVar2;
  uint uVar3;
  uint uVar4;
  uint uVar5;
  uint uVar6;
  
  param_3 = param_3 & 0xffff;
  if (0xff < param_3) {
    param_3 = 0x100;
  }
  uVar3 = (param_1 & 0xffff) * param_3;
  uVar1 = (param_1 >> 0x10) * param_3 + (uVar3 >> 0x10);
  uVar4 = (param_2 & 0xffff) * (0x100 - param_3);
  uVar2 = (param_2 >> 0x10) * (0x100 - param_3) + (uVar4 >> 0x10);
  uVar5 = (uVar4 & 0xffff) + (uVar3 & 0xffff);
  uVar6 = uVar5 >> 0x10;
  uVar3 = uVar2 + uVar6;
  uVar4 = uVar2 + uVar6 + (uint)(CARRY4(uVar2,uVar6) || CARRY4(uVar3,uVar3));
  if (!CARRY4(uVar2,uVar6) && !CARRY4(uVar3,uVar3)) {
    uVar3 = uVar4 + uVar1;
    uVar2 = uVar4 + uVar1 + (uint)(CARRY4(uVar4,uVar1) || CARRY4(uVar3,uVar3));
    if ((!CARRY4(uVar4,uVar1) && !CARRY4(uVar3,uVar3)) && (uVar2 >> 8 < 0x10000)) {
      return uVar2 * 0x100 + ((uVar5 & 0xffff) >> 8);
    }
  }
  return -1;
}


