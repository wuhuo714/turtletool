Page({
  data: {
    records: [],
    filteredRecords: [],
    searchText: '',
    showModal: false,
    currentRecord: {
      id: 0,
      turtleName: '',
      feedTime: '',
      foodAmount: '',
      weight: '',
      size: '',
      remark: ''
    }
  },
  
  onLoad: function() {
    this.loadRecords();
  },

  onShow: function() {
    // 每次页面显示时刷新记录
    this.loadRecords();
  },
  
  loadRecords: function() {
    const records = wx.getStorageSync('feed_records') || [];
    this.setData({
      records: records,
      filteredRecords: records
    });
  },
  
  inputChange: function(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [field]: value
    });
    this.filterRecords(value);
  },
  
  filterRecords: function(searchText) {
    if (!searchText) {
      this.setData({
        filteredRecords: this.data.records
      });
      return;
    }
    
    const filtered = this.data.records.filter(record => {
      return record.turtleName.includes(searchText) ||
             record.foodAmount.includes(searchText) ||
             (record.remark && record.remark.includes(searchText));
    });
    
    this.setData({
      filteredRecords: filtered
    });
  },
  
  deleteRecord: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          let records = wx.getStorageSync('feed_records') || [];
          records = records.filter(r => r.id !== id);
          wx.setStorageSync('feed_records', records);
          this.loadRecords();
          wx.showToast({ title: '删除成功', icon: 'success' });
        }
      }
    });
  },

  editRecord: function(e) {
    const id = e.currentTarget.dataset.id;
    const records = wx.getStorageSync('feed_records') || [];
    const record = records.find(r => r.id === id);
    
    if (record) {
      this.setData({
        showModal: true,
        currentRecord: { ...record }
      });
    }
  },

  closeModal: function() {
    this.setData({
      showModal: false
    });
  },

  inputChange: function(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`currentRecord.${field}`]: value
    });
  },

  updateRecord: function() {
    const { currentRecord } = this.data;
    
    if (!currentRecord.foodAmount) {
      wx.showToast({ title: '请填写喂食量', icon: 'none' });
      return;
    }
    
    let records = wx.getStorageSync('feed_records') || [];
    records = records.map(r => {
      if (r.id === currentRecord.id) {
        return { ...currentRecord };
      }
      return r;
    });
    
    wx.setStorageSync('feed_records', records);
    this.loadRecords();
    this.closeModal();
    wx.showToast({ title: '更新成功', icon: 'success' });
  }
})