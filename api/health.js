export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    service: "TrendForge AI",
    message: "API funcionando correctamente"
  });
}
