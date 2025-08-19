# Code Convert Side by Side

A modern web application for converting code between different programming languages with side-by-side comparison.

## Features

- **3-Panel Layout**: Source code on the left, two target conversions on the right
- **Multiple Languages**: Support for TypeScript, JavaScript, Java, C#, Python, C++, Go, and Rust
- **AI-Powered Conversion**: Intelligent code translation using Ollama (local AI models)
- **Monaco Editor**: Professional code editor with syntax highlighting, bracket matching, and IntelliSense
- **Modern UI**: Beautiful, responsive design with smooth animations
- **Copy to Clipboard**: Easy copying of converted code
- **Keyboard Shortcuts**: Ctrl+Enter to convert code quickly
- **Code Folding**: Collapse/expand code blocks for better readability
- **Auto-completion**: Smart code suggestions and auto-completion
- **Fallback Support**: Manual conversion rules when AI is unavailable

## Supported Conversions

### Primary Conversions (Advanced Logic)
- TypeScript ↔ Java
- TypeScript ↔ C#
- TypeScript ↔ Python
- JavaScript ↔ TypeScript
- Java ↔ C#
- Python ↔ Java/C#/TypeScript

### Additional Languages
- C++, Go, Rust (basic conversion templates)

## Getting Started

### Prerequisites (for AI-powered conversion)

1. **Install Ollama**: Download from [ollama.ai](https://ollama.ai)
2. **Install a coding model**:
   ```bash
   # Recommended: CodeLlama 7B (good balance of speed and quality)
   ollama pull codellama:7b
   
   # Or other options:
   ollama pull deepseek-coder:6.7b  # Excellent for code
   ollama pull codegemma:7b         # Google's code model
   ollama pull codellama:13b        # Larger, more accurate
   ```

3. **Start Ollama**:
   ```bash
   ollama serve
   ```

### Method 1: Simple HTTP Server (Python)
```bash
# Navigate to the project directory
cd CodeConvertSideBySide

# Start a simple HTTP server
python -m http.server 8080

# Open your browser and visit:
# http://localhost:8080
```

### Method 2: Node.js HTTP Server
```bash
# Install dependencies
npm install

# Start the server
npm run start-node

# Or for development with live reload:
npm run dev
```

### Method 3: Live Server (VS Code Extension)
If you have the Live Server extension in VS Code:
1. Right-click on `index.html`
2. Select "Open with Live Server"

## Usage

1. **Configure AI (Optional)**: Click the "Settings" button to configure Ollama
   - Check Ollama status (should show "Online" if properly installed)
   - Select your preferred AI model
   - Choose between AI-powered or manual conversion
2. **Select Source Language**: Choose the language of your source code
3. **Enter Code**: Type or paste your code in the left panel
4. **Select Target Languages**: Choose the languages you want to convert to in the right panels
5. **Convert**: Click the "Convert Code" button or press Ctrl+Enter
6. **Copy Results**: Use the copy buttons to copy converted code to clipboard

### AI vs Manual Conversion

- **AI-Powered (Recommended)**: Uses Ollama models for intelligent, context-aware conversion
- **Manual Rules**: Uses predefined patterns (fallback when AI is unavailable)

## Example

Try this TypeScript code in the source panel:

```typescript
interface User {
    id: number;
    name: string;
    email: string;
}

class UserService {
    private users: User[] = [];

    addUser(user: User): void {
        this.users.push(user);
    }

    getUserById(id: number): User | undefined {
        return this.users.find(user => user.id === id);
    }
}
```

Select Java and C# as target languages and click Convert!

## Architecture

- **Frontend**: Pure HTML, CSS, and JavaScript (no frameworks required)
- **Code Editor**: Monaco Editor (VS Code's editor) for professional editing experience
- **Styling**: Modern CSS with gradients, animations, and responsive design
- **Conversion Logic**: Rule-based conversion with pattern matching
- **Extensible**: Easy to add new language conversions

## Customization

### Adding New Languages

1. Add language configuration to `languageTemplates` in `script.js`
2. Create conversion functions in `conversionMappings`
3. Add the language option to HTML select elements

### Improving Conversions

The conversion logic is in `script.js`. Each language pair has its own conversion function that can be enhanced with more sophisticated parsing and mapping rules.

## Ollama Models Comparison

| Model | Size | Speed | Code Quality | Best For |
|-------|------|-------|--------------|----------|
| CodeLlama 7B | 3.8GB | Fast | Good | General use, quick conversion |
| CodeLlama 13B | 7.3GB | Medium | Very Good | Better accuracy, more context |
| CodeLlama 34B | 19GB | Slow | Excellent | Best quality, complex code |
| DeepSeek Coder 6.7B | 3.8GB | Fast | Very Good | Specialized for coding |
| CodeGemma 7B | 5GB | Fast | Good | Google's code model |

## Future Enhancements

- Support for more Ollama models (Mistral, Qwen, etc.)
- File upload/download functionality
- More programming languages
- Advanced parsing for complex code structures
- Code formatting and optimization suggestions
- Dark/light theme toggle
- Multiple tabs support
- Git integration
- Custom prompt templates

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - feel free to use and modify for your projects!

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for:
- New language support
- Improved conversion algorithms
- UI/UX enhancements
- Bug fixes
