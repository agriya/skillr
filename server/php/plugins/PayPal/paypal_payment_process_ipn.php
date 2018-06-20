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
require_once $app_path . 'plugins' . DIRECTORY_SEPARATOR . 'PayPal' . DIRECTORY_SEPARATOR . 'libs' . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'paypal' . DIRECTORY_SEPARATOR . 'adaptivepayments-sdk-php' . DIRECTORY_SEPARATOR . 'PPBootStrap.php';
use PayPal\Service\AdaptivePaymentsService;
use PayPal\Types\AP\PaymentDetailsRequest;
use PayPal\Types\Common\RequestEnvelope;
require_once $app_path . 'config.inc.php';
require_once $app_path . 'constants.php';
require_once $app_path . 'libs' . DIRECTORY_SEPARATOR . 'core.php';
// Storing IPN logs
$ipn_data['post_variable'] = serialize($_POST);
$ipn_data['ip_id'] = r_saveIp();
$ipn_data['ip_id'] = (!empty($ipn_data['ip_id'])) ? $ipn_data['ip_id'] : NULL;
if(!empty($_GET['course_user_id'])) {
	$ipn_data['course_user_id'] = $_GET['course_user_id'];
}
$result = pg_execute_insert('ipn_logs', $ipn_data);
// Getting PayPal credentials
$settings = pg_query_cache("SELECT * FROM settings WHERE setting_category_id = 12 OR name = 'revenue.commission_percentage' ORDER BY display_order");

$gateway_settings_options = array();
if (!empty($settings)) {
	foreach ($settings as $value) {
		$paypal_settings_data[$value['name']] = $value['value'];
	}
}

// Setup PayPal configs
$config = array(
    'acct1.UserName' => !empty($paypal_settings_data['paypal.api_username']) ? $paypal_settings_data['paypal.api_username'] : '',
    'acct1.Password' => !empty($paypal_settings_data['paypal.api_password']) ? $paypal_settings_data['paypal.api_password'] : '',
    'acct1.Signature' => !empty($paypal_settings_data['paypal.api_signature']) ? $paypal_settings_data['paypal.api_signature'] : '',
    'acct1.AppId' => !empty($paypal_settings_data['paypal.api_id']) ? $paypal_settings_data['paypal.api_id'] : '',
    'mode' => !empty($paypal_settings_data['paypal.is_live_mode']) ? 'live' : 'sandbox',
);
// Ref: php\plugins\PayPal\libs\vendor\paypal\adaptivepayments-sdk-php\samples\PaymentDetailsReceipt.php
$requestEnvelope = new RequestEnvelope("en_US");
$paymentDetailsReq = new PaymentDetailsRequest($requestEnvelope);
$paymentDetailsReq->payKey = $_POST['pay_key']; // Assign PayKey from PayPal POST
$service = new AdaptivePaymentsService($config);
try {
    /* wrap API method calls on the service object with a try catch */
    $response = $service->PaymentDetails($paymentDetailsReq);
}
catch(Exception $ex) {
}
$conditions = array(
    $_GET['course_user_id'],
);
$course_user = r_query("SELECT id, user_id, course_id, course_user_status_id, paypal_pay_key FROM course_users WHERE id = $1 LIMIT 1", $conditions);
// For normal, paypal set they POST IPN with payment_status variable; But we check, and received in 'status' variable; So poth of the condition added;
// Also for sample adaptive response: http://stackoverflow.com/questions/23503080/paypal-adaptive-payments-and-ipn#answer-23503369
if (!empty($course_user) && !empty($course_user['paypal_pay_key']) && $course_user['paypal_pay_key'] == $_POST['pay_key'] && !empty($response) && (strtolower($response->status) == 'completed' || strtolower($response->payment_status) == 'completed')) {
    $hash = $_GET['hash'];
    if (!empty($_GET['course_user_id'])) {
        if ($hash == md5(ACE_SECRET_KEY . $_GET['course_user_id'] . SITE_NAME)) {
            if (!empty($course_user['course_user_status_id']) == ConstCourseUserStatuses::PaymentPending) {
                $site_commission_percentage = 0;
                $amount = 0;
                $user_id = '';
                $teacher_user_id = '';
                $available_balance = 0;
                if (!empty($paypal_settings_data['revenue.commission_percentage'])) {
                    $site_commission_percentage = $paypal_settings_data['revenue.commission_percentage'];
                }
                $conditions = array(
                    $course_user['course_id']
                );
                $userData = r_query("SELECT u.id, u.available_balance, c.price, c.user_id as teacher_user_id FROM courses c left join users u ON u.id = c.user_id WHERE c.id = $1", $conditions);
                if (!empty($userData)) {
                    $amount = $userData['price'];
                    $site_fee = $amount * ($site_commission_percentage / 100);
                    $user_id = $userData['id'];
                    $teacher_user_id = $userData['teacher_user_id'];
                    $available_balance = ($userData['available_balance']) + ($amount - $site_fee);
                }
                $course_user_put['id'] = $course_user['id'];
                $course_user_put['course_user_status_id'] = ConstCourseUserStatuses::NotStarted;
                $course_user_put['booked_date'] = date('Y-m-d H:i:s');
                $course_user_put['price'] = $amount;
                $course_user_put['site_commission_amount'] = $site_fee;
                $result = pg_execute_update('course_users', $course_user_put);
                _updateRevenue($course_user['course_id'], $course_user['user_id']);
				_mailToInstrutorForNewBooking($course_user['id']);				
                if (!empty($userData)) {
                    $user_put['id'] = $user_id;
                    $user_put['available_balance'] = $available_balance;
                    $result = pg_execute_update('users', $user_put);
                }
                $transactions_post['user_id'] = $course_user['user_id'];
                $transactions_post['transaction_type_id'] = 1;
                $transactions_post['site_commission_amount'] = $site_fee;
                $transactions_post['classname'] = 'course_users';
                $transactions_post['amount'] = $amount;
                $transactions_post['foreign_id'] = $course_user['id'];
                $transactions_post['teacher_user_id'] = $teacher_user_id;
                $result = pg_execute_insert('transactions', $transactions_post);
            }
        }
    }
}
