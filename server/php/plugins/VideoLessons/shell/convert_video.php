<?php
/**
 * Skillr
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
$app_path = dirname(dirname(dirname(dirname(__FILE__)))) . DIRECTORY_SEPARATOR;
require_once $app_path . 'config.inc.php';
require_once $app_path . 'constants.php';
require_once $app_path . 'libs' . DIRECTORY_SEPARATOR . 'core.php';
error_log("Entering Video Convert cron at " . date('Y-M-d H:i:s') , 3, APP_PATH . DIRECTORY_SEPARATOR . 'tmp' . DIRECTORY_SEPARATOR . 'logs' . DIRECTORY_SEPARATOR . "error.log");
$online_course_lessons = pg_query_cache("select id, filename from online_course_lessons where  is_video_converting_is_processing = 1 and online_lesson_type_id = 3 order by id desc", array());
if (!empty($online_course_lessons)) {
    foreach ($online_course_lessons as $online_course_lesson) {
        $ffmpeg_origin_path = APP_PATH . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . 'OnlineCourseLessonOrigin' . DIRECTORY_SEPARATOR . $online_course_lesson['id'];
        $ffmpeg_media_dir = APP_PATH . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . 'OnlineCourseLesson' . DIRECTORY_SEPARATOR . $online_course_lesson['id'];       		
		if (!file_exists($ffmpeg_media_dir)) {
            mkdir($ffmpeg_media_dir, 0777, true);
        }
		//ckecking if file already exist 
		$file_path = pathinfo($online_course_lesson['filename']);
		$file_name = $ffmpeg_media_dir . DIRECTORY_SEPARATOR . $file_path['filename'].".mp4";		
		if(file_exists($file_name)){
			@unlink($file_name);
		}
		
        $ffmpeg_media_source = $ffmpeg_origin_path . DIRECTORY_SEPARATOR . $online_course_lesson['filename'];
        $ffmpeg_media_target = $ffmpeg_media_dir . DIRECTORY_SEPARATOR . $online_course_lesson['filename'];
        $res = convert_video($ffmpeg_media_source, $ffmpeg_media_target);
		$target_file = pathinfo($ffmpeg_media_target);
		$target_file_name = $target_file['filename'].".mp4";
        if ($res['result'] == 0) {
            if (!empty($res['duration'])) {
                $data = array(
                    $res['duration'],
                    $online_course_lesson['id'],
					$target_file_name
                );
                pg_execute_query("UPDATE online_course_lessons SET is_video_converting_is_processing = 0, is_lesson_ready_to_view = 1, duration = $1, filename = $3 WHERE id = $2", $data);
            } else {
                $data = array(
                    $online_course_lesson['id']
                );
                pg_execute_query("UPDATE online_course_lessons SET is_video_converting_is_processing = 0, is_lesson_ready_to_view = 1, filename = $3 WHERE id = $1", $data);
            }
        } else {
            $data = array(
                $online_course_lesson['id']
            );
            pg_execute_query("UPDATE online_course_lessons SET is_video_converting_is_processing = 0, is_lesson_ready_to_view = 0 WHERE id = $1", $data);
        }
    }
}
$courses = pg_query_cache("select id, promo_video from courses where is_promo_video_converting_is_processing = 1 and promo_video is not null order by id desc", array());
if (!empty($courses)) {
    foreach ($courses as $course) {
        $ffmpeg_origin_path = APP_PATH . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . 'CoursePromoVideoOrigin' . DIRECTORY_SEPARATOR . $course['id'];
        $ffmpeg_media_dir = APP_PATH . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . 'CoursePromoVideo' . DIRECTORY_SEPARATOR . $course['id'];
        if (!file_exists($ffmpeg_media_dir)) {
            mkdir($ffmpeg_media_dir, 0777, true);
        }
        $ffmpeg_media_source = $ffmpeg_origin_path . DIRECTORY_SEPARATOR . $course['promo_video'];
        $ffmpeg_media_target = $ffmpeg_media_dir . DIRECTORY_SEPARATOR . $course['promo_video'];
        $files = glob($ffmpeg_media_dir . DIRECTORY_SEPARATOR . '*'); // get all file names
        foreach ($files as $file) { // iterate files
            if (is_file($file)) {
                unlink($file); // delete file
                
            }
        }
        $res = convert_video($ffmpeg_media_source, $ffmpeg_media_target);
		$target_file = pathinfo($ffmpeg_media_target);
		$target_file_name = $target_file['filename'].".mp4";
        if ($res['result'] == 0) {
            $data = array(
                $course['id'],
				$target_file_name
            );
            pg_execute_query("UPDATE courses SET is_promo_video_converting_is_processing = 0, is_promo_video_convert_error = 0, promo_video = $2 WHERE id = $1", $data);
        } else {
            $data = array(
                $course['id']
            );
            pg_execute_query("UPDATE courses SET is_promo_video_converting_is_processing = 0, is_promo_video_convert_error = 1 WHERE id = $1", $data);
        }
    }
}
/**
 * PHP FFMPEG Video Convertion
 *
 * @return boolean
 */
function convert_video($source, $target)
{
    $ffmpeg = '';
    $data = array();
    $file_info = pathinfo($target);
    $source_file = $file_info['dirname'] . DIRECTORY_SEPARATOR . $file_info['filename'] . '.mp4';
    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
        $ffmpeg = dirname(dirname(__FILE__)) . DIRECTORY_SEPARATOR . 'libs' . DIRECTORY_SEPARATOR . 'Vendors' . DIRECTORY_SEPARATOR . 'ffmpeg' . DIRECTORY_SEPARATOR . 'bin' . DIRECTORY_SEPARATOR . 'ffmpeg.exe';
        exec($ffmpeg . ' -i  ' . $source . ' -s 720x540  ' . $source_file, $output, $return);
    } else if (strtoupper(substr(PHP_OS, 0, 3)) === 'LIN') {
        exec('ffmpeg -i  ' . $source . ' -s 720x540 -b 1500k -vcodec libx264 -vpre slow -vpre baseline -g 30 ' . $source_file, $output, $return); // referred from: http://stackoverflow.com/questions/13560852/convert-mp4-to-maximum-mobile-supported-mp4-using-ffmpeg
    }
    $time_slot = shell_exec($ffmpeg . " -i \"{$source}\" 2>&1");
    $search = '/Duration: (.*?),/';
    preg_match($search, $time_slot, $matches);
    $time = explode(':', $matches[1]);
    $data['duration'] = $time[1] . '.' . floor($time[2]);
    $data['result'] = $return;
	$is_keep_original_video_file_in_server = r_query("SELECT value FROM settings WHERE name ='video.is_keep_original_video_file_in_server'");
	if($is_keep_original_video_file_in_server['value'] === '0'){		
		if(file_exists($source)){
			@unlink($source);
		}
	}
    return $data;	
}

