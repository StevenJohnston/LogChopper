/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: transient_tps_fuel_switch_0x23cf0
 * Address:  0x23CF0
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


void transient_tps_fuel_switch_0x23cf0(int param_1)

{
  uint uVar1;
  short sVar2;
  
  uVar1 = func_0x0004e1a8(&Discovered_2D_Throttle_Position_TPS_Vehicle_Speed_0x57072);
  sVar2 = func_0x0004e1a8(&Discovered_2D_Throttle_Position_TPS_Vehicle_Speed_0x57066);
  if ((**(byte **)(param_1 + 0xc) & 0x40) != 0) {
    sVar2 = sMem000530a6;
  }
  if ((cMem00050390 == '\x02') && ((DAT_00808888 & 0x20) != 0)) {
    uVar1 = (uint)uMem00054566;
  }
  **(undefined2 **)(param_1 + 0x84) = (short)(uVar1 << 8);
  **(short **)(param_1 + 0x88) = sVar2 << 8;
  return;
}


