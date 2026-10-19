import cv2
import numpy as np
import random
import wave
import struct
import os
import subprocess

# --- CONFIGURATION ---
WIDTH, HEIGHT = 1280, 720  
FPS = 60                   
ARRAY_SIZE = 100           # Reduced slightly to make audio tracking punchier
VIDEO_ONLY_FILENAME = "temp_video.mp4"
AUDIO_ONLY_FILENAME = "temp_audio.wav"
FINAL_OUTPUT_FILENAME = "sorting_algorithms.mp4"

# Audio Settings
SAMPLE_RATE = 44100  # 44.1kHz standard CD quality
DURATION_PER_FRAME = 1.0 / FPS

# Colors (BGR Format)
BG_COLOR = (25, 25, 25)        
BAR_COLOR = (220, 160, 60)     
COMP_COLOR = (40, 50, 255)     
SORTED_COLOR = (90, 210, 90)   
TEXT_COLOR = (255, 255, 255)   
HEADER_BG = (40, 40, 40)       

class SoundSortVisualizer:
    def __init__(self, width, height, fps, array_size):
        self.width = width
        self.height = height
        self.fps = fps
        self.array_size = array_size
        self.current_algo_name = ""
        
        # Initialize OpenCV Video Writer
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        self.video_writer = cv2.VideoWriter(VIDEO_ONLY_FILENAME, fourcc, fps, (width, height))
        
        # Initialize Audio Storage
        self.audio_frames = []
        
        self.arr = []
        self.bar_width = width / array_size

    def reset_and_shuffle(self, algo_name):
        self.current_algo_name = algo_name
        self.arr = list(range(1, self.array_size + 1))
        random.shuffle(self.arr)
        
        if algo_name in ["Bubble Sort", "Selection Sort", "Insertion Sort"]:
            self.throttle = 4  
        else:
            self.throttle = 1  

    def generate_beep_data(self, value):
        """Generates raw sine wave audio bytes for a specific pitch value."""
        if value is None or value <= 0:
            # Silence frame
            return b'\x00' * int(SAMPLE_RATE * DURATION_PER_FRAME * 2)
            
        # Map array value (1 to ARRAY_SIZE) to a musical frequency (150Hz to 900Hz)
        min_freq = 150
        max_freq = 900
        frequency = min_freq + (value / self.array_size) * (max_freq - min_freq)
        
        num_samples = int(SAMPLE_RATE * DURATION_PER_FRAME)
        audio_data = []
        
        for i in range(num_samples):
            # Calculate sine wave value
            t = float(i) / SAMPLE_RATE
            sample = np.sin(2.0 * np.pi * frequency * t)
            
            # Apply a quick fade-out envelope to avoid ugly audio clicking sounds
            envelope = 1.0
            if i > num_samples * 0.8:
                envelope = 1.0 - ((i - num_samples * 0.8) / (num_samples * 0.2))
                
            # Convert float to 16-bit signed integer bytes (-32768 to 32767)
            integer_sample = int(sample * 12000 * envelope) # 12000 controls max volume
            audio_data.append(integer_sample)
            
        return struct.pack(f'<{num_samples}h', *audio_data)

    def draw_frame(self, highlights=None, sorted_up_to=-1, complete=False):
        """Renders video frame and appends matching audio pitch segment."""
        # 1. Capture the audio pitch of whatever index is being highlighted
        pitch_val = None
        if highlights and len(highlights) > 0:
            pitch_val = self.arr[highlights[0]]
        elif sorted_up_to != -1:
            pitch_val = sorted_up_to
            
        self.audio_frames.append(self.generate_beep_data(pitch_val))

        # 2. Render Video Graphic
        frame = np.zeros((self.height, self.width, 3), dtype=np.uint8)
        frame[:] = BG_COLOR
        cv2.rectangle(frame, (0, 0), (self.width, 80), HEADER_BG, -1)
        
        cv2.putText(
            frame, f"ALGORITMO: {self.current_algo_name.upper()}", 
            (40, 52), cv2.FONT_HERSHEY_DUPLEX, 1.1, TEXT_COLOR, 2, cv2.LINE_AA
        )
        
        max_val = self.array_size
        usable_height = self.height - 100
        
        for i, val in enumerate(self.arr):
            x1 = int(i * self.bar_width)
            x2 = int((i + 1) * self.bar_width) - 1
            bar_height = int((val / max_val) * usable_height)
            y1 = self.height - bar_height
            y2 = self.height
            
            color = BAR_COLOR
            if complete:
                color = SORTED_COLOR
            elif sorted_up_to != -1 and i <= sorted_up_to:
                color = SORTED_COLOR
            elif highlights and i in highlights:
                color = COMP_COLOR
                
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, -1)
            
        self.video_writer.write(frame)

    def play_completion_sweep(self):
        for i in range(self.array_size):
            if i % 2 == 0:
                self.draw_frame(sorted_up_to=i)
        for _ in range(self.fps * 1):  # Hold 1 second of silence/success at the end
            self.draw_frame(complete=True)

    def finalize_and_merge(self):
        """Closes writing handles and stitches raw audio and video tracks together."""
        self.video_writer.release()
        
        # Save accumulated sound bites to a temporary wav file
        print("Writing synthesized audio track...")
        with wave.open(AUDIO_ONLY_FILENAME, 'wb') as wav_out:
            wav_out.setnchannels(1)  # Mono channel
            wav_out.setsampwidth(2)  # 16-bit
            wav_out.setframerate(SAMPLE_RATE)
            wav_out.writeframes(b"".join(self.audio_frames))
            
        print("Merging tracks using FFmpeg...")
        # Call system FFmpeg to bind video and audio streams seamlessly without re-encoding
        cmd = [
            'ffmpeg', '-y', 
            '-i', VIDEO_ONLY_FILENAME, 
            '-i', AUDIO_ONLY_FILENAME, 
            '-c:v', 'copy', '-c:a', 'aac', 
            FINAL_OUTPUT_FILENAME
        ]
        
        try:
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
            print(f"\nSuccess! Audio-visual master track created: {FINAL_OUTPUT_FILENAME}")
        except FileNotFoundError:
            print("\nError: FFmpeg is not installed on this system. Tracks could not be auto-merged.")
            print(f"You can find raw outputs here:\n Video: {VIDEO_ONLY_FILENAME}\n Audio: {AUDIO_ONLY_FILENAME}")
            return
            
        # Cleanup temporary scratchpad files
        if os.path.exists(VIDEO_ONLY_FILENAME): os.remove(VIDEO_ONLY_FILENAME)
        if os.path.exists(AUDIO_ONLY_FILENAME): os.remove(AUDIO_ONLY_FILENAME)

    # --- THE BIG 6 ALGORITHMS ---

    def bubble_sort(self):
        self.reset_and_shuffle("Bubble Sort (Ordenação Bolha?)")
        n = len(self.arr)
        step = 0
        for i in range(n):
            for j in range(0, n - i - 1):
                if self.arr[j] > self.arr[j + 1]:
                    self.arr[j], self.arr[j + 1] = self.arr[j + 1], self.arr[j]
                step += 1
                if step % self.throttle == 0:
                    self.draw_frame(highlights=[j, j + 1])
        self.play_completion_sweep()

    def selection_sort(self):
        self.reset_and_shuffle("Selection Sort (Ordenação de Seleção)")
        n = len(self.arr)
        step = 0
        for i in range(n):
            min_idx = i
            for j in range(i + 1, n):
                if self.arr[j] < self.arr[min_idx]:
                    min_idx = j
                step += 1
                if step % self.throttle == 0:
                    self.draw_frame(highlights=[j, min_idx])
            self.arr[i], self.arr[min_idx] = self.arr[min_idx], self.arr[i]
        self.play_completion_sweep()

    def insertion_sort(self):
        self.reset_and_shuffle("Insertion Sort (Ordenação de Inserção)")
        step = 0
        for i in range(1, len(self.arr)):
            key = self.arr[i]
            j = i - 1
            while j >= 0 and key < self.arr[j]:
                self.arr[j + 1] = self.arr[j]
                j -= 1
                step += 1
                if step % self.throttle == 0:
                    self.draw_frame(highlights=[j + 1, i])
            self.arr[j + 1] = key
        self.play_completion_sweep()

    def merge_sort(self):
        self.reset_and_shuffle("Merge Sort (Ordenação de FuuuuuSão)")
        def _merge_sort(sub_arr, start_idx):
            if len(sub_arr) > 1:
                mid = len(sub_arr) // 2
                L = sub_arr[:mid]
                R = sub_arr[mid:]
                _merge_sort(L, start_idx)
                _merge_sort(R, start_idx + mid)
                i = j = k = 0
                while i < len(L) and j < len(R):
                    if L[i] < R[j]:
                        sub_arr[k] = L[i]
                        i += 1
                    else:
                        sub_arr[k] = R[j]
                        j += 1
                    k += 1
                    self.draw_frame(highlights=[start_idx + k])
                while i < len(L):
                    sub_arr[k] = L[i]; i += 1; k += 1
                while j < len(R):
                    sub_arr[k] = R[j]; j += 1; k += 1
                for idx in range(len(sub_arr)):
                    self.arr[start_idx + idx] = sub_arr[idx]
        _merge_sort(self.arr, 0)
        self.play_completion_sweep()

    def quick_sort(self):
        self.reset_and_shuffle("Quick Sort (Ordenação Rápida, mas é lenta...)")
        def _quick_sort(low, high):
            if low < high:
                pivot_idx = _partition(low, high)
                _quick_sort(low, pivot_idx - 1)
                _quick_sort(pivot_idx + 1, high)
        def _partition(low, high):
            pivot = self.arr[high]
            i = low - 1
            for j in range(low, high):
                self.draw_frame(highlights=[j, high])
                if self.arr[j] < pivot:
                    i += 1
                    self.arr[i], self.arr[j] = self.arr[j], self.arr[i]
            self.arr[i + 1], self.arr[high] = self.arr[high], self.arr[i + 1]
            return i + 1
        _quick_sort(0, len(self.arr) - 1)
        self.play_completion_sweep()

    def heap_sort(self):
        self.reset_and_shuffle("Heap Sort (Ordenação Heap, o goat)")
        n = len(self.arr)
        def _heapify(size, root_idx):
            largest = root_idx
            left = 2 * root_idx + 1
            right = 2 * root_idx + 2
            if left < size and self.arr[left] > self.arr[largest]: largest = left
            if right < size and self.arr[right] > self.arr[largest]: largest = right
            if largest != root_idx:
                self.arr[root_idx], self.arr[largest] = self.arr[largest], self.arr[root_idx]
                self.draw_frame(highlights=[root_idx, largest])
                _heapify(size, largest)
        for i in range(n // 2 - 1, -1, -1): _heapify(n, i)
        for i in range(n - 1, 0, -1):
            self.arr[i], self.arr[0] = self.arr[0], self.arr[i]
            self.draw_frame(highlights=[0, i])
            _heapify(i, 0)
        self.play_completion_sweep()

if __name__ == "__main__":
    print("Beginning audio-visual array layout rendering sequence...")
    engine = SoundSortVisualizer(width=WIDTH, height=HEIGHT, fps=FPS, array_size=ARRAY_SIZE)
    
    engine.bubble_sort()
    engine.selection_sort()
    engine.insertion_sort()
    engine.merge_sort()
    engine.quick_sort()
    engine.heap_sort()
    
    engine.finalize_and_merge()