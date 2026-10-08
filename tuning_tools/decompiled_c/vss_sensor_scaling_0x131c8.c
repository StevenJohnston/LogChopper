/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: vss_sensor_scaling_0x131c8
 * Address:  0x131C8
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void vss_sensor_scaling_0x131c8(void)

{
  undefined4 uVar1;
  uint uVar2;
  
  uVar2 = 0x8000;
  func_0x00013480();
  func_0x000136d8();
  func_0x0004e410(0x6220e);
  _DAT_0080a81a = func_0x0004e278(0x5ec2c);
  if ((DAT_00808846 & 0x20) != 0) {
    func_0x0007bb88();
    func_0x0001425c();
    func_0x000186f8();
    func_0x00000310();
    if ((_DAT_0080a512 & 4) == 0) {
      if (uMem000546f6 < _DAT_0080873e) {
        _DAT_0080a512 = _DAT_0080a512 | 4;
      }
    }
    else if (_DAT_0080873e <= uMem000546f8) {
      _DAT_0080a512 = _DAT_0080a512 & 0xfffb;
    }
    func_0x00000328();
  }
  if (_DAT_008080b8 == 0) {
    func_0x00018f38();
  }
  func_0x00017430();
  func_0x0001377c();
  func_0x000147a0();
  func_0x00014f64();
  func_0x00015150();
  func_0x000159d8();
  func_0x0001a444();
  func_0x00015478();
  func_0x000155ac();
  func_0x0001a104();
  func_0x0004e410(0x62716);
  _DAT_0080a5e4 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5CBD6);
  func_0x00015cc0();
  func_0x00015e84();
  func_0x00015ec0();
  func_0x000186c0();
  func_0x00015f18();
  if ((_DAT_00808848 & 1) == 0) {
    if ((_DAT_00808848 & 1) == 0) {
      _DAT_008096b8 = func_0x00019c00();
    }
    else if ((cMem00050385 == '\0') || ((_DAT_00808848 & 1) == 0)) {
      _DAT_008096b8 = _DAT_008096b6;
    }
    else {
      _DAT_008096b8 = _DAT_0080a562;
    }
  }
  else {
    _DAT_008096b8 = func_0x00019910();
  }
  _DAT_008096d2 = func_0x0004e500(_DAT_008096b8,_DAT_00809688);
  if ((_DAT_00808848 & 2) != 0) {
    func_0x0001a52c();
    func_0x0002a9b0();
    func_0x00018330();
    func_0x00017f68();
  }
  if ((_DAT_00808848 & 2) != 0) {
    if ((_DAT_0080aa5a & uVar2) == 0) {
      _DAT_0080aa5a = _DAT_0080aa5a & 0xbfff;
    }
    else {
      _DAT_0080aa5a = _DAT_0080aa5a | 0x4000;
    }
    if (((((DAT_008096e8 & 0x40) == 0) && ((DAT_008096e8 & 0x20) == 0)) &&
        ((DAT_008096de & 0x40) == 0)) && ((DAT_008096de & 0x20) == 0)) {
      _DAT_0080aa5a = _DAT_0080aa5a & 0x7fff;
    }
    else {
      _DAT_0080aa5a = _DAT_0080aa5a | (ushort)uVar2;
    }
  }
  if (((((_DAT_00808848 & 2) == 0) || ((uVar2 & _DAT_0080aa5a) != 0)) ||
      (((_DAT_0080aa5a & 0xc000) != 0x4000 && (_DAT_0080aa68 == 0)))) || (sMem00054950 == 0)) {
    _DAT_0080aa68 = 0;
    _DAT_00808016 = 0;
  }
  else {
    uVar1 = func_0x0004e490(sMem00054950,_DAT_00808016);
    _DAT_0080aa68 = func_0x0004e500(0xff,uVar1);
  }
  if ((_DAT_00808848 & 2) != 0) {
    func_0x0002a7f8();
  }
  func_0x00016d30();
  func_0x0001a2f4();
  _DAT_00809666 = _DAT_00809660;
  _DAT_00809668 = _DAT_0080965e;
  func_0x000168b8();
  func_0x00016a90();
  if (_DAT_00809776 < _DAT_00809602) {
    _DAT_0080a41c = _DAT_00809602;
  }
  else {
    _DAT_0080a41c = _DAT_00809776;
  }
  func_0x000171f4();
  func_0x000ad3d8();
  func_0x000ad510();
  func_0x00017414();
  func_0x00019f70();
  if ((_DAT_0080a310 & 1) == 0) {
    if (uMem0005423e < _DAT_0080879e) {
      _DAT_0080a310 = _DAT_0080a310 | 1;
    }
  }
  else if (_DAT_0080879e <= uMem00054240) {
    _DAT_0080a310 = _DAT_0080a310 & 0xfffe;
  }
  if (_DAT_008080b8 != 0) {
    func_0x00018f8c();
    func_0x00019214();
    func_0x00019358();
  }
  func_0x0001a514();
  func_0x0001ac3c();
  return;
}


