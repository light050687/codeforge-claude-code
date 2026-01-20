"""Code embedding service using sentence-transformers."""
import logging
import re
from functools import lru_cache
import numpy as np

logger = logging.getLogger(__name__)

# Russian to English translation dictionary for common programming terms
RU_TO_EN_TERMS = {
    # Algorithms
    "дубликат": "duplicate",
    "дубликаты": "duplicates",
    "сортировка": "sorting",
    "поиск": "search",
    "бинарный поиск": "binary search",
    "быстрая сортировка": "quicksort",
    "слияние": "merge",
    "хеширование": "hashing",
    "хеш": "hash",
    "граф": "graph",
    "дерево": "tree",
    "очередь": "queue",
    "стек": "stack",
    "связный список": "linked list",
    "массив": "array",
    "строка": "string",
    "строки": "strings",
    "матрица": "matrix",
    # Data structures
    "словарь": "dictionary",
    "множество": "set",
    "куча": "heap",
    "кэш": "cache",
    # Operations
    "удаление": "remove",
    "вставка": "insert",
    "обход": "traversal",
    "рекурсия": "recursion",
    "итерация": "iteration",
    "фильтрация": "filter",
    "группировка": "grouping",
    "агрегация": "aggregation",
    # Problems
    "анаграмма": "anagram",
    "палиндром": "palindrome",
    "подстрока": "substring",
    "подмассив": "subarray",
    "перестановка": "permutation",
    "комбинация": "combination",
    # Complexity
    "оптимизация": "optimization",
    "память": "memory",
    "время": "time",
    "сложность": "complexity",
    # Categories
    "математика": "math",
    "криптография": "cryptography",
    "машинное обучение": "machine learning",
}

# Lazy loading of the model
_model = None


def translate_query(query: str) -> str:
    """
    Translate Russian programming terms to English for better embedding search.

    Args:
        query: User search query (may contain Russian terms)

    Returns:
        Query with Russian terms translated to English
    """
    result = query.lower()

    # Sort by length (longer phrases first) to avoid partial replacements
    sorted_terms = sorted(RU_TO_EN_TERMS.items(), key=lambda x: len(x[0]), reverse=True)

    for ru_term, en_term in sorted_terms:
        if ru_term in result:
            result = result.replace(ru_term, en_term)
            logger.debug(f"Translated '{ru_term}' -> '{en_term}'")

    if result != query.lower():
        logger.info(f"Query translated: '{query}' -> '{result}'")

    return result


def _get_model():
    """Lazy load the embedding model."""
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            from app.config import get_settings
            settings = get_settings()
            logger.info(f"Loading embedding model: {settings.embedding_model}")
            _model = SentenceTransformer(settings.embedding_model)
            logger.info("Embedding model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            raise RuntimeError(f"Embedding model unavailable: {e}")
    return _model


async def get_embedding(text: str) -> list[float]:
    """
    Generate embedding for a code snippet or query.

    Args:
        text: Code or natural language query

    Returns:
        List of floats representing the embedding vector

    Raises:
        RuntimeError: If embedding model is unavailable
    """
    try:
        model = _get_model()
        embedding = model.encode(text, convert_to_numpy=True)
        return embedding.tolist()
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        raise


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
