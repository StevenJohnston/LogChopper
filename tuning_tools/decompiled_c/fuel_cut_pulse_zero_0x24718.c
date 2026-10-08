/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: fuel_cut_pulse_zero_0x24718
 * Address:  0x24718
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void fuel_cut_pulse_zero_0x24718(void)

{
  if ((_DAT_00808870 & 0x10) != 0) {
    func_0x00000310();
    _DAT_00808988 = 0;
    _DAT_0080898a = 0;
    func_0x00000328();
  }
  func_0x0004e410(0x61670);
  func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5571A);
  return;
}


