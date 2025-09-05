// LaTeX Rendering with KaTeX
import katex from 'katex'
import 'katex/dist/katex.min.css'

// Custom LaTeX macros
const macros = {
  "\\f": "\\frac",
  "\\s": "\\sqrt",
  "\\v": "\\vec",
  "\\c": "\\binom",
  "\\p": "\\mathrm{P}",
  "\\ge": "\\geq",
  "\\le": "\\leq"
}

export function renderLatex(text) {
  if (!text) return ''
  
  // Process inline math
  let processed = text.replace(/\$([^$]+)\$/g, (match, math) => {
    try {
      return katex.renderToString(math, {
        displayMode: false,
        macros: macros,
        throwOnError: false,
        trust: true
      })
    } catch (error) {
      console.error('LaTeX render error:', error)
      return `<span class="latex-error">${match}</span>`
    }
  })
  
  // Process display math
  processed = processed.replace(/\$\$([^$]+)\$\$/g, (match, math) => {
    try {
      return katex.renderToString(math, {
        displayMode: true,
        macros: macros,
        throwOnError: false,
        trust: true
      })
    } catch (error) {
      console.error('LaTeX render error:', error)
      return `<div class="latex-error">${match}</div>`
    }
  })
  
  return processed
}

// LaTeX insertion helper
export function insertLatexAtCursor(textarea, latex) {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selected = textarea.value.substring(start, end)
  
  const wrappedLatex = selected ? `$${selected}$` : `$${latex}$`
  
  textarea.value = textarea.value.substring(0, start) + wrappedLatex + textarea.value.substring(end)
  
  // Set cursor position
  const cursorPos = start + wrappedLatex.length
  textarea.setSelectionRange(cursorPos, cursorPos)
  textarea.focus()
  
  // Trigger input event for preview
  textarea.dispatchEvent(new Event('input'))
}

// Common LaTeX templates
export const latexTemplates = {
  fraction: '\\f{ numerator }{ denominator }',
  squareRoot: '\\s{ expression }',
  vector: '\\v{ v }',
  binomial: '\\c{ n }{ k }',
  subscript: 'x_{ n }',
  superscript: 'x^{ n }',
  equation: 'x = \\f{ -b \\pm \\s{b^2 - 4ac} }{ 2a }',
  integral: '\\int_{ a }^{ b } f(x) dx',
  sum: '\\sum_{ i=1 }^{ n } x_i',
  limit: '\\lim_{ x \\to \\infty } f(x)',
  matrix: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}'
}

// Create LaTeX toolbar
export function createLatexToolbar(container, textarea) {
  const toolbar = document.createElement('div')
  toolbar.className = 'latex-toolbar flex gap-2 flex-wrap mt-2 p-2 bg-gray-50 rounded-lg'
  
  Object.entries(latexTemplates).forEach(([name, latex]) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100'
    button.textContent = name
    button.title = latex
    button.onclick = () => insertLatexAtCursor(textarea, latex)
    toolbar.appendChild(button)
  })
  
  container.appendChild(toolbar)
}