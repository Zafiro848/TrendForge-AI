export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Método no permitido"
    });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        ok: false,
        error: "Falta configurar OPENAI_API_KEY"
      });
    }

    const proyecto = req.body?.proyecto;

    if (!proyecto) {
      return res.status(400).json({
        ok: false,
        error: "Faltan los datos del proyecto"
      });
    }

    const prompt = `
Actúa como director creativo y productor profesional de contenido generado con IA.

Debes crear una producción completamente ORIGINAL.

La referencia proporcionada sirve únicamente para entender una idea general o formato.
NO copies personajes, nombres, diálogos, escenas, canciones, textos, marcas ni elementos protegidos del video de referencia.

DATOS DEL PROYECTO:
${JSON.stringify(proyecto, null, 2)}

Genera en español:

1. TÍTULO ORIGINAL
2. CONCEPTO ORIGINAL
3. GANCHO INICIAL
4. GUION COMPLETO
5. NARRACIÓN
6. PERSONAJES
7. ESCENAS DIVIDIDAS EN ORDEN
8. PROMPT VISUAL PARA CADA ESCENA
9. IDEA DE MINIATURA
10. TÍTULO PARA YOUTUBE
11. DESCRIPCIÓN PARA YOUTUBE

Adapta todo a la duración, formato, estilo, personajes y voz indicados por el usuario.

El resultado debe ser claro, organizado y listo para pasar a producción.
`;

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
          input: prompt
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        error: "Error generando el proyecto con IA",
        details: data
      });
    }

    const resultado = (data.output || [])
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("\n");

    return res.status(200).json({
      ok: true,
      resultado
    });

  } catch (error) {
    console.error("Error Producción IA:", error);

    return res.status(500).json({
      ok: false,
      error: "Error interno generando el proyecto"
    });
  }
}
