import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { TOPICS } from '@/lib/topics';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { messages, topicId } = await req.json() as {
      messages: { role: 'user' | 'assistant'; content: string }[];
      topicId: string;
    };

    const topic = TOPICS.find(t => t.id === topicId);
    if (!topic) {
      return NextResponse.json({ error: '找不到该话题' }, { status: 400 });
    }

    const systemPrompt = `你是一位友善的华文口语练习伙伴，正在和新加坡中学生进行一段真实的口语对话练习。你的回复会被直接朗读出来，所以必须听起来像真人在说话，而不是书面文字。

当前练习话题：《${topic.title}》

对话规则（非常重要）：
- 每次回复只说1到2句话，绝对不能超过3句。要简短、自然、口语化。
- 先用一句话回应学生说的内容（"嗯，说得有道理！"、"哇，这个角度很特别！"、"我也觉得是这样。"），然后紧接着问一个具体的问题。
- 问题要具体、开放，让学生有话说。不要问"对不对"或"好不好"这种是非题。
- 如果学生表达不清楚，帮他说清楚，然后问他："你是这个意思吗？"
- 整个对话要像朋友聊天，轻松随意，不要像老师提问。
- 全程用简体华文，不用英文。
- 绝对不要用序号、列表或分段落的方式回复。就是自然说话。`;



    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      system: systemPrompt,
      messages,
    });

    const reply = response.content[0].type === 'text' ? response.content[0].text : '';
    return NextResponse.json({ reply });
  } catch (err) {
    console.error('[/api/chat]', err);
    const msg = err instanceof Error ? err.message : '未知错误';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
