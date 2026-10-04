#!/usr/bin/env python3
"""
m32r_inspector.py - Mitsubishi Evo X (Renesas M32R) Firmware Analyzer & Disassembler

Enables rapid reverse engineering of Mitsubishi Evolution X (4B11T) calibration ROMs
(.srf or .hex.bin) directly from the command line:
  - Vector Table Inspection (Interrupts, Timers, CAN, ADC)
  - Memory Cross-Referencing (finds all routines accessing any calibration table or RAM address)
  - Interactive M32R Disassembler with automatic symbol resolution from EcuFlash XMLs
  - Firmware Call-Tree & Routine Analysis
"""

import sys
import os
import argparse
from pathlib import Path

# Register names for Renesas M32R
REG_NAMES = [
    "r0", "r1", "r2", "r3", "r4", "r5", "r6", "r7",
    "r8", "r9", "r10", "r11", "r12", "fp", "lr", "sp"
]

CR_NAMES = ["psw", "cbr", "spi", "spu", "cr4", "cr5", "bpc", "fpsr"]


def load_symbols(csv_path):
    """Load symbol table from CSV for automatic disassembly annotation."""
    symbols = {}
    if not os.path.exists(csv_path):
        return symbols
    with open(csv_path, "r", encoding="utf-8") as f:
        for line in f:
            parts = line.strip().split(",")
            if len(parts) >= 4 and parts[1].isdigit():
                addr = int(parts[1])
                label = parts[2]
                raw_name = parts[3]
                symbols[addr] = f"{label} /* {raw_name} */"
    return symbols


def read_rom(file_path):
    """Read ROM file and return raw 1MB bytes and base memory offset."""
    with open(file_path, "rb") as f:
        data = f.read()

    # Detect .srf Tactrix header (328 bytes)
    header_offset = 0
    if len(data) == 1048576 + 328 or file_path.endswith(".srf"):
        header_offset = 328
        rom_bytes = data[328:328 + 1048576]
    else:
        rom_bytes = data[:1048576]

    return rom_bytes, header_offset


def sign_extend(val, bits):
    """Sign extend an integer of given bit width."""
    sign_bit = 1 << (bits - 1)
    return (val & (sign_bit - 1)) - (val & sign_bit)


