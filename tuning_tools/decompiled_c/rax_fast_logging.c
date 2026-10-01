/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: rax_fast_logging
 * Address:  0xD0200
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */
/* RAX Fast Logging: Subroutine [Parameter/1D] () */

undefined4 rax_fast_logging(void)

{
  int *piVar1;
  
  _RAM_RAX_B_Dat =
       *(ushort *)(*(int *)(_RAX_Fast_Logging_Data + 0x70) + 0xbU & 0xfffffe) / 5 << 0x18 |
       (*(ushort *)(*(uint *)(_RAX_Fast_Logging_Data + 0xa4) & 0xfffffe) / 100 & 0xff) << 0x10 |
       (uint)**(byte **)(_RAX_Fast_Logging_Data + 200) << 8 |
       (uint)**(byte **)(_RAX_Fast_Logging_Data + 0xf0);
  _RAM_RAX_A_Dat =
       (uint)**(byte **)(_RAX_Fast_Logging_Data + 0x3c) << 0x18 |
       (uint)**(byte **)(_RAX_Fast_Logging_Data + 0x140) << 0x10 |
       (uint)**(byte **)(_RAX_Fast_Logging_Data + 0x30) << 8 |
       (uint)**(byte **)(_RAX_Fast_Logging_Data + 0x34);
  _RAM_RAX_C_Dat =
       *(ushort *)(*(int *)(_RAX_Fast_Logging_Data + 0x70) + 0x11U & 0xfffffe) / 5 << 0x18 |
       (**(byte **)(_RAX_Fast_Logging_Data + 0x18) & 0x7f) << 0x11 |
       (**(byte **)(_RAX_Fast_Logging_Data + 0x98) & 0x3f) << 0xb |
       *(ushort *)(*(int *)(_RAX_Fast_Logging_Data + 0x70) - 0x1dU & 0xfffffe) >> 1 & 0x7ff;
  _RAM_RAX_D_Dat =
       (uint)(*(ushort *)(*(int *)(_RAX_Fast_Logging_Data + 0xe0) + 1U & 0xfffffe) >> 1) << 0x17 |
       (**(byte **)(_RAX_Fast_Logging_Data + 0x230) - 0x5a & 0x7f) << 0x10 |
       (uint)**(byte **)(_RAX_Fast_Logging_Data + 0x218) << 8 |
       (*(ushort *)(*(int *)(_RAX_Fast_Logging_Data + 600) + 1U & 0xfffffe) & 0x3ff) >> 2;
  piVar1 = (int *)(_RAX_Fast_Logging_Data + 0x2d4);
  _RAM_RAX_E_Dat =
       ((0x1080 - *(ushort *)(*piVar1 - 0x73U & 0xfffffe) & 0x7ff) >> 3) << 0x18 |
       ((*(ushort *)(*piVar1 - 0x67U & 0xfffffe) - 0xf80 & 0x7ff) >> 3) << 0x10 |
       ((0x1080 - *(ushort *)(*piVar1 - 0x3bU & 0xfffffe) & 0x7ff) >> 3) << 8 |
       (*(ushort *)(*piVar1 - 0x2fU & 0xfffffe) - 0xf80 & 0x7ff) >> 3;
  _RAM_RAX_F_Dat =
       (uint)**(byte **)(_RAX_Fast_Logging_Data + 0x2ec) << 0x18 |
       (uint)**(byte **)(_RAX_Fast_Logging_Data + 0x2f0) << 0x10 |
       (uint)**(byte **)(_RAX_Fast_Logging_Data + 0x44) << 8 |
       (uint)*(byte *)(*(int *)(_RAX_Fast_Logging_Data + 0x214) + 2);
  _RAM_RAX_G_Dat =
       (uint)**(byte **)(_RAX_Fast_Logging_Data + 0xbc) << 0x18 |
       (uint)**(byte **)(_RAX_Fast_Logging_Data + 0x50) << 0x10 |
       (uint)**(byte **)(_RAX_Fast_Logging_Data + 0x40) << 8 |
       (uint)*(byte *)(*(int *)(_RAX_Fast_Logging_Data + 0x44) + 6);
  _RAM_RAX_H_Dat =
       (uint)(*(ushort *)(*(int *)(_RAX_Fast_Logging_Data + 0x300) + 0xeU & 0xfffffe) >> 8) << 0x18
       | (uint)(*(ushort *)(*(int *)(_RAX_Fast_Logging_Data + 0x300) + 0x16U & 0xfffffe) >> 8) <<
         0x10 | (uint)(*(ushort *)(*(int *)(_RAX_Fast_Logging_Data + 600) + 0x13U & 0xfffffe) >> 8)
                << 8 |
       (uint)(*(ushort *)(*(int *)(_RAX_Fast_Logging_Data + 600) + 0x17U & 0xfffffe) >> 8);
  return 0x5a5a;
}


