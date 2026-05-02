Page({
  data: {
    turtleList: [],
    turtleNames: [],
    turtleIndex: 0,
    feedRecord: {
      foodAmount: '',
      weight: '',
      size: '',
      remark: ''
    }
  },
  
  onLoad: function() {
    this.loadTurtleList();
  },

  onShow: function() {
    // 每次显示时刷新龟只列表
    this.loadTurtleList();
  },
  
  loadTurtleList: function() {
    const turtleList = wx.getStorageSync('turtle_list') || [];
    const turtleNames = turtleList.map(t => t.name);
    
    this.setData({
      turtleList: turtleList,
      turtleNames: turtleNames
    });
  },
  
  bindTurtleChange: function(e) {
    this.setData({
      turtleIndex: e.detail.value
    });
  },
  
  inputChange: function(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`feedRecord.${field}`]: value
    });
  },
  
  saveFeedRecord: function() {
    const { turtleList, turtleIndex, feedRecord } = this.data;
    
    if (turtleIndex >= turtleList.length) {
      wx.showToast({ title: '请选择龟只', icon: 'none' });
      return;
    }
    
    if (!feedRecord.foodAmount) {
      wx.showToast({ title: '请填写喂食量', icon: 'none' });
      return;
    }
    
    const selectedTurtle = turtleList[turtleIndex];
    const newRecord = {
      id: Date.now(),
      turtleId: selectedTurtle.id,
      turtleName: selectedTurtle.name,
      feedTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
      foodAmount: feedRecord.foodAmount,
      weight: feedRecord.weight ? parseFloat(feedRecord.weight) : '',
      size: feedRecord.size ? parseFloat(feedRecord.size) : '',
      remark: feedRecord.remark
    };
    
    // 保存到本地存储
    const records = wx.getStorageSync('feed_records') || [];
    records.unshift(newRecord); // 添加到开头
    wx.setStorageSync('feed_records', records);
    
    wx.showToast({ title: '保存成功', icon: 'success' });
    
    // 跳转回首页
    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  }
})