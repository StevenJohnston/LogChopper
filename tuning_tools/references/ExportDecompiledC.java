// ExportDecompiledC.java - Batch Decompile Evo X Routines to C Source Files
// @category Automotive.EvoX

import ghidra.app.script.GhidraScript;
import ghidra.app.decompiler.DecompInterface;
import ghidra.app.decompiler.DecompileResults;
import ghidra.program.model.listing.Function;
import ghidra.program.model.listing.FunctionManager;
import ghidra.program.model.address.Address;
import java.io.File;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.List;

public class ExportDecompiledC extends GhidraScript {
    private static class DecompileTarget {
        long address;
        String name;
        String desc;
        DecompileTarget(long a, String n, String d) {
            this.address = a;
            this.name = n;
            this.desc = d;
        }
    }

    @Override
    public void run() throws Exception {
        String[] args = getScriptArgs();
        String outDirPath = "/tmp/decompiled_c";
        if (args != null && args.length > 0 && !args[0].isEmpty()) {
            outDirPath = args[0];
        }

        File outDir = new File(outDirPath);
        if (!outDir.exists()) {
            outDir.mkdirs();
        }

        println("=== Evo X Batch C Decompiler Starting ===");
        println("Output Directory: " + outDir.getAbsolutePath());

        DecompInterface decomp = new DecompInterface();
        decomp.openProgram(currentProgram);

        List<DecompileTarget> targets = new ArrayList<>();

        if (args != null && args.length >= 3 && args[1].startsWith("0x")) {
            // Single target passed via CLI: [outDir, 0xAddress, functionName]
            long customAddr = Long.decode(args[1]);
            String customName = args[2];
            targets.add(new DecompileTarget(customAddr, customName, "Custom Specified Routine"));
        } else {
            // Default core engine subsystems
            targets.add(new DecompileTarget(0x022A80L, "fuel_calculate_pulse_width", "Main Fuel Injection Pulse Width & Target AFR Pipeline"));
            targets.add(new DecompileTarget(0x02FDC4L, "map_load_calc_and_blend_engine", "Core MAF and MAP Engine Load Calculation and Blending Pipeline"));
            targets.add(new DecompileTarget(0x030B2CL, "ipw_minimum_clamp_pipeline", "Minimum Injector Pulse Width Clamp and Multi-Cylinder Dispatch"));
            targets.add(new DecompileTarget(0x024924L, "injector_pulse_width_calc", "Decel Fuel Cut-Off (DFCO) and Rev Limiter Pulse Zeroing"));
            targets.add(new DecompileTarget(0x0D0200L, "rax_fast_logging", "Rich RAX Fast Logging Subroutine (32-Variable Mode 23 Packing)"));
            targets.add(new DecompileTarget(0x0FBA70L, "tephramod_load_dispatcher", "TephraMOD v3 Knock Throttle Saver and Load Limiter"));
            targets.add(new DecompileTarget(0x04E1A8L, "table_interpolate_2d_and_3d", "Core 2D Curve and 3D Surface Interpolation Engine"));
            targets.add(new DecompileTarget(0x04E330L, "map_select_and_interpolate_3d", "3D Map Table Pointer Selection and Dispatch"));
            targets.add(new DecompileTarget(0x0FB000L, "tephramod_v3_map_dispatcher", "TephraMOD v3 Live Tuning & Alternate Map Selector"));
            targets.add(new DecompileTarget(0x011150L, "ecu_main_loop_dispatch_hook", "Primary ECU Task Loop & TephraMOD Branch Hook"));
            targets.add(new DecompileTarget(0x03860CL, "maf_scaling_and_airflow_calc", "MAF Voltage Linear Interpolation & Cylinder Airflow Accumulator"));
            targets.add(new DecompileTarget(0x01A7D8L, "map_tables_evaluator_3d", "3D MAP Sensor Load Surface Evaluation & Transient Throttle State Machine"));
            targets.add(new DecompileTarget(0x015860L, "load_filter_coefficient_calc", "Dynamic Load Lag Filter Alpha Selector & Boost Error Table Evaluator"));
            targets.add(new DecompileTarget(0x04DC64L, "load_clamp_or_blend", "Master Engine Load Envelope Clamping Engine (MAF clamped by MAP/IMAP)"));
            targets.add(new DecompileTarget(0x04E050L, "load_filter_lag_engine", "First-Order Discrete Load Low-Pass Lag Filter"));
            targets.add(new DecompileTarget(0x04CBE0L, "coolant_temp_axis_evaluator", "Engine Coolant Temperature (ECT) Axis Breakpoint Evaluator"));
            targets.add(new DecompileTarget(0x068000L, "axis_breakpoint_lookup", "Universal 1D Axis Binary Search & Breakpoint Interpolator"));
            targets.add(new DecompileTarget(0x022B80L, "cylinder_fuel_trims_evaluator", "Individual Per-Cylinder Fuel Trims Routine"));
        }

        FunctionManager fm = currentProgram.getFunctionManager();
        int successCount = 0;

        for (DecompileTarget t : targets) {
            Address addr = toAddr(t.address);
            if (addr == null) continue;

            Function f = fm.getFunctionAt(addr);
            if (f == null) {
                disassemble(addr);
                f = createFunction(addr, t.name);
            }

            if (f == null) {
                println("[-] Could not create function at " + addr);
                continue;
            }

            println("[*] Decompiling " + t.name + " at " + addr + " (" + t.desc + ")...");
            DecompileResults res = decomp.decompileFunction(f, 60, monitor);

            if (res != null && res.decompileCompleted()) {
                String cCode = res.getDecompiledFunction().getC();
                File targetFile = new File(outDir, t.name + ".c");
                PrintWriter pw = new PrintWriter(targetFile);

                pw.println("/**");
                pw.println(" * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine");
                pw.println(" * Function: " + t.name);
                pw.println(" * Address:  0x" + Long.toHexString(t.address).toUpperCase());
                pw.println(" * Description: " + t.desc);
                pw.println(" * Microcontroller: Renesas M32186F8 (M32R Architecture)");
                pw.println(" * Generated via Ghidra Decompiler Pipeline");
                pw.println(" */");
                pw.println();
                pw.println("#include <stdint.h>");
                pw.println("#include <stdbool.h>");
                pw.println();
                pw.println(cCode);
                pw.close();

                println("[+] Successfully wrote " + targetFile.getName() + " (" + targetFile.length() + " bytes)");
                successCount++;
            } else {
                println("[-] Decompilation error for " + t.name + ": " + (res != null ? res.getErrorMessage() : "null"));
            }
        }

        println("=== Finished: " + successCount + " / " + targets.size() + " functions decompiled to C ===");
    }
}
