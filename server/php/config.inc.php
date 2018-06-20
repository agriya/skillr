<?php
/**
 * Core configurations
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
global $start_time;
$start_time = microtime(true);
header('X-cache-1-start: hit at ' . $start_time);
$token = '';
$r_debug = '';
$db_lnk = '';
$memcache = '';
$authUser = array();
$localAccessIps = array(
    '127.0.0.1',
	'192.168.1.226',
	'192.168.1.95',
    '::1'
);

global $r_debug, $memcache;
define('R_DEBUG', false);
ini_set('display_errors', R_DEBUG);
define('R_API_VERSION', 1);
define('R_DB_HOST', 'localhost');
define('R_DB_USER', 'ENTER DB USER HERE');
define('R_DB_PASSWORD', 'ENTER DB PASSWORD HERE');
define('R_DB_NAME', 'ENTER DB NANE HERE');
define('SITE_LICENSE_KEY', 'REPLACE YOUR LICENCE HERE');
define('PAGING_COUNT', 10);
define('R_DB_PORT', 5432);
define('APP_PATH', dirname(dirname(dirname(__FILE__))));
define('OAUTH_CLIENTID', '7742632501382313');
define('OAUTH_CLIENT_SECRET', '4g7C4l1Y2b0S6a7L8c1E7B3K0e');
define('ACE_SECRET_KEY', 'e9a556134534545ab47c6c81c14f06c0b8sdfsdf');
define('SITE_NAME', 'Skillr');
define('SEO_TOKEN', '03e281233bf3bd725f54875dd66d4bc8f4ccdeb6'); // used in shell/seo.php
define('APP_URL', '/'); // for CLI where auto detection won't work
if (!file_exists(APP_PATH . '/tmp/cache/site_url_for_shell.php')) {
    $fh = fopen(APP_PATH . '/tmp/cache/site_url_for_shell.php', 'a');
    fwrite($fh, '<?php' . "\n");
    fwrite($fh, '$_server_domain_url = \'' . $_server_domain_url . '\';');
    fclose($fh);
}

$thumbsizes = array(
    'Course' => array(
		'micro_thumb' => '100x67',
		'small_thumb' => '150x100',
		'normal_thumb' => '233x155',
		'medium_thumb' =>  '264x176',
		'large_medium_thumb' =>  '295x166',
		'big_thumb' => '750x500',
		'large_thumb' => '1600x550',
        'very_large_thumb' => '1170x659',
		'social_thumb' =>  '1200x630',
    ) ,
    'User' => array(
		'micro_thumb' => '20x20',
		'small_thumb' => '32x32',
		'normal_thumb' => '75x75',
		'medium_thumb' =>  '100x100',
		'big_thumb' => '255x255',
		'social_thumb' =>  '1200x630',
    )
);

/**
 * Connect Database
 *
 * @return void
 */
function setDbConnect()
{
    global $db_lnk;
    $db_lnk = pg_connect('host=' . R_DB_HOST . ' port=' . R_DB_PORT . ' dbname=' . R_DB_NAME . ' user=' . R_DB_USER . ' password=' . R_DB_PASSWORD . ' options=--client_encoding=UTF8') or die('Database could not connect');
}
/**
 * Get site URL
 *
 * @param string $type To differentiate upload or normal
 *
 * @return string
 */
function getSiteUri($type = '')
{
    if ($_SERVER['HTTP_HOST'] == 'localhost' || $_SERVER['HTTP_HOST'] == '192.168.1.142') {
        $path = 'http://' . $_SERVER['HTTP_HOST'] . '/acev3';
    } else {
        $path = 'http://' . $_SERVER['HTTP_HOST'];
    }
    return $path;
}
/**
 * Check whether the query in Amazon ElasticCache if so fetch the cached result else execute the query
 *
 * @param string  $sql          SQL query
 * @param array   $val_arr      Value array to replace
 * @param boolean $timeout      Minutes to cache query results in Amazon ElasticCache
 * @param boolean $from_r_query To differentiate the call from r_query or others
 *
 * @return mixed
 */
