import type { PostType } from "./posts";

export interface PostTemplate {
  id: string;
  label: string;
  emoji: string;
  type: PostType;
  caption: string;
  description: string;
}

export const POST_TEMPLATES: PostTemplate[] = [
  {
    id: "tip-financiero",
    label: "Tip financiero",
    emoji: "💡",
    type: "carousel",
    description: "Consejo práctico de finanzas personales",
    caption: `💡 TIP FINANCIERO DEL DÍA

[Describí el tip en una oración directa]

✅ Por qué importa:
[Explicá el beneficio concreto en 1-2 líneas]

📌 Cómo aplicarlo:
1. [Primer paso]
2. [Segundo paso]
3. [Tercer paso]

🎯 El resultado: [Qué lograría quien siga el consejo]

¿Ya lo estabas aplicando? Contame en los comentarios 👇`,
  },
  {
    id: "analisis-mercado",
    label: "Análisis de mercado",
    emoji: "📊",
    type: "carousel",
    description: "Análisis de un activo o situación económica",
    caption: `📊 ANÁLISIS DE LA SEMANA

[Nombre del activo / tema económico]

🔍 ¿Qué está pasando?
[2-3 líneas sobre la situación actual]

📈 Los números:
• [Dato 1]
• [Dato 2]
• [Dato 3]

⚠️ Lo que tenés que saber:
[Implicancia práctica para el inversor/ahorrista]

💭 Mi lectura: [Tu opinión o perspectiva]

¿Coincidís? Debatimos abajo 👇`,
  },
  {
    id: "comparativa",
    label: "Comparativa: X vs Y",
    emoji: "⚖️",
    type: "carousel",
    description: "Comparar dos opciones de inversión o ahorro",
    caption: `⚖️ [OPCIÓN A] vs [OPCIÓN B]
¿Cuál te conviene?

Antes de elegir, conocé las diferencias clave 👇

✅ [OPCIÓN A]:
• Rendimiento: [X%]
• Riesgo: [bajo/medio/alto]
• Liquidez: [inmediata/X días]
• Ideal para: [perfil]

✅ [OPCIÓN B]:
• Rendimiento: [X%]
• Riesgo: [bajo/medio/alto]
• Liquidez: [inmediata/X días]
• Ideal para: [perfil]

🎯 Mi recomendación:
Si [condición A] → elegí [Opción A]
Si [condición B] → elegí [Opción B]

¿Cuál usás vos? 👇`,
  },
  {
    id: "noticia-del-dia",
    label: "Noticia del día",
    emoji: "📰",
    type: "reel",
    description: "Explicar una noticia económica y su impacto",
    caption: `📰 [TITULAR DE LA NOTICIA]

Lo que necesitás saber en 60 segundos 👇

🔑 Qué pasó:
[Resumen en 2 líneas, sin tecnicismos]

💥 Por qué te afecta:
[Impacto directo en el bolsillo / ahorro / inversiones]

✅ Qué podés hacer:
[Acción concreta que puede tomar el espectador]

⚡ La clave: [Mensaje de cierre contundente]

¿Tenías info de esto? Comentá 👇`,
  },
  {
    id: "educativo-concepto",
    label: "Concepto educativo",
    emoji: "🎓",
    type: "carousel",
    description: "Explicar un concepto financiero desde cero",
    caption: `🎓 ¿QUÉ ES [CONCEPTO]?

Explicado para que lo entienda cualquiera 👇

📖 Definición simple:
[El concepto en máximo 2 oraciones, sin jerga]

🤔 ¿Para qué sirve?
[Caso de uso práctico en la vida cotidiana]

📌 Ejemplo real:
[Ejemplo concreto con números argentinos]

⚠️ Lo que nadie te dice:
[Un aspecto oculto o poco conocido]

🚀 Cómo empezar:
[Primer paso para quien quiere aplicarlo]

¿Te quedaron dudas? Preguntá en comentarios 👇`,
  },
  {
    id: "historia-personal",
    label: "Historia / caso real",
    emoji: "💬",
    type: "reel",
    description: "Contar un caso o experiencia personal con finanzas",
    caption: `💬 [TÍTULO QUE GENERE INTRIGA]

Esto es lo que aprendí (de la manera difícil) 👇

📍 La situación:
[Contexto del caso en 1-2 líneas]

❌ El error / el problema:
[Qué salió mal o cuál era el desafío]

💡 El momento de cambio:
[Qué pensé / qué aprendí / qué cambié]

✅ El resultado:
[Consecuencia concreta y medible]

🎯 La lección:
[Una enseñanza aplicable para tu audiencia]

¿Te pasó algo parecido? Contame 👇`,
  },
  {
    id: "mito-vs-realidad",
    label: "Mito vs Realidad",
    emoji: "🚫",
    type: "carousel",
    description: "Desmentir creencias populares sobre finanzas",
    caption: `🚫 MITOS DEL DINERO QUE TE CUESTAN PLATA

¿Cuántos creés que son ciertos? 👇

❌ MITO 1: "[Creencia popular falsa]"
✅ REALIDAD: [La verdad respaldada por datos]

❌ MITO 2: "[Creencia popular falsa]"
✅ REALIDAD: [La verdad respaldada por datos]

❌ MITO 3: "[Creencia popular falsa]"
✅ REALIDAD: [La verdad respaldada por datos]

💡 La conclusión:
[Mensaje de cierre que empodera al lector]

¿Creías alguno de estos mitos? Comentá cuál 👇`,
  },
  {
    id: "checklist",
    label: "Checklist / Guía paso a paso",
    emoji: "✅",
    type: "carousel",
    description: "Lista accionable para lograr un objetivo financiero",
    caption: `✅ CHECKLIST: [OBJETIVO FINANCIERO]

Guardá esto para cuando lo necesites 📌

□ Paso 1: [Acción concreta]
□ Paso 2: [Acción concreta]
□ Paso 3: [Acción concreta]
□ Paso 4: [Acción concreta]
□ Paso 5: [Acción concreta]

⏰ Tiempo estimado: [X minutos/horas/días]
💰 Costo: [Gratis / $X / Sin costo inicial]
🎯 Resultado: [Qué lograría al completarlo]

¿En qué paso estás vos? Comentá el número 👇`,
  },
];
