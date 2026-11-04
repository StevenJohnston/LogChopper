/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: func_injector_hardware_trigger
 * Address:  0xDA8C
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void func_injector_hardware_trigger(uint param_1,uint param_2)

{
  ushort uVar1;
  ushort uVar2;
  ushort uVar3;
  ushort uVar4;
  ushort uVar5;
  
  uVar5 = 0xffff;
  func_0x00000310();
  uVar1 = _TOP0RL;
  uVar2 = _TOPCEN;
  if ((param_1 & 0xffff) != 0) {
    uVar4 = (short)param_1 - 1;
    uVar2 = _TOP5RL;
    uVar3 = _TOPCEN;
    if ((param_2 & 1) != 0) {
      do {
        if ((_TOPCEN & 0x20) == 0) break;
      } while (_TOP5CT < 2);
      uVar2 = uVar4;
      uVar3 = uVar5;
      if ((_FF015D & 0x20) != 0) {
        _TOP5CT = uVar4;
        uVar2 = _TOP5RL;
        uVar3 = _TOPCEN;
      }
    }
    _TOPCEN = uVar3;
    _TOP5RL = uVar2;
    uVar2 = _TOP4RL;
    uVar3 = _TOPCEN;
    if ((param_2 & 2) != 0) {
      do {
        if ((_TOPCEN & 0x10) == 0) break;
      } while (_TOP4CT < 2);
      uVar2 = uVar4;
      uVar3 = uVar5;
      if ((_FF015D & 0x10) != 0) {
        _TOP4CT = uVar4;
        uVar2 = _TOP4RL;
        uVar3 = _TOPCEN;
      }
    }
    _TOPCEN = uVar3;
    _TOP4RL = uVar2;
    uVar2 = _TOP3RL;
    uVar3 = _TOPCEN;
    if ((param_2 & 4) != 0) {
      do {
        if ((_TOPCEN & 8) == 0) break;
      } while (_TOP3CT < 2);
      uVar2 = uVar4;
      uVar3 = uVar5;
      if ((_FF015D & 8) != 0) {
        _TOP3CT = uVar4;
        uVar2 = _TOP3RL;
        uVar3 = _TOPCEN;
      }
    }
    _TOPCEN = uVar3;
    _TOP3RL = uVar2;
    uVar2 = _TOP2RL;
    uVar3 = _TOPCEN;
    if ((param_2 & 8) != 0) {
      do {
        if ((_TOPCEN & 4) == 0) break;
      } while (_TOP2CT < 2);
      uVar2 = uVar4;
      uVar3 = uVar5;
      if ((_FF015D & 4) != 0) {
        _TOP2CT = uVar4;
        uVar2 = _TOP2RL;
        uVar3 = _TOPCEN;
      }
    }
    _TOPCEN = uVar3;
    _TOP2RL = uVar2;
    uVar2 = _TOP1RL;
    uVar3 = _TOPCEN;
    if ((param_2 & 0x10) != 0) {
      do {
        if ((_TOPCEN & 2) == 0) break;
      } while (_TOP1CT < 2);
      uVar2 = uVar4;
      uVar3 = uVar5;
      if ((_FF015D & 2) != 0) {
        _TOP1CT = uVar4;
        uVar2 = _TOP1RL;
        uVar3 = _TOPCEN;
      }
    }
    _TOPCEN = uVar3;
    _TOP1RL = uVar2;
    _TOPPRO = uVar5;
    uVar2 = _TOPCEN;
    if ((param_2 & 0x20) != 0) {
      do {
        if ((_TOPCEN & 1) == 0) break;
      } while (_TOP0CT < 2);
      uVar1 = uVar4;
      uVar2 = uVar5;
      if ((_FF015D & 1) != 0) {
        _TOP0CT = uVar4;
        uVar1 = _TOP0RL;
        uVar2 = _TOPCEN;
      }
    }
  }
  _TOPCEN = uVar2;
  _TOP0RL = uVar1;
  func_0x00000328();
  return;
}


