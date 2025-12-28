import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    const formData = await req.formData();

    const name = formData.get('name') || 'User Voice';
    const description = formData.get('description') || 'Voice cloned via Ember';
    const files = formData.getAll('files');

    console.log('Voice cloning request:', {
      name,
      fileCount: files.length,
    });

    if (files.length === 0) {
      throw new Error('No audio files provided');
    }

    // Log file details
    for (let i = 0; i < files.length; i++) {
      const file = files[i] as File;
      console.log(`File ${i}:`, {
        name: file.name,
        type: file.type,
        size: file.size
      });
    }

    // Prepare form data for ElevenLabs
    const elevenLabsFormData = new FormData();
    elevenLabsFormData.append('name', name as string);
    elevenLabsFormData.append('description', description as string);

    // Add all audio files
    for (let i = 0; i < files.length; i++) {
      elevenLabsFormData.append('files', files[i]);
    }

    console.log('Calling ElevenLabs API...');

    // Call ElevenLabs Voice Cloning API
    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: elevenLabsFormData,
    });

    const responseText = await response.text();
    console.log('ElevenLabs response:', {
      status: response.status,
      statusText: response.statusText,
      body: responseText
    });

    if (!response.ok) {
      // Parse error if JSON, otherwise use text
      let errorDetail = responseText;
      try {
        const errorJson = JSON.parse(responseText);
        errorDetail = errorJson.detail || errorJson.message || responseText;
      } catch (e) {
        // Not JSON, use text
      }

      throw new Error(`ElevenLabs error (${response.status}): ${errorDetail}`);
    }

    const data = JSON.parse(responseText);
    console.log('Voice cloned successfully:', data.voice_id);

    return new Response(
      JSON.stringify({
        voice_id: data.voice_id,
        name: data.name,
        success: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in voice cloning:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
