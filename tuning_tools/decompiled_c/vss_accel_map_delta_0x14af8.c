/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: vss_accel_map_delta_0x14af8
 * Address:  0x14AF8
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void vss_accel_map_delta_0x14af8(void)

{
  if ((_DAT_0080869a < uMem00053548) || (uMem00053546 < _DAT_0080869a)) {
    DAT_00808855 = DAT_00808855 | 2;
  }
  else {
    DAT_00808855 = DAT_00808855 & 0xfd;
  }
  if ((_DAT_0080869c < uMem000546e4) || (uMem000546e2 < _DAT_0080869c)) {
    DAT_00808856 = DAT_00808856 | 2;
  }
  else {
    DAT_00808856 = DAT_00808856 & 0xfd;
  }
  func_0x00014bac();
  _DAT_0080ab3a = func_0x0004ef7c(0x5efcc,_DAT_008086a2);
  _DAT_0080ab3a = _DAT_0080ab3a & 0xff;
  func_0x0004e410(0x619fe);
  _DAT_00808932 = func_0x0004e1a8(&Discovered_2D_Unknown_RAM_0xC5FC_0x556A4);
  _DAT_00808934 = func_0x0004e1a8(&Discovered_2D_Unknown_RAM_0xC5FC_0x50402);
  if ((_DAT_008080b8 == 0) && ((DAT_00808886 & 4) != 0)) {
    _DAT_00804524 = _DAT_008086a2;
  }
  func_0x000197f4();
  return;
}


