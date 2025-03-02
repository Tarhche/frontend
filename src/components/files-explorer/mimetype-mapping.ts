import {
  IconFile,
  IconFileText,
  IconPdf,
  IconFileSpreadsheet,
  IconFileTypePpt,
  IconFileZip,
  IconFileMusic,
  IconVideo,
  IconCode,
  IconTerminal2,
  IconDatabase,
  IconDeviceFloppy,
} from "@tabler/icons-react";

const mimeToIcon = {
  // Documents
  "application/pdf": IconPdf,
  "application/msword": IconFileText,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    IconFileText,
  "application/vnd.ms-excel": IconFileSpreadsheet,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    IconFileSpreadsheet,
  "application/vnd.ms-powerpoint": IconFileTypePpt,
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    IconFileTypePpt,
  "text/plain": IconFileText,
  "text/csv": IconFileSpreadsheet,
  // Archives
  "application/zip": IconFileZip,
  "application/x-rar-compressed": IconFileZip,
  "application/x-7z-compressed": IconFileZip,
  "application/x-tar": IconFileZip,
  "application/gzip": IconFileZip,
  // Audio
  "audio/mpeg": IconFileMusic,
  "audio/wav": IconFileMusic,
  "audio/ogg": IconFileMusic,
  // Video
  "video/mp4": IconVideo,
  "video/x-msvideo": IconVideo,
  "video/x-matroska": IconVideo,
  "video/quicktime": IconVideo,
  "video/webm": IconVideo,
  // Code
  "text/html": IconCode,
  "application/javascript": IconCode,
  "application/json": IconDatabase,
  "application/xml": IconCode,
  "text/css": IconCode,
  // Executables
  "application/x-msdownload": IconDeviceFloppy,
  "application/x-sh": IconTerminal2,
  "application/x-python": IconTerminal2,
  "application/java-archive": IconTerminal2,
};

const defaultIcon = IconFile;

export {mimeToIcon, defaultIcon};
