"""Code embedding service using sentence-transformers."""
from functools import lru_cache
import numpy as np

# Lazy loading of the model
_model = None


def _get_model():
    """Lazy load the embedding model."""
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        from app.config import get_settings
        settings = get_settings()
        _model = SentenceTransformer(settings.embedding_model)
    return _model


async def get_embedding(text: str) -> list[float]:
    """
    Generate embedding for a code snippet or query.

    Args:
        text: Code or natural language query

    Returns:
        List of floats representing the embedding vector
    """
    model = _get_model()
    embedding = model.encode(text, convert_to_numpy=True)
    return embedding.tolist()


async def get_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for multiple texts in batch.

    Args:
        texts: List of code snippets or queries

    Returns:
        List of embedding vectors
    """
    model = _get_model()
    embeddings = model.encode(texts, convert_to_numpy=True)
    return embeddings.tolist()


def cosine_similarity(vec1: list[float], vec2: list[float]) -> float:
    """Calculate cosine similarity between two vectors."""
    a = np.array(vec1)
    b = np.array(vec2)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
