<?php

declare(strict_types=1);

require_once BACKEND_DIR . '/lib/Parsedown.php';

/*
 |--------------------------------------------------------------------------
 | Markdown：解析、标题锚点、摘要、阅读时长
 |--------------------------------------------------------------------------
 */

final class ArtParsedown extends Parsedown
{
    public function __construct()
    {
        $this->setSafeMode(true);
        $this->setBreaksEnabled(false);
        $this->setMarkupEscaped(false);
    }

    /** 为 h2/h3 注入 id 锚点（前端据此生成目录） */
    protected function blockHeader($Line)
    {
        $block = parent::blockHeader($Line);
        if ($block === null) {
            return null;
        }
        $level = $block['element']['name'] ?? '';
        if ($level !== 'h2' && $level !== 'h3') {
            return $block;
        }
        $text = $this->flattenText($block['element']['text'] ?? '');
        $block['element']['attributes'] = array_merge(
            $block['element']['attributes'] ?? [],
            ['id' => Markdown::slugify($text)]
        );
        return $block;
    }

    private function flattenText($node): string
    {
        if (is_string($node)) {
            return $node;
        }
        if (is_array($node)) {
            $out = '';
            foreach ($node as $k => $v) {
                if ($k === 'text' && is_string($v)) {
                    $out .= $v;
                } elseif (is_array($v)) {
                    $out .= $this->flattenText($v);
                }
            }
            return $out;
        }
        return '';
    }
}

final class Markdown
{
    private static ?ArtParsedown $parser = null;

    private static function parser(): ArtParsedown
    {
        if (self::$parser === null) {
            self::$parser = new ArtParsedown();
        }
        return self::$parser;
    }

    public static function html(string $markdown): string
    {
        return self::parser()->text($markdown);
    }

    /**
     * 渲染 + 摘要 + 阅读时长
     * @return array{html:string, excerpt:string, readingTime:int}
     */
    public static function render(string $markdown): array
    {
        $html = self::html($markdown);
        $text = trim(preg_replace('/\s+/u', ' ', strip_tags($html)) ?? '');

        $excerpt = mb_substr($text, 0, 120);
        if (mb_strlen($text) > 120) {
            $excerpt .= '…';
        }

        // 中文按字、英文按词估算
        preg_match_all('/[\x{4e00}-\x{9fff}]/u', $text, $cjk);
        $latin = str_word_count(preg_replace('/[\x{4e00}-\x{9fff}]/u', ' ', $text) ?? '');
        $minutes = (int) ceil(count($cjk[0]) / 400 + $latin / 200);

        return [
            'html' => $html,
            'excerpt' => $excerpt,
            'readingTime' => max(1, $minutes),
        ];
    }

    public static function slugify(string $text): string
    {
        $text = trim($text);
        $text = preg_replace('/[^\p{L}\p{N}\s_-]+/u', '', $text) ?? '';
        $text = preg_replace('/[\s_]+/u', '-', $text) ?? '';
        $text = preg_replace('/-{2,}/', '-', $text) ?? '';
        $text = trim($text, '-');
        $text = mb_strtolower($text);
        return $text !== '' ? $text : 'sec';
    }
}
