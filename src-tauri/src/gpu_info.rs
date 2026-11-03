// src-tauri/src/gpu_info.rs (or wherever you prefer to keep it)

use std::process::Command;

// You can keep get_gpu_info public if you still need it elsewhere, or make it a helper function
pub fn get_gpu_info() -> Vec<String> {
    let mut gpu_info = Vec::new();

    if cfg!(target_os = "windows") {
        if let Ok(output) = Command::new("wmic")
            .args(&["path", "win32_VideoController", "get", "Name,AdapterRAM"])
            .output()
        {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines().skip(1) {
                let trimmed = line.trim();
                if !trimmed.is_empty() {
                    gpu_info.push(trimmed.to_string());
                }
            }
        }
    } else if cfg!(target_os = "macos") {
        if let Ok(output) = Command::new("system_profiler")
            .arg("SPDisplaysDataType")
            .output()
        {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let mut current_gpu = String::new();
            for line in stdout.lines() {
                if line.contains("Chipset Model:") {
                    current_gpu = line.replace("Chipset Model:", "").trim().to_string();
                }
                if line.contains("VRAM (Total):") && !current_gpu.is_empty() {
                    let vram = line.replace("VRAM (Total):", "").trim().to_string();
                    gpu_info.push(format!("{} (VRAM: {})", current_gpu, vram));
                    current_gpu.clear();
                }
            }
            if !current_gpu.is_empty() {
                gpu_info.push(current_gpu);
            }
        }
    } else {
        if let Ok(output) = Command::new("sh")
            .args(&["-c", "lshw -C display | grep product"])
            .output()
        {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines() {
                let clean = line.replace("product:", "").trim().to_string();
                if !clean.is_empty() {
                    gpu_info.push(clean);
                }
            }
        }
    }

    if gpu_info.is_empty() {
        gpu_info.push("Unknown GPU Configuration".to_string());
    }

    gpu_info
}

/// Single Tauri command that automatically detects the GPU and picks the right encoder
#[tauri::command]
pub fn select_best_encoder() -> String {
    let os = std::env::consts::OS;

    // macOS always uses VideoToolbox for Apple Silicon / Intel Macs
    if os == "macos" {
        return "hevc_videotoolbox".to_string();
    }

    // Fetch the detected GPUs
    let gpus = get_gpu_info();

    // Combine all detected GPU strings into a single lowercase search space
    let combined_gpu_info = gpus.join(" ").to_lowercase();

    if combined_gpu_info.contains("nvidia") {
        "hevc_nvenc".to_string()
    } else if combined_gpu_info.contains("amd") || combined_gpu_info.contains("radeon") {
        "hevc_amf".to_string()
    } else if combined_gpu_info.contains("intel") {
        "hevc_qsv".to_string()
    } else {
        // Safe CPU fallback if no dedicated hardware encoder matches
        "libx265".to_string()
    }
}
