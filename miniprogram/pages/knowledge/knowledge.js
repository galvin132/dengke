// pages/knowledge/knowledge.js
const db = wx.cloud.database();

Page({
  data: {
    knowledgeList: [],
    categories: ['全部', '编程', '数学', '英语', '职场', '其他'],
    currentTab: '全部',
    showModal: false,
    editId: '',
    form: {
      title: '',
      category: '',
      content: ''
    },
    categoryIndex: 0,
    searchKey: ''
  },

  onLoad() {
    this.loadKnowledge();
  },

  onShow() {
    this.loadKnowledge();
  },

  async loadKnowledge() {
    wx.showLoading({ title: '加载中...' });
    const openid = await this.getOpenId();
    
    let query = db.collection('knowledge_bases').where({ _openid: openid });
    
    if (this.data.currentTab !== '全部') {
      query = db.collection('knowledge_bases').where({
        _openid: openid,
        category: this.data.currentTab
      });
    }

    const res = await query.orderBy('createTime', 'desc').get();
    
    const list = res.data.map(item => ({
      ...item,
      createTimeStr: this.formatTime(item.createTime)
    }));

    this.setData({ knowledgeList: list });
    wx.hideLoading();
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
    this.loadKnowledge();
  },

  onSearch(e) {
    const key = e.detail.value;
    this.setData({ searchKey: key });
    
    if (!key) {
      this.loadKnowledge();
      return;
    }

    const filtered = this.data.knowledgeList.filter(item => 
      item.title.includes(key) || item.content.includes(key)
    );
    this.setData({ knowledgeList: filtered });
  },

  showAddModal() {
    this.setData({
      showModal: true,
      editId: '',
      form: { title: '', category: '', content: '' },
      categoryIndex: 0
    });
  },

  editItem(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.knowledgeList.find(k => k._id === id);
    if (item) {
      this.setData({
        showModal: true,
        editId: id,
        form: {
          title: item.title,
          category: item.category,
          content: item.content
        },
        categoryIndex: this.data.categories.indexOf(item.category)
      });
    }
  },

  async deleteItem(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复',
      success: async (res) => {
        if (res.confirm) {
          await db.collection('knowledge_bases').doc(id).remove();
          wx.showToast({ title: '删除成功' });
          this.loadKnowledge();
        }
      }
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onCategoryChange(e) {
    const index = e.detail.value;
    this.setData({
      categoryIndex: index,
      'form.category': this.data.categories[index]
    });
  },

  async saveKnowledge() {
    const { form, editId } = this.data;
    
    if (!form.title || !form.content) {
      wx.showToast({ title: '请填写完整', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...' });
    const openid = await this.getOpenId();

    if (editId) {
      await db.collection('knowledge_bases').doc(editId).update({
        data: {
          title: form.title,
          category: form.category,
          content: form.content,
          updateTime: new Date()
        }
      });
    } else {
      await db.collection('knowledge_bases').add({
        data: {
          title: form.title,
          category: form.category || '其他',
          content: form.content,
          createTime: new Date(),
          updateTime: new Date(),
          questionCount: 0
        }
      });
    }

    wx.hideLoading();
    wx.showToast({ title: '保存成功' });
    this.setData({ showModal: false });
    this.loadKnowledge();
  },

  hideModal() {
    this.setData({ showModal: false });
  },

  stopPropagation() {},

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/knowledge-detail/knowledge-detail?id=${id}` });
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
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
});
