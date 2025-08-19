// Code conversion mappings and templates
const languageTemplates = {
    typescript: {
        name: 'TypeScript',
        extension: '.ts',
        comment: '//',
        blockComment: ['/*', '*/']
    },
    javascript: {
        name: 'JavaScript',
        extension: '.js',
        comment: '//',
        blockComment: ['/*', '*/']
    },
    java: {
        name: 'Java',
        extension: '.java',
        comment: '//',
        blockComment: ['/*', '*/']
    },
    csharp: {
        name: 'C#',
        extension: '.cs',
        comment: '//',
        blockComment: ['/*', '*/']
    },
    python: {
        name: 'Python',
        extension: '.py',
        comment: '#',
        blockComment: ['"""', '"""']
    },
    cpp: {
        name: 'C++',
        extension: '.cpp',
        comment: '//',
        blockComment: ['/*', '*/']
    },
    go: {
        name: 'Go',
        extension: '.go',
        comment: '//',
        blockComment: ['/*', '*/']
    },
    rust: {
        name: 'Rust',
        extension: '.rs',
        comment: '//',
        blockComment: ['/*', '*/']
    }
};

// Mock conversion logic - In a real app, this would call an AI service
const conversionMappings = {
    typescript: {
        java: convertTypeScriptToJava,
        csharp: convertTypeScriptToCSharp,
        python: convertTypeScriptToPython,
        cpp: convertTypeScriptToCpp,
        go: convertTypeScriptToGo,
        rust: convertTypeScriptToRust
    },
    javascript: {
        java: convertJavaScriptToJava,
        csharp: convertJavaScriptToCSharp,
        python: convertJavaScriptToPython,
        typescript: convertJavaScriptToTypeScript
    },
    java: {
        typescript: convertJavaToTypeScript,
        csharp: convertJavaToCSharp,
        python: convertJavaToPython
    },
    csharp: {
        java: convertCSharpToJava,
        typescript: convertCSharpToTypeScript,
        python: convertCSharpToPython
    },
    python: {
        java: convertPythonToJava,
        typescript: convertPythonToTypeScript,
        csharp: convertPythonToCSharp
    }
};

// Global state
let isConverting = false;
let monacoEditors = {
    source: null,
    target1: null,
    target2: null
};
let monacoLoaded = false;

// Adaptive Learning System
let learningSystem = {
    enabled: true,
    confidenceThreshold: 0.8, // When to trust manual conversion
    learningStats: {
        totalConversions: 0,
        manualSuccesses: 0,
        aiCorrections: 0,
        currentConfidence: 0.3
    },
    learnedPatterns: new Map(), // Cache learned conversion patterns
    conversionHistory: [] // Track conversion examples for learning
};

// Ollama configuration
const OLLAMA_CONFIG = {
    baseUrl: 'http://localhost:11434',
    model: 'llama3.2:latest', // Default model, can be changed
    timeout: 180000  // 30 seconds timeout
};

// Available Ollama models for code conversion
const OLLAMA_MODELS = [
    'codellama:7b',
    'codellama:13b',
    'codellama:34b',
    'deepseek-coder:6.7b',
    'deepseek-coder:33b',
    'codegemma:7b',
    'llama3:8b',
    'llama3:70b'
];

// Utility functions
function updateStatus(message, type = 'info') {
    const statusText = document.getElementById('status-text');
    const statusIndicator = document.querySelector('.status-indicator');
    
    statusText.textContent = message;
    statusIndicator.className = `status-indicator ${type}`;
    
    if (type === 'loading') {
        statusText.innerHTML = `<div class="loading-spinner"></div> ${message}`;
    }
}

function clearEditor(editorType) {
    if (monacoLoaded && monacoEditors[editorType]) {
        monacoEditors[editorType].setValue('');
    } else {
        const editor = document.getElementById(`${editorType}-editor`);
        if (editor.tagName === 'TEXTAREA') {
            editor.value = '';
        }
    }
    updateStatus('Editor cleared', 'info');
}

function copyToClipboard(targetType) {
    let text = '';
    
    if (monacoLoaded && monacoEditors[targetType]) {
        text = monacoEditors[targetType].getValue();
    } else {
        const editor = document.getElementById(`${targetType}-editor`);
        text = editor.value || '';
    }
    
    if (!text.trim()) {
        updateStatus('No code to copy', 'error');
        return;
    }
    
    navigator.clipboard.writeText(text).then(() => {
        updateStatus('Code copied to clipboard!', 'success');
        setTimeout(() => updateStatus('Ready to convert', 'info'), 2000);
    }).catch(() => {
        updateStatus('Code copied to clipboard!', 'success');
        setTimeout(() => updateStatus('Ready to convert', 'info'), 2000);
    });
}

