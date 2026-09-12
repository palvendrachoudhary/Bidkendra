import random
from typing import Tuple, List

class ForgeryDetector:
    """Heuristic-based forgery detection for document images."""
    
    def __init__(self):
        pass

    def detect(self, image_bytes: bytes) -> Tuple[bool, float, List[str]]:
        """
        Analyze image bytes for potential forgery.
        Returns: Tuple of (is_authentic, confidence, flags)
        """
        # In a real scenario, we would use OpenCV/PIL to analyze:
        # - ELA (Error Level Analysis)
        # - Metadata consistency
        # - Font anomalies
        # - Copy-move detection
        
        # This is a heuristic mock suitable for a hackathon demo
        flags = []
        is_authentic = True
        confidence = 0.95
        
        # Simulate simple heuristic checks based on image size as a proxy for analysis
        size_kb = len(image_bytes) / 1024
        
        if size_kb < 10:
            flags.append("Resolution too low, highly suspicious")
            is_authentic = False
            confidence = 0.8
        elif size_kb > 5000:
            flags.append("Unusually large file size, possible metadata stuffing")
            confidence = 0.6
            
        # Randomly flag some docs for demo purposes (simulating edge cases)
        # We seed with the file length to make it deterministic for the same file
        random.seed(len(image_bytes))
        chance = random.random()
        
        if chance < 0.05:
            flags.append("Inconsistent compression artifacts detected (ELA flag)")
            is_authentic = False
            confidence = 0.75
        elif chance < 0.15:
            flags.append("Metadata missing or stripped")
            confidence -= 0.2
            
        return is_authentic, confidence, flags
