/**
 * Utilitário para compressão e redimensionamento de imagens
 * Especialmente útil para fotos tiradas por câmera de celular
 */

interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Comprime e redimensiona uma imagem
 * @param file - Arquivo de imagem original
 * @param options - Opções de compressão
 * @returns Promise com o arquivo comprimido
 */
export async function compressImage(
  file: File,
  options: CompressImageOptions = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calcular novas dimensões mantendo aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        // Criar canvas para redimensionar
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível criar contexto do canvas'));
          return;
        }

        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Converter para blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Erro ao comprimir imagem'));
              return;
            }

            // Criar novo arquivo com nome original
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.(heic|heif)$/i, '.jpg'), // Converter HEIC para JPG
              {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }
            );

            console.log('📦 Compressão:', {
              original: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
              comprimido: `${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
              reducao: `${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`
            });

            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Erro ao carregar imagem'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Cria uma URL de preview otimizada para uma imagem
 * Usa object URL ao invés de data URL para economizar memória
 */
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoga uma URL de preview criada anteriormente
 */
export function revokeImagePreview(url: string): void {
  URL.revokeObjectURL(url);
}