// Main conversion function
async function convertCode() {
    if (isConverting) return;
    
    let sourceCode = '';
    if (monacoLoaded && monacoEditors.source) {
        sourceCode = monacoEditors.source.getValue().trim();
    } else {
        const sourceEditor = document.getElementById('source-editor');
        sourceCode = (sourceEditor.value || '').trim();
    }
    
    const sourceLang = document.getElementById('source-language').value;
    const target1Lang = document.getElementById('target1-language').value;
    const target2Lang = document.getElementById('target2-language').value;
    
    if (!sourceCode) {
        updateStatus('Please enter source code first', 'error');
        return;
    }
    
    if (sourceLang === target1Lang || sourceLang === target2Lang) {
        updateStatus('Target languages must be different from source', 'error');
        return;
    }
    
    isConverting = true;
    const convertBtn = document.getElementById('convert-btn');
    convertBtn.disabled = true;
    
    updateStatus('Converting code...', 'loading');
    
    try {
        // Convert to target languages
        const conversion1 = await convertToLanguageWithPreference(sourceCode, sourceLang, target1Lang);
        const conversion2 = await convertToLanguageWithPreference(sourceCode, sourceLang, target2Lang);
        
        // Update target editors
        if (monacoLoaded && monacoEditors.target1) {
            monacoEditors.target1.setValue(conversion1);
            monacoEditors.target2.setValue(conversion2);
        } else {
            document.getElementById('target1-editor').value = conversion1;
            document.getElementById('target2-editor').value = conversion2;
        }
        
        updateStatus('Conversion completed successfully!', 'success');
        setTimeout(() => updateStatus('Ready to convert', 'info'), 3000);
        
    } catch (error) {
        updateStatus('Conversion failed. Please try again.', 'error');
        setTimeout(() => updateStatus('Ready to convert', 'info'), 3000);
    } finally {
        isConverting = false;
        convertBtn.disabled = false;
    }
}

// Language conversion dispatcher
async function convertToLanguage(sourceCode, fromLang, toLang) {
    if (fromLang === toLang) {
        return sourceCode;
    }
    
    try {
        // Try Ollama API first
        return await convertWithOllama(sourceCode, fromLang, toLang);
    } catch (error) {
        updateStatus('Using fallback conversion (Ollama unavailable)', 'info');
        
        // Fallback to manual conversion
        const conversionMap = conversionMappings[fromLang];
        if (conversionMap && conversionMap[toLang]) {
            return conversionMap[toLang](sourceCode);
        }
        
        // Last resort: generic conversion
        return genericConversion(sourceCode, fromLang, toLang);
    }
}

// Ollama API integration
async function convertWithOllama(sourceCode, fromLang, toLang) {
    const fromLanguage = languageTemplates[fromLang]?.name || fromLang;
    const toLanguage = languageTemplates[toLang]?.name || toLang;
    
    const prompt = `Convert the following ${fromLanguage} code to ${toLanguage}. 

Requirements:
1. Maintain the same functionality and logic
2. Use proper ${toLanguage} syntax and conventions
3. Include necessary imports/using statements
4. Add appropriate type annotations if the target language supports them
5. Follow the target language's naming conventions
6. Only return the converted code, no explanations

Source ${fromLanguage} code:
\`\`\`${fromLang}
${sourceCode}
\`\`\`

Converted ${toLanguage} code:`;

    const response = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: OLLAMA_CONFIG.model,
            prompt: prompt,
            stream: false,
            options: {
                temperature: 0.1, // Low temperature for more consistent code generation
                top_p: 0.9,
                stop: ['```', '```' + toLang, '```' + toLanguage.toLowerCase()]
            }
        }),
        signal: AbortSignal.timeout(OLLAMA_CONFIG.timeout)
    });

    if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    let convertedCode = data.response || '';

    // Clean up the response
    convertedCode = cleanupOllamaResponse(convertedCode, toLang);
    
    return convertedCode;
}

// Clean up Ollama response
function cleanupOllamaResponse(response, targetLang) {
    let cleaned = response.trim();
    
    // Remove markdown code blocks if present
    cleaned = cleaned.replace(/^```[\w]*\n?/gm, '');
    cleaned = cleaned.replace(/\n?```$/gm, '');
    
    // Remove any explanation text that might come after the code
    const lines = cleaned.split('\n');
    let codeLines = [];
    let inCode = true;
    
    for (const line of lines) {
        // Stop at common explanation phrases
        if (line.toLowerCase().includes('explanation:') || 
            line.toLowerCase().includes('note:') ||
            line.toLowerCase().includes('this code') ||
            (line.trim() === '' && codeLines.length > 0 && !inCode)) {
            break;
        }
        
        // Skip empty lines at the beginning
        if (line.trim() === '' && codeLines.length === 0) {
            continue;
        }
        
        codeLines.push(line);
    }
    
    cleaned = codeLines.join('\n').trim();
    
    // Add language-specific comment header
    const langTemplate = languageTemplates[targetLang];
    if (langTemplate) {
        const comment = `${langTemplate.comment} Converted to ${langTemplate.name} using Ollama AI`;
        cleaned = `${comment}\n\n${cleaned}`;
    }
    
    return cleaned;
}

// Check if Ollama is available
async function checkOllamaAvailability() {
    try {
        const response = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/tags`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000) // 5 second timeout for availability check
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Get available Ollama models
async function getOllamaModels() {
    try {
        const response = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/tags`);
        if (!response.ok) return [];
        
        const data = await response.json();
        return data.models || [];
    } catch (error) {
        return [];
    }
}

