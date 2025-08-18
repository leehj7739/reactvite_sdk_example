import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 이미지 파일들을 Base64로 인코딩
function encodeImageToBase64(filePath) {
  try {
    const imageBuffer = fs.readFileSync(filePath)
    const base64 = imageBuffer.toString('base64')
    const ext = path.extname(filePath).substring(1)
    return `data:image/${ext};base64,${base64}`
  } catch (error) {
    console.error(`Error encoding ${filePath}:`, error.message)
    return null
  }
}

// 이미지 파일들 찾기
function findImageFiles(dir) {
  const files = []
  const items = fs.readdirSync(dir)
  
  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory()) {
      files.push(...findImageFiles(fullPath))
    } else if (stat.isFile() && /\.(png|jpg|jpeg|webp|gif)$/i.test(item)) {
      files.push(fullPath)
    }
  }
  
  return files
}

// 메인 실행
function main() {
  const publicDir = path.join(__dirname, '..', 'public')
  const imageFiles = findImageFiles(publicDir)
  
  console.log('Found image files:')
  imageFiles.forEach(file => console.log(`  ${file}`))
  
  const encodedImages = {}
  
  for (const file of imageFiles) {
    const relativePath = path.relative(publicDir, file).replace(/\\/g, '/')
    const base64 = encodeImageToBase64(file)
    
    if (base64) {
      encodedImages[relativePath] = base64
      console.log(`✓ Encoded: ${relativePath}`)
    }
  }
  
  // JavaScript 코드 생성
  const jsCode = `// SDK 이미지 에셋 (Base64 인코딩) - 자동 생성됨

export const IMAGE_ASSETS = ${JSON.stringify(encodedImages, null, 2)}

// 이미지 경로를 Base64로 변환하는 함수
export const getImageAsBase64 = (imagePath) => {
  return IMAGE_ASSETS[imagePath] || imagePath
}
`
  
  // 파일 저장
  const outputPath = path.join(__dirname, '..', 'src', 'utils', 'imageAssets.js')
  fs.writeFileSync(outputPath, jsCode)
  
  console.log(`\n✓ Generated: ${outputPath}`)
  console.log(`✓ Total images encoded: ${Object.keys(encodedImages).length}`)
}

main()