function pg_query_cache($sql, $val_arr = array(), $timeout = 0, $from_r_query = 0)
{
    global $memcache;
    $result = array();
    if ($memcache && !empty($timeout)) {
        $key = 'CACHE' . md5($sql . $from_r_query . implode(',', $val_arr));
        $result = $memcache->get($key);
        if ($memcache->getResultCode() == 16) {
            $result = _getResult($sql, $val_arr, $from_r_query);
            $memcache->set($key, $result, $timeout);
        } else {
            header('X-cache: hit at ' . __LINE__);
        }
    } else {
        $result = _getResult($sql, $val_arr, $from_r_query);
    }
    return $result;
}
/**
 * Fetch the results from database
 *
 * @param string  $sql          SQL query
 * @param array   $val_arr      Value array to replace
 * @param boolean $from_r_query To differentiate the call from r_query or others
 *
 * @return mixed
 */
function _getResult($sql, $val_arr = array(), $from_r_query)
{
    global $db_lnk;
    if (!$db_lnk) {
        setDbConnect();
    }
    $result = array();
    $_result = pg_query_params($db_lnk, $sql, $val_arr);
    if (empty($from_r_query)) {
        while ($row = pg_fetch_assoc($_result)) {
            if (!empty($row['row_to_json'])) {
                $result[] = $row['row_to_json'];
            } else {
                $result[] = $row;
            }
        }
    } else {
        $result = pg_fetch_assoc($_result);
    }
    return $result;
}
/**
 * To execute the query
 *
 * @param string $qry        SQL query
 * @param array  $conditions Conditions to fetch the query results
 *
 * @return mixed
 */
function r_query($qry, $conditions = array())
{
    $result = pg_query_cache($qry, $conditions, 0, 1);
    if ($result) {
        return $result;
    } else {
        return false;
    }
}
/**
 * Decode JSON String
 *
 * @param json $json JSON value
 *
 * @return mixed
 */
function safe_json_decode($json)
{
    $return = json_decode($json, true);
    if ($return === null) {
        $error['error']['code'] = 1;
        $error['error']['message'] = 'Syntax error, malformed JSON';
        return $error;
    }
    return $return;
}
/**
 * Execute CURL Request
 *
 * @param string $url    URL to execute
 * @param string $method CURL method to differentiate get, post, put & delete
 * @param array  $post   Post data
 * @param string $format To differentiate post data in plain or json format
 *
 * @return mixed
 */
function _execute($url, $method = 'get', $post = array() , $format = 'plain')
{
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 300); // 300 seconds (5min)
    if ($method == 'get') {
        curl_setopt($ch, CURLOPT_POST, false);
    } elseif ($method == 'post') {
        if ($format == 'json') {
            $post_string = json_encode($post);
            curl_setopt($ch, CURLOPT_HTTPHEADER, array(
                'Content-Type: application/json',
                'Content-Length: ' . strlen($post_string)
            ));
        } else {
            $post_string = http_build_query($post, '', '&');
        }
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $post_string);
    } elseif ($method == 'put') {
        if ($format == 'json') {
            $post_string = json_encode($post);
            curl_setopt($ch, CURLOPT_HTTPHEADER, array(
                'Content-Type: application/json',
                'Content-Length: ' . strlen($post_string)
            ));
        } else {
            $post_string = http_build_query($post, '', '&');
        }
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        curl_setopt($ch, CURLOPT_POSTFIELDS, $post_string);
    } elseif ($method == 'delete') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
    }
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    // Note: timeout also falls here...
    if (curl_errno($ch)) {
        $return['error']['message'] = curl_error($ch);
        curl_close($ch);
        return $return;
    }
    switch ($http_code) {
    case 201:
    case 200:
        if (isJson($response)) {
            $return = safe_json_decode($response);
        } else {
            $return = $response;
        }
        break;

    case 401:
        $return['error']['code'] = 1;
        $return['error']['message'] = 'Unauthorized';
        break;

    default:
        $return['error']['code'] = 1;
        $return['error']['message'] = 'Not Found';
    }
    curl_close($ch);
    return $return;
}
/**
 * To check whether it is json or not
 *
 * @param json $string To check string is a JSON or not
 *
 * @return mixed
 */
