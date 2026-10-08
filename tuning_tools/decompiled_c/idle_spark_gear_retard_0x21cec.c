/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: idle_spark_gear_retard_0x21cec
 * Address:  0x21CEC
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void idle_spark_gear_retard_0x21cec(void)

{
  byte bVar1;
  undefined *puVar2;
  undefined2 uVar3;
  uint uVar4;
  ushort uVar5;
  ushort uVar6;
  
  uVar5 = _DAT_00808c56 & 7;
  if (uVar5 != 0) {
    if (uVar5 == 1) {
      uVar4 = 0;
    }
    else if (uVar5 == 2) {
      if ((_DAT_00808c58 & 0x60) == 0) {
        uVar4 = 1;
      }
      else {
        uVar4 = 2;
      }
    }
    else if ((_DAT_00808c58 & 0x60) == 0) {
      uVar4 = 3;
    }
    else {
      uVar4 = 4;
    }
    uVar6 = (ushort)(byte)(&Discovered_2D_Engine_RPM_0x57C4C)[uVar4];
    bVar1 = (&Discovered_2D_Engine_RPM_0x57C4C)[uVar4];
    uVar5 = (ushort)(byte)(&Discovered_2D_Engine_RPM_0x57C4C)[uVar4];
    func_0x0004e410(0x616b6);
    if ((uVar4 & 0xffff) == 0) {
      puVar2 = &Discovered_2D_Engine_RPM_0x56210;
    }
    else {
      puVar2 = &Discovered_2D_Engine_RPM_0x57C4C;
    }
    uVar3 = func_0x0004e1a8(puVar2);
    func_0x00000310();
    _DAT_00808a72 = uVar6;
    _DAT_00808b10 = uVar5;
    _DAT_00808b12 = (ushort)bVar1;
    func_0x00000328();
    _DAT_00808b14 = uVar3;
  }
  return;
}


