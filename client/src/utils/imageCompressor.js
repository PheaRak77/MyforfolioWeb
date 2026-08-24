/**
 * Compresses an image File into a lightweight, high-quality Base64 Data URL or Blob.
 * Drastically reduces upload time and saves cloud bandwidth.
 */

const calculateDimensions = (width, height, maxWidth, maxHeight) => {
  let targetWidth = width;
  let targetHeight = height;

  if (targetWidth > targetHeight) {
    if (targetWidth > maxWidth) {
      targetHeight = Math.round((targetHeight * maxWidth) / targetWidth);
      targetWidth = maxWidth;
    }
  } else {
    if (targetHeight > maxHeight) {
      targetWidth = Math.round((targetWidth * maxHeight) / targetHeight);
      targetHeight = maxHeight;
    }
  }

  return { width: targetWidth, height: targetHeight };
};

export const compressImageFile = (
  file,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.85
) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error("No file provided"));
    }

    if (!file.type.startsWith("image/")) {
      return reject(new Error("Please upload a valid image file (JPG, PNG, WebP)"));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        const { width, height } = calculateDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight
        );

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d", { alpha: false });
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };

      img.onerror = () => reject(new Error("Failed to process image"));
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
  });
};

/**
 * Compresses a File into an optimized Blob for ultra-fast HTTP multipart uploads.
 */
export const compressImageFileToBlob = (
  file,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.88
) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error("No file provided"));
    }

    // Skip SVGs or already small files (< 200KB)
    if (file.type === "image/svg+xml" || file.size < 200 * 1024) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        const { width, height } = calculateDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight
        );

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d", { alpha: false });
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }
            resolve(blob);
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => resolve(file);
    };

    reader.onerror = () => resolve(file);
  });
};

