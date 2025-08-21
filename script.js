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

// Editor health monitoring
let editorUpdateCount = 0;
let editorErrorCount = 0;
let lastHealthCheck = 0;

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

// Robust editor update with multiple fallback methods
function robustEditorUpdate(editor, content, targetId) {
    console.log(`robustEditorUpdate called for ${targetId} with content length:`, content.length);
    
    try {
        // First try: direct update
        editor.setValue(content);
        console.log(`Direct update successful for ${targetId}`);
        logEditorUpdate(true);
        return true;
    } catch (error) {
        console.warn(`Direct update failed for ${targetId}, trying model update:`, error);
        
        try {
            // Second try: model update
            const model = editor.getModel();
            if (model) {
                model.setValue(content);
                console.log(`Model update successful for ${targetId}`);
                logEditorUpdate(true);
                return true;
            }
        } catch (modelError) {
            console.warn(`Model update also failed for ${targetId}:`, modelError);
        }
        
        // Third try: force refresh and retry
        try {
            console.log(`Attempting refresh and retry for ${targetId}`);
            editor.layout();
            setTimeout(() => {
                try {
                    editor.setValue(content);
                    console.log(`Refresh retry successful for ${targetId}`);
                    logEditorUpdate(true);
                } catch (finalError) {
                    console.error(`All update methods failed for ${targetId}:`, finalError);
                    logEditorUpdate(false);
                    // Fallback to textarea
                    fallbackToTextarea(content, targetId);
                }
            }, 100);
        } catch (refreshError) {
            console.error(`Refresh failed for ${targetId}:`, refreshError);
            logEditorUpdate(false);
            // Fallback to textarea
            fallbackToTextarea(content, targetId);
        }
        
        return false;
    }
}

// Monitor editor performance
function logEditorUpdate(success) {
    if (success) {
        editorUpdateCount++;
    } else {
        editorErrorCount++;
    }
    
    // Log warning if error rate is high
    if (editorErrorCount > 0 && editorUpdateCount > 10) {
        const errorRate = editorErrorCount / (editorUpdateCount + editorErrorCount);
        if (errorRate > 0.1) { // 10% error rate
            console.warn('High editor error rate detected:', (errorRate * 100).toFixed(1) + '%');
            updateStatus('High editor error rate detected - consider refreshing', 'warning');
        }
    }
    
    // Log statistics every 50 updates
    if ((editorUpdateCount + editorErrorCount) % 50 === 0) {
        console.log('Editor statistics:', {
            totalUpdates: editorUpdateCount + editorErrorCount,
            successfulUpdates: editorUpdateCount,
            failedUpdates: editorErrorCount,
            successRate: ((editorUpdateCount / (editorUpdateCount + editorErrorCount)) * 100).toFixed(1) + '%'
        });
    }
}

// Enhanced fallback to textarea if Monaco fails
function fallbackToTextarea(content, targetId) {
    console.log(`Falling back to textarea for: ${targetId}`);
    
    // Find the Monaco editor container and hide it
    const monacoContainer = document.querySelector(`#${targetId}`);
    if (monacoContainer) {
        // Hide the Monaco editor
        const monacoEditor = monacoContainer.querySelector('.monaco-editor');
        if (monacoEditor) {
            monacoEditor.style.display = 'none';
        }
        
        // Create or show textarea
        let textarea = monacoContainer.querySelector('.fallback-textarea');
        if (!textarea) {
            textarea = document.createElement('textarea');
            textarea.className = 'fallback-textarea code-editor';
            textarea.style.display = 'block';
            textarea.style.width = '100%';
            textarea.style.minHeight = '300px';
            textarea.style.fontFamily = 'Monaco, Menlo, Ubuntu Mono, monospace';
            textarea.style.fontSize = '14px';
            textarea.style.padding = '15px';
            textarea.style.border = '1px solid #ddd';
            textarea.style.borderRadius = '8px';
            textarea.style.backgroundColor = '#fafbfc';
            textarea.style.resize = 'vertical';
            textarea.readOnly = true;
            monacoContainer.appendChild(textarea);
        }
        
        textarea.value = content;
        textarea.style.display = 'block';
        console.log(`Fallback textarea created and populated for ${targetId}`);
        updateStatus(`Using fallback textarea for ${targetId} - Monaco editor failed to update`, 'warning');
    }
}

// Validate conversion results before displaying
function validateConversionResult(result) {
    if (!result || result.trim().length < 10) {
        throw new Error('Conversion result too short or empty');
    }
    if (result.includes('...') || result.includes('IDENTIFIER')) {
        throw new Error('Conversion result contains placeholder text');
    }
    if (result.includes('Converted to') && result.length < 50) {
        throw new Error('Conversion result appears incomplete - AI may have failed');
    }
    
    // Check if result is just a comment header
    const lines = result.split('\n').filter(line => line.trim().length > 0);
    if (lines.length <= 2 && lines.every(line => line.trim().startsWith('//') || line.trim().startsWith('#'))) {
        throw new Error('Conversion result is only comment headers - no actual code generated');
    }
    
    return result;
}

// Add retry mechanism for editor updates
async function updateEditorWithRetry(editor, content, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            editor.setValue(content);
            return true;
        } catch (error) {
            console.warn(`Editor update attempt ${i + 1} failed:`, error);
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
        }
    }
}

