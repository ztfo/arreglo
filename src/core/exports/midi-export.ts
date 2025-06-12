import { ArrangementData } from '../types';
import { ExportService, ExportResult } from './index';
import { ExportUtils } from './index';

// MIDI constants
const MIDI_HEADER_SIZE = 14;
const MIDI_TRACK_HEADER_SIZE = 8;
const TICKS_PER_QUARTER = 480; // Standard MIDI resolution

// MIDI event types
const MIDI_NOTE_ON = 0x90;
const MIDI_NOTE_OFF = 0x80;
const MIDI_PROGRAM_CHANGE = 0xC0;
const MIDI_META_EVENT = 0xFF;
const MIDI_TRACK_NAME = 0x03;
const MIDI_END_OF_TRACK = 0x2F;

// Instrument to MIDI note mapping
const INSTRUMENT_MAPPING: { [key: string]: { note: number; channel: number } } = {
    'kick': { note: 36, channel: 9 }, // Bass drum
    'snare': { note: 38, channel: 9 }, // Snare drum
    'hihat': { note: 42, channel: 9 }, // Closed hi-hat
    'hi-hat': { note: 42, channel: 9 }, // Closed hi-hat
    'openhat': { note: 46, channel: 9 }, // Open hi-hat
    'crash': { note: 49, channel: 9 }, // Crash cymbal
    'ride': { note: 51, channel: 9 }, // Ride cymbal
    'bassline': { note: 60, channel: 1 }, // C4 (bass)
    'bass': { note: 60, channel: 1 }, // C4 (bass)
    'synth': { note: 72, channel: 2 }, // C5 (synth)
    'lead': { note: 84, channel: 3 }, // C6 (lead)
    'pad': { note: 48, channel: 4 }, // C3 (pad)
    'chord': { note: 60, channel: 5 }, // C4 (chords)
    'guitar': { note: 60, channel: 6 }, // C4 (guitar)
    'piano': { note: 60, channel: 7 }, // C4 (piano)
    'sample': { note: 60, channel: 8 }, // C4 (sample)
    'vox': { note: 60, channel: 8 }, // C4 (vocal)
    'vocal': { note: 60, channel: 8 }, // C4 (vocal)
};

interface MIDIEvent {
    deltaTime: number;
    event: Uint8Array;
}

export class MIDIExportService implements ExportService {
    
    getFileExtension(): string {
        return 'mid';
    }

    getMimeType(): string {
        return 'audio/midi';
    }

    getDisplayName(): string {
        return 'MIDI (DAW Compatible)';
    }

    async export(arrangement: ArrangementData): Promise<ExportResult> {
        try {
            const midiData = this.convertToMIDIFormat(arrangement);
            
            return {
                data: midiData,
                filename: ExportUtils.generateFilename(arrangement.title, 'mid'),
                mimeType: this.getMimeType(),
                success: true
            };
        } catch (error) {
            return {
                data: new Uint8Array(),
                filename: '',
                mimeType: '',
                success: false,
                error: error instanceof Error ? error.message : 'Failed to export MIDI'
            };
        }
    }

    private convertToMIDIFormat(arrangement: ArrangementData): Uint8Array {
        const tracks: Uint8Array[] = [];
        const instruments = ExportUtils.getUniqueInstruments(arrangement);
        
        // Create a track for each instrument
        instruments.forEach((instrument, index) => {
            const trackData = this.createInstrumentTrack(arrangement, instrument, index);
            tracks.push(trackData);
        });

        // Create MIDI file
        return this.createMIDIFile(tracks);
    }

    private createInstrumentTrack(
        arrangement: ArrangementData, 
        instrument: string, 
        trackIndex: number
    ): Uint8Array {
        const events: MIDIEvent[] = [];
        const mapping = this.getInstrumentMapping(instrument);
        
        // Add track name
        const trackName = this.createTrackNameEvent(instrument);
        events.push({ deltaTime: 0, event: trackName });

        // Add program change (instrument selection)
        const programChange = new Uint8Array([MIDI_PROGRAM_CHANGE | (mapping.channel - 1), 0]);
        events.push({ deltaTime: 0, event: programChange });

        // Convert arrangement to MIDI events
        let currentTick = 0;
        
        arrangement.sections.forEach(section => {
            const instrumentBars = section.instruments[instrument];
            if (instrumentBars) {
                instrumentBars.forEach(barNumber => {
                    const barStartTick = (barNumber - 1) * TICKS_PER_QUARTER * 4; // Assuming 4/4 time
                    const deltaTime = barStartTick - currentTick;
                    
                    // Note on
                    const noteOn = new Uint8Array([
                        MIDI_NOTE_ON | (mapping.channel - 1),
                        mapping.note,
                        100 // Velocity
                    ]);
                    events.push({ deltaTime, event: noteOn });
                    
                    // Note off (1 beat later)
                    const noteOff = new Uint8Array([
                        MIDI_NOTE_OFF | (mapping.channel - 1),
                        mapping.note,
                        0
                    ]);
                    events.push({ deltaTime: TICKS_PER_QUARTER, event: noteOff });
                    
                    currentTick = barStartTick + TICKS_PER_QUARTER;
                });
            }
        });

        // Add end of track
        const endOfTrack = new Uint8Array([MIDI_META_EVENT, MIDI_END_OF_TRACK, 0]);
        events.push({ deltaTime: 0, event: endOfTrack });

        return this.createTrackChunk(events);
    }

