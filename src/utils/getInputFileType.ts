import { videoFormats, audioFormats, inputFileTypes } from '../constants/mediaOptions';

export const getInputFileType = (fileExt: string): inputFileTypes => {
    const isAudio = audioFormats.includes(fileExt);
    const isVideo = videoFormats.includes(fileExt);

    return isAudio ? 'audio' :
        isVideo ? 'video' : 'image'


};