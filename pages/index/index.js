Page({
  data: {
    isLoading: true,
    isSubscribed: false,
    city: '',
    currentWeather: {
      temp: 0,
      description: '',
      humidity: 0
    },
    forecast3Days: [],
    isFeedSuitable: false,
    feedAdvice: '',
    todayRecords: [],
    showCityModal: false,
    searchCityText: '',
    cities: [
      { name: '北京', pinyin: 'Beijing' },
      { name: '上海', pinyin: 'Shanghai' },
      { name: '广州', pinyin: 'Guangzhou' },
      { name: '深圳', pinyin: 'Shenzhen' },
      { name: '成都', pinyin: 'Chengdu' },
      { name: '杭州', pinyin: 'Hangzhou' },
      { name: '重庆', pinyin: 'Chongqing' },
      { name: '武汉', pinyin: 'Wuhan' },
      { name: '西安', pinyin: "Xi'an" },
      { name: '苏州', pinyin: 'Suzhou' },
      { name: '天津', pinyin: 'Tianjin' },
      { name: '南京', pinyin: 'Nanjing' },
      { name: '长沙', pinyin: 'Changsha' },
      { name: '郑州', pinyin: 'Zhengzhou' },
      { name: '东莞', pinyin: 'Dongguan' },
      { name: '青岛', pinyin: 'Qingdao' },
      { name: '沈阳', pinyin: 'Shenyang' },
      { name: '宁波', pinyin: 'Ningbo' },
      { name: '昆明', pinyin: 'Kunming' },
      { name: '大连', pinyin: 'Dalian' },
      { name: '厦门', pinyin: 'Xiamen' },
      { name: '合肥', pinyin: 'Hefei' },
      { name: '佛山', pinyin: 'Foshan' },
      { name: '福州', pinyin: 'Fuzhou' },
      { name: '无锡', pinyin: 'Wuxi' },
      { name: '济南', pinyin: 'Jinan' },
      { name: '温州', pinyin: 'Wenzhou' },
      { name: '长春', pinyin: 'Changchun' },
      { name: '哈尔滨', pinyin: 'Harbin' },
      { name: '石家庄', pinyin: 'Shijiazhuang' },
      { name: '南宁', pinyin: 'Nanning' },
      { name: '泉州', pinyin: 'Quanzhou' },
      { name: '烟台', pinyin: 'Yantai' },
      { name: '南昌', pinyin: 'Nanchang' },
      { name: '贵阳', pinyin: 'Guiyang' },
      { name: '太原', pinyin: 'Taiyuan' },
      { name: '常州', pinyin: 'Changzhou' },
      { name: '惠州', pinyin: 'Huizhou' },
      { name: '嘉兴', pinyin: 'Jiaxing' },
      { name: '金华', pinyin: 'Jinhua' },
      { name: '徐州', pinyin: 'Xuzhou' },
      { name: '南通', pinyin: 'Nantong' },
      { name: '扬州', pinyin: 'Yangzhou' },
      { name: '盐城', pinyin: 'Yancheng' },
      { name: '淮安', pinyin: 'Huaian' },
      { name: '泰州', pinyin: 'Taizhou' },
      { name: '镇江', pinyin: 'Zhenjiang' },
      { name: '台州', pinyin: 'Taizhou' },
      { name: '绍兴', pinyin: 'Shaoxing' },
      { name: '湖州', pinyin: 'Huzhou' }
    ],
    filteredCities: []
  },

  onLoad: function() {
    this.loadCity();
    this.loadTodayRecords();
    this.loadSubscriptionStatus();
    this.getWeather();
  },

  onShow: function() {
    // 每次页面显示时刷新今日记录
    this.loadTodayRecords();
  },

  // 加载订阅状态
  loadSubscriptionStatus: function() {
    const subscribed = wx.getStorageSync('feed_notification_subscribed') || false;
    this.setData({ isSubscribed: subscribed });
  },

  // 订阅通知
  subscribeNotification: function() {
    const templateId = 'YOUR_TEMPLATE_ID'; // 替换为你的订阅模板ID
    wx.requestSubscribeMessage({
      tmplIds: [templateId],
      success: (res) => {
        if (res[templateId] === 'accept') {
          wx.setStorageSync('feed_notification_subscribed', true);
          this.setData({ isSubscribed: true });
          wx.showToast({
            title: '订阅成功',
            icon: 'success',
            duration: 1500
          });
        } else if (res[templateId] === 'reject') {
          wx.showToast({
            title: '已拒绝订阅',
            icon: 'none',
            duration: 1500
          });
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '订阅失败',
          icon: 'none',
          duration: 1500
        });
        console.error('订阅消息失败:', err);
      }
    });
  },

  loadCity: function() {
    const setting = wx.getStorageSync('app_setting');
    this.setData({
      city: setting.city,
      filteredCities: this.data.cities
    });
  },

  loadTodayRecords: function() {
    const records = wx.getStorageSync('feed_records') || [];
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = records.filter(record => {
      return record.feedTime.startsWith(today);
    });
    this.setData({
      todayRecords: todayRecords
    });
  },

  refreshWeather: function() {
    // 清除缓存，强制刷新
    const cache = wx.getStorageSync('weather_cache') || {};
    const city = this.data.city;
    if (cache[city]) {
      delete cache[city];
      wx.setStorageSync('weather_cache', cache);
    }
    this.getWeather();
  },

  showCityPicker: function() {
    this.setData({
      showCityModal: true,
      searchCityText: '',
      filteredCities: this.data.cities
    });
  },

  closeCityModal: function() {
    this.setData({
      showCityModal: false
    });
  },

  searchCity: function(e) {
    const searchText = e.detail.value;
    const cities = this.data.cities;
    let filteredCities = cities;

    if (searchText) {
      filteredCities = cities.filter(city => 
        city.name.includes(searchText) || city.pinyin.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    this.setData({
      searchCityText: searchText,
      filteredCities: filteredCities
    });
  },

  selectCity: function(e) {
    const selectedCity = e.currentTarget.dataset.city;
    const setting = wx.getStorageSync('app_setting');
    setting.city = selectedCity.name;
    setting.cityPinyin = selectedCity.pinyin;
    wx.setStorageSync('app_setting', setting);

    // 清除旧城市的缓存
    const cache = wx.getStorageSync('weather_cache') || {};
    if (cache[setting.city]) {
      delete cache[setting.city];
      wx.setStorageSync('weather_cache', cache);
    }

    this.setData({
      city: selectedCity.name,
      showCityModal: false
    });

    wx.showToast({
      title: '已切换到' + selectedCity.name,
      icon: 'success',
      duration: 1500
    });

    this.getWeather();
  },

  getWeather: function() {
    const city = this.data.city;
    const setting = wx.getStorageSync('app_setting');
    const cityPinyin = setting.cityPinyin || 'Beijing';
    const cache = wx.getStorageSync('weather_cache') || {};
    const now = new Date().getTime();

    // 使用拼音作为缓存key
    if (cache[cityPinyin] && (now - cache[cityPinyin].timestamp < 2 * 60 * 60 * 1000)) {
      this.processWeatherData(cache[cityPinyin].data);
      return;
    }

    this.setData({ isLoading: true });

    // 检查每日API调用次数限制
    if (!this.checkAPILimit()) {
      this.setData({ isLoading: true });
      wx.showToast({
        title: '今日API额度已用完，使用缓存数据',
        icon: 'none',
        duration: 2000
      });
      if (cache[cityPinyin]) {
        this.processWeatherData(cache[cityPinyin].data);
      } else {
        this.useMockWeatherData(city, now);
      }
      return;
    }

    // 获取当前天气
    this.getWeatherNow(cityPinyin, (nowData) => {
      // 获取天气预报
      this.getWeatherForecast(cityPinyin, (forecastData) => {
        const weatherData = {
          current: nowData,
          forecast: forecastData
        };

        // 使用拼音作为缓存key
        cache[cityPinyin] = {
          data: weatherData,
          timestamp: now
        };
        wx.setStorageSync('weather_cache', cache);

        // 增加API调用计数
        this.incrementAPICount();

        this.processWeatherData(weatherData);
      });
    });
  },

  // 获取天气数据（wttr.in API）
  getWeatherNow: function(cityPinyin, callback) {
    const app = getApp();
    wx.request({
      url: app.globalData.weatherAPI + cityPinyin + '?format=j1&lang=zh',
      success: (res) => {
        if (res.data && res.data.current_condition && res.data.current_condition[0]) {
          const current = res.data.current_condition[0];
          let description = '';
          // 从 lang_zh 字段获取天气描述
          if (current.lang_zh && current.lang_zh[0] && current.lang_zh[0].value) {
            description = current.lang_zh[0].value;
          }
          callback({
            temp: parseInt(current.temp_C),
            description: description,
            humidity: parseInt(current.humidity)
          });
        } else {
          callback({ temp: 0, description: '获取失败', humidity: 0 });
        }
      },
      fail: () => {
        callback({ temp: 0, description: '网络错误', humidity: 0 });
      }
    });
  },

  getWeatherForecast: function(cityPinyin, callback) {
    const app = getApp();
    wx.request({
      url: app.globalData.weatherAPI + cityPinyin + '?format=j1&lang=zh',
      success: (res) => {
        if (res.data && res.data.weather) {
          const dates = ['今天', '明天', '后天', '第4天', '第5天', '第6天', '第7天'];
          const forecast = res.data.weather.slice(0, 7).map((day, index) => {
            const maxTemp = Math.max(...day.hourly.map(h => parseInt(h.tempC)));
            const minTemp = Math.min(...day.hourly.map(h => parseInt(h.tempC)));
            let description = '';
            // 从 lang_zh 字段获取天气描述
            if (day.hourly[4] && day.hourly[4].lang_zh && day.hourly[4].lang_zh[0] && day.hourly[4].lang_zh[0].value) {
              description = day.hourly[4].lang_zh[0].value;
            }
            return {
              date: dates[index],
              tempMin: minTemp,
              tempMax: maxTemp,
              description: description
            };
          });
          callback(forecast);
        }
      },
      fail: () => {
        callback([
          { date: '今天', tempMin: 20, tempMax: 28, description: '晴' },
          { date: '明天', tempMin: 21, tempMax: 29, description: '多云' },
          { date: '后天', tempMin: 22, tempMax: 30, description: '晴' },
          { date: '第4天', tempMin: 23, tempMax: 31, description: '晴' },
          { date: '第5天', tempMin: 22, tempMax: 30, description: '多云' },
          { date: '第6天', tempMin: 21, tempMax: 29, description: '阴' },
          { date: '第7天', tempMin: 20, tempMax: 28, description: '晴' }
        ]);
      }
    });
  },

  getWeatherDescription: function(code) {
    const weatherCodes = {
      '116': '多云', '119': '阴天', '122': '阴天',
      '113': '晴', '143': '雾',
      '176': '阵雨', '179': '小雪', '182': '小雪',
      '185': '冻雨', '200': '雷阵雨',
      '227': '小雪', '230': '大雪',
      '248': '雾', '260': '雾',
      '263': '小雨', '266': '小雨', '275': '雨夹雪',
      '281': '雨夹雪', '284': '雨夹雪',
      '293': '小雨', '296': '小雨', '299': '中雨',
      '302': '中雨', '305': '中雨', '308': '大雨',
      '311': '雨夹雪', '314': '雨夹雪', '317': '雨夹雪',
      '320': '冻雨', '323': '小雪', '326': '小雪',
      '329': '大雪', '332': '大雪', '335': '大雪',
      '338': '大雪', '350': '冰雹', '353': '阵雨',
      '356': '中雨', '359': '中雨', '362': '小雨',
      '365': '小雨', '368': '小雪', '371': '小雪',
      '374': '冰雹', '377': '冰雹', '386': '雷阵雨',
      '389': '雷阵雨', '392': '阵雨', '395': '大雪'
    };
    return weatherCodes[code] || '未知';
  },

  // 使用模拟天气数据
  useMockWeatherData: function(city, now) {
    this.setData({ isLoading: true });
    const mockWeather = {
      current: {
        temp: 26,
        description: '晴',
        humidity: 65
      },
      forecast: [
        { date: '今天', tempMin: 20, tempMax: 28, description: '晴' },
        { date: '明天', tempMin: 21, tempMax: 29, description: '多云' },
        { date: '后天', tempMin: 22, tempMax: 30, description: '晴' }
      ]
    };

    const cache = wx.getStorageSync('weather_cache') || {};
    const setting = wx.getStorageSync('app_setting');
    const cityPinyin = setting.cityPinyin || 'Beijing';
    cache[cityPinyin] = {
      data: mockWeather,
      timestamp: now
    };
    wx.setStorageSync('weather_cache', cache);

    this.processWeatherData(mockWeather);
  },

  // 检查每日API调用限制
  checkAPILimit: function() {
    const app = getApp();
    const usage = wx.getStorageSync('api_usage') || { date: '', count: 0 };
    const today = new Date().toISOString().split('T')[0];

    // 如果是新的一天，重置计数
    if (usage.date !== today) {
      wx.setStorageSync('api_usage', { date: today, count: 0 });
      return true;
    }

    // 检查是否超过限制
    return usage.count < app.globalData.dailyAPILimit;
  },

  // 增加API调用计数
  incrementAPICount: function() {
    const usage = wx.getStorageSync('api_usage') || { date: '', count: 0 };
    const today = new Date().toISOString().split('T')[0];

    if (usage.date !== today) {
      usage.date = today;
      usage.count = 0;
    }

    usage.count += 1;
    wx.setStorageSync('api_usage', usage);
  },

  processWeatherData: function(data) {
    this.setData({
      isLoading: false,
      currentWeather: data.current,
      forecast3Days: data.forecast
    });
    this.checkFeedSuitable(data.forecast);
  },

  checkFeedSuitable: function(forecast) {
    let isSuitable = true;
    let advice = '';

    // 获取未来7天数据用于降温判断
    const cache = wx.getStorageSync('weather_cache') || {};
    const setting = wx.getStorageSync('app_setting');
    const cityPinyin = setting.cityPinyin || 'Beijing';
    const cachedData = cache[cityPinyin]?.data;
    
    // 检查未来7天降温趋势（前3天平均 vs 后4天平均）
    if (cachedData && cachedData.forecast && cachedData.forecast.length >= 7) {
      const first3Avg = cachedData.forecast.slice(0, 3).reduce((sum, day) => sum + day.tempMax, 0) / 3;
      const last4Avg = cachedData.forecast.slice(3, 7).reduce((sum, day) => sum + day.tempMax, 0) / 4;
      if (last4Avg < first3Avg - 5) {
        isSuitable = false;
        advice = '未来降温明显，不建议喂龟';
        this.setData({ isFeedSuitable: isSuitable, feedAdvice: advice });
        return;
      }
    }

    // 获取未来3天预报数据
    const temps = forecast.map(day => day.tempMax);
    const tempsMin = forecast.map(day => day.tempMin);
    const avgTemp = temps.reduce((sum, temp) => sum + temp, 0) / temps.length;

    // 条件1：最低温 < 15℃，不适合喂龟
    if (tempsMin.some(temp => temp < 15)) {
      isSuitable = false;
      advice = '最低温度过低，不建议喂龟';
    }

    // 条件2：温度波动 > 10℃，不适合喂龟
    if (!advice) {
      for (let i = 0; i < temps.length - 1; i++) {
        if (Math.abs(temps[i] - temps[i + 1]) > 10) {
          isSuitable = false;
          advice = '温度波动过大，不建议喂龟';
          break;
        }
      }
    }

    // 条件3：未来3天有雨/雪，不适合喂龟
    if (!advice && cachedData && cachedData.forecast) {
      const willRain = cachedData.forecast.slice(0, 3).some(day => {
        const desc = day.description || '';
        return desc.includes('雨') || desc.includes('雪');
      });
      if (willRain) {
        isSuitable = false;
        advice = '未来有降雨/降雪天气，不建议喂龟';
      }
    }

    // 条件4：平均温度合适才适合喂龟
    if (!advice) {
      if (avgTemp >= 22 && avgTemp <= 32) {
        isSuitable = true;
        advice = '温度适宜，可以正常喂龟';
      } else if (avgTemp > 32) {
        isSuitable = false;
        advice = '温度过高，不建议喂龟';
      } else {
        isSuitable = false;
        advice = '温度偏低，不建议喂龟';
      }
    }

    this.setData({
      isFeedSuitable: isSuitable,
      feedAdvice: advice
    });
  }
})