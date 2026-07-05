// pages/mine/mine.js
const db = wx.cloud.database();

Page({
  data: {
    userInfo: {},
    checkinStreak: 0,
    knowledgeCount: 0,
    practiceCount: 0,
    isAdmin: false
  },

  onLoad() {
    this.getUserInfo();
  },

  onShow() {
    this.getUserInfo();
    this.loadStats();
  },

  getUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ userInfo });
    }
  },

  getUserProfile() {
    if (this.data.userInfo.nickName) return;
    
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        this.setData({ userInfo: res.userInfo });
        wx.setStorageSync('userInfo', res.userInfo);
      }
    });
  },

  async loadStats() {
    const openid = await this.getOpenId();
    
    // 打卡连续天数
    const checkinRes = await db.collection('checkins')
      .where({ _openid: openid })
      .orderBy('date', 'desc')
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

    // 练习题目数
    const practiceRes = await db.collection('questions')
      .where({ _openid: openid })
      .count();

    this.setData({
      checkinStreak: streak,
      knowledgeCount: knowledgeRes.total || 0,
      practiceCount: practiceRes.total || 0
    });
  },

  goToCheckin() {
    wx.switchTab({ url: '/pages/checkin/checkin' });
  },

  goToKnowledge() {
    wx.switchTab({ url: '/pages/knowledge/knowledge' });
  },

  goToPractice() {
    wx.navigateTo({ url: '/pages/practice/practice' });
  },

  goToOrders() {
    wx.navigateTo({ url: '/pages/orders/orders' });
  },

  goToCourses() {
    wx.navigateTo({ url: '/pages/my-courses/my-courses' });
  },

  goToRewards() {
    wx.navigateTo({ url: '/pages/my-rewards/my-rewards' });
  },

  goToAdmin() {
    wx.navigateTo({ url: '/pages/admin/admin' });
  },

  showAbout() {
    wx.showModal({
      title: '关于邓柯学习',
      content: '版本 1.0.0\n打造高效的学习打卡与知识管理平台',
      showCancel: false
    });
  },

  contactService() {
    wx.makePhoneCall({
      phoneNumber: '400-000-0000',
      fail: () => {}
    });
  },

  shareApp() {
    // 触发分享
  },

  onShareAppMessage() {
    return {
      title: '邓柯学习 - 高效学习打卡平台',
      path: '/pages/index/index'
    };
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
