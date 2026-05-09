App({
  onLaunch: function() {
    // 初始化本地存储数据
    this.initStorage();
  },
  
  initStorage: function() {
    // 初始化龟只列表
    if (!wx.getStorageSync('turtle_list')) {
      wx.setStorageSync('turtle_list', []);
    }
    
    // 初始化喂食记录
    if (!wx.getStorageSync('feed_records')) {
      wx.setStorageSync('feed_records', []);
    }
    
    // 初始化天气缓存
    if (!wx.getStorageSync('weather_cache')) {
      wx.setStorageSync('weather_cache', {});
    }
    
    // 初始化用户设置
    if (!wx.getStorageSync('app_setting')) {
      wx.setStorageSync('app_setting', {
        city: '北京',
        cityPinyin: 'Beijing',
        temperatureReminder: true
      });
    }
  },
  
  globalData: {
    // 和风天气 API
    weatherAPIHost: 'https://nt3jphcucn.re.qweatherapi.com',
    weatherAPIKey: '0735382310604f91b6dc2843309db011',
    // API每日调用限制
    dailyAPILimit: 800
  }
})