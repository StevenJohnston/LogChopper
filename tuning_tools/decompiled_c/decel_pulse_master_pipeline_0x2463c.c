/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: decel_pulse_master_pipeline_0x2463c
 * Address:  0x2463C
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void decel_pulse_master_pipeline_0x2463c(void)

{
  int iVar1;
  int iVar2;
  int iVar3;
  undefined4 uVar4;
  undefined2 uVar5;
  
  iVar1 = func_0x00024718();
  iVar2 = func_0x0002474c();
  iVar3 = func_0x00024770();
  func_0x0004e410(0x61930);
  func_0x000fba18(_DAT_00805040);
  uVar4 = func_0x0004ded0();
  func_0x0004ded0(*(undefined1 *)(uMem00061934 + 0x57bd5));
  func_0x0004dca8(uVar4,iVar2 * iVar1,0x4000);
  uVar4 = func_0x0004dca8(iVar3 << 7,0x4000);
  if ((_DAT_008088c6 & 0x20) != 0) {
    uVar4 = func_0x0004ddd4(uMem00053d74);
  }
  func_0x0004dca8(uVar4,(uint)_DAT_00808936 * (uint)uMem00053d80,0x400);
  func_0x0004e4b0(4);
  uVar5 = func_0x0004def8();
  uMem008088da = uMem008088da & 0x7ffb;
  _DAT_00808984 = func_0x0004e490(uVar5,4);
  return;
}