function isJson($string)
{
    json_decode($string);
    return (json_last_error() == JSON_ERROR_NONE);
}
/**
 * Post request by using CURL
 *
 * @param string $url    URL to execute
 * @param array  $post   Post data
 * @param string $format To differentiate post data in plain or json format
 *
 * @return mixed
 */
function _doPost($url, $post = array() , $format = 'plain')
{
    return _execute($url, 'post', $post, $format);
}
/**
 * Put request by using CURL
 *
 * @param string $url    URL to execute
 * @param array  $post   Put data
 * @param string $format To differentiate put data in plain or json format
 *
 * @return mixed
 */
function _doPut($url, $post = array() , $format = 'plain')
{
    return _execute($url, 'put', $post, $format);
}
/**
 * Delete request by using CURL
 *
 * @param string $url URL to execute
 *
 * @return mixed
 */
function _doDelete($url)
{
    return _execute($url, 'delete');
}
/**
 * Get request by using CURL
 *
 * @param string $url URL to execute
 *
 * @return mixed
 */
function _doGet($url)
{
    $return = _execute($url);
    return $return;
}
/**
 * To execute query
 *
 * @param string  $sql        SQL query
 * @param array   $val_arr    Value array to replace
 * @param integer $return_row To differentiate the return value as resource or associative array
 *
 * @return mixed
 */
function pg_execute_query($sql, $val_arr, $return_row = 0)
{
	global $db_lnk;
    if (!$db_lnk) {
        setDbConnect();
    }
    $result = @pg_query_params($db_lnk, $sql, $val_arr);
    if ($result === false) {
        $row['error'] = pg_last_error($db_lnk);
    } else {
        $row = $result;
        if ($return_row == 1) {
            $row = pg_fetch_assoc($result);
        }
    }
    return $row;
}
/**
 * To generate query by passed args and insert into table
 *
 * @param string  $table_name Table name
 * @param array   $r_post     Post data
 * @param integer $return_row To send inserted record as return or not
 *
 * @return mixed
 */
function pg_execute_insert($table_name, $r_post, $return_row = 1)
{
    $fields = 'created, modified';
    $values = '\'' . date('Y-m-d H:i:s') . '\', \'' . date('Y-m-d H:i:s') . '\'';
    $val_arr = array();
    $i = 1;
    foreach ($r_post as $key => $value) {
        if ($key != 'id') {
            $fields.= ',"' . $key . '"';
            $values.= ', $' . $i;
            if ($value === false) {
                $val_arr[] = 'false';
            } else {
                $val_arr[] = $value;
            }
            $i++;
        }
    }
    if (!empty($return_row)) {
        $row = pg_execute_query("INSERT INTO " . $table_name . " (" . $fields . ") VALUES (" . $values . ") RETURNING *", $val_arr, 1);
    } else {
        $row = pg_execute_query("INSERT INTO " . $table_name . " (" . $fields . ") VALUES (" . $values . ")", $val_arr, 1);
    }
    return $row;
}
/**
 * To generate query by passed args and update into table
 *
 * @param string $table_name Table name
 * @param array  $r_put      Put data
 *
 * @return mixed
 */
