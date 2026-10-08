/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: decel_fuel_cut_subsystem
 * Address:  0x1B6A4
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void decel_fuel_cut_subsystem(void)

{
  func_0x0001b770();
  func_0x0001b7a4();
  func_0x0001b7d0();
  func_0x0001b828();
  func_0x0001b830();
  func_0x0001b89c();
  func_0x0001b8dc();
  func_0x0001b948();
  func_0x0001b96c();
  func_0x0001baf0();
  func_0x0001bafc();
  func_0x0001bb04();
  func_0x0001bd84();
  func_0x0001be5c();
  func_0x0001bea4();
  func_0x0001bf08();
  func_0x0001f148();
  func_0x0001bf10();
  func_0x0001c10c();
  if ((_DAT_00808844 & 2) != 0) {
    func_0x0001df7c();
  }
  func_0x0001ebb8();
  func_0x0001e9ec();
  func_0x00000310();
  _DAT_00809524 = _DAT_00809520;
  _DAT_00809526 = _DAT_00809522;
  func_0x00000328();
  func_0x0001ea14();
  func_0x0001eaa4();
  if ((_DAT_00808848 & 2) != 0) {
    func_0x0001f5b4();
    func_0x0001f65c();
  }
  func_0x0001eb34();
  func_0x0001ec84();
  func_0x0001f00c();
  if ((_DAT_0080a316 & 1) == 0) {
    func_0x00000310();
    DAT_0080a30a = DAT_0080a30a & 0xef;
  }
  else {
    func_0x00000310();
    DAT_0080a30a = DAT_0080a30a | 0x10;
  }
  func_0x00000328();
  func_0x0001be34();
  func_0x0001f8a4();
  return;
}


