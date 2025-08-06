<script setup lang="ts">
import { ref, computed } from 'vue';
import axios from 'axios';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

// --- TYPES & INTERFACES ---
interface TranslationItem {
  key: string;
  en: string;
  [key: string]: string;
}
type InputType = 'file' | 'text';
type KeyCaseType = 'original' | 'lowerCamelCase' | 'UpperCamelCase';

// --- STATE ---
const availableLanguages = [
  { name: 'English', code: 'EN' },
  { name: 'Français', code: 'FR' },
  { name: 'Deutsch', code: 'DE' },
  { name: '日本語', code: 'JA' },
  { name: '繁體中文', code: 'zh-TW' },
  { name: 'العربية', code: 'AR' },
  { name: 'Italiano', code: 'IT' },
  { name: 'ภาษาไทย', code: 'TH' },
  { name: 'Español', code: 'ES' },
  { name: 'Português', code: 'PT' },
  { name: '한국어', code: 'KO' },
  { name: 'Dutch', code: 'NL' },
  { name: 'Svenska', code: 'SV' },
  { name: 'Русский', code: 'RU' },
  { name: 'Indonesia', code: 'ID' },
  { name: 'Melayu', code: 'MS' },
  { name: 'Polski', code: 'PL' },
  { name: 'Norsk', code: 'NO' },
  { name: 'Dansk', code: 'DA' },
  { name: 'Gaeilge', code: 'GA' },
  { name: 'Suomi', code: 'FI' },
  { name: 'Čeština', code: 'CS' },
  { name: 'Tiếng Việt', code: 'VI' },
  { name: 'Ελληνικά', code: 'EL' },
  { name: 'Slovenský', code: 'SK' },
  { name: 'עברית', code: 'HE' },
  { name: 'Türkçe', code: 'TR' },
  { name: 'Română', code: 'RO' },
  { name: 'Magyar', code: 'HU' },
  { name: 'Български', code: 'BG' },
  { name: 'Қазақ тілі', code: 'KK' },
  { name: 'Српски', code: 'SR' },
  { name: 'Slovenščina', code: 'SL' },
  { name: 'Lietuvių kalba', code: 'LT' },
  { name: 'Azərbaycan', code: 'AZ' },
  { name: 'ქართული', code: 'KA' },
  { name: 'Latviešu valoda', code: 'LV' },
  { name: 'Eesti keel', code: 'ET' },
  { name: 'Íslenska', code: 'IS' },
  { name: 'Hrvatski', code: 'HR' },
];

const inputType = ref<InputType>('file');
const selectedFile = ref<File | null>(null);
const rawText = ref('');
const selectedApi = ref('Zhipu');
const targetLanguages = ref<string[]>(['zh-CN']);
const fileName = ref('尚未选择文件');
const keyCaseType = ref<KeyCaseType>('original');
const isLangListExpanded = ref(false);

const commonLanguages = computed(() => availableLanguages.slice(0, 18));
const moreLanguages = computed(() => availableLanguages.slice(18));

const translationResult = ref<TranslationItem[]>([]);
const isLoading = ref(false);
const errorMessage = ref('');

const isTranslateButtonDisabled = computed(() => {
  if (isLoading.value) return true;
  if (inputType.value === 'file' && !selectedFile.value) return true;
  if (inputType.value === 'text' && rawText.value.trim() === '') return true;
  return false;
});

// --- HELPERS ---
const toCamelCase = (str: string, isUpper: boolean) => {
  // 替换掉所有非字母数字的字符为空格，然后按空格分割
  const parts = str.replace(/[^a-zA-Z0-9]/g, ' ').split(/\s+/).filter(p => p);
  if (parts.length === 0) return '';
  
  return parts.map((part, index) => {
    if (part) {
       // 第一个单词根据 isUpper 决定首字母大小写，其余单词首字母大写
      if (index === 0) {
        return isUpper ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : part.toLowerCase();
      }
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    }
    return '';
  }).join('');
};

const transformKey = (key: string): string => {
  switch (keyCaseType.value) {
    case 'lowerCamelCase':
      return toCamelCase(key, false);
    case 'UpperCamelCase':
      return toCamelCase(key, true);
    default:
      return key;
  }
};


