#!/usr/bin/env python3
"""
decompile_ecu.py - Automated C Decompiler for Mitsubishi Evo X ECU Firmware

Utilizes Ghidra 12 headless analyzer with the Renesas M32R processor module to
automatically translate raw ECU binary firmware into clean, human-readable C source code.

Features:
  - Automatically loads 402+ EcuFlash calibration table labels before decompiling
  - Translates machine code into C functions with typed variables and memory access
  - Decompiles individual routines by address or batches all core engine subsystems
  - Saves readable .c files into tuning_tools/decompiled_c/
"""

import sys
import os
import subprocess
import argparse
from pathlib import Path


GHIDRA_HOME = "/opt/homebrew/Cellar/ghidra/12.1.4/libexec"
JAVA_HOME = "/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"


def check_prerequisites():
    if not os.path.exists(GHIDRA_HOME):
        print(f"[-] Error: Ghidra not found at {GHIDRA_HOME}", file=sys.stderr)
        return False
    if not os.path.exists(JAVA_HOME):
        print(f"[-] Error: JDK 21 not found at {JAVA_HOME}", file=sys.stderr)
        return False
    return True


def run_decompile(rom_path, out_dir, target_addr=None, target_name=None):
    tools_dir = Path(__file__).resolve().parent
    ref_dir = tools_dir.parent / "references"
    symbols_script = ref_dir / "GhidraImportEvo10Symbols.java"
    export_script = ref_dir / "ExportDecompiledC.java"

    if not symbols_script.exists() or not export_script.exists():
        print(f"[-] Required Ghidra scripts missing in {ref_dir}", file=sys.stderr)
        return False

    out_dir.mkdir(parents=True, exist_ok=True)
    temp_proj_dir = Path("/tmp/ghidra_decompile_run")
    temp_proj_dir.mkdir(parents=True, exist_ok=True)

    headless_bin = Path(GHIDRA_HOME) / "support" / "analyzeHeadless"

    # Automatically strip 328-byte .srf Tactrix header if present
    import_path = Path(rom_path)
    with open(rom_path, "rb") as f:
        f.seek(0, os.SEEK_END)
        total_len = f.tell()
    if total_len == 1048576 + 328 or str(rom_path).endswith(".srf"):
        stripped_bin = temp_proj_dir / f"{Path(rom_path).stem}_raw.bin"
        with open(rom_path, "rb") as f_in, open(stripped_bin, "wb") as f_out:
            f_in.seek(328)
            f_out.write(f_in.read(1048576))
        import_path = stripped_bin

    # Build script arguments: [outDir, 0xAddress, FunctionName]
    script_args = [str(out_dir)]
    if target_addr:
        script_args.append(target_addr)
        script_args.append(target_name or f"func_{target_addr}")

    cmd = [
        str(headless_bin),
        str(temp_proj_dir),
        "decompile_session",
        "-import", str(import_path),
        "-processor", "m32r:2:default",
        "-cspec", "default",
        "-scriptPath", str(ref_dir),
        "-preScript", "GhidraImportEvo10Symbols.java",
        "-postScript", "ExportDecompiledC.java",
    ] + script_args + [
        "-deleteProject",
        "-noanalysis"
    ]

    env = os.environ.copy()
    env["JAVA_HOME"] = JAVA_HOME

    print(f"[*] Launching Ghidra M32R Decompiler on {Path(rom_path).name}...")
    print(f"[*] Target Output Directory: {out_dir}")

    try:
        proc = subprocess.run(
            cmd,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            check=True
        )
        for line in proc.stdout.splitlines():
            if "ExportDecompiledC.java>" in line or "Successfully wrote" in line:
                print(f"  {line.split('>')[-1].strip()}")
            elif "Finished:" in line:
                print(f"[+] {line.strip()}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[-] Decompiler execution failed:\n{e.stdout}", file=sys.stderr)
        return False


def main():
    default_out_dir = Path(__file__).resolve().parent.parent / "decompiled_c"

    parser = argparse.ArgumentParser(description="Decompile Evo X ECU ROM to C source code")
    parser.add_argument("rom", help="Path to .hex.bin or .srf ROM file")
    parser.add_argument("--out", "-o", default=str(default_out_dir), help="Output directory for .c files")
    parser.add_argument("--func", help="Specific function address to decompile (e.g. 0x022A80)")
    parser.add_argument("--name", help="Name for the decompiled function (e.g. fuel_calc)")

    args = parser.parse_args()

    if not check_prerequisites():
        sys.exit(1)

    rom_file = Path(args.rom).resolve()
    if not rom_file.exists():
        print(f"[-] ROM file not found: {rom_file}", file=sys.stderr)
        sys.exit(1)

    out_path = Path(args.out).resolve()
    success = run_decompile(rom_file, out_path, args.func, args.name)
    if success:
        print(f"\n[+] Decompilation complete! Inspect the generated C code in:")
        print(f"    {out_path}")


if __name__ == "__main__":
    main()
