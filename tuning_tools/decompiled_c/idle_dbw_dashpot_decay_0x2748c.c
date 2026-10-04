/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: idle_dbw_dashpot_decay_0x2748c
 * Address:  0x2748C
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void idle_dbw_dashpot_decay_0x2748c(void)

{
  undefined4 uVar1;
  uint uVar2;
  uint uVar3;
  
  uVar1 = func_0x0004de60(_DAT_00808b44,1000);
  func_0x0004e4a4(uMem0005444a,uVar1);
  uVar2 = func_0x0004ddd4(uMem0005444c);
  func_0x0004e4a4(_DAT_0080a5f6,0x300c);
  uVar3 = func_0x0004de7c(1000);
  if (uVar2 == 0) {
    _DAT_0080a5f0 = 0xffff;
  }
  else {
    _DAT_0080a5f0 = func_0x0004dc28(uVar3 / uVar2);
  }
  _RAM_Boost_Error = func_0x0004df68((uint)_DAT_0080a5f0 << 0xf,_DAT_00808734);
  _DAT_0080a5f2 = _RAM_Boost_Error;
  func_0x0004e410(0x62742);
  _DAT_0080a5ee = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5C9BE);
  return;
}


