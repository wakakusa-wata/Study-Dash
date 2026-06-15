import express from "express";
import path from "path";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(cors());

  // Initialize Gemini AI using the modern @google/genai client
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API endpoint for study advice and task delay analyses
  app.post("/api/gemini/advisor", async (req, res) => {
    try {
      const { tasks, goals, journals, userName } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API key is not configured on the server." });
      }

      // Build context
      const serializedTasks = (tasks || []).map((t: any) => 
        `- 課題: ${t.title} (期限: ${t.deadline ? new Date(t.deadline).toLocaleDateString("ja-JP") : "未設定"}, 優先度: ${t.priority}, 進捗: ${t.progress}%, ステータス: ${t.status})`
      ).join("\n");

      const serializedGoals = (goals || []).map((g: any) => 
        `- 目標: ${g.title} (対象期間: ${g.startDate ? new Date(g.startDate).toLocaleDateString("ja-JP") : "未設定"} 〜 ${g.endDate ? new Date(g.endDate).toLocaleDateString("ja-JP") : "未設定"}, 状態: ${g.status})`
      ).join("\n");

      const serializedJournals = (journals || []).map((j: any) => 
        `- 振り返り日: ${new Date(j.createdAt).toLocaleDateString("ja-JP")} (勉強時間: ${j.studyMinutes}分): ${j.content}`
      ).join("\n");

      const prompt = `
あなたは熱心で優秀な学習支援アドバイザーです。ユーザー ${userName || "学習者"} さんの学習進捗と記録に基いて、親密かつ具体的な学習のアドバイス、進捗の遅れ（期限超過、期限直前で進捗が低い課題）に対する具体的なリマインド・軌道修正プランを提示してください。

【現在の課題データ】
${serializedTasks || "現在のアクティブな課題はありません。"}

【目標設定】
${serializedGoals || "設定された定期目標はありません。"}

【最近の学習振り返り（ジャーナル）】
${serializedJournals || "振り返りの記録はまだありません。"}

以下のような形式で、JSONではなく、読みやすいマークダウン形式で簡潔に、しかし温かみのある回答を出力してください。
1. **分析とリマインド**: 期限が切れている、または進捗が遅れている課題とその原因をジャーナルや進捗率から見ぬいて、具体的なリマインドをアドバイスしてください。
2. **優先度のアドバイス**: 現在の課題から、優先度と期限をふまえ、今日・今週「本当にやるべきこと」を3つに絞ってフォーカスさせてください。
3. **継続の励まし**: ジャーナルから見える努力や、勉強時間について、前向きかつ具体的に褒め、次の目標に向けたやる気を引き出してください。
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const responseText = response.text || "アドバイスの生成に失敗しました。時間をおいて再度お試しください。";
      res.json({ advice: responseText });
    } catch (error: any) {
      console.error("Gemini Advisor Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate AI advice." });
    }
  });

  // Vite setup for dev development, static file host for prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`StudyDash Full-Stack Server listening on http://localhost:${PORT}`);
  });
}

startServer();