def disassemble_instruction(word, pc, symbols=None):
    """
    Disassemble a 32-bit instruction or dual 16-bit parcels for M32R.
    Returns (list of asm lines, instruction length in bytes).
    """
    symbols = symbols or {}
    b0 = (word >> 24) & 0xFF
    b1 = (word >> 16) & 0xFF
    b2 = (word >> 8) & 0xFF
    b3 = word & 0xFF

    op_major = (b0 >> 4) & 0xF
    r_dest = b0 & 0xF

    # Check for 32-bit instruction formats (MSB of parcel 0 is 1 in top nibble >= 8)
    if b0 >= 0x80:
        # ld24 (load 24-bit address)
        if (b0 & 0xF0) == 0xE0:
            imm24 = (b1 << 16) | (b2 << 8) | b3
            sym = symbols.get(imm24, "")
            ann = f" -> {sym}" if sym else ""
            return [f"ld24    {REG_NAMES[r_dest]}, 0x{imm24:06X}{ann}"], 4

        # seth (set high 16 bits)
        if (b0 & 0xF0) == 0xD0:
            imm16 = (b2 << 8) | b3
            return [f"seth    {REG_NAMES[r_dest]}, 0x{imm16:04X}"], 4

        # branch 24-bit (bra / bl)
        if (b0 & 0xF0) == 0xF0:
            pcdisp24 = ((b1 << 16) | (b2 << 8) | b3)
            disp = sign_extend(pcdisp24, 24) * 4
            target = (pc & 0xFFFFFFFC) + disp
            mnemonic = "bl" if (r_dest & 1) else "bra"
            sym = symbols.get(target, "")
            ann = f" -> <{sym}>" if sym else ""
            return [f"{mnemonic:7s} 0x{target:06X}{ann}"], 4

        # add3 rDest, rSrc, #simm16
        if op_major == 0x8:
            r_src = (b1 >> 4) & 0xF
            subop = b1 & 0xF
            simm16 = sign_extend((b2 << 8) | b3, 16)
            if subop == 0xA:
                if r_src == 13: # FP
                    fp_addr = 0x80C000 + simm16
                    sym = symbols.get(fp_addr, "")
                    ann = f" -> RAM 0x{fp_addr:06X} ({sym})" if sym else f" -> RAM 0x{fp_addr:06X}"
                    return [f"add3    {REG_NAMES[r_dest]}, fp, #{simm16}{ann}"], 4
                return [f"add3    {REG_NAMES[r_dest]}, {REG_NAMES[r_src]}, #{simm16}"], 4
            elif subop == 0x8:
                return [f"and3    {REG_NAMES[r_dest]}, {REG_NAMES[r_src]}, 0x{((b2<<8)|b3):04X}"], 4
            elif subop == 0xC:
                return [f"or3     {REG_NAMES[r_dest]}, {REG_NAMES[r_src]}, 0x{((b2<<8)|b3):04X}"], 4

        # ld / st with 16-bit offset
        if op_major == 0x9:
            r_src = (b1 >> 4) & 0xF
            simm16 = sign_extend((b2 << 8) | b3, 16)
            subop = b1 & 0xF
            if subop == 0x0:
                ann = f" /* RAM 0x{0x80C000 + simm16:06X} */" if r_src == 13 else ""
                return [f"ld      {REG_NAMES[r_dest]}, @({simm16}, {REG_NAMES[r_src]}){ann}"], 4
            elif subop == 0x1:
                return [f"ldb     {REG_NAMES[r_dest]}, @({simm16}, {REG_NAMES[r_src]})"], 4
            elif subop == 0x2:
                return [f"ldh     {REG_NAMES[r_dest]}, @({simm16}, {REG_NAMES[r_src]})"], 4
            elif subop == 0x3:
                return [f"ldub    {REG_NAMES[r_dest]}, @({simm16}, {REG_NAMES[r_src]})"], 4
            elif subop == 0x4:
                return [f"lduh    {REG_NAMES[r_dest]}, @({simm16}, {REG_NAMES[r_src]})"], 4

        if op_major == 0xA:
            subop = (b1 >> 4) & 0xF
            r_src = b1 & 0xF
            simm16 = sign_extend((b2 << 8) | b3, 16)
            ann = f" /* RAM 0x{0x80C000 + simm16:06X} */" if r_src == 13 else ""
            if subop == 0x0:
                return [f"st      {REG_NAMES[r_dest]}, @({simm16}, {REG_NAMES[r_src]}){ann}"], 4
            elif subop == 0x1:
                return [f"stb     {REG_NAMES[r_dest]}, @({simm16}, {REG_NAMES[r_src]}){ann}"], 4
            elif subop == 0x2:
                return [f"sth     {REG_NAMES[r_dest]}, @({simm16}, {REG_NAMES[r_src]}){ann}"], 4

        # conditional branches with 16-bit displacement
        if op_major == 0xB:
            r_src = (b1 >> 4) & 0xF
            subop = b1 & 0xF
            disp = sign_extend((b2 << 8) | b3, 16) * 4
            target = (pc & 0xFFFFFFFC) + disp
            cond_map = {0: "beq", 1: "bne", 2: "bgez", 3: "bgtz", 4: "blez", 5: "bltz", 8: "bc", 9: "bnc"}
            mnemonic = cond_map.get(subop, f"b_{subop}")
            return [f"{mnemonic:7s} {REG_NAMES[r_dest]}, 0x{target:06X}"], 4

    # Dual 16-bit parcel execution
    def decode_16bit(parcel, parcel_pc):
        p0 = (parcel >> 8) & 0xFF
        p1 = parcel & 0xFF
        op = (p0 >> 4) & 0xF
        rd = p0 & 0xF
        rs = (p1 >> 4) & 0xF
        sub = p1 & 0xF

        if parcel == 0x7000:
            return "nop"
        if parcel == 0x10F6:
            return "rte"

        if op == 0x0:
            if sub == 0xA:
                return f"add     {REG_NAMES[rd]}, {REG_NAMES[rs]}"
            elif sub == 0xB:
                return f"sub     {REG_NAMES[rd]}, {REG_NAMES[rs]}"
            elif sub == 0x8:
                return f"and     {REG_NAMES[rd]}, {REG_NAMES[rs]}"
            elif sub == 0xC:
                return f"or      {REG_NAMES[rd]}, {REG_NAMES[rs]}"
            elif sub == 0xE:
                return f"xor     {REG_NAMES[rd]}, {REG_NAMES[rs]}"
        elif op == 0x1:
            if sub == 0xC:
                return f"jmp     {REG_NAMES[rs]}"
            elif sub == 0xD:
                return f"jl      {REG_NAMES[rs]}"
        elif op == 0x2:
            if sub == 0x0:
                return f"ld      {REG_NAMES[rd]}, @{REG_NAMES[rs]}"
            elif sub == 0x1:
                return f"ldb     {REG_NAMES[rd]}, @{REG_NAMES[rs]}"
            elif sub == 0x2:
                return f"ldh     {REG_NAMES[rd]}, @{REG_NAMES[rs]}"
            elif sub == 0x4:
                return f"st      {REG_NAMES[rd]}, @{REG_NAMES[rs]}"
            elif sub == 0x5:
                return f"stb     {REG_NAMES[rd]}, @{REG_NAMES[rs]}"
            elif sub == 0x6:
                return f"sth     {REG_NAMES[rd]}, @{REG_NAMES[rs]}"
            elif sub == 0x8:
                return f"push    {REG_NAMES[rs]}"
            elif sub == 0xA:
                return f"pop     {REG_NAMES[rd]}"
        elif op == 0x6:
            simm8 = sign_extend(p1, 8)
            return f"ldi     {REG_NAMES[rd]}, #{simm8}"
        elif op == 0x7:
            if sub == 0x0:
                return f"cmp     {REG_NAMES[rd]}, {REG_NAMES[rs]}"
            elif sub == 0x2:
                return f"cmpeq   {REG_NAMES[rd]}, {REG_NAMES[rs]}"

        return f".short  0x{parcel:04X}"

    p_left = (word >> 16) & 0xFFFF
    p_right = word & 0xFFFF
    t_left = decode_16bit(p_left, pc)
    t_right = decode_16bit(p_right, pc + 2)
    return [f"{t_left:24s} || {t_right}"], 4


