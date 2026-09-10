export default async function handler(req, res) {
  const key = process.env.YOUTUBE_API_KEY;

  if (!key) {
    return res.status(500).json({ error: "Falta YOUTUBE_API_KEY" });
  }

  const q = req.query.q || "tendencias";
  const region = req.query.region || "CO";

  const url =
    "https://www.googleapis.com/youtube/v3/search" +
    "?part=snippet&type=video&maxResults=10&order=viewCount" +
    "&q=" + encodeURIComponent(q) +
    "&regionCode=" + region +
    "&key=" + key;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json({
      ok: true,
      fuente: "YouTube Data API v3",
      pais: region,
      consulta: q,
      resultados: data.items
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
