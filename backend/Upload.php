<?php

declare(strict_types=1);

/*
 |--------------------------------------------------------------------------
 | 上传：三重校验（扩展名 / MIME / getimagesize）+ 哈希落盘 + WebP 缩略图
 |--------------------------------------------------------------------------
 */

final class Upload
{
    private const MAX_BYTES = 8 * 1024 * 1024; // 8MB
    private const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    private const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    private const THUMB_WIDTH = 480;

    public static function handle(array $file): array
    {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            Http::error(422, '上传失败，错误码 ' . (int) ($file['error'] ?? -1));
        }
        if (($file['size'] ?? 0) > self::MAX_BYTES) {
            Http::error(422, '文件超过 8MB 上限');
        }

        $tmp = (string) $file['tmp_name'];
        $origName = (string) ($file['name'] ?? 'image');

        // 1) 扩展名
        $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
        if (!in_array($ext, self::ALLOWED_EXT, true)) {
            Http::error(422, '不支持的文件类型');
        }

        // 2) MIME（finfo）
        $mime = '';
        if (class_exists('finfo')) {
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $mime = (string) $finfo->file($tmp);
        }
        if ($mime !== '' && !in_array($mime, self::ALLOWED_MIME, true)) {
            Http::error(422, '文件内容与类型不符');
        }

        // 3) 真的是图片
        $info = @getimagesize($tmp);
        if ($info === false) {
            Http::error(422, '文件不是有效图片');
        }
        [$width, $height] = $info;

        // 落盘：/uploads/YYYY/mm/hash.ext
        $sub = date('Y') . DIRECTORY_SEPARATOR . date('m');
        $dir = UPLOAD_DIR . DIRECTORY_SEPARATOR . $sub;
        if (!is_dir($dir) && !mkdir($dir, 0775, true)) {
            Http::error(500, '无法创建上传目录');
        }
        $hash = bin2hex(random_bytes(8));
        $filename = $hash . '.' . $ext;
        $dest = $dir . DIRECTORY_SEPARATOR . $filename;

        if (!move_uploaded_file($tmp, $dest)) {
            // php -S 下部分场景 move_uploaded_file 不可用，回退 copy
            if (!@copy($tmp, $dest)) {
                Http::error(500, '保存文件失败');
            }
            @unlink($tmp);
        }
        @chmod($dest, 0664);

        $path = '/uploads/' . date('Y') . '/' . date('m') . '/' . $filename;

        // WebP 缩略图（仅媒体库展示用，失败不阻塞）
        $thumb = self::makeThumb($dest, $ext, self::THUMB_WIDTH);

        $row = [
            'path' => $path,
            'filename' => $origName,
            'width' => $width,
            'height' => $height,
            'size' => (int) ($file['size'] ?? filesize($dest)),
            'mime' => $mime !== '' ? $mime : (string) $info['mime'],
        ];
        $id = Content::addMedia($row);

        return [
            'id' => $id,
            'path' => $path,
            'thumb' => $thumb,
            'filename' => $origName,
            'width' => $width,
            'height' => $height,
            'size' => $row['size'],
            'mime' => $row['mime'],
        ];
    }

    private static function makeThumb(string $src, string $ext, int $maxWidth): ?string
    {
        if (!extension_loaded('gd') || $ext === 'gif') {
            return null;
        }
        $img = null;
        switch ($ext) {
            case 'jpg':
            case 'jpeg':
                $img = @imagecreatefromjpeg($src);
                break;
            case 'png':
                $img = @imagecreatefrompng($src);
                break;
            case 'webp':
                $img = @imagecreatefromwebp($src);
                break;
        }
        if (!$img) {
            return null;
        }
        $w = imagesx($img);
        $h = imagesy($img);
        if ($w <= $maxWidth) {
            imagedestroy($img);
            return null; // 原图已经够小
        }
        $tw = $maxWidth;
        $th = (int) max(1, round($h * ($maxWidth / $w)));
        $thumb = imagecreatetruecolor($tw, $th);
        if (!$thumb) {
            imagedestroy($img);
            return null;
        }
        imagecopyresampled($thumb, $img, 0, 0, 0, 0, $tw, $th, $w, $h);
        $dest = preg_replace('/\.[a-z]+$/i', '', $src) . '_480w.webp';
        $ok = imagewebp($thumb, $dest, 82);
        imagedestroy($img);
        imagedestroy($thumb);
        if (!$ok) {
            return null;
        }
        $rel = str_replace(realpath(PUBLIC_DIR), '', realpath($dest) ?: '');
        return str_replace(DIRECTORY_SEPARATOR, '/', $rel) ?: null;
    }
}
