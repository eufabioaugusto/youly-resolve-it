import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProductImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export const ProductImageUpload = ({ 
  images, 
  onImagesChange, 
  maxImages = 7 
}: ProductImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;
    
    if (images.length + files.length > maxImages) {
      toast({
        title: "Limite excedido",
        description: `Você pode enviar no máximo ${maxImages} imagens`,
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    const newImages: string[] = [];

    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Arquivo inválido",
            description: "Apenas imagens são permitidas",
            variant: "destructive"
          });
          continue;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          toast({
            title: "Arquivo muito grande",
            description: "Imagens devem ter no máximo 5MB",
            variant: "destructive"
          });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `product-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast({
            title: "Erro no upload",
            description: "Não foi possível enviar a imagem",
            variant: "destructive"
          });
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        newImages.push(publicUrl);
      }

      onImagesChange([...images, ...newImages]);
      
      if (newImages.length > 0) {
        toast({
          title: "Imagens enviadas!",
          description: `${newImages.length} imagem(ns) adicionada(s) com sucesso`
        });
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao enviar as imagens",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = async (imageUrl: string, index: number) => {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `product-images/${fileName}`;

      // Delete from storage
      await supabase.storage
        .from('product-images')
        .remove([filePath]);

      // Remove from state
      const newImages = images.filter((_, i) => i !== index);
      onImagesChange(newImages);
    } catch (error) {
      console.error('Error removing image:', error);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold flex items-center gap-2 mb-2">
          <ImageIcon className="w-4 h-4" />
          Fotos do produto
        </h3>
        <p className="text-sm text-muted-foreground">
          Adicione fotos do produto para ajudar o montador no orçamento (até {maxImages} imagens)
        </p>
      </div>

      {/* Upload Area */}
      <div
        onClick={openFileDialog}
        className="w-full h-32 border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-destructive/50 transition-colors bg-muted/20 hover:bg-muted/30"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || images.length >= maxImages}
        />
        
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-destructive" />
            <span className="text-sm text-muted-foreground">Enviando imagens...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
              <Upload className="w-6 h-6 text-destructive" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                {images.length >= maxImages 
                  ? `Limite de ${maxImages} imagens atingido`
                  : 'Clique para fazer upload das imagens'
                }
              </p>
              {images.length < maxImages && (
                <p className="text-xs text-muted-foreground">
                  PNG, JPG até 5MB ({images.length}/{maxImages})
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                <img
                  src={imageUrl}
                  alt={`Produto ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(imageUrl, index)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};