// Check editor health
function checkEditorHealth() {
    const now = Date.now();
    if (now - lastHealthCheck < 5000) { // Only check every 5 seconds
        return true;
    }
    lastHealthCheck = now;
    
    if (!monacoLoaded || !monacoEditors.target1 || !monacoEditors.target2) {
        console.warn('Editor health check failed - reinitializing...');
        updateStatus('Editor health check failed - reinitializing...', 'warning');
        setTimeout(() => {
            if (typeof require !== 'undefined') {
                initializeMonacoEditors();
            }
        }, 1000);
        return false;
    }
    
    // Test if editors are responsive
    try {
        monacoEditors.target1.getValue();
        monacoEditors.target2.getValue();
        return true;
    } catch (error) {
        console.warn('Editor responsiveness check failed:', error);
        updateStatus('Editor responsiveness check failed - reinitializing...', 'warning');
        setTimeout(() => {
            if (typeof require !== 'undefined') {
                initializeMonacoEditors();
            }
        }, 1000);
        return false;
    }
}

// Manual health check function
function manualHealthCheck() {
    console.log('Manual health check triggered...');
    updateStatus('Running manual health check...', 'loading');
    
    const health = checkEditorHealth();
    
    if (health) {
        updateStatus('Editor health check passed ✓', 'success');
        
        // Show statistics
        const stats = {
            totalUpdates: editorUpdateCount + editorErrorCount,
            successfulUpdates: editorUpdateCount,
            failedUpdates: editorErrorCount,
            successRate: editorUpdateCount + editorErrorCount > 0 ? 
                ((editorUpdateCount / (editorUpdateCount + editorErrorCount)) * 100).toFixed(1) + '%' : 'N/A'
        };
        
        console.log('Editor health statistics:', stats);
        alert(`Editor Health Check Results:\n\n` +
              `Total Updates: ${stats.totalUpdates}\n` +
              `Successful: ${stats.successfulUpdates}\n` +
              `Failed: ${stats.failedUpdates}\n` +
              `Success Rate: ${stats.successRate}\n\n` +
              `Status: HEALTHY ✓`);
    } else {
        updateStatus('Editor health check failed - reinitializing...', 'warning');
        alert('Editor health check failed. The system will attempt to reinitialize the editors automatically.');
    }
}

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
    console.log('convertCode() called'); // Debug log
    
    if (isConverting) {
        console.log('Already converting, returning early'); // Debug log
        return;
    }
    
    // Health check before conversion
    if (!checkEditorHealth()) {
        updateStatus('Editor health check failed - please wait for reinitialization', 'warning');
        return;
    }
    
    let sourceCode = '';
    if (monacoLoaded && monacoEditors.source) {
        sourceCode = monacoEditors.source.getValue().trim();
        console.log('Got source code from Monaco editor:', sourceCode.substring(0, 100) + '...'); // Debug log
    } else {
        const sourceEditor = document.getElementById('source-editor');
        sourceCode = (sourceEditor.value || '').trim();
        console.log('Got source code from fallback editor:', sourceCode.substring(0, 100) + '...'); // Debug log
    }
    
    const sourceLang =  document.getElementById('source-language').value;
    const target1Lang = document.getElementById('target1-language').value;
    const target2Lang = document.getElementById('target2-language').value;
    
    console.log('Languages:', { sourceLang, target1Lang, target2Lang }); // Debug log
    
    if (!sourceCode) {
        console.log('No source code found'); // Debug log
        updateStatus('Please enter source code first', 'error');
        return;
    }
    
    if (sourceLang === target1Lang || sourceLang === target2Lang) {
        console.log('Target languages same as source'); // Debug log
        updateStatus('Target languages must be different from source', 'error');
        return;
    }
    
    isConverting = true;
    const convertBtn = document.getElementById('convert-btn');
    convertBtn.disabled = true;
    
    updateStatus('Converting code...', 'loading');
    console.log('Starting conversion...'); // Debug log
    
    // Clear target editors to show converting status
    clearTargetEditors();
    
    try {
        // Convert to target languages
        console.log('Converting to target1:', target1Lang); // Debug log
        const conversion1 = await convertToLanguageWithPreference(sourceCode, sourceLang, target1Lang);
        
        // Validate conversion result
        try {
            validateConversionResult(conversion1);
            console.log('Conversion 1 result validated successfully'); // Debug log
        } catch (validationError) {
            console.error('Conversion 1 validation failed:', validationError);
            updateStatus('Conversion 1 validation failed - using manual conversion', 'warning');
            // Use manual conversion as fallback
            conversion1 = forceManualConversion(sourceCode, sourceLang, target1Lang);
        }
        
        console.log('Conversion 1 result:', conversion1.substring(0, 100) + '...'); // Debug log
        
        console.log('Converting to target2:', target2Lang); // Debug log
        const conversion2 = await convertToLanguageWithPreference(sourceCode, sourceLang, target2Lang);
        
        // Validate conversion result
        try {
            validateConversionResult(conversion2);
            console.log('Conversion 2 result validated successfully'); // Debug log
        } catch (validationError) {
            console.error('Conversion 2 validation failed:', validationError);
            updateStatus('Conversion 2 validation failed - using manual conversion', 'warning');
            // Use manual conversion as fallback
            conversion2 = forceManualConversion(sourceCode, sourceLang, target2Lang);
        }
        
        console.log('Conversion 2 result:', conversion2.substring(0, 100) + '...'); // Debug log
        
        // Update target editors using robust update
        if (monacoLoaded && monacoEditors.target1) {
            console.log('Updating Monaco editors using robust update'); // Debug log
            console.log('Target1 editor instance:', monacoEditors.target1); // Debug log
            console.log('Target2 editor instance:', monacoEditors.target2); // Debug log
            console.log('Setting target1 value to:', conversion1.substring(0, 200) + '...'); // Debug log
            console.log('Setting target2 value to:', conversion2.substring(0, 200) + '...'); // Debug log
            
            // Try robust update first
            const target1Success = robustEditorUpdate(monacoEditors.target1, conversion1, 'target1-editor');
            const target2Success = robustEditorUpdate(monacoEditors.target2, conversion2, 'target2-editor');
            
            if (target1Success && target2Success) {
                console.log('Both editors updated successfully using robust update'); // Debug log
            } else {
                console.warn('Some editors failed to update, trying force method...'); // Debug log
                // Use force method as backup
                setTimeout(() => {
                    forceContentIntoEditors(conversion1, conversion2);
                }, 500);
            }
            
        } else {
            console.log('Updating fallback editors'); // Debug log
            console.log('Monaco loaded:', monacoLoaded); // Debug log
            console.log('Target1 editor exists:', !!monacoEditors.target1); // Debug log
            console.log('Target2 editor exists:', !!monacoEditors.target2); // Debug log
            
            // Use force method which handles fallbacks
            forceContentIntoEditors(conversion1, conversion2);
        }
        
        updateStatus('Conversion completed successfully!', 'success');
        setTimeout(() => updateStatus('Ready to convert', 'info'), 3000);
        
    } catch (error) {
        console.error('Conversion error:', error); // Debug log
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

    console.log('Sending prompt to Ollama:', prompt.substring(0, 200) + '...'); // Debug log

    try {
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
        console.log('Raw Ollama response:', data); // Debug log
        
        let convertedCode = data.response || '';
        console.log('Raw converted code from Ollama:', convertedCode.substring(0, 500) + '...'); // Debug log

        // Check if Ollama returned empty or very short response
        if (!convertedCode || convertedCode.trim().length < 20) {
            console.warn('Ollama returned empty or very short response, using fallback conversion');
            throw new Error('Ollama returned empty response - using fallback conversion');
        }

        // Clean up the response
        convertedCode = cleanupOllamaResponse(convertedCode, toLang);
        console.log('Cleaned converted code:', convertedCode.substring(0, 500) + '...'); // Debug log
        
        return convertedCode;
    } catch (error) {
        console.error('Ollama API failed:', error);
        throw error;
    }
}