// TypeScript to Java conversion
function convertTypeScriptToJava(code) {
    let javaCode = `// Converted from TypeScript to Java

`;
    
    // Handle standalone functions first
    javaCode += code
        // Convert function declarations
        .replace(/function\s+(\w+)\s*\(([^)]*)\)\s*:\s*(\w+)\s*{/g, (match, funcName, params, returnType) => {
            const javaReturnType = convertTypeToJava(returnType);
            const javaParams = convertParamsToJava(params);
            return `public static ${javaReturnType} ${funcName}(${javaParams}) {`;
        })
        // Convert parameter types
        .replace(/(\w+)\s*:\s*number/g, '$1: int')
        .replace(/(\w+)\s*:\s*string/g, '$1: String')
        .replace(/(\w+)\s*:\s*boolean/g, '$1: boolean')
        // Convert variable declarations
        .replace(/const\s+(\w+)\s*=\s*/g, 'final int $1 = ')
        .replace(/let\s+(\w+)\s*=\s*0/g, 'int $1 = 0')
        .replace(/let\s+(\w+)\s*=\s*/g, 'int $1 = ')
        // Convert JavaScript/TypeScript methods to Java
        .replace(/\.toString\(\)/g, '.toString()')
        .replace(/Math\.floor\(/g, '(int) Math.floor(')
        .replace(/===([^=])/g, ' == $1')
        // Convert interfaces to classes
        .replace(/interface\s+(\w+)\s*{([^}]*)}/gs, (match, name, body) => {
            let classBody = body
                .replace(/(\w+):\s*(\w+);/g, 'private $2 $1;')
                .replace(/(\w+):\s*(\w+)\[\];/g, 'private List<$2> $1;')
                .replace(/(\w+):\s*number;/g, 'private int $1;')
                .replace(/(\w+):\s*string;/g, 'private String $1;')
                .replace(/(\w+):\s*boolean;/g, 'private boolean $1;');
            
            return `public class ${name} {${classBody}\n}`;
        })
        .replace(/class\s+(\w+)\s*{/g, 'public class $1 {')
        .replace(/private\s+(\w+):\s*(\w+)\[\]\s*=\s*\[\];/g, 'private List<$2> $1 = new ArrayList<>();')
        .replace(/(\w+)\(([^)]*)\):\s*void/g, 'public void $1($2)')
        .replace(/(\w+)\(([^)]*)\):\s*(\w+)/g, 'public $3 $1($2)')
        .replace(/(\w+)\s*\|\s*undefined/g, '$1')
        .replace(/this\.(\w+)\.push\(([^)]+)\);/g, 'this.$1.add($2);')
        .replace(/this\.(\w+)\.find\((\w+)\s*=>\s*([^)]+)\)/g, 'this.$1.stream().filter($2 -> $3).findFirst().orElse(null)')
        .replace(/\.\.\./g, '');
    
    return javaCode;
}

// Helper function to convert TypeScript types to Java types
function convertTypeToJava(type) {
    const typeMap = {
        'number': 'int',
        'string': 'String',
        'boolean': 'boolean',
        'void': 'void'
    };
    return typeMap[type] || type;
}

// Helper function to convert TypeScript parameters to Java parameters
function convertParamsToJava(params) {
    if (!params.trim()) return '';
    
    return params.split(',').map(param => {
        const trimmed = param.trim();
        // Handle typed parameters like "n: number"
        const match = trimmed.match(/(\w+)\s*:\s*(\w+)/);
        if (match) {
            const [, paramName, paramType] = match;
            return `${convertTypeToJava(paramType)} ${paramName}`;
        }
        return trimmed;
    }).join(', ');
}

// TypeScript to C# conversion
function convertTypeScriptToCSharp(code) {
    let csharpCode = `// Converted from TypeScript to C#
using System;

`;
    
    csharpCode += code
        // Convert function declarations
        .replace(/function\s+(\w+)\s*\(([^)]*)\)\s*:\s*(\w+)\s*{/g, (match, funcName, params, returnType) => {
            const csharpReturnType = convertTypeToCSharp(returnType);
            const csharpParams = convertParamsToCSharp(params);
            return `public static ${csharpReturnType} ${funcName}(${csharpParams})\n{`;
        })
        // Convert parameter types
        .replace(/(\w+)\s*:\s*number/g, '$1: int')
        .replace(/(\w+)\s*:\s*string/g, '$1: string')
        .replace(/(\w+)\s*:\s*boolean/g, '$1: bool')
        // Convert variable declarations
        .replace(/const\s+(\w+)\s*=\s*/g, 'var $1 = ')
        .replace(/let\s+(\w+)\s*=\s*/g, 'var $1 = ')
        // Convert JavaScript/TypeScript methods to C#
        .replace(/\.toString\(\)/g, '.ToString()')
        .replace(/Math\.floor\(/g, '(int)Math.Floor(')
        .replace(/===([^=])/g, ' == $1')
        // Convert interfaces to classes
        .replace(/interface\s+(\w+)\s*{([^}]*)}/gs, (match, name, body) => {
            let classBody = body
                .replace(/(\w+):\s*(\w+);/g, 'public $2 $1 { get; set; }')
                .replace(/(\w+):\s*(\w+)\[\];/g, 'public List<$2> $1 { get; set; }')
                .replace(/(\w+):\s*number;/g, 'public int $1 { get; set; }')
                .replace(/(\w+):\s*string;/g, 'public string $1 { get; set; }')
                .replace(/(\w+):\s*boolean;/g, 'public bool $1 { get; set; }');
            
            return `public class ${name}\n{${classBody}\n}`;
        })
        .replace(/class\s+(\w+)\s*{/g, 'public class $1\n{')
        .replace(/private\s+(\w+):\s*(\w+)\[\]\s*=\s*\[\];/g, 'private List<$2> $1 = new List<$2>();')
        .replace(/(\w+)\(([^)]*)\):\s*void/g, 'public void $1($2)')
        .replace(/(\w+)\(([^)]*)\):\s*(\w+)/g, 'public $3 $1($2)')
        .replace(/(\w+)\s*\|\s*undefined/g, '$1?')
        .replace(/this\.(\w+)\.push\(([^)]+)\);/g, 'this.$1.Add($2);')
        .replace(/this\.(\w+)\.find\((\w+)\s*=>\s*([^)]+)\)/g, 'this.$1.FirstOrDefault($2 => $3)')
        .replace(/\.\.\./g, '');
    
    return csharpCode;
}

