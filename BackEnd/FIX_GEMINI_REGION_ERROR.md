# 🚨 FIX: Gemini API Region Error

## ❌ Lỗi hiện tại
```json
{
  "error": {
    "code": 400,
    "message": "User location is not supported for the API use.",
    "status": "FAILED_PRECONDITION"
  }
}
``` 

## 🔍 Nguyên nhân

**Gemini API bị giới hạn theo khu vực địa lý:**
- ❌ **Azure East Asia** (Singapore, Tokyo, Hong Kong) - KHÔNG được hỗ trợ
- ❌ **Azure Southeast Asia** - KHÔNG được hỗ trợ
- ✅ **Azure US East/West** - Được hỗ trợ
- ✅ **Azure West Europe** - Được hỗ trợ

Backend của bạn đang deploy trên: `eastasia-01.azurewebsites.net` → **KHÔNG được hỗ trợ**

---

## ✅ Giải pháp

### **Option 1: Deploy backend ở region được hỗ trợ (Recommended)**

1. **Tạo Azure App Service mới ở US hoặc EU:**
```bash
# Azure Portal
1. Create new App Service
2. Region: "East US" hoặc "West Europe"
3. Deploy code lên đó
```

2. **Hoặc dùng Azure CLI:**
```bash
az webapp create \
  --resource-group YourResourceGroup \
  --plan YourAppServicePlan \
  --name pawnder-backend-us \
  --runtime "DOTNETCORE:8.0" \
  --location "eastus"
```

3. **Update connection string và deploy:**
```bash
dotnet publish -c Release
# Deploy to new region
```

---

### **Option 2: Sử dụng Vertex AI (Google Cloud)**

Vertex AI không bị giới hạn region như Gemini API.

**Thay đổi code:**

```csharp
// Install package
// dotnet add package Google.Cloud.AIPlatform.V1

using Google.Cloud.AIPlatform.V1;

public class VertexAIService : IGeminiAIService
{
    private readonly PredictionServiceClient _client;
    private readonly string _projectId = "your-gcp-project-id";
    private readonly string _location = "us-central1";
    
    public VertexAIService()
    {
        _client = PredictionServiceClient.Create();
    }
    
    public async Task<GeminiResponse> SendMessageAsync(...)
    {
        var endpoint = $"projects/{_projectId}/locations/{_location}/publishers/google/models/gemini-1.5-flash";
        // ... vertex AI call
    }
}
```

---

### **Option 3: Tạo API key mới từ VPN/Proxy (Quick fix)**

1. **Kết nối VPN đến US/EU**
2. **Tạo API key mới tại:** https://makersuite.google.com/app/apikey
3. **Replace API key trong appsettings.json**

⚠️ **Lưu ý:** API key vẫn sẽ bị block nếu request từ Asia region.

---

### **Option 4: Sử dụng Proxy/Relay Server (Workaround)**

Tạo một relay server ở US/EU để forward requests:

```
[Azure East Asia Backend] 
    ↓ HTTPS
[Relay Server US] 
    ↓ Gemini API
[Google Gemini]
```

**Node.js Relay Example:**
```javascript
// relay-server.js (deploy trên US region)
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

app.post('/gemini-proxy', async (req, res) => {
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            req.body
        );
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000);
```

**Update C# Service:**
```csharp
// Thay vì gọi trực tiếp Gemini, gọi relay
var response = await _httpClient.PostAsync(
    "https://your-relay-us.azurewebsites.net/gemini-proxy",
    content
);
```

---

### **Option 5: Chuyển sang OpenAI API (Alternative)**

OpenAI không bị giới hạn region.

```bash
dotnet add package Betalgo.OpenAI
```

```csharp
using OpenAI.GPT3;
using OpenAI.GPT3.Managers;

public class OpenAIService : IGeminiAIService
{
    private readonly OpenAIService _openAI;
    
    public OpenAIService(string apiKey)
    {
        _openAI = new OpenAIService(new OpenAiOptions()
        {
            ApiKey = apiKey
        });
    }
    
    public async Task<GeminiResponse> SendMessageAsync(...)
    {
        var completionResult = await _openAI.ChatCompletion.CreateCompletion(new ChatCompletionCreateRequest
        {
            Messages = new List<ChatMessage>
            {
                ChatMessage.FromSystem(systemPrompt),
                ChatMessage.FromUser(question)
            },
            Model = Models.Gpt_3_5_Turbo
        });
        
        return new GeminiResponse 
        {
            Answer = completionResult.Choices.First().Message.Content,
            TotalTokens = completionResult.Usage.TotalTokens
        };
    }
}
```

