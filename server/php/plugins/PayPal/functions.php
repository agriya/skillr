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
require_once $app_path . 'plugins' . DIRECTORY_SEPARATOR . 'PayPal' . DIRECTORY_SEPARATOR . 'libs' . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'paypal' . DIRECTORY_SEPARATOR . 'adaptivepayments-sdk-php' . DIRECTORY_SEPARATOR . 'PPBootStrap.php';
require_once $app_path . 'libs' . DIRECTORY_SEPARATOR . 'Inflector.php';
use PayPal\Service\AdaptivePaymentsService;
use PayPal\Types\AP\PayRequest;
use PayPal\Types\AP\Receiver;
use PayPal\Types\AP\ReceiverList;
use PayPal\Types\Common\RequestEnvelope;
function makePayPalRequestForPayment($course_id, $user_id, $currencycode)
{
    $inflector = new Inflector();
    $conditions = array(
        $course_id,
        $user_id
    );
    $course_user_data = r_query("SELECT id FROM course_users WHERE course_id = $1 and user_id = $2", $conditions);
    if (empty($course_user_data)) {
        $course_user_post['course_id'] = $course_id;
        $course_user_post['user_id'] = $user_id;
        $course_user_post['course_user_status_id'] = ConstCourseUserStatuses::PaymentPending;
        $course_user_post['payment_gateway_id'] = ConstPaymentGateways::PayPal;
        $result = pg_execute_insert('course_users', $course_user_post);
        $course_user_data['id'] = $result['id'];
    }
    $conditions = array(
        $course_id
    );
    $course_data = r_query("SELECT id, price, title FROM courses WHERE id = $1", $conditions);
    if (!empty($course_data)) {
        $amount = $course_data['price'];
    }
    $paypal_data = pg_query_cache('SELECT * FROM settings WHERE setting_category_id = 12 ORDER BY display_order');
    if (!empty($paypal_data)) {
        foreach ($paypal_data as $value) {
            if ($value['name'] == 'paypal.api_username') {
                $paypal_settings_data['paypal.api_username'] = $value['value'];
            }
            if ($value['name'] == 'paypal.api_password') {
                $paypal_settings_data['paypal.api_password'] = $value['value'];
            }
            if ($value['name'] == 'paypal.api_signature') {
                $paypal_settings_data['paypal.api_signature'] = $value['value'];
            }
            if ($value['name'] == 'paypal.api_id') {
                $paypal_settings_data['paypal.api_id'] = $value['value'];
            }
            if ($value['name'] == 'paypal.api_account_email') {
                $paypal_settings_data['paypal.api_account_email'] = $value['value'];
            }
            if ($value['name'] == 'paypal.is_live_mode') {
                $paypal_settings_data['paypal.is_live_mode'] = $value['value'];
            }
        }
    }
    $config = array(
        // Signature Credential
        'acct1.UserName' => !empty($paypal_settings_data['paypal.api_username']) ? $paypal_settings_data['paypal.api_username'] : '',
        'acct1.Password' => !empty($paypal_settings_data['paypal.api_password']) ? $paypal_settings_data['paypal.api_password'] : '',
        'acct1.Signature' => !empty($paypal_settings_data['paypal.api_signature']) ? $paypal_settings_data['paypal.api_signature'] : '',
        'acct1.AppId' => !empty($paypal_settings_data['paypal.api_id']) ? $paypal_settings_data['paypal.api_id'] : '',
        'mode' => !empty($paypal_settings_data['paypal.is_live_mode']) ? 'live' : 'sandbox',
    );
    $receivers[0] = new Receiver();
    $receivers[0]->email = $paypal_settings_data['paypal.api_account_email'];
    $receivers[0]->amount = $amount;
    $receivers[0]->paymentType = 'PERSONAL';
    $receivers[0]->primary = '';
    $receiverList = new ReceiverList($receivers);
    $returnUrl = getSiteUri() . '/#!/course/' . $course_data['id'] . '/' . $inflector->slug($course_data['title'], '-') . '?error_code=0';
    $cancelUrl = getSiteUri() . '/#!/course/' . $course_data['id'] . '/' . $inflector->slug($course_data['title'], '-') . '?error_code=512';
    $payRequest = new PayRequest(new RequestEnvelope("en_US") , "PAY", $cancelUrl, $currencycode, $receiverList, $returnUrl);
    $hash = md5(ACE_SECRET_KEY . $course_user_data['id'] . SITE_NAME);
    $payRequest->ipnNotificationUrl = getSiteUri() . '/ipn/paypal_process_ipn/' . $course_user_data['id'] . '/hash/' . $hash;
    //$payRequest->ipnNotificationUrl = 'http://sudopaydemo.dev.agriya.com/ipn_test.php';
    $payRequest->memo = "Payment for course " . $course_data['title'];
    $payRequest->feesPayer = 'SENDER';
    $service = new AdaptivePaymentsService($config);
    $response = $service->Pay($payRequest);
    $ack = strtoupper($response->responseEnvelope->ack);
    if ($ack == "SUCCESS") {
        $payKey = $response->payKey;
        $data = array(
            $payKey,
            $course_user_data['id']
        );
        pg_execute_query("UPDATE course_users SET paypal_pay_key = $1 WHERE id = $2", $data);
        if (1) {
            $PAYPAL_REDIRECT_URL = 'https://sandbox.paypal.com/cgi-bin/webscr';
        } else {
            $PAYPAL_REDIRECT_URL = 'https://www.paypal.com/cgi-bin/webscr';
        }
        $payPalURL = $PAYPAL_REDIRECT_URL . '?cmd=_ap-payment&paykey=' . $payKey;
        $response = array(
            'error' => array(
                'code' => - 4
            ) ,
            'gateway_callback_url' => $payPalURL
        );
    } else {
        $response = array(
            'error' => array(
                'code' => 1,
                'message' => 'Payment couldn\'t process.'
            )
        );
    }
    return $response;
}
function makePayPalRequestForSubscriptionPayment($subscription_id, $user_id, $currencycode, $r_post)
{
    $conditions = array(
        $subscription_id
    );
    $subscription_data = r_query("SELECT * FROM subscriptions WHERE id = $1", $conditions);
    $paypal_data = pg_query_cache("SELECT name, value FROM settings WHERE name = 'paypal.api_account_email' OR name = 'paypal.is_live_mode'");
    if (!empty($paypal_data)) {
        foreach ($paypal_data as $value) {
            if ($value['name'] == 'paypal.api_account_email') {
                $paypal_settings_data['paypal.api_account_email'] = $value['value'];
            }
            if ($value['name'] == 'paypal.is_live_mode') {
                $paypal_settings_data['paypal.is_live_mode'] = $value['value'];
            }
        }
    }
    $user_subscriptions_post['user_id'] = $user_id;
    $user_subscriptions_post['subscription_id'] = $subscription_id;
    $user_subscriptions_post['subscription_status_id'] = ConstSubscriptionStatuses::Initiated;
    $user_subscriptions_post['payment_gateway_id'] = ConstPaymentGateways::PayPal;
    $user_subscriptions_result = pg_execute_insert('user_subscriptions', $user_subscriptions_post);
    $paypal_settings_data['cancel_url'] = getSiteUri() . '/#!/me/subscriptions?error_code=512';
    $paypal_settings_data['success_url'] = getSiteUri() . '/#!/me/subscriptions?error_code=0&subscription_id=' . $subscription_id;
    $hash = md5(ACE_SECRET_KEY . $user_subscriptions_result['id'] . SITE_NAME);
    $paypal_settings_data['notify_url'] = getSiteUri() . '/ipn/paypal_process_ipn/user_subscriptions/' . $user_subscriptions_result['id'] . '/hash/' . $hash;
    //error_log($paypal_settings_data['notify_url'], 3, APP_PATH . DIRECTORY_SEPARATOR . 'tmp' . DIRECTORY_SEPARATOR . 'logs' . DIRECTORY_SEPARATOR . 'error.log');
    //$paypal_settings_data['notify_url'] = 'http://sudopaydemo.dev.agriya.com/ipn_test.php';
    if (!empty($paypal_settings_data['paypal.is_live_mode'])) {
        $paypal_url = 'https://www.paypal.com/cgi-bin/webscr';
    } else {
        $paypal_url = 'https://www.sandbox.paypal.com/cgi-bin/webscr';
    }
    $form_data = "<form id=\"js-gateway-autosubmit-form\" action = \"" . $paypal_url . "\" method = \"post\">" . "<input type=\"hidden\" name=\"cmd\" value=\"_xclick-subscriptions\">" . "<input type = \"hidden\" name = \"business\" value = \"" . $paypal_settings_data['paypal.api_account_email'] . "\">" . "<input type = \"hidden\" name = \"item_name\" value = \"" . $subscription_data['name'] . "\">" . "<input type=\"hidden\" name=\"no_note\" value=\"1\">" . "<input type=\"hidden\" name=\"src\" value=\"1\">" . "<input type=\"hidden\" name=\"a3\" value=\"" . $subscription_data['price'] . "\">" . "<input type=\"hidden\" name=\"p3\" value=\"" . $subscription_data['interval_period'] . "\">" . "<input type=\"hidden\" name=\"t3\" value=\"" . strtoupper(substr($subscription_data['interval_unit'], 0, 1)) . "\">" . "<input type=\"hidden\" name=\"currency_code\" value=\"" . $currencycode . "\">" . "<input type =\"hidden\" name = \"cancel_url\" value = \"" . $paypal_settings_data['cancel_url'] . "\">" . "<input type = \"hidden\" name = \"return\" value = \"" . $paypal_settings_data['success_url'] . "\">" . "<input type =\"hidden\" name = \"notify_url\" value = \"" . $paypal_settings_data['notify_url'] . "\">" . "<script>var elementForm = document.getElementById('js-gateway-autosubmit-form');if (typeof(elementForm) != 'undefined' && elementForm != null){elementForm.submit();}</script><script>https_flag = true;</script>";
    $response = array(
        'error' => array(
            'code' => 0,
        ) ,
        'form_data' => $form_data
    );
    return $response;
}
function makePayPalSubscriptionCancelRequest($paypal_subscription_id)
{
    $settings = pg_query_cache("SELECT * FROM settings WHERE setting_category_id = 12 ORDER BY display_order");
    $gateway_settings_options = array();
    if (!empty($settings)) {
        foreach ($settings as $value) {
            $paypal_settings_data[$value['name']] = $value['value'];
        }
    }
    $req = array(
        // Signature Credential
        'USER' => !empty($paypal_settings_data['paypal.api_username']) ? $paypal_settings_data['paypal.api_username'] : '',
        'PWD' => !empty($paypal_settings_data['paypal.api_password']) ? $paypal_settings_data['paypal.api_password'] : '',
        'SIGNATURE' => !empty($paypal_settings_data['paypal.api_signature']) ? $paypal_settings_data['paypal.api_signature'] : '',
        'VERSION' => '76.0',
        'METHOD' => 'ManageRecurringPaymentsProfileStatus',
        'PROFILEID' => urlencode($paypal_subscription_id) ,
        'ACTION' => 'Cancel',
        'NOTE' => 'User cancelled on subscription',
    );
    // Swap these if you're testing with the sandbox
    if (!empty($paypal_settings_data['paypal.is_live_mode'])) {
        $PayPalURL = 'https://api-3t.paypal.com/nvp';
    } else {
        $PayPalURL = 'https://api-3t.sandbox.paypal.com/nvp';
    }
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $PayPalURL);
    curl_setopt($ch, CURLOPT_VERBOSE, 1);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($req));
    $result = curl_exec($ch);
    //error_log(print_r($result, true), 3, APP_PATH . DIRECTORY_SEPARATOR . 'tmp' . DIRECTORY_SEPARATOR . 'logs' . DIRECTORY_SEPARATOR . 'error.log');
    parse_str($result, $parsed_response);
    if (curl_errno($ch)) {
        $response['error']['code'] = 1;
        $response['error']['message'] = curl_error($ch);
    } else if (!empty($parsed_response) && strtolower($parsed_response['ACK']) == 'success') {
        $response['error']['code'] = 0;
        $response['error']['message'] = "Success";
    } else if (!empty($parsed_response) && strtolower($parsed_response['ACK']) == 'failure') {
        $response['error']['code'] = 1;
        $response['error']['message'] = $parsed_response['L_LONGMESSAGE0'];
    } else {
        $response['error']['code'] = 1;
        $response['error']['message'] = 'Unknown';
    }
    curl_close($ch);
    return $response;
}
