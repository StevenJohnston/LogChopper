/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: state_flag_routine_0x1ea14
 * Address:  0x1EA14
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void state_flag_routine_0x1ea14(void)

{
  if ((_DAT_00809528 & 1) == 0) {
    if ((ushort)(sMem000541c8 << 5) < _DAT_00809524) {
      _DAT_00809528 = _DAT_00809528 | 1;
    }
  }
  else if (_DAT_00809524 <= (ushort)(sMem000541ca << 5)) {
    _DAT_00809528 = _DAT_00809528 & 0xfffe;
  }
  if ((_DAT_00809528 & 1) == 0) {
    _DAT_008080fc = sMem0005428c;
  }
  if (((((_DAT_00809528 & 1) == 0) || (_DAT_008080fc != 0)) || (_DAT_00808686 < uMem00053c82)) ||
     ((_DAT_00808646 & 0x80) == 0)) {
    _DAT_00809528 = _DAT_00809528 & 0xfffd;
  }
  else {
    _DAT_00809528 = _DAT_00809528 | 2;
  }
  return;
}


