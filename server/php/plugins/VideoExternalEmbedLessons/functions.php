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
/**
 * Return video URL is valid or not
 * @return string
 * @param $video_url string
 *
 */
require_once 'libs' . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php';
use MediaEmbed\MediaEmbed;
/**
 * Return embed code is valid or not
 * @return string
 * @param $video_url string
 *
 */
function getVideoEmbedCode($video_url)
{
	$MediaEmbed = new MediaEmbed();
	$MediaObject = $MediaEmbed->parseUrl($video_url);
	if ($MediaObject) {
		$MediaObject->setParam([
			'autoplay' => 0,
			'loop' => 1
		]);
		$MediaObject->setAttribute([
			'type' => null,
			'class' => 'iframe-class',
			'data-html5-parameter' => true
		]);
		return $MediaObject->getEmbedCode();
	} else {
		return 0;
	}
	
}