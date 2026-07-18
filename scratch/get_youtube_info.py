import urllib.request
import urllib.parse
import re
import json
from youtube_transcript_api import YouTubeTranscriptApi

def main():
    query = "Road America Gets Two Hours of GT Trouble Elkhart Lake 120 GRID UP"
    url = "https://www.youtube.com/results?search_query=" + urllib.parse.quote(query)
    
    print("Searching YouTube for:", query)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
            
        video_ids = re.findall(r"\"videoId\":\"([^\"]+)\"", html)
        if not video_ids:
            # Try alternative regex
            video_ids = re.findall(r"watch\?v=([a-zA-Z0-9_-]{11})", html)
            
        if video_ids:
            # Deduplicate
            unique_ids = list(dict.fromkeys(video_ids))
            print("Found video IDs:", unique_ids)
            video_id = unique_ids[0]
            print(f"Using video ID: {video_id}")
            print(f"URL: https://www.youtube.com/watch?v={video_id}")
            
            # Get video details / transcript
            try:
                transcript = YouTubeTranscriptApi.get_transcript(video_id)
                print("Successfully fetched transcript!")
                # Write to text file
                with open("elkhart_transcript.txt", "w", encoding="utf-8") as f:
                    for entry in transcript:
                        f.write(f"[{entry['start']:.2f}] {entry['text']}\n")
                print("Saved transcript to elkhart_transcript.txt")
            except Exception as e:
                print("Could not fetch transcript directly:", e)
                
        else:
            print("No video IDs found in search results.")
            
    except Exception as e:
        print("Error search:", e)

if __name__ == "__main__":
    main()