function pg_execute_update($table_name, $r_put)
{
    $fields = 'modified';
    $values = '\'' . date('Y-m-d H:i:s') . '\'';
    $val_arr = array();
    $i = 1;
    foreach ($r_put as $key => $value) {
        $fields.= ', "' . $key . '"';
        $values.= ', $' . $i;
        if ($value === false) {
            $val_arr[] = 'false';
        } else {
            $val_arr[] = $value;
        }
        $i++;
    }
    $val_arr[$i] = $r_put['id'];
    $result = pg_execute_query("UPDATE " . $table_name . " SET (" . $fields . ") = (" . $values . ") WHERE id = $" . $i, $val_arr);
    return $result;
}
/**
 * To send mail using Amazon SES
 *
 * @param array  $data            Mail content
 * @param string $format          Format as html or text
 * @param array  $additional_data Settings while running in cron
 *
 * @return boolean
 */
function r_mail($data)
{
    global $r_debug, $db_lnk, $auth;
    $DEFAULT_FROM_EMAIL = r_query('SELECT name,value  FROM settings WHERE name = $1', array(
        'site.common_from_email'
    ));
    $SITE_NAME = r_query('SELECT name,value  FROM settings WHERE name = $1', array(
        'site.name'
    ));
    if (!empty($data['from'])) {
        $data['##FROM_EMAIL##'] = $data['from'];
    } else {
        $data['from'] = $DEFAULT_FROM_EMAIL['value'];
        $data['##FROM_EMAIL##'] = $DEFAULT_FROM_EMAIL['value'];
    }
    $data['##REPLY_TO_EMAIL##'] = $DEFAULT_FROM_EMAIL['value'];
    $data['##SITE_NAME##'] = $SITE_NAME['value'];
    $data['##SITE_URL##'] = getSiteUri();
    $data['##CONTACT_MAIL##'] = $DEFAULT_FROM_EMAIL['value'];
    $data['##SUPPORT_EMAIL##'] = $DEFAULT_FROM_EMAIL['value'];
    $to = $data['to'];
    $from = $data['from'];
	$headers = 'From:' . $SITE_NAME['value'] . '<' . $data['from'] . '>';
    $template = r_query("SELECT * FROM email_templates WHERE name = '" . pg_escape_string($data['mail']) . "' ");
    if ($template) {
        unset($data['mail']);
        unset($data['from']);
        unset($data['to']);
        $subject = strtr($template['subject'], $data);
        $message = strtr($template['content'], $data);
        @mail($to, $subject, $message, $headers);
		error_log("\n\nTime: " . date('Y-m-d H:i:s', strtotime("now")) , 3, APP_PATH . DIRECTORY_SEPARATOR . 'tmp' . DIRECTORY_SEPARATOR . 'logs' . DIRECTORY_SEPARATOR . 'email_log.log');
        error_log("\nFrom: " . $from, 3, APP_PATH . DIRECTORY_SEPARATOR . 'tmp' . DIRECTORY_SEPARATOR . 'logs' . DIRECTORY_SEPARATOR . 'email_log.log');
        error_log("\nTo: " . $to, 3, APP_PATH . DIRECTORY_SEPARATOR . 'tmp' . DIRECTORY_SEPARATOR . 'logs' . DIRECTORY_SEPARATOR . 'email_log.log');
        error_log("\nSubject: " . $subject, 3, APP_PATH . DIRECTORY_SEPARATOR . 'tmp' . DIRECTORY_SEPARATOR . 'logs' . DIRECTORY_SEPARATOR . 'email_log.log');
        error_log("\nMessage: " . $message, 3, APP_PATH . DIRECTORY_SEPARATOR . 'tmp' . DIRECTORY_SEPARATOR . 'logs' . DIRECTORY_SEPARATOR . 'email_log.log');
        $response['error']['code'] = 0;
        return $response;
    }
    return false;
}
/**
 * Update the Revenue Details in Courses, Users Table
 *
 * @param integer $course_user_id
 *
 */
