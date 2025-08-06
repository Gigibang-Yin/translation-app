// translation-app/backend/src/index.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import xlsx from 'xlsx';
import * as deepl from 'deepl-node';
import { v2 } from '@google-cloud/translate';
import axios from 'axios';
import { sign } from 'jsonwebtoken'; // Using jsonwebtoken for Zhipu auth

// --- INITIALIZATION ---
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// API Clients & Keys
const deeplApiKey = process.env.DEEPL_API_KEY;
const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
const zhipuApiKey = process.env.ZHIPU_API_KEY;

const deeplTranslator = new deepl.Translator(deeplApiKey || '');
const googleTranslator = new v2.Translate();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- TYPES ---
interface TranslationItem {
  key: string;
  en: string;
  [key: string]: string;
}

// --- LLM TRANSLATION HELPERS ---

async function callDeepSeek(text: string, targetLang: string): Promise<string> {
    if (!deepseekApiKey) throw new Error("DEEPSEEK_API_KEY is not configured.");
    const response = await axios.post('https://api.deepseek.com/chat/completions', {
        model: 'deepseek-chat',
        messages: [
            { role: 'system', content: 'You are a professional, authentic translation engine, translating directly without explanations.' },
            { role: 'user', content: `Translate the following English text to ${targetLang}: "${text}"` }
        ],
    }, { headers: { 'Authorization': `Bearer ${deepseekApiKey}` } });
    return response.data.choices[0].message.content.trim();
}

function generateZhipuToken(apiKey: string, expSeconds: number): string {
    const [id, secret] = apiKey.split('.');
    const payload = {
        api_key: id,
        exp: Math.floor(Date.now() / 1000) + expSeconds,
        timestamp: Date.now(),
    };
    // Using `as any` to bypass the strict type check for the custom 'sign_type' header.
    // This is safe because we know the Zhipu API requires this specific header.
    const header = { alg: 'HS256', sign_type: 'SIGN' } as any;
    return sign(payload, secret, { algorithm: 'HS256', header: header });
}

async function callZhipu(text: string, targetLang: string): Promise<string> {
    if (!zhipuApiKey) throw new Error("ZHIPU_API_KEY is not configured.");
    const token = generateZhipuToken(zhipuApiKey, 3600);
    const response = await axios.post('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        model: 'glm-4',
        messages: [
            { role: 'system', content: 'You are a professional translation engine. Directly provide the translation without any additional text.' },
            { role: 'user', content: `Please translate the following English text into ${targetLang}: "${text}"` }
        ],
    }, { headers: { 'Authorization': `Bearer ${token}` } });
    return response.data.choices[0].message.content.trim();
}

// --- REUSABLE TRANSLATION LOGIC ---
async function performTranslation(
  sourceData: Array<{ key: string; en: string }>,
  targetLangs: string[],
  api: 'DeepL' | 'Google' | 'DeepSeek' | 'Zhipu' | 'Microsoft'
): Promise<TranslationItem[]> {
  
  const translateText = async (text: string, targetLang: string): Promise<string> => {
    switch (api) {
      case 'Zhipu':
        return callZhipu(text, targetLang);
      case 'DeepSeek':
        return callDeepSeek(text, targetLang);
      case 'Google':
        const googleTargetLang = targetLang.toLowerCase() === 'zh' ? 'zh-CN' : targetLang;
        const [translation] = await googleTranslator.translate(text, googleTargetLang);
        return translation;
      case 'DeepL':
      default:
        const result = await deeplTranslator.translateText(text, 'en', targetLang as deepl.TargetLanguageCode);
        return result.text;
    }
  };

  return Promise.all(
    sourceData.map(async (row) => {
      const newRow: TranslationItem = { ...row };
      await Promise.all(
        targetLangs.map(async (lang) => {
          newRow[lang] = await translateText(row.en, lang);
        })
      );
      return newRow;
    })
  );
}

// --- ROUTES ---
app.get('/api/template', (req, res) => { /* ... unchanged ... */ });

const handleTranslationRequest = async (req: Request, res: Response, sourceData: any) => {
    const { languages: languagesJSON, api } = req.body;
    if (!languagesJSON) return res.status(400).json({ error: '没有提供目标语言' });

    try {
        const targetLangs = JSON.parse(languagesJSON);
        const translatedData = await performTranslation(sourceData, targetLangs, api);
        res.status(200).json({ message: '翻译成功！', data: translatedData });
    } catch (error: any) {
        console.error(`[${api}] 翻译过程中出错:`, error.response ? error.response.data : error.message);
        res.status(500).json({ error: `使用 ${api} 翻译时出错: ${error.message}` });
    }
};

app.post('/api/translate-text', async (req, res) => {
    const { sourceData } = req.body;
    if (!sourceData || !Array.isArray(sourceData) || sourceData.length === 0) {
        return res.status(400).json({ error: '没有提供需要翻译的文本数据' });
    }
    await handleTranslationRequest(req, res, sourceData);
});

app.post('/api/translate', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: '没有提供文件' });
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const sourceData: Array<{ key: string; en: string }> = xlsx.utils.sheet_to_json(worksheet, { header: ['key', 'en'] });
    await handleTranslationRequest(req, res, sourceData);
});

// --- SERVER START ---
app.listen(port, () => {
  console.log(`后端服务器运行在 http://localhost:${port}`);
  if (deeplApiKey) console.log("DeepL服务已初始化。");
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) console.log("Google Cloud服务已准备就绪。");
  if (deepseekApiKey) console.log("DeepSeek服务已准备就绪。");
  if (zhipuApiKey) console.log("智谱AI服务已准备就绪。");
});
