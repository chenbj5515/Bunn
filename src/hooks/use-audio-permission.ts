import { useEffect, useState } from "react";

export function useAudioPermission() {
    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
        async function requestPermission() {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.error('ブラウザーは録音をサポートしていません。');
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                // 获取权限后立即停止所有音轨
                stream.getTracks().forEach(track => track.stop());
                setHasPermission(true);
            } catch (err) {
                console.error('マイクにアクセスできません', err);
                setHasPermission(false);
            }
        }

        requestPermission();
    }, []);

    return hasPermission;
} 