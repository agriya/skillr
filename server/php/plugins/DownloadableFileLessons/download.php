<?php
/**
 * To download course attachments
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
$app_path = dirname(dirname(dirname(__FILE__))) . DIRECTORY_SEPARATOR;
require_once $app_path . 'config.inc.php';
if (!empty($_GET['id']) && !empty($_GET['hash'])) {
    $id = $_GET['id'];
    $hash = $_GET['hash'];
    $ip = $_SERVER['REMOTE_ADDR'];
    $timestamp = $_GET['timestamp'];
    $md5_hash = md5(ACE_SECRET_KEY . 'OnlineCourseLesson' . $id . $ip . $timestamp . SITE_NAME);
    if ($hash == $md5_hash && $timestamp >= time()) {
        $val_array = array(
            $id
        );
        $result = r_query('SELECT id, filename FROM online_course_lessons WHERE id = $1 and online_lesson_type_id = 5', $val_array);
        if (!empty($result)) {
            $file = dirname(dirname(dirname(dirname(dirname(__FILE__))))) . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . 'OnlineCourseLesson' . DIRECTORY_SEPARATOR . $result['id'] . DIRECTORY_SEPARATOR . $result['filename'];
            if (file_exists($file)) {
                $basename = basename($file);
                $add_slash = addcslashes($basename, '"\\');
                $quoted = sprintf('"%s"', $add_slash);
                $size = filesize($file);
                header('Content-Description: File Transfer');
                header('Content-Type: application/octet-stream');
                header('Content-Disposition: attachment; filename=' . $quoted);
                header('Content-Transfer-Encoding: binary');
                header('Connection: Keep-Alive');
                header('Content-length: ' . $size);
                header('Expires: 0');
                header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
                header('Pragma: public');
                readfile($file);
                exit;
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