function _updateRevenue($course_id, $user_id)
{
	if(!empty($course_id)) {
		// Updating course based revenue
		$conditions = array(
			$course_id
		);
		$data = r_query('Select sum(site_commission_amount) as site_revenue_amount, sum(price - site_commission_amount) as total_revenue_amount from course_users where course_id = $1', $conditions);
		if (!empty($data)) {
			$val_arr = array(
				$data['site_revenue_amount'],
				$data['total_revenue_amount'],
				$course_id
			);
			$result = pg_execute_query("UPDATE courses SET site_revenue_amount = $1, total_revenue_amount = $2 WHERE id = $3", $val_arr);
		}

		// Updating teacher revenue
		$conditions = array(
			$course_id
		);
		$course_owner_id = "";
		$data = r_query('Select user_id from courses where id = $1', $conditions);
		if (!empty($data)) {
			$course_owner_id = $data['user_id'];
		}
		$conditions = array(
			$course_owner_id
		);
		$data = r_query('Select sum(site_revenue_amount) as total_site_revenue_amount, sum(total_revenue_amount) as total_earned from courses where user_id = $1', $conditions);
		if (!empty($data)) {
			$val_arr = array(
				$data['total_site_revenue_amount'],
				$data['total_earned'],
				$course_owner_id
			);
			$result = pg_execute_query("UPDATE users SET total_site_revenue_amount = $1, total_earned = $2 WHERE id = $3", $val_arr);
		}
	}
	$spend_amount = 0;
	// Updating spend amount to users table
	$conditions = array(
		$user_id,
		ConstCourseUserStatuses::PaymentPending
	);
	$data = r_query('SELECT sum(price) as total_spend_for_course_booking FROM course_users WHERE user_id = $1 AND course_user_status_id != $2', $conditions);
	$spend_amount = $data['total_spend_for_course_booking'];
	
	$conditions = array(
		$user_id,
		ConstSubscriptionStatuses::Initiated
	);
	$data = r_query('SELECT sum(amount) as total_spend_for_subscription FROM user_subscription_logs WHERE user_id = $1 AND subscription_status_id != $2', $conditions);
	$spend_amount = $spend_amount + $data['total_spend_for_subscription'];
	$val_arr = array(
		$spend_amount,
		$user_id
	);
	$result = pg_execute_query("UPDATE users SET total_spend = $1 WHERE id = $2", $val_arr);
}
function _updateCouponCount($coupon_id)
{
	$coupon_used_count = r_query("select count(id) as coupon_used_count from course_users WHERE coupon_id = " . $coupon_id);
	$updateData = array();
	$updateData[] = $coupon_used_count['coupon_used_count'];
	$updateData[] = $coupon_id;
	$sql_query = "UPDATE coupons SET coupon_user_count = ($1) WHERE id = $2";
	$result = pg_execute_query($sql_query, $updateData);
}
function _mailToInstrutorForNewBooking($course_user_id)
{
	$courseUserCondition = array(
		$course_user_id
	);
	$course_user_name = r_query("SELECT ler.displayname as learner_name, tea.email as teacher_email, tea.displayname as teacher_name, courses.user_id as teacher_id, courses.title as course_title FROM users ler JOIN course_users ON ler.id = course_users.user_id JOIN courses ON course_users.course_id =  courses.id JOIN users tea ON courses.user_id = tea.id WHERE course_users.id = $1", $courseUserCondition);
	if(!empty($course_user_name['teacher_id'])){
		$emailFindReplace['##OTHER_USERNAME##'] = $course_user_name['learner_name'];
		$emailFindReplace['##USERNAME##'] = $course_user_name['teacher_name'];
		$emailFindReplace['##COURSE_NAME##'] = $course_user_name['course_title'];
		$emailFindReplace['to'] = $course_user_name['teacher_email'];
		$emailFindReplace['mail'] = 'Course Booking';
		r_mail($emailFindReplace);
	}
	
}
function _updateIsTeacher($user_id) {
	$course_count = r_query("SELECT count(id) FROM courses WHERE user_id = " . $user_id);
	if(!empty($course_count['count'])) {
		pg_execute_query("UPDATE users SET is_teacher = 1 WHERE  id = $1", array($user_id));
	} else {
		pg_execute_query("UPDATE users SET is_teacher = 0 WHERE  id = $1", array($user_id));
	}
}