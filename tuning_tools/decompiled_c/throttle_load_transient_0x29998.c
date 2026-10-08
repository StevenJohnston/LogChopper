/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: throttle_load_transient_0x29998
 * Address:  0x29998
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void throttle_load_transient_0x29998(void)

{
  undefined4 uVar1;
  undefined4 uVar2;
  
  uVar1 = func_0x0004db80(_DAT_008094fe,_DAT_00809506);
  _RAM_Boost_Error = _DAT_008087e0;
  func_0x0004e410(0x62af4);
  uVar2 = func_0x0004e1a8(&Discovered_2D_Engine_Load_0x5C352);
  uVar1 = func_0x0004de60(uVar1,uVar2);
  func_0x0004db80(_DAT_0080a55c,uVar1);
  _RAM_Boost_Error = func_0x0004db80(_DAT_00809504);
  func_0x0004e410(0x62994);
  func_0x0004e410(0x629b8);
  _DAT_0080a55e = func_0x0004e278(0x5c364);
  return;
}


