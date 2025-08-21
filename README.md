# Code Convert - Side by Side

A powerful web-based code conversion tool that supports multiple programming languages with AI-powered conversion using Ollama.

## 🚀 Features

- **Multi-language Support**: TypeScript, JavaScript, Java, C#, Python, C++, Go, Rust
- **AI-Powered Conversion**: Uses Ollama for intelligent code conversion
- **Adaptive Learning**: System learns from conversions to improve accuracy over time
- **Side-by-Side Comparison**: View source and two target languages simultaneously
- **Monaco Editor**: Professional code editing experience with syntax highlighting
- **Robust Error Handling**: Multiple fallback mechanisms for reliable operation

## 🧠 How the Learning System Works

### **Confidence Threshold Explained**

The confidence threshold is a **user-configurable safety parameter** that determines when the system should trust its manual conversion rules vs. when it should double-check with AI.

#### **Threshold Values:**
- **50% (Low)**: AI verification used frequently for maximum accuracy
- **80% (Medium)**: Balanced approach between speed and accuracy (Recommended)
- **95% (High)**: Manual rules trusted more often for faster conversion

#### **Why It's Editable:**
1. **Different Use Cases**: Beginners want more AI verification, experts trust manual rules
2. **Performance vs. Accuracy**: Lower threshold = more accurate but slower
3. **Domain-Specific Tuning**: Simple conversions need less AI, complex ones need more

### **Code Quality Assurance**

The system uses **multiple validation layers** to ensure quality without always needing AI:

#### **1. Manual Conversion Rules**
- Built-in conversion patterns that are proven correct
- Handle common syntax transformations reliably
- Tested and validated conversion logic

#### **2. Content Validation**
- Checks for empty/incomplete results
- Detects placeholder text and syntax errors
- Ensures minimum length and structure requirements

#### **3. Pattern Learning**
- System learns from AI corrections
- Builds confidence in manual rules over time
- Stores successful conversion patterns

#### **4. Fallback Mechanisms**
- Manual conversion → AI backup → Generic conversion
- Always provides some result, never fails completely

### **Learning Progress Metrics**

#### **What Each Metric Means:**
- **Total Conversions**: How many conversions the system has processed
- **Manual Success Rate**: Percentage of times manual rules worked correctly
- **AI Corrections**: How many times AI improved manual results
- **Learned Patterns**: Number of successful patterns stored

#### **Why Learning Progress is Resettable:**
1. **Fresh Start Scenarios**: New projects, different code types, domain changes
2. **Debugging & Testing**: Clear corrupted data, test learning system
3. **User Control**: Personal preference, privacy, outdated patterns

## 🛠️ Setup

### **Prerequisites**
- Python 3.x
- Ollama installed and running locally

### **Installation**
1. Clone the repository
2. Install Ollama: https://ollama.ai/
3. Pull a code model: `ollama pull codellama:7b`
4. Start Ollama service

### **Running the Application**
```bash
# Navigate to project directory
cd CodeConvertSideBySide

# Start local server
python -m http.server 8080

# Open browser
http://localhost:8080
```

### **Ollama Configuration**
- **Default URL**: `http://localhost:11434`
- **Recommended Model**: `codellama:7b` (good balance of speed/accuracy)
- **Alternative Models**: `deepseek-coder:6.7b`, `codegemma:7b`

## 📖 Usage

### **Basic Conversion**
1. Select source language
2. Enter source code
3. Select target languages
4. Click "Convert Code"

### **Learning System Modes**
- **Adaptive Learning**: System learns and improves over time (Recommended)
- **Always AI**: Uses AI for every conversion
- **Learning Disabled**: Manual rules only

### **Confidence Threshold Adjustment**
- **Lower threshold**: More AI verification, higher accuracy
- **Higher threshold**: More manual rules, faster conversion
- **80% recommended**: Good balance for most users

### **Monitoring & Maintenance**
- **Health Check Button**: Verify editor functionality
- **Explain Learning**: Understand current learning status
- **Reset Learning**: Start fresh when needed

## 🔧 Advanced Features

### **Editor Health Monitoring**
- Automatic health checks every 30 seconds
- Auto-recovery from editor failures
- Fallback to textarea if Monaco editor fails

### **Robust Error Handling**
- Multiple fallback methods for editor updates
- Content validation and retry logic
- Performance monitoring and statistics

### **Keyboard Shortcuts**
- **Ctrl+Enter**: Convert code
- **F12**: Open browser console for debugging

## 🚨 Troubleshooting

### **Common Issues**
1. **Monaco Editor Not Loading**: Check internet connection, refresh page
2. **Ollama Connection Failed**: Ensure Ollama is running locally
3. **Conversion Fails**: Check source code syntax, try different languages
4. **Editors Not Updating**: Use Health Check button, refresh page

### **Debug Tools**
- **Test Editor Button**: Verify editor functionality
- **Check Content Button**: View current editor content
- **Health Check Button**: Diagnose editor issues
- **Explain Learning Button**: Understand system status

### **Performance Tips**
- Use appropriate confidence threshold for your needs
- Reset learning data when switching code types
- Monitor learning progress for optimal performance
- Use recommended AI models for best results

## 🤝 Contributing

This project is open source! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

## 📄 License

MIT License - see LICENSE file for details.

---

**Built for developers, by developers.** 🚀
