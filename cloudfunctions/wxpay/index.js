// 云函数入口 - 微信支付
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { type, amount, description, courseId } = event;
  const openid = cloud.getWXContext().OPENID;

  try {
    // 创建订单
    const orderResult = await cloud.database().collection('orders').add({
      data: {
        _openid: openid,
        type, // 'course' 或 'reward'
        amount,
        description,
        courseId,
        status: 'pending',
        createTime: new Date()
      }
    });

    const orderId = orderResult._id;

    // 调用微信支付
    const res = await cloud.cloudPay.unifiedOrder({
      body: description,
      outTradeNo: orderId,
      spbillCreateIp: '127.0.0.1',
      subMchId: process.env.MCH_ID, // 需要在云开发控制台配置商户号
      totalFee: amount * 100, // 单位：分
      envId: 'dengke-d5gpdvjaa9969afd7',
      functionName: 'wxpayCallback',
      tradeType: 'JSAPI',
      openid
    });

    return { success: true, payment: res.payment };
  } catch (err) {
    console.error('创建支付失败', err);
    return { success: false, error: err.message };
  }
};
