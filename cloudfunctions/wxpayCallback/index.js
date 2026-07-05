// 云函数入口 - 微信支付回调
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { returnCode, outTradeNo } = event;

  if (returnCode === 'SUCCESS') {
    // 更新订单状态
    await cloud.database().collection('orders').doc(outTradeNo).update({
      data: {
        status: 'paid',
        payTime: new Date()
      }
    });
  }

  return { returnCode: 'SUCCESS', returnMsg: 'OK' };
};
