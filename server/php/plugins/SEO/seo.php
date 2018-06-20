<?php
/**
 * For SEO Purpose
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
require_once $app_path . 'libs' . DIRECTORY_SEPARATOR . 'Inflector.php';
$inflector = new Inflector();
$api_url_map = array(
    '/\/course\/(?P<course_id>\d+)\/(?P<hash>.*)/' => array(
        'api_url' => 'v1/courses/{id}.json?field=title,slug,subtitle,parent_category_name,description,displayname,category_name,image_hash,meta_keywords,meta_description,average_rating,course_user_feedback_count&token=' . SEO_TOKEN,
    ) ,
    '/^\/users\/login$/' => array(
        'api_url' => null,
        'title' => 'Login'
    ) ,
    '/\/page\/(?P<slug>.*)/' => array(
        'api_url' => 'v1/page/{slug}.json?field=title,content&token=' . SEO_TOKEN,
    ) ,
    '/^\/users\/signup$/' => array(
        'api_url' => null,
        'title' => 'Signup'
    ) ,
    '/^\/users\/forgot_password$/' => array(
        'api_url' => null,
        'title' => 'Forgot Password'
    ) ,
    '/\/user\/(?P<user_id>\d+)\/(?P<hash>.*)/' => array(
        'api_url' => 'v1/users/{id}.json?field=displayname,designation,headline,biography,image_hash,meta_keywords,meta_description&token=' . SEO_TOKEN
    ) ,
    '/^\/subscribe\/plans$/' => array(
        'api_url' => 'v1/subscriptions.json?fields=name&token=' . SEO_TOKEN,
        'title' => 'Subscription Plans'
    ) ,
);
$meta_keywords = '';
$meta_description = '';
$title = '';
$og_image = APP_URL . 'assets/img/logo-600x315.png';
$site_name = '';
$og_type = 'website';
$og_url = APP_URL;
$res = json_decode(shell_exec("php " . $app_path . "R" . DIRECTORY_SEPARATOR . "r.php " . urlencode('v1/settings.json?token=' . SEO_TOKEN . '&limit=all')) , true);
foreach ($res['data'] as $key => $arr) {
    if ($res['data'][$key]['name'] == 'meta.keywords') {
        $meta_keywords = $res['data'][$key]['value'];
    }
    if ($res['data'][$key]['name'] == 'meta.meta_description') {
        $meta_description = $res['data'][$key]['value'];
    }
    if ($res['data'][$key]['name'] == 'site.name') {
        $title = $site_name = $res['data'][$key]['value'];
    }
}
if (!empty($_GET['_escaped_fragment_'])) {
    foreach ($api_url_map as $url_pattern => $values) {
        if (preg_match($url_pattern, $_GET['_escaped_fragment_'], $matches)) { // Match _escaped_fragment_ with our api_url_map array; For selecting API call
            if (!empty($values['title'])) { //Default title; We will change title for course and user page below;
                $title = $site_name . ' | ' . $values['title'];
            }
            if (!empty($values['api_url'])) {
                $id = !empty($matches['course_id']) ? $matches['course_id'] : (!empty($matches['user_id']) ? $matches['user_id'] : 0);
                $slug = !empty($matches['slug']) ? $matches['slug'] : '';
                if (!empty($id)) {
                    $api_url = str_replace('{id}', $id, $values['api_url']); // replacing id value
                    
                }
                if (!empty($slug)) {
                    $api_url = str_replace('{slug}', $slug, $values['api_url']); // replacing id value
                    
                }
                $response = json_decode(shell_exec("php " . $app_path . "R" . DIRECTORY_SEPARATOR . "r.php " . urlencode($api_url)) , true);
                if (!empty($response['data']['0'])) {
                    unset($response['_metadata']); // removing _metadata from json object
                    // Need to handle response array
                    if (!empty($response['data']['0']['meta_keywords'])) {
                        $meta_keywords = $response['data']['0']['meta_keywords'];
                    }
                    if (!empty($response['data']['0']['meta_description'])) {
                        $meta_description = $response['data']['0']['meta_description'];
                    }
                } else {
                    $isNoRecordFound = 1;
                }
            }
            if (!empty($matches['course_id'])) {
                if (!empty($response['data']['0'])) {
                    $title = $response['data']['0']['title'];
                    $og_url = $og_url . '#!/course/' . $matches['course_id'] . '/' . $response['data']['0']['slug'];
                    if (!empty($response['data']['0']['image_hash'])) {
                        $og_image = APP_URL . 'img/social_thumb/Course/' . $response['data']['0']['image_hash'];
                    } else {
                        $og_image = APP_URL . 'img/social_thumb/Course/0.default.jpg';
                    }
                }
            } else if (!empty($matches['user_id'])) {
                if (!empty($response['data']['0'])) {
                    $title = $site_name . ' | ' . $response['data']['0']['displayname']; // <title>ACEV3 | John Peter</title>
                    $og_url = $og_url . '#!/user/' . $matches['user_id'] . '/' . $matches['hash'];
                }
            } else {
                if (!empty($response['data']['0']['title'])) {
                    $title = $site_name . ' | ' . $response['data']['0']['title'];
                }
            }
        }
    }
}
if (!empty($response->error) || !empty($isNoRecordFound)) { // returning 404, if authentication failed or no record found
    header('Access-Control-Allow-Origin: *');
    header($_SERVER['SERVER_PROTOCOL'] . ' 404 Not Found', true, 404);
    exit;
}
?>
<!DOCTYPE html><html>
<head>
  <title><?php
echo $title; ?></title>
  <meta charset="UTF-8">
  <meta name="description" content="<?php
echo $meta_description; ?>"/>
  <meta name="keywords" content="<?php
echo $meta_keywords; ?>"/>
  <meta property="og:app_id" content=""/>
  <meta property="og:type" content="<?php
echo $og_type; ?>"/>
  <meta property="og:title" content="<?php
echo $title; ?>"/>
  <meta property="og:description" content="<?php
echo $meta_description; ?>"/>
  <meta property="og:type" content="<?php
echo $og_type; ?>"/>
  <meta property="og:image" content="<?php
echo $og_image; ?>"/>
  <meta property="og:site_name" content="<?php
echo $site_name; ?>"/>
  <meta property="og:url" content="<?php
echo $og_url; ?>"/>
</head>
<body>
<?php
if (!empty($response['data']['0'])) { ?>
  <dl>
  <?php
    foreach ($response['data']['0'] as $key => $value) {
?>
    <dt><?php
        echo $inflector->humanize($key); ?></dt>
	<dd>
	<?php
        if ($key == 'title') {
            $course_title = $value;
        }
        if ($key == 'description') {
            $description = $value;
        }
        if ($key == 'average_rating') {
            $average_rating = $value;
        } else if ($key == 'course_user_feedback_count') {
            $course_user_feedback_count = $value;
        } else {
            echo $value;
        }
        if (isset($average_rating) && isset($course_user_feedback_count) && isset($course_title) && isset($description) && empty($ratingDisplayed)) {
            $ratingDisplayed = 1; ?>
		<div itemscope itemtype="http://schema.org/Product">
			<h2 itemprop="name"><?php
            echo $course_title; ?></h2>
			<div itemprop="description"><?php
            echo $description; ?></div>
			<div itemprop="aggregateRating" itemscope="itemscope" itemtype="http://schema.org/AggregateRating">
				<span itemprop="ratingValue"><?php
            echo $average_rating; ?></span>
				<span itemprop="ratingCount"><?php
            echo $course_user_feedback_count; ?></span>
			</div>
		</div>
	<?php
        } ?>
	</dd><?php
    } ?>
  </dl><?php
} else { // For pages like login, register, home, contactus - we need to fill something in body... If body content is empty, in facebook lint or google search, it will not works
    
?>
		<div><?php
    echo $site_name; ?></div>
		<div><?php
    echo $meta_keywords; ?></div>
		<?php
} ?>
</body>
</html>