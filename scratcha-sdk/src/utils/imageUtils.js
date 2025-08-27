/**
 * SDK 이미지 경로 유틸리티
 * 실제 이미지 파일들을 사용하는 업데이트된 버전
 */

import { IMAGE_ASSETS, getImageUrl, getLogoImage, getCoverImage } from './imageAssets.js'

// 커버 이미지 경로 생성
export const getCoverImagePath = () => {
    return getCoverImage();
}

// 퀴즈 이미지 경로 생성
export const getQuizImagePath = (imageUrl) => {
    return getImageUrl(imageUrl) || `/${imageUrl}`;
}

// 로고 이미지 경로 생성
export const getLogoImagePath = (type = 'svg') => {
    return getLogoImage(type);
}

// 새로운 유틸리티 함수들
export const getScratchaLogo = (type = 'svg') => {
    return getLogoImage(type);
};

export const getImageCover = () => {
    return getCoverImage();
};

// 이미지 미리 로딩
export const preloadAllImages = async () => {
    const { preloadImages } = await import('./imageAssets.js');
    return preloadImages();
};
