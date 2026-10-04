/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: func_012350
 * Address:  0x12350
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined2 func_012350(int param_1)

{
  int in_R4;
  int in_R5;
  uint in_R8;
  ushort in_stack_0000002a;
  undefined2 in_stack_00000032;
  
  _DAT_00808dc2 =
       CONCAT11(*(undefined1 *)(in_R5 + in_R4 + 0x80ac63),*(undefined1 *)(in_R5 + in_R4 + 0x80ac62))
  ;
  _DAT_00808dc4 =
       CONCAT11(*(undefined1 *)(in_R5 + in_R4 + 0x80ac65),*(undefined1 *)(in_R5 + in_R4 + 0x80ac64))
  ;
  _DAT_00808dc6 =
       CONCAT11(*(undefined1 *)(in_R5 + in_R4 + 0x80ac67),*(undefined1 *)(in_R5 + in_R4 + 0x80ac66))
  ;
  _DAT_00808dc8 =
       CONCAT11(*(undefined1 *)(in_R5 + in_R4 + 0x80ac69),*(undefined1 *)(in_R5 + in_R4 + 0x80ac68))
  ;
  _DAT_00808dca =
       CONCAT11(*(undefined1 *)(in_R5 + in_R4 + 0x80ac6b),*(undefined1 *)(in_R5 + in_R4 + 0x80ac6a))
  ;
  _DAT_00808dcc =
       CONCAT11(*(undefined1 *)(in_R5 + in_R4 + 0x80ac6d),*(undefined1 *)(in_R5 + in_R4 + 0x80ac6c))
  ;
  _DAT_00808dce =
       CONCAT11(*(undefined1 *)(in_R5 + in_R4 + 0x80ac6f),*(undefined1 *)(in_R5 + in_R4 + 0x80ac6e))
  ;
  _DAT_00808dd0 =
       CONCAT11(*(undefined1 *)(in_R5 + in_R4 + 0x80ac71),*(undefined1 *)(in_R5 + in_R4 + 0x80ac70))
  ;
  _DAT_00808dd2 =
       CONCAT11(*(undefined1 *)(in_R5 + in_R4 + 0x80ac73),*(undefined1 *)(in_R5 + in_R4 + 0x80ac72))
  ;
  in_stack_0000002a = in_stack_0000002a | 0x10;
  *(undefined2 *)(param_1 * 2 + 0x80ac4a) = _DAT_00808fae;
  *(ushort *)((in_R8 & 0xffff) * 2 + 0x80ad52) = in_stack_0000002a;
  return in_stack_00000032;
}


