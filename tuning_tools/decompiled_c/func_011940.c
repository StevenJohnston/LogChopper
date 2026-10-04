/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: func_011940
 * Address:  0x11940
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void func_011940(byte param_1)

{
  int iVar1;
  uint in_R8;
  int in_R9;
  short in_stack_00000022;
  ushort in_stack_00000024;
  
  if ((param_1 & 1) != 0) {
    _DAT_00808dc0 = *(undefined2 *)(in_R9 + 2);
    _DAT_00808dc2 = *(undefined2 *)(in_R9 + 4);
    _DAT_00808dc4 = *(undefined2 *)(in_R9 + 6);
    _DAT_00808dc6 = *(undefined2 *)(in_R9 + 8);
    _DAT_00808dc8 = *(undefined2 *)(in_R9 + 10);
    _DAT_00808dca = *(undefined2 *)(in_R9 + 0xc);
    _DAT_00808dcc = *(undefined2 *)(in_R9 + 0xe);
    _DAT_00808dce = *(undefined2 *)(in_R9 + 0x10);
    _DAT_00808dd0 = *(undefined2 *)(in_R9 + 0x12);
    _DAT_00808dd2 = *(undefined2 *)(in_R9 + 0x14);
  }
  in_stack_00000024 = in_stack_00000024 | 0x800;
  *(undefined2 *)((in_R8 & 0xffff) * 2 + 0x80ac4a) = _DAT_00808fae;
  if (in_stack_00000022 != 0) {
    iVar1 = (in_R8 & 0xffff) * 2;
    *(ushort *)(iVar1 + 0x80ad50) = in_stack_00000024;
    if (in_stack_00000024 == 0) {
      *(undefined2 *)(iVar1 + 0x80ad52) = 0;
    }
  }
  return;
}


