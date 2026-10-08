/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: speed_vehicle_speed_calc
 * Address:  0x3190C
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void speed_vehicle_speed_calc(int param_1)

{
  byte *pbVar1;
  ushort uVar2;
  short sVar3;
  undefined2 uVar7;
  undefined4 uVar4;
  undefined4 uVar5;
  undefined4 uVar6;
  short sVar9;
  uint uVar8;
  uint uVar10;
  uint uVar11;
  
  sVar9 = sMem000541dc << 5;
  uVar10 = (uint)uMem000541da << 5;
  if (_DAT_00808de2 < uMem00053c8a) {
    DAT_0080955d = DAT_0080955d | 4;
  }
  else {
    DAT_0080955d = DAT_0080955d & 0xfb;
  }
  uVar11 = (uint)_DAT_00809a5e;
  if (_DAT_0080879e < uMem00053c58) {
    func_0x0002e6a8();
    uVar11 = uVar10 & 0xffff;
  }
  if (((_DAT_00809948 & 0xc000) != 0) || ((DAT_0080994a & 0x40) != 0)) {
    func_0x0002e6a8();
    uVar11 = uVar10 & 0xffff;
  }
  if (((((DAT_0080979c & 0x40) == 0) || ((DAT_0080979c & 2) != 0)) || ((DAT_00809944 & 8) != 0)) ||
     ((_DAT_00809948 & 0x30) == 0)) {
    func_0x0002e6a8();
    uVar11 = (uint)**(ushort **)(param_1 + 0x104);
  }
  _DAT_00809792 = 0;
  uVar7 = func_0x0004dc38(uVar11,sVar9,uVar10);
  **(undefined2 **)(param_1 + 0x104) = uVar7;
  if (((_DAT_008095ee & 2) != 0) && (_DAT_008097b2 == 0)) {
    uVar4 = func_0x0004e500(_DAT_008095a2,_DAT_0080aa7c);
    _DAT_008095b4 = func_0x0004e0d4(_DAT_008095b4,uVar4,uMem00054858);
  }
  if ((((((_DAT_008097b2 != 0) || ((**(ushort **)(param_1 + 0x134) & 1) == 0)) ||
        ((**(short **)(param_1 + 0xe4) != 0 ||
         (((_DAT_00808686 < uMem0005477e || (uMem00053c68 <= _DAT_00808686)) ||
          (_DAT_0080879e < uMem00053c6a)))))) ||
       ((_RAM_Load_Timing < uMem00054780 || ((_DAT_00808646 & 0x80) != 0)))) ||
      ((uVar2 = **(ushort **)(param_1 + 0x134), uVar8 = (uint)uVar2 * 0x10000,
       uVar11 = (uint)uVar2 * 0x20000, CARRY4(uVar8,uVar8) || CARRY4(uVar11,uVar11) &&
       ((uVar2 & 0x40) == 0)))) ||
     ((((_DAT_00809948 & 0xc000) != 0 || ((DAT_0080994a & 0x40) != 0)) ||
      (((DAT_008046b6 & 8) != 0 || (((_DAT_008046b0 & 2) != 0 || ((_DAT_00809528 & 0x40) == 0)))))))
     ) {
    pbVar1 = (byte *)(*(int *)(param_1 + 0x140) + 1);
    *pbVar1 = *pbVar1 & 0xbf;
  }
  else {
    uVar4 = func_0x0004ded0((uint)uMem000541ee << 5);
    uVar5 = func_0x0004ded0((uint)uMem000541f0 << 5);
    uVar6 = func_0x0004ded0(**(undefined2 **)(param_1 + 0x104));
    func_0x0004e050(**(undefined4 **)(param_1 + 0xdc),uVar6,uMem00053c5c);
    uVar4 = func_0x0004dc64(uVar4,uVar5);
    **(undefined4 **)(param_1 + 0xdc) = uVar4;
    sVar3 = **(short **)(param_1 + 0xd8);
    **(short **)(param_1 + 0xd8) = sVar3 + 1;
    if (sVar3 == -1) {
      **(short **)(param_1 + 0xd8) = **(short **)(param_1 + 0xd8) + -1;
    }
    pbVar1 = (byte *)(*(int *)(param_1 + 0x140) + 1);
    *pbVar1 = *pbVar1 | 0x40;
  }
  if (((_DAT_00809948 & 0xc000) == 0) && ((DAT_0080994a & 0x40) == 0)) {
    if ((**(ushort **)(param_1 + 0x134) & 8) == 0) {
      uVar4 = func_0x0004ded0(**(undefined2 **)(param_1 + 0x104));
      **(undefined4 **)(param_1 + 0x158) = uVar4;
    }
    else {
      uVar4 = func_0x0004ded0((uint)uMem000541ee << 5);
      uVar5 = func_0x0004ded0((uint)uMem000541f0 << 5);
      uVar6 = func_0x0004ded0(**(undefined2 **)(param_1 + 0x104));
      func_0x0004e050(**(undefined4 **)(param_1 + 0x158),uVar6,uMem00054786);
      uVar4 = func_0x0004dc64(uVar4,uVar5);
      **(undefined4 **)(param_1 + 0x158) = uVar4;
    }
  }
  uVar7 = uMem000541ba;
  if (((_DAT_00809948 & 0xc000) == 0) && ((DAT_0080994a & 0x40) == 0)) {
    uVar11 = func_0x0004def8(**(undefined4 **)(param_1 + 0xdc));
    uVar11 = uVar11 & 0xffff;
    func_0x0004db94(**(undefined2 **)(param_1 + 0x104),uMem000541ba);
    uVar7 = func_0x0004e518(uVar11);
  }
  uVar7 = func_0x0004dc38(uVar7,sVar9,uVar10);
  **(undefined2 **)(param_1 + 0x110) = **(undefined2 **)(param_1 + 0xfc);
  **(undefined2 **)(param_1 + 0xfc) = uVar7;
  uVar4 = func_0x0004dc38(**(undefined2 **)(param_1 + 0xfc),uMem000541bc,uMem000541ba);
  func_0x0004e500(uMem000541ba,uVar4);
  _DAT_008095d8 = func_0x0004dcf4(0x100,0x147b);
  if (((((_DAT_008097b2 == 0) || (_DAT_008097b2 == 2)) && (**(short **)(param_1 + 0x114) == 0)) &&
      ((((_DAT_00809948 & 0xc000) == 0 && ((DAT_0080994a & 0x40) == 0)) &&
       (((_DAT_008046b0 & 2) == 0 && ((_DAT_00808870 & 0x11) == 0)))))) &&
     (((**(ushort **)(param_1 + 0x140) & 0x40) != 0 || (**(short **)(param_1 + 0xd8) != 0)))) {
    uVar4 = func_0x0004ded0(**(undefined2 **)(param_1 + 0x104));
    _DAT_00809518 = func_0x0004e050(_DAT_00809518,uVar4,uMem00053c7c);
  }
  func_0x0004e518(**(undefined4 **)(param_1 + 0xdc),_DAT_00809518);
  _DAT_00809520 = func_0x0004dec4();
  return;
}


