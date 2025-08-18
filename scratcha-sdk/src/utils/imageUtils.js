// SDK 이미지 경로 유틸리티

import { IMAGE_ASSETS } from './imageAssets.js'

// 커버 이미지 경로 생성
export const getCoverImagePath = () => {
    return IMAGE_ASSETS['images/image_cover.png']
}

// 퀴즈 이미지 경로 생성
export const getQuizImagePath = (imageUrl) => {
    return IMAGE_ASSETS[imageUrl] || `/${imageUrl}`
}

// 로고 이미지 경로 생성
export const getLogoImagePath = () => {
    return IMAGE_ASSETS['images/scratchalogo.png']
}
