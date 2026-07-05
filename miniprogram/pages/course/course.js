// pages/course/course.js
const db = wx.cloud.database();

Page({
  data: {
    courseList: []
  },

  onLoad() {
    this.loadCourses();
  },

  async loadCourses() {
    wx.showLoading({ title: '加载中...' });
    
    const res = await db.collection('courses')
      .where({ status: 'published' })
      .orderBy('createTime', 'desc')
      .get();
    
    this.setData({ courseList: res.data });
    wx.hideLoading();
  },

  async buyCourse(e) {
    const { id, price } = e.currentTarget.dataset;
    
    wx.showLoading({ title: '创建订单...' });
    
    wx.cloud.callFunction({
      name: 'wxpay',
      data: {
        type: 'course',
        amount: price,
        description: '课程购买',
        courseId: id
      },
      success: (res) => {
        wx.hideLoading();
        if (res.result.success) {
          const payment = res.result.payment;
          wx.requestPayment({
            ...payment,
            success: () => {
              wx.showToast({ title: '支付成功' });
            },
            fail: () => {
              wx.showToast({ title: '支付取消', icon: 'none' });
            }
          });
        } else {
          wx.showToast({ title: '支付失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '支付失败', icon: 'none' });
      }
    });
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/course-detail/course-detail?id=${id}` });
  }
});