// --- METHODS ---
function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0];
    fileName.value = target.files[0].name;
    translationResult.value = [];
    errorMessage.value = '';
  }
}

async function startTranslation() {
  if (targetLanguages.value.length === 0) {
    alert('请至少选择一个目标语言！');
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';
  translationResult.value = [];

  try {
    let response;
    if (inputType.value === 'file') {
      if (!selectedFile.value) {
        alert('请先选择一个Excel文件！');
        isLoading.value = false;
        return;
      }
      const formData = new FormData();
      formData.append('file', selectedFile.value);
      formData.append('api', selectedApi.value);
      formData.append('languages', JSON.stringify(targetLanguages.value));
      
      response = await axios.post('http://10.1.190.30:3000/api/translate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

    } else {
      if (rawText.value.trim() === '') {
        alert('请在文本框中输入需要翻译的内容！');
        isLoading.value = false;
        return;
      }
      const textLines = rawText.value.trim().split('\n').filter(line => line.trim() !== '');
      const sourceData = textLines.map((line, index) => ({
          key: `text_${index + 1}`,
          en: line
      }));
      
      response = await axios.post('http://10.1.190.30:3000/api/translate-text', {
        sourceData: sourceData,
        api: selectedApi.value,
        languages: JSON.stringify(targetLanguages.value)
      });
    }

    translationResult.value = response.data.data;

  } catch (error: any) {
    console.error('翻译请求失败:', error);
    errorMessage.value = error.response?.data?.error || '发生未知错误，请检查后端服务是否运行。';
  } finally {
    isLoading.value = false;
  }
}

function exportAsJson() {
  if (translationResult.value.length === 0) return;
  
  const allTranslations: { [langCode: string]: { [key: string]: string } } = {};

  allTranslations['en'] = Object.fromEntries(
    translationResult.value.map(item => [transformKey(item.key), item.en])
  );

  targetLanguages.value.forEach(lang => {
    allTranslations[lang.toLowerCase()] = Object.fromEntries(
      translationResult.value.map(item => [transformKey(item.key), item[lang] || ''])
    );
  });
  
  const blob = new Blob([JSON.stringify(allTranslations, null, 2)], { type: 'application/json;charset=utf-8' });
  saveAs(blob, 'translations.json');
}

function exportAsXml() {
  if (translationResult.value.length === 0) return;
  const zip = new JSZip();

  const generateXml = (items: TranslationItem[], lang?: string) => {
    let xml = '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n';
    items.forEach(item => {
      const value = lang ? item[lang] || '' : item.en;
      // Basic XML escaping for apostrophes and quotes
      const escapedValue = value.replace(/'/g, "\\'").replace(/"/g, '\\"');
      xml += `    <string name="${transformKey(item.key)}">${escapedValue}</string>\n`;
    });
    xml += '</resources>';
    return xml;
  };
  
  zip.folder('values')?.file('strings.xml', generateXml(translationResult.value));

  targetLanguages.value.forEach(lang => {
    // Android uses 'b+sr+SP' for Serbian Latin, for example. We'll simplify to just lang code.
    const folderName = `values-${lang.toLowerCase()}`;
    zip.folder(folderName)?.file('strings.xml', generateXml(translationResult.value, lang));
  });

  zip.generateAsync({ type: 'blob' }).then(content => {
    saveAs(content, 'android_locales.zip');
  });
}

function exportAsStrings() {
  if (translationResult.value.length === 0) return;
  const zip = new JSZip();

  // Mapping from our codes to iOS .lproj folder names
  const iOSExtensions: { [key: string]: string } = {
    'EN': 'en', 'FR': 'fr', 'DE': 'de', 'JA': 'ja', 'zh-TW': 'zh-Hant', 'AR': 'ar', 'IT': 'it', 
    'TH': 'th', 'ES': 'es', 'PT': 'pt', 'KO': 'ko', 'NL': 'nl', 'SV': 'sv', 'RU': 'ru', 'ID': 'id', 
    'MS': 'ms', 'PL': 'pl', 'NO': 'no', 'DA': 'da', 'GA': 'ga', 'FI': 'fi', 'CS': 'cs', 'VI': 'vi', 
    'EL': 'el', 'SK': 'sk', 'HE': 'he', 'TR': 'tr', 'RO': 'ro', 'HU': 'hu', 'BG': 'bg', 'KK': 'kk', 
    'SR': 'sr', 'SL': 'sl', 'LT': 'lt', 'AZ': 'az', 'KA': 'ka', 'LV': 'lv', 'ET': 'et', 'IS': 'is', 
    'HR': 'hr'
  };

  const generateStringsFile = (items: TranslationItem[], lang?: string) => {
    return items.map(item => {
      const value = lang ? item[lang] || '' : item.en;
      // Escape double quotes and backslashes for .strings format
      const escapedValue = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      return `"${transformKey(item.key)}" = "${escapedValue}";`;
    }).join('\n');
  };

  // Add English base file
  zip.folder('en.lproj')?.file('Localizable.strings', generateStringsFile(translationResult.value));

  // Add other language files
  targetLanguages.value.forEach(lang => {
    const folderName = `${iOSExtensions[lang] || lang}.lproj`;
    zip.folder(folderName)?.file('Localizable.strings', generateStringsFile(translationResult.value, lang));
  });

  zip.generateAsync({ type: 'blob' }).then(content => {
    saveAs(content, 'ios_locales.zip');
  });
}

</script>

<template>
  <div class="bg-slate-900 min-h-screen text-white font-sans flex flex-col items-center p-4 sm:p-8">
    <div class="w-full max-w-5xl px-4">
      <header class="text-center mb-10">
        <h1 class="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">
          智能多语言翻译工具
        </h1>
        <p class="text-slate-400 mt-2">
          上传Excel或粘贴文本，选择语言，一键完成本地化
        </p>
      </header>

      <section class="bg-slate-800 p-6 rounded-lg shadow-lg mb-10">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="font-bold text-slate-300 block mb-3">1. 提供英文文案</label>
            <div class="flex border border-slate-600 rounded-md p-1 bg-slate-700/50 mb-4">
              <button @click="inputType = 'file'" :class="['w-1/2 rounded-md py-2 text-sm font-medium transition-colors duration-300', inputType === 'file' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-600/50']">
                上传Excel文件
              </button>
              <button @click="inputType = 'text'" :class="['w-1/2 rounded-md py-2 text-sm font-medium transition-colors duration-300', inputType === 'text' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-600/50']">
                粘贴文本
              </button>
            </div>

            <div v-if="inputType === 'file'">
              <div class="flex items-center space-x-2">
                <label class="cursor-pointer bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-md transition-all duration-300">
                  <span>选择文件</span>
                  <input type="file" @change="handleFileChange" accept=".xlsx, .xls" class="hidden" />
                </label>
                <a href="http://localhost:3000/api/template" download="template.xlsx" class="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-md transition-all duration-300">
                  下载模板
                </a>
              </div>
              <span class="text-slate-400 truncate mt-2 block" :title="fileName">{{ fileName }}</span>
            </div>

            <div v-if="inputType === 'text'">
              <textarea v-model="rawText" rows="6" placeholder="在此粘贴您的英文文案，每行一条..." class="w-full bg-slate-700 border border-slate-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-sky-500"></textarea>
            </div>
          </div>

          <div>
            <label for="api-provider" class="font-bold text-slate-300 block mb-2">2. 选择翻译引擎</label>
            <select id="api-provider" v-model="selectedApi" class="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500">
              <option>Zhipu</option>
              <option>DeepSeek</option>
              <option>DeepL</option>
              <option>Google</option>
              <option>Microsoft</option>
            </select>
          </div>
        </div>

        <div class="mt-6">
          <label class="font-bold text-slate-300 block mb-3">3. 选择目标语言</label>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div v-for="lang in commonLanguages" :key="lang.code" class="relative">
              <input type="checkbox" :id="lang.code" :value="lang.code" v-model="targetLanguages" class="peer hidden" />
              <label :for="lang.code" class="block cursor-pointer select-none rounded-md p-3 text-center bg-slate-700 text-slate-300 peer-checked:bg-emerald-600 peer-checked:text-white peer-checked:font-bold transition-all duration-300">
                {{ lang.name }}
              </label>
            </div>
          </div>

          <transition name="fade">
            <div v-if="isLangListExpanded" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-3">
              <div v-for="lang in moreLanguages" :key="lang.code" class="relative">
                <input type="checkbox" :id="lang.code" :value="lang.code" v-model="targetLanguages" class="peer hidden" />
                <label :for="lang.code" class="block cursor-pointer select-none rounded-md p-3 text-center bg-slate-700 text-slate-300 peer-checked:bg-emerald-600 peer-checked:text-white peer-checked:font-bold transition-all duration-300">
                  {{ lang.name }}
                </label>
              </div>
            </div>
          </transition>

          <div class="text-center mt-4">
            <button @click="isLangListExpanded = !isLangListExpanded" class="text-sky-400 hover:text-sky-300 transition-colors duration-300 text-sm font-medium">
              {{ isLangListExpanded ? '收起更少' : '显示更多...' }}
            </button>
          </div>
        </div>
      </section>
      
      <section class="text-center mb-10">
        <button @click="startTranslation" :disabled="isTranslateButtonDisabled" class="bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 text-white font-bold text-xl py-3 px-12 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
          <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isLoading ? '翻译中...' : '🚀 开始翻译' }}
        </button>
      </section>
      
      <div v-if="translationResult.length > 0 || errorMessage || isLoading">
        <h2 class="text-2xl font-bold text-slate-300 mb-4">翻译预览与编辑</h2>
        <div v-if="errorMessage" class="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4">
          <strong class="font-bold">出错啦！</strong>
          <span class="block sm:inline">{{ errorMessage }}</span>
        </div>
        <div v-if="translationResult.length > 0" class="bg-slate-800 rounded-lg shadow-lg overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-sm text-left text-slate-300 table-auto">
                    <thead class="text-xs text-slate-400 uppercase bg-slate-700">
                        <tr>
                            <th scope="col" class="px-6 py-3">Key</th>
                            <th scope="col" class="px-6 py-3">English (Original)</th>
                            <th v-for="lang in targetLanguages" :key="lang" scope="col" class="px-6 py-3">{{ availableLanguages.find(l => l.code === lang)?.name }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, index) in translationResult" :key="index" class="bg-slate-800 border-b border-slate-700 hover:bg-slate-600">
                            <td class="px-6 py-2 font-mono text-slate-400">{{ item.key }}</td>
                            <td class="px-6 py-2 text-slate-400">{{ item.en }}</td>
                            <td v-for="lang in targetLanguages" :key="lang" class="px-6 py-2 min-w-[120px]">
                                <input type="text" v-model="item[lang]" class="w-full bg-transparent focus:bg-slate-600 border-none rounded-md py-1 px-2 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all duration-200" />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div v-if="translationResult.length > 0" class="mt-8 flex flex-wrap justify-center items-center gap-4">
            <div class="flex items-center gap-2">
              <label for="key-case" class="text-sm text-slate-400">键名格式:</label>
              <select id="key-case" v-model="keyCaseType" class="bg-slate-700 border border-slate-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500">
                <option value="original">保持原样</option>
                <option value="lowerCamelCase">小驼峰 (lowerCamelCase)</option>
                <option value="UpperCamelCase">大驼峰 (UpperCamelCase)</option>
              </select>
            </div>
            <div class="flex gap-4">
              <button @click="exportAsJson" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300">
                导出为 JSON
              </button>
              <button @click="exportAsXml" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300">
                导出为 Android (XML)
              </button>
              <button @click="exportAsStrings" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300">
                导出为 iOS (.strings)
              </button>
            </div>
        </div>
      </div>
      <section v-else>
        <h2 class="text-2xl font-bold text-slate-300 mb-4">翻译预览</h2>
        <div class="bg-slate-800 p-6 rounded-lg shadow-lg min-h-[200px] flex items-center justify-center">
            <p class="text-slate-500">翻译结果将在这里显示...</p>
        </div>
      </section>
    </div>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

