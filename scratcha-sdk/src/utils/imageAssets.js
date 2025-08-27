/**
 * ScratchaSDK 이미지 에셋 관리
 * 실제 이미지 파일들을 import하여 사용
 */

// 이미지 파일들을 import
import imageCover from '../assets/images/image_cover.png';
import scratchaLogoSvg from '../assets/images/scratchalogo.svg';

// 퀴즈 이미지들을 import
import quizLow1 from '../assets/quiz_images/low/quiz_0022f1d2-0c14-409f-ab67-5e7c12fa4130.webp';
import quizHigh1 from '../assets/quiz_images/high/quiz_002e8c48-26a5-49ad-bf7f-c21707905a4f.webp';
import quizMiddle1 from '../assets/quiz_images/middle/quiz_0032a29a-9e9e-4771-924a-24dbd864a7d3.webp';
import quizHigh2 from '../assets/quiz_images/high/quiz_004095c7-88c9-41db-a220-8f4a3fd46f43.webp';

// 이미지 에셋 객체
export const IMAGE_ASSETS = {
    // 로고 이미지들
    'images/scratchalogo.svg': scratchaLogoSvg,

    // 커버 이미지
    'images/image_cover.png': imageCover,

    // 퀴즈 이미지들
    'quiz_images/low/quiz_0022f1d2-0c14-409f-ab67-5e7c12fa4130.webp': quizLow1,
    'quiz_images/high/quiz_002e8c48-26a5-49ad-bf7f-c21707905a4f.webp': quizHigh1,
    'quiz_images/middle/quiz_0032a29a-9e9e-4771-924a-24dbd864a7d3.webp': quizMiddle1,
    'quiz_images/high/quiz_004095c7-88c9-41db-a220-8f4a3fd46f43.webp': quizHigh2,

    // 기본 이미지들 (fallback용)
    'default/logo': scratchaLogoSvg,
    'default/cover': imageCover
};

// 이미지 URL을 가져오는 유틸리티 함수
export const getImageUrl = (imageKey) => {
    if (IMAGE_ASSETS[imageKey]) {
        return IMAGE_ASSETS[imageKey];
    }

    console.warn(`이미지를 찾을 수 없습니다: ${imageKey}`);
    return IMAGE_ASSETS['default/logo']; // 기본 로고 반환
};

// 이미지 타입별 접근 함수들
export const getLogoImage = (type = 'svg') => {
    switch (type) {
        case 'svg':
        default:
            return IMAGE_ASSETS['images/scratchalogo.svg'];
    }
};

export const getCoverImage = () => {
    return IMAGE_ASSETS['images/image_cover.png'];
};

// 이미지 미리 로딩 함수
export const preloadImages = async () => {
    const imageUrls = [
        IMAGE_ASSETS['images/scratchalogo.svg'],
        IMAGE_ASSETS['images/image_cover.png'],
        IMAGE_ASSETS['quiz_images/low/quiz_0022f1d2-0c14-409f-ab67-5e7c12fa4130.webp'],
        IMAGE_ASSETS['quiz_images/high/quiz_002e8c48-26a5-49ad-bf7f-c21707905a4f.webp'],
        IMAGE_ASSETS['quiz_images/middle/quiz_0032a29a-9e9e-4771-924a-24dbd864a7d3.webp'],
        IMAGE_ASSETS['quiz_images/high/quiz_004095c7-88c9-41db-a220-8f4a3fd46f43.webp']
    ];

    const loadPromises = imageUrls.map(url => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(url);
            img.onerror = () => reject(new Error(`이미지 로딩 실패: ${url}`));
            img.src = url;
        });
    });

    try {
        await Promise.all(loadPromises);
        console.log('모든 이미지가 성공적으로 로딩되었습니다.');
    } catch (error) {
        console.warn('일부 이미지 로딩에 실패했습니다:', error.message);
    }
};

export default IMAGE_ASSETS;
