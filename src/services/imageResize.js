// Réduit une photo trop grande AVANT l'envoi (un téléphone produit des photos de 4000×3000 px et 8 Mo) :
// envoi plus rapide, et l'API n'a pas à décoder une image énorme. Les GIF et les navigateurs sans createImageBitmap : fichier tel quel.
export async function shrinkImage(file, maxSide = 2400) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || typeof createImageBitmap !== 'function') return file;
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }); // redresse les photos de téléphone
  } catch {
    return file;
  }
  const { width, height } = bitmap;
  const long = Math.max(width, height);
  if (long <= maxSide && file.size <= 3 * 1024 * 1024) { bitmap.close?.(); return file; } // déjà raisonnable

  const ratio = Math.min(1, maxSide / long);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * ratio));
  canvas.height = Math.max(1, Math.round(height * ratio));
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg'; // PNG : on garde la transparence
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, 0.9));
  if (!blob || blob.size >= file.size) return file; // aucun gain : on garde l'original
  return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.${type === 'image/png' ? 'png' : 'jpg'}`, { type });
}
