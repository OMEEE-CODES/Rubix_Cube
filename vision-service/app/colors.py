from math import sqrt


CUBE_COLOR_RGB = {
    "white": (235, 232, 223),
    "red": (196, 48, 48),
    "green": (44, 143, 78),
    "yellow": (231, 199, 56),
    "orange": (219, 119, 43),
    "blue": (60, 108, 195),
}


def classify_rgb(rgb: tuple[float, float, float]) -> tuple[str, float]:
    best_color = "white"
    best_distance = float("inf")

    for color, reference in CUBE_COLOR_RGB.items():
        distance = euclidean_distance(rgb, reference)
        if distance < best_distance:
            best_color = color
            best_distance = distance

    normalized_distance = min(best_distance / 255.0, 1.0)
    confidence = round(max(0.45, 1.0 - normalized_distance), 2)
    return best_color, confidence


def euclidean_distance(
    left: tuple[float, float, float], right: tuple[float, float, float]
) -> float:
    return sqrt(sum((left[index] - right[index]) ** 2 for index in range(3)))
