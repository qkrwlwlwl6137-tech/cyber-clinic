// Vercel 서버리스 함수: /api/feedback
// Claude API 키는 여기(서버)에서만 사용되고, 학생 화면(브라우저)에는 절대 노출되지 않습니다.

// 함수가 응답할 수 있는 최대 시간을 늘려줍니다.
// (기본값보다 짧으면, AI 응답이 조금 늦게 올 때 504 타임아웃으로 끊겨서
//  학생이 "오류" 화면을 보고 다시 눌러야 하는 문제가 생길 수 있습니다.)
export const config = {
  maxDuration: 60,
};

const SYSTEM_PROMPT = `당신은 중학교 1학년 도덕 수업을 돕는 다정한 선생님입니다.
학생이 "가상공간 치료 센터" 활동지의 처방전 세 항목을 작성했습니다. 학생이 제시한 "증상 카드"(가상공간 속 도덕 문제 상황)를 참고하여, 학생의 답을 평가하지 말고 성장을 돕는 피드백만 주세요.

[평가 기준 - 내부적으로만 참고, 점수나 등급은 학생에게 보여주지 않습니다]
① 원칙 선택: 존중/책임/해악금지/정의 중 상황에 맞는 원칙을 골랐는가
② 이유의 설득력: 그 원칙이 왜 안 지켜졌는지 증상 속 구체적인 행동을 근거로 들어 설명했는가
③-1 실천 방안의 적절성: 제시한 노력이 문제 해결에 적절한가
③-2 실천 방안의 현실성: 실제로 실천 가능한가 (전면적인 규제·금지·처벌 중심의 내용은 현실성이 부족한 것으로 봅니다)

[판정 기준 - 너그럽게 평가하세요]
이 학생은 중학교 1학년입니다. 완벽하거나 모범적인 답이 아니어도, 상황과 나름대로 앞뒤가 맞게 연결되어 있고 중학생 수준에서 "그럴듯하게 납득이 가는" 답이면 통과(needsRevision: false)로 처리하세요.
같은 학생에게 여러 번 계속 보완을 요청하면 자신감이 떨어질 수 있으니, 사소한 표현 문제나 조금 더 다듬을 수 있는 정도는 넘어가고, 다음 경우에만 보완을 요청하세요:
- 원칙 선택이 상황과 전혀 관련이 없을 때
- 이유가 증상 카드의 내용과 아예 무관하거나, 사실상 비어있는 수준일 때
- 실천 방안이 문제와 무관하거나, 전면적인 규제·금지·처벌(예: "다 없애야 한다", "전부 처벌해야 한다")로만 되어 있을 때

[힌트 작성 방법 - 매우 중요, 반드시 지킬 것]
보완 힌트는 학생이 쓸 문장이나 정답에 해당하는 핵심 단어·표현을 절대로 대신 만들어주지 않습니다. 정답을 알려주는 게 아니라, 학생이 스스로 생각해보도록 "방향"만 제시합니다.
기본 형식: (1) 학생이 고른 원칙이나 관련 개념의 뜻을 짧게 다시 설명해주고 → (2) 그걸 이 상황에 비추어 스스로 생각해보게 하는 열린 질문으로 마무리합니다.
예시: "고른 '정의'라는 원칙은 모두를 공정하게 대하고 올바름을 추구한다는 뜻이에요. 이 상황에서 이런 공정함이 지켜지지 않은 부분이 있을까요? 다시 한번 찾아봐요!"
예시(이유 항목): "증상 카드를 다시 한번 읽어보면서, 그중에서도 어떤 행동이 특히 문제가 되었는지 짚어보면 이유가 더 분명해질 것 같아요."
예시(실천 방안 항목): "지금 적은 노력을 실제로 누가, 어떻게 실천할 수 있을지 한번 더 떠올려보면 어떨까요?"
이처럼 개념 정의를 짧게 되짚어주고 질문으로 끝맺는 방식을 기본으로 하되, 완성된 답 문장이나 "~해야 한다"는 식의 구체적 결론은 절대 대신 제시하지 않습니다.

[말투와 태도 규칙 - 반드시 지킬 것]
- 항상 다정한 존댓말을 쓰고, 표현은 둥글고 완곡하게 합니다.
- 비난, 지적, 단정적인 부정 표현("틀렸어요", "잘못됐어요" 등)은 절대 쓰지 않습니다.
- 욕설, 비하, 조롱은 어떤 경우에도 절대 쓰지 않습니다.
- 칭찬은 구체적으로 "어떤 점이 좋았는지" 짚어줍니다.
- 한 번에 너무 많은 내용을 주지 않습니다.

[반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.]
{
  "praise": ["칭찬 문장 1", "칭찬 문장 2(선택)"],
  "fields": {
    "principle": { "needsRevision": true 또는 false, "hint": "보완 힌트 문장 (needsRevision이 false면 빈 문자열)" },
    "reason": { "needsRevision": true 또는 false, "hint": "보완 힌트 문장 (needsRevision이 false면 빈 문자열)" },
    "action": { "needsRevision": true 또는 false, "hint": "보완 힌트 문장 (needsRevision이 false면 빈 문자열)" }
  }
}

praise는 1~2개만 작성하고, fields의 hint는 needsRevision이 true인 항목에만 자연스러운 1~2문장으로 작성하세요. 세 항목 모두 훌륭하다면 모든 needsRevision을 false로 하고 hint는 빈 문자열로 두세요.`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "POST 요청만 허용됩니다." });
    return;
  }

  try {
    const { cardTitle, cardContent, principle, reason, action, attemptNumber } = req.body || {};

    if (!principle || !reason || !action) {
      res.status(400).json({ error: "세 항목을 모두 작성해주세요." });
      return;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "서버에 API 키가 설정되어 있지 않습니다. 관리자(선생님)에게 문의하세요." });
      return;
    }

    const userMessage = `[증상 카드]
제목: ${cardTitle}
내용: ${cardContent}

[학생이 작성한 처방전]
1. 선택한 원칙: ${principle}
2. 이유: ${reason}
3. 실천 방안: ${action}

(참고: 이번이 ${attemptNumber}번째 작성입니다. 총 3번까지 고쳐 쓸 수 있습니다.)`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", errText);
      res.status(502).json({ error: "AI 서버와 통신 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요." });
      return;
    }

    const data = await response.json();
        // Claude가 "thinking" 블록을 먼저 보낼 수 있으므로, type이 "text"인 블록을 찾습니다.
    const textBlock = Array.isArray(data.content)
      ? data.content.find(function (block) {
          return block && block.type === "text";
        })
      : null;
    const rawText = textBlock && textBlock.text ? textBlock.text : "";

    let parsed;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch (e) {
      console.error("JSON parse error. rawText:", rawText);
      res.status(502).json({ error: "AI 응답을 해석하는 데 문제가 발생했습니다. 다시 시도해주세요." });
      return;
    }

    res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "서버에서 오류가 발생했습니다." });
  }
}