**Giá:**
- GPT-3.5-turbo: $0.0015 / 1K tokens (rẻ)
- GPT-4: $0.03 / 1K tokens (đắt hơn)
- Gemini: Free tier 60 req/min

---

## 🎯 Recommended Solution

**Short-term (Ngay lập tức):**
→ **Option 4: Relay Server** (deploy relay server ở US, forward requests)

**Long-term (Production):**
→ **Option 1: Redeploy backend ở US/EU region**

---

## 📝 Implementation Steps (Relay Server)

### 1. Tạo Relay Server (Node.js)

```javascript
// relay/server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAf2MmqeAwHQxsFSkMos0VKxhDvlzPBrMg';

app.post('/api/gemini', async (req, res) => {
    try {
        const { model, prompt } = req.body;
        
        console.log(`📨 Relaying request to Gemini (model: ${model})`);
        
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [{
                    parts: [{ text: prompt }]
                }]
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 60000
            }
        );
        
        console.log(`✅ Gemini responded`);
        res.json(response.data);
        
    } catch (error) {
        console.error(`❌ Relay error:`, error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: error.response?.data || { message: error.message }
        });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', region: process.env.REGION || 'unknown' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Gemini Relay Server running on port ${PORT}`);
});
```

### 2. Deploy Relay lên Azure (US region)

```bash
# 1. Tạo package.json
cat > package.json <<EOF
{
  "name": "gemini-relay",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "cors": "^2.8.5"
  }
}
EOF

# 2. Deploy to Azure (US East)
az webapp create \
  --resource-group YourResourceGroup \
  --plan YourPlan \
  --name pawnder-gemini-relay \
  --runtime "NODE:18-lts" \
  --location "eastus"

# 3. Deploy code
zip -r deploy.zip server.js package.json
az webapp deployment source config-zip \
  --resource-group YourResourceGroup \
  --name pawnder-gemini-relay \
  --src deploy.zip

# 4. Set environment variables
az webapp config appsettings set \
  --resource-group YourResourceGroup \
  --name pawnder-gemini-relay \
  --settings GEMINI_API_KEY="AIzaSyAf2MmqeAwHQxsFSkMos0VKxhDvlzPBrMg" REGION="US-East"
```

### 3. Update C# Service để dùng Relay

```csharp
// GeminiAIService.cs
public class GeminiAIService : IGeminiAIService
{
    private readonly HttpClient _httpClient;
    private readonly string _relayUrl = "https://pawnder-gemini-relay.azurewebsites.net/api/gemini";
    
    public GeminiAIService(HttpClient httpClient, ...)
    {
        _httpClient = httpClient;
    }
    
    public async Task<GeminiResponse> SendMessageAsync(...)
    {
        var requestBody = new
        {
            model = "gemini-1.5-flash",
            prompt = promptBuilder.ToString()
        };
        
        var response = await _httpClient.PostAsJsonAsync(_relayUrl, requestBody);
        var result = await response.Content.ReadFromJsonAsync<GeminiApiResponse>();
        
        var answer = result?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text;
        // ... parse response
    }
}
```

---

## 🧪 Test Relay Server

```bash
# Test health
curl https://pawnder-gemini-relay.azurewebsites.net/health

# Test Gemini request
curl -X POST https://pawnder-gemini-relay.azurewebsites.net/api/gemini \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-1.5-flash",
    "prompt": "Hello, how are you?"
  }'
```

---

## 💰 Cost Comparison

| Solution | Setup Time | Monthly Cost | Pros | Cons |
|----------|-----------|--------------|------|------|
| **Redeploy US** | 2 hours | $0 (same cost) | ✅ Clean, no extra service | ❌ Migration effort |
| **Relay Server** | 1 hour | ~$10-20 | ✅ Quick fix | ❌ Extra latency (100-200ms) |
| **Vertex AI** | 4 hours | $0 (free tier) | ✅ No region limit | ❌ Complex setup |
| **OpenAI** | 2 hours | $10-50 | ✅ Better quality | ❌ Paid only |

---

## ⚡ Quick Fix (Recommended)

1. **Deploy relay server ở US (15 phút)**
2. **Update appsettings.json:**
```json
{
  "GeminiAI": {
    "UseRelay": true,
    "RelayUrl": "https://pawnder-gemini-relay.azurewebsites.net/api/gemini",
    "ApiKey": "AIzaSyAf2MmqeAwHQxsFSkMos0VKxhDvlzPBrMg"
  }
}
```
3. **Test ngay!**

Bạn muốn tôi implement solution nào? 🚀
