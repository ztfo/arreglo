import { ArrangementData } from '../types';
import { JSONExportService } from './json-export';
import { MIDIExportService } from './midi-export';
import { CSVExportService } from './csv-export';

// Export format types
export type ExportFormat = 'json' | 'midi' | 'mid' | 'csv' | 'flp' | 'als';

// Base export service interface
export interface ExportService {
    export(arrangement: ArrangementData): Promise<ExportResult>;
    getFileExtension(): string;
    getMimeType(): string;
    getDisplayName(): string;
}

// Export result interface
export interface ExportResult {
    data: string | ArrayBuffer | Uint8Array;
    filename: string;
    mimeType: string;
    success: boolean;
    error?: string;
}

// Export options interface
export interface ExportOptions {
    format: ExportFormat;
    includeMetadata?: boolean;
    tempo?: number;
    timeSignature?: [number, number];
    quantization?: number; // For MIDI export
}

// Main export manager class
export class ExportManager {
    private static services: Map<ExportFormat, ExportService> = new Map();

    // Initialize default export services
    static {
        ExportManager.registerService('json', new JSONExportService());
        ExportManager.registerService('midi', new MIDIExportService());
        ExportManager.registerService('csv', new CSVExportService());
    }

    /**
     * Register a new export service
     */
    static registerService(format: ExportFormat, service: ExportService): void {
        this.services.set(format, service);
    }

    /**
     * Get available export formats
     */
    static getAvailableFormats(): Array<{ format: ExportFormat; displayName: string }> {
        return Array.from(this.services.entries()).map(([format, service]) => ({
            format,
            displayName: service.getDisplayName()
        }));
    }

    /**
     * Export arrangement in specified format
     */
    static async exportArrangement(
        arrangement: ArrangementData,
        options: ExportOptions
    ): Promise<ExportResult> {
        const service = this.services.get(options.format);
        
        if (!service) {
            return {
                data: '',
                filename: '',
                mimeType: '',
                success: false,
                error: `Export format '${options.format}' not supported`
            };
        }

        try {
            const result = await service.export(arrangement);
            return result;
        } catch (error) {
            console.error(`Export failed for format ${options.format}:`, error);
            return {
                data: '',
                filename: '',
                mimeType: '',
                success: false,
                error: error instanceof Error ? error.message : 'Unknown export error'
            };
        }
    }

    /**
     * Download exported file in browser
     */
    static downloadFile(result: ExportResult): void {
        if (!result.success) {
            throw new Error(result.error || 'Export failed');
        }

        const blob = new Blob([result.data], { type: result.mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }
}

// Utility functions for export services
export class ExportUtils {
    /**
     * Generate safe filename from arrangement title
     */
    static generateFilename(title: string, format: ExportFormat): string {
        const safeTitle = title
            .replace(/[^a-zA-Z0-9\s\-_]/g, '')
            .replace(/\s+/g, '_')
            .toLowerCase();
        
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        return `${safeTitle}_${timestamp}.${format}`;
    }

    /**
     * Calculate total arrangement duration in bars
     */
    static getTotalDuration(arrangement: ArrangementData): number {
        return arrangement.sections.reduce((total, section) => total + section.duration, 0);
    }

    /**
     * Get all unique instruments from arrangement
     */
    static getUniqueInstruments(arrangement: ArrangementData): string[] {
        const instruments = new Set<string>();
        arrangement.sections.forEach(section => {
            Object.keys(section.instruments).forEach(instrument => {
                instruments.add(instrument);
            });
        });
        return Array.from(instruments);
    }

    /**
     * Convert bar numbers to timeline positions
     */
    static convertBarsToTimeline(bars: number[], sectionStart: number): number[] {
        return bars.map(bar => sectionStart + bar - 1);
    }
} 