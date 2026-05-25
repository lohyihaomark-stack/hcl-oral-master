import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface FeedbackRequest {
  messages: { role: 'user' | 'assistant'; content: string }[];
  topicTitle: string;
  studentName: string;
}

interface Feedback {
  strength: string;
  improve: string;
  vocab: string | null;
  overall: string;
}

function parseFeedback(raw: string): Feedback {
  // Try JSON code fence first
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1] : raw;

  // Extract the outermost {...}
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found');

  const jsonStr = candidate.slice(start, end + 1);
  const parsed = JSON.parse(jsonStr) as Partial<Feedback>;
  return {
    strength: parsed.strength ?? '',
    improve: parsed.improve ?? '',
    vocab: parsed.vocab ?? null,
    overall: parsed.overall ?? '',
  };
}

export async function POST(req: NextRequest) {
  try {
    const { messages, topicTitle, studentName } = (await req.json()) as FeedbackRequest;

    const studentTurns = messages.filter(m => m.role === 'user');
    if (studentTurns.length < 2) {
      return NextResponse.json({
        feedback: {
          strength: '你已经开始练习了，这是很好的第一步！',
          improve: '尝试多说几轮，让AI有更多内容来给你反馈。',
          vocab: null,
          overall: '继续加油！',
        },
      });
    }

    const conversation = messages
      .map(m => `${m.role === 'user' ? studentName : 'AI助手'}：${m.content}`)
      .join('\n\n');

    const systemPrompt = `你是一位华文口语练习评估助手。你必须只输出JSON，不输出任何其他内容。`;

    const userPrompt = `以下是学生${studentName}与AI助手关于《${topicTitle}》的华文口语练习对话记录：

${conversation}

请根据学生的回答，给出简短的学习反馈。只返回以下JSON格式，不要任何解释：

{"strength":"做得好的地方（一句话）","improve":"需要改进的地方（一句话）","vocab":"词汇升级建议，格式：原词→升级词（解释），没有合适的填null","overall":"一句鼓励的话"}`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}';
    console.log('[feedback] raw response:', raw.slice(0, 200));

    let feedback: Feedback;
    try {
      feedback = parseFeedback(raw);
    } catch {
      // If parsing fails, extract values manually with regex
      const getField = (key: string) => {
        const m = raw.match(new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`));
        return m ? m[1] : '';
      };
      feedback = {
        strength: getField('strength') || '表达清晰，有自己的观点。',
        improve: getField('improve') || '可以尝试使用更丰富的词汇。',
        vocab: getField('vocab') || null,
        overall: getField('overall') || '继续加油！',
      };
    }

    return NextResponse.json({ feedback });
  } catch (err) {
    console.error('[/api/feedback]', err);
    // Return graceful fallback instead of 500
    return NextResponse.json({
      feedback: {
        strength: '你能积极参与练习，这本身就是很好的表现！',
        improve: '尝试在回答时多举具体例子，让观点更有说服力。',
        vocab: null,
        overall: '继续练习，你的华文一定会越来越好！',
      },
    });
  }
}
