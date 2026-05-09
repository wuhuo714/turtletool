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
    forecast7Days: [],
    hourlyForecast: [],
    isFeedSuitable: true,
    feedAdvice: '温度适宜，适合喂龟',
    isLoading: false
  },

  // 获取未来N天的日期数组（MM-DD格式）
  getFutureDates: function(days) {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      dates.push(`${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    }
    return dates;
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
      if (cache[cityPinyin]) {
        this.useHomeCacheData(cache[cityPinyin].data);
      } else {
        this.useMockWeatherData(city);
      }
      return;
    }

    // 先获取location ID，再获取天气数据
    this.getLocationId(city, (locationId) => {
      if (locationId) {
        this.getWeatherData(locationId, (weatherData) => {
          cache[cacheKey] = {
            data: weatherData,
            timestamp: now
          };
          wx.setStorageSync('weather_cache', cache);
          this.incrementAPICount();
          this.incrementAPICount();
          this.processWeatherData(weatherData);
        });
      } else {
        this.setData({ isLoading: false });
        this.useMockWeatherData(city);
      }
    });
  },

  // 获取location ID（和风天气）
  getLocationId: function(cityName, callback) {
    const app = getApp();
    const apiHost = app.globalData.weatherAPIHost;
    wx.request({
      url: `${apiHost}/geo/v2/city/lookup?location=${encodeURIComponent(cityName)}&key=${app.globalData.weatherAPIKey}`,
      success: (res) => {
        if (res.data && res.data.code === '200' && res.data.location && res.data.location.length > 0) {
          callback(res.data.location[0].id);
        } else {
          callback(null);
        }
      },
      fail: () => {
        callback(null);
      }
    });
  },

  // 获取天气数据（和风天气 API v7）
  getWeatherData: function(locationId, callback) {
    const app = getApp();
    const apiHost = app.globalData.weatherAPIHost;
    const apiKey = app.globalData.weatherAPIKey;

    // 同时请求实时天气
    wx.request({
      url: `${apiHost}/v7/weather/now?location=${locationId}&key=${apiKey}`,
      success: (res) => {
        if (res.data && res.data.code === '200' && res.data.now) {
          const now = res.data.now;
          const currentData = {
            temp: parseInt(now.temp),
            description: now.text,
            humidity: parseInt(now.humidity),
            feelsLike: parseInt(now.feelsLike) || parseInt(now.temp),
            windSpeed: parseInt(now.windSpeed) || 0,
            windDir: now.windDir || '',
            pressure: parseInt(now.pressure) || 0,
            visibility: parseInt(now.vis) || 0,
            uvIndex: '0',
            cloudcover: parseInt(now.cloud) || 0
          };

          // 获取7天预报
          this.get7DayForecast(locationId, (forecast7Days, hourlyForecast) => {
            // 同时取前3天作为简要预报
            const forecast3Days = forecast7Days.slice(0, 3);
            callback({
              current: currentData,
              forecast3Days: forecast3Days,
              forecast7Days: forecast7Days,
              hourlyForecast: hourlyForecast
            });
          });
        } else {
          this.useMockWeatherData(this.data.city, callback);
        }
      },
      fail: () => {
        this.useMockWeatherData(this.data.city, callback);
      }
    });
  },

  // 获取7天预报和逐时预报
  get7DayForecast: function(locationId, callback) {
    const app = getApp();
    const apiHost = app.globalData.weatherAPIHost;
    const apiKey = app.globalData.weatherAPIKey;
    const futureDates = this.getFutureDates(7);

    wx.request({
      url: `${apiHost}/v7/weather/7d?location=${locationId}&key=${apiKey}`,
      success: (res) => {
        let forecast7Days = [];
        let hourlyForecast = [];

        if (res.data && res.data.code === '200' && res.data.daily) {
          forecast7Days = res.data.daily.slice(0, 7).map((day, index) => ({
            date: futureDates[index],
            tempMin: parseInt(day.tempMin),
            tempMax: parseInt(day.tempMax),
            description: day.textDay
          }));
        } else {
          forecast7Days = futureDates.map((date, index) => ({
            date: date,
            tempMin: 20 + Math.floor(index / 2),
            tempMax: 28 + Math.floor(index / 2),
            description: index % 2 === 0 ? '晴' : '多云'
          }));
        }

        // 获取逐时预报
        wx.request({
          url: `${apiHost}/v7/weather/24h?location=${locationId}&key=${apiKey}`,
          success: (hr) => {
            if (hr.data && hr.data.code === '200' && hr.data.hourly) {
              hourlyForecast = hr.data.hourly.slice(0, 8).map(hour => {
                const obsTime = hour.obsTime || hour.fxTime || '';
                const timeMatch = obsTime.match(/T(\d{2}):\d{2}/);
                const timeStr = timeMatch ? timeMatch[1] + ':00' : '12:00';
                return {
                  time: timeStr,
                  temp: parseInt(hour.temp),
                  description: hour.text,
                  rainChance: hour.pop ? parseInt(hour.pop) : 0
                };
              });
            } else {
              hourlyForecast = this.getDefaultHourlyForecast();
            }
            callback(forecast7Days, hourlyForecast);
          },
          fail: () => {
            hourlyForecast = this.getDefaultHourlyForecast();
            callback(forecast7Days, hourlyForecast);
          }
        });
      },
      fail: () => {
        const futureDates = this.getFutureDates(7);
        callback(
          futureDates.map((date, index) => ({
            date: date,
            tempMin: 20 + Math.floor(index / 2),
            tempMax: 28 + Math.floor(index / 2),
            description: index % 2 === 0 ? '晴' : '多云'
          })),
          this.getDefaultHourlyForecast()
        );
      }
    });
  },

  getDefaultHourlyForecast: function() {
    return [
      { time: '00:00', temp: 20, description: '晴', rainChance: 0 },
      { time: '03:00', temp: 19, description: '晴', rainChance: 0 },
      { time: '06:00', temp: 20, description: '晴', rainChance: 0 },
      { time: '09:00', temp: 24, description: '晴', rainChance: 0 },
      { time: '12:00', temp: 28, description: '晴', rainChance: 0 },
      { time: '15:00', temp: 28, description: '多云', rainChance: 10 },
      { time: '18:00', temp: 26, description: '多云', rainChance: 5 },
      { time: '21:00', temp: 23, description: '晴', rainChance: 0 }
    ];
  },

  // 使用首页缓存数据
  useHomeCacheData: function(homeData, callback) {
    const futureDates = this.getFutureDates(7);
    const defaultForecast = futureDates.map((date, index) => ({
      date: date,
      tempMin: 20 + Math.floor(index / 2),
      tempMax: 28 + Math.floor(index / 2),
      description: index % 2 === 0 ? '晴' : '多云'
    }));
    
    // 合并数据（7天）
    let forecast7Days = homeData.forecast ? homeData.forecast.slice(0, 7) : [];
    for (let i = 0; i < 7; i++) {
      if (!forecast7Days[i]) {
        forecast7Days[i] = defaultForecast[i];
      }
    }
    
    const forecast3Days = forecast7Days.slice(0, 3);
    
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
      forecast7Days: forecast7Days,
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
    const futureDates = this.getFutureDates(7);
    const forecast7Days = futureDates.map((date, index) => ({
      date: date,
      tempMin: 20 + Math.floor(index / 2),
      tempMax: 28 + Math.floor(index / 2),
      description: index % 2 === 0 ? '晴' : '多云'
    }));
    
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
      forecast3Days: forecast7Days.slice(0, 3),
      forecast7Days: forecast7Days,
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
      forecast7Days: data.forecast7Days || [],
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