// Clean up Ollama response
function cleanupOllamaResponse(response, targetLang) {
    console.log('cleanupOllamaResponse called with response length:', response.length); // Debug log
    console.log('Full response:', response); // Debug log
    
    let cleaned = response.trim();
    console.log('After trim:', cleaned); // Debug log
    
    // Remove markdown code blocks if present
    cleaned = cleaned.replace(/^```[\w]*\n?/gm, '');
    cleaned = cleaned.replace(/\n?```$/gm, '');
    console.log('After removing markdown:', cleaned); // Debug log
    
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
            console.log('Stopping at line:', line); // Debug log
            break;
        }
        
        // Skip empty lines at the beginning
        if (line.trim() === '' && codeLines.length === 0) {
            continue;
        }
        
        codeLines.push(line);
    }
    
    cleaned = codeLines.join('\n').trim();
    console.log('After filtering lines:', cleaned); // Debug log
    
    // Add language-specific comment header
    const langTemplate = languageTemplates[targetLang];
    if (langTemplate) {
        const comment = `${langTemplate.comment} Converted to ${langTemplate.name} using Ollama AI`;
        cleaned = `${comment}\n\n${cleaned}`;
    }
    
    console.log('Final cleaned result length:', cleaned.length); // Debug log
    console.log('Final cleaned result:', cleaned); // Debug log
    
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
import java.util.*;
import java.util.stream.Collectors;

