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
let formato = "Contenido general";
let tema = "Tema general";
    if ([
  "gaming",
  "gameplay",
  "video game",
  "videogame",
  "gamer",
  "videojuego",
  "videojuegos",
  "juego",
  "jogos",
  "jogo",
  "free fire",
  "minecraft",
  "fortnite",
  "roblox",
  "nintendo",
  "playstation",
  "xbox",
  "ゲーム",
  "ゲーム実況",
  "游戏",
  "遊戲",
  "게임"
].some(palabra => texto.includes(palabra))) {
  tema = "Gaming / videojuegos";
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
  "inteligência artificial",
  "robótica",
  "robotica",
  "celular",
  "人工知能",
  "テクノロジー",
  "スマホ",
  "ロボット",
  "人工智能",
  "科技",
  "手机",
  "手機",
  "机器人",
  "機器人",
  "인공지능",
  "기술",
  "스마트폰",
  "로봇"
].some(palabra => texto.includes(palabra))) {
  tema = "Tecnología / IA";
    }
    if ([
  "money",
  "finance",
  "financial",
  "business",
  "businesses",
  "investing",
  "investment",
  "stocks",
  "stock market",
  "crypto",
  "bitcoin",
  "millionaire",
  "income",
  "dinero",
  "finanzas",
  "negocio",
  "negocios",
  "inversión",
  "inversion",
  "acciones",
  "bolsa",
  "criptomonedas",
  "millonario",
  "ingresos",
  "dinheiro",
  "finanças",
  "financas",
  "negócio",
  "negocio",
  "investimento",
  "ações",
  "acoes",
  "renda",
  "お金",
  "投資",
  "株",
  "金融",
  "ビジネス",
  "赚钱",
  "賺錢",
  "投资",
  "投資",
  "股票",
  "金融",
  "돈",
  "투자",
  "주식",
  "금융",
  "사업"
].some(palabra => texto.includes(palabra))) {
  tema = "Dinero / negocios / finanzas";
    }
    if ([
  "mystery",
  "mysterious",
  "secret",
  "unsolved",
  "true crime",
  "crime",
  "murder",
  "missing",
  "disappearance",
  "misterio",
  "misterioso",
  "secreto",
  "sin resolver",
  "crimen",
  "asesinato",
  "desaparición",
  "desaparicion",
  "mistério",
  "segredo",
  "assassinato",
  "desaparecimento",
  "謎",
  "ミステリー",
  "未解決",
  "事件",
  "失踪",
  "殺人",
  "神秘",
  "谜",
  "謎",
  "悬案",
  "懸案",
  "失踪",
  "失蹤",
  "案件",
  "미스터리",
  "미제사건",
  "사건",
  "실종",
  "살인"
].some(palabra => texto.includes(palabra))) {
  tema = "Misterio / crimen / casos extraños";
    }
    if ([
  "animal",
  "animals",
  "wildlife",
  "nature",
"dogs",
"cats",
"pets",
  "mascota",
  "mascotas",
  "animales",
  "naturaleza",
  "perro",
  "gato",
  "fauna",
  "animal",
  "animais",
  "natureza",
  "cachorro",
  "gato",
  "動物",
  "自然",
  "犬",
  "猫",
  "动物",
  "動物",
  "自然",
  "狗",
  "猫",
  "동물",
  "자연",
  "강아지",
  "고양이"
].some(palabra => texto.includes(palabra))) {
  tema = "Animales / naturaleza";
    }
    if ([
  "science",
  "scientist",
  "scientific",
  "discovery",
  "research",
  "physics",
  "biology",
  "space",
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
  "espacio",
  "ciência",
  "cientista",
  "descoberta",
  "pesquisa",
  "física",
  "biologia",
  "espaço",
  "科学",
  "研究",
  "発見",
  "宇宙",
  "物理",
  "生物",
  "发现",
  "發現",
  "과학",
  "연구",
  "발견",
  "우주",
  "물리",
  "생물"
].some(palabra => texto.includes(palabra))) {
  tema = "Ciencia / descubrimientos";
    }
    if ([
  "vehicle",
  "vehicles",
  "automotive",
  "cars",
  "motorcycle",
  "motorcycles",
  "supercar",
  "engine",
  "carro",
  "carros",
  "vehículo",
  "vehiculo",
  "vehículos",
  "vehiculos",
  "automóvil",
  "automovil",
  "moto",
  "motos",
  "motocicleta",
  "motor",
  "veículo",
  "veiculo",
  "veículos",
  "veiculos",
  "carros",
  "motos",
  "自動車",
  "車",
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
].some(palabra => texto.includes(palabra))) {
  tema = "Vehículos / motor";
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
  "turismo",
  "explorar",
  "exploração",
  "exploracao",
  "destino",
  "旅行",
  "旅",
  "観光",
  "探索",
  "廃墟",
  "旅行",
  "旅游",
  "旅遊",
  "探索",
  "景点",
  "景點",
  "废墟",
  "廢墟",
  "여행",
  "관광",
  "탐험",
  "탐방",
  "폐허"
].some(palabra => texto.includes(palabra))) {
  tema = "Lugares / viajes / exploración";
    }
    if ([
  "movie",
  "film",
  "series",
  "celebrity",
  "music",
  "song",
  "singer",
  "actor",
  "actress",
  "cinema",
  "película",
  "pelicula",
  "serie",
  "celebridad",
  "música",
  "musica",
  "canción",
  "cancion",
  "cantante",
  "actor",
  "actriz",
  "cine",
  "filme",
  "série",
  "serie",
  "celebridade",
  "música",
  "musica",
  "canção",
  "cancao",
  "cantor",
  "atriz",
  "映画",
  "ドラマ",
  "音楽",
  "歌",
  "歌手",
  "俳優",
  "电影",
  "電影",
  "电视剧",
  "電視劇",
  "音乐",
  "音樂",
  "歌曲",
  "歌手",
  "演员",
  "演員",
  "영화",
  "드라마",
  "음악",
  "노래",
  "가수",
  "배우"
].some(palabra => texto.includes(palabra))) {
  tema = "Entretenimiento / cultura pop";
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
  "f1",
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
  "tenis",
  "boxe",
  "campeonato",
  "torneio",
  "partida",
  "サッカー",
  "野球",
  "バスケットボール",
  "テニス",
  "ボクシング",
  "試合",
  "大会",
  "足球",
  "篮球",
  "籃球",
  "棒球",
  "网球",
  "網球",
  "拳击",
  "拳擊",
  "比赛",
  "比賽",
  "축구",
  "농구",
  "야구",
  "테니스",
  "복싱",
  "경기",
  "대회"
].some(palabra => texto.includes(palabra))) {
  tema = "Deportes / competencias";
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
  "chef",
  "restaurante",
  "receita",
  "receitas",
  "cozinha",
  "comida",
  "restaurante",
  "料理",
  "レシピ",
  "食べ物",
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
].some(palabra => texto.includes(palabra))) {
  tema = "Comida / cocina / recetas";
    }
    if ([
  "health",
  "fitness",
  "workout",
  "exercise",
  "gym",
  "wellness",
  "weight loss",
  "nutrition",
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
  "bem-estar",
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
].some(palabra => texto.includes(palabra))) {
  tema = "Salud / fitness / bienestar";
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
].some(palabra => texto.includes(palabra))) {
  tema = "Hogar / construcción / decoración";
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
  "estilo de moda",
  "beleza",
  "maquiagem",
  "cuidados com a pele",
  "roupa",
  "vestido",
"penteado",
"ファッション",
"美容",
"メイク",
"スキンケア",
"服",
"コーデ",
"时尚",
"時尚",
"美容",
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
].some(palabra => texto.includes(palabra))) {
  tema = "Moda / belleza / estilo";
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
  "aprender",
  "estudo",
  "escola",
  "universidade",
  "curso",
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
].some(palabra => texto.includes(palabra))) {
  tema = "Educación / aprendizaje";
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
].some(palabra => texto.includes(palabra))) {
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
].some(palabra => texto.includes(palabra))) {
  formato = "Reto / desafío";
} else if ([
  "experiment",
  "experimento",
  "実験",
  "实验",
  "實驗",
  "실험"
].some(palabra => texto.includes(palabra))) {
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
].some(palabra => texto.includes(palabra))) {

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
].some(palabra => texto.includes(palabra))) {
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
].some(palabra => texto.includes(palabra))) {

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
].some(palabra => texto.includes(palabra))) {
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
].some(palabra => texto.includes(palabra))) {
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
      "teaser trailer"
    ];

    const dependiente =
      palabrasDependientes.some(
        palabra => texto.includes(palabra)
      );
if (dependiente) {
  adaptabilidadScore = Math.min(adaptabilidadScore, 2);
}
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
      formato,
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
