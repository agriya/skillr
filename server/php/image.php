<?php
/**
 * To create thumbnail for uploaded images
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
require_once 'config.inc.php';
$size = $_GET['size'];
$model = $_GET['model'];
if ($model == 'CoursePreview') {
	$val = $thumbsizes['Course'][$size];
} else {
	$val = $thumbsizes[$model][$size];
}
$filename = $_GET['filename'];
list($width, $height) = explode('x', $val);
list($id, $hash, $ext) = explode('.', $filename);
if (($hash == md5(ACE_SECRET_KEY . $model . $id . $ext . SITE_NAME)) || ($id == 0 && $hash == 'default') || $model == 'CoursePreview') {
    $val_array = array(
        $id
    );
	if ($model == 'CoursePreview') {
		$fullPath = $hash . '.' . $ext;
	}
    else if ($model == 'Course' && ($id != 0 && $hash != 'default')) {
        $s_result = r_query('SELECT course_image FROM courses WHERE id = $1', $val_array);
        $fullPath = $s_result['course_image'];
    } else if ($model == 'User' && ($id != 0 && $hash != 'default')) {
        $s_result = r_query('SELECT user_image FROM users WHERE id = $1', $val_array);
        $fullPath = $s_result['user_image'];
    } else if($id == 0 && $hash == 'default') {
		$fullPath = 'default.'.$ext;
	}
    $query_string = $_GET;
    $query_string['id'] = $id;
    $query_string['ext'] = $ext;
    $query_string['hash'] = $hash;
	if ($model == 'CoursePreview') {
	    $fullPath = dirname(dirname(dirname(__FILE__))) . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . 'temp' . DIRECTORY_SEPARATOR . 'Course' . DIRECTORY_SEPARATOR . $query_string['id'] . DIRECTORY_SEPARATOR . $fullPath;
	} else {
	    $fullPath = dirname(dirname(dirname(__FILE__))) . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . $model . DIRECTORY_SEPARATOR . $query_string['id'] . DIRECTORY_SEPARATOR . $fullPath;
	}
    $is_aspect = false;
    if (!empty($aspect[$model][$size])) {
        $is_aspect = true;
    }
    if ($_SERVER['HTTP_HOST'] == 'localhost') {
        $mediadir = dirname(dirname(dirname(__FILE__))) . DIRECTORY_SEPARATOR . 'client' . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR . 'img' . DIRECTORY_SEPARATOR . $query_string['size'] . DIRECTORY_SEPARATOR . $query_string['model'] . DIRECTORY_SEPARATOR;
    } else {
        $mediadir = dirname(dirname(dirname(__FILE__))) . DIRECTORY_SEPARATOR . 'client' . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR . 'img' . DIRECTORY_SEPARATOR . $query_string['size'] . DIRECTORY_SEPARATOR . $query_string['model'] . DIRECTORY_SEPARATOR;
    }
    if (!file_exists($mediadir)) {
        mkdir($mediadir, 0777, true);
    }
    $filename = $query_string['id'] . '.' . $query_string['hash'] . '.' . $query_string['ext'];
    $writeTo = $mediadir . $filename;
    if (!$width || !$height) {
        header($_SERVER['SERVER_PROTOCOL'] . ' 404 Not Found', true, 404);
        exit;
    }
    if (!($size = getimagesize($fullPath))) {
        header($_SERVER['SERVER_PROTOCOL'] . ' 404 Not Found', true, 404);
        exit;
    }
    list($currentWidth, $currentHeight, $currentType) = $size;
    if (class_exists('imagick')) {
        $new_image_obj = new imagick($fullPath);
        $new_image = $new_image_obj->clone();
        $new_image->setImageColorspace(Imagick::COLORSPACE_RGB);
        $new_image->flattenImages();
        if ($is_beyond_original && ($width > $currentWidth || $height > $currentHeight)) {
            $width = $currentWidth;
            $height = $currentHeight;
        }
        if (!empty($aspect)) {
            $new_image->cropThumbnailImage($width, $height);
        } else {
            $new_image->scaleImage($width, $height, false);
        }
        $new_image->writeImage($writeTo);
    } else {
        $target['width'] = $currentWidth;
        $target['height'] = $currentHeight;
        $target['x'] = $target['y'] = 0;
        $types = array(
            1 => 'gif',
            'jpeg',
            'png',
            'swf',
            'psd',
            'wbmp'
        );
        $imageInfo = getimagesize($fullPath);
        $imageInfo['channels'] = !empty($imageInfo['channels']) ? $imageInfo['channels'] : 1;
        $imageInfo['bits'] = !empty($imageInfo['bits']) ? $imageInfo['bits'] : 1;
        $memoryNeeded = round(($imageInfo[0] * $imageInfo[1] * $imageInfo['bits'] * $imageInfo['channels'] / 8 + Pow(2, 16)) * 1.65);
        if (function_exists('memory_get_usage') && memory_get_usage() + $memoryNeeded > (integer)ini_get('memory_limit') * pow(1024, 2)) {
            ini_set('memory_limit', (integer)ini_get('memory_limit') + ceil(((memory_get_usage() + $memoryNeeded) - (integer)ini_get('memory_limit') * pow(1024, 2)) / pow(1024, 2)) . 'M');
        }
        $image = call_user_func('imagecreatefrom' . $types[$currentType], $fullPath);
        ini_restore('memory_limit');
        if (!empty($aspect)) {
            if (($currentHeight / $height) > ($currentWidth / $width)) {
                $width = ceil(($currentWidth / $currentHeight) * $height);
            } else {
                $height = ceil($width / ($currentWidth / $currentHeight));
            }
        } else {
            $proportion_X = $currentWidth / $width;
            $proportion_Y = $currentHeight / $height;
            if ($proportion_X > $proportion_Y) {
                $proportion = $proportion_Y;
            } else {
                $proportion = $proportion_X;
            }
            $target['width'] = $width * $proportion;
            $target['height'] = $height * $proportion;
            $original['diagonal_center'] = round(sqrt(($currentWidth * $currentWidth) + ($currentHeight * $currentHeight)) / 2);
            $target['diagonal_center'] = round(sqrt(($target['width'] * $target['width']) + ($target['height'] * $target['height'])) / 2);
            $crop = round($original['diagonal_center'] - $target['diagonal_center']);
            if ($proportion_X < $proportion_Y) {
                $target['x'] = 0;
                $target['y'] = round((($currentHeight / 2) * $crop) / $target['diagonal_center']);
            } else {
                $target['x'] = round((($currentWidth / 2) * $crop) / $target['diagonal_center']);
                $target['y'] = 0;
            }
        }
        if (function_exists('imagecreatetruecolor') && ($temp = imagecreatetruecolor($width, $height))) {
            imagecopyresampled($temp, $image, 0, 0, $target['x'], $target['y'], $width, $height, $target['width'], $target['height']);
        } else {
            $temp = imagecreate($width, $height);
            imagecopyresized($temp, $image, 0, 0, 0, 0, $width, $height, $currentWidth, $currentHeight);
        }
        if (strtolower($query_string['ext']) == 'png') {
            imagepng($temp, $writeTo);
        } else if (strtolower($query_string['ext']) == 'jpg' || strtolower($query_string['ext']) == 'jpeg') {
            imagejpeg($temp, $writeTo, 100);
        } else if (strtolower($query_string['ext']) == 'gif') {
            imagegif($temp, $writeTo);
        }
        // Set the content type header - in this case image/jpeg
        header('Content-Type: image/jpeg');
        // Output the image
        if (!empty($aspect)) {
            imagejpeg($image);
        } else {
            imagejpeg($temp);
        }
        imagedestroy($image);
        imagedestroy($temp);
    }
} else {
    header($_SERVER['SERVER_PROTOCOL'] . ' 404 Not Found', true, 404);
}
