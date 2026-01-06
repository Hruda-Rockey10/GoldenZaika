"use client";

import { useState } from "react";
import { Sparkles, Loader2, Info } from "lucide-react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { aiService } from "@/services/ai.service";

export default function NutritionCard({ items }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleAnalyze = async () => {
    if (!items || items.length === 0) return;
    setLoading(true);
    setExpanded(true);

    try {
      const data = await aiService.getNutritionAnalysis(items);

      if (data.success) {
        setAnalysis(data);
      }
    } catch (error) {
      toast.error("Failed to analyze nutrition");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl overflow-hidden shadow-xl mt-6">
      <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
        <div className="flex items-center gap-2 text-primary-gold">
          <Sparkles size={20} className={loading ? "animate-pulse" : ""} />
          <h3 className="font-bold text-lg">Smart Nutrition Advisor</h3>
        </div>
        {!analysis && !loading && (
            <button 
                onClick={handleAnalyze}
                className="text-xs px-3 py-1.5 bg-primary-gold text-black font-bold rounded-full hover:bg-yellow-500 transition-colors"
            >
                Analyze Meal
            </button>
        )}
      </div>

      <AnimatePresence>
        {(loading || analysis) && (
            <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="p-4"
            >
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-6 text-gray-400 gap-3">
                        <Loader2 className="animate-spin text-primary-gold" size={24} />
                        <span className="text-sm">Analyzing calories & macros...</span>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Totals */}
                        <div className="grid grid-cols-4 gap-2 text-center bg-white/5 p-3 rounded-xl border border-white/5">
                            <div>
                                <div className="text-xs text-gray-400">Calories</div>
                                <div className="font-bold text-white">{analysis.totals.calories}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400">Protein</div>
                                <div className="font-bold text-white">{analysis.totals.protein}g</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400">Carbs</div>
                                <div className="font-bold text-white">{analysis.totals.carbs}g</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400">Fat</div>
                                <div className="font-bold text-white">{analysis.totals.fat}g</div>
                            </div>
                        </div>

                        {/* Analysis */}
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                             <div className="flex items-center gap-2 mb-2">
                                 <span className="text-2xl font-bold text-primary-gold">{analysis.ai.score}/10</span>
                                 <span className="text-sm text-gray-400 uppercase tracking-wide">Meal Balance Score</span>
                             </div>
                             <p className="text-gray-300 text-sm italic border-l-2 border-primary-gold pl-3 py-1">
                                "{analysis.ai.analysis}"
                             </p>
                        </div>

                        {/* Macros Assessment */}
                        <div className="grid grid-cols-3 gap-2">
                            {Object.entries(analysis.ai.macros).map(([key, val]) => (
                                <div key={key} className={`text-center p-2 rounded-lg border ${
                                    val.toLowerCase() === 'good' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                                    val.toLowerCase() === 'high' || val.toLowerCase() === 'low' ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' :
                                    'bg-white/5 border-white/10 text-gray-400'
                                }`}>
                                    <div className="text-[10px] uppercase opacity-70 mb-0.5">{key}</div>
                                    <div className="text-xs font-bold">{val}</div>
                                </div>
                            ))}
                        </div>

                        {/* Suggestions */}
                        {analysis.ai.suggestions && analysis.ai.suggestions.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                                    <Info size={14} className="text-blue-400" /> Suggestions
                                </h4>
                                <ul className="list-disc list-inside text-sm text-gray-400 space-y-1 pl-1">
                                    {analysis.ai.suggestions.map((s, i) => (
                                        <li key={i}>{s}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        
                        <div className="text-[10px] text-gray-600 text-center pt-2">
                            AI-generated estimate. Not medical advice.
                        </div>
                    </div>
                )}
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
