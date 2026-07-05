// pages/practice/practice.js
const db = wx.cloud.database();

Page({
  data: {
    knowledgeList: [],
    knowledgeTitles: [],
    knowledgeIndex: 0,
    selectedKnowledge: '',
    questionCount: 10,
    questions: [],
    currentQuestion: null,
    currentIndex: 0,
    selectedAnswer: -1,
    textAnswer: '',
    showAnswer: false,
    practiceComplete: false
  },

  onLoad() {
    this.loadKnowledge();
  },

  async loadKnowledge() {
    const openid = await this.getOpenId();
    const res = await db.collection('knowledge_bases')
      .where({ _openid: openid })
      .orderBy('createTime', 'desc')
      .get();

    this.setData({
      knowledgeList: res.data,
      knowledgeTitles: res.data.map(item => item.title)
    });
  },

  onKnowledgeChange(e) {
    const index = e.detail.value;
    this.setData({
      knowledgeIndex: index,
      selectedKnowledge: this.data.knowledgeTitles[index]
    });
  },

  setCount(e) {
    this.setData({ questionCount: e.currentTarget.dataset.count });
  },

  async generateQuestions() {
    if (!this.data.selectedKnowledge) {
      wx.showToast({ title: '请选择知识库', icon: 'none' });
      return;
    }

    wx.showLoading({ title: 'AI出题中...' });

    const knowledge = this.data.knowledgeList[this.data.knowledgeIndex];

    // 调用云函数生成题目
    wx.cloud.callFunction({
      name: 'generateQuestions',
      data: {
        knowledgeContent: knowledge.content,
        knowledgeTitle: knowledge.title,
        count: this.data.questionCount
      },
      success: (res) => {
        wx.hideLoading();
        if (res.result && res.result.questions) {
          this.setData({
            questions: res.result.questions,
            currentIndex: 0,
            currentQuestion: res.result.questions[0],
            selectedAnswer: -1,
            textAnswer: '',
            showAnswer: false,
            practiceComplete: false
          });
        } else {
          wx.showToast({ title: '出题失败，请重试', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('AI出题失败', err);
        wx.showToast({ title: '出题失败，请重试', icon: 'none' });
      }
    });
  },

  selectAnswer(e) {
    if (this.data.showAnswer) return;
    this.setData({ selectedAnswer: e.currentTarget.dataset.index });
  },

  onTextAnswer(e) {
    this.setData({ textAnswer: e.detail.value });
  },

  showAnswerFn() {
    this.setData({ showAnswer: true });
  },

  nextQuestion() {
    const nextIndex = this.data.currentIndex + 1;
    
    if (nextIndex >= this.data.questions.length) {
      this.setData({ practiceComplete: true });
      return;
    }

    this.setData({
      currentIndex: nextIndex,
      currentQuestion: this.data.questions[nextIndex],
      selectedAnswer: -1,
      textAnswer: '',
      showAnswer: false
    });
  },

  goToCheckin() {
    wx.switchTab({ url: '/pages/checkin/checkin' });
  },

  restartPractice() {
    this.setData({
      questions: [],
      currentQuestion: null,
      currentIndex: 0,
      practiceComplete: false
    });
  },

  getOpenId() {
    return new Promise((resolve) => {
      wx.cloud.callFunction({
        name: 'getOpenId',
        success: res => resolve(res.result.openid),
        fail: () => resolve('')
      });
    });
  }
});
