Page({
  data: {
    turtleList: [],
    showModal: false,
    isEdit: false,
    currentTurtle: {
      id: 0,
      name: '',
      breed: '',
      gender: '',
      size: '',
      weight: '',
      updateDate: ''
    }
  },
  
  onLoad: function() {
    this.loadTurtleList();
  },

  onShow: function() {
    // 每次页面显示时刷新龟只列表
    this.loadTurtleList();
  },
  
  loadTurtleList: function() {
    const turtleList = wx.getStorageSync('turtle_list') || [];
    this.setData({
      turtleList: turtleList
    });
  },
  
  addTurtle: function() {
    this.setData({
      showModal: true,
      isEdit: false,
      currentTurtle: {
        id: Date.now(),
        name: '',
        breed: '',
        gender: '',
        size: '',
        weight: '',
        updateDate: new Date().toISOString().split('T')[0]
      }
    });
  },
  
  editTurtle: function(e) {
    const id = e.currentTarget.dataset.id;
    const turtleList = wx.getStorageSync('turtle_list') || [];
    const turtle = turtleList.find(t => t.id === id);
    
    this.setData({
      showModal: true,
      isEdit: true,
      currentTurtle: { ...turtle }
    });
  },
  
  deleteTurtle: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这只龟吗？',
      success: (res) => {
        if (res.confirm) {
          let turtleList = wx.getStorageSync('turtle_list') || [];
          turtleList = turtleList.filter(t => t.id !== id);
          wx.setStorageSync('turtle_list', turtleList);
          this.loadTurtleList();
        }
      }
    });
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
      [`currentTurtle.${field}`]: value
    });
  },
  
  saveTurtle: function() {
    const { name, breed, gender } = this.data.currentTurtle;
    
    if (!name || !breed || !gender) {
      wx.showToast({ title: '请填写必填信息', icon: 'none' });
      return;
    }
    
    let turtleList = wx.getStorageSync('turtle_list') || [];
    
    if (this.data.isEdit) {
      // 编辑现有龟只，同时更新日期
      turtleList = turtleList.map(t => {
        if (t.id === this.data.currentTurtle.id) {
          return {
            ...this.data.currentTurtle,
            updateDate: new Date().toISOString().split('T')[0]
          };
        }
        return t;
      });
    } else {
      // 添加新龟只
      const newTurtle = {
        ...this.data.currentTurtle,
        createTime: new Date().toISOString().split('T')[0]
      };
      turtleList.push(newTurtle);
    }
    
    wx.setStorageSync('turtle_list', turtleList);
    this.loadTurtleList();
    this.closeModal();
    wx.showToast({ title: '保存成功', icon: 'success' });
  }
})