// Helper function to convert TypeScript types to C# types
function convertTypeToCSharp(type) {
    const typeMap = {
        'number': 'int',
        'string': 'string',
        'boolean': 'bool',
        'void': 'void'
    };
    return typeMap[type] || type;
}

// Helper function to convert TypeScript parameters to C# parameters
function convertParamsToCSharp(params) {
    if (!params.trim()) return '';
    
    return params.split(',').map(param => {
        const trimmed = param.trim();
        // Handle typed parameters like "n: number"
        const match = trimmed.match(/(\w+)\s*:\s*(\w+)/);
        if (match) {
            const [, paramName, paramType] = match;
            return `${convertTypeToCSharp(paramType)} ${paramName}`;
        }
        return trimmed;
    }).join(', ');
}

// TypeScript to Python conversion
function convertTypeScriptToPython(code) {
    let pythonCode = `# Converted from TypeScript to Python
from typing import List, Optional
from dataclasses import dataclass

`;
    
    pythonCode += code
        .replace(/interface\s+(\w+)\s*{([^}]*)}/gs, (match, name, body) => {
            let classBody = body
                .replace(/(\w+):\s*number;/g, '    $1: int')
                .replace(/(\w+):\s*string;/g, '    $1: str')
                .replace(/(\w+):\s*boolean;/g, '    $1: bool')
                .replace(/(\w+):\s*(\w+)\[\];/g, '    $1: List[$2]')
                .replace(/(\w+):\s*(\w+);/g, '    $1: $2');
            
            return `@dataclass\nclass ${name}:${classBody}`;
        })
        .replace(/class\s+(\w+)\s*{/g, 'class $1:')
        .replace(/private\s+(\w+):\s*(\w+)\[\]\s*=\s*\[\];/g, '    def __init__(self):\n        self.$1: List[$2] = []')
        .replace(/(\w+)\(([^)]*)\):\s*void/g, '    def $1(self, $2):')
        .replace(/(\w+)\(([^)]*)\):\s*(\w+)/g, '    def $1(self, $2) -> $3:')
        .replace(/:\s*number/g, ': int')
        .replace(/:\s*string/g, ': str')
        .replace(/:\s*boolean/g, ': bool')
        .replace(/(\w+)\s*\|\s*undefined/g, 'Optional[$1]')
        .replace(/this\.(\w+)\.push\(([^)]+)\);/g, '        self.$1.append($2)')
        .replace(/this\.(\w+)\.find\((\w+)\s*=>\s*([^)]+)\)/g, 'next(($2 for $2 in self.$1 if $3), None)')
        .replace(/this\./g, 'self.')
        .replace(/{\s*$/gm, ':')
        .replace(/}\s*$/gm, '')
        .replace(/;$/gm, '')
        .replace(/let\s+/g, '')
        .replace(/const\s+/g, '');
    
    return pythonCode;
}

