# 天气 API 配置指南

## 使用 Visual Crossing 免费天气 API

本小程序使用 **Visual Crossing** 的免费天气 API，无需注册、无需 API Key，直接使用。

## API 特点

- ✅ **完全免费**，无需注册
- ✅ **无需 API Key**，直接调用
- ✅ 提供温度、天气描述、湿度等数据
- ✅ 支持当前天气和天气预报
- ⚠️ 免费额度：每天约 1000 次调用

## API 地址

### 当前天气
```
https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/weatherdata/now
```

### 天气预报（7天）
```
https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/weatherdata/forecast
```

## 请求参数

| 参数 | 说明 | 示例值 |
|-----|------|-------|
| unitGroup | 单位制（metric=公制） | metric |
| location | 城市名称 | 北京 |
| include | 包含数据 | current / fcst |
| contentType | 返回格式 | json |

## 返回数据示例

### 当前天气
```json
{
  "currentConditions": {
    "temp": 26,
    "conditions": "晴",
    "humidity": 65
  }
}
```

### 天气预报
```json
{
  "days": [
    {
      "tempmin": 20,
      "tempmax": 28,
      "conditions": "晴",
      "hours": [...]
    }
  ]
}
```

## 配置服务器域名白名单

在小程序管理后台添加以下域名到 request 合法域名白名单：

- `https://weather.visualcrossing.com`

添加步骤：
1. 登录微信公众平台：https://mp.weixin.qq.com/
2. 进入 "开发" -> "开发管理"
3. 点击 "开发设置"
4. 在 "服务器域名" 部分，点击 "修改"
5. 添加 `https://weather.visualcrossing.com` 到 `request 合法域名`

## 每日调用限制

代码中已实现每日 **800 次** API 调用限制，通过本地存储计数控制。

超过限制后会提示用户并使用缓存数据。

## 缓存机制

- 天气数据缓存在本地，**2 小时**自动刷新一次
- 减少 API 调用次数，节省免费额度