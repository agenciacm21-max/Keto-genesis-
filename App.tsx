
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";

// --- Types ---
interface SwapItem {
  item: string;
  reason: string;
}

interface Meal {
  name: string;
  description: string;
  recipe: string;
}

interface DayPlan {
  day: number;
  macros: {
    calories: number;
    protein: number;
    fats: number;
    carbs: number;
  };
  meals: Meal[];
}

interface KetoPlan {
  dailyMacrosAverage: {
    calories: number;
    protein: number;
    fats: number;
    carbs: number;
  };
  weeklyMenu: DayPlan[];
  swaps: SwapItem[];
  tips: string[];
  estimative: string;
}

export default function App() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<KetoPlan | null>(null);
  const [activeDay, setActiveDay] = useState(1);
  const [expandedMealIndex, setExpandedMealIndex] = useState<number | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    weight: '',
    height: '',
    gender: 'Masculino',
    medicalConditions: [] as string[],
    hasMedicalAuth: false,
    noMedicalConditions: false,
    cholesterolLevel: 'Normal',
    familyHeartHistory: 'Não',
    activityLevel: 'Moderado',
    dailyRoutine: 'Escritório',
    goal: 'Perda de Peso',
    dietType: 'Omnívoro',
    lactoseIntolerant: false,
    mealsPerDay: 4
  });

  const medicalConditionsList = [
    "Diabetes Tipo 1",
    "Doença Renal",
    "Insuficiência Hepática",
    "Pancreatite",
    "Problemas na Vesícula Biliar",
    "Gestante ou Amamentando",
    "Transtorno Alimentar Histórico"
  ];

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const toggleMedical = (condition: string) => {
    setFormData(prev => ({
      ...prev,
      noMedicalConditions: false,
      medicalConditions: prev.medicalConditions.includes(condition)
        ? prev.medicalConditions.filter(c => c !== condition)
        : [...prev.medicalConditions, condition]
    }));
  };

  const toggleNoConditions = () => {
    setFormData(prev => ({
      ...prev,
      noMedicalConditions: !prev.noMedicalConditions,
      medicalConditions: [],
      hasMedicalAuth: false
    }));
  };

  const generateKetoPlan = async () => {
    setLoading(true);
    setStep(5);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const prompt = `Gere um PLANO CETOGÊNICO PROFISSIONAL DE 7 DIAS (D1 a D7) em Português para o usuário:
      Nome: ${formData.name}, Gênero: ${formData.gender}, Idade: ${formData.age}, Peso: ${formData.weight}kg, Altura: ${formData.height}cm.
      Dieta: ${formData.dietType}, Lactose: ${formData.lactoseIntolerant ? 'Não consome laticínios' : 'Consome laticínios'}, Refeições: ${formData.mealsPerDay}.
      Atividade: ${formData.activityLevel}, Rotina: ${formData.dailyRoutine}, Objetivo: ${formData.goal}.
      
      INSTRUÇÕES CRÍTICAS PARA DICAS PERSONALIZADAS (campo "tips"):
      - Se Atividade for "Sedentário": Foque em hidratação, controle de eletrólitos e incentivo a pequenas movimentações diárias.
      - Se Atividade for "Intenso" ou "Moderado": Foque em recuperação muscular, timing de gorduras e reposição de sódio/potássio.
      - Se Dieta for "Vegano" ou "Vegetariano": Foque em fontes de proteína vegetal compatíveis com keto (tofu, tempeh, sementes) e suplementação necessária (B12).
      - Se Lactose for restrita: Sugira substitutos como leite de coco, amêndoas e queijos veganos gordurosos.
      - Se Objetivo for "Perda de Peso": Foque em saciedade, controle de lanches e manejo da "gripe cetogênica".
      - Se Objetivo for "Ganho de Massa": Foque em excedente calórico através de gorduras boas e treinos de força.

      Retorne APENAS JSON no formato exato com macros diários, 7 dias de cardápio e o array "tips" com no mínimo 5 dicas altamente personalizadas para o perfil acima.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              dailyMacrosAverage: {
                type: Type.OBJECT,
                properties: {
                  calories: { type: Type.NUMBER },
                  protein: { type: Type.NUMBER },
                  fats: { type: Type.NUMBER },
                  carbs: { type: Type.NUMBER }
                }
              },
              weeklyMenu: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    day: { type: Type.NUMBER },
                    macros: {
                      type: Type.OBJECT,
                      properties: {
                        calories: { type: Type.NUMBER },
                        protein: { type: Type.NUMBER },
                        fats: { type: Type.NUMBER },
                        carbs: { type: Type.NUMBER }
                      }
                    },
                    meals: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          description: { type: Type.STRING },
                          recipe: { type: Type.STRING }
                        }
                      }
                    }
                  }
                }
              },
              swaps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    item: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  }
                }
              },
              tips: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              estimative: { type: Type.STRING }
            }
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      setPlan(result);
      setStep(6);
    } catch (error) {
      console.error("Error:", error);
      alert("Erro ao gerar o plano. Tente novamente.");
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  const isStep1Valid = formData.name && formData.age && formData.weight && formData.height;
  const isMedicalScreeningValid = formData.noMedicalConditions || (formData.medicalConditions.length > 0 && formData.hasMedicalAuth);

  const currentDayData = plan?.weeklyMenu.find(d => d.day === activeDay);

  const toggleMealExpansion = (index: number) => {
    setExpandedMealIndex(expandedMealIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-[2rem] shadow-2xl overflow-hidden print:shadow-none print:rounded-none">
        
        {/* Header */}
        <header className="bg-emerald-600 p-8 text-white flex justify-between items-center print:bg-white print:text-slate-900 print:border-b-4 print:border-emerald-600">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
              <i className="fas fa-leaf text-emerald-200 print:text-emerald-600"></i> KetoGenius
            </h1>
            <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest print:text-slate-500">Nutrição de Alta Performance</p>
          </div>
          {step > 0 && step < 5 && (
            <div className="bg-white/20 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/30 print:hidden">Etapa {step}/4</div>
          )}
          {step === 6 && (
            <div className="text-right print:block hidden">
              <p className="font-black text-lg">{formData.name}</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold">{formData.goal}</p>
            </div>
          )}
        </header>

        <main className="p-6 md:p-12">
          
          {/* Step 0: Triagem Médica */}
          {step === 0 && (
            <div className="space-y-8 animate-fadeIn">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-slate-800">Sua segurança vem primeiro</h2>
                <p className="text-slate-500">A dieta cetogênica é potente. Precisamos confirmar se ela é segura para você agora.</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {medicalConditionsList.map(c => (
                    <label key={c} className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${formData.medicalConditions.includes(c) ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-md' : 'bg-white border-slate-100'}`}>
                      <input type="checkbox" checked={formData.medicalConditions.includes(c)} onChange={() => toggleMedical(c)} className="w-5 h-5 accent-emerald-600" />
                      <span className="text-sm font-bold">{c}</span>
                    </label>
                  ))}
                  <label className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer md:col-span-2 ${formData.noMedicalConditions ? 'bg-emerald-600 border-emerald-700 text-white shadow-lg' : 'bg-slate-100'}`}>
                    <input type="checkbox" checked={formData.noMedicalConditions} onChange={toggleNoConditions} className="w-5 h-5 accent-white" />
                    <span className="font-bold">Não possuo nenhuma das condições acima</span>
                  </label>
                </div>
              </div>
              {formData.medicalConditions.length > 0 && (
                <div className="p-5 bg-red-50 border-l-4 border-red-500 rounded-xl space-y-3">
                  <p className="text-xs text-red-800 font-bold uppercase tracking-widest flex items-center gap-2">
                    <i className="fas fa-exclamation-triangle"></i> Atenção Requerida
                  </p>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" className="mt-1 w-5 h-5 accent-red-600" checked={formData.hasMedicalAuth} onChange={e => setFormData({...formData, hasMedicalAuth: e.target.checked})} />
                    <span className="text-[11px] text-red-900 font-medium">Possuo autorização de um médico ou nutricionista para realizar este protocolo mesmo com estas condições.</span>
                  </label>
                </div>
              )}
              <button disabled={!isMedicalScreeningValid} onClick={handleNext} className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-200 text-white font-black py-5 rounded-2xl transition-all shadow-xl uppercase tracking-widest text-sm">Próxima Etapa</button>
            </div>
          )}

          {/* Step 1: Biometria */}
          {step === 1 && (
            <div className="space-y-8 animate-fadeIn">
              <h2 className="text-2xl font-black text-slate-800">Perfil Biométrico</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seu Nome</label>
                  <input type="text" placeholder="João Silva" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-slate-50 border-2 rounded-2xl focus:border-emerald-500 outline-none font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gênero</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Masculino', 'Feminino', 'Outro'].map(g => (
                      <button key={g} onClick={() => setFormData({...formData, gender: g})} className={`p-4 rounded-2xl border-2 font-bold text-xs transition-all ${formData.gender === g ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-white text-slate-400 hover:border-emerald-200'}`}>{g}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 md:col-span-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Idade</label>
                    <input type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full p-4 bg-slate-50 border-2 rounded-2xl font-bold text-center" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Peso (kg)</label>
                    <input type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full p-4 bg-slate-50 border-2 rounded-2xl font-bold text-center" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Altura (cm)</label>
                    <input type="number" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="w-full p-4 bg-slate-50 border-2 rounded-2xl font-bold text-center" />
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button onClick={handleBack} className="flex-1 py-4 text-slate-400 font-bold uppercase tracking-widest text-xs">Voltar</button>
                <button onClick={handleNext} disabled={!isStep1Valid} className="flex-[2] bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-lg uppercase tracking-widest text-sm">Avançar</button>
              </div>
            </div>
          )}

          {/* Step 2: Saúde Complementar */}
          {step === 2 && (
            <div className="space-y-8 animate-fadeIn">
              <h2 className="text-2xl font-black text-slate-800">Mais sobre sua Saúde</h2>
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nível de Colesterol</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Normal', 'Moderado', 'Elevado'].map(val => (
                      <button key={val} onClick={() => setFormData({...formData, cholesterolLevel: val})} className={`p-4 rounded-xl border-2 font-bold transition-all ${formData.cholesterolLevel === val ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md' : 'bg-white text-slate-400'}`}>{val}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Histórico Cardíaco na Família?</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Não', 'Sim', 'Não sei'].map(val => (
                      <button key={val} onClick={() => setFormData({...formData, familyHeartHistory: val})} className={`p-4 rounded-xl border-2 font-bold transition-all ${formData.familyHeartHistory === val ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md' : 'bg-white text-slate-400'}`}>{val}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-8">
                <button onClick={handleBack} className="flex-1 py-4 text-slate-400 font-bold uppercase tracking-widest text-xs">Voltar</button>
                <button onClick={handleNext} className="flex-[2] bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-lg uppercase tracking-widest text-sm">Continuar</button>
              </div>
            </div>
          )}

          {/* Step 3: Atividade Física */}
          {step === 3 && (
            <div className="space-y-8 animate-fadeIn">
              <h2 className="text-2xl font-black text-slate-800">Nível de Atividade & Rotina</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {id: 'Sedentário', icon: 'fa-couch', desc: 'Fico sentado o dia todo'},
                    {id: 'Leve', icon: 'fa-walking', desc: 'Caminho um pouco'},
                    {id: 'Moderado', icon: 'fa-running', desc: 'Treinos 3-4x por semana'},
                    {id: 'Intenso', icon: 'fa-dumbbell', desc: 'Treinos pesados diários'}
                  ].map(act => (
                    <button key={act.id} onClick={() => setFormData({...formData, activityLevel: act.id})} className={`p-6 rounded-2xl border-2 flex items-center gap-4 transition-all text-left ${formData.activityLevel === act.id ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl scale-[1.02]' : 'bg-white border-slate-100 hover:border-emerald-200'}`}>
                      <i className={`fas ${act.icon} text-2xl opacity-80`}></i>
                      <div>
                        <p className="font-black text-lg">{act.id}</p>
                        <p className={`text-[10px] font-bold uppercase opacity-70 ${formData.activityLevel === act.id ? 'text-white' : 'text-slate-400'}`}>{act.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sua rotina de trabalho</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Escritório', 'Fico em pé', 'Trabalho Ativo', 'Turnos'].map(r => (
                      <button key={r} onClick={() => setFormData({...formData, dailyRoutine: r})} className={`p-4 rounded-xl border-2 font-bold transition-all ${formData.dailyRoutine === r ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-100'}`}>{r}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button onClick={handleBack} className="flex-1 py-4 text-slate-400 font-bold uppercase tracking-widest text-xs">Voltar</button>
                <button onClick={handleNext} className="flex-[2] bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-lg uppercase tracking-widest text-sm">Próximo</button>
              </div>
            </div>
          )}

          {/* Step 4: Preferências Dietéticas */}
          {step === 4 && (
            <div className="space-y-8 animate-fadeIn">
              <h2 className="text-2xl font-black text-slate-800">Preferências & Objetivo</h2>
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Dieta</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Omnívoro', 'Vegetariano', 'Vegano'].map(t => (
                        <button key={t} onClick={() => setFormData({...formData, dietType: t})} className={`p-4 rounded-xl border-2 font-bold text-[10px] transition-all ${formData.dietType === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white'}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Refeições p/ Dia</label>
                    <div className="flex gap-2">
                      {[3, 4, 5].map(n => (
                        <button key={n} onClick={() => setFormData({...formData, mealsPerDay: n})} className={`flex-1 p-4 rounded-xl border-2 font-bold transition-all ${formData.mealsPerDay === n ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white'}`}>{n}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <label className="flex items-center gap-4 p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl cursor-pointer hover:bg-white transition-all">
                    <input type="checkbox" checked={formData.lactoseIntolerant} onChange={e => setFormData({...formData, lactoseIntolerant: e.target.checked})} className="w-6 h-6 accent-emerald-600" />
                    <div>
                      <p className="font-bold text-slate-800">Restrição de Lactose</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Substituir laticínios por opções vegetais</p>
                    </div>
                  </label>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seu Objetivo Principal</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Perda de Peso', 'Ganho de Massa', 'Manutenção', 'Foco Mental'].map(g => (
                        <button key={g} onClick={() => setFormData({...formData, goal: g})} className={`p-4 rounded-xl border-2 font-bold transition-all ${formData.goal === g ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white'}`}>{g}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-10">
                <button onClick={handleBack} className="flex-1 py-4 text-slate-400 font-bold uppercase tracking-widest text-xs">Voltar</button>
                <button onClick={generateKetoPlan} className="flex-[2] bg-emerald-600 text-white py-5 rounded-2xl font-black shadow-2xl uppercase tracking-widest text-sm flex items-center justify-center gap-3">
                  <i className="fas fa-magic"></i> Gerar meu Plano
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Loading */}
          {step === 5 && (
            <div className="py-24 flex flex-col items-center justify-center space-y-8 animate-fadeIn">
              <div className="w-20 h-20 border-[6px] border-slate-100 border-t-emerald-600 rounded-full animate-spin"></div>
              <div className="text-center">
                <p className="font-black text-slate-800 uppercase tracking-[0.2em] text-sm mb-1">Criando Protocolo Personalizado</p>
                <p className="text-xs text-slate-400 font-bold italic animate-pulse">"Balanceando gorduras e calculando cetose..."</p>
              </div>
            </div>
          )}

          {/* Step 6: Resultados Interativos */}
          {step === 6 && plan && (
            <div className="space-y-12 animate-fadeIn print:space-y-0">
              {/* Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 p-8 rounded-[2rem] text-white flex flex-col justify-center shadow-xl print:bg-white print:text-slate-900 print:border print:p-6 print:rounded-2xl">
                  <p className="text-[10px] font-black text-emerald-400 uppercase mb-2 tracking-widest">Resumo Metabólico</p>
                  <h3 className="text-4xl font-black">{plan.dailyMacrosAverage.calories} <span className="text-sm font-normal opacity-50">kcal/dia</span></h3>
                  <div className="flex gap-4 text-[10px] font-black uppercase mt-4 text-slate-400 border-t border-white/10 pt-4">
                    <div className="flex flex-col"><span>Gordura</span><span className="text-white text-lg">{plan.dailyMacrosAverage.fats}g</span></div>
                    <div className="flex flex-col"><span>Proteína</span><span className="text-white text-lg">{plan.dailyMacrosAverage.protein}g</span></div>
                    <div className="flex flex-col"><span>Carbs</span><span className="text-rose-400 text-lg">{plan.dailyMacrosAverage.carbs}g</span></div>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4 print:hidden">
                  <div className="flex justify-between items-center px-1">
                    <h4 className="font-black text-slate-800 uppercase tracking-tighter text-xl">Cardápio da Semana</h4>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Toque para mudar o dia</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
                    {plan.weeklyMenu.map(d => (
                      <button 
                        key={d.day} 
                        onClick={() => {
                          setActiveDay(d.day);
                          setExpandedMealIndex(null);
                        }} 
                        className={`min-w-[75px] p-6 rounded-[1.5rem] border-2 transition-all flex flex-col items-center ${activeDay === d.day ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl -translate-y-1' : 'bg-white border-slate-100 text-slate-400 hover:border-emerald-200'}`}
                      >
                        <span className="text-[9px] font-black opacity-60 uppercase mb-1">Dia</span>
                        <span className="text-2xl font-black">{d.day}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Lista de Refeições Interativa (Accordion) */}
              <div className="space-y-6 print:hidden">
                <div className="bg-emerald-50 border-2 border-emerald-100 p-6 rounded-[2rem] flex flex-wrap justify-between items-center gap-4">
                  <p className="font-black text-emerald-800 uppercase text-xs tracking-widest flex items-center gap-2">
                    <i className="fas fa-calendar-day"></i> Foco Nutricional • Dia {activeDay}
                  </p>
                  <div className="flex gap-6 font-black text-slate-700 text-[11px] uppercase tracking-tighter">
                    <span className="flex items-center gap-2"><i className="fas fa-bolt text-rose-500"></i> {currentDayData?.macros.calories} KCAL</span>
                    <span className="flex items-center gap-2"><i className="fas fa-leaf text-emerald-500"></i> {currentDayData?.macros.carbs}g CARBS LÍQ.</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {currentDayData?.meals.map((meal, idx) => {
                    const isExpanded = expandedMealIndex === idx;
                    return (
                      <div key={idx} className={`bg-white border-2 rounded-[2rem] overflow-hidden transition-all duration-300 ${isExpanded ? 'border-emerald-500 shadow-2xl ring-4 ring-emerald-50' : 'border-slate-50 hover:border-emerald-100 shadow-sm'}`}>
                        <button 
                          onClick={() => toggleMealExpansion(idx)}
                          className="w-full text-left p-8 flex justify-between items-center gap-6 group"
                        >
                          <div className="flex items-center gap-6">
                            <span className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all ${isExpanded ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-600'}`}>
                              {idx + 1}
                            </span>
                            <div>
                              <p className="text-[10px] font-black text-emerald-600 uppercase mb-1 tracking-widest">{meal.name}</p>
                              <h4 className={`font-black text-lg leading-tight transition-colors ${isExpanded ? 'text-slate-900' : 'text-slate-700'}`}>{meal.description}</h4>
                            </div>
                          </div>
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isExpanded ? 'bg-rose-50 text-rose-600 rotate-45' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'}`}>
                            <i className="fas fa-plus text-xs"></i>
                          </div>
                        </button>

                        <div className={`overflow-hidden transition-all duration-500 ${isExpanded ? 'max-h-[800px] border-t border-slate-50' : 'max-h-0'}`}>
                          <div className="p-8 space-y-6 bg-slate-50/50">
                            <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-inner">
                              <p className="text-[10px] font-black text-emerald-600 uppercase mb-4 tracking-[0.2em] flex items-center gap-2">
                                <i className="fas fa-mortar-pestle"></i> Guia de Preparo Detalhado
                              </p>
                              <div className="text-slate-700 text-sm leading-relaxed italic whitespace-pre-wrap">
                                {meal.recipe}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dicas Personalizadas - Nova Seção Visualizada na Web */}
              <div className="bg-white border-2 border-slate-50 rounded-[2rem] p-10 shadow-sm print:hidden">
                <h4 className="text-2xl font-black text-slate-900 mb-8 border-b-4 border-emerald-500 pb-2 inline-block uppercase tracking-tighter">
                  Dicas de Sucesso Personalizadas
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {plan.tips.map((tip, i) => (
                    <div key={i} className="flex gap-5 p-6 bg-emerald-50/50 border border-emerald-100 rounded-3xl transition-all hover:shadow-md group">
                      <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-black shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                        {i + 1}
                      </div>
                      <p className="text-sm text-slate-700 font-medium leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* PDF Print View (All 7 Days) */}
              <div className="hidden print:block space-y-0">
                {plan.weeklyMenu.map(dayPlan => (
                  <div key={dayPlan.day} className="page-break py-12 border-b-2 border-slate-100 last:border-0">
                    <div className="flex justify-between items-end border-l-8 border-emerald-600 pl-8 mb-10">
                      <div>
                        <h3 className="text-4xl font-black uppercase tracking-tighter">DIA {dayPlan.day}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Metas Metabólicas</p>
                      </div>
                      <div className="text-right text-[10px] font-bold text-slate-500 uppercase leading-relaxed">
                        <p className="text-lg text-slate-900 font-black">{dayPlan.macros.calories} kcal</p>
                        <p>P: {dayPlan.macros.protein}g • G: {dayPlan.macros.fats}g • C: {dayPlan.macros.carbs}g</p>
                      </div>
                    </div>
                    <div className="space-y-10">
                      {dayPlan.meals.map((meal, mIdx) => (
                        <div key={mIdx} className="space-y-3">
                          <div className="flex items-center gap-4">
                            <span className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-xs">{mIdx + 1}</span>
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">{meal.name}</span>
                              <h4 className="text-xl font-bold text-slate-900">{meal.description}</h4>
                            </div>
                          </div>
                          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 leading-relaxed italic">
                            <span className="font-black not-italic block mb-2 text-slate-800 text-[9px] uppercase tracking-widest underline decoration-emerald-500 decoration-2">Instruções:</span>
                            {meal.recipe}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {/* Print Footer Page */}
                <div className="page-break pt-12">
                  <h3 className="text-3xl font-black text-slate-900 mb-10 border-b-8 border-slate-900 pb-4 uppercase tracking-tighter">Orientações Finais</h3>
                  <div className="grid grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <h4 className="font-black text-sm uppercase text-emerald-600 tracking-[0.3em] border-b border-emerald-100 pb-2">Substituições Sugeridas</h4>
                      {plan.swaps.map((s, i) => (
                        <div key={i} className="p-4 border-l-4 border-emerald-500 bg-emerald-50/30 rounded-r-xl">
                          <p className="font-black text-sm text-slate-800 mb-1">{s.item}</p>
                          <p className="text-[10px] text-slate-500 italic">{s.reason}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-6">
                      <h4 className="font-black text-sm uppercase text-rose-600 tracking-[0.3em] border-b border-rose-100 pb-2">Dicas de Sucesso</h4>
                      {plan.tips.map((t, i) => (
                        <div key={i} className="flex gap-4 p-5 bg-slate-50 rounded-2xl text-[10px] text-slate-700 font-medium border border-slate-100">
                          <span className="font-black text-emerald-600 text-lg leading-none">✓</span>
                          <p>{t}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ações Finais (Web) */}
              <div className="flex flex-col md:flex-row gap-6 pt-12 border-t-2 border-slate-50 print:hidden pb-12">
                <button 
                  onClick={() => window.print()} 
                  className="flex-1 bg-slate-900 text-white py-8 rounded-[2rem] font-black text-xl shadow-2xl flex items-center justify-center gap-4 hover:bg-black transition-all group"
                >
                  <i className="fas fa-file-pdf text-emerald-400 group-hover:scale-125 transition-transform"></i>
                  EXPORTAR PDF COMPLETO
                </button>
                <button 
                  onClick={() => {setStep(0); setPlan(null);}} 
                  className="flex-1 bg-white border-2 border-slate-200 py-8 rounded-[2rem] font-black text-slate-400 text-xl hover:bg-slate-50 transition-all"
                >
                  REINICIAR QUIZ
                </button>
              </div>

              <footer className="text-[9px] text-slate-300 text-center uppercase tracking-[0.5em] font-black mt-20 print:hidden">
                KetoGenius • IA Nutricional Avançada • v4.2
              </footer>
            </div>
          )}
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .page-break { page-break-after: always; }
        @media print {
          @page { margin: 1cm; size: A4; }
          body { background: white !important; -webkit-print-color-adjust: exact; }
          .page-break:last-child { page-break-after: auto; }
        }
      `}} />
    </div>
  );
}
