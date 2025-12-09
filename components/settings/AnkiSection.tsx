
import React, { useState, useMemo } from 'react';
import { AnkiConfig, WordEntry, WordCategory } from '../../types';
import { RefreshCw, Wifi, Info, PlusCircle, ChevronDown, Layers, Calendar, Code, Eye, HelpCircle, X, Copy } from 'lucide-react';
import { pingAnki, addNotesToAnki, getCardsInfo } from '../../utils/anki-client';
import { entriesStorage } from '../../utils/storage';
import { Toast, ToastMessage } from '../ui/Toast';

const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  return (
    <div className="group relative inline-flex items-center ml-1 align-middle">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-slate-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] shadow-xl w-max max-w-[240px] leading-relaxed whitespace-normal text-center">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  );
};

interface AnkiSectionProps {
  config: AnkiConfig;
  setConfig: React.Dispatch<React.SetStateAction<AnkiConfig>>;
}

export const AnkiSection: React.FC<AnkiSectionProps> = ({ config, setConfig }) => {
  const [activeTemplate, setActiveTemplate] = useState<'front' | 'back'>('front');
  const [showVarHelp, setShowVarHelp] = useState(false);
  
  // Status States
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'fail'>('idle');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'processing' | 'success' | 'fail'>('idle');
  const [progressStatus, setProgressStatus] = useState<'idle' | 'processing' | 'success' | 'fail'>('idle');
  
  // Local UI State for Sync Scope Dropdown
  const [targetScope, setTargetScope] = useState<WordCategory>(WordCategory.WantToLearnWord);

  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Mock Data for Preview
  const previewEntry = useMemo<WordEntry>(() => ({
      id: 'preview-mock',
      text: 'serendipity',
      phoneticUs: '/ˌsɛrənˈdɪpɪti/',
      phoneticUk: '/ˌsɛrənˈdɪpɪti/',
      translation: '意外发现珍奇事物的本领；机缘凑巧',
      partOfSpeech: 'n.',
      contextSentence: 'The discovery of penicillin was a happy serendipity.',
      contextSentenceTranslation: '青霉素的发现是一个令人高兴的意外机缘。',
      mixedSentence: 'The discovery of penicillin was a happy serendipity (意外机缘).',
      contextParagraph: 'Many scientific discoveries are a result of serendipity. The discovery of penicillin was a happy serendipity that changed the course of medicine.',
      contextParagraphTranslation: '许多科学发现都是机缘巧合的结果。青霉素的发现是一个改变医学进程的令人高兴的意外机缘。',
      sourceUrl: 'https://en.wikipedia.org/wiki/Serendipity',
      category: WordCategory.WantToLearnWord,
      addedAt: Date.now(),
      tags: ['Science', 'Vocab']
  }), []);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
      setToast({ id: Date.now(), message, type });
  };

  // Helper to generate dynamic button classes based on status
  const getButtonClass = (status: string, extraClasses: string = '') => {
      const base = "rounded-lg text-sm font-bold flex items-center justify-center transition border shadow-sm h-[38px] px-4 whitespace-nowrap";
      
      switch (status) {
          case 'success':
              return `${base} bg-emerald-600 text-white hover:bg-emerald-700 border-transparent shadow-emerald-200 ${extraClasses}`;
          case 'fail':
              return `${base} bg-red-600 text-white hover:bg-red-700 border-transparent shadow-red-200 ${extraClasses}`;
          case 'processing':
          case 'testing':
              return `${base} bg-blue-600 text-white opacity-80 cursor-wait border-transparent ${extraClasses}`;
          default: // idle
              return `${base} bg-blue-600 text-white hover:bg-blue-700 border-transparent shadow-blue-200 ${extraClasses}`;
      }
  };

  // --- Logic Implementations ---

  const handleTestConnection = async () => {
      setConnectionStatus('testing');
      try {
          const ver = await pingAnki(config.url);
          setConnectionStatus('success');
          showToast(`连接成功 (AnkiConnect v${ver})`, 'success');
      } catch (e: any) {
          console.error(e);
          setConnectionStatus('fail');
          showToast(`连接失败: ${e.message}`, 'error');
      }
  };

  const generateCardContent = (entry: WordEntry, template: string) => {
      let content = template;
      // Simple Split Helper
      const splitStr = (str: string, key: string) => {
        const idx = str.indexOf(key);
        if (idx === -1) return { a: '', e: '' };
        return { a: str.substring(0, idx), e: str.substring(idx + key.length) };
      };

      const sSplit = splitStr(entry.contextSentence || '', entry.text);
      const pSplit = splitStr(entry.contextParagraph || '', entry.text);
      const mSplit = splitStr(entry.mixedSentence || '', entry.text);

      const map: Record<string, string> = {
          '{{word}}': entry.text,
          '{{phonetic}}': entry.phoneticUs || entry.phoneticUk || '',
          '{{translation}}': entry.translation || '',
          '{{def_cn}}': entry.translation || '',
          '{{def_context}}': entry.translation || '',
          '{{sentence}}': entry.contextSentence || '',
          '{{sentence-a}}': sSplit.a,
          '{{sentence-e}}': sSplit.e,
          '{{paragraph}}': entry.contextParagraph || '',
          '{{paragraph-a}}': pSplit.a,
          '{{paragraph-e}}': pSplit.e,
          '{{mixed_sentence}}': entry.mixedSentence || '',
          '{{mixed_sentence-a}}': mSplit.a,
          '{{mixed_sentence-e}}': mSplit.e,
          '{{source_url}}': entry.sourceUrl || ''
      };

      Object.keys(map).sort((a,b) => b.length - a.length).forEach(key => {
          content = content.replace(new RegExp(key, 'g'), map[key]);
      });
      return content;
  };

  const handleAddCards = async () => {
      if (!config.deckName) {
          showToast("请先配置目标牌组名称 (Deck)", "error");
          return;
      }
      
      // modelName fallback
      const modelName = config.modelName || 'Basic';

      setSyncStatus('processing');
      try {
          // 1. Get words based on dropdown selection
          const allEntries = await entriesStorage.getValue();
          const wordsToAdd = allEntries.filter(e => e.category === targetScope);

          if (wordsToAdd.length === 0) {
              setSyncStatus('idle'); 
              showToast(`当前“${targetScope}”列表内没有单词`, "info");
              return;
          }

          // 2. Prepare Notes
          const notes = wordsToAdd.map(entry => ({
              deckName: config.deckName,
              modelName: modelName,
              fields: {
                  Front: generateCardContent(entry, config.templates.frontTemplate),
                  Back: generateCardContent(entry, config.templates.backTemplate)
              },
              tags: ['ContextLingo', ...(entry.tags || [])],
              options: {
                  allowDuplicate: false, // Core deduplication logic
                  duplicateScope: "deck"
              }
          }));

          // 3. Batch Add
          const results = await addNotesToAnki(notes, config.url);
          
          const successCount = results.filter(r => r !== null).length;
          const duplicateCount = results.length - successCount;

          setSyncStatus('success');
          showToast(`同步完成: 新增 ${successCount}, 重复/忽略 ${duplicateCount}`, 'success');

      } catch (e: any) {
          console.error(e);
          setSyncStatus('fail');
          showToast(`同步失败: ${e.message}`, 'error');
      }
  };

  const handleSyncProgress = async () => {
      setProgressStatus('processing');
      try {
          // 1. Find cards in deck that are in review
          const query = `deck:"${config.deckName}" is:review prop:ivl>=${config.syncInterval}`;
          const cards = await getCardsInfo(query, config.url);

          if (cards.length === 0) {
              setProgressStatus('success'); 
              showToast("未发现满足自动掌握条件的单词", "info");
              return;
          }

          // 2. Match back to local entries
          const allEntries = await entriesStorage.getValue();
          let updatedCount = 0;

          // Helper to strip HTML tags from Anki fields to find the word
          const stripHtml = (html: string) => {
             const div = document.createElement("div");
             div.innerHTML = html;
             return div.textContent || div.innerText || "";
          };

          const newEntries = allEntries.map(entry => {
              if (entry.category === WordCategory.KnownWord) return entry;

              const isMastered = cards.some(card => {
                  const frontRaw = card.fields?.Front?.value || "";
                  const frontText = stripHtml(frontRaw);
                  return frontText.includes(entry.text); 
              });

              if (isMastered) {
                  updatedCount++;
                  return { ...entry, category: WordCategory.KnownWord };
              }
              return entry;
          });

          if (updatedCount > 0) {
              await entriesStorage.setValue(newEntries);
              setProgressStatus('success');
              showToast(`同步完成: ${updatedCount} 个单词已自动移入“已掌握”`, 'success');
          } else {
              setProgressStatus('success');
              showToast("没有单词需要更新状态", "info");
          }

      } catch (e: any) {
          console.error(e);
          setProgressStatus('fail');
          showToast(`获取进度失败: ${e.message}`, 'error');
      }
  };

  const variables = [
     { code: '{{word}}', desc: '当前单词拼写' },
     { code: '{{phonetic}}', desc: '音标' },
     { code: '{{translation}}', desc: '中文释义' },
     { code: '{{sentence}}', desc: '完整原句 (Context)' },
     { code: '{{sentence-a}}', desc: '原句 - 前半部分 (用于挖空)' },
     { code: '{{sentence-e}}', desc: '原句 - 后半部分 (用于挖空)' },
     { code: '{{paragraph}}', desc: '完整段落' },
     { code: '{{paragraph-a}}', desc: '段落 - 前半部分' },
     { code: '{{paragraph-e}}', desc: '段落 - 后半部分' },
     { code: '{{mixed_sentence}}', desc: '中英混合例句' },
     { code: '{{mixed_sentence-a}}', desc: '混合例句 - 前半部分' },
     { code: '{{mixed_sentence-e}}', desc: '混合例句 - 后半部分' },
     { code: '{{source_url}}', desc: '来源网址' }
  ];

  const handleCopyVar = (text: string) => {
      navigator.clipboard.writeText(text);
      showToast(`已复制: ${text}`, 'success');
  };

  return (
    // Removed overflow-hidden to allow tooltips to show
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 relative">
        <Toast toast={toast} onClose={() => setToast(null)} />
        
        <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-800">Anki 集成</h2>
            <p className="text-sm text-slate-500">连接 AnkiConnect 以实现增量导入与复习进度同步。</p>
        </div>
        <div className="p-6 space-y-8">
           
           {/* Section 1: Connection */}
           <div>
              <div className="flex gap-3 items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex-1">
                      <label className="block text-xs text-slate-500 mb-1">AnkiConnect 地址</label>
                      <input 
                        type="text" 
                        value={config.url}
                        onChange={e => setConfig({...config, url: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="http://127.0.0.1:8765"
                      />
                  </div>
                  <div className="self-end">
                      <button 
                        onClick={handleTestConnection}
                        disabled={connectionStatus === 'testing'}
                        className={getButtonClass(connectionStatus)}
                      >
                          {connectionStatus === 'testing' ? <RefreshCw className="w-4 h-4 animate-spin mr-2"/> : <Wifi className="w-4 h-4 mr-2"/>}
                          {connectionStatus === 'testing' ? '连接中...' : '测试连接'}
                      </button>
                  </div>
              </div>
           </div>

           {/* Section 2: Cards & Progress Grid - Ratio 7:5 */}
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
               
               {/* Left: Export (7/12) */}
               <div className="lg:col-span-7 bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col gap-4">
                   <div className="flex items-center gap-2 mb-1">
                       <Layers className="w-4 h-4 text-blue-600" />
                       <h3 className="font-bold text-slate-800 text-sm">新增牌组 (Export)</h3>
                   </div>
                   
                   <div className="flex flex-col gap-4 h-full justify-center">
                        <div className="flex flex-col md:flex-row gap-3 items-end">
                            {/* Deck Name - Expands to fill available space */}
                            <div className="flex-[3] w-full">
                                <label className="block text-xs text-slate-500 mb-1">目标牌组</label>
                                <input 
                                    type="text" 
                                    value={config.deckName}
                                    onChange={e => setConfig({...config, deckName: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 h-[38px]"
                                    placeholder="ContextLingo"
                                />
                            </div>
                            
                            {/* Sync Scope */}
                            <div className="w-32 shrink-0">
                                <label className="block text-xs text-slate-500 mb-1">同步内容范围</label>
                                <div className="relative">
                                    <select 
                                        value={targetScope}
                                        onChange={e => setTargetScope(e.target.value as WordCategory)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm appearance-none focus:ring-blue-500 cursor-pointer bg-white h-[38px] pr-8"
                                    >
                                        <option value={WordCategory.WantToLearnWord}>想学习单词</option>
                                        <option value={WordCategory.LearningWord}>正在学单词</option>
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>

                            <button 
                                onClick={handleAddCards}
                                disabled={syncStatus === 'processing'}
                                className={getButtonClass(syncStatus, "w-auto")}
                            >
                                {syncStatus === 'processing' ? <RefreshCw className="w-4 h-4 animate-spin mr-2"/> : <PlusCircle className="w-4 h-4 mr-2"/>}
                                新增卡片
                            </button>
                        </div>
                   </div>
               </div>

               {/* Right: Progress (5/12) */}
               <div className="lg:col-span-5 bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col gap-4">
                   <div className="flex items-center gap-2 mb-1 justify-between">
                       <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-green-600" />
                            <h3 className="font-bold text-slate-800 text-sm">进度同步</h3>
                       </div>
                   </div>
                   
                   <div className="flex flex-col gap-4 h-full justify-center">
                       {/* Single Row Layout */}
                       <div className="flex items-end gap-2.5">
                            {/* Threshold Input - Narrower to fit */}
                            <div>
                                <label className="block text-xs text-slate-500 mb-1 whitespace-nowrap">
                                    自动掌握 (天)
                                    <Tooltip text="同步将更新插件内的单词状态。如果 Anki 中的复习间隔超过设定天数，插件会自动将该单词标记为“已掌握”，不再进行替换翻译。">
                                        <Info className="w-3.5 h-3.5 text-slate-400 cursor-help hover:text-slate-600" />
                                    </Tooltip>
                                </label>
                                <input 
                                    type="number" 
                                    value={config.syncInterval}
                                    onChange={e => setConfig({...config, syncInterval: parseInt(e.target.value)})}
                                    className="w-20 px-2 py-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 h-[38px] text-center"
                                />
                            </div>

                            {/* Auto Sync Toggle */}
                            <div className="flex items-center gap-2 bg-white px-2.5 rounded-lg border border-slate-300 h-[38px] shrink-0">
                                <label className="text-xs text-slate-500 font-medium whitespace-nowrap">自动同步</label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={config.enabled} 
                                        onChange={e => setConfig({...config, enabled: e.target.checked})} 
                                        className="sr-only peer" 
                                    />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            {/* Sync Button - Flex to fill remainder */}
                            <button 
                                onClick={handleSyncProgress}
                                disabled={progressStatus === 'processing'}
                                className={getButtonClass(progressStatus, "flex-1 min-w-[100px]")}
                            >
                                {progressStatus === 'processing' ? <RefreshCw className="w-4 h-4 animate-spin mr-2"/> : <RefreshCw className="w-4 h-4 mr-2"/>}
                                获取状态
                            </button>
                       </div>
                   </div>
               </div>
           </div>
           
           {/* Section 3: Templates Editor */}
           <div className="border-t border-slate-100 pt-6">
              <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center">
                     <Code className="w-4 h-4 mr-2 text-slate-500"/> 
                     卡片模板配置
                     <span className="ml-2 text-xs font-normal text-slate-400">(自定义发送给 Anki 的 HTML 内容)</span>
                  </h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">
                  {/* Editor Block */}
                  <div className="flex flex-col bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
                      {/* Toolbar */}
                      <div className="bg-slate-50 border-b border-slate-200 p-3 flex items-center justify-between shrink-0">
                          <div className="flex space-x-1">
                            <button 
                                onClick={() => setActiveTemplate('front')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${activeTemplate === 'front' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
                            >
                                正面 (Front)
                            </button>
                            <button 
                                onClick={() => setActiveTemplate('back')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${activeTemplate === 'back' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
                            >
                                背面 (Back)
                            </button>
                          </div>
                          
                          <button 
                             onClick={() => setShowVarHelp(true)}
                             className="flex items-center text-xs font-medium text-blue-600 hover:bg-blue-100/50 px-3 py-1.5 rounded-lg border border-blue-100 transition"
                          >
                               <HelpCircle className="w-4 h-4 mr-1.5"/> 变量参考
                          </button>
                      </div>

                      <div className="flex-1 relative group">
                          <textarea 
                               className="w-full h-full p-4 font-mono text-sm text-slate-800 bg-white resize-none focus:outline-none focus:bg-slate-50/30 transition-colors leading-relaxed"
                               value={activeTemplate === 'front' ? config.templates.frontTemplate : config.templates.backTemplate}
                               onChange={(e) => {
                                  const key = activeTemplate === 'front' ? 'frontTemplate' : 'backTemplate';
                                  setConfig({...config, templates: {...config.templates, [key]: e.target.value}});
                               }}
                               spellCheck={false}
                               placeholder="在此输入 HTML 模板..."
                          />
                          <div className="absolute bottom-2 right-2 text-[10px] text-slate-300 font-mono pointer-events-none select-none bg-white/80 px-2 rounded backdrop-blur-sm">HTML Editor</div>
                      </div>
                  </div>

                  {/* Preview Block */}
                  <div className="flex flex-col bg-slate-50 rounded-xl border border-slate-200 shadow-inner overflow-hidden">
                      <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center shrink-0">
                          <span className="flex items-center"><Eye className="w-3 h-3 mr-1.5"/> 预览效果 ({activeTemplate === 'front' ? 'Front' : 'Back'})</span>
                          <span className="text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">Mock Data</span>
                      </div>
                      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 min-h-full prose prose-sm max-w-none">
                              <div dangerouslySetInnerHTML={{ 
                                  __html: generateCardContent(previewEntry, activeTemplate === 'front' ? config.templates.frontTemplate : config.templates.backTemplate) 
                              }} />
                          </div>
                      </div>
                  </div>
              </div>
           </div>
        </div>

        {/* Variable Help Modal */}
        {showVarHelp && (
            <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <div className="flex items-center gap-2">
                             <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600"><Code className="w-5 h-5"/></div>
                             <h3 className="font-bold text-slate-800">模板变量参考</h3>
                        </div>
                        <button onClick={() => setShowVarHelp(false)} className="p-1 hover:bg-slate-200 rounded-lg transition"><X className="w-5 h-5 text-slate-400 hover:text-slate-600"/></button>
                    </div>
                    <div className="p-0 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-6 py-3 border-b border-slate-200 w-1/3">变量代码</th>
                                    <th className="px-6 py-3 border-b border-slate-200">描述</th>
                                    <th className="px-6 py-3 border-b border-slate-200 text-right w-16">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {variables.map(v => (
                                    <tr key={v.code} className="hover:bg-slate-50 group transition-colors">
                                        <td className="px-6 py-3 font-mono text-blue-600 font-medium">{v.code}</td>
                                        <td className="px-6 py-3 text-slate-600">{v.desc}</td>
                                        <td className="px-6 py-3 text-right">
                                            <button 
                                                onClick={() => handleCopyVar(v.code)}
                                                className="text-slate-300 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition"
                                                title="复制变量"
                                            >
                                                <Copy className="w-4 h-4"/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center">
                        <Info className="w-4 h-4 mr-2 text-slate-400"/>
                        提示: 点击右侧复制按钮，然后粘贴到模板编辑器中。
                    </div>
                </div>
            </div>
        )}
    </section>
  );
};
