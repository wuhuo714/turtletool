Page({
  data: {
    city: '',
    currentWeather: {
      temp: 0,
      description: '',
      humidity: 0,
      feelsLike: 0,
      windSpeed: 0,
      windDir: '',
      pressure: 0,
      visibility: 0,
      uvIndex: 0,
      cloudcover: 0
    },
    currentDate: '',
    forecast3Days: [],
    hourlyForecast: [],
    isFeedSuitable: true,
    feedAdvice: '温度适宜，适合喂龟',
    isLoading: false
  },

  onLoad: function() {
    this.loadCity();
    this.setCurrentDate();
    this.getWeather();
  },

  // 每次页面显示时检查城市是否变化
  onShow: function() {
    const setting = wx.getStorageSync('app_setting');
    const currentCity = setting.city;
    
    // 如果城市发生变化，重新加载天气数据
    if (this.data.city !== currentCity) {
      this.setData({ city: currentCity });
      this.getWeather();
    }
  },

  loadCity: function() {
    const setting = wx.getStorageSync('app_setting');
    this.setData({
      city: setting.city
    });
  },

  setCurrentDate: function() {
    const date = new Date();
    const currentDate = date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
    this.setData({
      currentDate: currentDate
    });
  },

  getWeather: function() {
    const city = this.data.city;
    const setting = wx.getStorageSync('app_setting');
    const cityPinyin = setting.cityPinyin || 'Beijing';
    const cache = wx.getStorageSync('weather_cache') || {};
    const now = new Date().getTime();
    const cacheKey = cityPinyin + '_detail';

    // 显示加载状态
    this.setData({ isLoading: true });

    // 先尝试使用详情页缓存
    if (cache[cacheKey] && (now - cache[cacheKey].timestamp < 2 * 60 * 60 * 1000)) {
      this.setData({ isLoading: false });
      this.processWeatherData(cache[cacheKey].data);
      return;
    }

    // 检查每日API调用次数限制
    if (!this.checkAPILimit()) {
      wx.showToast({
        title: '今日API额度已用完',
        icon: 'none',
        duration: 2000
      });
      this.setData({ isLoading: false });
      // 尝试使用首页缓存的数据
      if (cache[cityPinyin]) {
        this.useHomeCacheData(cache[cityPinyin].data);
      } else {
        this.useMockWeatherData(city);
      }
      return;
    }

    // 获取当前天气和3天预报
    this.getWeatherData(cityPinyin, (weatherData) => {
      // 缓存数据
      cache[cacheKey] = {
        data: weatherData,
        timestamp: now
      };
      wx.setStorageSync('weather_cache', cache);

      // 增加API调用计数
      this.incrementAPICount();

      this.processWeatherData(weatherData);
    });
  },

  // 统一获取天气数据
  getWeatherData: function(cityPinyin, callback) {
    const app = getApp();
    wx.request({
      url: app.globalData.weatherAPI + cityPinyin + '?format=j1&lang=zh',
      success: (res) => {
        if (res.data && res.data.current_condition && res.data.current_condition[0] && res.data.weather) {
          const current = res.data.current_condition[0];
          let currentDesc = '';
          if (current.lang_zh && current.lang_zh[0] && current.lang_zh[0].value) {
            currentDesc = current.lang_zh[0].value;
          }

          // 当前天气详细信息
          const currentData = {
            temp: parseInt(current.temp_C),
            description: currentDesc,
            humidity: parseInt(current.humidity),
            feelsLike: parseInt(current.FeelsLikeC) || parseInt(current.temp_C),
            windSpeed: parseInt(current.windspeedKmph) || 0,
            windDir: current.winddir16Point || '',
            pressure: parseInt(current.pressure) || 0,
            visibility: parseInt(current.visibility) || 0,
            uvIndex: current.uvIndex || '0',
            cloudcover: parseInt(current.cloudcover) || 0
          };

          // 获取3天预报
          const dates = ['今天', '明天', '后天'];
          const forecast3Days = res.data.weather.slice(0, 3).map((day, index) => {
            const maxTemp = Math.max(...day.hourly.map(h => parseInt(h.tempC)));
            const minTemp = Math.min(...day.hourly.map(h => parseInt(h.tempC)));
            let desc = '';
            if (day.hourly[4] && day.hourly[4].lang_zh && day.hourly[4].lang_zh[0] && day.hourly[4].lang_zh[0].value) {
              desc = day.hourly[4].lang_zh[0].value;
            }
            return {
              date: dates[index],
              tempMin: minTemp,
              tempMax: maxTemp,
              description: desc
            };
          });

          // 获取今日逐时预报（8个时间点，每3小时）
          const todayWeather = res.data.weather[0];
          const hourlyForecast = todayWeather.hourly.map(hour => {
            let desc = '';
            if (hour.lang_zh && hour.lang_zh[0] && hour.lang_zh[0].value) {
              desc = hour.lang_zh[0].value;
            }
            // 将时间格式转换为可读形式
            const timeNum = parseInt(hour.time);
            const hourStr = timeNum === 0 ? '00:00' : 
                           timeNum === 300 ? '03:00' :
                           timeNum === 600 ? '06:00' :
                           timeNum === 900 ? '09:00' :
                           timeNum === 1200 ? '12:00' :
                           timeNum === 1500 ? '15:00' :
                           timeNum === 1800 ? '18:00' : '21:00';
            return {
              time: hourStr,
              temp: parseInt(hour.tempC),
              description: desc,
              rainChance: hour.chanceofrain || 0
            };
          });

          callback({
            current: currentData,
            forecast3Days: forecast3Days,
            hourlyForecast: hourlyForecast
          });
        } else {
          // API返回数据不完整，使用模拟数据
          this.useMockWeatherData(this.data.city, callback);
        }
      },
      fail: () => {
        // 请求失败，尝试使用首页缓存或模拟数据
        const cache = wx.getStorageSync('weather_cache') || {};
        const setting = wx.getStorageSync('app_setting');
        const cityPinyin = setting.cityPinyin || 'Beijing';
        
        if (cache[cityPinyin]) {
          this.useHomeCacheData(cache[cityPinyin].data, callback);
        } else {
          this.useMockWeatherData(this.data.city, callback);
        }
      }
    });
  },

  // 使用首页缓存数据
  useHomeCacheData: function(homeData, callback) {
    const dates = ['今天', '明天', '后天'];
    const defaultForecast = [
      { date: '今天', tempMin: 20, tempMax: 28, description: '晴' },
      { date: '明天', tempMin: 21, tempMax: 29, description: '多云' },
      { date: '后天', tempMin: 22, tempMax: 30, description: '晴' }
    ];
    
    // 合并数据
    let forecast3Days = homeData.forecast ? homeData.forecast.slice(0, 3) : [];
    for (let i = 0; i < 3; i++) {
      if (!forecast3Days[i]) {
        forecast3Days[i] = defaultForecast[i];
      }
    }
    
    const mockData = {
      current: homeData.current || { 
        temp: 26, 
        description: '晴', 
        humidity: 65,
        feelsLike: 26,
        windSpeed: 10,
        windDir: 'SE',
        pressure: 1013,
        visibility: 10,
        uvIndex: '3',
        cloudcover: 20
      },
      forecast3Days: forecast3Days,
      hourlyForecast: [
        { time: '00:00', temp: 20, description: '晴', rainChance: 0 },
        { time: '03:00', temp: 19, description: '晴', rainChance: 0 },
        { time: '06:00', temp: 20, description: '晴', rainChance: 0 },
        { time: '09:00', temp: 24, description: '晴', rainChance: 0 },
        { time: '12:00', temp: 28, description: '晴', rainChance: 0 },
        { time: '15:00', temp: 28, description: '多云', rainChance: 10 },
        { time: '18:00', temp: 26, description: '多云', rainChance: 5 },
        { time: '21:00', temp: 23, description: '晴', rainChance: 0 }
      ]
    };
    
    this.setData({ isLoading: false });
    if (typeof callback === 'function') {
      callback(mockData);
    } else {
      this.processWeatherData(mockData);
    }
  },

  // 使用模拟天气数据
  useMockWeatherData: function(city, callback) {
    const mockData = {
      current: {
        temp: 26,
        description: '晴',
        humidity: 65,
        feelsLike: 26,
        windSpeed: 10,
        windDir: 'SE',
        pressure: 1013,
        visibility: 10,
        uvIndex: '3',
        cloudcover: 20
      },
      forecast3Days: [
        { date: '今天', tempMin: 20, tempMax: 28, description: '晴' },
        { date: '明天', tempMin: 21, tempMax: 29, description: '多云' },
        { date: '后天', tempMin: 22, tempMax: 30, description: '晴' }
      ],
      hourlyForecast: [
        { time: '00:00', temp: 20, description: '晴', rainChance: 0 },
        { time: '03:00', temp: 19, description: '晴', rainChance: 0 },
        { time: '06:00', temp: 20, description: '晴', rainChance: 0 },
        { time: '09:00', temp: 24, description: '晴', rainChance: 0 },
        { time: '12:00', temp: 28, description: '晴', rainChance: 0 },
        { time: '15:00', temp: 28, description: '多云', rainChance: 10 },
        { time: '18:00', temp: 26, description: '多云', rainChance: 5 },
        { time: '21:00', temp: 23, description: '晴', rainChance: 0 }
      ]
    };

    this.setData({ isLoading: false });
    if (typeof callback === 'function') {
      callback(mockData);
    } else {
      this.processWeatherData(mockData);
    }
  },

  // 检查每日API调用限制
  checkAPILimit: function() {
    const app = getApp();
    const usage = wx.getStorageSync('api_usage') || { date: '', count: 0 };
    const today = new Date().toISOString().split('T')[0];
    
    if (usage.date !== today) {
      usage.date = today;
      usage.count = 0;
    }
    
    if (usage.count >= app.globalData.dailyAPILimit) {
      return false;
    }
    
    return true;
  },

  // 增加API调用计数
  incrementAPICount: function() {
    const usage = wx.getStorageSync('api_usage') || { date: '', count: 0 };
    const today = new Date().toISOString().split('T')[0];
    
    if (usage.date !== today) {
      usage.date = today;
      usage.count = 1;
    } else {
      usage.count++;
    }
    
    wx.setStorageSync('api_usage', usage);
  },

  processWeatherData: function(data) {
    // 确保数据存在
    if (!data || !data.current || !data.forecast3Days) {
      this.useMockWeatherData(this.data.city);
      return;
    }

    this.setData({
      isLoading: false,
      currentWeather: data.current,
      forecast3Days: data.forecast3Days,
      hourlyForecast: data.hourlyForecast || []
    });

    // 执行喂食适宜性判断
    this.checkFeedSuitable(data.forecast3Days);
  },

  // 检查是否适合喂龟
  checkFeedSuitable: function(forecast) {
    let isSuitable = true;
    let advice = '';

    if (!forecast || forecast.length === 0) {
      this.setData({ isFeedSuitable: true, feedAdvice: '温度适宜，适合喂龟' });
      return;
    }

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

    // 条件3：未来有雨/雪，不适合喂龟
    if (!advice) {
      const willRain = forecast.some(day => {
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
