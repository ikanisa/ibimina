use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PrinterInfo {
    pub name: String,
    pub is_default: bool,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ReceiptData {
    pub title: String,
    pub items: Vec<ReceiptItem>,
    pub total: String,
    pub footer: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ReceiptItem {
    pub label: String,
    pub value: String,
}

/// List available printers on the system
#[tauri::command]
pub async fn get_printers() -> Result<Vec<PrinterInfo>, String> {
    #[cfg(target_os = "windows")]
    {
        get_printers_windows()
    }

    #[cfg(target_os = "macos")]
    {
        get_printers_macos()
    }

    #[cfg(target_os = "linux")]
    {
        get_printers_linux()
    }
}

#[cfg(target_os = "windows")]
fn get_printers_windows() -> Result<Vec<PrinterInfo>, String> {
    let output = Command::new("wmic")
        .args(["printer", "get", "name,default,status", "/format:csv"])
        .output()
        .map_err(|e| format!("Failed to execute wmic: {}", e))?;

    if !output.status.success() {
        return Err("Failed to query printers".to_string());
    }

    let output_str = String::from_utf8_lossy(&output.stdout);
    let mut printers = Vec::new();

    for line in output_str.lines().skip(2) {
        // Skip header and empty line
        if line.trim().is_empty() {
            continue;
        }

        let parts: Vec<&str> = line.split(',').collect();
        if parts.len() >= 3 {
            printers.push(PrinterInfo {
                name: parts[1].trim().to_string(),
                is_default: parts[0].trim().eq_ignore_ascii_case("TRUE"),
                status: parts[2].trim().to_string(),
            });
        }
    }

    Ok(printers)
}

#[cfg(target_os = "macos")]
fn get_printers_macos() -> Result<Vec<PrinterInfo>, String> {
    let output = Command::new("lpstat")
        .args(["-p", "-d"])
        .output()
        .map_err(|e| format!("Failed to execute lpstat: {}", e))?;

    if !output.status.success() {
        return Err("Failed to query printers".to_string());
    }

    let output_str = String::from_utf8_lossy(&output.stdout);
    let mut printers = Vec::new();
    let mut default_printer = String::new();

    for line in output_str.lines() {
        if line.starts_with("system default destination:") {
            default_printer = line
                .split(':')
                .nth(1)
                .unwrap_or("")
                .trim()
                .to_string();
        } else if line.starts_with("printer") {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 2 {
                let name = parts[1].to_string();
                printers.push(PrinterInfo {
                    name: name.clone(),
                    is_default: name == default_printer,
                    status: if line.contains("idle") {
                        "Ready".to_string()
                    } else {
                        "Unknown".to_string()
                    },
                });
            }
        }
    }

    Ok(printers)
}

#[cfg(target_os = "linux")]
fn get_printers_linux() -> Result<Vec<PrinterInfo>, String> {
    let output = Command::new("lpstat")
        .args(["-p", "-d"])
        .output()
        .map_err(|e| format!("Failed to execute lpstat: {}", e))?;

    if !output.status.success() {
        return Err("Failed to query printers".to_string());
    }

    let output_str = String::from_utf8_lossy(&output.stdout);
    let mut printers = Vec::new();
    let mut default_printer = String::new();

    for line in output_str.lines() {
        if line.starts_with("system default destination:") {
            default_printer = line
                .split(':')
                .nth(1)
                .unwrap_or("")
                .trim()
                .to_string();
        } else if line.starts_with("printer") {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 2 {
                let name = parts[1].to_string();
                printers.push(PrinterInfo {
                    name: name.clone(),
                    is_default: name == default_printer,
                    status: if line.contains("idle") {
                        "Ready".to_string()
                    } else {
                        "Unknown".to_string()
                    },
                });
            }
        }
    }

    Ok(printers)
}

/// Print HTML content to selected printer
#[tauri::command]
pub async fn print_html(
    printer_name: String,
    html_content: String,
) -> Result<(), String> {
    // Create temporary HTML file
    let temp_dir = std::env::temp_dir();
    let file_path = temp_dir.join("print_temp.html");
    
    std::fs::write(&file_path, html_content)
        .map_err(|e| format!("Failed to write temp file: {}", e))?;

    #[cfg(target_os = "windows")]
    {
        // Use Microsoft Edge to print on Windows
        Command::new("msedge")
            .args([
                "--headless",
                "--print-to-pdf-no-header",
                &format!("--print-to-pdf={}", file_path.with_extension("pdf").display()),
                &file_path.display().to_string(),
            ])
            .output()
            .map_err(|e| format!("Failed to print: {}", e))?;
    }

    #[cfg(any(target_os = "macos", target_os = "linux"))]
    {
        Command::new("lp")
            .args(["-d", &printer_name, &file_path.display().to_string()])
            .output()
            .map_err(|e| format!("Failed to print: {}", e))?;
    }

    // Clean up temp file
    let _ = std::fs::remove_file(&file_path);

    Ok(())
}

/// Generate and print thermal receipt (ESC/POS compatible)
#[tauri::command]
pub async fn print_receipt(
    printer_name: String,
    receipt_data: ReceiptData,
) -> Result<(), String> {
    // Generate ESC/POS commands
    let mut commands: Vec<u8> = Vec::new();

    // Initialize printer
    commands.extend_from_slice(&[0x1B, 0x40]); // ESC @

    // Center align
    commands.extend_from_slice(&[0x1B, 0x61, 0x01]); // ESC a 1

    // Bold title
    commands.extend_from_slice(&[0x1B, 0x45, 0x01]); // ESC E 1
    commands.extend_from_slice(receipt_data.title.as_bytes());
    commands.extend_from_slice(&[0x1B, 0x45, 0x00]); // ESC E 0
    commands.extend_from_slice(b"\n\n");

    // Left align for items
    commands.extend_from_slice(&[0x1B, 0x61, 0x00]); // ESC a 0

    // Print items
    for item in receipt_data.items {
        let line = format!("{}: {}\n", item.label, item.value);
        commands.extend_from_slice(line.as_bytes());
    }

    commands.extend_from_slice(b"\n");
    commands.extend_from_slice(b"--------------------------------\n");

    // Bold total
    commands.extend_from_slice(&[0x1B, 0x45, 0x01]); // ESC E 1
    let total_line = format!("TOTAL: {}\n", receipt_data.total);
    commands.extend_from_slice(total_line.as_bytes());
    commands.extend_from_slice(&[0x1B, 0x45, 0x00]); // ESC E 0

    commands.extend_from_slice(b"\n");

    // Center align footer
    commands.extend_from_slice(&[0x1B, 0x61, 0x01]); // ESC a 1
    commands.extend_from_slice(receipt_data.footer.as_bytes());
    commands.extend_from_slice(b"\n\n\n");

    // Cut paper
    commands.extend_from_slice(&[0x1D, 0x56, 0x00]); // GS V 0

    // Write to printer (platform-specific)
    #[cfg(target_os = "windows")]
    {
        // On Windows, write directly to printer port
        use std::fs::OpenOptions;
        use std::io::Write;
        
        let printer_path = format!("\\\\.\\{}", printer_name);
        let mut file = OpenOptions::new()
            .write(true)
            .open(&printer_path)
            .map_err(|e| format!("Failed to open printer: {}", e))?;
        
        file.write_all(&commands)
            .map_err(|e| format!("Failed to write to printer: {}", e))?;
    }

    #[cfg(any(target_os = "macos", target_os = "linux"))]
    {
        // On Unix, use lp command
        let temp_file = std::env::temp_dir().join("receipt.bin");
        std::fs::write(&temp_file, &commands)
            .map_err(|e| format!("Failed to write receipt: {}", e))?;

        Command::new("lp")
            .args(["-d", &printer_name, "-o", "raw", &temp_file.display().to_string()])
            .output()
            .map_err(|e| format!("Failed to print receipt: {}", e))?;

        let _ = std::fs::remove_file(&temp_file);
    }

    Ok(())
}
