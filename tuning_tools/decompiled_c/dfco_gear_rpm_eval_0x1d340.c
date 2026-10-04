/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: dfco_gear_rpm_eval_0x1d340
 * Address:  0x1D340
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void dfco_gear_rpm_eval_0x1d340(void)

{
  uint uVar1;
  undefined *puVar2;
  uint uVar3;
  
  func_0x0004e410(0x6161c);
  if (cMem00050394 == '\0') {
    uVar1 = (uint)_DAT_0080874a;
  }
  else {
    uVar1 = func_0x0004df9c(_DAT_00809602,4);
  }
  if ((_DAT_00808646 & 0x20) == 0) {
    puVar2 = &Discovered_2D_Engine_RPM_0x55606;
  }
  else {
    puVar2 = &Discovered_2D_Engine_RPM_0x555EE;
  }
  uVar3 = func_0x0004e1a8(puVar2);
  if ((DAT_0080887e & 1) == 0) {
    if ((uVar3 & 0xffff) < (uVar1 & 0xffff)) {
      DAT_0080887e = DAT_0080887e | 1;
    }
  }
  else {
    uVar3 = func_0x0004e500(uMem00053098);
    if ((uVar1 & 0xffff) <= (uVar3 & 0xffff)) {
      DAT_0080887e = DAT_0080887e & 0xfe;
    }
  }
  return;
}