`;
    
    // Handle standalone functions first
    javaCode += code
        // Convert function declarations
        .replace(/function\s+(\w+)\s*\(([^)]*)\)\s*:\s*(\w+)\s*{/g, (match, funcName, params, returnType) => {
            const javaReturnType = convertTypeToJava(returnType);
            const javaParams = convertParamsToJava(params);
            return `public static ${javaReturnType} ${funcName}(${javaParams}) {`;
        })
        // Convert parameter types - handle arrays properly
        .replace(/(\w+)\s*:\s*number\[\]/g, '$1: int[]')
        .replace(/(\w+)\s*:\s*string\[\]/g, '$1: String[]')
        .replace(/(\w+)\s*:\s*boolean\[\]/g, '$1: boolean[]')
        .replace(/(\w+)\s*:\s*number/g, '$1: int')
        .replace(/(\w+)\s*:\s*string/g, '$1: String')
        .replace(/(\w+)\s*:\s*boolean/g, '$1: boolean')
        // Convert variable declarations
        .replace(/const\s+(\w+)\s*=\s*/g, 'final int $1 = ')
        .replace(/let\s+(\w+)\s*=\s*0/g, 'int $1 = 0')
        .replace(/let\s+(\w+)\s*=\s*/g, 'int $1 = ')
        // Fix array variable types - if variable is assigned from filter operation, make it int[]
        .replace(/final int (\w+) = ([^;]+)\.stream\(\)\.filter\([^)]+\)\.toArray\(\)/g, 'final int[] $1 = $2.stream().filter(x -> x > 0).toArray()')
        // Convert array operations - this is the key fix
        // Special case: convert array filter with arrow function to Java stream FIRST
        .replace(/\.filter\(x=>x>0\)/g, '.stream().filter(x -> x > 0).toArray()')
        // Then handle general filter cases
        .replace(/\.filter\(([^)]+)\)/g, '.stream().filter($1).toArray()')
        .replace(/\.length/g, '.length')
        .replace(/\.indexOf\(([^)]+)\)/g, '.indexOf($1)')
        // Convert JavaScript/TypeScript methods to Java
        .replace(/console\.log\(/g, 'System.out.println(')
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
    
    // Post-processing: Fix array variable types
    javaCode = javaCode.replace(/final int (\w+) = ([^;]+)\.stream\(\)\.filter\([^)]+\)\.toArray\(\)/g, 'final int[] $1 = $2.stream().filter(x -> x > 0).toArray()');
    
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
using System.Linq;

`;
    
    csharpCode += code
        // Convert function declarations
        .replace(/function\s+(\w+)\s*\(([^)]*)\)\s*:\s*(\w+)\s*{/g, (match, funcName, params, returnType) => {
            const csharpReturnType = convertTypeToCSharp(returnType);
            const csharpParams = convertParamsToCSharp(params);
            return `public static ${csharpReturnType} ${funcName}(${csharpParams})\n{`;
        })
        // Convert parameter types - handle arrays properly
        .replace(/(\w+)\s*:\s*number\[\]/g, '$1: int[]')
        .replace(/(\w+)\s*:\s*string\[\]/g, '$1: string[]')
        .replace(/(\w+)\s*:\s*boolean\[\]/g, '$1: bool[]')
        .replace(/(\w+)\s*:\s*number/g, '$1: int')
        .replace(/(\w+)\s*:\s*string/g, '$1: string')
        .replace(/(\w+)\s*:\s*boolean/g, '$1: bool')
        // Convert variable declarations
        .replace(/const\s+(\w+)\s*=\s*/g, 'var $1 = ')
        .replace(/let\s+(\w+)\s*=\s*/g, 'var $1 = ')
        // Convert array operations - this is the key fix
        .replace(/\.filter\(([^)]+)\)/g, '.Where($1).ToArray()')
        .replace(/\.length/g, '.Length')
        .replace(/\.indexOf\(([^)]+)\)/g, '.IndexOf($1)')
        // Special case: convert array filter with arrow function to C# LINQ
        .replace(/\.filter\(x=>x>0\)/g, '.Where(x => x > 0).ToArray()')
        // Convert JavaScript/TypeScript methods to C#
        .replace(/console\.log\(/g, 'Console.WriteLine(')
        .replace(/\.toString\(\)/g, '.ToString()')
        .replace(/Math\.floor\(/g, '(int)Math.Floor(')
        .replace(/===([^=])/g, ' == $1')
        // Convert interfaces to classes
        .replace(/interface\s+(\w+)\s*{([^}]*)}/gs, (match, name, body) => {
            let classBody = body
                .replace(/(\w+):\s*(\w+);/g, 'public $2 $1 { get; set; }')
                .replace(/(\w+):\s*(\w+)\[\];/g, 'public List<$2> $1 { get; set }')
                .replace(/(\w+):\s*number;/g, 'public int $1 { get; set }')
                .replace(/(\w+):\s*string;/g, 'public string $1 { get; set }')
                .replace(/(\w+):\s*boolean;/g, 'public bool $1 { get; set }');
            
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
    
    // Post-processing: Fix array variable types
    csharpCode = csharpCode.replace(/var (\w+) = ([^;]+)\.Where\([^)]+\)\.ToArray\(\)/g, 'int[] $1 = $2.Where(x => x > 0).ToArray()');
    
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
    console.log('initializeMonacoEditors() called'); // Debug log
    console.log('require available:', typeof require !== 'undefined'); // Debug log
    
    if (typeof require === 'undefined') {
        console.error('Monaco Editor require not available - script may not have loaded');
        updateStatus('Monaco Editor failed to load', 'error');
        return;
    }
    
    require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' }});
    
    require(['vs/editor/editor.main'], function () {
        console.log('Monaco Editor loaded successfully'); // Debug log
        monacoLoaded = true;
        
        try {
            // Default TypeScript code
            const defaultCode = `console.log('Hello');`;

            console.log('Creating Monaco editors...'); // Debug log
            
            // Verify DOM elements exist
            const sourceElement = document.getElementById('source-editor');
            const target1Element = document.getElementById('target1-editor');
            const target2Element = document.getElementById('target2-editor');
            
            console.log('Source editor element:', sourceElement); // Debug log
            console.log('Target1 editor element:', target1Element); // Debug log
            console.log('Target2 editor element:', target2Element); // Debug log
            
            if (!sourceElement || !target1Element || !target2Element) {
                console.error('One or more editor DOM elements not found!'); // Debug log
                updateStatus('Editor DOM elements not found', 'error');
                return;
            }
            
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
            console.log('Creating source editor...'); // Debug log
            monacoEditors.source = monaco.editor.create(document.getElementById('source-editor'), {
                value: defaultCode,
                language: 'typescript',
                theme: 'custom-theme',
                fontSize: 14,
                lineHeight: 1.6,
                automaticLayout: true, // Enable automatic layout updates
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
                renderWhitespace: 'selection',
                // Responsive settings
                fixedOverflowWidgets: true,
                scrollbar: {
                    vertical: 'auto',
                    horizontal: 'auto',
                    verticalScrollbarSize: 10,
                    horizontalScrollbarSize: 10
                }
            });
            console.log('Source editor created:', monacoEditors.source); // Debug log
            
            // Test if source editor is editable
            setTimeout(() => {
                if (monacoEditors.source) {
                    monacoEditors.source.focus();
                    console.log('Source editor focused and should be editable');
                    console.log('Editor value:', monacoEditors.source.getValue());
                    console.log('Editor is read-only:', monacoEditors.source.getOption(monaco.editor.EditorOption.readOnly));
                }
            }, 1000);

            // Target editor 1 (read-only)
            console.log('Creating target1 editor...'); // Debug log
            monacoEditors.target1 = monaco.editor.create(document.getElementById('target1-editor'), {
                value: '// Converted code will appear here...',
                language: 'java',
                theme: 'custom-theme',
                fontSize: 14,
                lineHeight: 1.6,
                automaticLayout: true, // Enable automatic layout updates
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
                lineNumbers: 'on',
                // Responsive settings
                fixedOverflowWidgets: true,
                scrollbar: {
                    vertical: 'auto',
                    horizontal: 'auto',
                    verticalScrollbarSize: 10,
                    horizontalScrollbarSize: 10
                }
            });
            console.log('Target1 editor created:', monacoEditors.target1); // Debug log

            // Target editor 2 (read-only)
            console.log('Creating target2 editor...'); // Debug log
            monacoEditors.target2 = monaco.editor.create(document.getElementById('target2-editor'), {
                value: '// Converted code will appear here...',
                language: 'csharp',
                theme: 'custom-theme',
                fontSize: 14,
                lineHeight: 1.6,
                automaticLayout: true, // Enable automatic layout updates
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
                lineNumbers: 'on',
                // Responsive settings
                fixedOverflowWidgets: true,
                scrollbar: {
                    vertical: 'auto',
                    horizontal: 'auto',
                    verticalScrollbarSize: 10,
                    horizontalScrollbarSize: 10
                }
            });
            console.log('Target2 editor created:', monacoEditors.target2); // Debug log

            // Add keyboard shortcuts
            monacoEditors.source.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, function() {
                convertCode();
            });

            console.log('All Monaco editors initialized successfully'); // Debug log
            updateStatus('Monaco editors ready - you can now type in the source editor', 'success');
            
        } catch (error) {
            console.error('Error creating Monaco editors:', error);
            updateStatus('Failed to create editors: ' + error.message, 'error');
        }
    }, function(error) {
        console.error('Failed to load Monaco Editor:', error);
        updateStatus('Monaco Editor failed to load: ' + error.message, 'error');
    });
}

