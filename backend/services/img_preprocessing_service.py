import cv2
import numpy as np
from PIL import Image


def preprocess_image(image_path, save_output=False, output_path="preprocessed.png", grayscale_path="grayscale.png"):
    # Load the image
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Could not load image at path: {image_path}")

    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Save grayscale image for comparison
    if save_output and grayscale_path:
        cv2.imwrite(grayscale_path, gray)

    # Resize (optional)
    scale_percent = 150  # Increase size by 150%
    width = int(gray.shape[1] * scale_percent / 100)
    height = int(gray.shape[0] * scale_percent / 100)
    resized = cv2.resize(gray, (width, height), interpolation=cv2.INTER_LINEAR)

    # Denoising (Gaussian blur)
    blurred = cv2.GaussianBlur(resized, (5, 5), 0)

    # Adaptive thresholding
    thresh = cv2.adaptiveThreshold(blurred, 255,
                                   cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                   cv2.THRESH_BINARY, 11, 2)

    # Morphological transformations (remove small noise)
    kernel = np.ones((1, 1), np.uint8)
    cleaned = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)

    # Save or return image
    if save_output:
        cv2.imwrite(output_path, cleaned)

    return gray, cleaned
