/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: timing_advance_final_calc
 * Address:  0xA0D00
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void timing_advance_final_calc(int param_1)

{
  short sVar1;
  int iVar2;
  undefined2 uVar4;
  ushort uVar5;
  ushort uVar6;
  undefined4 uVar3;
  uint uVar7;
  uint uVar8;
  uint uVar9;
  uint in_R8;
  int in_R9;
  undefined4 in_R10;
  int iVar10;
  int iVar11;
  bool bVar12;
  ushort uStack00000016;
  undefined2 in_stack_00000018;
  ushort in_stack_0000001a;
  undefined2 in_stack_0000001c;
  undefined2 in_stack_0000001e;
  ushort in_stack_00000020;
  ushort uStack00000022;
  
  if ((param_1 != 0) && ((_DAT_00808870 & 0x11) != 0)) {
    **(undefined2 **)(in_R9 + 0x13c) = 0;
    **(undefined2 **)(in_R9 + 0x154) = 0;
    **(undefined2 **)(in_R9 + 0x14c) = 0;
    **(undefined2 **)(in_R9 + 0x140) = 0xff;
    **(undefined2 **)(in_R9 + 0x158) = 0xff;
    **(undefined2 **)(in_R9 + 0x150) = 0xff;
    **(undefined2 **)(in_R9 + 0x144) = 0;
    **(undefined2 **)(in_R9 + 0x15c) = 0;
    **(undefined2 **)(in_R9 + 0x164) = 0;
    **(undefined2 **)(in_R9 + 0x148) = 0xff;
    **(undefined2 **)(in_R9 + 0x160) = 0xff;
    **(undefined2 **)(in_R9 + 0x168) = 0xff;
  }
  uStack00000016 = func_0x0004dc84(uMem000537e6,0x40);
  iVar2 = func_0x0004dc84(uMem000537e8,in_R10,0x40);
  if (cMem000503bc != '\0') {
    in_stack_0000001e = func_0x0004dc84(uMem000537ea,in_stack_00000018,0x40);
    in_stack_0000001c = func_0x0004dc84(uMem000537ec,in_stack_00000018,0x40);
  }
  if ((_DAT_00808868 & 2) != 0) {
    if (cMem000503bc == '\0') {
      iVar10 = iVar2 << 8;
      iVar11 = (0xff - (uint)uStack00000016) * 0x100;
      func_0x0004e01c(**(undefined2 **)(in_R9 + 0xa0),(uint)**(ushort **)(in_R9 + 0x120) << 8,
                      uMem000537e4);
    }
    else {
      iVar10 = iVar2 << 6;
      iVar11 = (0x3ff - (uint)uStack00000016) * 0x40;
      func_0x0004e01c(**(undefined2 **)(in_R9 + 0xa0),(uint)**(ushort **)(in_R9 + 0x21c) << 6,
                      uMem000537e4);
    }
    uVar4 = func_0x0004dc38(iVar11,iVar10);
    **(undefined2 **)(in_R9 + 0xa0) = uVar4;
  }
  if (cMem000503bc == '\0') {
    uVar3 = func_0x0004debc(**(undefined2 **)(in_R9 + 0xa0));
    uStack00000022 = func_0x0004db80(uStack00000016);
    uVar6 = func_0x0004e500(uVar3,iVar2);
    if ((**(byte **)(in_R9 + 0xd8) & 4) == 0) {
      if (uStack00000022 < **(ushort **)(in_R9 + 0x120)) {
        **(byte **)(in_R9 + 0xd8) = **(byte **)(in_R9 + 0xd8) | 4;
      }
    }
    else if (**(ushort **)(in_R9 + 0x120) <= uVar6) {
      **(byte **)(in_R9 + 0xd8) = **(byte **)(in_R9 + 0xd8) & 0xfb;
    }
  }
  else {
    uVar6 = **(ushort **)(in_R9 + 0xa0) >> 6;
    uStack00000022 = func_0x0004db80(uVar6,uStack00000016);
    uVar5 = func_0x0004e500(uVar6,iVar2);
    if ((**(byte **)(in_R9 + 0xd8) & 4) == 0) {
      if (uStack00000022 < **(ushort **)(in_R9 + 0x21c)) {
        **(byte **)(in_R9 + 0xd8) = **(byte **)(in_R9 + 0xd8) | 4;
      }
    }
    else if (**(ushort **)(in_R9 + 0x21c) <= uVar5) {
      **(byte **)(in_R9 + 0xd8) = **(byte **)(in_R9 + 0xd8) & 0xfb;
    }
    uVar5 = func_0x0004db80(uVar6,in_stack_0000001e);
    uVar6 = func_0x0004e500(uVar6,in_stack_0000001c);
    if ((**(byte **)(in_R9 + 0x2dc) & 8) == 0) {
      if (uVar5 < **(ushort **)(in_R9 + 0x21c)) {
        **(byte **)(in_R9 + 0x2dc) = **(byte **)(in_R9 + 0x2dc) | 8;
      }
    }
    else if (**(ushort **)(in_R9 + 0x21c) <= uVar6) {
      **(byte **)(in_R9 + 0x2dc) = **(byte **)(in_R9 + 0x2dc) & 0xf7;
    }
  }
  if (((((((in_R8 & 0xffff) != 0) && ((**(ushort **)(in_R9 + 0xd8) & 2) != 0)) &&
        ((**(ushort **)(in_R9 + 0x124) & 0x80) != 0)) &&
       ((**(short **)(in_R9 + 0x74) != 0 && ((**(byte **)(in_R9 + 0x110) & 0x80) == 0)))) &&
      (bVar12 = (DAT_00808888 & 0x20) != 0, !bVar12)) &&
     (((uVar6 = **(ushort **)(in_R9 + 0xcc) | **(ushort **)(in_R9 + 200), (uVar6 & 0x7000) == 0 &&
       ((uVar6 & 3999) == 0)) && (((_DAT_008046aa | _DAT_008046ce) & 0x30) == 0)))) {
    if (DTC_P0139_0x1_0x0_Oxygen_Sensor_Circuit_Slow_Response_Bank1_Sensor2 != '\0') {
      uVar7 = (uint)(**(ushort **)(in_R9 + 0x29c) | **(ushort **)(in_R9 + 0x298));
      uVar8 = uVar7 * 0x40000;
      uVar7 = uVar7 * 0x80000;
      if (CARRY4(uVar8,uVar8) || CARRY4(uVar7,uVar7)) goto LAB_000a1210;
      bVar12 = false;
    }
    if (((cMem000503bf == '\0') ||
        (uVar7 = (uint)(**(ushort **)(in_R9 + 0x298) | **(ushort **)(in_R9 + 0x29c)),
        uVar8 = uVar7 * 0x10000, uVar7 = uVar7 * 0x20000,
        !CARRY4(uVar8,uVar8) && !CARRY4(uVar7,uVar7 + bVar12))) &&
       (((**(ushort **)(in_R9 + 0x298) | **(ushort **)(in_R9 + 0x29c)) & 0x1800) == 0)) {
      **(byte **)(in_R9 + 0xd8) = **(byte **)(in_R9 + 0xd8) | 0x20;
      if ((_DAT_00808868 & 8) != 0) {
        uVar4 = func_0x0004db80(**(undefined2 **)(in_R9 + 0x7c),_DAT_0080882e);
        **(undefined2 **)(in_R9 + 0x7c) = uVar4;
        sVar1 = **(short **)(in_R9 + 0x24);
        **(short **)(in_R9 + 0x24) = sVar1 + 1;
        if (sVar1 == -1) {
          **(short **)(in_R9 + 0x24) = **(short **)(in_R9 + 0x24) + -1;
        }
      }
      bVar12 = (((byte)**(undefined2 **)(in_R9 + 0x104) ^ (byte)**(undefined2 **)(in_R9 + 0x100)) &
               0x40) != 0;
      if ((bVar12) &&
         (sVar1 = **(short **)(in_R9 + 0x38), **(short **)(in_R9 + 0x38) = sVar1 + 1, sVar1 == -1))
      {
        **(short **)(in_R9 + 0x38) = **(short **)(in_R9 + 0x38) + -1;
      }
      uVar7 = (uint)(**(ushort **)(in_R9 + 0xd8) ^ in_stack_00000020);
      uVar8 = uVar7 * 0x200000;
      uVar7 = uVar7 * 0x400000;
      bVar12 = CARRY4(uVar7,uVar7 + bVar12);
      if ((CARRY4(uVar8,uVar8) || bVar12) &&
         (sVar1 = **(short **)(in_R9 + 0x40), **(short **)(in_R9 + 0x40) = sVar1 + 1, sVar1 == -1))
      {
        **(short **)(in_R9 + 0x40) = **(short **)(in_R9 + 0x40) + -1;
      }
      if (((cMem000503bc != '\0') &&
          (uVar7 = (uint)(**(ushort **)(in_R9 + 0x2dc) ^ in_stack_0000001a),
          uVar9 = uVar7 * 0x100000, uVar7 = uVar7 * 0x200000,
          CARRY4(uVar9,uVar9) || CARRY4(uVar7,uVar7 + (CARRY4(uVar8,uVar8) || bVar12)))) &&
         (sVar1 = **(short **)(in_R9 + 0x30c), **(short **)(in_R9 + 0x30c) = sVar1 + 1, sVar1 == -1)
         ) {
        **(short **)(in_R9 + 0x30c) = **(short **)(in_R9 + 0x30c) + -1;
      }
      if (**(short **)(in_R9 + 0x48) == 0) {
        **(undefined2 **)(in_R9 + 0x3c) = **(undefined2 **)(in_R9 + 0x38);
        **(undefined2 **)(in_R9 + 0x44) = **(undefined2 **)(in_R9 + 0x40);
        if (cMem000503bc != '\0') {
          **(undefined2 **)(in_R9 + 0x310) = **(undefined2 **)(in_R9 + 0x30c);
        }
        uVar4 = func_0x0004df9c(**(undefined2 **)(in_R9 + 0x7c),**(undefined2 **)(in_R9 + 0x24));
        **(undefined2 **)(in_R9 + 0x78) = uVar4;
        **(undefined2 **)(in_R9 + 0x48) = uMem000537d6;
        **(undefined2 **)(in_R9 + 0x40) = 0;
        **(undefined2 **)(in_R9 + 0x38) = 0;
        **(undefined2 **)(in_R9 + 0x24) = 0;
        **(undefined2 **)(in_R9 + 0x7c) = 0;
        if (cMem000503bc != '\0') {
          **(undefined2 **)(in_R9 + 0x30c) = 0;
        }
        func_0x000a12a0(in_R9);
      }
      goto LAB_000a1260;
    }
  }
LAB_000a1210:
  **(ushort **)(in_R9 + 0xd8) = **(ushort **)(in_R9 + 0xd8) & 0x9fff;
  **(undefined2 **)(in_R9 + 0x48) = uMem000537d6;
  **(undefined2 **)(in_R9 + 0x40) = 0;
  **(undefined2 **)(in_R9 + 0x38) = 0;
  **(undefined2 **)(in_R9 + 0x24) = 0;
  **(undefined2 **)(in_R9 + 0x7c) = 0;
  if (cMem000503bc != '\0') {
    **(undefined2 **)(in_R9 + 0x30c) = 0;
  }
LAB_000a1260:
  if (((DAT_00809358 & 0x20) != 0) || ((DAT_0080935a & 0x20) != 0)) {
    DAT_008092d7 = DAT_008092d7 | 0x40;
  }
  if (((DAT_00809358 & 0x40) == 0) && ((DAT_0080935a & 0x40) == 0)) {
    DAT_008092db = DAT_008092db & 0xbf;
  }
  else {
    DAT_008092db = DAT_008092db | 0x40;
  }
  return;
}