    private getInstrumentMapping(instrument: string): { note: number; channel: number } {
        const cleanName = instrument.toLowerCase().split(' - ')[0];
        
        for (const key in INSTRUMENT_MAPPING) {
            if (cleanName.includes(key)) {
                return INSTRUMENT_MAPPING[key];
            }
        }
        
        // Default mapping
        return { note: 60, channel: 1 };
    }

    private createTrackNameEvent(name: string): Uint8Array {
        const nameBytes = this.stringToBytes(name);
        const event = new Uint8Array(3 + nameBytes.length);
        event[0] = MIDI_META_EVENT;
        event[1] = MIDI_TRACK_NAME;
        event[2] = nameBytes.length;
        event.set(nameBytes, 3);
        return event;
    }

    private createTrackChunk(events: MIDIEvent[]): Uint8Array {
        // Calculate track data size
        let trackDataSize = 0;
        events.forEach(event => {
            trackDataSize += this.getVariableLengthSize(event.deltaTime) + event.event.length;
        });

        const track = new Uint8Array(MIDI_TRACK_HEADER_SIZE + trackDataSize);
        let offset = 0;

        // Track header
        track.set(this.stringToBytes('MTrk'), offset);
        offset += 4;
        
        // Track length (big-endian)
        const lengthBytes = new Uint8Array(4);
        new DataView(lengthBytes.buffer).setUint32(0, trackDataSize, false);
        track.set(lengthBytes, offset);
        offset += 4;

        // Track events
        events.forEach(event => {
            // Delta time
            const deltaTimeBytes = this.encodeVariableLength(event.deltaTime);
            track.set(deltaTimeBytes, offset);
            offset += deltaTimeBytes.length;
            
            // Event data
            track.set(event.event, offset);
            offset += event.event.length;
        });

        return track;
    }

    private createMIDIFile(tracks: Uint8Array[]): Uint8Array {
        const totalSize = MIDI_HEADER_SIZE + tracks.reduce((sum, track) => sum + track.length, 0);
        const midiFile = new Uint8Array(totalSize);
        let offset = 0;

        // MIDI header
        midiFile.set(this.stringToBytes('MThd'), offset);
        offset += 4;
        
        // Header length (always 6)
        midiFile.set(new Uint8Array([0, 0, 0, 6]), offset);
        offset += 4;
        
        // Format type (1 = multiple tracks)
        midiFile.set(new Uint8Array([0, 1]), offset);
        offset += 2;
        
        // Number of tracks
        const trackCountBytes = new Uint8Array(2);
        new DataView(trackCountBytes.buffer).setUint16(0, tracks.length, false);
        midiFile.set(trackCountBytes, offset);
        offset += 2;
        
        // Ticks per quarter note
        const ticksBytes = new Uint8Array(2);
        new DataView(ticksBytes.buffer).setUint16(0, TICKS_PER_QUARTER, false);
        midiFile.set(ticksBytes, offset);
        offset += 2;

        // Track data
        tracks.forEach(track => {
            midiFile.set(track, offset);
            offset += track.length;
        });

        return midiFile;
    }

    private encodeVariableLength(value: number): Uint8Array {
        const bytes: number[] = [];
        
        if (value === 0) {
            return new Uint8Array([0]);
        }
        
        while (value > 0) {
            bytes.unshift(value & 0x7F);
            value >>= 7;
        }
        
        // Set continuation bits (all except last byte)
        for (let i = 0; i < bytes.length - 1; i++) {
            bytes[i] |= 0x80;
        }
        
        return new Uint8Array(bytes);
    }

    private getVariableLengthSize(value: number): number {
        if (value === 0) return 1;
        let size = 0;
        while (value > 0) {
            size++;
            value >>= 7;
        }
        return size;
    }

    private stringToBytes(str: string): Uint8Array {
        const bytes = new Uint8Array(str.length);
        for (let i = 0; i < str.length; i++) {
            bytes[i] = str.charCodeAt(i) & 0xFF;
        }
        return bytes;
    }
} 