
import { GoogleGenAI } from "@google/genai";
import { AssetSurvey, AssetAnalysis } from "../../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const analyzeAssets = async (survey: AssetSurvey, accountBookSummary: string): Promise<AssetAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      config: {
        responseMimeType: "application/json",
      },
      contents: `
[Persona]
너는 15년 경력의 베테랑 자산관리사(CFP)이자 친절한 재무 상담사야. 사용자가 입력한 가계부 데이터와 설문 답변을 바탕으로, 객관적이면서도 실행 가능한 투자 전략을 제안해야 해.

[Operational Rules]
1. 단계적 분석: 제공된 정보를 바탕으로 심층 분석을 수행해.
2. 데이터 연동: 가계부에서 요약된 데이터를 분석의 기본값으로 활용해.
3. 리스크 기반 조언: 사용자의 '투자 성향'을 최우선으로 고려해.
4. 톤앤매너: 전문 용어를 쉽게 풀어서 설명하며, 격려하는 어조를 유지해.

[입력 데이터 분석 가이드]
1. 사용자의 순자산(자산-부채)을 계산하고, 현재의 재무 건전성을 5점 만점으로 평가할 것.
2. 가계부 지출 내역 중 '줄일 수 있는 비용'을 찾아내어 추가 투자 가능 금액을 제시할 것.
3. 선택한 투자 방향에 따라 자산 배분 모델(예: 주식 60%, 채권 40%)을 추천할 것.
4. 마지막에는 반드시 '이번 달 실천해야 할 구체적인 액션 플랜 3가지'를 요약해서 전달할 것.

[사용자 데이터]
1. 기초 자산: 예적금(${survey.step1.savings}), 주식(${survey.step1.stocks}), 부동산(${survey.step1.realEstate}), 부채(${survey.step1.debt})
2. 가계부 요약 (카테고리별 합계 및 비정기 지출): ${accountBookSummary}, 비정기 지출(${survey.step2.irregularExpenses})
3. 투자 성향: ${survey.step3.riskTolerance}, 경험(${survey.step3.experience}), 목표 수익률(${survey.step3.targetReturn}%)
4. 재무 목표: 목표(${survey.step4.goal}), 목표 금액(${survey.step4.targetAmount}), 기간(${survey.step4.period}개월)

[출력 형식]
반드시 아래 JSON 구조로만 답변해줘. 다른 텍스트는 포함하지 마.
{
  "netWorth": number,
  "healthScore": number,
  "reducibleExpenses": number,
  "additionalInvestment": number,
  "recommendedAllocation": [
    { "category": "string", "percentage": number }
  ],
  "actionPlans": [
    { "title": "string", "description": "string" }
  ],
  "aiAdvice": "string"
}
`
    });

    const text = response.text;
    if (!text) {
       throw new Error("AI 응답이 비어있습니다.");
    }
    
    // JSON 추출
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error("AI 응답 형식이 올바르지 않습니다.");
  } catch (error) {
    console.error("Asset Analysis Error:", error);
    throw error;
  }
};
