import { useEffect } from 'react';

/**
 * 自定义hook：在组件渲染完成后移除HTML元素的背景色类名
 * @param {boolean} shouldRestore - 组件卸载时是否恢复原背景色类名（默认为true）
 */
export function useRemoveHtmlBg(shouldRestore: boolean = true): void {
  useEffect(() => {
    // 获取HTML元素
    const htmlElement = document.documentElement;
    
    // 检查是否有指定的背景色类名
    const bgClassName = 'bg-[#f5f5f5]';
    const hasBgClass = htmlElement.classList.contains(bgClassName);
    
    // 移除背景色类名
    if (hasBgClass) {
      htmlElement.classList.remove(bgClassName);
      console.log(htmlElement, '移除背景色类名', bgClassName);
    }
    
    // 清理函数：在组件卸载时执行
    return () => {
      // 如果需要恢复，且之前有背景色类名，则恢复原始背景色类名
      if (shouldRestore && hasBgClass) {
        htmlElement.classList.add(bgClassName);
      }
    };
  }, []); // 空依赖数组表示仅在组件挂载和卸载时执行
}

export default useRemoveHtmlBg;
