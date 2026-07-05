// pages/checkin/checkin.js
const db = wx.cloud.database();

Page({
  data: {
    streak: 0,
    totalCheckins: 0,
    maxStreak: 0,
    todayChecked: false,
    practiceCount: 0,
    currentYear: 0,
    currentMonth: 0,
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    calendarDays: []
  },

  onLoad() {
    const now = new Date();
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1
    });
    this.loadCheckinData();
  },

  onShow() {
    this.loadCheckinData();
  },

  async loadCheckinData() {
    const openid = await this.getOpenId();
    
    // 获取所有打卡记录
    const res = await db.collection('checkins')
      .where({ _openid: openid })
      .orderBy('date', 'desc')
      .get();
    
    const checkinDates = res.data.map(item => item.date);
    const today = new Date().toISOString().split('T')[0];
    
    // 计算连续打卡
    let streak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    const totalCheckins = checkinDates.length;

    // 计算当前连续打卡
    let checkDate = new Date(today);
    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (checkinDates.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    this.setData({
      streak,
      totalCheckins,
      maxStreak: streak, // 简化，实际应计算历史最大
      todayChecked: checkinDates.includes(today)
    });

    this.generateCalendar(checkinDates);
    this.loadPracticeCount(openid);
  },

  generateCalendar(checkinDates) {
    const { currentYear, currentMonth } = this.data;
    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const today = new Date().toISOString().split('T')[0];

    let days = [];

    // 填充空白
    for (let i = 0; i < firstDay; i++) {
      days.push({ isEmpty: true });
    }

    // 填充日期
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        day: i,
        date: dateStr,
        isToday: dateStr === today,
        checked: checkinDates.includes(dateStr)
      });
    }

    this.setData({ calendarDays: days });
  },

  prevMonth() {
    let { currentYear, currentMonth } = this.data;
    if (currentMonth === 1) {
      currentYear--;
      currentMonth = 12;
    } else {
      currentMonth--;
    }
    this.setData({ currentYear, currentMonth });
    this.loadCheckinData();
  },

  nextMonth() {
    let { currentYear, currentMonth } = this.data;
    if (currentMonth === 12) {
      currentYear++;
      currentMonth = 1;
    } else {
      currentMonth++;
    }
    this.setData({ currentYear, currentMonth });
    this.loadCheckinData();
  },

  async doCheckin() {
    wx.showLoading({ title: '打卡中...' });
    const openid = await this.getOpenId();
    const today = new Date().toISOString().split('T')[0];

    // 检查是否已打卡
    const existRes = await db.collection('checkins')
      .where({ _openid: openid, date: today })
      .get();

    if (existRes.data.length > 0) {
      wx.hideLoading();
      wx.showToast({ title: '今日已打卡', icon: 'none' });
      return;
    }

    await db.collection('checkins').add({
      data: {
        date: today,
        createTime: new Date()
      }
    });

    wx.hideLoading();
    wx.showToast({ title: '打卡成功！' });
    this.loadCheckinData();
  },

  async loadPracticeCount(openid) {
    const res = await db.collection('questions')
      .where({ _openid: openid })
      .count();
    this.setData({ practiceCount: res.total || 0 });
  },

  goToPractice() {
    wx.navigateTo({ url: '/pages/practice/practice' });
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
