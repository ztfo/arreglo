import { ArrangementData } from '../types';
import { ExportService, ExportResult } from './index';
import { ExportUtils } from './index';

// Extended JSON export format
interface JSONArrangementExport {
    metadata: {
        title: string;
        genre?: string;
        style?: string;
        exportedAt: string;
        exportVersion: string;
        totalBars: number;
        sections: number;
        instruments: number;
    };
    arrangement: {
        title: string;
        genre?: string;
        style?: string;
        sections: JSONSectionExport[];
    };
    timeline: {
        totalBars: number;
        instruments: string[];
        grid: JSONTimelineGrid;
    };
    rawData: {
        originalResponse: string;
    };
}

interface JSONSectionExport {
    name: string;
    startBar: number;
    duration: number;
    endBar: number;
    instruments: {
        [instrument: string]: {
            activeBars: number[];
            relativeActiveBars: number[];
            pattern: string;
        };
    };
}

interface JSONTimelineGrid {
    [instrument: string]: boolean[]; // true = active, false = inactive for each bar
}

export class JSONExportService implements ExportService {
    
    getFileExtension(): string {
        return 'json';
    }

    getMimeType(): string {
        return 'application/json';
    }

    getDisplayName(): string {
        return 'JSON (Structured Data)';
    }

    async export(arrangement: ArrangementData): Promise<ExportResult> {
        try {
            const exportData = this.convertToJSONFormat(arrangement);
            const jsonString = JSON.stringify(exportData, null, 2);
            
            return {
                data: jsonString,
                filename: ExportUtils.generateFilename(arrangement.title, 'json'),
                mimeType: this.getMimeType(),
                success: true
            };
        } catch (error) {
            return {
                data: '',
                filename: '',
                mimeType: '',
                success: false,
                error: error instanceof Error ? error.message : 'Failed to export JSON'
            };
        }
    }

    private convertToJSONFormat(arrangement: ArrangementData): JSONArrangementExport {
        const totalBars = ExportUtils.getTotalDuration(arrangement);
        const instruments = ExportUtils.getUniqueInstruments(arrangement);
        
        // Convert sections with absolute bar positions
        const sections: JSONSectionExport[] = [];
        let currentBar = 1;
        
        arrangement.sections.forEach(section => {
            const sectionExport: JSONSectionExport = {
                name: section.name,
                startBar: currentBar,
                duration: section.duration,
                endBar: currentBar + section.duration - 1,
                instruments: {}
            };

            // Convert instrument patterns to absolute bar positions
            for (const instrument in section.instruments) {
                const relativeBars = section.instruments[instrument];
                const absoluteBars = relativeBars.map((bar: number) => currentBar + bar - 1);
                sectionExport.instruments[instrument] = {
                    activeBars: absoluteBars,
                    relativeActiveBars: relativeBars,
                    pattern: this.extractPatternFromName(instrument)
                };
            }

            sections.push(sectionExport);
            currentBar += section.duration;
        });

        // Create timeline grid
        const grid: JSONTimelineGrid = {};
        instruments.forEach(instrument => {
            grid[instrument] = new Array(totalBars).fill(false);
        });

        // Fill grid with active bars
        sections.forEach(section => {
            for (const instrument in section.instruments) {
                const data = section.instruments[instrument];
                data.activeBars.forEach((bar: number) => {
                    if (bar >= 1 && bar <= totalBars) {
                        grid[instrument][bar - 1] = true;
                    }
                });
            }
        });

        return {
            metadata: {
                title: arrangement.title,
                genre: arrangement.genre,
                style: arrangement.style,
                exportedAt: new Date().toISOString(),
                exportVersion: '1.0.0',
                totalBars,
                sections: arrangement.sections.length,
                instruments: instruments.length
            },
            arrangement: {
                title: arrangement.title,
                genre: arrangement.genre,
                style: arrangement.style,
                sections
            },
            timeline: {
                totalBars,
                instruments,
                grid
            },
            rawData: {
                originalResponse: arrangement.rawResponse
            }
        };
    }

    private extractPatternFromName(instrumentName: string): string {
        // Extract pattern description from instrument name
        // e.g., "kick - 4x" -> "4x", "bassline - chords" -> "chords"
        const parts = instrumentName.split(' - ');
        return parts.length > 1 ? parts.slice(1).join(' - ') : 'standard';
    }
} 