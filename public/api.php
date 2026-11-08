<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/backend/bootstrap.php';

header('Cache-Control: no-store');
Api::dispatch();
