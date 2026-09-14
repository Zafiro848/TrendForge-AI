export default async function handler(req, res) {
  const API_KEY = process.env.YOUTUBE_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({
      ok: false,
      error: "Falta YOUTUBE_API_KEY en Vercel"
    });
  }

  const region = String(req.query.region || "US").toUpperCase();
  const targetRegion = String(req.query.target || "CO").toUpperCase();
const topic = String(req.query.topic || "").trim();
  try {
    // 1. Buscar directamente contenido IA reciente del país
const queryIAByRegion = {
  US: "ai generated|ai animation|ai video|ai story|ai short film",
  MX: "generado por ia|hecho con ia|video con ia|animación ia|historia con ia",
  CO: "generado por ia|hecho con ia|video con ia|animación ia|historia con ia",
  AR: "generado por ia|hecho con ia|video con ia|animación ia|historia con ia",
  ES: "generado por ia|hecho con ia|video con ia|animación ia|historia con ia",
  PE: "generado por ia|hecho con ia|video con ia|animación ia|historia con ia",
  CL: "generado por ia|hecho con ia|video con ia|animación ia|historia con ia",
  BR: "gerado por ia|feito com ia|vídeo com ia|animação ia|história com ia",
  JP: "AI生成|AI動画|生成AI|AIアニメ",
  KR: "AI 생성|AI 영상|생성형 AI|AI 애니메이션"
};

const baseQueryIA = queryIAByRegion[region] || queryIAByRegion.US;

const queryIA = topic
  ? baseQueryIA
      .split("|")
      .map(termino => `${topic} ${termino.trim()}`)
      .join("|")
  : baseQueryIA;

const publishedAfter =
  new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
const languageByRegion = {
  US: "en",
  MX: "es",
  CO: "es",
  AR: "es",
  ES: "es",
  PE: "es",
  CL: "es",
  BR: "pt",
  JP: "ja",
  KR: "ko"
};

const relevanceLanguage =
  languageByRegion[region] || "en";
const searchParams = new URLSearchParams({
  part: "snippet",
  type: "video",
  q: queryIA,
  regionCode: region,
  publishedAfter,
  relevanceLanguage,
  order: "viewCount",
  maxResults: "50",
  safeSearch: "moderate",
  key: API_KEY
});

const searchResponse = await fetch(
  `https://www.googleapis.com/youtube/v3/search?${searchParams}`
);

const searchData = await searchResponse.json();

if (!searchResponse.ok) {
  return res.status(searchResponse.status).json({
    ok: false,
    error: "Error buscando contenido IA en YouTube",
    details: searchData
  });
}

const regionesLatinas = ["US", "MX", "CO", "AR", "ES", "PE", "CL", "BR"];

const videoIds = (searchData.items || [])
  .filter(item => {
    if (!regionesLatinas.includes(region)) return true;

    const tituloIdioma = String(item.snippet?.title || "");

    const escrituraNoLatina =
      /[\u0900-\u097F\u0980-\u09FF\u0600-\u06FF\u0400-\u04FF\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7AF]/;

    return !escrituraNoLatina.test(tituloIdioma);
  })
  .map(item => item.id?.videoId)
  .filter(Boolean);

if (videoIds.length === 0) {
  return res.status(200).json({
    ok: true,
    fuente: "YouTube Data API v3",
    tipo: "Radar IA Replicable",
    pais: region,
    analizados: 0,
    resultados: []
  });
}

const detailParams = new URLSearchParams({
  part: "snippet,statistics",
  id: videoIds.join(","),
  key: API_KEY
});

const popularResponse = await fetch(
  `https://www.googleapis.com/youtube/v3/videos?${detailParams}`
);

const popularData = await popularResponse.json();

if (!popularResponse.ok) {
  return res.status(popularResponse.status).json({
    ok: false,
    error: "Error obteniendo estadísticas de videos IA",
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

    

    // 4. Calcular puntuación de oportunidad V2
const baseIA = base
  .filter(video => {
    const textoPrincipalIA =
  `${String(video.titulo || "")} ${String(video.canal || "")}`.toLowerCase();

const descripcionIA =
  String(video.descripcion || "").toLowerCase();

const textoIA =
  `${textoPrincipalIA} ${descripcionIA}`;
    const senalesIA = [
      "ai generated",
      "generated with ai",
      "made with ai",

      "ai animation",
      "ai short film",
      "ai story",
      "ai horror",
      "ai animals",
      
      "generado por ia",
      "hecho con ia",
      
      "animación ia",
      "animacion ia",
      "historia con ia",
      
      "gerado por ia",
      "feito com ia",
      
      
      "ai生成",
      
      
      
      "ai 생성",
      
      
      
    ];

    const contenidoNoDeseado = [
      "official trailer",
      "tráiler oficial",
      "trailer oficial",
      "gameplay trailer",
      "launch trailer",
      "announcement trailer",
      "movie trailer",
      "teaser trailer",
      "official music video",
      "official mv",
      "music video",
      "nintendo direct",
      "mrbeast",
      
"full movie",
"película completa",
"pelicula completa",
"filme completo",
"interview",
"entrevista",
"podcast",
"news",
"breaking news",
"noticias",
"notícia",
"noticia",
"ai news",
"noticias de ia",
"tutorial",
"how to use ai",
"how to use chatgpt",
"ai tools",
"herramientas de ia",
"review of ai",
"ai review",
"reaction to ai",
"reacción a la ia",
"reaccion a la ia"
    ];

const tieneSenalIA =
  senalesIA.some(palabra => textoPrincipalIA.includes(palabra));

const categoriaNoDeseada =
  String(video.categoryId) === "25";

const estaBloqueado =
  contenidoNoDeseado.some(palabra => textoIA.includes(palabra));

const contenidoPromocional =
  /\b(shop|buy now|order now|sale|discount|sponsored|advertisement|promotion)\b|https?:\/\/|www\.|\b[a-z0-9-]+\.(com|co|net|shop|store)\b/i.test(textoPrincipalIA);
return tieneSenalIA &&
  !estaBloqueado &&
  !categoriaNoDeseada &&
  !contenidoPromocional;
});

const maxViewsPerDayIA = Math.max(
  1,
  ...baseIA.map(video => video.viewsPerDay)
);

const maxViewsIA = Math.max(
  1,
  ...baseIA.map(video => video.views)
);

const resultados = baseIA.map(video => {
    const velocidadScore =
      (video.viewsPerDay / maxViewsPerDayIA) * 35;

    const alcanceScore =
      (video.views / maxViewsIA) * 15;

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
      
      "curious",
      "review",
      "before",
      "after",
      "vs"
    ];
let formato = "Contenido general";
let tema = "Tema general";
    

  


    
    const textoPrioridad = `${String(video.titulo || "")} ${String(video.canal || "")}`.toLowerCase();
    const puntuacionNichos = {};

const sumarNicho = (nicho, puntos) => {
  puntuacionNichos[nicho] = (puntuacionNichos[nicho] || 0) + puntos;
};
    if ([
  "gaming",
  "gameplay",
  "minecraft",
  "fortnite",
  "roblox",
  "nintendo",
  "playstation",
  "xbox",
  "videojuego",
  "videojuegos",
  "gamer"
].some(palabra => textoPrioridad.includes(palabra))) {
  sumarNicho("Gaming / videojuegos", 8);
    }
    if ([
  "technology",
  "tech",
  "artificial intelligence",

  "chatgpt",
  "openai",
  "robot",
  "robotics",
  "smartphone",
  "iphone",
  "android",
  "gadget",
  "tecnología",
  "tecnologia",
  "inteligencia artificial",
  "robótica",
  "robotica"
].some(palabra => textoPrioridad.includes(palabra))) {
  sumarNicho("Tecnología / IA", 8);
    }
if ([
  "series",
  "serie",
  "episode",
  "episodio",
  "capítulo",
  "capitulo",
  "novela",
  "avances",
  "avance",
  "movie",
"film",
"trailer",
"tv show",
"television",
"película",
"pelicula",
"cine",
"serie de televisión",
"serie de television",
"filme",
  "dance performance",
  "music video",
  "official mv",
  "celebrity",
  "actor",
  "actress",
  "cantante",
  "baile"
].some(palabra => textoPrioridad.includes(palabra))) {
  sumarNicho("Entretenimiento / cultura pop", 8);
}
if ([
  "gaming",
  "gameplay",
  "minecraft",
  "fortnite",
  "roblox",
  "nintendo",
  "playstation",
  "xbox",
  "videojuego",
  "videojuegos",
  "gamer"
].some(palabra => textoPrioridad.includes(palabra))) {
  // Gaming ya se puntúa arriba
} 
    if ([
  "finance",
  "financial",
  "investing",
  "investment",
  "stocks",
  "stock market",
  "trading",
  "business",
  "entrepreneur",
  "bitcoin",
  "crypto",
  "money",
  "dinero",
  "finanzas",
  "inversión",
  "inversion",
  "inversiones",
  "bolsa",
  "negocio",
  "negocios",
  "emprendimiento",
  "criptomonedas",
  "finanças",
  "investimento",
  "dinheiro",
  "negócios",
  "金融",
  "投資",
  "株",
  "お金",
  "재정",
  "투자",
  "주식"
].some(palabra => textoPrioridad.includes(palabra))) {
  sumarNicho("Dinero / negocios / finanzas", 8);
    }
    if ([
  "mystery",
  "mysterious",
  "unsolved",
  "true crime",
  "crime",
  "murder",
  "missing",
  "disappearance",
  "misterio",
  "misterioso",
  "misteriosa",
  "sin resolver",
  "crimen",
  "asesinato",
  "desaparición",
  "desaparicion",
  "caso real",
  "casos reales",
  "mistério",
  "misterio",
  "crime real",
  "desaparecido",
  "謎",
  "未解決",
  "事件",
  "ミステリー",
  "미스터리",
  "미제 사건",
  "범죄"
].some(palabra => textoPrioridad.includes(palabra))) {
  sumarNicho("Misterio / crimen / casos reales", 8);
    }
    if ([
  "animals",
  "wildlife",
  "nature",
  "dogs",
  "cats",
  "pets",
  "animales",
  "naturaleza",
  "mascotas",
  "perros",
  "gatos",
  "fauna",
  "animais",
  "natureza",
  "cachorros",
  "動物",
  "自然",
  "犬",
  "猫",
  "动物",
  "動物",
  "狗",
  "猫",
  "동물",
  "자연",
  "강아지",
  "고양이"
].some(palabra => textoPrioridad.includes(palabra))) {
  sumarNicho("Animales / naturaleza", 8);
    }
    if ([
  "science",
  "scientist",
  "scientific",
  "discovery",
  "research",
  "physics",
  "biology",
  "astronomy",
  "nasa",
  "ciencia",
  "científico",
  "cientifico",
  "descubrimiento",
  "investigación",
  "investigacion",
  "física",
  "fisica",
  "biología",
  "biologia",
  "astronomía",
  "astronomia",
  "ciência",
  "cientista",
  "descoberta",
  "pesquisa",
  "科学",
  "研究",
  "発見",
  "物理",
  "生物",
  "科学发现",
  "科學發現",
  "과학",
  "연구",
  "발견",
  "물리",
  "생물"
].some(palabra => textoPrioridad.includes(palabra))) {
  sumarNicho("Ciencia / descubrimientos", 8);
    }
    if ([
  "automotive",
  "vehicle",
  "vehicles",
  "motorcycle",
  "motorcycles",
  "supercar",
  "engine",
  "car review",
  "carros",
  "vehículo",
  "vehiculo",
  "vehículos",
  "vehiculos",
  "automóvil",
  "automovil",
  "motocicleta",
  "motocicletas",
  "motos",
  "motor",
  "veículo",
  "veiculo",
  "veículos",
  "veiculos",
  "自動車",
  "バイク",
  "オートバイ",
  "エンジン",
  "汽车",
  "汽車",
  "摩托车",
  "摩托車",
  "发动机",
  "發動機",
  "자동차",
  "차량",
  "오토바이",
  "엔진"
].some(palabra => textoPrioridad.includes(palabra))) {
  sumarNicho("Vehículos / motor", 8);
    }
    if ([
  "travel",
  "trip",
  "tourism",
  "explore",
  "exploring",
  "exploration",
  "destination",
  "road trip",
  "abandoned place",
  "viaje",
  "viajes",
  "turismo",
  "explorar",
  "exploración",
  "exploracion",
  "destino",
  "lugares abandonados",
  "viagem",
  "viagens",
  "exploração",
  "exploracao",
  "旅行",
  "観光",
  "探索",
  "廃墟",
  "旅游",
  "旅遊",
  "景点",
  "景點",
  "废墟",
  "廢墟",
  "여행",
  "관광",
  "탐험",
  "탐방",
  "폐허"
].some(palabra => textoPrioridad.includes(palabra))) {
  sumarNicho("Lugares / viajes / exploración", 8);
    }
    if ([
  "football",
  "soccer",
  "basketball",
  "baseball",
  "tennis",
  "boxing",
  "mma",
  "ufc",
  "formula 1",
  "championship",
  "tournament",
  "match",
  "fútbol",
  "futbol",
  "baloncesto",
  "béisbol",
  "beisbol",
  "tenis",
  "boxeo",
  "campeonato",
  "torneo",
  "partido",
  "futebol",
  "basquete",
  "tênis",
  "boxe",
  "torneio",
  "サッカー",
  "野球",
  "バスケットボール",
  "テニス",
  "ボクシング",
  "足球",
  "篮球",
  "籃球",
  "棒球",
  "网球",
  "網球",
  "拳击",
  "拳擊",
  "축구",
  "농구",
  "야구",
  "테니스",
  "복싱"
].some(palabra => textoPrioridad.includes(palabra))) {
  sumarNicho("Deportes / competencias", 8);
    }
    if ([
  "food",
  "cooking",
  "recipe",
  "recipes",
  "chef",
  "restaurant",
  "comida",
  "cocina",
  "receta",
  "recetas",
  "restaurante",
  "receita",
  "receitas",
  "cozinha",
  "料理",
  "レシピ",
  "グルメ",
  "美食",
  "食谱",
  "食譜",
  "烹饪",
  "烹飪",
  "음식",
  "요리",
  "레시피",
  "맛집"
].some(palabra => textoPrioridad.includes(palabra))) {
  sumarNicho("Comida / cocina / recetas", 8);
    }
    if ([
  "health",
  "fitness",
  "workout",
  "exercise",
  "gym",
  "wellness",
  "nutrition",
  "weight loss",
  "muscle",
  "diet",
  "salud",
  "ejercicio",
  "entrenamiento",
  "gimnasio",
  "bienestar",
  "nutrición",
  "nutricion",
  "músculo",
  "musculo",
  "dieta",
  "saúde",
  "saude",
  "exercício",
  "exercicio",
  "treino",
  "academia",
  "nutrição",
  "nutricao",
  "健康",
  "運動",
  "筋トレ",
  "ジム",
  "ダイエット",
  "栄養",
  "健身",
  "运动",
  "運動",
  "减肥",
  "減肥",
  "营养",
  "營養",
  "건강",
  "운동",
  "헬스",
  "다이어트",
  "영양"
].some(palabra => textoPrioridad.includes(palabra))) {
  sumarNicho("Salud / fitness / bienestar", 8);
    }
    if ([
  "home decor",
  "interior design",
  "renovation",
  "remodeling",
  "construction",
  "architecture",
  "house design",
  "decoración",
  "decoracion",
  "diseño interior",
  "diseño de interiores",
  "remodelación",
  "remodelacion",
  "construcción",
  "construccion",
  "arquitectura",
  "hogar",
  "decoração",
  "decoracao",
  "design de interiores",
  "reforma",
  "construção",
  "construcao",
  "arquitetura",
  "インテリア",
  "リフォーム",
  "建築",
  "住宅",
  "装修",
  "裝修",
  "室内设计",
  "室內設計",
  "建筑",
  "建築",
  "家居",
  "인테리어",
  "리모델링",
  "건축",
  "주택"
].some(palabra => textoPrioridad.includes(palabra))) {
  sumarNicho("Hogar / construcción / decoración", 8);
    }
    if ([
  "fashion",
  "beauty",
  "makeup",
  "skincare",
  "outfit",
  "hairstyle",
  "clothing",
  "dress",
  "moda",
  "belleza",
  "maquillaje",
  "cuidado de la piel",
  "ropa",
  "vestido",
  "peinado",
  "beleza",
  "maquiagem",
  "cuidados com a pele",
  "roupa",
  "penteado",
  "ファッション",
  "美容",
  "メイク",
  "スキンケア",
  "服",
  "时尚",
  "時尚",
  "化妆",
  "化妝",
  "护肤",
  "護膚",
  "服装",
  "服裝",
  "패션",
  "뷰티",
  "메이크업",
  "스킨케어",
  "옷",
  "헤어스타일"
].some(palabra => textoPrioridad.includes(palabra))) {
  sumarNicho("Moda / belleza / estilo", 8);
    }
    if ([
  "education",
  "learning",
  "learn",
  "study",
  "school",
  "university",
  "college",
  "course",
  "tutorial",
  "knowledge",
  "educación",
  "educacion",
  "aprendizaje",
  "aprender",
  "estudio",
  "estudiar",
  "escuela",
  "universidad",
  "curso",
  "conocimiento",
  "educação",
  "educacao",
  "aprendizagem",
  "estudo",
  "escola",
  "universidade",
  "conhecimento",
  "教育",
  "学習",
  "勉強",
  "学校",
  "大学",
  "知識",
  "学习",
  "學習",
  "学校",
  "學校",
  "大学",
  "大學",
  "知识",
  "知識",
  "교육",
  "학습",
  "공부",
  "학교",
  "대학교",
  "지식"
].some(palabra => textoPrioridad.includes(palabra))) {
  sumarNicho("Educación / aprendizaje", 8);
    }
    if ([
  "family",
  "parenting",
  "parents",
  "baby",
  "babies",
  "newborn",
  "toddler",
  "pregnancy",
  "familia",
  "crianza",
  "bebé",
  "bebe",
  "bebés",
  "bebes",
  "recién nacido",
  "recien nacido",
  "embarazo",
  "família",
  "bebê",
  "bebês",
  "gravidez",
  "家族",
  "子育て",
  "育児",
  "赤ちゃん",
  "妊娠",
  "家庭",
  "育儿",
  "育兒",
  "婴儿",
  "嬰兒",
  "宝宝",
  "寶寶",
  "怀孕",
  "懷孕",
  "가족",
  "육아",
  "아기",
  "신생아",
  "임신"
].some(palabra => textoPrioridad.includes(palabra))) {
  sumarNicho("Familia / crianza / bebés", 8);
    }
    if ([
  "meme",
  "memes",
  "funny",
  "comedy",
  "prank",
  "joke",
  "jokes",
  "humor",
  "comedia",
  "gracioso",
  "graciosa",
  "broma",
  "bromas",
  "chiste",
  "chistes",
  "engraçado",
  "engracado",
  "comédia",
  "comedia",
  "pegadinha",
  "piada",
  "piadas",
  "お笑い",
  "コメディ",
  "面白い",
  "ドッキリ",
  "ミーム",
  "搞笑",
  "喜剧",
  "喜劇",
  "恶作剧",
  "惡作劇",
  "段子",
  "迷因",
  "웃긴",
  "코미디",
  "장난",
  "몰카",
  "밈"
].some(palabra => textoPrioridad.includes(palabra))) {
  sumarNicho("Humor / memes / contenido viral", 8);
    }
    if ([
  "diy",
  "do it yourself",
  "life hack",
  "life hacks",
  "home hack",
  "home hacks",
  "handmade",
  "manualidad",
  "manualidades",
  "hazlo tú mismo",
  "hazlo tu mismo",
  "bricolaje",
  "artesanía",
  "artesania",
  "truco casero",
  "trucos caseros",
  "faça você mesmo",
  "faca voce mesmo",
  "feito à mão",
  "feito a mao",
  "artesanato",
  "truque caseiro",
  "truques caseiros",
  "手作り",
  "ハンドメイド",
  "ライフハック",
  "工作",
  "手工",
  "生活妙招",
  "生活技巧",
  "手作",
  "수공예",
  "핸드메이드",
  "생활꿀팁",
  "생활 팁"
].some(palabra => textoPrioridad.includes(palabra))) {
  sumarNicho("DIY / manualidades / trucos", 8);
    }
    if ([
  "relationship",
  "relationships",
  "dating",
  "love story",
  "boyfriend",
  "girlfriend",
  "couple",
  "breakup",
  "relación",
  "relaciones",
  "citas",
  "historia de amor",
  "novio",
  "novia",
  "pareja",
  "ruptura",
  "relacionamento",
  "relacionamentos",
  "namoro",
  "namorado",
  "namorada",
  "casal",
  "término",
  "恋愛",
  "デート",
  "恋人",
  "カップル",
  "別れ",
  "爱情",
  "愛情",
  "约会",
  "約會",
  "情侣",
  "情侶",
  "分手",
  "연애",
  "데이트",
  "남자친구",
  "여자친구",
  "커플",
  "이별"
].some(palabra => textoPrioridad.includes(palabra))) {
  sumarNicho("Relaciones / citas / historias personales", 8);
    }
    if ([
  "unboxing",
  "product review",
  "best products",
  "shopping haul",
  "worth buying",
  "buying guide",
  "product recommendation",
  "products",
  "shopping",
  "deals",
  "compras",
  "productos",
  "reseña de producto",
  "reseñas de productos",
  "mejores productos",
  "guía de compra",
  "guia de compra",
  "recomendación de producto",
  "recomendacion de producto",
  "ofertas",
  "vale la pena",
  "compras online",
  "produtos",
  "análise de produto",
  "analise de produto",
  "melhores produtos",
  "guia de compra",
  "recomendação",
  "recomendacao",
  "商品レビュー",
  "開封",
  "おすすめ商品",
  "購入ガイド",
  "買い物",
  "商品推荐",
  "商品推薦",
  "开箱",
  "開箱",
  "购物",
  "購物",
  "购买指南",
  "購買指南",
  "好物推荐",
  "好物推薦",
  "제품 리뷰",
  "언박싱",
  "추천 제품",
  "쇼핑",
  "구매 가이드",
  "할인"
].some(palabra => textoPrioridad.includes(palabra))) {
  sumarNicho("Productos / compras / recomendaciones", 8);
    }
    const nichosPuntuados = Object.entries(puntuacionNichos);
    

if (nichosPuntuados.length > 0) {
  nichosPuntuados.sort((a, b) => b[1] - a[1]);
  tema = nichosPuntuados[0][0];
}
if ([
  "mystery",
  "secret",
  "misterio",
  "secreto",
  "mistério",
  "segredo",
  "謎",
  "秘密",
  "神秘",
  "미스터리",
  "비밀"
].some(palabra => textoPrioridad.includes(palabra))) {
  formato = "Misterio / descubrimiento";
} else if ([
  "challenge",
  "reto",
  "desafío",
  "desafio",
  "desafio",
  "チャレンジ",
  "挑戦",
  "挑战",
  "도전"
].some(palabra => textoPrioridad.includes(palabra))) {
  formato = "Reto / desafío";
} else if ([
  "experiment",
  "experimento",
  "実験",
  "实验",
  "實驗",
  "실험"
].some(palabra => textoPrioridad.includes(palabra))) {
  formato = "Experimento";
} else if ([
  "review",
  "reseña",
  "resena",
  "análisis",
  "analisis",
  "avaliação",
  "avaliacao",
  "análise",
  "analise",
  "レビュー",
  "評測",
  "评测",
  "評論",
  "评论",
  "리뷰"
].some(palabra => texto.includes(palabra))) {
  formato = "Review / análisis";
} else if ([
  "before",
  "after",
  "antes",
  "después",
  "despues",
  "antes e depois",
  "antes y después",
  "ビフォー",
  "アフター",
  "变身",
  "改造前",
  "改造后",
  "改造後",
  "전후"
].some(palabra => textoPrioridad.includes(palabra))) {

  formato = "Transformación / antes y después";
    } else if ([
  "vs",
  "best",
  "worst",
  "ranking",
  "top",
  "mejor",
  "peor",
  "comparación",
  "comparacion",
  "melhor",
  "pior",
  "comparação",
  "comparacao",
  "ランキング",
  "比較",
  "最強",
  "排名",
  "对比",
  "比較",
  "순위",
  "비교"
].some(palabra => textoPrioridad.includes(palabra))) {
  formato = "Comparación / ranking";
} else if ([
  "facts",
  "curious",
  "curiosidad",
  "curiosidades",
  "datos",
  "curioso",
  "fatos",
  "curiosidade",
  "curiosidades",
  "雑学",
  "豆知識",
  "冷知识",
  "冷知識",
  "事实",
  "事實",
  "상식",
  "사실",
  "호기심"
].some(palabra => textoPrioridad.includes(palabra))) {

  formato = "Curiosidades / datos";
} else if ([
  "story",
  "stories",
  "historia",
  "historias",
  "relato",
  "relatos",
  "história",
  "histórias",
  "物語",
  "ストーリー",
  "故事",
  "故事",
  "이야기",
  "사연"
].some(palabra => textoPrioridad.includes(palabra))) {
  formato = "Historia / narración";
} else if ([
  "how",
  "how to",
  "why",
  "cómo",
  "como hacer",
  "por qué",
  "como fazer",
  "por que",
  "なぜ",
  "やり方",
  "为什么",
  "為什麼",
  "如何",
  "怎么",
  "怎麼",
  "왜",
  "어떻게"
].some(palabra => textoPrioridad.includes(palabra))) {
  formato = "Explicativo";
}
    const coincidencias = palabrasAdaptables.filter(
      palabra => texto.includes(palabra)
    ).length;

    let adaptabilidadScore =
  Math.min(coincidencias * 3, 10);
    if (formato !== "Contenido general") {
  adaptabilidadScore = Math.max(adaptabilidadScore, 6);
    }
    // Penalizar contenido muy dependiente de marcas,
    // trailers oficiales o grandes lanzamientos
    const palabrasDependientes = [
      "official trailer",
      "official music video",
      "official mv",
      "nintendo direct",
      "movie trailer",
      "teaser trailer",
      "gameplay trailer",
"launch trailer",
"announcement trailer",
"tráiler oficial",
"trailer oficial",
"avance oficial",
"teaser oficial",
"vídeo oficial",
"video oficial",
"clipe oficial",
"公式トレーラー",
"公式予告",
"公式mv",
"공식 트레일러",
"공식 예고편",
"공식 mv",
"官方预告片",
"官方預告片",
"官方mv"
];
    

    const dependiente =
      palabrasDependientes.some(
        palabra => texto.includes(palabra)
      );
if (dependiente) {
  adaptabilidadScore = Math.min(adaptabilidadScore, 2);
}
    const penalizacionDependencia =
      dependiente ? 25 : 0;
const spanishMarkets = ["MX", "CO", "AR", "ES", "PE", "CL"];

const universalTopics = [
  "Gaming / videojuegos",
  "Tecnología / IA",
  "Animales / naturaleza",
  "Ciencia / descubrimientos",
  "Vehículos / motor",
  "Comida / cocina / recetas",
  "Salud / fitness / bienestar",
  "DIY / manualidades / trucos",
  "Productos / compras / recomendaciones",
  "Humor / memes / contenido viral",
  "Educación / aprendizaje"
];

let targetFitScore = 4;

if (region === targetRegion) {
  targetFitScore += 3;
} else if (
  spanishMarkets.includes(region) &&
  spanishMarkets.includes(targetRegion)
) {
  targetFitScore += 2;
}

if (universalTopics.includes(tema)) {
  targetFitScore += 2;
}

if (adaptabilidadScore >= 6) {
  targetFitScore += 1;
}

if (dependiente) {
  targetFitScore = Math.min(targetFitScore, 2);
}

targetFitScore = Math.max(0, Math.min(10, targetFitScore));
    const score = Math.round(
      Math.max(
        0,
        Math.min(
          100,
          velocidadScore +
            alcanceScore +
            engagementScore +
            freshnessScore +
            adaptabilidadScore +
          targetFitScore -
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
      formato,
      tema,
      adaptabilidadScore,
      targetFitScore,
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
