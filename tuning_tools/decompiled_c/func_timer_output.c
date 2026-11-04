/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: func_timer_output
 * Address:  0xDA40
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void func_timer_output(void)

{
  TOP05IST = TOP05IST & 0xc0;
  TOP05IMA = 0x3f;
  _TOPEEN = _TOPEEN & 0x7c0;
  if (_TOP05CR0 != 1) {
    _TOP05CR0 = 1;
  }
  if (TOP05CR1 != '\0') {
    TOP05CR1 = '\0';
  }
  func_0x00000328();
  return;
}


