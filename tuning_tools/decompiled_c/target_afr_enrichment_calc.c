/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: target_afr_enrichment_calc
 * Address:  0x2333C
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void target_afr_enrichment_calc(int param_1)

{
  short sVar3;
  uint uVar1;
  uint uVar2;
  undefined2 uVar4;
  uint uVar5;
  uint uVar6;
  ushort uVar7;
  uint uVar8;
  int iVar9;
  bool bVar10;
  bool bVar11;
  
  uVar5 = (uint)**(byte **)(param_1 + 4);
  if ((**(byte **)(param_1 + 4) & 8) == 0) {
    if ((_DAT_0080a316 & 1) == 0) {
      if ((DAT_008088da & 4) == 0) {
        uVar8 = (uint)_RAM_Current_Target_AFR;
        if (((DAT_008088da & 0x40) != 0) && (sVar3 = func_0x000aa168(), sVar3 == 0)) {
          iVar9 = func_0x0004e500(_DAT_00808a9e,uMem00053246);
          iVar9 = func_0x0004debc(iVar9 * (uint)uMem00053248);
          uVar8 = uVar8 + iVar9;
        }
      }
      else {
        uVar7 = _DAT_008086b4;
        if (_DAT_008086b4 < uMem00053682) {
          uVar7 = 0x80;
        }
        uVar5 = func_0x0004dc38(uVar7,uMem00053124,uMem00053126);
        uVar8 = func_0x0004dc14(((uVar5 & 0xffff) >> 2) + (uint)uMem00053122);
      }
      if ((_DAT_00808888 & 2) != 0) {
        uVar8 = func_0x0004dc14(uMem000531b2 + uVar8);
      }
      func_0x0004e410(0x5d570);
      uVar5 = func_0x0004e1a8(0x5a430);
      if ((uVar5 & 0xffff) <= (uVar8 & 0xffff)) {
        uVar8 = func_0x0004e1a8(0x5a430);
      }
      if ((DAT_008088da & 8) != 0) {
        uVar8 = func_0x00023550(uVar8);
      }
      if (((DAT_008088da & 1) != 0) && ((uVar8 & 0xffff) < (uint)_AFR_Clip)) {
        uVar8 = (uint)_AFR_Clip;
      }
      bVar10 = false;
      if ((**(ushort **)(param_1 + 0x14) & 8) != 0) {
        iVar9 = (uint)uMem000533ea * 0x50;
        func_0x0004e500((uint)uMem000533ea * 0x14,_DAT_0080800c);
        iVar9 = func_0x0004dcf4(uMem000533e6,iVar9);
        bVar10 = (iVar9 + 0x80U & 0xffff) < (uVar8 & 0xffff);
        if (!bVar10) {
          uVar8 = iVar9 + 0x80U;
        }
      }
      if ((_DAT_0080aa0a & 3) != 0) {
        uVar5 = func_0x0004db80(_DAT_0080aa06 >> 1,0x80);
        bVar10 = (uVar8 & 0xffff) < (uVar5 & 0xffff);
        if (bVar10) {
          uVar8 = uVar5;
        }
      }
      uVar1 = (uint)_DAT_00808c18 * 0x200000;
      uVar5 = (uint)_DAT_00808c18 * 0x400000;
      bVar10 = CARRY4(uVar5,uVar5 + bVar10);
      bVar11 = CARRY4(uVar1,uVar1) || bVar10;
      if (CARRY4(uVar1,uVar1) || bVar10) {
        uVar5 = 0x80;
        if (0x7f < uMem00054bf4) {
          uVar5 = (uint)uMem00054bf4;
        }
        bVar11 = (uVar8 & 0xffff) < uVar5;
        if (!bVar11) {
          uVar8 = uVar5;
        }
      }
      uVar2 = (uint)**(ushort **)(param_1 + 0xb0);
      uVar6 = uVar2 * 0x400000;
      uVar1 = uVar2 * 0x800000;
      uVar5 = uVar2 * 0x800000 + (uint)(CARRY4(uVar6,uVar6) || CARRY4(uVar1,uVar1 + bVar11));
      if (((CARRY4(uVar6,uVar6) || CARRY4(uVar1,uVar1 + bVar11)) ||
          (CARRY4(uVar2 * 0x200000,uVar2 * 0x200000) || CARRY4(uVar2 * 0x400000,uVar2 * 0x400000)))
         && ((uVar8 & 0xffff) < (uint)uMem000539ae)) {
        uVar8 = (uint)uMem000539ae;
      }
    }
    else {
      uVar8 = 0x80;
    }
  }
  else {
    uVar8 = (uint)**(ushort **)(param_1 + 0xd0);
  }
  uVar4 = func_0x000a9f88(uVar8,uVar5);
  **(undefined2 **)(param_1 + 0x50) = uVar4;
  return;
}