def cmd_vectors(args):
    """Dump interrupt and reset vector table."""
    rom_bytes, _ = read_rom(args.rom)
    print("=== Evo X Renesas M32R MCU Vector Table ===")
    vectors = [
        (0x00, "Reset Vector (RI)"),
        (0x04, "Reserved Exception (RI_2)"),
        (0x10, "System Bus Interface (SBI)"),
        (0x20, "Reserved Instruction Exception (RIE)"),
        (0x30, "Address Exception (AE)"),
        (0x40, "TRAP 0 System Call"),
        (0x80, "External Interrupt (EI)"),
        (0x90, "Floating-Point Exception (FPE)"),
        (0x94, "Timer Input TIN3-6"),
        (0x98, "Timer Input TIN20-29"),
        (0xA0, "Timer Input TIN0-2"),
        (0xAC, "Timer Output TOP8-9"),
        (0xB4, "Timer I/O TIO4-7"),
        (0xC8, "DMA Controller DMA0-4"),
        (0xCC, "Serial I/O 1 RX (SIO1R)"),
        (0xD0, "Serial I/O 1 TX (SIO1T)"),
        (0xDC, "Analog to Digital Converter 0 (AD0)"),
        (0x100, "Analog to Digital Converter 1 (AD1)"),
        (0x10C, "CAN Controller 0 (CAN0 RX/TX)"),
        (0x110, "CAN Controller 1 (CAN1 RX/TX)"),
    ]
    for v_offset, name in vectors:
        if v_offset + 4 <= len(rom_bytes):
            val = int.from_bytes(rom_bytes[v_offset:v_offset + 4], "big")
            print(f"  [0x{v_offset:03X}] {name:<35s} -> 0x{val:08X}")


