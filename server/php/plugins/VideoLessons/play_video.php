<?php
/**
 * To play the course videos
 *
 * PHP version 5
 *
 * @category   PHP
 * @package    skillr
 * @subpackage Core
 * @author     Agriya <info@agriya.com>
 * @copyright  2018 Agriya Infoway Private Ltd
 * @license    http://www.agriya.com/ Agriya Infoway Licence
 * @link       http://www.agriya.com
 */
// Refenence links: http://stackoverflow.com/questions/7917851/generate-ip-and-time-limited-download-link and http://stackoverflow.com/questions/3128906/mp4-plays-when-accessed-directly-but-not-when-read-through-php-on-ios
// Current code logic from: We tried with this https://gist.github.com/codler/3906826 and it working; 

$app_path = dirname(dirname(dirname(__FILE__))) . DIRECTORY_SEPARATOR;
require_once $app_path . 'config.inc.php';

if (!empty($_GET['id']) && !empty($_GET['hash']) && !empty($_GET['type'])) {
    $id = $_GET['id'];
    $hash = $_GET['hash'];
    $ip = $_SERVER['REMOTE_ADDR'];
    $timestamp = $_GET['timestamp'];
    $type = ($_GET['type'] == 'lesson') ? 'OnlineCourseLesson' : 'CoursePromoVideo';
    $md5_hash = md5(ACE_SECRET_KEY . $type . $id . $ip . $timestamp . SITE_NAME);
    if ($hash == $md5_hash && $timestamp >= time()) {
		 $val_array = array(
            $id
        );
		if ($type == 'OnlineCourseLesson') {
            $result = r_query('SELECT id, filename FROM online_course_lessons WHERE id = $1 and online_lesson_type_id = 3', $val_array);
        } else {
            $result = r_query('SELECT id, promo_video as filename FROM courses WHERE id = $1', $val_array);
        }
        if (!empty($result)) {
            $file = APP_PATH . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . $type . DIRECTORY_SEPARATOR . $result['id'] . DIRECTORY_SEPARATOR . $result['filename'];
            if (file_exists($file)) {
                rangeDownload($file);
            }
        } else {
            header($_SERVER['SERVER_PROTOCOL'] . ' 404 Not Found', true, 404);
        }
	} else {
        header($_SERVER['SERVER_PROTOCOL'] . ' 404 Not Found', true, 404);
    }
} else {
    header($_SERVER['SERVER_PROTOCOL'] . ' 404 Not Found', true, 404);
}
function rangeDownload($file) {
	$fp = @fopen($file, 'rb');
	$size   = filesize($file); // File size
	$length = $size;           // Content length
	$start  = 0;               // Start byte
	$end    = $size - 1;       // End byte
	header('Content-type: video/mp4');
	header("Accept-Ranges: 0-$length");
	if (isset($_SERVER['HTTP_RANGE'])) {
		$c_start = $start;
		$c_end   = $end;
		list(, $range) = explode('=', $_SERVER['HTTP_RANGE'], 2);
		if (strpos($range, ',') !== false) {
			header('HTTP/1.1 416 Requested Range Not Satisfiable');
			header("Content-Range: bytes $start-$end/$size");
			exit;
		}
		if ($range == '-') {
			$c_start = $size - substr($range, 1);
		}else{
			$range  = explode('-', $range);
			$c_start = $range[0];
			$c_end   = (isset($range[1]) && is_numeric($range[1])) ? $range[1] : $size;
		}
		$c_end = ($c_end > $end) ? $end : $c_end;
		if ($c_start > $c_end || $c_start > $size - 1 || $c_end >= $size) {
			header('HTTP/1.1 416 Requested Range Not Satisfiable');
			header("Content-Range: bytes $start-$end/$size");
			exit;
		}
		$start  = $c_start;
		$end    = $c_end;
		$length = $end - $start + 1;
		fseek($fp, $start);
		header('HTTP/1.1 206 Partial Content');
	}
	header("Content-Range: bytes $start-$end/$size");
	header("Content-Length: ".$length);
	$buffer = 1024 * 8;
	while(!feof($fp) && ($p = ftell($fp)) <= $end) {
		if ($p + $buffer > $end) {
			$buffer = $end - $p + 1;
		}
		set_time_limit(0);
		echo fread($fp, $buffer);
		flush();
	}
	fclose($fp);
	exit();
}