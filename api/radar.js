export default async function handler(req, res) {
  const API_KEY = process.env.YOUTUBE_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({
      ok: false,
      error: "Falta YOUTUBE_API_KEY en Vercel"
    });
  }

  const region = String(req.query.region || "US").toUpperCase();

  try {
    // 1. Obtener videos populares del país
    const popularParams = new URLSearchParams({
      part: "snippet,statistics",
      chart: "mostPopular",
      regionCode: region,
      maxResults: "25",
      key: API_KEY
    });

    const popularResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?${popularParams.toString()}`
    );

    const popularData = await popularResponse.json();

    if (!popularResponse.ok) {
      return res.status(popularResponse.status).json({
        ok: false,
        error: "Error obteniendo tendencias de YouTube",
        details: popularData
      });
    }

    const ahora = Date.now();

    // 2. Preparar estadísticas reales
    const base = (popularData.items || []).map(video => {
      const views = Number(video.statistics?.viewCount || 0);
      const likes = Number(video.statistics?.likeCount || 0);
      const comments = Number(video.statistics?.commentCount || 0);

      const publishedAt = video.snippet?.publishedAt || null;

      const ageDays = publishedAt
        ? Math.max(
            1,
            (ahora - new Date(publishedAt).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 1;

      const viewsPerDay = views / ageDays;

      const engagement =
        views > 0
          ? ((likes + comments) / views) * 100
          : 0;

      return {
        id: video.id,
        titulo: video.snippet?.title || "Sin título",
        canal: video.snippet?.channelTitle || "Canal desconocido",
        descripcion: video.snippet?.description || "",
        publicado: publishedAt,

        miniatura:
          video.snippet?.thumbnails?.high?.url ||
          video.snippet?.thumbnails?.medium?.url ||
          video.snippet?.thumbnails?.default?.url ||
          "",

        categoriaId: video.snippet?.categoryId || null,

        views,
        likes,
        comments,

        ageDays,
        viewsPerDay,
        engagement
      };
    });

    if (base.length === 0) {
      return res.status(200).json({
        ok: true,
        fuente: "YouTube Data API v3",
        tipo: "Radar Global",
        pais: region,
        resultados: []
      });
    }

    // 3. Valores máximos para comparar videos
    const maxViewsPerDay = Math.max(
      1,
      ...base.map(video => video.viewsPerDay)
    );

    const maxViews = Math.max(
      1,
      ...base.map(video => video.views)
    );

    // 4. Calcular puntuación de oportunidad V2
const resultados = base
  .map(video => {
    const velocidadScore =
      (video.viewsPerDay / maxViewsPerDay) * 35;

    const alcanceScore =
      (video.views / maxViews) * 15;

    const engagementScore =
      Math.min(video.engagement / 10, 1) * 20;

    const freshnessScore =
      Math.max(
        0,
        Math.min(15, 15 - video.ageDays * 0.25)
      );

    // Detectar señales de contenido fácil de adaptar
    const texto =
      `${video.titulo} ${video.descripcion}`.toLowerCase();

    const palabrasAdaptables = [
      "how",
      "why",
      "story",
      "stories",
      "challenge",
      "experiment",
      "tips",
      "ranking",
      "top",
      "best",
      "worst",
      "mystery",
      "facts",
      "secret",
      "viral",
      "trend",
      "trending",
      "curious",
      "review",
      "before",
      "after",
      "vs"
    ];

    const coincidencias = palabrasAdaptables.filter(
      palabra => texto.includes(palabra)
    ).length;

    const adaptabilidadScore =
      Math.min(coincidencias * 3, 10);

    // Penalizar contenido muy dependiente de marcas,
    // trailers oficiales o grandes lanzamientos
    const palabrasDependientes = [
      "official trailer",
      "official music video",
      "official mv",
      "nintendo direct",
      "movie trailer",
      "teaser trailer"
    ];

    const dependiente =
      palabrasDependientes.some(
        palabra => texto.includes(palabra)
      );

    const penalizacionDependencia =
      dependiente ? 10 : 0;

    const score = Math.round(
      Math.max(
        0,
        Math.min(
          100,
          velocidadScore +
            alcanceScore +
            engagementScore +
            freshnessScore +
            adaptabilidadScore -
            penalizacionDependencia
        )
      )
    );

    let nivel;

if (dependiente) {
  nivel = "⛔ Dependiente de marca";
} else if (score >= 85) {
  nivel = "🔥 Oportunidad muy alta";
} else if (score >= 70) {
  nivel = "📈 Buena oportunidad";
} else if (score >= 55) {
  nivel = "🟡 Potencial de adaptación";
} else {
  nivel = "⚪ Baja prioridad";
}

    let motivo = "Buen desempeño general.";

    if (dependiente) {
      motivo =
        "Tiene alto alcance, pero depende mucho de una marca, estreno o contenido oficial.";
    } else if (adaptabilidadScore >= 6 && video.viewsPerDay > 100000) {
      motivo =
        "Combina velocidad de crecimiento con un formato que puede adaptarse a otro mercado.";
    } else if (video.engagement >= 5) {
      motivo =
        "La audiencia está reaccionando bien y muestra buena interacción.";
    } else if (video.ageDays <= 3 && video.viewsPerDay > 50000) {
      motivo =
        "Es reciente y está creciendo rápido, por lo que conviene vigilarlo.";
    }

    return {
      ...video,
      score,
      nivel,
      adaptabilidadScore,
      dependiente,
      motivo,
      url: `https://www.youtube.com/watch?v=${video.id}`
    };
  })
  .sort((a, b) => b.score - a.score);
    // 5. Respuesta del nuevo Radar
    return res.status(200).json({
      ok: true,
      fuente: "YouTube Data API v3",
      tipo: "Radar Global",
      pais: region,
      analizados: resultados.length,
      generadoEn: new Date().toISOString(),
      resultados
    });

  } catch (error) {
    console.error("Error Radar:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Error interno del Radar"
    });
  }
}
