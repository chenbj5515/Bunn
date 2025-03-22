import { useEffect } from 'react';

/**
 * 自定义hook：在组件渲染完成后移除HTML、body和main元素的背景色类名
 * @param {boolean} shouldRestore - 组件卸载时是否恢复原背景色类名（默认为true）
 */
export function useRemoveHtmlBg(shouldRestore: boolean = true): void {
  useEffect(() => {
    // 获取HTML、body和main元素
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    const mainElement = document.querySelector('main');
    
    // 检查是否有指定的背景色类名
    const bgClassName = 'bg-[#f5f5f5]';
    const htmlHasBgClass = htmlElement.classList.contains(bgClassName);
    const bodyHasBgClass = bodyElement.classList.contains(bgClassName);
    const mainHasBgClass = mainElement?.classList.contains(bgClassName);
    
    // 移除背景色类名
    if (htmlHasBgClass) {
      htmlElement.classList.remove(bgClassName);
    }
    
    if (bodyHasBgClass) {
      bodyElement.classList.remove(bgClassName);
    }

    if (mainHasBgClass && mainElement) {
      mainElement.classList.remove(bgClassName);
    }
  }, []); // 空依赖数组表示仅在组件挂载和卸载时执行
}

export default useRemoveHtmlBg;
