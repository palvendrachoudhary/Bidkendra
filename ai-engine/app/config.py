import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application configuration settings."""
    # General Settings
    APP_NAME: str = "GeM Bid Compliance AI Engine"
    DEBUG: bool = True
    
    # Model Paths (Placeholders)
    MODEL_DIR: str = os.getenv("MODEL_DIR", "./models")
    CLASSIFIER_MODEL_PATH: str = f"{MODEL_DIR}/doc_classifier.pkl"
    FORGERY_MODEL_PATH: str = f"{MODEL_DIR}/forgery_detector.pt"
    
    # API Keys
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # OCR Settings
    TESSERACT_CMD: str = os.getenv("TESSERACT_CMD", "tesseract")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

# Instantiate settings
settings = Settings()
