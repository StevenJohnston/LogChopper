/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: injector_pulse_width_calc
 * Address:  0x24924
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void injector_pulse_width_calc(void)

{
  if ((_DAT_008088d6 & 0x28) != 0) {
    func_0x00000310();
    _DAT_008088ce = 0;
    _DAT_008088cc = 0;
    _DAT_0080ab82 = 0;
    _RAM_Injector_Pulse_Width_IPW = 0;
    func_0x00000328();
  }
  return;
}


