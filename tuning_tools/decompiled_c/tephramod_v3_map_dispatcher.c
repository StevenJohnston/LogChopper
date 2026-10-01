/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: tephramod_v3_map_dispatcher
 * Address:  0xFB000
 * Description: TephraMOD v3 Live Tuning & Alternate Map Selector
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void tephramod_v3_map_dispatcher(void)

{
  _DAT_0080501e = _Fuel_Injector_Scaling;
  _DAT_00805020 = 0x55020;
  _DAT_00805024 = 0x55950;
  _DAT_00805028 = 0x58d42;
  _DAT_0080502c = 0x57380;
  _DAT_00805038 = 0x58e96;
  _DAT_0080503c = 0x5742a;
  _DAT_00805040 = 0x57bd2;
  _DAT_00805044 = 0x5ddfc;
  _DAT_00805048 = 0x5e1fc;
  _DAT_0080504c = _Rev_Limiter;
  _DAT_0080504e = uMem00053064;
  _DAT_00805050 = 0x556cc;
  _DAT_00805054 = &MAF_Scaling_Part_1;
  _DAT_00805058 = 0x608a4;
  _DAT_0080505c = 0x5770c;
  DAT_00805000 = DAT_00805000 & 0x20;
  _DAT_00805004 = 0x10;
  _DAT_00808774 = 0x96;
  _DAT_00808776 = 600;
  _DAT_00808770 = 0x80;
  _DAT_00808772 = 0x200;
  _DAT_00805070 = 3000;
  _DAT_00805002 = 0;
  _DAT_00805006 = 0;
  DAT_0080501a = 0;
  _DAT_00805072 = 0;
  return;
}


