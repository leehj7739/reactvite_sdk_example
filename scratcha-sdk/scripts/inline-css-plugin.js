import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

export function inlineCssPlugin() {
    return {
        name: 'inline-css-plugin',
        generateBundle(options, bundle) {
            // CSS 파일 찾기
            const cssFile = Object.keys(bundle).find(key => key.endsWith('.css'))

            if (cssFile) {
                const cssPath = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..', 'dist', cssFile)
                const cssContent = fs.readFileSync(cssPath, 'utf-8')

                // CSS를 JavaScript 문자열로 변환
                const cssString = JSON.stringify(cssContent)

                // JavaScript 파일들에 CSS 인라인 추가
                Object.keys(bundle).forEach(key => {
                    if (key.endsWith('.js') || key.endsWith('.cjs')) {
                        const file = bundle[key]
                        if (file.type === 'chunk') {
                            // CSS를 동적으로 주입하는 코드 추가
                            const cssInjectionCode = `
// CSS 스타일 인라인 주입
(function() {
  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = ${cssString};
    document.head.appendChild(style);
  }
})();
`
                            file.code = cssInjectionCode + file.code
                        }
                    }
                })

                // CSS 파일 제거
                delete bundle[cssFile]
            }
        }
    }
}
