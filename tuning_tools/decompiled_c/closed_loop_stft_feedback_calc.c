/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: closed_loop_stft_feedback_calc
 * Address:  0x25164
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void closed_loop_stft_feedback_calc(void)

{
  int iVar1;
  int iVar2;
  undefined4 uVar3;
  undefined4 uVar4;
  undefined4 uVar5;
  undefined4 uVar6;
  
  iVar1 = func_0x0004df48(_DAT_00808908,2);
  iVar2 = func_0x0004debc(_DAT_008088ee);
  uVar3 = func_0x0004e500(iVar2 + iVar1,0x40);
  iVar1 = func_0x0004df48(_DAT_00808904,2);
  iVar2 = func_0x0004debc(_RAM_STFT);
  uVar4 = func_0x0004e500(iVar2 + iVar1,0x40);
  iVar1 = func_0x0004debc(_DAT_008088ee);
  func_0x0004e500((uint)_DAT_00808900 + iVar1 * 2,0x80);
  uVar5 = func_0x0004df48(2);
  iVar1 = func_0x0004debc(_RAM_STFT);
  func_0x0004e500((uint)_DAT_008088fc + iVar1 * 2,0x80);
  uVar6 = func_0x0004df48(2);
  _DAT_0080ab4e = func_0x0004dc38(uVar3,0xff,0);
  _DAT_0080ab4c = func_0x0004dc38(uVar4,0xff,0);
  _DAT_0080ab52 = func_0x0004dc38(uVar5,0xff,0);
  _DAT_0080ab50 = func_0x0004dc38(uVar6,0xff,0);
  return;
}


