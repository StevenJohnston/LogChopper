// TestDecompile.java - Test decompiling Evo X functions to C
// @category Automotive.EvoX

import ghidra.app.script.GhidraScript;
import ghidra.app.decompiler.DecompInterface;
import ghidra.app.decompiler.DecompileResults;
import ghidra.program.model.listing.Function;
import ghidra.program.model.listing.FunctionManager;
import ghidra.program.model.address.Address;
import java.io.File;
import java.io.PrintWriter;

public class TestDecompile extends GhidraScript {
    @Override
    public void run() throws Exception {
        println("=== Starting Evo X C Decompilation ===");
        DecompInterface decomp = new DecompInterface();
        boolean ok = decomp.openProgram(currentProgram);
        if (!ok) {
            println("Failed to open program in decompiler!");
            return;
        }

        long[] targets = new long[] {
            0x022A80L, // Fuel Calculation Routine
            0x0FB000L, // TephraMOD Main Dispatcher
            0x04E1A8L, // 2D Table Interpolator
            0x04E330L  // 3D Map Interpolator
        };

        String[] names = new String[] {
            "fuel_calculate_pulse_width",
            "tephramod_dispatch_maps",
            "table_interpolate_2d",
            "map_interpolate_3d"
        };

        FunctionManager fm = currentProgram.getFunctionManager();

        for (int i = 0; i < targets.length; i++) {
            Address addr = toAddr(targets[i]);
            if (addr == null) continue;

            Function f = fm.getFunctionAt(addr);
            if (f == null) {
                f = createFunction(addr, names[i]);
            }
            if (f == null) {
                // Try disassemble first at address
                disassemble(addr);
                f = createFunction(addr, names[i]);
            }

            if (f != null) {
                println("Decompiling function: " + f.getName() + " at " + addr);
                DecompileResults res = decomp.decompileFunction(f, 60, monitor);
                if (res != null && res.decompileCompleted()) {
                    String cCode = res.getDecompiledFunction().getC();
                    println("----- Decompiled " + names[i] + " -----");
                    // Print first 20 lines
                    String[] lines = cCode.split("\n");
                    for (int j = 0; j < Math.min(30, lines.length); j++) {
                        println(lines[j]);
                    }
                    if (lines.length > 30) {
                        println("... [" + (lines.length - 30) + " more lines] ...");
                    }
                    println("----------------------------------------");
                } else {
                    println("Decompilation failed: " + (res != null ? res.getErrorMessage() : "null"));
                }
            } else {
                println("Could not create function at " + addr);
            }
        }
        println("=== Decompilation Test Complete ===");
    }
}
