// translation-app/backend/src/index.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import xlsx from 'xlsx';
import * as deepl from 'deepl-node';
import { v2 } from '@google-cloud/translate';
import axios from 'axios';
import { sign } from 'jsonwebtoken';

// --- INITIALIZATION ---
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// API Clients & Keys
const deeplApiKey = process.env.DEEPL_API_KEY;
const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
const zhipuApiKey = process.env.ZHIPU_API_KEY;

let deeplTranslator: deepl.Translator | undefined;
if (deeplApiKey) {
  deeplTranslator = new deepl.Translator(deeplApiKey);
}

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
const languageNameMapping: { [key: string]: string } = {
    'EN': 'English',
    'FR': 'French',
    'DE': 'German',
    'JA': 'Japanese',
    'zh-TW': 'Traditional Chinese',
    'AR': 'Arabic',
    'IT': 'Italian',
    'TH': 'Thai',
    'ES': 'Spanish',
    'PT': 'Portuguese',
    'KO': 'Korean',
    'NL': 'Dutch',
    'SV': 'Swedish',
    'RU': 'Russian',
    'ID': 'Indonesian',
    'MS': 'Malay',
    'PL': 'Polish',
    'NO': 'Norwegian',
    'DA': 'Danish',
    'GA': 'Irish',
    'FI': 'Finnish',
    'CS': 'Czech',
    'VI': 'Vietnamese',
    'EL': 'Greek',
    'SK': 'Slovak',
    'HE': 'Hebrew',
    'TR': 'Turkish',
    'RO': 'Romanian',
    'HU': 'Hungarian',
    'BG': 'Bulgarian',
    'KK': 'Kazakh',
    'SR': 'Serbian',
    'SL': 'Slovenian',
    'LT': 'Lithuanian',
    'AZ': 'Azerbaijani',
    'KA': 'Georgian',
    'LV': 'Latvian',
    'ET': 'Estonian',
    'IS': 'Icelandic',
    'HR': 'Croatian',
};

async function performTranslation(
  sourceData: Array<{ key: string; en: string }>,
  targetLangs: string[],
  api: 'DeepL' | 'Google' | 'DeepSeek' | 'Zhipu' | 'Microsoft'
): Promise<TranslationItem[]> {
  const { default: PQueue } = await import('p-queue');
  const queue = new PQueue({ concurrency: 2 }); // Concurrency limit of 2

  const translateText = async (text: string, targetLang: string): Promise<string> => {
    const fullLanguageName = languageNameMapping[targetLang] || targetLang;

    switch (api) {
      case 'Zhipu':
        return callZhipu(text, fullLanguageName);
      case 'DeepSeek':
        return callDeepSeek(text, fullLanguageName);
      case 'Google':
        if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) throw new Error("Google Cloud credentials are not configured.");
        const [translation] = await googleTranslator.translate(text, targetLang);
        return translation;
      case 'DeepL':
      default:
        if (!deeplTranslator) throw new Error("DEEPL_API_KEY is not configured.");
        // DeepL uses 'zh' for both Simplified and Traditional. Let's map them.
        const deeplTargetLang = targetLang.startsWith('zh') ? 'zh' : targetLang;
        const result = await deeplTranslator.translateText(text, 'en', deeplTargetLang as deepl.TargetLanguageCode);
        return result.text;
    }
  };

  const translationPromises: Promise<void>[] = [];
  const results: TranslationItem[] = sourceData.map(row => ({ ...row }));

  for (let i = 0; i < sourceData.length; i++) {
    for (const lang of targetLangs) {
      translationPromises.push(
        queue.add(async () => {
          const translatedText = await translateText(sourceData[i].en, lang);
          results[i][lang] = translatedText;
        })
      );
    }
  }

  await Promise.all(translationPromises);
  return results;
}

// --- ROUTES ---
app.get('/api/template', (req, res) => {
    const templateData = [ { key: 'app_title', en: 'My Awesome App' }, { key: 'welcome_message', en: 'Welcome!' } ];
    const worksheet = xlsx.utils.json_to_sheet(templateData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'translations');
    res.setHeader('Content-Disposition', 'attachment; filename="template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.send(buffer);
});

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
  if (deeplApiKey) console.log("✔️ DeepL服务已初始化。");
  else console.log("➖ DeepL服务未配置 (DEEPL_API_KEY 未设置)。");
  
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) console.log("✔️ Google Cloud服务已准备就绪。");
  else console.log("➖ Google Cloud服务未配置 (GOOGLE_APPLICATION_CREDENTIALS 未设置)。");

  if (deepseekApiKey) console.log("✔️ DeepSeek服务已准备就绪。");
  else console.log("➖ DeepSeek服务未配置 (DEEPSEEK_API_KEY 未设置)。");

  if (zhipuApiKey) console.log("✔️ 智谱AI服务已准备就绪。");
  else console.log("➖ 智谱AI服务未配置 (ZHIPU_API_KEY 未设置)。");
});