// Update editor language when dropdown changes
function updateEditorLanguage(editorType, language) {
    if (monacoLoaded && monacoEditors[editorType]) {
        const monacoLang = monacoLanguageMap[language] || language;
        monaco.editor.setModelLanguage(monacoEditors[editorType].getModel(), monacoLang);
    }
}

// Clear target editors
function clearTargetEditors() {
    if (monacoLoaded && monacoEditors.target1 && monacoEditors.target2) {
        console.log('Clearing target editors...'); // Debug log
        
        try {
            const target1Model = monacoEditors.target1.getModel();
            const target2Model = monacoEditors.target2.getModel();
            
            if (target1Model) {
                target1Model.setValue('// Converting...');
            }
            if (target2Model) {
                target2Model.setValue('// Converting...');
            }
            
            console.log('Target editors cleared'); // Debug log
        } catch (error) {
            console.error('Error clearing target editors:', error); // Debug log
        }
    }
}

// Force refresh Monaco editors
function refreshMonacoEditors() {
    if (monacoLoaded && monacoEditors.target1 && monacoEditors.target2) {
        console.log('Refreshing Monaco editors...'); // Debug log
        
        try {
            // Force layout updates
            monacoEditors.target1.layout();
            monacoEditors.target2.layout();
            
            // Force repaint
            monacoEditors.target1.render();
            monacoEditors.target2.render();
            
            console.log('Monaco editors refreshed'); // Debug log
        } catch (error) {
            console.error('Error refreshing Monaco editors:', error);
        }
    }
}

// Check editor content
function checkEditorContent() {
    console.log('Checking editor content...'); // Debug log
    
    if (monacoLoaded && monacoEditors.target1 && monacoEditors.target2) {
        try {
            const target1Content = monacoEditors.target1.getValue();
            const target2Content = monacoEditors.target2.getValue();
            
            console.log('Target1 editor content:', target1Content); // Debug log
            console.log('Target2 editor content:', target2Content); // Debug log
            
            // Also check the model content
            const target1Model = monacoEditors.target1.getModel();
            const target2Model = monacoEditors.target2.getModel();
            
            if (target1Model) {
                console.log('Target1 model content:', target1Model.getValue()); // Debug log
            }
            if (target2Model) {
                console.log('Target2 model content:', target2Model.getValue()); // Debug log
            }
            
            // Check if editors are visible
            const target1Element = document.getElementById('target1-editor');
            const target2Element = document.getElementById('target2-editor');
            
            if (target1Element) {
                const monacoEditor1 = target1Element.querySelector('.monaco-editor');
                console.log('Target1 Monaco editor visible:', monacoEditor1 && monacoEditor1.style.display !== 'none');
            }
            
            if (target2Element) {
                const monacoEditor2 = target2Element.querySelector('.monaco-editor');
                console.log('Target2 Monaco editor visible:', monacoEditor2 && monacoEditor2.style.display !== 'none');
            }
            
            // Show content in alert for debugging
            alert(`Target1: ${target1Content.substring(0, 100)}...\nTarget2: ${target2Content.substring(0, 100)}...`);
        } catch (error) {
            console.error('Error checking editor content:', error);
            alert('Error checking editor content: ' + error.message);
        }
    } else {
        console.log('Monaco editors not available'); // Debug log
        alert('Monaco editors not available');
    }
}

