// SERVER-SIDE ONLY — never import in client components
import Anthropic from '@anthropic-ai/sdk';
import type { AIEvaluation, DiscussionMessage } from './types';
import { extractJsonFromText } from './utils';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const EXAMINER_SYSTEM_PROMPT = `你是一位严格、专业的新加坡教育部（SEAB）高级华文口试外部考官。
你的职责是根据学生的口头报告，提出深刻、有挑战性的问题，以测试学生的：
1. 逻辑一致性与思辨能力（思辨能力）
2. 对社会现象的深度理解
3. 论点的严密性与说服力
4. 词汇运用的准确性与丰富性

考官风格：严谨、理性、不接受含糊其辞的回答。
始终使用标准书面华文。所有输出必须为有效的 JSON 格式。`;

// ─── 1. Generate Discussion Questions (Sonnet — fast, interactive) ─────────
export async function generateDiscussionQuestions(
  transcript: string,
  assignmentPrompt: string
): Promise<string[]> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: EXAMINER_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `学生口头报告记录如下：
<transcript>
${transcript}
</transcript>

本次口试的核心议题与提示：
<prompt>
${assignmentPrompt}
</prompt>

请针对上述报告，生成 2 至 3 道严格的互动讨论问题。要求：
- 第一道：直接针对报告中某个论点的逻辑漏洞或自相矛盾之处
- 第二道：要求学生对某一影响或建议作更深层的论证
- 第三道（可选）：引导学生思考反对意见或限制条件
- 每道问题必须是开放性的，不能用"是"或"否"回答
- 使用正式书面华文，语气严谨

请以 JSON 格式输出：
{"questions": ["第一题", "第二题", "第三题（可选）"]}`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '{"questions":[]}';
  try {
    const parsed = extractJsonFromText(text) as { questions: string[] };
    return parsed.questions.slice(0, 3);
  } catch {
    // Fallback: extract questions from plain text
    const lines = text.split('\n').filter(l => l.trim().match(/^[1-3][.。]/));
    if (lines.length) return lines.map(l => l.replace(/^[1-3][.。]\s*/, '').trim());
    throw new Error('无法解析考官问题');
  }
}

// ─── 2. Generate Full Evaluation (Opus — deep, thorough) ──────────────────
export async function generateEvaluation(
  transcript: string,
  discussionLog: DiscussionMessage[]
): Promise<AIEvaluation> {
  const discussionText = discussionLog
    .map((m) => `${m.role === 'examiner' ? '【考官】' : '【学生】'} ${m.content}`)
    .join('\n\n');

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 3500,
    system: EXAMINER_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `请根据以下学生的口头报告记录及互动讨论记录，按照 SEAB 高级华文口试评分标准进行综合评估。

<oral_report_transcript>
${transcript}
</oral_report_transcript>

<discussion_log>
${discussionText}
</discussion_log>

评分标准（满分 40 分）：
- content_depth（内容与思维）：0-20 分，考查论点深度、批判思维、现象分析、建议可行性
- vocabulary_language（语言与词汇）：0-20 分，考查词汇丰富性、语法准确性、表达流畅度、成语运用
- structure_logic（逻辑结构）：0-20 分，考查论证逻辑性、框架完整性、连贯性（此项仅供参考，不计入 total）
- total = content_depth + vocabulary_language（最高 40 分）

严格按以下 JSON 格式输出（不要有多余文字）：
{
  "scores": {
    "content_depth": <integer 0-20>,
    "structure_logic": <integer 0-20>,
    "vocabulary_language": <integer 0-20>,
    "total": <integer 0-40>
  },
  "fluency_metrics": {
    "filler_word_count": <integer>,
    "frequent_fillers": ["填充词1", "填充词2"]
  },
  "syntax_errors": [
    {
      "error_text": "原文片段（引用原话）",
      "correction": "正确表达",
      "explanation": "错误类型说明（量词/句式/词序等）"
    }
  ],
  "vocabulary_upgrader": [
    {
      "original": "原始表达",
      "upgraded": "升级后的表达",
      "idiom_flag": true,
      "context": "使用语境说明"
    }
  ],
  "class_macro_tags": ["标签1", "标签2", "标签3"],
  "examiner_feedback": "综合反馈（150-200字，先肯定优点，再指出2-3个具体改进点，最后给出1条明确的练习建议）"
}`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  return extractJsonFromText(text) as AIEvaluation;
}
