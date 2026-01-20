"""
Test file with intentionally slow/unoptimized code.
Use CodeForge plugin to find better implementations!
"""

# Example 1: Slow duplicate finder (O(n²))
def find_duplicates_slow(arr: list) -> list:
    """Find duplicates using nested loops - O(n²) complexity."""
    duplicates = []
    for i in range(len(arr)):
        for j in range(i + 1, len(arr)):
            if arr[i] == arr[j] and arr[i] not in duplicates:
                duplicates.append(arr[i])
    return duplicates


# Example 2: Inefficient fibonacci (exponential)
def fibonacci_slow(n: int) -> int:
    """Calculate fibonacci using naive recursion - O(2^n) complexity."""
    if n <= 1:
        return n
    return fibonacci_slow(n - 1) + fibonacci_slow(n - 2)


# Example 3: Slow list sum
def sum_list_slow(arr: list) -> int:
    """Sum a list using a loop instead of built-in."""
    total = 0
    for i in range(len(arr)):
        total = total + arr[i]
    return total


# Example 4: Inefficient string reversal
def reverse_string_slow(s: str) -> str:
    """Reverse string by concatenating characters."""
    result = ""
    for char in s:
        result = char + result
    return result


# Example 5: Slow prime checker
def is_prime_slow(n: int) -> bool:
    """Check if number is prime - unoptimized."""
    if n < 2:
        return False
    for i in range(2, n):  # Should stop at sqrt(n)
        if n % i == 0:
            return False
    return True


# Example 6: Inefficient list search
def find_in_list_slow(arr: list, target) -> int:
    """Find element index - doesn't use binary search for sorted lists."""
    for i in range(len(arr)):
        if arr[i] == target:
            return i
    return -1


# Example 7: Slow matrix multiplication
def matrix_multiply_slow(A: list, B: list) -> list:
    """Multiply two matrices - naive O(n³) implementation."""
    n = len(A)
    m = len(B[0])
    k = len(B)

    result = [[0] * m for _ in range(n)]

    for i in range(n):
        for j in range(m):
            for p in range(k):
                result[i][j] += A[i][p] * B[p][j]

    return result


if __name__ == "__main__":
    # Test examples
    print("Testing slow implementations...")

    # Test duplicates
    test_arr = [1, 2, 3, 2, 4, 3, 5]
    print(f"Duplicates in {test_arr}: {find_duplicates_slow(test_arr)}")

    # Test fibonacci (small n!)
    print(f"Fibonacci(10): {fibonacci_slow(10)}")

    # Test sum
    print(f"Sum of [1,2,3,4,5]: {sum_list_slow([1, 2, 3, 4, 5])}")

    # Test reverse
    print(f"Reverse 'hello': {reverse_string_slow('hello')}")

    # Test prime
    print(f"Is 17 prime: {is_prime_slow(17)}")