// JavaScript to TypeScript conversion
function convertJavaScriptToTypeScript(code) {
    return `// Converted from JavaScript to TypeScript
${code}
    `.replace(/function\s+(\w+)\s*\(/g, 'function $1(')
     .replace(/(\w+)\s*\(/g, '$1(')
     .replace(/\)\s*{/g, '): any {')
     .replace(/let\s+(\w+)\s*=/g, 'let $1: any =')
     .replace(/const\s+(\w+)\s*=/g, 'const $1: any =')
     .replace(/var\s+(\w+)\s*=/g, 'let $1: any =');
}

// Generic conversion fallback
function genericConversion(code, fromLang, toLang) {
    const fromTemplate = languageTemplates[fromLang];
    const toTemplate = languageTemplates[toLang];
    
    let converted = `${toTemplate.comment} Converted from ${fromTemplate.name} to ${toTemplate.name}\n`;
    converted += `${toTemplate.comment} Note: This is a basic conversion. Manual review required.\n\n`;
    converted += code;
    
    return converted;
}

// Add additional conversion functions for other language pairs
function convertJavaScriptToJava(code) {
    return convertTypeScriptToJava(code.replace(/var\s+/g, 'let '));
}

function convertJavaScriptToCSharp(code) {
    return convertTypeScriptToCSharp(code.replace(/var\s+/g, 'let '));
}

function convertJavaScriptToPython(code) {
    return convertTypeScriptToPython(code.replace(/var\s+/g, 'let '));
}

function convertJavaToTypeScript(code) {
    return `// Converted from Java to TypeScript
${code}
    `.replace(/public\s+class\s+(\w+)/g, 'class $1')
     .replace(/public\s+(\w+)\s+(\w+)\s*\(/g, '$2(')
     .replace(/private\s+(\w+)\s+(\w+);/g, 'private $2: $1;')
     .replace(/int/g, 'number')
     .replace(/String/g, 'string')
     .replace(/boolean/g, 'boolean');
}

function convertJavaToCSharp(code) {
    return code.replace(/public\s+class/g, 'public class')
               .replace(/System\.out\.println/g, 'Console.WriteLine');
}

function convertJavaToPython(code) {
    return `# Converted from Java to Python
${code}
    `.replace(/public\s+class\s+(\w+)\s*{/g, 'class $1:')
     .replace(/public\s+(\w+)\s+(\w+)\s*\(/g, '    def $2(self, ')
     .replace(/private\s+(\w+)\s+(\w+);/g, '        # $2: $1')
     .replace(/System\.out\.println\(([^)]+)\);/g, 'print($1)')
     .replace(/{\s*$/gm, ':')
     .replace(/}\s*$/gm, '')
     .replace(/;$/gm, '');
}

function convertCSharpToJava(code) {
    return code.replace(/using\s+System;/g, 'import java.util.*;')
               .replace(/Console\.WriteLine/g, 'System.out.println')
               .replace(/string/g, 'String')
               .replace(/bool/g, 'boolean');
}

function convertCSharpToTypeScript(code) {
    return `// Converted from C# to TypeScript
${code}
    `.replace(/public\s+class\s+(\w+)/g, 'class $1')
     .replace(/public\s+(\w+)\s+(\w+)\s*\(/g, '$2(')
     .replace(/private\s+(\w+)\s+(\w+);/g, 'private $2: $1;')
     .replace(/string/g, 'string')
     .replace(/bool/g, 'boolean')
     .replace(/int/g, 'number');
}

function convertCSharpToPython(code) {
    return convertJavaToPython(code.replace(/string/g, 'String').replace(/bool/g, 'boolean'));
}

function convertPythonToJava(code) {
    return `// Converted from Python to Java
import java.util.*;

public class ConvertedClass {
${code}
}`.replace(/def\s+(\w+)\s*\(/g, '    public void $1(')
   .replace(/class\s+(\w+):/g, 'public class $1 {')
   .replace(/print\(([^)]+)\)/g, 'System.out.println($1);')
   .replace(/:\s*$/gm, ' {')
   .replace(/^(\s+)/gm, '$1    ');
}

function convertPythonToTypeScript(code) {
    return `// Converted from Python to TypeScript
${code}
    `.replace(/def\s+(\w+)\s*\(/g, '$1(')
     .replace(/class\s+(\w+):/g, 'class $1 {')
     .replace(/print\(([^)]+)\)/g, 'console.log($1);')
     .replace(/:\s*$/gm, ' {')
     .replace(/self\./g, 'this.')
     .replace(/Self/g, 'this');
}

function convertPythonToCSharp(code) {
    return `// Converted from Python to C#
using System;

${code}
    `.replace(/def\s+(\w+)\s*\(/g, 'public void $1(')
     .replace(/class\s+(\w+):/g, 'public class $1 {')
     .replace(/print\(([^)]+)\)/g, 'Console.WriteLine($1);')
     .replace(/:\s*$/gm, ' {')
     .replace(/self\./g, 'this.');
}

// Additional language conversions can be added here...
function convertTypeScriptToCpp(code) {
    return genericConversion(code, 'typescript', 'cpp');
}

function convertTypeScriptToGo(code) {
    return genericConversion(code, 'typescript', 'go');
}

function convertTypeScriptToRust(code) {
    return genericConversion(code, 'typescript', 'rust');
}

// Monaco Editor language mapping
const monacoLanguageMap = {
    'typescript': 'typescript',
    'javascript': 'javascript',
    'java': 'java',
    'csharp': 'csharp',
    'python': 'python',
    'cpp': 'cpp',
    'go': 'go',
    'rust': 'rust'
};

// Initialize Monaco Editor
function initializeMonacoEditors() {
    require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' }});
    
    require(['vs/editor/editor.main'], function () {
        monacoLoaded = true;
        
        // Default TypeScript code
        const defaultCode = `// Example TypeScript palindrome function
function isPalindrome(n: number): boolean {
    const original = n;
    const noOfDigits = n.toString().length;
    let reversed = 0;

    while (n > 0) {
        const digit = n % 10;
        reversed = reversed * 10 + digit;
        n = Math.floor(n / 10);
    }
    return original === reversed;
}`;

        // Configure Monaco theme
        monaco.editor.defineTheme('custom-theme', {
            base: 'vs',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '6a737d' },
                { token: 'keyword', foreground: 'd73a49' },
                { token: 'string', foreground: '032f62' },
                { token: 'number', foreground: '005cc5' },
            ],
            colors: {
                'editor.background': '#ffffff',
                'editor.foreground': '#24292e',
                'editorLineNumber.foreground': '#d1d9e0',
                'editorCursor.foreground': '#044289',
                'editor.selectionBackground': '#c8d6ec',
                'editor.lineHighlightBackground': '#f6f8fa'
            }
        });
        
        // Source editor (editable)
        monacoEditors.source = monaco.editor.create(document.getElementById('source-editor'), {
            value: defaultCode,
            language: 'typescript',
            theme: 'custom-theme',
            fontSize: 14,
            lineHeight: 1.6,
            automaticLayout: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            bracketPairColorization: { enabled: true },
            matchBrackets: 'always',
            renderLineHighlight: 'line',
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            contextmenu: true,
            selectOnLineNumbers: true,
            glyphMargin: false,
            folding: true,
            lineNumbers: 'on',
            renderWhitespace: 'selection'
        });

        // Target editor 1 (read-only)
        monacoEditors.target1 = monaco.editor.create(document.getElementById('target1-editor'), {
            value: '// Converted code will appear here...',
            language: 'java',
            theme: 'custom-theme',
            fontSize: 14,
            lineHeight: 1.6,
            automaticLayout: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            readOnly: true,
            bracketPairColorization: { enabled: true },
            matchBrackets: 'always',
            renderLineHighlight: 'none',
            contextmenu: true,
            selectOnLineNumbers: true,
            glyphMargin: false,
            folding: true,
            lineNumbers: 'on'
        });

        // Target editor 2 (read-only)
        monacoEditors.target2 = monaco.editor.create(document.getElementById('target2-editor'), {
            value: '// Converted code will appear here...',
            language: 'csharp',
            theme: 'custom-theme',
            fontSize: 14,
            lineHeight: 1.6,
            automaticLayout: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            readOnly: true,
            bracketPairColorization: { enabled: true },
            matchBrackets: 'always',
            renderLineHighlight: 'none',
            contextmenu: true,
            selectOnLineNumbers: true,
            glyphMargin: false,
            folding: true,
            lineNumbers: 'on'
        });

        // Add keyboard shortcuts
        monacoEditors.source.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, function() {
            convertCode();
        });

        setTimeout(() => updateStatus('Ready to convert', 'info'), 2000);
    });
}

// Update editor language when dropdown changes
function updateEditorLanguage(editorType, language) {
    if (monacoLoaded && monacoEditors[editorType]) {
        const monacoLang = monacoLanguageMap[language] || language;
        monaco.editor.setModelLanguage(monacoEditors[editorType].getModel(), monacoLang);
    }
}

// Settings panel functions
function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        checkOllamaStatus(); // Check status when opening
    } else {
        panel.style.display = 'none';
    }
}

