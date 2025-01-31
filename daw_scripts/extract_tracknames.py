import json
import playlist
import patterns

export_json_path = "/Users/luispalomares/Documents/Image-Line/FL_Studio_Projects/fl_playlist.json"

def export_playlist_data():
    num_tracks = playlist.trackCount()
    num_patterns = patterns.patternNumber()

    pattern_list = []
    audio_list = []

    existing_patterns = set()
    for pattern_id in range(1, num_patterns + 1):
        pattern_name = patterns.getPatternName(pattern_id)
        if pattern_name.strip():
            existing_patterns.add(pattern_name)

    for track in range(num_tracks):
        track_name = playlist.getTrackName(track)

        if not track_name.strip():
            continue

        if track_name in existing_patterns:
            pattern_list.append(track_name)
        else:
            audio_list.append(track_name)

    export_data = {
        "patterns": pattern_list,
        "audio_clips": audio_list
    }
    
    with open(export_json_path, "w") as json_file:
        json.dump(export_data, json_file, indent=4)

    print(f"✅ Exported Playlist Data to {export_json_path}")
    print(f"🎛️ Used Patterns: {len(pattern_list)} | 🎵 Audio Clips: {len(audio_list)}")

export_playlist_data()