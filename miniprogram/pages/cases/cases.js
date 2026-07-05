// pages/cases/cases.js
const db = wx.cloud.database();

Page({
  data: {
    caseList: [],
    currentTab: 'latest',
    showModal: false,
    form: {
      title: '',
      content: '',
      tag: ''
    }
  },

  onLoad() {
    this.loadCases();
  },

  onShow() {
    this.loadCases();
  },

  async loadCases() {
    wx.showLoading({ title: '加载中...' });
    
    let query = db.collection('cases');
    
    if (this.data.currentTab === 'mine') {
      const openid = await this.getOpenId();
      query = query.where({ _openid: openid });
    }
    
    if (this.data.currentTab === 'hot') {
      query = query.orderBy('likeCount', 'desc');
    } else {
      query = query.orderBy('createTime', 'desc');
    }

    const res = await query.limit(20).get();
    
    this.setData({
      caseList: res.data.map(item => ({
        ...item,
        timeStr: this.formatTime(item.createTime)
      }))
    });
    
    wx.hideLoading();
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
    this.loadCases();
  },

  showAddModal() {
    this.setData({ showModal: true, form: { title: '', content: '', tag: '' } });
  },

  hideModal() {
    this.setData({ showModal: false });
  },

  stopPropagation() {},

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  async submitCase() {
    const { form } = this.data;
    
    if (!form.title || !form.content) {
      wx.showToast({ title: '请填写完整', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '发布中...' });
    
    const userInfo = wx.getStorageSync('userInfo') || {};

    await db.collection('cases').add({
      data: {
        title: form.title,
        content: form.content,
        tag: form.tag || '学习',
        nickName: userInfo.nickName || '匿名用户',
        avatar: userInfo.avatarUrl || '',
        likeCount: 0,
        commentCount: 0,
        createTime: new Date()
      }
    });

    wx.hideLoading();
    wx.showToast({ title: '发布成功' });
    this.setData({ showModal: false });
    this.loadCases();
  },

  async doLike(e) {
    const id = e.currentTarget.dataset.id;
    await db.collection('cases').doc(id).update({
      data: { likeCount: db.command.inc(1) }
    });
    this.loadCases();
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/case-detail/case-detail?id=${id}` });
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

  formatTime(date) {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  }
});
