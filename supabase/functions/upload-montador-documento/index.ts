import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UploadRequest {
  userId: string;
  fileName: string;
  fileBase64: string;
  contentType: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Cliente com service role para bypass de RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, fileName, fileBase64, contentType }: UploadRequest = await req.json();

    console.log('Upload documento para user:', userId);

    // Decodificar base64
    const fileData = Uint8Array.from(atob(fileBase64), c => c.charCodeAt(0));

    // Upload do arquivo
    const filePath = `documentos/${Date.now()}-${fileName}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, fileData, {
        contentType,
        upsert: false
      });

    if (uploadError) {
      console.error('Erro no upload:', uploadError);
      throw uploadError;
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(uploadData.path);

    const documentoUrl = urlData.publicUrl;

    // Atualizar montador com URL do documento
    const { error: updateError } = await supabase
      .from('montadores')
      .update({ documento_foto_url: documentoUrl })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Erro ao atualizar montador:', updateError);
      throw updateError;
    }

    console.log('Documento uploaded com sucesso:', documentoUrl);

    return new Response(
      JSON.stringify({ success: true, url: documentoUrl }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Erro na função upload-montador-documento:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
