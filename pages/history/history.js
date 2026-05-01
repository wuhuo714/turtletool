Page({
  data: {
    records: [],
    filteredRecords: [],
    searchText: ''
  },
  
  onLoad: function() {
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
  }
})