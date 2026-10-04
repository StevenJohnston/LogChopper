/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: decel_cut_pulse_generator_0x2459c
 * Address:  0x2459C
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void decel_cut_pulse_generator_0x2459c(void)

{
  undefined4 uVar1;
  int iVar2;
  
  if (((_DAT_00809630 & 0x80) == 0) && ((_DAT_00809660 & 8) == 0)) {
    _RAM_Boost_Error = _DAT_0080967a;
  }
  else {
    _RAM_Boost_Error = _DAT_0080874a;
  }
  func_0x0004e410(0x6255e);
  func_0x0004e410(0x62580);
  func_0x0004e1a8(0x5a5ee);
  _DAT_0080898c = func_0x000aa014();
  uVar1 = func_0x0004ded0((uint)_DAT_0080898c * (uint)uMem00053010);
  iVar2 = func_0x0004e1a8(&Discovered_2D_Unknown_RAM_0xC5FC_0x5500C);
  func_0x0004dca8(uVar1,(uint)_DAT_00808936 * iVar2,0x8000);
  func_0x0004de28(_DAT_00808938);
  func_0x0004de28((uint)_DAT_00808974 * 2 + 0x80);
  _DAT_00808982 = func_0x0004def8();
  return;
}


