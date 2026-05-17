
import { GoogleGenAI, Type } from "@google/genai";
import { CounselingRecord, DiaryEntry, LifeRoutine, User } from "../../types";

let AI_CLIENT: GoogleGenAI | null = null;
let LAST_USED_KEY: string | null = null;

// Simple in-memory cache
const CACHE: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 3600000; // 1 hour

// Robust in-memory cache with fallback to localStorage
const getCache = (key: string): any | null => {
  // In-memory check first
  if (CACHE[key] && (Date.now() - CACHE[key].timestamp < CACHE_TTL)) {
    return CACHE[key].data;
  }
  
  // LocalStorage fallback
  try {
    const stored = localStorage.getItem(`ai_cache_${key}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Date.now() - parsed.timestamp < CACHE_TTL) {
        CACHE[key] = parsed; // Update in-memory
        return parsed.data;
      }
      localStorage.removeItem(`ai_cache_${key}`);
    }
  } catch (e) {
    // Ignore storage errors
  }
  return null;
};

const setCache = (key: string, data: any) => {
  const cacheEntry = { data, timestamp: Date.now() };
  CACHE[key] = cacheEntry;
  try {
    localStorage.setItem(`ai_cache_${key}`, JSON.stringify(cacheEntry));
  } catch (e) {
    // Possibly quota exceeded in localStorage, clear some old entries
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      // Very crude cleanup
      for(let i=0; i<localStorage.length; i++){
        const k = localStorage.key(i);
        if(k?.startsWith('ai_cache_')) localStorage.removeItem(k);
      }
    }
  }
};

const requestProxy = async (model: string, contents: any, config: any) => {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, contents, config }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Proxy request failed");
  }
  const data = await response.json();
  return data.text;
};

// Simple hash function for cache keys
const getHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
};

const callAiWithRetry = async (
  fn: () => Promise<any>,
  maxRetries: number = 5,
  baseDelay: number = 2000
): Promise<any> => {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMessage = error.message || String(error);
      const statusCode = error.status || error.code;
      
      // Don't retry on definite permanent errors
      if (
        statusCode === 401 || // Unauthorized
        statusCode === 403 || // Forbidden
        statusCode === 400 || // Bad Request
        errorMessage.includes("API_KEY") ||
        errorMessage.includes("not found")
      ) {
        throw error;
      }

      // Exponential backoff: baseDelay * 2^i + jitter
      const delay = baseDelay * Math.pow(2, i) + Math.random() * 1000;
      console.warn(`[Gemini] Attempt ${i + 1} failed. Retrying in ${Math.round(delay)}ms...`, errorMessage);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};

const DEFAULT_MODEL = "gemini-1.5-flash"; // Using stable model name

export const consultAI = async (diaryContent: string, userName: string) => {
  const cacheKey = `consult_${getHash(diaryContent)}_${userName}`;
  const cached = getCache(cacheKey);
  if (cached) {
    console.log("[Gemini] Returning cached consultAI result");
    return cached;
  }

  const startTime = Date.now();
  console.log("[Gemini] consultAI started", { userName, contentLength: diaryContent.length });
  
  try {
    const cleanContent = diaryContent.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/&[a-z]+;/g, '');

    const prompt = `[역할 정의: 전인적 통합 치유 마스터]
          당신은 사용자 '${userName}'님을 위한 '심층 심리 및 영성 통합 상담사'입니다. 
          세계적인 심리전문가들의 지혜(신경과학, 인지행동, 분석심리, 존재론적 접근)와 전인적 치유 프로토콜을 결합하여 최상의 상담을 제공하십시오.

          [통합 상담 프로토콜 및 기반 이론]
          1. 심층적 공감 및 라포 (Carl Rogers / 오은영): 무조건적인 긍정적 존중과 따뜻한 수용으로 정서적 안전을 구축합니다.
          2. 내면 가족 체계 (IFS - Richard Schwartz): 사용자의 감정을 하나의 '부분(Part)'으로 인식하고, 그 이면의 의도와 '참자기(Self)'를 연결합니다.
          3. 수용 전념 및 유연성 (ACT - Steven Hayes): 불행한 생각과 싸우지 않고 수용하며, 개인의 가치에 전념하게 돕습니다.
          4. 의미 요법 및 실존 (Logotherapy - Viktor Frankl): 고통 속에서도 삶의 의미를 발견하고 존재의 이유를 찾도록 안내합니다.
          5. 신체 감각 자각 (Somatic Experiencing - Peter Levine): 감정이 신체 어디에서 느껴지는지 살피고, 신경계의 안정을 도모합니다.
          6. 인지 및 언어 재구성 (CBT / NLP): 왜곡된 인지 도식을 발견하고, 에릭슨적 은유를 통해 무의식적 변화를 유도합니다.
          7. 미래 현상화 및 확언 (Neville Goddard): 이미 치유된 상태의 진동을 느끼게 하여 내면의 현실을 재창조합니다.

          [상담자 정보]
          - 성함: ${userName}

          [상담 지침]
          - 진단명을 함부로 붙이지 않되, 현상의 심리학적 원리를 전문성 있게 설명하십시오.
          - 제목이나 본문에 전문가의 실명이나 기법 명칭(예: 'CBT 기법 적용')을 괄호나 텍스트로 직접 노출하지 마십시오. 자연스럽게 대화의 흐름 속에 녹여내십시오.
          - 말투: 차분하고 우아하며 신뢰감 있는 따뜻한 존댓말 (해요체).
          - 가독성: 마크다운(Markdown) 형식을 사용하여 구조화하십시오.

          [사용자의 일기 내용]:
          "${cleanContent}"

          [필수 포함 요소]
          - 따뜻한 첫 인사과 공감
          - 현재 상태에 대한 심층적 심리 기제 설명
          - 내면을 통찰할 수 있는 핵심적인 질문 (1~2개)
          - 일상에서 실천 가능한 '치유 의식(Ritual)' 제안
          - 희망적인 맺음말과 확언`;

    const text = await callAiWithRetry(async () => {
      return await requestProxy(DEFAULT_MODEL, [{ role: "user", parts: [{ text: prompt }] }], {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      });
    });

    const duration = Date.now() - startTime;
    console.log(`[Gemini] consultAI success (${duration}ms)`);

    if (!text) {
      throw new Error("AI로부터 유효한 응답을 받지 못했습니다.");
    }

    setCache(cacheKey, text);
    return text;
  } catch (error: any) {
    console.error("AI Counseling Error 상세:", error);
    const errorMessage = error.message || String(error);
    const statusCode = error.status || error.code || "Unknown";
    
    if (errorMessage.includes("Forbidden") || errorMessage.includes("403") || statusCode === 403) {
      throw new Error(`[403 Forbidden] AI 접근 권한이 없습니다. (원인: ${errorMessage}). 결제 설정 또는 API 키 활성화 여부를 확인해 주세요.`);
    }
    if (errorMessage.includes("model") || errorMessage.includes("404") || statusCode === 404) {
      throw new Error(`[404 Not Found] 모델(${DEFAULT_MODEL})을 찾을 수 없습니다. (원인: ${errorMessage}). API 키가 올바른 프로젝트에서 생성되었는지 확인하세요.`);
    }
    if (errorMessage.includes("Invalid API key") || errorMessage.includes("API_KEY_INVALID")) {
      throw new Error("입력하신 API 키가 유효하지 않습니다. 'AIza...'로 시작하는 키인지 확인해 주세요.");
    }
    throw new Error(`AI 서비스 연결 중 오류 발생(${statusCode}): ${errorMessage}`);
  }
};

export const generateWeeklyRoutine = async (
  records: CounselingRecord[],
  diaries: DiaryEntry[],
  userId: string,
  userName: string
): Promise<Partial<LifeRoutine>> => {
  const cacheKey = `routine_${userId}_${diaries.length}_${records.length}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const recentDiaries = diaries.slice(-10).map(d => d.text).join("\n---\n");
    const recentAdvice = records.slice(-10).map(r => r.aiAdvice).join("\n---\n");

    const prompt = `[시스템 역할: 홀리스틱 퍼포먼스 및 회복 설계자]
    당신은 사용자 '${userName}'님의 잠재력을 최적화하고 심신의 조화를 돕는 '라이프 디자인 전문가'입니다. 최근의 심리적 흐름과 일기 데이터를 기반으로, 신경계의 회복과 자아 실현을 동시에 달성할 수 있는 맞춤형 치유 루틴을 설계하십시오.

    [상태 분석 프레임워크]
    - 회복 탄력성(Resilience), 동기 부여(Motivation), 스트레스 부하(Stress Load)를 종합 분석하여 최적의 루틴 강도를 결정합니다.
    - 대상자 성함: ${userName}
    - 일기 내용: ${recentDiaries}
    - AI 상담 조언: ${recentAdvice}

    [루틴 항목 가이드]
    다음 항목들을 사용자의 상태에 맞춰 적절히 배분하십시오:
    - 독서, 일기쓰기, 명상, 걷기, 달리기, 건강식 아침 먹기, 아침 기상(정해진 시간), 자기개발 영상 시청.

    [상태 단계]
    - STABLE (안정): 현재 양호함. 유지 및 발전을 위한 루틴. (난이도: 높음)
    - CAUTION (주의): 피로감이 있음. 일상 유지를 위한 루틴. (난이도: 중간)
    - RECOVERY (회복): 심리적 타격 또는 무력감. 작은 성취 위주의 루틴. (난이도: 낮음)
    - BURNOUT (번아웃): 극심한 탈진. 생존 및 필수 휴식 위주의 루틴. (난이도: 매우 낮음)

    반드시 유효한 JSON 형식으로만 답변하십시오.`;

    const resultText = await callAiWithRetry(async () => {
      return await requestProxy(DEFAULT_MODEL, [{ role: "user", parts: [{ text: prompt }] }], {
        responseMimeType: "application/json",
      });
    });

    const parsed = JSON.parse(resultText.trim());
    setCache(cacheKey, parsed);
    return parsed;
  } catch (error: any) {
    console.error("Routine Generation Error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    throw new Error(`루틴 설계 중 오류가 발생했습니다: ${error.message || String(error)}`);
  }
};

export const generateWeeklyReport = async (
  records: CounselingRecord[],
  diaries: DiaryEntry[],
  userId: string,
  userName: string
): Promise<any> => {
  const cacheKey = `report_${userId}_${diaries.length}_${records.length}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const recentDiaries = diaries.slice(-15).map(d => `[${d.date}] ${d.text}`).join("\n---\n");
    const recentAdvice = records.slice(-15).map(r => `[${r.date}] ${r.aiAdvice}`).join("\n---\n");

    const prompt = `[시스템 역할: 심층 심리 동역학 분석가]
    단순한 감정 나열을 넘어, 사용자 '${userName}'님의 내면에서 일어나는 무의식적 패턴과 자아의 성장 동력을 포착하는 전문 분석가입니다.
    대상자의 존재론적 불안과 열망, 정서적 방어 기제와 회복의 단초를 분석하여 리포트를 작성하십시오.
    
    [사용자 정보]
    - 대상자 성함: ${userName}
    
    [분석 목표]
    1. 심리 변화의 흐름 (Mental Trend): 사용자의 정서적 상태가 어떻게 변해왔는지 시간순/주제별 분석.
    2. 방향성 (Directionality): 현재 마음이 향하고 있는 곳과 긍정적/부정적 경로 유추.
    3. 감정 점수 (Emotional Shift): 날짜별 감정 점수(0~100)와 핵심 감정 단어.
    4. 트리거 분석: 긍정적인 영향을 준 요소와 부정적인 영향을 준 요소 추출.

    [분석 데이터]
    - 일기: ${recentDiaries}
    - AI 조언: ${recentAdvice}

    반드시 유효한 JSON 형식으로만 답변하십시오. 한국어로 작성하십시오.`;

    const resultText = await callAiWithRetry(async () => {
      return await requestProxy(DEFAULT_MODEL, [{ role: "user", parts: [{ text: prompt }] }], {
        responseMimeType: "application/json",
      });
    });

    const parsed = JSON.parse(resultText.trim());
    setCache(cacheKey, parsed);
    return parsed;
  } catch (error: any) {
    console.error("Report Generation Error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    throw new Error(`심리 분석 리포트 생성 중 오류가 발생했습니다: ${error.message || String(error)}`);
  }
};

export const generateRelationshipReport = async (
  allDiaries: DiaryEntry[],
  allCounseling: CounselingRecord[],
  users: User[]
): Promise<any> => {
  const cacheKey = `rel_report_${allDiaries.length}_${allCounseling.length}_${users.length}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const context = users.map(u => {
      const userDiaries = allDiaries.filter(d => d.userId === u.id).slice(-10).map(d => d.text).join(" | ");
      const userAdvice = allCounseling.filter(r => r.userId === u.id).slice(-10).map(r => r.aiAdvice).join(" | ");
      return `[사용자: ${u.name}]\n일기: ${userDiaries}\n상담조언: ${userAdvice}`;
    }).join("\n\n---\n\n");

    const prompt = `[시스템 역할: 공동체 무의식 및 관계 역동 전문가]
    공동체의 표면적인 상호작용 뒤에 숨겨진 '관계의 동역학'을 분석하는 전문가입니다.
    구성원들 간의 투사(Projection), 보완성(Complementarity), 그리고 집단적 치유가 발생하는 지점을 포착하여 리포트를 작성하십시오.
    
    [분석 데이터]
    ${context}

    반드시 유효한 JSON 형식으로만 답변하십시오. 한국어로 작성하십시오.`;

    const resultText = await callAiWithRetry(async () => {
      return await requestProxy(DEFAULT_MODEL, [{ role: "user", parts: [{ text: prompt }] }], {
        responseMimeType: "application/json",
      });
    });

    const parsed = JSON.parse(resultText.trim());
    setCache(cacheKey, parsed);
    return parsed;
  } catch (error: any) {
    console.error("Relationship Report Error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    throw new Error(`관계 리포트를 생성하는 중 오류가 발생했습니다: ${error.message || String(error)}`);
  }
};
