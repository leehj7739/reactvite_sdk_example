// Vite 플러그인: tw-to-css를 사용한 Tailwind 클래스 변환
import { twj } from 'tw-to-css'

// JSX에서 className을 style로 변환하는 함수
function transformJSX(code) {
    console.log(' transformJSX 함수 실행됨')
    let transformedCount = 0

    // className: "..." 패턴 찾기 (Vite 컴파일 후)
    code = code.replace(
        /className:\s*["']([^"']+)["']/g,
        (match, className) => {
            console.log(`📝 className 패턴 발견: ${className}`)
            try {
                const styleObject = twj(className)
                if (Object.keys(styleObject).length > 0) {
                    const styleString = JSON.stringify(styleObject)
                    transformedCount++
                    console.log(`✅ 변환 성공: ${className} → ${styleString}`)
                    return `style: ${styleString}`
                }
            } catch (error) {
                console.warn(`❌ tw-to-css 변환 실패: ${className}`, error.message)
            }
            return match
        }
    )

    // className: `...` 패턴 찾기
    code = code.replace(
        /className:\s*`([^`]+)`/g,
        (match, className) => {
            console.log(`📝 className 템플릿 패턴 발견: ${className}`)
            try {
                const styleObject = twj(className)
                if (Object.keys(styleObject).length > 0) {
                    const styleString = JSON.stringify(styleObject)
                    transformedCount++
                    console.log(`✅ 템플릿 변환 성공: ${className} → ${styleString}`)
                    return `style: ${styleString}`
                }
            } catch (error) {
                console.warn(`❌ tw-to-css 템플릿 변환 실패: ${className}`, error.message)
            }
            return match
        }
    )

    // className: '...' 패턴 찾기
    code = code.replace(
        /className:\s*['"]([^'"]+)['"]/g,
        (match, className) => {
            console.log(`📝 className 따옴표 패턴 발견: ${className}`)
            try {
                const styleObject = twj(className)
                if (Object.keys(styleObject).length > 0) {
                    const styleString = JSON.stringify(styleObject)
                    transformedCount++
                    console.log(`✅ 따옴표 변환 성공: ${className} → ${styleString}`)
                    return `style: ${styleString}`
                }
            } catch (error) {
                console.warn(`❌ tw-to-css 따옴표 변환 실패: ${className}`, error.message)
            }
            return match
        }
    )

    // 템플릿 리터럴 패턴 (className: `...${...}...`) 찾기
    code = code.replace(
        /className:\s*`([^`]*\$\{[^}]*\}[^`]*)`/g,
        (match, template) => {
            console.log(`📝 템플릿 리터럴 패턴 발견: ${template}`)
            try {
                // 템플릿 리터럴에서 정적 부분만 추출
                const staticParts = template.split(/\$\{[^}]*\}/)
                const staticClasses = staticParts.join(' ').trim()
                if (staticClasses) {
                    const styleObject = twj(staticClasses)
                    if (Object.keys(styleObject).length > 0) {
                        const styleString = JSON.stringify(styleObject)
                        transformedCount++
                        console.log(`✅ 템플릿 리터럴 변환 성공: ${staticClasses} → ${styleString}`)
                        return `style: ${styleString}`
                    }
                }
            } catch (error) {
                console.warn(`❌ tw-to-css 템플릿 리터럴 변환 실패: ${template}`, error.message)
            }
            return match
        }
    )

    // 조건부 클래스 패턴 (className: `...${condition ? 'class1' : 'class2'}...`) 찾기
    code = code.replace(
        /className:\s*`([^`]*\$\{[^}]*\?[^}]*:[^}]*\}[^`]*)`/g,
        (match, template) => {
            console.log(`📝 조건부 클래스 패턴 발견: ${template}`)
            try {
                // 조건부 표현식에서 가능한 모든 클래스 추출
                const classMatches = template.match(/([a-zA-Z0-9_-]+(?:\s+[a-zA-Z0-9_-]+)*)/g)
                if (classMatches) {
                    // 모든 가능한 클래스 조합을 시도
                    for (const classStr of classMatches) {
                        const classes = classStr.split(/\s+/).filter(c => c.trim())
                        if (classes.length > 0) {
                            const styleObject = twj(classes.join(' '))
                            if (Object.keys(styleObject).length > 0) {
                                const styleString = JSON.stringify(styleObject)
                                transformedCount++
                                console.log(`✅ 조건부 클래스 변환 성공: ${classes.join(' ')} → ${styleString}`)
                                return `style: ${styleString}`
                            }
                        }
                    }
                }
            } catch (error) {
                console.warn(`❌ tw-to-css 조건부 클래스 변환 실패: ${template}`, error.message)
            }
            return match
        }
    )

    console.log(`🎯 총 ${transformedCount}개 클래스 변환됨`)
    return code
}

// Vite 플러그인
export default function twToCssPlugin() {
    return {
        name: 'vite-tw-to-css',

        transform(code, id) {
            console.log(`🚀 플러그인 실행: ${id}`)

            // JSX 파일만 처리
            if (!id.endsWith('.jsx') && !id.endsWith('.js')) {
                console.log(`⏭️ 파일 타입 제외: ${id}`)
                return null
            }

            // node_modules 제외
            if (id.includes('node_modules')) {
                console.log(`⏭️ node_modules 제외: ${id}`)
                return null
            }

            console.log(`✅ 파일 처리 시작: ${id}`)
            const transformedCode = transformJSX(code)

            if (transformedCode !== code) {
                console.log(`🔄 코드 변환됨: ${id}`)
                return {
                    code: transformedCode,
                    map: null
                }
            } else {
                console.log(`⏭️ 변환 없음: ${id}`)
            }

            return null
        }
    }
}