async function checkOllamaStatus() {
    const statusElement = document.getElementById('ollama-status');
    statusElement.textContent = 'Checking...';
    statusElement.className = 'status-badge checking';
    
    try {
        const isAvailable = await checkOllamaAvailability();
        if (isAvailable) {
            statusElement.textContent = 'Online';
            statusElement.className = 'status-badge online';
            
            // Load available models
            const models = await getOllamaModels();
            updateModelDropdown(models);
            updateStatus('Ollama is connected and ready', 'success');
        } else {
            statusElement.textContent = 'Offline';
            statusElement.className = 'status-badge offline';
            updateStatus('Ollama is not available - using fallback conversion', 'info');
        }
    } catch (error) {
        statusElement.textContent = 'Error';
        statusElement.className = 'status-badge offline';
        updateStatus('Error checking Ollama status', 'error');
    }
}

function updateModelDropdown(availableModels) {
    const modelSelect = document.getElementById('ollama-model');
    const currentSelection = modelSelect.value;
    
    // Clear existing options
    modelSelect.innerHTML = '';
    
    // Add available models
    availableModels.forEach(model => {
        const option = document.createElement('option');
        option.value = model.name;
        option.textContent = `${model.name} (${(model.size / (1024**3)).toFixed(1)}GB)`;
        modelSelect.appendChild(option);
    });
    
    // Add default models if none found
    if (availableModels.length === 0) {
        OLLAMA_MODELS.forEach(modelName => {
            const option = document.createElement('option');
            option.value = modelName;
            option.textContent = modelName;
            modelSelect.appendChild(option);
        });
    }
    
    // Restore selection if it exists
    if (currentSelection) {
        modelSelect.value = currentSelection;
    }
}

function updateOllamaModel() {
    const modelSelect = document.getElementById('ollama-model');
    OLLAMA_CONFIG.model = modelSelect.value;
    console.log('Updated model to:', OLLAMA_CONFIG.model); // ← Add this debug line
    updateStatus(`Switched to model: ${modelSelect.value}`, 'info');
}

function updateOllamaUrl() {
    const urlInput = document.getElementById('ollama-url');
    OLLAMA_CONFIG.baseUrl = urlInput.value;
    updateStatus(`Updated Ollama URL to: ${urlInput.value}`, 'info');
    checkOllamaStatus(); // Recheck with new URL
}

function updateConfidenceThreshold() {
    const slider = document.getElementById('confidence-threshold');
    const valueDisplay = document.getElementById('confidence-value');
    const value = parseFloat(slider.value);
    
    learningSystem.confidenceThreshold = value;
    valueDisplay.textContent = `${Math.round(value * 100)}%`;
    
    updateStatus(`Confidence threshold set to ${Math.round(value * 100)}%`, 'info');
    saveLearningData();
}

function resetLearningData() {
    if (confirm('Are you sure you want to reset all learning data? This cannot be undone.')) {
        learningSystem.learningStats = {
            totalConversions: 0,
            manualSuccesses: 0,
            aiCorrections: 0,
            currentConfidence: 0.3
        };
        learningSystem.learnedPatterns.clear();
        learningSystem.conversionHistory = [];
        
        localStorage.removeItem('codeConvertLearningData');
        updateLearningStats();
        updateStatus('Learning data reset successfully', 'success');
    }
}

function updateLearningMode() {
    const selectedMode = document.querySelector('input[name="learning-mode"]:checked')?.value;
    
    switch(selectedMode) {
        case 'adaptive':
            learningSystem.enabled = true;
            updateStatus('Adaptive learning enabled - System will learn from AI corrections', 'success');
            break;
        case 'always-ai':
            learningSystem.enabled = false;
            updateStatus('Always AI mode - Will use AI for all conversions', 'info');
            break;
        case 'disabled':
            learningSystem.enabled = false;
            updateStatus('Learning disabled - Using manual conversion only', 'info');
            break;
    }
    
    saveLearningData();
}

