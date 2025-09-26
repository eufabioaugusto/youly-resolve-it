import { useState } from "react";
import { Upload, X, Camera, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProductImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
}

const ProductImageUpload = ({ images, onImagesChange }: ProductImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;
    
    const maxImages = 7;
    const remainingSlots = maxImages - images.length;
    
    if (files.length > remainingSlots) {
      toast({
        title: "Limite excedido",
        description: `Você pode adicionar no máximo ${maxImages} imagens. Restam ${remainingSlots} slots.`,
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    const newImageUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Arquivo inválido",
            description: "Apenas imagens são permitidas",
            variant: "destructive"
          });
          continue;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "Arquivo muito grande",
            description: "Cada imagem deve ter no máximo 5MB",
            variant: "destructive"
          });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(data.path);

        newImageUrls.push(publicUrl);
      }

      if (newImageUrls.length > 0) {
        onImagesChange([...images, ...newImageUrls]);
        toast({
          title: "Upload concluído",
          description: `${newImageUrls.length} imagem(ns) adicionada(s) com sucesso`
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (imageUrl: string, index: number) => {
    try {
      // Extract filename from URL to delete from storage
      const fileName = imageUrl.split('/').pop();
      if (fileName) {
        const { error } = await supabase.storage
          .from('product-images')
          .remove([fileName]);
        
        if (error) console.warn('Error deleting image from storage:', error);
      }
      
      const newImages = images.filter((_, i) => i !== index);
      onImagesChange(newImages);
      
      toast({
        title: "Imagem removida",
        description: "A imagem foi removida com sucesso"
      });
    } catch (error) {
      console.warn('Error removing image:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold flex items-center gap-2 mb-2">
          <Camera className="w-4 h-4" />
          Fotos do produto
        </h3>
        <p className="text-sm text-muted-foreground">
          Adicione até 7 fotos do produto para o montador visualizar (máx. 5MB cada)
        </p>
      </div>

      {/* Upload Area */}
      <div className="relative">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading || images.length >= 7}
        />
        <div className={`
          w-full h-32 border-2 border-dashed border-gray-300 rounded-lg
          flex flex-col items-center justify-center gap-2
          transition-colors hover:border-gray-400 hover:bg-gray-50
          ${uploading || images.length >= 7 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}>
          {uploading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-destructive"></div>
              <span className="text-sm text-muted-foreground">Enviando...</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 border border-gray-300 rounded flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">
                  {images.length >= 7 ? 'Limite atingido (7/7)' : 'Fazer upload das imagens'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {images.length < 7 && `Clique ou arraste ${7 - images.length} imagem(ns)`}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
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
                className="absolute top-2 right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(imageUrl, index)}
              >
                <X className="w-3 h-3" />
              </Button>
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        {images.length}/7 imagens adicionadas
      </div>
    </div>
  );
};

export default ProductImageUpload;