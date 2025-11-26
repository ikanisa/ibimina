/**
 * Tauri Desktop Integration
 * 
 * This module provides type-safe bindings to the Tauri Rust backend
 * for desktop-specific functionality.
 */

export * from './commands';

// Re-export commonly used Tauri APIs
export { invoke } from '@tauri-apps/api/tauri';
export { listen, emit } from '@tauri-apps/api/event';
export { appWindow } from '@tauri-apps/api/window';
