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
$app_path = dirname(dirname(dirname(__FILE__))) . DIRECTORY_SEPARATOR;
require_once $app_path . 'config.inc.php';
require_once $app_path . 'constants.php';
require_once $app_path . 'libs' . DIRECTORY_SEPARATOR . 'core.php';

$sudopay_ipn_data['post_variable'] = serialize($_POST);
$sudopay_ipn_data['ip_id'] = r_saveIp();
$sudopay_ipn_data['ip_id'] = (!empty($sudopay_ipn_data['ip_id'])) ? $sudopay_ipn_data['ip_id'] : NULL;
if(!empty($_GET['course_user_id'])) {
	$sudopay_ipn_data['course_user_id'] = $_GET['course_user_id'];
}
if(!empty($_GET['user_subscription_logs_id'])) {
	$sudopay_ipn_data['user_subscription_log_id'] = $_GET['user_subscription_logs_id'];
}
$result = pg_execute_insert('ipn_logs', $sudopay_ipn_data);
$hash = $_GET['hash'];
if (!empty($_GET['course_user_id'])) {
    if ($hash == md5(ACE_SECRET_KEY . $_GET['course_user_id'] . SITE_NAME)) {
        $conditions = array(
            $_GET['course_user_id'],
            ConstCourseUserStatuses::PaymentPending
        );
        $course_user_data = r_query("SELECT id,user_id,course_id FROM course_users WHERE id = $1 AND course_user_status_id =  $2", $conditions);
        if (!empty($course_user_data)) {
            if ($_POST['status'] == 'Captured') {
				$site_commission_percentage = 0;
				$amount = 0;
				$user_id = '';
				$teacher_user_id = '';
				$available_balance = 0;
				$conditions = array(
					'site.currency_code',
					'revenue.commission_percentage'
				);
				$settings_data = pg_query_cache("SELECT value FROM settings WHERE name in ($1, $2) order by id", $conditions);
				if (!empty($settings_data)) {
					$site_commission_percentage = $settings_data['0']['value'];
				}	
				$gateways = array();
				$conditions = array(
					$course_user_data['course_id']
				);
				$userData = r_query("SELECT u.id, u.available_balance, c.price, c.user_id as teacher_user_id FROM courses c left join users u ON u.id = c.user_id WHERE c.id = $1", $conditions);
				if (!empty($userData)) {
					$amount = $userData['price'];
					$site_fee = $amount * ($site_commission_percentage / 100);
					$user_id = $userData['id'];
					$teacher_user_id = $userData['teacher_user_id'];
					$available_balance = ($userData['available_balance']) + ($amount - $site_fee);
				}
				
				$course_user_put['id'] = $course_user_data['id'];
                if (!empty($response['paykey'])) {
                    $course_user_put['paykey'] = $response['paykey'];
                }
                $course_user_put['course_user_status_id'] = ConstCourseUserStatuses::NotStarted;
                $course_user_put['booked_date'] = date('Y-m-d H:i:s');
				$course_user_put['price'] = $amount;
				$course_user_put['site_commission_amount'] = $site_fee;
                $result = pg_execute_update('course_users', $course_user_put);
				_updateRevenue($course_user_data['course_id'], $course_user_data['user_id']);
                _mailToInstrutorForNewBooking($_GET['course_user_id']);
				$pluginCondtions = array(
					'site.enabled_plugins'
				);
				// Checking Payout enabled condition; If disabled this, no need to execute sudopay_payment_gateways_users queries; 
				$enabledPlugins = pg_query_cache("SELECT value FROM settings WHERE name = $1 order by display_order", $pluginCondtions);
				if (!empty($enabledPlugins[0]['value']) && strpos($enabledPlugins[0]['value'], 'Payout') !== false) {
					$gateways_list = pg_query_cache("SELECT sg.sudopay_payment_gateway_id FROM courses c inner join sudopay_payment_gateways_users sg on sg.user_id = c.user_id WHERE c.id = $1", $conditions);
					foreach($gateways_list as $gateway) {
						$gateways[] = $gateway['sudopay_payment_gateway_id'];
					}
				}
				if (empty($gateways) || !in_array($_POST['gateway_id'], $gateways)) {
					if(!empty($userData)) {
						$user_put['id'] = $user_id;
						$user_put['available_balance'] = $available_balance;
						$result = pg_execute_update('users', $user_put);
					}
				}
				$transactions_post['user_id'] = $course_user_data['user_id'];
                $transactions_post['transaction_type_id'] = 1;
				$transactions_post['site_commission_amount'] = $site_fee;
                $transactions_post['classname'] = 'course_users';
                $transactions_post['amount'] = $amount;
                $transactions_post['foreign_id'] = $course_user_data['id'];
				$transactions_post['teacher_user_id'] = $teacher_user_id;
                $result = pg_execute_insert('transactions', $transactions_post);
            }
        }
    }
} else if(!empty($_GET['user_subscription_logs_id'])) {
	require_once APP_PATH . DIRECTORY_SEPARATOR . 'server' . DIRECTORY_SEPARATOR . 'php' . DIRECTORY_SEPARATOR . 'plugins' . DIRECTORY_SEPARATOR . 'Subscriptions' . DIRECTORY_SEPARATOR . 'functions.php';
	$get = $_GET;
	$post = $_POST;
	processSudoPaySubscriptionIPN($get, $post);
}