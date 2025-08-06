# 翻译应用 (Translation App)

一个功能强大的多语言翻译应用，支持多种翻译 API 和批量文件处理。

## 🌟 特性

- **多翻译引擎支持**: DeepL、Google Translate、DeepSeek、Zhipu、Microsoft
- **批量翻译**: 支持 Excel 文件批量翻译
- **多语言支持**: 支持 40+ 种语言
- **现代化界面**: 基于 Vue 3 + TypeScript + Tailwind CSS
- **文件处理**: 支持上传 Excel 文件并导出翻译结果
- **实时翻译**: 支持文本实时翻译
- **键名转换**: 支持多种键名格式转换

## 🚀 快速开始

### 环境要求

- Node.js >= 20.19.0 或 >= 22.12.0
- npm 或 yarn

### 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 环境配置

1. 在 `backend` 目录下创建 `.env` 文件：

```env
PORT=3000
DEEPL_API_KEY=your_deepl_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
ZHIPU_API_KEY=your_zhipu_api_key
GOOGLE_APPLICATION_CREDENTIALS=path_to_google_credentials.json
```

2. 在 `frontend` 目录下创建 `.env` 文件（如果需要）：

```env
VITE_API_BASE_URL=http://localhost:3000
```

### 启动应用

```bash
# 启动后端服务
cd backend
npm run dev

# 启动前端服务（新终端）
cd frontend
npm run dev
```

访问 http://localhost:5173 开始使用应用。

## 📁 项目结构

```
translation-app/
├── backend/                 # 后端服务
│   ├── src/
│   │   └── index.ts        # 主服务文件
│   ├── package.json
│   └── .env               # 环境变量
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── App.vue        # 主应用组件
│   │   └── components/    # Vue 组件
│   ├── package.json
│   └── vite.config.ts     # Vite 配置
└── README.md
```

## 🔧 技术栈

### 后端

- **Node.js** + **TypeScript**
- **Express.js** - Web 框架
- **Multer** - 文件上传处理
- **XLSX** - Excel 文件处理
- **翻译 APIs**:
  - DeepL API
  - Google Translate API
  - DeepSeek API
  - Zhipu API
  - Microsoft Translator API

### 前端

- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **Axios** - HTTP 客户端
- **File-Saver** - 文件下载
- **JSZip** - ZIP 文件处理

## 📖 使用指南

### 1. 文件翻译

1. 选择 "文件上传" 模式
2. 上传包含英文文本的 Excel 文件
3. 选择目标语言
4. 选择翻译引擎
5. 点击 "开始翻译"
6. 下载翻译结果

### 2. 文本翻译

1. 选择 "文本输入" 模式
2. 输入要翻译的英文文本
3. 选择目标语言
4. 选择翻译引擎
5. 点击 "开始翻译"

### 3. 键名格式转换

支持以下键名格式：

- **原始格式**: 保持原始键名
- **小驼峰**: `userName`
- **大驼峰**: `UserName`

## 🌍 支持的语言

应用支持 40+ 种语言，包括：

- 英语 (EN)
- 法语 (FR)
- 德语 (DE)
- 日语 (JA)
- 繁体中文 (zh-TW)
- 阿拉伯语 (AR)
- 意大利语 (IT)
- 泰语 (TH)
- 西班牙语 (ES)
- 葡萄牙语 (PT)
- 韩语 (KO)
- 荷兰语 (NL)
- 瑞典语 (SV)
- 俄语 (RU)
- 印尼语 (ID)
- 马来语 (MS)
- 波兰语 (PL)
- 挪威语 (NO)
- 丹麦语 (DA)
- 爱尔兰语 (GA)
- 芬兰语 (FI)
- 捷克语 (CS)
- 越南语 (VI)
- 希腊语 (EL)
- 斯洛伐克语 (SK)
- 希伯来语 (HE)
- 土耳其语 (TR)
- 罗马尼亚语 (RO)
- 匈牙利语 (HU)
- 保加利亚语 (BG)
- 哈萨克语 (KK)
- 塞尔维亚语 (SR)
- 斯洛文尼亚语 (SL)
- 立陶宛语 (LT)
- 阿塞拜疆语 (AZ)
- 格鲁吉亚语 (KA)
- 拉脱维亚语 (LV)
- 爱沙尼亚语 (ET)
- 冰岛语 (IS)
- 克罗地亚语 (HR)

## 🔑 API 配置

### DeepL API

1. 注册 [DeepL API](https://www.deepl.com/pro-api)
2. 获取 API 密钥
3. 在 `.env` 文件中设置 `DEEPL_API_KEY`

### Google Translate API

1. 设置 Google Cloud 项目
2. 启用 Cloud Translation API
3. 创建服务账户并下载凭证文件
4. 在 `.env` 文件中设置 `GOOGLE_APPLICATION_CREDENTIALS`

### DeepSeek API

1. 注册 [DeepSeek API](https://platform.deepseek.com/)
2. 获取 API 密钥
3. 在 `.env` 文件中设置 `DEEPSEEK_API_KEY`

### Zhipu API

1. 注册 [智谱 AI](https://open.bigmodel.cn/)
2. 获取 API 密钥
3. 在 `.env` 文件中设置 `ZHIPU_API_KEY`

## 🛠️ 开发

### 后端开发

```bash
cd backend
npm run dev  # 开发模式，支持热重载
npm start    # 生产模式
```

### 前端开发

```bash
cd frontend
npm run dev      # 开发服务器
npm run build    # 构建生产版本
npm run preview  # 预览构建结果
```

### 类型检查

```bash
# 前端类型检查
cd frontend
npm run type-check
```

## 📝 文件格式

### 输入文件格式

Excel 文件应包含以下列：

- `key`: 翻译键名
- `en`: 英文文本

示例：
| key | en |
|-----|----|
| welcome | Welcome to our app |
| hello | Hello world |

### 输出文件格式

翻译后的文件将包含所有目标语言的列：

| key     | en                 | zh-CN              | ja               | fr                               |
| ------- | ------------------ | ------------------ | ---------------- | -------------------------------- |
| welcome | Welcome to our app | 欢迎使用我们的应用 | アプリへようこそ | Bienvenue dans notre application |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 ISC 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 常见问题

### Q: 翻译质量如何？

A: 应用支持多种翻译引擎，可以根据需要选择最适合的引擎。DeepL 通常提供较高质量的翻译。

### Q: 支持哪些文件格式？

A: 目前支持 Excel 文件 (.xlsx, .xls) 的导入和导出。

### Q: 如何处理大量文本？

A: 应用支持批量翻译，建议将大量文本整理成 Excel 文件进行批量处理。

### Q: 翻译 API 有使用限制吗？

A: 是的，各个翻译 API 都有使用限制和计费政策，请查看相应的 API 文档。

## 📞 支持

如果遇到问题或有建议，请：

1. 查看 [Issues](../../issues) 页面
2. 创建新的 Issue
3. 联系开发团队

---

**享受多语言翻译的便利！** 🌍✨
