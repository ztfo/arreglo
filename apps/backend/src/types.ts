export interface SongData {
  title: string;
  genre?: string;
  length: number; // bars
  tempo?: number;
  patterns: Array<{ name: string; bars?: number }>; // minimal for prompt
  selectedSections?: string[];
  creativity?: number; // 1-5
}
