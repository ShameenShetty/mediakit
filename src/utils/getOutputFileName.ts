import { exists } from '@tauri-apps/plugin-fs';

/**
 * Generates a unique output file path to prevent overwriting existing files.
 * 
 * @param inputPath The full path of the source input file.
 * @param outputDir The target directory where the output file will be saved.
 * @param suffix Modifier inserted before the extension (e.g., '_extracted').
 * @param targetExt Optional new file extension (e.g., 'm4a'). If omitted, uses input extension.
 */
export async function getOutputFileName(
    inputPath: string, 
    outputDir: string, 
    suffix: string = '_processed',
    targetExt?: string
): Promise<string> {
    const normalizedPath = inputPath.replace(/\\/g, '/');
    const fileNameWithExt = normalizedPath.split('/').pop() || 'output.mp4';
    
    const lastDotIndex = fileNameWithExt.lastIndexOf('.');
    let baseName = lastDotIndex !== -1 ? fileNameWithExt.substring(0, lastDotIndex) : fileNameWithExt;
    
    // Use targetExt if provided, otherwise fallback to original extension
    let ext = '';
    if (targetExt) {
        ext = targetExt.startsWith('.') ? targetExt : `.${targetExt}`;
    } else {
        ext = lastDotIndex !== -1 ? fileNameWithExt.substring(lastDotIndex) : '';
    }

    if (baseName.endsWith(suffix)) {
        baseName = baseName.substring(0, baseName.length - suffix.length);
    }

    let targetPath = `${outputDir}/${baseName}${suffix}${ext}`;
    let fileExists = true;
    let counter = 1;

    while (fileExists) {
        try {
            fileExists = await exists(targetPath);
            if (fileExists) {
                targetPath = `${outputDir}/${baseName}${suffix} (${counter})${ext}`;
                counter++;
            }
        } catch {
            fileExists = false;
        }
    }

    return targetPath;
}