// 云函数入口 - AI 自动出题
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { knowledgeContent, knowledgeTitle, count = 10 } = event;

  // 使用 CloudBase AI 模型生成题目
  try {
    const ai = cloud.extend.AI();
    const model = ai.createModel({
      group: 'cloudbase',
      model: 'deepseek-v4-flash'
    });

    const prompt = `请根据以下知识库内容，生成 ${count} 道练习题。

知识库标题：${knowledgeTitle}
知识库内容：${knowledgeContent.substring(0, 3000)}

要求：
1. 题目类型可以是选择题或问答题
2. 选择题格式：{ "type": "choice", "question": "题目", "options": ["A选项", "B选项", "C选项", "D选项"], "correctIndex": 0, "answer": "正确答案", "explanation": "解析" }
3. 问答题格式：{ "type": "text", "question": "题目", "answer": "参考答案", "explanation": "解析" }
4. 返回 JSON 数组格式，只返回 JSON，不要其他内容

请生成 ${count} 道题目：`;

    const result = await model.generateText({
      model: 'deepseek-v4-flash',
      messages: [{ role: 'user', content: prompt }]
    });

    let questions = [];
    try {
      const text = result.choices[0].message.content;
      // 提取 JSON
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('解析题目失败', e);
    }

    // 如果 AI 生成失败，返回模拟题目
    if (questions.length === 0) {
      questions = generateMockQuestions(knowledgeTitle, count);
    }

    return { success: true, questions };
  } catch (err) {
    console.error('AI出题失败', err);
    return { success: false, questions: generateMockQuestions(knowledgeTitle, count) };
  }
};

// 模拟出题（兜底方案）
function generateMockQuestions(title, count) {
  const questions = [];
  for (let i = 0; i < count; i++) {
    questions.push({
      type: 'choice',
      question: `关于「${title}」的第${i + 1}题是？`,
      options: ['选项A', '选项B', '选项C', '选项D'],
      correctIndex: 0,
      answer: '选项A',
      explanation: '这是正确答案的解析说明。'
    });
  }
  return questions;
}