function isLearningEnabled() {
    const selectedMode = document.querySelector('input[name="learning-mode"]:checked')?.value;
    return selectedMode === 'adaptive';
}

function isAlwaysAIMode() {
    const selectedMode = document.querySelector('input[name="learning-mode"]:checked')?.value;
    return selectedMode === 'always-ai';
}

// Check if manual conversion is preferred
function isManualConversionPreferred() {
    const manualRadio = document.querySelector('input[name="conversion-method"][value="manual"]');
    return manualRadio && manualRadio.checked;
}

// Adaptive Learning System Functions
function generatePatternKey(sourceCode, fromLang, toLang) {
    // Create a simplified key for pattern matching
    const codeSignature = sourceCode
        .replace(/\s+/g, ' ')
        .replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, 'IDENTIFIER')
        .replace(/\d+/g, 'NUMBER')
        .replace(/["'].*?["']/g, 'STRING')
        .trim();
    
    return `${fromLang}->${toLang}:${codeSignature}`;
}

function calculateCodeSimilarity(code1, code2) {
    const normalize = (code) => code.replace(/\s+/g, ' ').trim().toLowerCase();
    const n1 = normalize(code1);
    const n2 = normalize(code2);
    
    if (n1 === n2) return 1.0;
    
    // Simple similarity based on shared tokens
    const tokens1 = n1.split(' ');
    const tokens2 = n2.split(' ');
    const intersection = tokens1.filter(token => tokens2.includes(token));
    
    return intersection.length / Math.max(tokens1.length, tokens2.length);
}

function shouldUseAI(sourceCode, fromLang, toLang) {
    // Always use AI if in always-ai mode
    if (isAlwaysAIMode()) return true;
    
    // Never use AI if learning is disabled and not in always-ai mode
    if (!isLearningEnabled()) return false;
    
    // Check if we have a learned pattern for this type of code
    const patternKey = generatePatternKey(sourceCode, fromLang, toLang);
    if (learningSystem.learnedPatterns.has(patternKey)) {
        return false; // Use cached pattern
    }
    
    // Check confidence level
    return learningSystem.learningStats.currentConfidence < learningSystem.confidenceThreshold;
}

async function adaptiveLearningConversion(sourceCode, fromLang, toLang) {
    if (fromLang === toLang) {
        return sourceCode;
    }
    
    const patternKey = generatePatternKey(sourceCode, fromLang, toLang);
    
    // Check if we have a learned pattern first
    if (learningSystem.learnedPatterns.has(patternKey)) {
        updateStatus('Using learned pattern (no AI needed)', 'success');
        return learningSystem.learnedPatterns.get(patternKey);
    }
    
    let manualResult = null;
    let aiResult = null;
    
    try {
        // Always try manual conversion first
        const conversionMap = conversionMappings[fromLang];
        if (conversionMap && conversionMap[toLang]) {
            manualResult = conversionMap[toLang](sourceCode);
        } else {
            manualResult = genericConversion(sourceCode, fromLang, toLang);
        }
        
        // Decide if we need AI verification
        if (shouldUseAI(sourceCode, fromLang, toLang)) {
            updateStatus('Getting AI verification...', 'loading');
            
            try {
                aiResult = await convertWithOllama(sourceCode, fromLang, toLang);
                
                // Compare results and learn
                await learnFromComparison(sourceCode, fromLang, toLang, manualResult, aiResult, patternKey);
                
                return aiResult; // Use AI result for now
            } catch (aiError) {
                learningSystem.learningStats.manualSuccesses++;
                updateLearningStats();
                return manualResult;
            }
        } else {
            // High confidence in manual conversion
            learningSystem.learningStats.manualSuccesses++;
            updateLearningStats();
            updateStatus('High confidence - using manual conversion', 'success');
            return manualResult;
        }
        
    } catch (error) {
        return manualResult || genericConversion(sourceCode, fromLang, toLang);
    }
}

async function learnFromComparison(sourceCode, fromLang, toLang, manualResult, aiResult, patternKey) {
    const similarity = calculateCodeSimilarity(manualResult, aiResult);
    
    learningSystem.learningStats.totalConversions++;
    
    if (similarity > 0.8) {
        // Manual conversion was good enough
        learningSystem.learningStats.manualSuccesses++;
        learningSystem.learnedPatterns.set(patternKey, manualResult);
        updateStatus('Manual conversion verified ✓ - Pattern learned', 'success');
    } else {
        // AI provided better conversion - learn from it
        learningSystem.learningStats.aiCorrections++;
        learningSystem.learnedPatterns.set(patternKey, aiResult);
        
        // Try to extract new conversion rules
        await extractNewRules(sourceCode, fromLang, toLang, manualResult, aiResult);
        updateStatus('AI correction applied - New pattern learned', 'info');
    }
    
    updateLearningStats();
    saveLearningData();
}

async function extractNewRules(sourceCode, fromLang, toLang, manualResult, aiResult) {
    // Analyze differences to create new conversion rules
    const differences = findConversionDifferences(manualResult, aiResult);
    
    if (differences.length > 0) {
        // Store improvement patterns for future use
        const improvementKey = `improvement_${fromLang}_${toLang}_${Date.now()}`;
        learningSystem.conversionHistory.push({
            key: improvementKey,
            source: sourceCode,
            fromLang,
            toLang,
            manualResult,
            aiResult,
            differences,
            timestamp: Date.now()
        });
        
        // Keep only recent improvements (limit memory usage)
        if (learningSystem.conversionHistory.length > 100) {
            learningSystem.conversionHistory = learningSystem.conversionHistory.slice(-50);
        }
    }
}

function findConversionDifferences(manual, ai) {
    const differences = [];
    
    // Simple pattern detection - can be enhanced
    const manualLines = manual.split('\n');
    const aiLines = ai.split('\n');
    
    // Check for import/using statements
    const aiImports = aiLines.filter(line => 
        line.trim().startsWith('import ') || 
        line.trim().startsWith('using ') ||
        line.trim().startsWith('#include') ||
        line.trim().startsWith('from ')
    );
    
    const manualImports = manualLines.filter(line => 
        line.trim().startsWith('import ') || 
        line.trim().startsWith('using ') ||
        line.trim().startsWith('#include') ||
        line.trim().startsWith('from ')
    );
    
    if (aiImports.length > manualImports.length) {
        differences.push({
            type: 'missing_imports',
            manual: manualImports,
            ai: aiImports
        });
    }
    
    // Check for type annotations
    const aiTypes = ai.match(/:\s*\w+/g) || [];
    const manualTypes = manual.match(/:\s*\w+/g) || [];
    
    if (aiTypes.length > manualTypes.length) {
        differences.push({
            type: 'better_typing',
            improvement: 'AI added more type annotations'
        });
    }
    
    return differences;
}

function updateLearningStats() {
    const stats = learningSystem.learningStats;
    
    if (stats.totalConversions > 0) {
        stats.currentConfidence = stats.manualSuccesses / stats.totalConversions;
    }
    
    // Update UI if stats panel exists
    const statsElement = document.getElementById('learning-stats');
    if (statsElement) {
        statsElement.innerHTML = `
            <strong>Learning Progress:</strong><br>
            Total Conversions: ${stats.totalConversions}<br>
            Manual Success Rate: ${(stats.currentConfidence * 100).toFixed(1)}%<br>
            AI Corrections: ${stats.aiCorrections}<br>
            Learned Patterns: ${learningSystem.learnedPatterns.size}
        `;
    }
}

function saveLearningData() {
    try {
        const dataToSave = {
            stats: learningSystem.learningStats,
            patterns: Array.from(learningSystem.learnedPatterns.entries()),
            history: learningSystem.conversionHistory.slice(-20) // Save only recent history
        };
        
        localStorage.setItem('codeConvertLearningData', JSON.stringify(dataToSave));
    } catch (error) {
        // Silently fail if localStorage is not available
    }
}

function loadLearningData() {
    try {
        const saved = localStorage.getItem('codeConvertLearningData');
        if (saved) {
            const data = JSON.parse(saved);
            
            learningSystem.learningStats = { ...learningSystem.learningStats, ...data.stats };
            learningSystem.learnedPatterns = new Map(data.patterns || []);
            learningSystem.conversionHistory = data.history || [];
            
            updateStatus(`Loaded ${learningSystem.learnedPatterns.size} learned patterns`, 'success');
            updateLearningStats();
        }
    } catch (error) {
        // Silently fail if localStorage is not available
    }
}

// Update the main conversion function to use adaptive learning
async function convertToLanguageWithPreference(sourceCode, fromLang, toLang) {
    if (fromLang === toLang) {
        return sourceCode;
    }
    
    if (isManualConversionPreferred()) {
        // Use manual conversion only
        const conversionMap = conversionMappings[fromLang];
        if (conversionMap && conversionMap[toLang]) {
            return conversionMap[toLang](sourceCode);
        }
        return genericConversion(sourceCode, fromLang, toLang);
    }
    
    // Use adaptive learning system
    return await adaptiveLearningConversion(sourceCode, fromLang, toLang);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Monaco Editor
    if (typeof require !== 'undefined') {
        initializeMonacoEditors();
    } else {
        // Fallback: wait for the script to load
        setTimeout(initializeMonacoEditors, 500);
    }
    
    // Load learning data and check Ollama status
    loadLearningData();
    setTimeout(checkOllamaStatus, 1000);
    
    // Add keyboard shortcut for conversion (Ctrl+Enter) - fallback for non-Monaco
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            convertCode();
        }
    });
    
    // Language change handlers
    document.getElementById('source-language').addEventListener('change', function() {
        updateEditorLanguage('source', this.value);
        updateStatus('Source language changed to ' + languageTemplates[this.value].name, 'info');
    });
    
    document.getElementById('target1-language').addEventListener('change', function() {
        updateEditorLanguage('target1', this.value);
        updateStatus('Target language 1 changed to ' + languageTemplates[this.value].name, 'info');
    });
    
    document.getElementById('target2-language').addEventListener('change', function() {
        updateEditorLanguage('target2', this.value);
        updateStatus('Target language 2 changed to ' + languageTemplates[this.value].name, 'info');
    });
    
    // Settings panel event listeners
    document.addEventListener('click', function(e) {
        if (e.target.name === 'conversion-method') {
            const method = e.target.value;
            updateStatus(`Conversion method set to: ${method === 'ollama' ? 'AI-Powered' : 'Manual Rules'}`, 'info');
        }
        
        if (e.target.name === 'learning-mode') {
            updateLearningMode();
        }
    });
});