// Test function to verify editor functionality
function testEditorUpdate() {
    console.log('Testing editor update...'); // Debug log
    
    // Health check before testing
    if (!checkEditorHealth()) {
        updateStatus('Editor health check failed - cannot run test', 'warning');
        return;
    }
    
    const testCode1 = `// Test Java code
public class Test {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");
    }
}`;
    
    const testCode2 = `// Test C# code
using System;

public class Test {
    public static void Main(string[] args) {
        Console.WriteLine("Hello from C#!");
    }
}`;
    
    if (monacoLoaded && monacoEditors.target1 && monacoEditors.target2) {
        console.log('Setting test code in target editors using robust update...'); // Debug log
        
        // Use robust update for both editors
        const target1Success = robustEditorUpdate(monacoEditors.target1, testCode1, 'target1-editor');
        const target2Success = robustEditorUpdate(monacoEditors.target2, testCode2, 'target2-editor');
        
        if (target1Success && target2Success) {
            console.log('Test code set successfully in both editors'); // Debug log
            updateStatus('Test completed successfully!', 'success');
        } else {
            console.warn('Some test editors failed to update'); // Debug log
            updateStatus('Test partially completed - some editors may use fallback', 'warning');
        }
        
    } else {
        console.log('Monaco editor not available for testing'); // Debug log
        console.log('Monaco loaded:', monacoLoaded); // Debug log
        console.log('Target1 editor exists:', !!monacoEditors.target1); // Debug log
        console.log('Target2 editor exists:', !!monacoEditors.target2); // Debug log
        
        // Fallback to textarea test
        const target1Element = document.getElementById('target1-editor');
        const target2Element = document.getElementById('target2-editor');
        
        if (target1Element && target2Element) {
            target1Element.value = testCode1;
            target2Element.value = testCode2;
            target1Element.style.display = 'block';
            target2Element.style.display = 'block';
            console.log('Test code set in fallback textareas'); // Debug log
            updateStatus('Test completed using fallback textareas', 'info');
        }
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
    
    // Provide better explanation based on threshold value
    let explanation = '';
    if (value < 0.4) {
        explanation = 'Low threshold: AI verification used frequently for maximum accuracy';
    } else if (value < 0.7) {
        explanation = 'Medium threshold: Balanced approach between speed and accuracy';
    } else {
        explanation = 'High threshold: Manual rules trusted more often for faster conversion';
    }
    
    updateStatus(`Confidence threshold: ${Math.round(value * 100)}% - ${explanation}`, 'info');
    saveLearningData();
}

// Explain learning progress to user
function explainLearningProgress() {
    const stats = learningSystem.learningStats;
    const totalConversions = stats.totalConversions;
    const manualSuccesses = stats.manualSuccesses;
    const aiCorrections = stats.aiCorrections;
    const learnedPatterns = learningSystem.learnedPatterns.size;
    
    let explanation = `Learning Progress Explanation:\n\n`;
    
    if (totalConversions === 0) {
        explanation += `🆕 **Fresh Start**: No conversions yet. The system will learn from your first conversions.\n\n`;
        explanation += `📚 **How it works**:\n`;
        explanation += `• Start with manual conversion rules\n`;
        explanation += `• AI verifies and corrects when needed\n`;
        explanation += `• System learns successful patterns\n`;
        explanation += `• Future similar conversions become faster\n`;
    } else {
        explanation += `📊 **Current Status**:\n`;
        explanation += `• Total Conversions: ${totalConversions}\n`;
        explanation += `• Manual Success Rate: ${(stats.currentConfidence * 100).toFixed(1)}%\n`;
        explanation += `• AI Corrections: ${aiCorrections}\n`;
        explanation += `• Learned Patterns: ${learnedPatterns}\n\n`;
        
        explanation += `🎯 **What This Means**:\n`;
        if (stats.currentConfidence > 0.8) {
            explanation += `✅ **High Confidence**: Manual rules are working well!\n`;
            explanation += `• AI verification used less often\n`;
            explanation += `• Faster conversions\n`;
            explanation += `• Consider raising confidence threshold\n`;
        } else if (stats.currentConfidence > 0.5) {
            explanation += `🔄 **Learning**: System is improving but still learning\n`;
            explanation += `• Some AI verification still needed\n`;
            explanation += `• Patterns being built\n`;
            explanation += `• Keep using to improve\n`;
        } else {
            explanation += `📖 **Early Learning**: System needs more examples\n`;
            explanation += `• AI verification used frequently\n`;
            explanation += `• Building pattern library\n`;
            explanation += `• Consider lowering confidence threshold\n`;
        }
        
        explanation += `\n💡 **Tips**:\n`;
        explanation += `• More conversions = better learning\n`;
        explanation += `• Reset if switching to different code types\n`;
        explanation += `• Adjust confidence threshold based on needs\n`;
    }
    
    alert(explanation);
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
    console.log('isLearningEnabled called, selected mode:', selectedMode); // Debug log
    const result = selectedMode === 'adaptive';
    console.log('isLearningEnabled result:', result); // Debug log
    return result;
}

function isAlwaysAIMode() {
    const selectedMode = document.querySelector('input[name="learning-mode"]:checked')?.value;
    console.log('isAlwaysAIMode called, selected mode:', selectedMode); // Debug log
    const result = selectedMode === 'always-ai';
    console.log('isAlwaysAIMode result:', result); // Debug log
    return result;
}

// Check if manual conversion is preferred
function isManualConversionPreferred() {
    const manualRadio = document.querySelector('input[name="conversion-method"][value="manual"]');
    const result = manualRadio && manualRadio.checked;
    console.log('isManualConversionPreferred called, result:', result); // Debug log
    return result;
}

// Adaptive Learning System Functions
function generatePatternKey(sourceCode, fromLang, toLang) {
    // Create a more specific key for pattern matching
    // Only replace very generic patterns, keep more specific identifiers
    const codeSignature = sourceCode
        .replace(/\s+/g, ' ')  // Normalize whitespace
        .replace(/\b\d+\b/g, 'NUMBER')  // Replace standalone numbers
        .replace(/\b(?:function|class|interface|const|let|var)\b/g, 'KEYWORD')  // Replace common keywords
        .replace(/\b(?:number|string|boolean|void|int|String|bool)\b/g, 'TYPE')  // Replace type keywords
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
    console.log('shouldUseAI called:', { fromLang, toLang }); // Debug log
    
    // Always use AI if in always-ai mode
    if (isAlwaysAIMode()) {
        console.log('Always AI mode - returning true'); // Debug log
        return true;
    }
    
    // Never use AI if learning is disabled and not in always-ai mode
    if (!isLearningEnabled()) {
        console.log('Learning disabled - returning false'); // Debug log
        return false;
    }
    
    // Check if we have a learned pattern for this type of code
    const patternKey = generatePatternKey(sourceCode, fromLang, toLang);
    if (learningSystem.learnedPatterns.has(patternKey)) {
        console.log('Learned pattern found - returning false (use cached pattern)'); // Debug log
        return false; // Use cached pattern
    }
    
    // Check confidence level
    const confidenceCheck = learningSystem.learningStats.currentConfidence < learningSystem.confidenceThreshold;
    console.log('Confidence check:', { 
        currentConfidence: learningSystem.learningStats.currentConfidence, 
        threshold: learningSystem.confidenceThreshold, 
        result: confidenceCheck 
    }); // Debug log
    
    return confidenceCheck;
}

async function adaptiveLearningConversion(sourceCode, fromLang, toLang) {
    console.log('adaptiveLearningConversion called:', { fromLang, toLang }); // Debug log
    
    if (fromLang === toLang) {
        console.log('Same language in adaptive learning, returning source'); // Debug log
        return sourceCode;
    }
    
    const patternKey = generatePatternKey(sourceCode, fromLang, toLang);
    console.log('Pattern key generated:', patternKey); // Debug log
    
    // Check if we have a learned pattern first
    if (learningSystem.learnedPatterns.has(patternKey)) {
        console.log('Using learned pattern (no AI needed)'); // Debug log
        const learnedResult = learningSystem.learnedPatterns.get(patternKey);
        console.log('Retrieved learned pattern:', learnedResult.substring(0, 200) + '...'); // Debug log
        updateStatus('Using learned pattern (no AI needed)', 'success');
        return learnedResult;
    }
    
    let manualResult = null;
    let aiResult = null;
    
    try {
        // Always try manual conversion first
        console.log('Trying manual conversion...'); // Debug log
        const conversionMap = conversionMappings[fromLang];
        if (conversionMap && conversionMap[toLang]) {
            manualResult = conversionMap[toLang](sourceCode);
            console.log('Manual conversion successful'); // Debug log
        } else {
            manualResult = genericConversion(sourceCode, fromLang, toLang);
            console.log('Using generic conversion as fallback'); // Debug log
        }
        
        // Decide if we need AI verification
        const shouldUseAIResult = shouldUseAI(sourceCode, fromLang, toLang);
        console.log('Should use AI?', shouldUseAIResult); // Debug log
        
        if (shouldUseAIResult) {
            updateStatus('Getting AI verification...', 'loading');
            
            try {
                console.log('Calling Ollama API...'); // Debug log
                aiResult = await convertWithOllama(sourceCode, fromLang, toLang);
                console.log('AI conversion successful'); // Debug log
                
                // Compare results and learn
                await learnFromComparison(sourceCode, fromLang, toLang, manualResult, aiResult, patternKey);
                
                return aiResult; // Use AI result for now
            } catch (aiError) {
                console.log('AI conversion failed, using manual result:', aiError); // Debug log
                updateStatus('AI conversion failed - using manual conversion', 'warning');
                
                // Store manual result in learned patterns since AI failed
                learningSystem.learnedPatterns.set(patternKey, manualResult);
                learningSystem.learningStats.manualSuccesses++;
                updateLearningStats();
                saveLearningData();
                
                return manualResult;
            }
        } else {
            // High confidence in manual conversion
            console.log('High confidence - using manual conversion'); // Debug log
            learningSystem.learningStats.manualSuccesses++;
            updateLearningStats();
            updateStatus('High confidence - using manual conversion', 'success');
            return manualResult;
        }
        
    } catch (error) {
        console.log('Error in adaptive learning conversion:', error); // Debug log
        return manualResult || genericConversion(sourceCode, fromLang, toLang);
    }
}

async function learnFromComparison(sourceCode, fromLang, toLang, manualResult, aiResult, patternKey) {
    console.log('learnFromComparison called with patternKey:', patternKey); // Debug log
    console.log('Manual result:', manualResult.substring(0, 200) + '...'); // Debug log
    console.log('AI result:', aiResult.substring(0, 200) + '...'); // Debug log
    
    const similarity = calculateCodeSimilarity(manualResult, aiResult);
    console.log('Similarity score:', similarity); // Debug log
    
    learningSystem.learningStats.totalConversions++;
    
    if (similarity > 0.8) {
        // Manual conversion was good enough
        learningSystem.learningStats.manualSuccesses++;
        learningSystem.learnedPatterns.set(patternKey, manualResult);
        console.log('Storing manual result in learned patterns'); // Debug log
        updateStatus('Manual conversion verified ✓ - Pattern learned', 'success');
    } else {
        // AI provided better conversion - learn from it
        learningSystem.learningStats.aiCorrections++;
        learningSystem.learnedPatterns.set(patternKey, aiResult);
        console.log('Storing AI result in learned patterns'); // Debug log
        
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
    console.log('convertToLanguageWithPreference called:', { fromLang, toLang }); // Debug log
    
    if (fromLang === toLang) {
        console.log('Same language, returning source code'); // Debug log
        return sourceCode;
    }
    
    if (isManualConversionPreferred()) {
        console.log('Using manual conversion only'); // Debug log
        // Use manual conversion only
        const conversionMap = conversionMappings[fromLang];
        if (conversionMap && conversionMap[toLang]) {
            const result = conversionMap[toLang](sourceCode);
            console.log('Manual conversion result:', result.substring(0, 100) + '...'); // Debug log
            return result;
        }
        const result = genericConversion(sourceCode, fromLang, toLang);
        console.log('Generic conversion result:', result.substring(0, 100) + '...'); // Debug log
        return result;
    }
    
    console.log('Using adaptive learning system'); // Debug log
    // Use adaptive learning system
    const result = await adaptiveLearningConversion(sourceCode, fromLang, toLang);
    console.log('Adaptive learning result:', result.substring(0, 100) + '...'); // Debug log
    return result;
}

function clearLearnedPatterns() {
    learningSystem.learnedPatterns.clear();
    learningSystem.conversionHistory = [];
    learningSystem.learningStats = {
        totalConversions: 0,
        manualSuccesses: 0,
        aiCorrections: 0,
        currentConfidence: 0.3
    };
    localStorage.removeItem('codeConvertLearningData');
    console.log('Cleared all learned patterns for fresh start'); // Debug log
}

// Language dropdowns are now handled by CSS, no JavaScript intervention needed

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded event fired'); // Debug log
    
    // Test if Monaco script is loaded
    const monacoScript = document.querySelector('script[src*="monaco-editor"]');
    console.log('Monaco script element:', monacoScript);
    
    // Language dropdowns are now handled by CSS
    
    // Clear learned patterns for fresh start
    clearLearnedPatterns();
    
    // Initialize Monaco Editor
    if (typeof require !== 'undefined') {
        console.log('require is available, initializing Monaco immediately'); // Debug log
        initializeMonacoEditors();
    } else {
        console.log('require not available, waiting for Monaco script to load...'); // Debug log
        // Wait for Monaco script to load
        setTimeout(() => {
            if (typeof require !== 'undefined') {
                console.log('Monaco loaded, initializing editors...'); // Debug log
                initializeMonacoEditors();
            } else {
                console.error('Monaco failed to load after timeout');
                updateStatus('Monaco Editor failed to load - please refresh the page', 'error');
            }
        }, 2000); // Wait 2 seconds for Monaco to load
    }
    
    // Load learning data and check Ollama status
    loadLearningData();
    setTimeout(checkOllamaStatus, 1000);
    
    // Set up periodic health checks - DISABLED TO PREVENT DROPDOWN DISAPPEARANCE
    // setInterval(() => {
    //     if (monacoLoaded) {
    //         checkEditorHealth();
    //     }
    // }, 30000); // Check every 30 seconds
    
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
    
    console.log('DOMContentLoaded event handlers set up'); // Debug log
});

