import { useState } from "react";

export const useProgrammaticCameraMovement = (
    callback: () => void,
): [boolean, () => void] => {
    const [
        isCameraProgramaticallyChanging,
        setIsCameraProgramaticallyChanging,
    ] = useState(false);

    const executeMovement = async () => {
        setIsCameraProgramaticallyChanging(true);

        // Wait a tick to let the state update propagate
        await new Promise((resolve) => setTimeout(resolve, 100));

        try {
            // Perform the callback, which contains the camera operations
            callback();
        } finally {
            // Always ensure we turn off programmatic camera change, even if an error occurs
            setIsCameraProgramaticallyChanging(false);
        }
    };

    return [isCameraProgramaticallyChanging, executeMovement];
};
