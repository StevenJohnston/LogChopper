/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: fuel_trim_accumulator_0x2248c
 * Address:  0x2248C
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void fuel_trim_accumulator_0x2248c(void)

{
  short sVar2;
  uint uVar1;
  ushort uVar3;
  
  if ((_DAT_00808870 & 0x11) == 0) {
    if ((_DAT_00808868 & 1) != 0) {
      sVar2 = 1;
      if (sMem0005496a != 0) {
        sVar2 = sMem0005496a;
      }
      _DAT_0080aa2e = func_0x0004e500(_DAT_0080aa2e,sVar2);
    }
  }
  else {
    _DAT_0080aa2e = 0xffff;
  }
  func_0x0004e410(0x6220e);
  _DAT_0080aa30 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x60BFA);
  uVar1 = func_0x0004e500(0xff,_DAT_0080a272);
  func_0x0004e4a4(_DAT_0080aa2e,_DAT_0080aa30);
  func_0x0004e4b0(uVar1 & 0xffff);
  func_0x0004dff4(0xfe01);
  func_0x0004dfc0(0x101);
  _DAT_0080aa2c = func_0x0004dc14();
  _RAM_Boost_Error = func_0x00020b88();
  func_0x0004e410(0x617fc);
  func_0x0004e410(0x61830);
  _DAT_0080aa2a = func_0x0004e1a8(0x60c06);
  uVar3 = func_0x0004e500(_DAT_00804520,_DAT_0080868c);
  if (uMem0005496c < uVar3) {
    DAT_00808a34 = DAT_00808a34 | 0x80;
  }
  else {
    DAT_00808a34 = DAT_00808a34 & 0x7f;
  }
  return;
}


