import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuration: Set to true to use OpenAI, false to use Lovable AI Gateway
const USE_OPENAI = false;

// OpenAI Configuration - Add your API key here when ready
// You can also set this via environment variable: OPENAI_API_KEY
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
const OPENAI_MODEL = 'gpt-4o'; // Change to your preferred OpenAI model

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    
    const systemPrompt = `You are Curax, a friendly and knowledgeable medical AI assistant for CuraClinic. Your role is to:
- Provide general health information and wellness advice
- Explain medical terms in simple language
- Suggest lifestyle and dietary recommendations
- Help users understand symptoms (without diagnosing)
- Encourage users to consult healthcare professionals for medical concerns

IMPORTANT: You are NOT a doctor. Always remind users that your advice is general information only and they should consult qualified healthcare providers for medical decisions. Never diagnose conditions or prescribe treatments.

Be warm, empathetic, and supportive. Keep responses concise but helpful.`;

    let response;
    
    if (USE_OPENAI && OPENAI_API_KEY) {
      // Use OpenAI API
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
        }),
      });
    } else {
      // Use Lovable AI Gateway (default)
      const apiKey = Deno.env.get('LOVABLE_API_KEY');
      response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
        }),
      });
    }

    const data = await response.json();
    const assistantResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ response: assistantResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in curax-chat:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});