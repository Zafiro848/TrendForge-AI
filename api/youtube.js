export default async function handler(req, res) {
  const API_KEY = process.env.YOUTUBE_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({
      ok: false,
      error: "Falta YOUTUBE_API_KEY en Vercel"
    });
  }

  const q = req.query.q || "viral";
  const region = req.query.region || "US";

  try {
    const publishedAfter = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const searchParams = new URLSearchParams({
      part: "snippet",
      type: "video",
      maxResults: "10",
      order: "viewCount",
      q: q,
      regionCode: region,
      publishedAfter: publishedAfter,
      safeSearch: "moderate",
      key: API_KEY
    });

    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${searchParams.toString()}`
    );

    const searchData = await searchResponse.json();

    if (!searchResponse.ok) {
      return res.status(searchResponse.status).json({
        ok: false,
        error: "Error buscando videos en YouTube",
        details: searchData
      });
    }

    const videoIds = (searchData.items || [])
      .map(item => item.id?.videoId)
      .filter(Boolean);

    if (videoIds.length === 0) {
      return res.status(200).json({
        ok: true,
        fuente: "YouTube Data API v3",
        pais: region,
        consulta: q,
        resultados: []
      });
    }

    const videoParams = new URLSearchParams({
      part: "snippet,statistics",
      id: videoIds.join(","),
      key: API_KEY
    });

    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?${videoParams.toString()}`
    );

    const videoData = await videoResponse.json();

    if (!videoResponse.ok) {
      return res.status(videoResponse.status).json({
        ok: false,
        error: "Error obteniendo estadísticas de YouTube",
        details: videoData
      });
    }

    const ahora = Date.now();

    const base = (videoData.items || []).map(video => {
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
        views,
        likes,
        comments,
        ageDays,
        viewsPerDay,
        engagement
      };
    });

    const maxViewsPerDay = Math.max(
      1,
      ...base.map(v => v.viewsPerDay)
    );

    const maxViews = Math.max(
      1,
      ...base.map(v => v.views)
    );

    const resultados = base
      .map(video => {
        const velocidadScore =
          (video.viewsPerDay / maxViewsPerDay) * 45;

        const alcanceScore =
          (video.views / maxViews) * 20;

        const engagementScore =
          Math.min(video.engagement / 10, 1) * 20;

        const freshnessScore =
          Math.max(0, 15 - video.ageDays * 0.5);

        const score = Math.round(
          Math.min(
            100,
            velocidadScore +
              alcanceScore +
              engagementScore +
              freshnessScore
          )
        );

        let nivel = "Potencial";

        if (score >= 85) {
          nivel = "🔥 Viral ahora";
        } else if (score >= 70) {
          nivel = "📈 Creciendo";
        } else if (score >= 55) {
          nivel = "🟡 Potencial medio";
        } else {
          nivel = "⚪ Bajo impulso";
        }

        return {
          ...video,
          score,
          nivel
        };
      })
      .sort((a, b) => b.score - a.score);

    return res.status(200).json({
      ok: true,
      fuente: "YouTube Data API v3",
      pais: region,
      consulta: q,
      ventanaDias: 30,
      resultados
    });

  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}