// Handle window resize events for responsive design
function handleWindowResize() {
    console.log('Window resize detected, updating Monaco editors...');
    
    if (monacoLoaded && monacoEditors.source && monacoEditors.target1 && monacoEditors.target2) {
        // Force Monaco editors to recalculate their layout
        try {
            monacoEditors.source.layout();
            monacoEditors.target1.layout();
            monacoEditors.target2.layout();
            console.log('Monaco editors layout updated after resize');
        } catch (error) {
            console.warn('Error updating Monaco layout after resize:', error);
        }
    }
    
    // Panel styling is now handled by CSS
}

// Add resize event listener
window.addEventListener('resize', handleWindowResize);

// Debounced resize handler for better performance
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleWindowResize, 250);
});

// Language dropdowns are now handled by CSS, no JavaScript intervention needed

// Manual force content into editors
function forceContentIntoEditors(content1, content2) {
    console.log('Force content into editors called');
    
    if (monacoLoaded && monacoEditors.target1 && monacoEditors.target2) {
        try {
            // Force update with multiple attempts
            let success1 = false;
            let success2 = false;
            
            // Try multiple times for target1
            for (let i = 0; i < 3; i++) {
                try {
                    monacoEditors.target1.setValue(content1);
                    success1 = true;
                    console.log('Target1 content set successfully on attempt', i + 1);
                    break;
                } catch (error) {
                    console.warn(`Target1 attempt ${i + 1} failed:`, error);
                    if (i === 2) {
                        // Last attempt failed, use fallback
                        fallbackToTextarea(content1, 'target1-editor');
                    }
                }
            }
            
            // Try multiple times for target2
            for (let i = 0; i < 3; i++) {
                try {
                    monacoEditors.target2.setValue(content2);
                    success2 = true;
                    console.log('Target2 content set successfully on attempt', i + 1);
                    break;
                } catch (error) {
                    console.warn(`Target2 attempt ${i + 1} failed:`, error);
                    if (i === 2) {
                        // Last attempt failed, use fallback
                        fallbackToTextarea(content2, 'target2-editor');
                    }
                }
            }
            
            if (success1 && success2) {
                updateStatus('Content successfully displayed in both editors', 'success');
            } else {
                updateStatus('Some editors failed - using fallback textareas', 'warning');
            }
            
        } catch (error) {
            console.error('Error in forceContentIntoEditors:', error);
            // Use fallbacks for both
            fallbackToTextarea(content1, 'target1-editor');
            fallbackToTextarea(content2, 'target2-editor');
            updateStatus('All editors failed - using fallback textareas', 'error');
        }
    } else {
        console.log('Monaco editors not available, using fallback textareas');
        // Use fallbacks
        fallbackToTextarea(content1, 'target1-editor');
        fallbackToTextarea(content2, 'target2-editor');
        updateStatus('Monaco editors not available - using fallback textareas', 'info');
    }
}

// Force manual conversion when AI fails
function forceManualConversion(sourceCode, fromLang, toLang) {
    console.log('Forcing manual conversion for:', fromLang, 'to', toLang);
    
    try {
        const conversionMap = conversionMappings[fromLang];
        if (conversionMap && conversionMap[toLang]) {
            const result = conversionMap[toLang](sourceCode);
            console.log('Manual conversion successful');
            return result;
        } else {
            const result = genericConversion(sourceCode, fromLang, toLang);
            console.log('Generic conversion successful');
            return result;
        }
    } catch (error) {
        console.error('Manual conversion also failed:', error);
        // Last resort: return a basic conversion
        return `${languageTemplates[toLang]?.comment || '//'} Converted from ${languageTemplates[fromLang]?.name || fromLang} to ${languageTemplates[toLang]?.name || toLang}\n${languageTemplates[toLang]?.comment || '//'} Note: Basic conversion - manual review required\n\n${sourceCode}`;
    }
}
