/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: throttle_caller_025a00
 * Address:  0x25A00
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void throttle_caller_025a00(void)

{
  short sVar1;
  
  func_0x00029f50();
  func_0x00027928();
  sVar1 = func_0x000aa21c();
  if ((sVar1 != 0) && ((_DAT_008045bc & 0xb0) == 0)) {
    _DAT_00808b50 = _DAT_00808dc2;
    _DAT_00808b4c = func_0x00026ca0(_DAT_00808dc2);
    _DAT_00808b52 = _DAT_00808dc2;
    _DAT_00808b4e = func_0x00026ca0(_DAT_00808dc2);
    _DAT_008045bc = _DAT_008045bc & 0xffc0;
    _DAT_00808b16 = _DAT_00808b16 & 0xff4a;
  }
  func_0x00029420();
  func_0x00029490();
  func_0x000294ac();
  if ((_DAT_00808848 & 3) == 0) {
    _DAT_00809a02 = _DAT_00809a00;
    func_0x00000310();
    _DAT_00809a00 = _DAT_00808c56 & 7;
    func_0x00000328();
  }
  else {
    _DAT_00809a02 = 0;
    _DAT_00809a00 = 0;
  }
  func_0x0002b4cc();
  if ((cMem00050385 != '\0') && ((_DAT_00808848 & 1) != 0)) {
    func_0x00029998();
  }
  _DAT_00808b38 = func_0x0002b188(_DAT_00808b24);
  _DAT_00808b3a = func_0x0002b188(_DAT_00808b28);
  _DAT_00808b3c = func_0x0002b188(_DAT_00808b2c);
  _DAT_00808b3e = func_0x0002b188(_DAT_008045a4);
  _DAT_00808b40 = func_0x0002b188(_DAT_008045a8);
  _DAT_00808b42 = func_0x0002b188(_DAT_008045ac);
  return;
}


