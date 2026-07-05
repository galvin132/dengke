// pages/index/index.js
const db = wx.cloud.database();

Page({
  data: {
    userInfo: {},
    checkinStreak: 0,
    knowledgeCount: 0,
    questionCount: 0,
    todayRecommend: []
  },

  onLoad() {
    this.getUserInfo();
    this.loadStats();
    this.loadRecommend();
  },

  onShow() {
    this.loadStats();
  },

  getUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ userInfo });
    }
  },

  async loadStats() {
    const openid = await this.getOpenId();
    
    // 打卡连续天数
    const checkinRes = await db.collection('checkins')
      .where({ _openid: openid })
      .orderBy('date', 'desc')
      .limit(100)
      .get();
    
    let streak = 0;
    if (checkinRes.data.length > 0) {
      const dates = checkinRes.data.map(item => item.date);
      const today = new Date().toISOString().split('T')[0];
      let checkDate = new Date(today);
      
      for (let i = 0; i < 365; i++) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (dates.includes(dateStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // 知识库条目数
    const knowledgeRes = await db.collection('knowledge_bases')
      .where({ _openid: openid })
      .count();

    this.setData({
      checkinStreak: streak,
      knowledgeCount: knowledgeRes.total || 0
    });
  },

  async loadRecommend() {
    // 获取案例分享作为推荐
    const res = await db.collection('cases')
      .orderBy('createTime', 'desc')
      .limit(3)
      .get();
    
    this.setData({
      todayRecommend: res.data.map(item => ({
        id: item._id,
        title: item.title,
        desc: item.content.substring(0, 50),
        tag: item.tag || '学习'
      }))
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
  },

  goToKnowledge() {
    wx.switchTab({ url: '/pages/knowledge/knowledge' });
  },

  goToCheckin() {
    wx.switchTab({ url: '/pages/checkin/checkin' });
  },

  goToCases() {
    wx.switchTab({ url: '/pages/cases/cases' });
  },

  goToAIPractice() {
    wx.navigateTo({ url: '/pages/practice/practice' });
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/case-detail/case-detail?id=${id}` });
  }
});
