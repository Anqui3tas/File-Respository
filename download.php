<?php
session_start();

$rootDir = realpath(__DIR__ . '/Files'); // Set "Files" as the new root directory

// Utility function: Ensure the given path is within the allowed root directory
function isPathValid($path, $rootDir) {
    return $path !== false && strpos($path, $rootDir) === 0;
}

// Download a single file
if (isset($_GET['file'])) {
    $relativePath = $_GET['file'];
    $filePath = realpath($rootDir . '/' . $relativePath);
    if (!isPathValid($filePath, $rootDir) || !is_file($filePath)) {
        header("HTTP/1.1 404 Not Found");
        exit("File not found or invalid.");
    }

    // Determine the file's MIME type
    $mimeType = function_exists('mime_content_type') ? mime_content_type($filePath) : 'application/octet-stream';

    // Set headers for file download
    header('Content-Description: File Transfer');
    header('Content-Type: ' . $mimeType);
    header('Content-Disposition: attachment; filename="' . basename($filePath) . '"');
    header('Expires: 0');
    header('Cache-Control: must-revalidate');
    header('Pragma: public');
    header('Content-Length: ' . filesize($filePath));
    flush();
    readfile($filePath);
    exit;
}

// Download a folder as a ZIP archive
elseif (isset($_GET['folder'])) {
    $relativePath = $_GET['folder'];
    $folderPath = realpath($rootDir . '/' . $relativePath);
    if (!isPathValid($folderPath, $rootDir) || !is_dir($folderPath)) {
        header("HTTP/1.1 404 Not Found");
        exit("Folder not found or invalid.");
    }

    // Create a temporary file for the ZIP
    $zipFilename = tempnam(sys_get_temp_dir(), 'zip');
    $zip = new ZipArchive();
    if ($zip->open($zipFilename, ZipArchive::OVERWRITE) !== true) {
        exit("Could not create zip file.");
    }

    // Recursively add files and folders to the ZIP archive
    $filesAdded = 0;
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($folderPath, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );
    foreach ($iterator as $file) {
        $fileRealPath = $file->getRealPath();
        // Local path inside the ZIP: relative to the folder being zipped
        $localPath = substr($fileRealPath, strlen($folderPath) + 1);
        if ($file->isDir()) {
            $zip->addEmptyDir($localPath);
        } else {
            $zip->addFile($fileRealPath, $localPath);
        }
        $filesAdded++;
    }
    $zip->close();

    if ($filesAdded === 0) {
        unlink($zipFilename);
        header("HTTP/1.1 404 Not Found");
        exit("Folder is empty.");
    }

    // Set headers for ZIP download
    $downloadName = basename($folderPath) . ".zip";
    header('Content-Description: File Transfer');
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="' . $downloadName . '"');
    header('Expires: 0');
    header('Cache-Control: must-revalidate');
    header('Pragma: public');
    header('Content-Length: ' . filesize($zipFilename));
    flush();
    readfile($zipFilename);
    unlink($zipFilename); // Remove temporary file
    exit;
} else {
    header("HTTP/1.1 400 Bad Request");
    exit("No file or folder specified for download.");
}