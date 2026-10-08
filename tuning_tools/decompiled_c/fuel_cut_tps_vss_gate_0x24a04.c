/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: fuel_cut_tps_vss_gate_0x24a04
 * Address:  0x24A04
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void fuel_cut_tps_vss_gate_0x24a04(void)

{
  ushort uVar1;
  uint uVar2;
  undefined4 uVar3;
  int iVar4;
  uint uVar5;
  
  uVar5 = 0;
  if ((_DAT_00808870 & 1) != 0) {
    _DAT_008089ba = func_0x0004e1a8(&Discovered_2D_Throttle_Position_TPS_Vehicle_Speed_0x55832);
    _DAT_008089c2 = func_0x0004e1a8(&Discovered_2D_Throttle_Position_TPS_Vehicle_Speed_0x571D8);
  }
  uVar1 = _DAT_008089ba;
  if ((_DAT_00809358 & 4) == 0) {
    uVar1 = _DAT_008089c2;
  }
  if ((uint)_DAT_0080800c < (uint)uVar1 * 0x50) {
    _DAT_00808870 = _DAT_00808870 | 0x2000;
  }
  else {
    _DAT_00808870 = _DAT_00808870 & 0xdfff;
  }
  if ((_DAT_00808646 & 0x40) == 0) {
    uVar5 = 0x80;
    if ((_DAT_00808870 & 0x2000) != 0) {
      uVar5 = (uint)uMem000530f0;
    }
    uVar2 = (uint)_DAT_00808928;
    func_0x0004e410(0x5d588);
    uVar3 = func_0x0004e1a8(0x5a43e);
    uVar3 = func_0x0004ddd4(uVar2,uVar3);
    iVar4 = func_0x0004e1a8(0x55786);
    func_0x0004dd1c(uVar3,uVar5 * iVar4,(uint)uMem000530ee << 7);
    uVar5 = func_0x0004dc28();
    uVar5 = uVar5 & 0xffff;
  }
  _DAT_0080899c = uVar5;
  _DAT_008089a2 = func_0x0004e1a8(0x5579e);
  func_0x0004e1a8(0x5583e);
  _DAT_00808994 = func_0x0004e490(0x66);
  _DAT_00808998 = (short)(((uint)uMem000530e6 * (uint)uMem0005300e >> 3) + 1 >> 1);
  if ((uMem000531c0 < _DAT_00808686) && ((_DAT_00808646 & 0x80) == 0)) {
    _DAT_00808120 = uMem000531c2;
  }
  _DAT_008089b0 = uMem000530f4;
  return;
}


