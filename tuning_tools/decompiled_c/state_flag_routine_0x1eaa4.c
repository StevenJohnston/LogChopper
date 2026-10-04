/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: state_flag_routine_0x1eaa4
 * Address:  0x1EAA4
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void state_flag_routine_0x1eaa4(void)

{
  if ((DAT_00809528 & 1) == 0) {
    if ((ushort)(sMem000542ae << 5) < _DAT_00809526) {
      DAT_00809528 = DAT_00809528 | 1;
    }
  }
  else if (_DAT_00809526 <= (ushort)(sMem000542b0 << 5)) {
    DAT_00809528 = DAT_00809528 & 0xfe;
  }
  if ((DAT_00809528 & 1) == 0) {
    _DAT_008080fe = sMem00054302;
  }
  if (((((DAT_00809528 & 1) == 0) || (_DAT_008080fe != 0)) || (_DAT_00808686 < uMem000542b2)) ||
     ((_DAT_00808646 & 0x80) == 0)) {
    DAT_00809528 = DAT_00809528 & 0xfd;
  }
  else {
    DAT_00809528 = DAT_00809528 | 2;
  }
  return;
}


