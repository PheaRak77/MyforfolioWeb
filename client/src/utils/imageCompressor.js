/**
 * Compresses an image File into a lightweight, high-quality Base64 Data URL.
 * Enables permanent storage in PostgreSQL database without losing images on Render redeploys.
 * 
 * @param {File} file - Image file from file input
 * @param {number} maxWidth - Max width in pixels (default 800px)
 * @param {number} maxHeight - Max height in pixels (default 800px)
 * @param {number} quality - JPEG compression quality 0.0 - 1.0 (default 0.85)
 * @returns {Promise<string>} Base64 Data URL
 */
export const compressImageFile = (
  file,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.85
) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error("No file provided"));
    }

    // Check if valid image type
    if (!file.type.startsWith("image/")) {
      return reject(new Error("Please upload a valid image file (JPG, PNG, WebP)"));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };

      img.onerror = (err) => reject(new Error("Failed to process image"));
    };

    reader.onerror = (err) => reject(new Error("Failed to read file"));
  });
};
