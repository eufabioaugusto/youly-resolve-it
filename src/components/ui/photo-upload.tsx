import { useState } from "react";
import { Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PhotoUploadProps {
  currentPhotoUrl?: string;
  onPhotoUpdate: (url: string | null) => void;
  userId: string;
  fallbackInitials: string;
  size?: "sm" | "md" | "lg";
}

export function PhotoUpload({ 
  currentPhotoUrl, 
  onPhotoUpdate, 
  userId, 
  fallbackInitials,
  size = "lg"
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24", 
    lg: "w-32 h-32"
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive"
      });
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro", 
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      // Remover foto anterior se existir
      if (currentPhotoUrl) {
        const oldFileName = currentPhotoUrl.split('/').pop();
        if (oldFileName) {
          await supabase.storage
            .from('profile-photos')
            .remove([`${userId}/${oldFileName}`]);
        }
      }

      // Upload da nova foto
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      onPhotoUpdate(data.publicUrl);

      toast({
        title: "Sucesso",
        description: "Foto de perfil atualizada com sucesso!"
      });

    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer upload da imagem. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!currentPhotoUrl) return;

    setUploading(true);

    try {
      const fileName = currentPhotoUrl.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('profile-photos')
          .remove([`${userId}/${fileName}`]);
      }

      onPhotoUpdate(null);

      toast({
        title: "Sucesso",
        description: "Foto de perfil removida com sucesso!"
      });

    } catch (error) {
      console.error('Erro ao remover foto:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover a imagem. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={currentPhotoUrl || ""} />
          <AvatarFallback className="text-lg font-semibold">
            {fallbackInitials}
          </AvatarFallback>
        </Avatar>

        {currentPhotoUrl && (
          <Button
            size="sm"
            variant="destructive"
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
            onClick={handleRemovePhoto}
            disabled={uploading}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <label htmlFor={`photo-upload-${userId}`}>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={uploading}
            asChild
          >
            <span className="cursor-pointer">
              {uploading ? (
                <>Enviando...</>
              ) : (
                <>
                  {currentPhotoUrl ? <Camera className="w-4 h-4 mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  {currentPhotoUrl ? "Alterar" : "Upload"} Foto
                </>
              )}
            </span>
          </Button>
        </label>
        <input
          id={`photo-upload-${userId}`}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          disabled={uploading}
        />
      </div>
    </div>
  );
}