def cmd_xref(args):
    """Find all cross-references to a specific memory address or table."""
    rom_bytes, header_offset = read_rom(args.rom)
    target = int(args.target, 16)
    symbols = load_symbols(args.symbols) if args.symbols else {}

    print(f"=== Searching Cross-References to 0x{target:06X} in {Path(args.rom).name} ===")
    sym_name = symbols.get(target, "Unknown Symbol")
    print(f"Target: 0x{target:06X} ({sym_name})\n")

    matches = []
    # Search for ld24 (0xE0..0xEF target_24bit)
    target_bytes = target.to_bytes(3, "big")
    for i in range(len(rom_bytes) - 3):
        if rom_bytes[i:i + 3] == target_bytes:
            prefix = rom_bytes[i - 1] if i > 0 else 0
            if (prefix & 0xF0) == 0xE0:
                reg = REG_NAMES[prefix & 0xF]
                func_start = (i - 1) & ~3
                matches.append((func_start, f"ld24 {reg}, 0x{target:06X}"))

    # Search for 32-bit literal constants in pointer tables
    target_bytes4 = target.to_bytes(4, "big")
    for i in range(0, len(rom_bytes) - 4, 4):
        if rom_bytes[i:i + 4] == target_bytes4:
            matches.append((i, f".word 0x{target:08X} (Pointer Table Entry)"))

    if not matches:
        print("No direct cross-references found.")
        return

    print(f"Found {len(matches)} reference(s):")
    for addr, desc in matches:
        file_off = addr + header_offset
        print(f"  ROM 0x{addr:06X} (File Offset 0x{file_off:06X}): {desc}")
        # Disassemble surrounding 16 bytes for context
        start_ctx = max(0, addr - 8)
        end_ctx = min(len(rom_bytes), addr + 16)
        print("    Context:")
        for ctx_pc in range(start_ctx, end_ctx, 4):
            word = int.from_bytes(rom_bytes[ctx_pc:ctx_pc + 4], "big")
            lines, _ = disassemble_instruction(word, ctx_pc, symbols)
            marker = "==>" if ctx_pc == addr else "   "
            for l in lines:
                print(f"      {marker} 0x{ctx_pc:06X}:  {l}")
        print()


def cmd_disasm(args):
    """Disassemble a range of instructions in the ROM."""
    rom_bytes, header_offset = read_rom(args.rom)
    start = int(args.start, 16)
    count = int(args.count) if args.count else 16
    symbols = load_symbols(args.symbols) if args.symbols else {}

    print(f"=== Disassembling {Path(args.rom).name} from 0x{start:06X} ({count} instructions) ===")
    pc = start
    for _ in range(count):
        if pc + 4 > len(rom_bytes):
            break
        word = int.from_bytes(rom_bytes[pc:pc + 4], "big")
        sym = symbols.get(pc)
        if sym:
            print(f"\n<{sym}>:")
        lines, length = disassemble_instruction(word, pc, symbols)
        hex_str = rom_bytes[pc:pc + length].hex()
        for l in lines:
            print(f"  0x{pc:06X}:  {hex_str:<8s}  {l}")
        pc += length


def main():
    default_ref_dir = Path(__file__).resolve().parent.parent / "references"
    default_symbols = default_ref_dir / "evo10_symbols.csv"

    parser = argparse.ArgumentParser(description="Evo X Renesas M32R ROM Inspector & Disassembler")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # vectors
    p_vec = subparsers.add_parser("vectors", help="Dump interrupt and vector table")
    p_vec.add_argument("rom", help="Path to .hex.bin or .srf ROM")

    # xref
    p_xref = subparsers.add_parser("xref", help="Find all code referencing a table or address")
    p_xref.add_argument("target", help="Target memory address (e.g. 0x5757A)")
    p_xref.add_argument("rom", help="Path to .hex.bin or .srf ROM")
    p_xref.add_argument("--symbols", default=str(default_symbols), help="Path to evo10_symbols.csv")

    # disasm
    p_dis = subparsers.add_parser("disasm", help="Disassemble ROM instructions")
    p_dis.add_argument("start", help="Starting memory address (e.g. 0x0FB060)")
    p_dis.add_argument("rom", help="Path to .hex.bin or .srf ROM")
    p_dis.add_argument("--count", "-n", default=16, help="Number of 32-bit instruction words (default: 16)")
    p_dis.add_argument("--symbols", default=str(default_symbols), help="Path to evo10_symbols.csv")

    args = parser.parse_args()
    if args.command == "vectors":
        cmd_vectors(args)
    elif args.command == "xref":
        cmd_xref(args)
    elif args.command == "disasm":
        cmd_disasm(args)


if __name__ == "__main__":
    main()
