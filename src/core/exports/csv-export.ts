import { ArrangementData } from '../types';
import { ExportService, ExportResult } from './index';
import { ExportUtils } from './index';

export class CSVExportService implements ExportService {
    
    getFileExtension(): string {
        return 'csv';
    }

    getMimeType(): string {
        return 'text/csv';
    }

    getDisplayName(): string {
        return 'CSV (Spreadsheet)';
    }

    async export(arrangement: ArrangementData): Promise<ExportResult> {
        try {
            const csvData = this.convertToCSVFormat(arrangement);
            
            return {
                data: csvData,
                filename: ExportUtils.generateFilename(arrangement.title, 'csv'),
                mimeType: this.getMimeType(),
                success: true
            };
        } catch (error) {
            return {
                data: '',
                filename: '',
                mimeType: '',
                success: false,
                error: error instanceof Error ? error.message : 'Failed to export CSV'
            };
        }
    }

    private convertToCSVFormat(arrangement: ArrangementData): string {
        const rows: string[][] = [];
        
        // Add header row
        rows.push([
            'Section',
            'Section_Start_Bar',
            'Section_Duration',
            'Instrument',
            'Pattern',
            'Active_Bars',
            'Total_Bars_In_Section'
        ]);

        // Add data rows
        let currentBar = 1;
        arrangement.sections.forEach(section => {
            for (const instrument in section.instruments) {
                const relativeBars = section.instruments[instrument];
                const pattern = this.extractPatternFromName(instrument);
                const activeBarsStr = relativeBars.join(';');

                rows.push([
                    section.name,
                    currentBar.toString(),
                    section.duration.toString(),
                    instrument,
                    pattern,
                    activeBarsStr,
                    section.duration.toString()
                ]);
            }
            currentBar += section.duration;
        });

        // Convert to CSV string
        return rows.map(row => this.escapeCSVRow(row)).join('\n');
    }

    private extractPatternFromName(instrumentName: string): string {
        // Extract pattern description from instrument name
        // e.g., "kick - 4x" -> "4x", "bassline - chords" -> "chords"
        const parts = instrumentName.split(' - ');
        return parts.length > 1 ? parts.slice(1).join(' - ') : 'standard';
    }

    private escapeCSVRow(row: string[]): string {
        return row.map(cell => {
            // Escape cells that contain commas, quotes, or newlines
            if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
        }).join(',');
    }
} 