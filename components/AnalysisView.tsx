import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const AnalysisView: React.FC = () => {
  const { aiAnalysis, isAnalyzing, runAiAnalysis, setAiAnalysis } = useAppStore();

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="text-yellow-300" />
            <span className="text-indigo-200 font-bold text-sm uppercase tracking-wider">Gemini AI 搭載</span>
          </div>
          <h2 className="text-3xl font-bold">現場生産性レポート</h2>
          <p className="text-indigo-100 mt-2 opacity-80">AIが出面データを分析し、改善提案を行います。</p>
        </div>
        
        <div className="p-8 sm:p-10">
          {!aiAnalysis && !isAnalyzing && (
            <div className="text-center py-12">
              <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="text-indigo-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">分析を開始しますか？</h3>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">過去の出面データを基に、労働時間の傾向や人員配置の最適化案を生成します。</p>
              <button 
                onClick={runAiAnalysis}
                className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl transition-all transform hover:-translate-y-0.5"
              >
                AI分析を実行
              </button>
            </div>
          )}

          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-600 font-medium animate-pulse">Geminiがデータを解析中...</p>
            </div>
          )}

          {aiAnalysis && !isAnalyzing && (
            <div className="prose prose-slate max-w-none prose-headings:font-bold prose-h2:text-indigo-900 prose-p:text-slate-600 prose-li:text-slate-600">
              <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
              <div className="mt-12 pt-6 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setAiAnalysis('')}
                  className="text-sm text-slate-400 hover:text-indigo-600 transition"
                >
                  レポートを破棄して再生成
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;