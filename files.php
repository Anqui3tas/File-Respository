<?php
session_start();

$rootDir = realpath(__DIR__ . '/Files'); // Set "Files" as the new root directory
$directory = isset($_GET['dir']) ? realpath($rootDir . '/' . $_GET['dir']) : $rootDir;

// Security: Prevent accessing outside the "Files" directory
if (!$directory || strpos($directory, $rootDir) !== 0) {
    die(json_encode(['error' => 'Invalid directory']));
}

// Prevent access to system files
$exclude = ['.htaccess', '.DS_Store', 'cgi-bin'];
$items = array_diff(scandir($directory), array('.', '..'));

$result = [];

// Check if the directory has a banner image
$banner = file_exists($directory . '/banner.jpg') ? 'banner.jpg' : '';

foreach ($items as $item) {
    $path = realpath($directory . '/' . $item);

    if (!$path || in_array($item, $exclude)) {
        continue;
    }

    // Ensure paths are correctly formatted (avoiding double slashes)
    $relativePath = str_replace($rootDir . '/', '', $path);

    $result[] = [
        'name' => $item,
        'type' => is_dir($path) ? 'folder' : 'file',
        'path' => $relativePath
    ];
}

// Return JSON response
echo json_encode([
    'banner' => $banner,
    'files' => array_values($result) // Reset array keys to avoid issues
]);
?>